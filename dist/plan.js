import { publishedInterPackageDeps } from './interdep.js';
import { assertNever } from 'assert-never';
import semver from 'semver';
import { highlightMarkdown } from './highlight.js';
import chalk from 'chalk';
import { resolve } from 'path';
import fsExtra from 'fs-extra';
const { inc, satisfies } = semver;
const { existsSync, readJSONSync, writeJSONSync } = fsExtra;
class Plan {
    #constraints;
    #pkgs;
    constructor() {
        this.#pkgs = publishedInterPackageDeps();
        // initialize constraints for every published package
        const constraints = new Map();
        for (const pkg of this.#pkgs.keys()) {
            constraints.set(pkg, []);
        }
        this.#constraints = constraints;
    }
    addConstraint(packageName, impact, reason) {
        const pkgConstraints = this.#constraints.get(packageName);
        if (!pkgConstraints) {
            console.warn(chalk.yellow(`Warning: unknown package "${packageName}"`));
            return;
        }
        if (!pkgConstraints.some((existing) => existing.impact === impact && existing.reason === reason)) {
            pkgConstraints.push({ impact, reason });
            this.#propagate(packageName, impact);
        }
    }
    solve() {
        const solution = new Map();
        for (const [pkgName, entry] of this.#pkgs) {
            const constraints = this.#constraints.get(pkgName);
            const impact = this.#sumImpact(constraints);
            if (!impact) {
                solution.set(pkgName, { impact: undefined, oldVersion: entry.version });
            }
            else {
                const newVersion = inc(entry.version, impact);
                solution.set(pkgName, {
                    impact,
                    oldVersion: entry.version,
                    newVersion,
                    constraints,
                    pkgJSONPath: entry.pkgJSONPath,
                });
            }
        }
        return solution;
    }
    #expandWorkspaceRange(range, availableVersion) {
        // this implements PNPM's rules for how workspace: protocol dependencies get
        // expanded into proper semver ranges.
        switch (range) {
            case 'workspace:*':
                return availableVersion;
            case 'workspace:~':
                return `~${availableVersion}`;
            case 'workspace:^':
                return `^${availableVersion}`;
            default:
                return range.slice(10);
        }
    }
    #propagate(packageName, impact) {
        const entry = this.#pkgs.get(packageName);
        const minNewVersion = inc(entry.version, impact);
        for (const [consumerName, workspaceRange] of entry.isDependencyOf) {
            this.#propagateDep(packageName, minNewVersion, 'dependencies', consumerName, workspaceRange);
        }
        for (const [consumerName, workspaceRange] of entry.isPeerDependencyOf) {
            this.#propagateDep(packageName, minNewVersion, 'peerDependencies', consumerName, workspaceRange);
        }
    }
    #propagateDep(packageName, minNewVersion, section, consumerName, workspaceRange) {
        const entry = this.#pkgs.get(packageName);
        const oldRange = this.#expandWorkspaceRange(workspaceRange, entry.version);
        if (!satisfies(minNewVersion, oldRange)) {
            switch (section) {
                case 'dependencies':
                    this.addConstraint(consumerName, 'patch', `Has dependency ${'`'}${workspaceRange}${'`'} on ${packageName}`);
                    break;
                case 'peerDependencies':
                    this.addConstraint(consumerName, 'major', `Has peer dependency ${'`'}${workspaceRange}${'`'} on ${packageName}`);
                    break;
                default:
                    throw assertNever(section);
            }
        }
    }
    #sumImpact(impacts) {
        if (impacts.some((i) => i.impact === 'major')) {
            return 'major';
        }
        if (impacts.some((i) => i.impact === 'minor')) {
            return 'minor';
        }
        if (impacts.some((i) => i.impact === 'patch')) {
            return 'patch';
        }
    }
}
function impactLabel(impact, text) {
    switch (impact) {
        case undefined:
            return chalk.gray(text);
        case 'patch':
            return chalk.blueBright(text);
        case 'minor':
            return chalk.greenBright(text);
        case 'major':
            return chalk.redBright(text);
    }
}
function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}
export function explain(solution) {
    const output = [];
    for (const priority of ['major', 'minor', 'patch']) {
        if ([...solution].some((entry) => entry[1].impact === priority)) {
            output.push(impactLabel(priority, capitalize(priority)));
            output.push('');
            for (const [pkgName, entry] of solution) {
                if (entry.impact === priority) {
                    output.push(`  ${impactLabel(entry.impact, pkgName)} from ${entry.oldVersion} to ${entry.newVersion}`);
                    for (const constraint of entry.constraints) {
                        if (constraint.impact === entry.impact) {
                            output.push(`   - ${constraint.reason}`);
                        }
                    }
                }
            }
            output.push('');
        }
    }
    if ([...solution].some((entry) => entry[1].impact === undefined)) {
        output.push(impactLabel(undefined, 'Unreleased'));
        output.push('');
        for (const [pkgName, entry] of solution) {
            if (entry.impact === undefined) {
                output.push(`## ${pkgName}`);
                output.push(`  ${impactLabel(entry.impact, pkgName)} unchanged`);
            }
        }
        output.push('');
    }
    return output.join('\n');
}
export function planVersionBumps(changed, singlePackage) {
    const plan = new Plan();
    for (const section of changed.sections) {
        if ('unlabeled' in section) {
            process.stderr.write(highlightMarkdown(`# Unlabeled Changes\n\n${section.summaryText}\n\n*Cannot plan release until the above changes are labeled*.\n`));
            process.exit(-1);
        }
        if (singlePackage) {
            plan.addConstraint(singlePackage, section.impact, `Appears in changelog section ${section.heading}`);
        }
        else {
            for (const pkg of section.packages) {
                plan.addConstraint(pkg, section.impact, `Appears in changelog section ${section.heading}`);
            }
        }
    }
    return plan.solve();
}
function solutionFile() {
    return resolve('./.release-plan.json');
}
export function saveSolution(solution, description) {
    writeJSONSync(solutionFile(), { solution: Object.fromEntries(solution), description }, { spaces: 2 });
}
export function loadSolution() {
    try {
        if (!existsSync(solutionFile())) {
            const err = new Error(`No such file ${solutionFile()}`);
            err.code = 'ENOENT';
            throw err;
        }
        const json = readJSONSync(solutionFile());
        return {
            solution: new Map(Object.entries(json.solution)),
            description: json.description,
        };
    }
    catch (err) {
        process.stderr.write(`Unable to load release plan file. You must run "embroider-release prepare" first to create the file.\n`);
        if (err.code !== 'ENOENT') {
            console.error(err);
        }
        process.exit(-1);
    }
}
//# sourceMappingURL=plan.js.map