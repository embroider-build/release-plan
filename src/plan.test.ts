import { describe, it, expect, afterEach, beforeEach } from 'vitest';

import { planVersionBumps } from './plan.js';

import { Project } from 'fixturify-project';

describe('plan', function () {
  let project;
  let realCwd;

  beforeEach(async () => {
    project = new Project('test-package', '1.2.3', {});
    await project.write();
    realCwd = process.cwd();
    process.chdir(project.baseDir);
  });

  afterEach(() => {
    process.chdir(realCwd);
  });

  it('can make a basic plan', function () {
    const solution = planVersionBumps({
      sections: [
        {
          packages: ['test-package'],
          impact: 'minor',
          heading: 'enhancement',
        },
      ],
    });

    expect(solution).to.deep.equal(
      new Map([
        [
          'test-package',
          {
            constraints: [
              {
                impact: 'minor',
                reason: 'Appears in changelog section enhancement',
              },
            ],
            impact: 'minor',
            newVersion: '1.3.0',
            oldVersion: '1.2.3',
            pkgJSONPath: './package.json',
          },
        ],
      ]),
    );
  });

  it('ignores unknown packages', () => {
    const solution = planVersionBumps({
      sections: [
        {
          packages: ['face-not-exist'],
          impact: 'major',
          heading: 'enhancement',
        },
      ],
    });

    expect(solution).to.deep.equal(
      new Map([
        [
          'test-package',
          {
            impact: undefined,
            oldVersion: '1.2.3',
          },
        ],
      ]),
    );
  });

  it('reads package.json config correctly for semver config', async () => {
    project.pkg['release-plan'] = {
      semverIncrementAs: {
        minor: 'major',
      },
    };

    await project.write();

    const solution = planVersionBumps({
      sections: [
        {
          packages: ['test-package'],
          impact: 'minor',
          heading: 'enhancement',
        },
      ],
    });

    expect(solution).to.deep.equal(
      new Map([
        [
          'test-package',
          {
            constraints: [
              {
                impact: 'minor',
                reason: 'Appears in changelog section enhancement',
              },
            ],
            impact: 'minor',
            newVersion: '2.0.0',
            oldVersion: '1.2.3',
            pkgJSONPath: './package.json',
          },
        ],
      ]),
    );
  });

  it('allows you to define semver tag', async () => {
    project.pkg['release-plan'] = {
      semverIncrementAs: {
        major: 'premajor',
      },
      semverIncrementTag: 'alpha',
    };

    await project.write();

    const solution = planVersionBumps({
      sections: [
        {
          packages: ['test-package'],
          impact: 'major',
          heading: 'breaking',
        },
      ],
    });

    expect(solution).to.deep.equal(
      new Map([
        [
          'test-package',
          {
            constraints: [
              {
                impact: 'major',
                reason: 'Appears in changelog section breaking',
              },
            ],
            impact: 'major',
            newVersion: '2.0.0-alpha.0',
            oldVersion: '1.2.3',
            pkgJSONPath: './package.json',
          },
        ],
      ]),
    );
  });
});
