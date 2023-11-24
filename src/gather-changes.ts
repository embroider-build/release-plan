import execa from 'execa';
import {resolve} from 'path';
import { dirname } from 'path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export async function gatherChanges() {
  const lernaChangelogPath = require.resolve('@ef4/lerna-changelog');
  
  let result = await execa('node', [resolve(dirname(lernaChangelogPath), 'bin', 'cli.js'), '--next-version', 'Release']);
  return result.stdout;
}
