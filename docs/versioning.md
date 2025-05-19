# Versioning

When `release-plan` is deciding what part of the semver version to update it
considers the **Impact** a PR has on a pakcage. Impact can be either `major`,
`minor`, or `patch` and by default they directly map on to the
`<major>.<minor>.<patch>` parts of semver versions.

## Labels

The impact is read from the labels you assign to a PR. Each PR needs to be
labeled with minimum one of:

| Label | Impact |
| ----- | ------ |
| `breaking` | `major` |
| `enhancement` | `minor` |
| `bug` | `patch` |
| `documentation` | `patch` |
| `internal` | `patch` |

You can inspect the next release with `release-plan explain-plan`. If there are unlabeled PRs that need to be released it will complain and show you a list of them.

## Configuration

For projects that need extra control over how versions are incremented, e.g. you are in a pre-1.0 release and you want a `major` impact to only update the `<minor>` section of semver, then you can set the [`semverIncrementAs`](./config.md#semverincrementas) setting to remap which semver version a particular **impact** would affect.
