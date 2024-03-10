import { describe, it, expect } from 'vitest';

import { parseChangeLog } from './change-parser.js';

describe('parseChangeLog', () => {
  it('groups changes by sections', () => {
    const changelog = `## Release (2024-03-10)

#### :boom: Breaking Change
* \`ember-repl\`
  * [#1674](https://github.com/NullVoxPopuli/limber/pull/1674) Refactor the compilation library to prepare for broader usage ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### :rocket: Enhancement
* \`ember-repl\`
  * [#1687](https://github.com/NullVoxPopuli/limber/pull/1687) Allow passing rehype plugins to the markdown renderer in ember-repl ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
`;
    const result = parseChangeLog(changelog, new Set(['ember-repl']));

    expect(result).toMatchInlineSnapshot(`
      {
        "sections": [
          {
            "heading": ":boom: Breaking Change",
            "impact": "major",
            "packages": [
              "ember-repl",
            ],
          },
          {
            "heading": ":rocket: Enhancement",
            "impact": "minor",
            "packages": [
              "ember-repl",
            ],
          },
        ],
      }
    `);
  });

  it('ignores committers', () => {
    const changelog = `## Release (2024-03-10)

#### :boom: Breaking Change
* \`ember-repl\`
  * [#1674](https://github.com/NullVoxPopuli/limber/pull/1674) Refactor the compilation library to prepare for broader usage ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### Committers: 3
- Michal Bryxí ([@MichalBryxi](https://github.com/MichalBryxi))
- [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [@johanrd](https://github.com/johanrd)
`;
    const result = parseChangeLog(changelog, new Set(['ember-repl']));

    expect(result).toMatchInlineSnapshot(`
      {
        "sections": [
          {
            "heading": ":boom: Breaking Change",
            "impact": "major",
            "packages": [
              "ember-repl",
            ],
          },
        ],
      }
    `);
  });

  it('does not blow up on empty changelog', () => {
    const changelog = '';
    const result = parseChangeLog(changelog, new Set(['ember-repl']));

    expect(result).toMatchInlineSnapshot(`
    {
        "sections": [],
      }
    `);
  });

  it('ignores unlabeled PRs if they come from ignored packages', () => {
    const changelog = `
#### :present: Additional updates
* \`tutorial\`
  * [#1618](https://github.com/NullVoxPopuli/limber/pull/1618) Add note about trying out Polaris ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
  * [#1680](https://github.com/NullVoxPopuli/limber/pull/1680) feat: Arg Components ([@MichalBryxi](https://github.com/MichalBryxi))
* \`limber\`
  * [#1642](https://github.com/NullVoxPopuli/limber/pull/1642) Fix for #1641: Alternative 1) Remove \`z-10\` from resize-handle ([@johanrd](https://github.com/johanrd))
* Other
  * [#1667](https://github.com/NullVoxPopuli/limber/pull/1667) Update pnpm to v8.15.3 ([@renovate[bot]](https://github.com/apps/renovate))
`;
    const result = parseChangeLog(changelog, new Set(['ember-repl']));

    expect(result).toMatchInlineSnapshot(`
      {
        "sections": [],
      }
    `);
  });

  it('ignores packages on labeled PRs if those packages are ignored', () => {
    const changelog = `## Release (2024-03-10)

#### :boom: Breaking Change
* \`ember-repl\`, \`ember-repl-test-app\`
  * [#1674](https://github.com/NullVoxPopuli/limber/pull/1674) Refactor the compilation library to prepare for broader usage ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### :rocket: Enhancement
* \`ember-repl\`, \`ember-repl-test-app\`
  * [#1687](https://github.com/NullVoxPopuli/limber/pull/1687) Allow passing rehype plugins to the markdown renderer in ember-repl ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
`;
    const result = parseChangeLog(changelog, new Set(['ember-repl']));

    expect(result).toMatchInlineSnapshot(`
      {
        "sections": [
          {
            "heading": ":boom: Breaking Change",
            "impact": "major",
            "packages": [
              "ember-repl",
            ],
          },
          {
            "heading": ":rocket: Enhancement",
            "impact": "minor",
            "packages": [
              "ember-repl",
            ],
          },
        ],
      }
    `);
  });
});
