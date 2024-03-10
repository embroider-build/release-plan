import { highlight } from 'cli-highlight';
import chalk from 'chalk';
export function highlightMarkdown(md) {
    return highlight(md, {
        language: 'Markdown',
        theme: {
            section: chalk.blueBright,
            string: chalk.hex('#0366d6'),
            link: chalk.dim,
        },
    });
}
//# sourceMappingURL=highlight.js.map