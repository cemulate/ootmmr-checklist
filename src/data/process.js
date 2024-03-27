import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import * as yaml from 'yaml';
import { join } from 'path';
import { fileURLToPath } from 'url';
import * as Y from 'yjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const poolFile = readFileSync(join(__dirname, 'input/data-pool.json'), 'utf-8');
const POOL = JSON.parse(poolFile);

const groupingFile = readFileSync(join(__dirname, 'grouping.yaml'), 'utf-8');
const GROUPING = yaml.parse(groupingFile);

const structuredChecks = {
    oot: {},
    mm: {},
};

for (const [group, { scenes, checks }] of Object.entries(GROUPING)) {
    let sceneEntries = POOL.oot.filter(x => scenes.includes(x.scene));
    let otherEntries =
        checks?.flatMap(c => {
            const rx = new RegExp(c);
            return POOL.oot.filter(x => rx.test(x.location));
        }) ?? [];
    const entries = [...sceneEntries, ...otherEntries];

    structuredChecks.oot[group] = entries.map(c => ({ name: c.location, type: c.type }));
}

writeFileSync(join(__dirname, 'dist', 'structured-checks.json'), JSON.stringify(structuredChecks));
