import { parseChangeLogOrExit } from './change-parser.js';
import { readFileSync, writeFileSync } from 'fs';
import type { Solution } from './plan.js';
import { planVersionBumps, saveSolution } from './plan.js';
import fsExtra from 'fs-extra';

const { readJSONSync, writeJSONSync } = fsExtra;

const changelogPreamblePattern = /#.*Changelog.*$/;

function updateChangelog(newChangelogContent: string, solution: Solution): string {
  let targetChangelogFile = './CHANGELOG.md';
  let oldChangelogContent = readFileSync(targetChangelogFile, 'utf8').split('\n');

  if (!changelogPreamblePattern.test(oldChangelogContent[0])) {
    process.stderr.write(`Cannot parse existing changelog. Expected it to match:\n${changelogPreamblePattern}\n`);
    process.exit(-1);
  }

  let [firstNewLine, ...restNewLines] = newChangelogContent.trim().split('\n');

  let newOutput = firstNewLine + '\n\n' + versionSummary(solution) + '\n' + restNewLines.join('\n') + '\n';
  writeFileSync(targetChangelogFile, oldChangelogContent[0] + '\n' + newOutput + oldChangelogContent.slice(1));
  return newOutput;
}

function versionSummary(solution: Solution): string {
  let result: string[] = [];
  for (let [pkgName, entry] of solution) {
    if (entry.impact) {
      result.push(`${pkgName} ${entry.newVersion} (${entry.impact})`);
    }
  }
  return result.join('\n');
}

function updateVersions(solution: Solution) {
  for (let entry of solution.values()) {
    if (entry.impact) {
      let pkg = readJSONSync(entry.pkgJSONPath);
      pkg.version = entry.newVersion;
      writeJSONSync(entry.pkgJSONPath, pkg, { spaces: 2 });
    }
  }
}

export async function prepare(newChangelogContent: string) {
  let changes = parseChangeLogOrExit(newChangelogContent);
  let solution = planVersionBumps(changes);
  updateVersions(solution);
  let description = updateChangelog(newChangelogContent, solution);
  saveSolution(solution, description);
  return solution;
}
