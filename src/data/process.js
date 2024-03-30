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

const liteBlacklist = ['fairy', 'fairy_spot', 'fish', 'grass', 'heart', 'pot', 'rupee', 'sr'];

const structuredChecks = [];
const liteChecks = [];

/*
Schema: [
    {
        name: String,
        checks: [
            { shortName: String, name: String, type: String, game: String, tags: [String] }
        ]
    }
]
*/

function createCheckEntry(game, prefix, poolEntry) {
    const tags = [];
    if (poolEntry.location.startsWith('MQ')) tags.push('mq');
    if (/^Treasure Chest Game [^H]/.test(poolEntry.location)) tags.push('setting-tcg');
    if (/^Lost Woods.*Scrub.*Upgrade/.test(poolEntry.location)) tags.push('special-scrub');
    if (/^Hyrule Field Grotto Scrub HP/.test(poolEntry.location)) tags.push('special-scrub');
    if (/^Gerudo Fortress Jail [0-9]/.test(poolEntry.location)) tags.push('setting-hideout-shuffle');
    if (/(Boss$|Boss Container$)/.test(poolEntry.location)) tags.push('boss');

    let shortName = poolEntry.location;
    shortName = shortName.replace('MQ ', '');
    if (prefix != null) shortName = shortName.replace(prefix, '');
    shortName = shortName.trim();

    return { shortName, name: poolEntry.location, type: poolEntry.type, game, tags };
}

for (let game of ['oot', 'mm']) {
    for (const [groupName, data] of Object.entries(GROUPING[game])) {
        // All checks from the pool that have one of the listed scenes are in this group
        let sceneEntries = POOL[game].filter(x => data.scenes.includes(x.scene));
        // Other checks that match one of the regex in 'checks' belong in this group
        let otherEntries =
            data.checks?.flatMap(c => {
                const rx = new RegExp(c);
                return POOL.oot.filter(x => rx.test(x.location));
            }) ?? [];
        const poolEntries = [...sceneEntries, ...otherEntries];

        // Prefix is used to create the shortName of checks that include the area name in their full name
        const prefix = data.checkNamePrefix != null ? new RegExp(data.checkNamePrefix) : groupName;
        let entries = poolEntries.map(c => createCheckEntry(game, prefix, c));

        // "Crush" shop entries like '.... Item n' down to a single check '.... Items'
        let shopIndex = entries.findIndex(x => x.type == 'shop');
        while (shopIndex >= 0) {
            const itemRx = /Item [0-9]+/;
            let firstShopEntry = entries[shopIndex];
            let shopPrefix = firstShopEntry.shortName.replace(itemRx, '').trim();
            let endIndex = entries.findLastIndex(x => x.shortName.startsWith(shopPrefix));
            entries.splice(shopIndex, endIndex - shopIndex + 1, {
                ...firstShopEntry,
                shortName: firstShopEntry.shortName.replace(itemRx, 'Items').trim(),
                name: firstShopEntry.name.replace(itemRx, 'Items').trim(),
            });
            shopIndex = entries.findIndex((x, i) => i > shopIndex && x.type == 'shop');
        }

        const canBeMq = entries.some(c => c.tags.includes('mq'));
        const liteEntries = entries.filter(x => !liteBlacklist.includes(x.type));

        structuredChecks.push({ groupName, canBeMq, checks: entries });
        liteChecks.push({ groupName, canBeMq, checks: liteEntries });
    }
}

writeFileSync(join(__dirname, 'dist', 'structured-checks.json'), JSON.stringify(structuredChecks));
writeFileSync(join(__dirname, 'dist', 'structured-checks-lite.json'), JSON.stringify(liteChecks));
