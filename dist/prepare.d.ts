import type { Solution } from './plan.js';
export declare function updateChangelog(newChangelogContent: string, solution: Solution): string;
export declare function prepare(newChangelogContent: string, singlePackage?: string): Promise<Solution>;
