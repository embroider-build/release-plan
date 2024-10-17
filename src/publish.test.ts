import { describe, it, expect, vi } from 'vitest';
import { npmPublish, IssueReporter } from './publish.js';
import { Solution } from './plan.js';

// we aren't currently using this so we can just ignore for now
const reporter = new IssueReporter();

describe('publish', function () {
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

    it('warns that a version exists if we are trying to release', async function () {
      const consoleSpy = vi.spyOn(process.stdout, 'write');

      const publishResult = await npmPublish(
        new Map([
          [
            'release-plan',
            { oldVersion: '0.8.1', newVersion: '0.9.0', impact: 'minor' },
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
  });
});
