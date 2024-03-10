export type Range = `workspace:${string}`;
export interface PkgEntry {
    version: string;
    pkgJSONPath: string;
    isDependencyOf: Map<string, Range>;
    isPeerDependencyOf: Map<string, Range>;
    pkg: any;
}
export declare function getPublishablePackageNames(rootDir: string): Set<string>;
export declare function getPackages(rootDir: string): Map<string, PkgEntry>;
export declare function publishedInterPackageDeps(): Map<string, PkgEntry>;
