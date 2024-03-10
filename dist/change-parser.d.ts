export type Impact = 'major' | 'minor' | 'patch';
export type UnlabeledSection = {
    unlabeled: true;
    summaryText: string;
};
export type LabeledSection = {
    packages: string[];
    impact: Impact;
    heading: string;
};
export type Section = LabeledSection | UnlabeledSection;
export interface ParsedChangelog {
    sections: Section[];
}
export declare function parseChangeLog(src: string, publishableNames: Set<string>): ParsedChangelog;
export declare function parseChangeLogOrExit(src: string, publishableNames: Set<string>): ParsedChangelog;
