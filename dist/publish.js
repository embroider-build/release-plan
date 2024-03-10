import execa from 'execa';
import { loadSolution } from './plan.js';
import { Octokit } from '@octokit/rest';
import latestVersion from 'latest-version';
import { dirname } from 'path';
import PackageJson from '@npmcli/package-json';
import parseGithubUrl from 'parse-github-repo-url';
import fsExtra from 'fs-extra';
const { existsSync } = fsExtra;
async function hasCleanRepo() {
    const result = await execa('git', ['status', '--porcelain=v1']);
    return result.stdout.length === 0;
}
function tagFor(pkgName, entry) {
    return `v${entry.newVersion}-${pkgName}`;
}
function info(message) {
    process.stdout.write(`\n ℹ️ ${message}`);
}
function success(message) {
    process.stdout.write(`\n 🎉 ${message} 🎉\n`);
}
export class IssueReporter {
    hadIssues = false;
    reportFailure(message) {
        this.hadIssues = true;
        process.stderr.write(message);
    }
}
async function doesTagExist(tag) {
    const { stdout } = await execa('git', [
        'ls-remote',
        '--tags',
        'origin',
        '-l',
        tag,
    ]);
    return stdout.trim() !== '';
}
async function makeTags(solution, reporter, options) {
    for (const [pkgName, entry] of solution) {
        if (!entry.impact) {
            continue;
        }
        try {
            const tag = tagFor(pkgName, entry);
            const cwd = dirname(entry.pkgJSONPath);
            const preExisting = await doesTagExist(tag);
            if (preExisting) {
                info(`The tag, ${tag}, has already been pushed up for ${pkgName}`);
                return;
            }
            if (options.dryRun) {
                info(`--dryRun active. Skipping \`git tag ${tag}\``);
                continue;
            }
            await execa('git', ['tag', tag], {
                cwd,
                stderr: 'inherit',
                stdout: 'inherit',
            });
        }
        catch (err) {
            console.error(err);
            reporter.reportFailure(`Failed to create tag for ${pkgName}`);
        }
    }
}
async function pushTags(reporter, options) {
    if (options.dryRun) {
        info(`--dryRun active. Skipping \`git push --tags\``);
        return;
    }
    try {
        await execa('git', ['push', '--tags']);
    }
    catch (err) {
        reporter.reportFailure(`Failed to git push`);
    }
}
function chooseRepresentativeTag(solution) {
    for (const [pkgName, entry] of solution) {
        if (entry.impact) {
            return tagFor(pkgName, entry);
        }
    }
    process.stderr.write('Found no releasable packages in the plan');
    process.exit(-1);
}
async function getRepo() {
    const pkgJson = await PackageJson.load('./');
    const normalisedJson = await pkgJson.normalize({
        steps: ['fixRepositoryField'],
    });
    if (!normalisedJson.content.repository) {
        throw new Error('This package does not have a repository defined');
    }
    const parsed = parseGithubUrl(normalisedJson.content.repository.url);
    if (!parsed) {
        throw new Error('This package does not have a valid repository');
    }
    const [user, repo] = parsed;
    return { owner: user, repo };
}
async function doesReleaseExist(octokit, tagName, reporter) {
    try {
        const { owner, repo } = await getRepo();
        const response = await octokit.repos.getReleaseByTag({
            owner,
            repo,
            tag: tagName,
        });
        return response.status === 200;
    }
    catch (err) {
        if (err.status === 404) {
            return false;
        }
        console.error(err.message);
        reporter.reportFailure(`Problem while checking for existing GitHub release`);
    }
}
async function createGithubRelease(octokit, description, tagName, reporter, options) {
    try {
        const preExisting = await doesReleaseExist(octokit, tagName, reporter);
        if (preExisting) {
            info(`A release with the name '${tagName}' already exists`);
            return;
        }
        if (options.dryRun) {
            info(`--dryRun active. Skipping creating a Release on GitHub for ${tagName}`);
            return;
        }
        const { owner, repo } = await getRepo();
        await octokit.repos.createRelease({
            owner,
            repo,
            tag_name: tagName,
            body: description,
        });
    }
    catch (err) {
        console.error(err);
        reporter.reportFailure(`Problem while creating GitHub release`);
    }
}
async function doesVersionExist(pkgName, version, reporter) {
    try {
        const latest = await latestVersion(pkgName, { version });
        return Boolean(latest);
    }
    catch (err) {
        if (err.name === 'VersionNotFoundError' ||
            err.name === 'PackageNotFoundError') {
            return false;
        }
        console.error(err.message);
        reporter.reportFailure(`Problem while checking for existing npm release`);
    }
}
/**
 * Call npm publish or pnpm publish on each of the packages in a plan
 *
 * @returns Promise<T> return value only used for testing
 */
export async function npmPublish(solution, reporter, options, packageManager) {
    const args = ['publish', '--access=public'];
    if (options.otp) {
        args.push(`--otp=${options.otp}`);
    }
    if (options.publishBranch) {
        args.push(`--publish-branch=${options.publishBranch}`);
    }
    if (options.tag) {
        args.push(`--tag=${options.tag}`);
    }
    const released = new Map();
    for (const [pkgName, entry] of solution) {
        if (!entry.impact) {
            continue;
        }
        const preExisting = await doesVersionExist(pkgName, entry.newVersion, reporter);
        if (preExisting) {
            info(`${pkgName} has already been publish @ version ${entry.newVersion}`);
            continue;
        }
        if (options.dryRun) {
            info(`--dryRun active. Skipping \`${packageManager} publish --access=public${options.otp ? ' --otp=*redacted*' : ''}\` for ${pkgName}, which would publish version ${entry.newVersion}`);
            released.set(pkgName, entry.newVersion);
            continue;
        }
        try {
            await execa(packageManager, args, {
                cwd: dirname(entry.pkgJSONPath),
                stderr: 'inherit',
                stdout: 'inherit',
            });
        }
        catch (err) {
            reporter.reportFailure(`Failed to ${packageManager} publish ${pkgName} - Error: ${err.message}`);
        }
    }
    return {
        args,
        released,
    };
}
function packageManager() {
    if (existsSync('./pnpm-lock.yaml')) {
        return 'pnpm';
    }
    return 'npm';
}
export async function publish(opts) {
    if (!opts.skipRepoSafetyCheck) {
        if (!(await hasCleanRepo())) {
            process.stderr.write(`You have uncommitted changes.
To publish a release you should start from a clean repo. Run "npx release-plan prepare", then commit the changes, then come back and run "npx release-plan publish.
`);
            process.exit(-1);
        }
    }
    const { solution, description } = loadSolution();
    if (!process.env.GITHUB_AUTH) {
        process.stderr.write(`\nYou need to set GITHUB_AUTH.`);
        process.exit(-1);
    }
    const octokit = new Octokit({ auth: process.env.GITHUB_AUTH });
    const representativeTag = chooseRepresentativeTag(solution);
    // from this point forward we don't stop if something goes wrong, we just keep
    // track of whether anything went wrong so we can use the right exit code at
    // the end.
    const reporter = new IssueReporter();
    await makeTags(solution, reporter, opts);
    await npmPublish(solution, reporter, opts, packageManager());
    await pushTags(reporter, opts);
    await createGithubRelease(octokit, description, representativeTag, reporter, opts);
    if (reporter.hadIssues) {
        process.stderr.write(`\nSome parts of the release were unsuccessful.\n`);
        process.exit(-1);
    }
    else {
        if (opts.dryRun) {
            success(`--dryRun active. Would have successfully published release!`);
            return;
        }
        success(`Successfully published release`);
    }
}
//# sourceMappingURL=publish.js.map