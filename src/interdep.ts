import glob from 'globby';
import { resolve, join, dirname } from 'path';
import fsExtra from 'fs-extra';
import yaml from 'js-yaml';

const { readFileSync, readJSONSync, existsSync } = fsExtra;
export type Range = `workspace:${string}`;

export interface PkgEntry {
  version: string;
  pkgJSONPath: string;
  isDependencyOf: Map<string, Range>;
  isPeerDependencyOf: Map<string, Range>;
}

export function publishedInterPackageDeps(): Map<string, PkgEntry> {
  let rootDir = './';
  let packages: Map<string, PkgEntry> = new Map();

  function loadPackage(dir: string) {
    let pkg = readJSONSync(join(dir, 'package.json'));
      if (pkg.private) {
        return;
      }
      pkgJSONS.set(pkg.name, pkg);
      packages.set(pkg.name, {
        version: pkg.version,
        pkgJSONPath: join(dir, 'package.json'),
        isDependencyOf: new Map(),
        isPeerDependencyOf: new Map(),
      });
  }

  let pkgJSONS: Map<string, any> = new Map();

  if(!existsSync('./pnpm-workspace.yaml')) {
    loadPackage('./');
  } else {
    for (let pattern of (yaml.load(readFileSync('./pnpm-workspace.yaml', 'utf8')) as any)
      .packages) {
      for (let dir of glob.sync(pattern, { cwd: rootDir, expandDirectories: false, onlyDirectories: true })) {
        loadPackage(dirname(resolve(rootDir, dir, 'package.json')))
      }
    }
  }

  for (let [consumerName, consumerPkgJSON] of pkgJSONS) {
    // no devDeps because changes to devDeps shouldn't ever force us to
    // release
    for (let section of ['dependencies', 'peerDependencies'] as const) {
      if (consumerPkgJSON[section]) {
        for (let [depName, depRange] of Object.entries(consumerPkgJSON[section] as Record<string, string>)) {
          if (depRange.startsWith('workspace:')) {
            let dependency = packages.get(depName);
            if (!dependency) {
              throw new Error(`broken "workspace:" reference to ${depName} in ${consumerName}`);
            }
            let field = section === 'dependencies' ? ('isDependencyOf' as const) : ('isPeerDependencyOf' as const);
            dependency[field].set(consumerName, depRange as Range);
          }
        }
      }
    }
  }
  return packages;
}
