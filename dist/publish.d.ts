import type { Solution } from './plan.js';
type PublishOptions = {
    skipRepoSafetyCheck?: boolean;
    dryRun?: boolean;
    otp?: string;
    publishBranch?: string;
    tag?: string;
};
export declare class IssueReporter {
    hadIssues: boolean;
    reportFailure(message: string): void;
}
/**
 * Call npm publish or pnpm publish on each of the packages in a plan
 *
 * @returns Promise<T> return value only used for testing
 */
export declare function npmPublish(solution: Solution, reporter: IssueReporter, options: PublishOptions, packageManager: string): Promise<{
    args: string[];
    released: Map<string, string>;
}>;
export declare function publish(opts: PublishOptions): Promise<void>;
export {};
