# Commit Signing

When you are using [branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) on Github and [require signed commits](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-signed-commits), you
can enable them for your own repository. `release-plan` uses
[`create-pull-request`](https://github.com/marketplace/actions/create-pull-request)
Github action to create `Prepare Release` PRs.

Refer to [commit
signing](https://github.com/peter-evans/create-pull-request/blob/main/docs/concepts-guidelines.md#commit-signing)
to apply these rules for your repository.
