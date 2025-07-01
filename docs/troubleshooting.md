# Troubleshooting

## `ERR_PNPM_CANNOT_RESOLVE_WORKSPACE_PROTOCOL`

This error can happen during publish, when the package you want to publish has a
dependency to a private package in your monorepo (sth as config package) and
this private package has no version number set.

Resolution: Give your private packages a `"version"` field, when packages you
want to publish depend on them.

References:

- [`pnpm publish` fails `ERR_PNPM_CANNOT_RESOLVE_WORKSPACE_PROTOCOL` with when
  both `workspace:` and `publishConfig.directory`
  set](https://github.com/pnpm/pnpm/issues/6253)
- [Comment with solution by `@raulfdm` (Raul Melo)](https://github.com/pnpm/pnpm/issues/4164#issuecomment-1236762286)
