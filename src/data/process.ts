import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import * as yaml from 'yaml';
import { join } from 'path';
import { fileURLToPath } from 'url';
import * as T from './types';
import { parse as parseCsv } from 'csv-parse/sync';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Get the freshest item pools directly from the OoTMM repo!

const poolCsvUrls = [
    'https://github.com/OoTMM/OoTMM/raw/master/packages/data/src/pool/pool_oot.csv',
    'https://github.com/OoTMM/OoTMM/raw/master/packages/data/src/pool/pool_mm.csv',
];

const POOL: T.RawPoolData = await Promise.all(
    poolCsvUrls.map(async u => {
        const response = await fetch(u);
        const csv = await response.text();
        return parseCsv(csv, { columns: true, skip_empty_lines: true, trim: true });
    }),
).then(([oot, mm]) => ({ oot, mm }));

// This is a human-constructed/human-readable description of how to process
// and organize the checks in the pool
const groupingFile = readFileSync(join(__dirname, 'grouping.yaml'), 'utf-8');
const GROUPING: T.GroupingData = yaml.parse(groupingFile);

// The all-sanity checks to exclude for the lite version
const liteBlacklist = [
    T.CheckType.fairy,
    T.CheckType.fairy_spot,
    T.CheckType.fish,
    T.CheckType.grass,
    T.CheckType.heart,
    T.CheckType.pot,
    T.CheckType.rupee,
    T.CheckType.sr,
];

const structuredChecks: T.CheckGroup[] = [];
const liteChecks: T.CheckGroup[] = [];

function createCheckEntry(
    poolEntry: T.RawPoolEntry,
    game: T.Game,
    groupName: string,
    group: T.GroupingEntry,
    mqScene: string | null,
): T.Check {
    // mqScene is the scene capable of having both MQ and Vanilla verisons of checks
    const canBeMq = mqScene != null && poolEntry.scene == mqScene;
    const isMq = poolEntry.location.startsWith('MQ');

    const tags: T.Tag[] = [];
    if (/^Treasure Chest Game [^H]/.test(poolEntry.location)) tags.push(T.Tag.setting_tcg);
    if (/^Lost Woods.*Scrub.*Upgrade/.test(poolEntry.location)) tags.push(T.Tag.special_scrub);
    if (/^Hyrule Field Grotto Scrub HP/.test(poolEntry.location)) tags.push(T.Tag.special_scrub);
    if (/^Gerudo Fortress Jail [0-9]/.test(poolEntry.location)) tags.push(T.Tag.setting_hideout_shuffle);
    if (/^(Swamp|Ocean) Skulltula/.test(poolEntry.location)) tags.push(T.Tag.mm_skulltula);

    let shortName = poolEntry.location;

    // Always replacements and tweaks
    shortName = shortName.replace('MQ ', '');
    shortName = shortName.replace('HP', 'Heart Piece');
    shortName = shortName.replace('HC', 'Heart Container');

    // If the entry has specified replacements, use those.
    // Otherwise, it is assumed by default that we will remove the group's name
    // from any checks that start with it.
    const replacements = group?.replacements ?? [[`^${groupName}`, '']];
    for (const [r, s] of replacements) {
        shortName = shortName.replace(new RegExp(r), s);
    }

    shortName = shortName.trim();

    return { shortName, name: poolEntry.location, type: T.CheckType[poolEntry.type], game, canBeMq, isMq, tags };
}

for (let game in T.Game) {
    for (const [groupName, group] of Object.entries(GROUPING[game])) {
        const gamePool = POOL[game as T.Game];

        let sceneEntries: T.RawPoolEntry[] = [];

        let firstScene = group.scenes[0];
        let tailScenes = group.scenes.slice(1);

        // All checks from the pool that have one of the listed scenes are in this group
        // The first scene is chosen to be the only one capable of having checks that have
        // MQ or Vanilla versions; for ordering reasons, grab all such checks FIRST.
        sceneEntries = [
            ...gamePool.filter(x => x.scene == firstScene),
            ...gamePool.filter(x => tailScenes.includes(x.scene)),
        ];

        // Other checks that match one of the regex in 'checks' belong in this group
        let otherEntries =
            group.checks?.flatMap(c => {
                const rx = new RegExp(c);
                return gamePool.filter(x => rx.test(x.location));
            }) ?? [];

        const poolEntries = [...sceneEntries, ...otherEntries];

        // const prefix = group.checkNamePrefix != null ? new RegExp(group.checkNamePrefix) : new RegExp(`^${groupName}`);
        const mqScene = group.canBeMq ? firstScene : null;
        let entries = poolEntries.map(c => createCheckEntry(c, T.Game[game as T.Game], groupName, group, mqScene));

        // "Crush" shop entries like '.... Item n' down to a single check '.... Items'
        let shopIndex = entries.findIndex(x => x.type == T.CheckType.shop);
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
            shopIndex = entries.findIndex((x, i) => i > shopIndex && x.type == T.CheckType.shop);
        }

        const canHaveMq = entries.some(c => c.canBeMq);
        const liteEntries = entries.filter(x => !liteBlacklist.includes(x.type));

        structuredChecks.push({ groupName, canHaveMq, checks: entries });
        liteChecks.push({ groupName, canHaveMq, checks: liteEntries });
    }
}

writeFileSync(join(__dirname, 'dist', 'structured-checks.json'), JSON.stringify(structuredChecks));
writeFileSync(join(__dirname, 'dist', 'structured-checks-lite.json'), JSON.stringify(liteChecks));
