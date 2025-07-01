# Config

This project attemps to have sensible defaults so there is not any need to configure `release-plan` in most cases. There are some cases, like releasing a prerelease version of a package, that might require some configuration depending on the type of prerelease you are doing. You can configure that in the `release-plan` section of your `package.json`, or if you're in a monorepo in the `release-plan` section of the package that you want set the config for. This way you can have multiple packages with different configurations if you need to.

## `semverIncrementAs`

When `release-plan` is deciding what part of the semver version to update it considers the **Impact** a PR has on a pakcage. Impact can be either `major`, `minor`, or `patch` and by default they directly map on to the `<major>.<minor>.<patch>` parts of semver versions. For projects that need extra control over how versions are incremented, e.g. you are in a pre-1.0 release and you want a `major` impact to only update the `<minor>` section of semver, then you can set the `semverIncrementAs` setting to remap which semver version a particular **impact** would affect.

::: code-group

```json [package.json]
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

:::

## `semverIncrementTag`

If you're using the `semverIncrementAs` functionality to do a `premajor` or a
`prerelease` version, you might want to tag that prerelease with a Prelease Tag.
We use the `semver` library internally so you can read more about [how they do
tags in their
documentation](https://github.com/npm/node-semver?tab=readme-ov-file#prerelease-tags).

::: code-group

```json [package.json]
{
  "name": "example",
  "version": "0.9.0",
  "release-plan": {
    "semverIncrementAs": {
      "major": "premajor"
    },
    "semverIncrementTag": "alpha"
  }
}
```

:::

## `publishTag`

When you use `release-plan` to publish to npm it will by default publish your package with the `latest` tag on npm. If you are using the `semverIncrementAs` and `semverIncrementTag` configs to do a pre-release you will probably also want to set a different tag on npm to signify that the package is not to be considered `latest` (yet).

::: code-group

```json [package.json]
{
  "name": "example",
  "version": "0.9.0",
  "release-plan": {
    "semverIncrementAs": {
      "major": "premajor"
    },
    "semverIncrementTag": "alpha",
    "publishTag": "next"
  }
}
```

:::
