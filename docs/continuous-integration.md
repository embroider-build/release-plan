# Continuous Integration

The idea for `release-plan` is to run on CI and not locally on you machine.

## Github Actions

Learn how to [setup](./getting-started.md) Github Actions for use with
`release-plan`.

::: info

_Optionally_, you can add checks for your PRs to have the required labels assigned.

:::

## CircleCI

For CircleCI you want to replicate the setup for Github Actions. You maybe even want
to parts of Github Actions for creating the preview release PR, but only run
publishing on CircleCI.

The tricky part is to check for the existing or `.release-plan.json` in `git
diff`. CircleCI offers [dynamic
configuration](https://circleci.com/docs/dynamic-config) (see their [dynamic
config how-to](https://circleci.com/docs/using-dynamic-configuration/)) with
their `path-filtering` filtering orb.

Here is two sample configs:

::: code-group

```yaml [config.yml]
version: 2.1

setup: true

orbs:
  path-filtering: circleci/path-filtering@1.3.0

workflows:
  setup-workflow:
    jobs:
      - path-filtering/filter:
          base-revision: HEAD
          config-path: .circleci/workflows.yml
          mapping: |
            .release-plan.json publish true
          filters:
            tags:
              only: /.*/
            branches:
              only: /.*/
```

```yaml [workflows.yml]
version: 2.1

orbs:
  browser-tools: circleci/browser-tools@1.5.3

parameters:
  publish:
    type: boolean
    default: false

executors:
  node:
    docker:
      - image: cimg/node:24.0.2

commands:
  setup-git:
    description: Configures the local SSH and git client, so that it can be used for your repo.
    steps:
      - add_ssh_keys:
          fingerprints:
            # https://app.circleci.com/settings/project/github/<org>/<repo>/ssh
            - "<your-ssh-key>"
      - run:
          name: Add `github.com` SSH fingerprint to `known_hosts`
          command: |
            mkdir -p ~/.ssh
            touch ~/.ssh/known_hosts
            if [ ! "$(ssh-keygen -F github.com)" ]; then
              echo "github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=" >> ~/.ssh/known_hosts
            fi
      - run:
          name: Add git credentials for pushing to origin remote
          command: git remote set-url origin https://${GITHUB_USER}:${GITHUB_AUTH}@github.com/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}.git

jobs:
  setup:
    executor: node
    description: Set up project
    steps:
      # checkout the repo here
      # install deps
      # build your project

  publish:
    description: Publish packages to the registry, tag the repo and create a release on Github
    executor: node
    resource_class: medium
    steps:
      - setup-git
      - run: git stash
      - run:
          name: npm publish
          command: pnpm release-plan publish

workflows:
  release:
    when:
      and:
        - equal: [main, << pipeline.git.branch >>]
        - << pipeline.parameters.publish >>
    jobs:
      - setup:
      - publish:
          requires:
            - setup
```

:::
