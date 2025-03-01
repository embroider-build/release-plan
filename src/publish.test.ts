import { describe, it, expect, vi } from 'vitest';
import {
  npmPublish,
  publish,
  createGithubRelease,
  IssueReporter,
} from './publish.js';
import { Solution } from './plan.js';
import { getPackages } from './interdep.js';

// we aren't currently using this so we can just ignore for now
const reporter = new IssueReporter();

const octokit = vi.fn();
vi.mock('@octokit/rest', () => {
  return {
    Octokit: function (...args: any) {
      octokit(...args);
      return {
        repos: {
          getReleaseByTag() {
            const err = new Error() as any;
            err.status = 404;
            throw err;
          },
        },
      };
    },
  };
});

describe('publish', function () {
  it('publish support custom base api url', function () {
    process.env.GITHUB_API_URL = 'https://api.custombase.com';
    process.env.GITHUB_AUTH = 'auth';
    publish({
      skipRepoSafetyCheck: true,
      dryRun: true,
    });
    expect(octokit.mock.calls.length).toBe(1);
    expect(octokit.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "auth": "auth",
          "baseUrl": "https://api.custombase.com",
        },
      ]
    `);
  });

  it('publish support custom base domain', function () {
    vi.clearAllMocks();
    delete process.env.GITHUB_API_URL;
    process.env.GITHUB_DOMAIN = 'custombase.com';
    process.env.GITHUB_AUTH = 'auth';
    publish({
      skipRepoSafetyCheck: true,
      dryRun: true,
    });
    expect(octokit.mock.calls.length).toBe(1);
    expect(octokit.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "auth": "auth",
          "baseUrl": "https://api.custombase.com",
        },
      ]
    `);
  });

  describe('npmPublish', function () {
    it('adds the correct args with no options', async function () {
      const thingy = await npmPublish(
        new Map([['thingy', { oldVersion: '3' }]]) as Solution,
        reporter,
        {},
        'face',
      );

      expect(thingy).toMatchInlineSnapshot(`
        {
          "args": [
            "publish",
          ],
          "released": Map {},
        }
      `);
    });

    it('adds access if passed by options', async function () {
      const thingy = await npmPublish(
        new Map([['thingy', { oldVersion: '3' }]]) as Solution,
        reporter,
        { access: 'restricted' },
        'face',
      );

      expect(thingy).toMatchInlineSnapshot(`
        {
          "args": [
            "publish",
            "--access=restricted",
          ],
          "released": Map {},
        }
      `);
    });

    it('adds otp if passed by options', async function () {
      const thingy = await npmPublish(
        new Map([['thingy', { oldVersion: '3' }]]) as Solution,
        reporter,
        {
          otp: '12345',
        },
        'face',
      );

      expect(thingy).toMatchInlineSnapshot(`
        {
          "args": [
            "publish",
            "--otp=12345",
          ],
          "released": Map {},
        }
      `);
    });

    it('adds publish-branch if passed by options', async function () {
      const thingy = await npmPublish(
        new Map([['thingy', { oldVersion: '3' }]]) as Solution,
        reporter,
        {
          publishBranch: 'best-branch',
        },
        'face',
      );

      expect(thingy).toMatchInlineSnapshot(`
        {
          "args": [
            "publish",
            "--publish-branch=best-branch",
          ],
          "released": Map {},
        }
      `);
    });

    it('adds tag if passed by options', async function () {
      const thingy = await npmPublish(
        new Map([['thingy', { oldVersion: '3' }]]) as Solution,
        reporter,
        {
          tag: 'best-tag',
        },
        'face',
      );

      expect(thingy).toMatchInlineSnapshot(`
        {
          "args": [
            "publish",
            "--tag=best-tag",
          ],
          "released": Map {},
        }
      `);
    });

    it('adds dry-run if passed by options', async function () {
      const thingy = await npmPublish(
        new Map([['thingy', { oldVersion: '3' }]]) as Solution,
        reporter,
        {
          dryRun: true,
        },
        'face',
      );

      expect(thingy).toMatchInlineSnapshot(`
        {
          "args": [
            "publish",
            "--dry-run",
          ],
          "released": Map {},
        }
      `);
    });

    it('adds provenance if passed by options', async function () {
      const thingy = await npmPublish(
        new Map([['thingy', { oldVersion: '3' }]]) as Solution,
        reporter,
        {
          provenance: true,
        },
        'face',
      );

      expect(thingy).toMatchInlineSnapshot(`
        {
          "args": [
            "publish",
            "--provenance",
          ],
          "released": Map {},
        }
      `);
    });

    it('warns that a version exists if we are trying to release', async function () {
      const consoleSpy = vi.spyOn(process.stdout, 'write');

      const publishResult = await npmPublish(
        new Map([
          [
            'release-plan',
            {
              oldVersion: '0.8.1',
              newVersion: '0.9.0',
              impact: 'minor',
              pkgJSONPath: './package.json',
            },
          ],
        ]) as Solution,
        reporter,
        {
          tag: 'best-tag',
        },
        'face',
      );

      expect(consoleSpy.mock.lastCall?.[0]).toMatchInlineSnapshot(`
        "
         ℹ️ release-plan has already been published @ version 0.9.0. Skipping publish;"
      `);
      expect(publishResult).toMatchInlineSnapshot(`
        {
          "args": [
            "publish",
            "--tag=best-tag",
          ],
          "released": Map {},
        }
      `);
    });

    it('skips publishing if npmSkipPublish is specified in package.json', async function () {
      const consoleSpy = vi.spyOn(process.stdout, 'write');
      const packages = getPackages('./fixtures/pnpm/star-package');
      const publishResult = await npmPublish(
        new Map([
          [
            'do-not-publish',
            {
              oldVersion: '0.8.1',
              newVersion: '0.9.0',
              impact: 'minor',
              pkgJSONPath: packages.get('do-not-publish')?.pkgJSONPath,
            },
          ],
          [
            'star-package',
            {
              oldVersion: '0.8.1',
              newVersion: '0.9.0',
              impact: 'minor',
              pkgJSONPath: packages.get('star-package')?.pkgJSONPath,
            },
          ],
        ]) as Solution,
        reporter,
        {
          tag: 'best-tag',
          dryRun: true,
        },
        'face',
      );

      expect(consoleSpy.mock.lastCall?.[0]).toMatchInlineSnapshot(`
        "
         ℹ️ --dryRun active. Adding \`--dry-run\` flag to \`face publish\` for star-package, which would publish version 0.9.0
        "
      `);

      expect(publishResult).toMatchInlineSnapshot(`
        {
          "args": [
            "publish",
            "--tag=best-tag",
            "--dry-run",
          ],
          "released": Map {
            "star-package" => "0.9.0",
          },
        }
      `);
    });
  });

  describe('createGithubRelease', function () {
    it('calls octokit create Release with correct params', async function () {
      const octokit = {
        repos: {
          getReleaseByTag() {
            const err = new Error() as any;
            err.status = 404;
            throw err;
          },
          createRelease: vi.fn(),
        },
      };
      await createGithubRelease(
        octokit as any,
        'new release',
        'v1.0.0-release-plan',
        reporter,
        {},
      );
      expect(octokit.repos.createRelease.mock.calls.length).toBe(1);
      expect(octokit.repos.createRelease.mock.lastCall).toMatchInlineSnapshot(`
        [
          {
            "body": "new release",
            "name": "v1.0.0-release-plan",
            "owner": "embroider-build",
            "repo": "release-plan",
            "tag_name": "v1.0.0-release-plan",
          },
        ]
      `);
    });
  });
});
