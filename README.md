# release-plan

_The most contributor friendly and hands-off release tool there is_.

## Features

- ✨ No manual steps[^after-initial-setup]
  - release from _anywhere_[^release-anywhere]
- 🤖 Everything is automated via GH Action Workflows[^gh-by-default]
- 🔐 No need to give maintainers access to npm[^npm-config]
- 📦 PNPM and monorepo support _by default_
  - also supports non-pnpm repos
- 🚀 Release preview PR 
  - release via merge of the release preview PR
- 📝 Automatic changelog
  - changelog entries editable by editing PR titles

This allows folks with GH Maintainer access to preview and release to npm without actually needing to have any keys locally on their machine (or access to the npm package, which makes management of the repo separate from the npm package easy and encouraged).

[^gh-by-default]: While GitHub Actions is the default setup via [`create-release-plan-setup`][gh-create]
[^after-initial-setup]: after initial setup, which is already mostly automated.
[^npm-config]: The NPM token can be granular, and the package needs to have its "Publishing access" configured to either "Don't require two-factor authentication" or, "Require two-factor authentication or an automation or granular access token" (recommended). This can be configured under `https://www.npmjs.com/package/{package-name}/access`
[^release-anywhere]: You can release from bed, the mall, the porcelain, anywhere! No need for a computer! (assuming you have a smart phone)

[gh-create]: https://github.com/mansona/create-release-plan-setup


## Usage & Installation

### Automated

Use [`create-release-plan-setup`][gh-create], see the [README][gh-create] over there for detailed instructions.

If you already have a local `GITHUB_AUTH` token, 
```bash
npx create-release-plan-setup@latest 
```
does all the setup for you (aside from repo-configuration ([see here][gh-create]))

<details><summary>how to get a GITHUB_AUTH token</summary>

You can create a [GitHub personal access token here](https://github.com/settings/tokens/new?scopes=repo&description=GITHUB_AUTH+env+variable)

Or, if you use the [`gh` CLI](https://cli.github.com/), you can temporarily expose a token to your local terminal shell via:
```bash
export GITHUB_AUTH=$(gh auth token);
```

</details>

This command will create 
```
.github/workflows/
  - plan-release.yml
  - publish.yml
RELEASE.md
```

which is responsible for automating the process that you'd run through manually below.

### Manual

```
npm i --save-dev release-plan
```

To use `release-plan` you need to have a valid `GITHUB_AUTH` environment variable that has the `repo` permission. This allows `release-plan` to check what PRs have been merged since the last release and plan the release accordingly. 

1. Run `npx release-plan explain-plan`. If there are unlabeled PRs that need to be released it will complain and show you a list of them. Each PR needs to be labeled with one of: 
    - breaking
    - enhancement
    - bug
    - documentation
    - internal

2. Once all the PRs are labeled, `release-plan` will instead show you the release plan, explaining which packages are getting released, at which versions, and why.

3. If you disagree with the plan, you can modify the list of changes before using it to `explain-plan` or `prepare` a release:

    - `npx release-plan gather-changes > /tmp/changelog`
    - edit `/tmp/changelog`
    - `npx release-plan --from-stdin < /tmp/changelog`

    For example, this can be necessary if a PR that's labeled `breaking` touches multiple packages and only one of those packages is actually a breaking change. In that case you can take the other package names out of the description of the PR.

4. Once you're happy with the plan, run `npx release-plan prepare`. This will edit CHANGELOG.md, bump the version numbers in package.json files, and create a file named `.release-plan.json`. Make a PR with these changes.

5. Once the PR is merged, in a clean local repo at the merge commit, run `npx release-plan publish`. If you need an `otp` for your release you can provide that to the `publish` command like this `npx release-plan publish --otp=123456`

### Options

For projects that need extra control over how versions are incremented `release-plan` configuration can be added to individual package.json files to remap the increment level passed to `semver` eg:

```json
{
  "name": "example",
  "version": "0.9.0",
  "release-plan": {
    "semverIncrementAs": {
      "major": "minor"
    }
  }
}
```
Will mean that any breaking change is treated as a minor which is useful in case the project is in the pre 1.0 stage. Please use responsibly

## Comparison

Note that we take the stance of reducing friction for new contributors (regardless of how new to GitHub they are), we want to optimize for the contribution, and assume that maintainers can handle a little bit of process -- and with this stance, changesets is the _most work_ out of this comparison.

Additionally, this comparison assumes the recommended configuration for each release tool. 


| release-plan        | release-it (requires computer) | changesets (requires computer) |
| ------------------  | ------------------------------ | ------------------------------ |
| add a label to a PR | same                           | have the repo cloned
| merge the PR        | same                           | add the remote of the PR-submitter to your local git
|                     |                                | checkout the branch
|                     |                                | run `pnpm changeset`
|                     |                                | write something about the change
|                     |                                | push it back up to the PR-submitter's branch
| ensure the PR title is what you want in the changelog | same | 
|                     | have the repo cloned | 
|                     | update / sync repo locally |
|                     | run `npx release -it`     |
| automation creates a preview PR |  | same
| merging that preview PR does the actual release | | same



_Needed_ Access:
|   | release-plan        | release-it | changesets |
| - | ------------------  | ---------- | ---------- |
| NPM_TOKEN | only ci     | local      | only ci    |
| GH_TOKEN | only ci      | local      | only ci    |

Note that while it's recommended to use `release-plan` with full automation, `release-plan` can be used locally, as described in the [Manual Installation](#manual) section of this README.

Summary:
|   | release-plan        | release-it | changesets |
| - | ------------------  | ---------- | ---------- |
| number of steps | 5     | 6          | 8          |
| Downsides | n/a      | <ul><li>maintainers need admin access to both GitHub and NPM</li><li>requires a computer</li></ul>      |  <ul><li>requires push access to the submitter's PR, or potentially risk losing steam from the contributor to ask them to create the changeset</li><li>more up-front work required per change/PR</li><li>hard to go back and add a changeset and have it associated with the PR correctly (maybe impossible), so forgetting to add changesets pre-merge can totally ruin the accuracy of changeset's changelog</li><li>requires a computer</li></ul> |

## Origins

This package was originally developed to help release [Embroider](https://github.com/embroider-build/embroider) and was extracted so everyone can use it 🎉
