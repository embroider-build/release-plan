const knownSections = {
    ':boom: Breaking Change': {
        impact: 'major',
    },
    ':rocket: Enhancement': {
        impact: 'minor',
    },
    ':bug: Bug Fix': {
        impact: 'patch',
    },
    ':memo: Documentation': {
        impact: 'patch',
    },
    ':house: Internal': {
        impact: 'patch',
    },
    ':question: Unlabeled': {
        unlabeled: true,
    },
    ':present: Additional updates': {
        unlabeled: true,
    },
};
const ignoredSections = [/Committers: \d+/];
function sectionHeading(line) {
    if (line.startsWith('#### ')) {
        return line.slice(5);
    }
}
function stillWithinSection(lines) {
    return lines.length > 0 && !sectionHeading(lines[0]);
}
function consumeSection(lines) {
    const matchedLines = [];
    while (stillWithinSection(lines)) {
        matchedLines.push(lines.shift());
    }
    return matchedLines;
}
function parseSection(lines, publishableNames) {
    const line = lines.shift();
    const heading = line ? sectionHeading(line) : undefined;
    if (!heading) {
        return;
    }
    const sectionConfig = knownSections[heading];
    if (!sectionConfig) {
        if (ignoredSections.some((pattern) => pattern.test(heading))) {
            consumeSection(lines);
            return;
        }
        throw new Error(`unexpected section: ${heading}`);
    }
    if ('unlabeled' in sectionConfig) {
        const relevantLines = filteredUnlabeled([...lines], publishableNames);
        const consumed = consumeSection(relevantLines);
        return { unlabeled: true, summaryText: consumed.join('\n') };
    }
    const packages = new Set();
    while (stillWithinSection(lines)) {
        const packageList = parsePackageList(lines);
        if (packageList) {
            for (const pkg of packageList) {
                if (publishableNames.has(pkg)) {
                    packages.add(pkg);
                }
            }
        }
    }
    return {
        packages: [...packages],
        impact: sectionConfig.impact,
        heading,
    };
}
function filteredUnlabeled(lines, publishableNames) {
    const relevant = [];
    let skipWholeList = false;
    for (const line of lines) {
        if (line === '* Other')
            continue;
        if (line.startsWith('*')) {
            const packageNames = parsePackageList([line]);
            if (!packageNames)
                continue;
            const relevantNames = packageNames.filter((name) => publishableNames.has(name));
            if (relevantNames.length === 0) {
                skipWholeList = true;
                continue;
            }
            skipWholeList = false;
            relevant.push(`* ${relevantNames.map((x) => `\`${x}\``).join(', ')}`);
            continue;
        }
        if (!skipWholeList) {
            relevant.push(line);
        }
    }
    return relevant;
}
function parsePackageList(lines) {
    const line = lines.shift();
    if (!line) {
        return;
    }
    if (line === '* Other') {
        return;
    }
    if (line.startsWith('* `')) {
        const parts = line.slice(2).split(/,\s*/);
        if (!parts.every((p) => p.startsWith('`') && p.endsWith('`'))) {
            throw new Error(`don't understand this line: ${line}.`);
        }
        return parts.map((p) => p.slice(1, -1));
    }
}
export function parseChangeLog(src, publishableNames) {
    const lines = src.split('\n');
    const sections = [];
    while (lines.length > 0) {
        const section = parseSection(lines, publishableNames);
        if (section) {
            sections.push(section);
        }
    }
    return { sections };
}
export function parseChangeLogOrExit(src, publishableNames) {
    try {
        return parseChangeLog(src, publishableNames);
    }
    catch (err) {
        console.error(err);
        console.error(`the full changelog that failed to parse was:\n${src}`);
        process.exit(-1);
    }
}
//# sourceMappingURL=change-parser.js.map