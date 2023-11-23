import execa from 'execa';
import type { Solution } from './plan.js';
import { loadSolution } from './plan.js';
import { Octokit } from '@octokit/rest';
import latestVersion from 'latest-version';
import { dirname } from 'path';
import PackageJson from '@npmcli/package-json';
import parseGithubUrl from 'parse-github-repo-url';

async function hasCleanRepo(): Promise<boolean> {
  let result = await execa('git', ['status', '--porcelain=v1']);
  return result.stdout.length === 0;
}

function tagFor(pkgName: string, entry: { newVersion: string }): string {
  return `v${entry.newVersion}-${pkgName.replace(/^@embroider\//, '')}`;
}

function info(message: string) {
  process.stdout.write(`\n ℹ️ ${message}`);
}

function success(message: string) {
  process.stdout.write(`\n 🎉 ${message} 🎉\n`);
}

class IssueReporter {
  hadIssues = false;
  reportFailure(message: string): void {
    this.hadIssues = true;
    process.stderr.write(message);
  }
}

async function doesTagExist(tag: string) {
  let { stdout } = await execa('git', ['ls-remote', '--tags', 'origin', '-l', tag]);

  return stdout.trim() !== '';
}

async function makeTags(solution: Solution, reporter: IssueReporter, dryRun: boolean): Promise<void> {
  for (let [pkgName, entry] of solution) {
    if (!entry.impact) {
      continue;
    }
    try {
      let tag = tagFor(pkgName, entry);
      let cwd = dirname(entry.pkgJSONPath);

      let preExisting = await doesTagExist(tag);

      if (preExisting) {
        info(`The tag, ${tag}, has already been pushed up for ${pkgName}`);
        return;
      }

      if (dryRun) {
        info(`--dryRun active. Skipping \`git tag ${tag}\``);
        continue;
      }

      await execa('git', ['tag', tag], {
        cwd,
        stderr: 'inherit',
        stdout: 'inherit',
      });
    } catch (err) {
      console.error(err);
      reporter.reportFailure(`Failed to create tag for ${pkgName}`);
    }
  }
}

async function pushTags(reporter: IssueReporter, dryRun: boolean) {
  if (dryRun) {
    info(`--dryRun active. Skipping \`git push --tags\``);
    return;
  }

  try {
    await execa('git', ['push', '--tags']);
  } catch (err) {
    reporter.reportFailure(`Failed to git push`);
  }
}

function chooseRepresentativeTag(solution: Solution): string {
  for (let [pkgName, entry] of solution) {
    if (entry.impact) {
      return tagFor(pkgName, entry);
    }
  }
  process.stderr.write('Found no releaseable packages in the plan');
  process.exit(-1);
}

async function getRepo(): Promise<{owner: string, repo:string}> {
  const pkgJson = await PackageJson.load('./');
  const normalisedJson = await pkgJson.normalize({
    steps: ['fixRepositoryField'],
  });

  if(!normalisedJson.content.repository) {
    throw new Error('This package does not have a repository defined');
  }

  const parsed = parseGithubUrl((normalisedJson.content.repository as {url: string}).url);

  if (!parsed) {
    throw new Error("This package does not have a valid repository");
  }

  const [user, repo] = parsed;
  return { owner: user, repo };
}

async function doesReleaseExist(octokit: Octokit, tagName: string, reporter: IssueReporter) {
  try {
    const { owner, repo } = await getRepo();
    let response = await octokit.repos.getReleaseByTag({
      owner,
      repo,
      tag: tagName,
    });

    return response.status === 200;
  } catch (err) {
    if (err.status === 404) {
      return false;
    }
    console.error(err.message);
    reporter.reportFailure(`Problem while checking for existing GitHub release`);
  }
}

async function createGithubRelease(
  octokit: Octokit,
  description: string,
  tagName: string,
  reporter: IssueReporter,
  dryRun: boolean
): Promise<void> {
  try {
    let preExisting = await doesReleaseExist(octokit, tagName, reporter);

    if (preExisting) {
      info(`A release with the name '${tagName}' already exists`);
      return;
    }

    if (dryRun) {
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
  } catch (err) {
    console.error(err);
    reporter.reportFailure(`Problem while creating GitHub release`);
  }
}

async function doesVersionExist(pkgName: string, version: string, reporter: IssueReporter) {
  try {
    let latest = await latestVersion(pkgName, { version });
    return Boolean(latest);
  } catch (err) {
    if (err.name === 'VersionNotFoundError' || err.name === 'PackageNotFoundError') {
      return false;
    }

    console.error(err.message);
    reporter.reportFailure(`Problem while checking for existing npm release`);
  }
}

async function pnpmPublish(solution: Solution, reporter: IssueReporter, dryRun: boolean, otp?: string): Promise<void> {
  for (let [pkgName, entry] of solution) {
    if (!entry.impact) {
      continue;
    }

    let preExisting = await doesVersionExist(pkgName, entry.newVersion, reporter);

    if (preExisting) {
      info(`${pkgName} has already been publish @ version ${entry.newVersion}`);
      return;
    }

    if (dryRun) {
      info(
        `--dryRun active. Skipping \`pnpm publish --access=public${
          otp ? ' --otp=*redacted*' : ''
        }\` for ${pkgName}, which would publish version ${entry.newVersion}`
      );
      continue;
    }

    try {
      const args = ['publish', '--access=public'];

      if (otp) {
        args.push(`--otp=${otp}`);
      }

      await execa('pnpm', ['publish', '--access=public'], {
        cwd: entry.pkgJSONPath,
        stderr: 'inherit',
        stdout: 'inherit',
      });
    } catch (err) {
      reporter.reportFailure(`Failed to pnpm publish ${pkgName}`);
    }
  }
}

export async function publish(opts: { skipRepoSafetyCheck?: boolean; dryRun?: boolean; otp?: string }) {
  let dryRun = opts.dryRun ?? false;

  if (!opts.skipRepoSafetyCheck) {
    if (!(await hasCleanRepo())) {
      process.stderr.write(`You have uncommitted changes.
To publish a release you should start from a clean repo. Run "embroider-release prepare", then commit the changes, then come back and run "embroider-release publish.
`);
      process.exit(-1);
    }
  }

  let { solution, description } = loadSolution();

  if (!process.env.GITHUB_AUTH) {
    process.stderr.write(`\nYou need to set GITHUB_AUTH.`);
    process.exit(-1);
  }

  let octokit = new Octokit({ auth: process.env.GITHUB_AUTH });

  let representativeTag = chooseRepresentativeTag(solution);

  // from this point forward we don't stop if something goes wrong, we just keep
  // track of whether anything went wrong so we can use the right exit code at
  // the end.
  let reporter = new IssueReporter();

  await makeTags(solution, reporter, dryRun);
  await pnpmPublish(solution, reporter, dryRun, opts.otp);
  await pushTags(reporter, dryRun);
  await createGithubRelease(octokit, description, representativeTag, reporter, dryRun);

  if (reporter.hadIssues) {
    process.stderr.write(`\nSome parts of the release were unsuccessful.\n`);
    process.exit(-1);
  } else {
    if (dryRun) {
      success(`--dryRun active. Would have successfully published release!`);
      return;
    }

    success(`Successfully published release`);
  }
}
