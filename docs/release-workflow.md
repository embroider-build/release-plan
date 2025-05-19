# Release Workflow

`release-plan` reduces friction for new contributors (regardless of how new to
GitHub they are) as well releases for maintainers.

- **Contributors**: Open PRs as usual, assign a label and merge as usual :v:
- **Maintainers**: Inspect the next release (previewed in a PR), then merge when you
  are happy and a new release will be published
- **Automation**: `release-plan` automates the preview and publishing of
  releases

::: info

No need for maintainers to manage any keys locally on their machine.
`release-plan` takes the step encourages separate management of repo and npm package.

:::

```mermaid
flowchart TB
    subgraph Feature Development
        pr1(Open PR #1) --> label1(Assign Label) --> merge1(Merge PR #1)
        pr2(Open PR #2) --> label2(Assign Label) --> merge2(Merge PR #2)
    end

    
    subgraph Releasing
        merge1 --> prepare(Prepare Release PR)
        merge2 --> prepare
        prepare --> merge-prepare(Merge Release PR)
        merge-prepare --> publish(Publish to NPM)
    end

classDef contrib fill:lightgreen,color:#222,stroke:#222,stroke-width:1px;
classDef maintainer fill:lightblue,color:#222,stroke:#222,stroke-width:1px;
classDef automation fill:rebeccapurple,color:#EEE,stroke:#222,stroke-width:1px;

class pr1,label1,merge1,pr2,label2,merge2 contrib;
class merge-prepare maintainer;
class prepare,publish automation;
```
