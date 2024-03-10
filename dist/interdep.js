import { relative, join } from 'path';
import fsExtra from 'fs-extra';
import { getPackagesSync } from '@manypkg/get-packages';
const { readJSONSync } = fsExtra;
export function getPublishablePackageNames(rootDir) {
    const packages = getPackages(rootDir);
    const publishableNames = new Set(packages.keys());
    return publishableNames;
}
export function getPackages(rootDir) {
    const packages = new Map();
    function loadPackage(packagePath) {
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
    const { packages: workspaces, rootPackage } = getPackagesSync(rootDir);
    workspaces.forEach((item) => loadPackage(join(item.dir, 'package.json')));
    if (rootPackage?.dir) {
        loadPackage(join(rootPackage.dir, 'package.json'));
    }
    return packages;
}
export function publishedInterPackageDeps() {
    const packages = getPackages('./');
    for (const [consumerName, packageDefinition] of packages) {
        const consumerPkgJSON = packageDefinition.pkg;
        // no devDeps because changes to devDeps shouldn't ever force us to
        // release
        for (const section of ['dependencies', 'peerDependencies']) {
            if (consumerPkgJSON[section]) {
                for (const [depName, depRange] of Object.entries(consumerPkgJSON[section])) {
                    if (depRange.startsWith('workspace:')) {
                        const dependency = packages.get(depName);
                        if (!dependency) {
                            throw new Error(`broken "workspace:" reference to ${depName} in ${consumerName}`);
                        }
                        const field = section === 'dependencies'
                            ? 'isDependencyOf'
                            : 'isPeerDependencyOf';
                        dependency[field].set(consumerName, depRange);
                    }
                }
            }
        }
    }
    return packages;
}
//# sourceMappingURL=interdep.js.map