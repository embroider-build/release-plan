import { describe, it, expect } from 'vitest';
import { getPackages } from './interdep.js';

describe('interdep', function () {
  describe('getPackages', function () {
    it('can load a simple pnpm package', function () {
      const answer = getPackages('./');

      expect(Array(...answer.keys())).toMatchInlineSnapshot(`
        [
          "release-plan",
        ]
      `);

      expect(answer.get('release-plan')).toMatchInlineSnapshot(
        {
          pkg: expect.any(Object),
          version: expect.any(String),
        },
        `
        {
          "isDependencyOf": Map {},
          "isPeerDependencyOf": Map {},
          "pkg": Any<Object>,
          "pkgJSONPath": "./package.json",
          "version": Any<String>,
        }
      `,
      );
    });

    it('can load a complex pnpm package', function () {
      const answer = getPackages('./fixtures/pnpm/star-package');

      expect(Array(...answer.keys())).toMatchInlineSnapshot(`
        [
          "star-package",
        ]
      `);

      expect(answer.get('star-package')).toMatchInlineSnapshot(
        {
          pkg: expect.any(Object),
          version: expect.any(String),
        },
        `
        {
          "isDependencyOf": Map {},
          "isPeerDependencyOf": Map {},
          "pkg": Any<Object>,
          "pkgJSONPath": "./fixtures/pnpm/star-package/package.json",
          "version": Any<String>,
        }
      `,
      );
    });
  });
});
