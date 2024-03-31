import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import * as yaml from 'yaml';
import { join } from 'path';
import { fileURLToPath } from 'url';
import * as T from './types';
import { group } from 'console';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const poolFile = readFileSync(join(__dirname, 'input/data-pool.json'), 'utf-8');
const POOL: T.RawPoolData = JSON.parse(poolFile);

const groupingFile = readFileSync(join(__dirname, 'grouping.yaml'), 'utf-8');
const GROUPING: T.GroupingData = yaml.parse(groupingFile);

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

function createCheckEntry(poolEntry: T.RawPoolEntry, game: T.Game, prefix: string | RegExp, mqScene: string | null): T.Check {
    const tags: T.Tag[] = [];

    // mqScene is the scene capable of having both MQ and Vanilla verisons of checks
    const canBeMq = mqScene != null && poolEntry.scene == mqScene;
    const isMq = poolEntry.location.startsWith('MQ');

    if (/^Treasure Chest Game [^H]/.test(poolEntry.location)) tags.push(T.Tag.setting_tcg);
    if (/^Lost Woods.*Scrub.*Upgrade/.test(poolEntry.location)) tags.push(T.Tag.special_scrub);
    if (/^Hyrule Field Grotto Scrub HP/.test(poolEntry.location)) tags.push(T.Tag.special_scrub);
    if (/^Gerudo Fortress Jail [0-9]/.test(poolEntry.location)) tags.push(T.Tag.setting_hideout_shuffle);
    if (/^(Swamp|Ocean) Skulltula/.test(poolEntry.location)) tags.push(T.Tag.mm_skulltula);

    // Prefix is used to create the shortName of checks that include the area name in their full name
    let shortName = poolEntry.location;
    shortName = shortName.replace('MQ ', '');
    if (prefix != null) shortName = shortName.replace(prefix, '');
    // (This actually makes it longer, but clearer)
    shortName = shortName.replace('HP', 'Heart Piece');
    shortName = shortName.trim();

    return { shortName, name: poolEntry.location, type: T.CheckType[poolEntry.type], game, canBeMq, isMq, tags };
}

for (let game in T.Game) {
    for (const [ groupName, group ] of Object.entries(GROUPING[game])) {

        let sceneEntries: T.RawPoolEntry[] = [];

        let firstScene = group.scenes[0];
        let tailScenes = group.scenes.slice(1);

        // All checks from the pool that have one of the listed scenes are in this group
        // The first scene is chosen to be the only one capable of having checks that have 
        // MQ or Vanilla versions; for ordering reasons, grab all such checks FIRST.
        sceneEntries = [
            ...POOL[game].filter(x => x.scene == firstScene),
            ...POOL[game].filter(x => tailScenes.includes(x.scene)),
        ];
        
        // Other checks that match one of the regex in 'checks' belong in this group
        let otherEntries =
            group.checks?.flatMap(c => {
                const rx = new RegExp(c);
                return POOL[game].filter(x => rx.test(x.location));
            }) ?? [];

        const poolEntries = [...sceneEntries, ...otherEntries];

        const prefix = group.checkNamePrefix != null ? new RegExp(group.checkNamePrefix) : new RegExp(`^${groupName}`);
        const mqScene = group.canBeMq ? firstScene : null;
        let entries = poolEntries.map(c => createCheckEntry(c, T.Game[game as T.Game], prefix, mqScene));

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
