# release-plan

This package was originally developed to help release [Embroider](https://github.com/embroider-build/embroider) and was extracted so everyone can use it 🎉

## Installation

```
npm i --save-dev release-plan
```

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

    