import { parseChangeLogOrExit } from './change-parser.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { planVersionBumps, saveSolution } from './plan.js';
import fsExtra from 'fs-extra';
import { getPublishablePackageNames } from './interdep.js';
const { readJSONSync, writeJSONSync } = fsExtra;
const changelogPreamblePattern = /#.*Changelog.*$/i;
export function updateChangelog(newChangelogContent, solution) {
    const targetChangelogFile = './CHANGELOG.md';
    const oldChangelogContent = readFileSync(targetChangelogFile, 'utf8').split('\n');
    if (!changelogPreamblePattern.test(oldChangelogContent[0])) {
        process.stderr.write(`Cannot parse existing changelog. Expected it to match:\n${changelogPreamblePattern}\n`);
        process.exit(-1);
    }
    const [firstNewLine, ...restNewLines] = newChangelogContent
        .trim()
        .split('\n');
    const newOutput = firstNewLine +
        '\n\n' +
        versionSummary(solution) +
        '\n' +
        restNewLines.join('\n') +
        '\n';
    writeFileSync(targetChangelogFile, oldChangelogContent[0] +
        '\n\n' +
        newOutput +
        oldChangelogContent.slice(1).join('\n'));
    return newOutput;
}
function versionSummary(solution) {
    const result = [];
    for (const [pkgName, entry] of solution) {
        if (entry.impact) {
            result.push(`${pkgName} ${entry.newVersion} (${entry.impact})`);
        }
    }
    return result.join('\n');
}
function updateVersions(solution) {
    for (const entry of solution.values()) {
        if (entry.impact) {
            const pkg = readJSONSync(entry.pkgJSONPath);
            pkg.version = entry.newVersion;
            writeJSONSync(entry.pkgJSONPath, pkg, { spaces: 2 });
        }
    }
}
export async function prepare(newChangelogContent, singlePackage) {
    const publishableNames = getPublishablePackageNames('./');
    const changes = parseChangeLogOrExit(newChangelogContent, publishableNames);
    const solution = planVersionBumps(changes, singlePackage);
    updateVersions(solution);
    const description = updateChangelog(newChangelogContent, solution);
    saveSolution(solution, description);
    return solution;
}
//# sourceMappingURL=prepare.js.map