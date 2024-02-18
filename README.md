# release-plan

This package was originally developed to help release [Embroider](https://github.com/embroider-build/embroider) and was extracted so everyone can use it 🎉

## Features

- no manual steps
- no need to give maintainers access to npm
- release preview 
- automatic changelog

## Installation

```
npm i --save-dev release-plan
```

or using [`create-release-plan-setup`](https://github.com/mansona/create-release-plan-setup), see below

## Usage

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

5. Once the PR is merged, in a clean local repo at the merge commit, run `npx release-plan publish`. if you need an `otp` for your release you can provide that to the `publish` command like this `npx release-plan publish --otp=123456`

    

## Comparison


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



Access:
|   | release-plan        | release-it | changesets |
| - | ------------------  | ---------- | ---------- |
| NPM_TOKEN | only ci     | local      | only ci    |
| GH_TOKEN | only ci      | local      | only ci    |


number of steps:
- release-plan: 5
- release-it: 6
  Downsides:
  - maintainers need admin access to GH and NPM
  - requires computer
- changesets: 8
  Downsides:
  - requires push access to a submitter's PR
  - more up-front work required
  - hard to go back and add a changeset and have it associated with the PR correctly
  - requires computer
