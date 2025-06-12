# Provenance

For security reasons, make it verifiable for your consumers where your package
is coming from and to increase trust in your supply chain NPM introduces
_provenance_.

`release-plan` supports provenance. Publishing to NPM in this badge:

![Provenance badge for `@embroider/vite`](./provenance-@embroider_vite.png)

## Configuration

Call the publish command with respective parameters for your package manager.

::: code-group

```sh [npm]
npm release-plan publish --provenance
```

```sh [pnpm]
NPM_CONFIG_PROVENANCE=true pnpm release-plan publish
```

:::

## Resources

- [Talk: Build provenance for package registries](https://docs.google.com/presentation/d/1OO86MsN4rHlL6i2rzoEkvql0vCpxjB-wQyGIpZQoQBg/edit)
- [Blog: Introducing npm package provenance](https://github.blog/2023-04-19-introducing-npm-package-provenance/)
- [Docs: Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements)
- [Article: Build Provenance for All Package Registries](https://repos.openssf.org/build-provenance-for-all-package-registries)
- [Example: Publishing npm package with provenance](https://github.com/npm/provenance-demo)
- [RFC: Link npm packages to the originating source code repository and build](https://github.com/npm/rfcs/blob/main/accepted/0049-link-packages-to-source-and-build.md)
