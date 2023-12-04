import glob from 'globby';
import { resolve, relative } from 'path';
import fsExtra from 'fs-extra';
import yaml from 'js-yaml';
import execa from 'execa';

const { readFileSync, readJSONSync, existsSync } = fsExtra;
export type Range = `workspace:${string}`;

export interface PkgEntry {
  version: string;
  pkgJSONPath: string;
  isDependencyOf: Map<string, Range>;
  isPeerDependencyOf: Map<string, Range>;
}

export function publishedInterPackageDeps(): Map<string, PkgEntry> {
  const rootDir = './';
  const packages: Map<string, PkgEntry> = new Map();

  function loadPackage(packagePath: string) {
    const pkg = readJSONSync(packagePath);
    if (pkg.private) {
      return;
    }
    pkgJSONS.set(pkg.name, pkg);
    packages.set(pkg.name, {
      version: pkg.version,
      pkgJSONPath: `./${relative('.', packagePath)}`,
      isDependencyOf: new Map(),
      isPeerDependencyOf: new Map(),
    });
  }

  const pkgJSONS: Map<string, any> = new Map();

  if (!existsSync('./pnpm-workspace.yaml')) {
    const result = execa.sync('npm', ['query', '.workspace']);
    const resultParsed = JSON.parse(result.stdout);
    const locations = resultParsed.map((i: any) => i.location);

    for (const location of locations) {
      loadPackage(resolve(location, 'package.json'));
    }

    loadPackage('./package.json');
  } else {
    for (const pattern of (
      yaml.load(readFileSync('./pnpm-workspace.yaml', 'utf8')) as any
    ).packages) {
      for (const dir of glob.sync(pattern, {
        cwd: rootDir,
        expandDirectories: false,
        onlyDirectories: true,
      })) {
        loadPackage(resolve(rootDir, dir, 'package.json'));
      }
    }
  }

  for (const [consumerName, consumerPkgJSON] of pkgJSONS) {
    // no devDeps because changes to devDeps shouldn't ever force us to
    // release
    for (const section of ['dependencies', 'peerDependencies'] as const) {
      if (consumerPkgJSON[section]) {
        for (const [depName, depRange] of Object.entries(
          consumerPkgJSON[section] as Record<string, string>,
        )) {
          if (depRange.startsWith('workspace:')) {
            const dependency = packages.get(depName);
            if (!dependency) {
              throw new Error(
                `broken "workspace:" reference to ${depName} in ${consumerName}`,
              );
            }
            const field =
              section === 'dependencies'
                ? ('isDependencyOf' as const)
                : ('isPeerDependencyOf' as const);
            dependency[field].set(consumerName, depRange as Range);
          }
        }
      }
    }
  }
  return packages;
}
