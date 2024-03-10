import type { Impact, ParsedChangelog } from './change-parser.js';
export type Solution = Map<string, {
    impact: undefined;
    oldVersion: string;
} | {
    impact: Impact;
    oldVersion: string;
    newVersion: string;
    constraints: {
        impact: Impact;
        reason: string;
    }[];
    pkgJSONPath: string;
}>;
export declare function explain(solution: Solution): string;
export declare function planVersionBumps(changed: ParsedChangelog, singlePackage?: string): Solution;
export declare function saveSolution(solution: Solution, description: string): void;
export declare function loadSolution(): {
    solution: Solution;
    description: string;
};
