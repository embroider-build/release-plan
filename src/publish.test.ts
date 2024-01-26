import { describe, it, expect } from 'vitest';
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
            "--access=public",
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
            "--access=public",
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
            "--access=public",
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
            "--access=public",
            "--tag=best-tag",
          ],
          "released": Map {},
        }
      `);
    });
  });
});
