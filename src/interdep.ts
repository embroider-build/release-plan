import { resolve, relative, join } from 'path';
import fsExtra from 'fs-extra';
import execa from 'execa';

const { readJSONSync, existsSync } = fsExtra;
export type Range = `workspace:${string}`;

export interface PkgEntry {
  version: string;
  pkgJSONPath: string;
  isDependencyOf: Map<string, Range>;
  isPeerDependencyOf: Map<string, Range>;
  pkg: any;
}

export function getPackages(rootDir: string): Map<string, PkgEntry> {
  const packages: Map<string, PkgEntry> = new Map();

  function loadPackage(packagePath: string) {
    const pkg = readJSONSync(packagePath);
    if (pkg.private) {
      return;
    }

    packages.set(pkg.name, {
      version: pkg.version,
      pkgJSONPath: `./${relative('.', packagePath)}`,
      isDependencyOf: new Map(),
      isPeerDependencyOf: new Map(),
      pkg,
    });
  }

  if (!existsSync(join(rootDir, './pnpm-workspace.yaml'))) {
    const result = execa.sync('npm', ['query', '.workspace'], { cwd: rootDir });
    const resultParsed = JSON.parse(result.stdout);
    const locations = resultParsed.map((i: any) => i.location);

    for (const location of locations) {
      loadPackage(resolve(location, 'package.json'));
    }

    loadPackage(join(rootDir, './package.json'));
  } else {
    const result = execa.sync(`pnpm`, ['m', 'ls', '--json', '--depth=-1'], {
      cwd: rootDir,
    });
    const workspaceJson = JSON.parse(result.stdout);

    workspaceJson
      .filter((item: any) => item.name && item.path)
      .forEach((item: any) => loadPackage(join(item.path, 'package.json')));
  }
  return packages;
}

export function publishedInterPackageDeps(): Map<string, PkgEntry> {
  const packages = getPackages('./');

  for (const [consumerName, packageDefinition] of packages) {
    const consumerPkgJSON = packageDefinition.pkg;
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
