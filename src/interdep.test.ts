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

    describe('pnpm/fixtures/single-package', function () {
      it('can load the workspaces', function () {
        const answer = getPackages('./fixtures/pnpm/single-package');

        expect(Array(...answer.keys())).toMatchInlineSnapshot(`
        [
          "foo-package",
        ]
      `);

        expect(answer.get('foo-package')).toMatchInlineSnapshot(
          {
            pkg: expect.any(Object),
            version: expect.any(String),
          },
          `
          {
            "isDependencyOf": Map {},
            "isPeerDependencyOf": Map {},
            "pkg": Any<Object>,
            "pkgJSONPath": "./fixtures/pnpm/single-package/package.json",
            "version": Any<String>,
          }
        `,
        );
      });
    });

    describe('pnpm/fixtures/multi-lockfile', function () {
      it('can load the workspaces', function () {
        const answer = getPackages('./fixtures/pnpm/multi-lockfile');

        expect(Array(...answer.keys())).toMatchInlineSnapshot(`
          [
            "a",
            "b",
            "c",
          ]
        `);

        expect(answer.get('a')).toMatchInlineSnapshot(
          {
            pkg: expect.any(Object),
            version: expect.any(String),
          },
          `
          {
            "isDependencyOf": Map {},
            "isPeerDependencyOf": Map {},
            "pkg": Any<Object>,
            "pkgJSONPath": "./fixtures/pnpm/multi-lockfile/packages/a/package.json",
            "version": Any<String>,
          }
        `,
        );
        expect(answer.get('b')).toMatchInlineSnapshot(
          {
            pkg: expect.any(Object),
            version: expect.any(String),
          },
          `
          {
            "isDependencyOf": Map {},
            "isPeerDependencyOf": Map {},
            "pkg": Any<Object>,
            "pkgJSONPath": "./fixtures/pnpm/multi-lockfile/packages/b/package.json",
            "version": Any<String>,
          }
        `,
        );
        expect(answer.get('c')).toMatchInlineSnapshot(
          {
            pkg: expect.any(Object),
            version: expect.any(String),
          },
          `
          {
            "isDependencyOf": Map {},
            "isPeerDependencyOf": Map {},
            "pkg": Any<Object>,
            "pkgJSONPath": "./fixtures/pnpm/multi-lockfile/packages/c/package.json",
            "version": Any<String>,
          }
        `,
        );
      });
    });
  });
});
