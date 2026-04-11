// jq '.oot+.mm | map(.type) | unique' < src/data/input/data-pool.json
export enum CheckType {
    barrel,
    bush,
    butterfly,
    chest,
    collectible,
    cow,
    crate,
    fairy,
    fairy_spot,
    fish,
    grass,
    gs,
    heart,
    hive,
    icicle,
    npc,
    pot,
    redboulder,
    redice,
    rock,
    rupee,
    scrub,
    sf,
    shop,
    snowball,
    soil,
    sr,
    tree,
    wonder,
}



export interface RawPoolEntry {
    location: string;
    type: keyof typeof CheckType;
    hint: string;
    scene: string;
    id: string;
    item: string;
}

export type RawPoolData = {
    [index: string]: RawPoolEntry[];
};

export interface GroupingEntry {
    canBeMq?: boolean;
    replacements?: string[];
    scenes: string[];
    checks: string[];
}

export type GroupingData = {
    [index: string]: {
        [index: string]: GroupingEntry;
    };
};

// ---------

export enum Game {
    oot = 'oot',
    mm = 'mm',
}

export enum Tag {
    special_scrub,
    setting_tcg,
    setting_hideout_shuffle,
    mm_skulltula,
    boss,
}

export interface Check {
    shortName: string;
    name: string;
    type: CheckType;
    game: Game;
    canBeMq: boolean;
    isMq: boolean;
    tags: Tag[];
}

export enum CheckState {
    unchecked, // No information about the check
    marked, // The check should be emphasized (seen but unreachable, hinted, etc.)
    checked, // The check has been gotten
}

export interface CheckGroup {
    groupName: string;
    canHaveMq: boolean;
    checks: Check[];
}
