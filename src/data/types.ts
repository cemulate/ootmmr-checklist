// jq '.oot+.mm | map(.type) | unique' < src/data/input/data-pool.json
export enum CheckType {
    chest,
    collectible,
    cow,
    fairy,
    fairy_spot,
    fish,
    grass,
    gs,
    heart,
    npc,
    pot,
    rupee,
    scrub,
    sf,
    shop,
    sr,
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
    checkNamePrefix?: string;
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

export interface CheckGroup {
    groupName: string;
    canHaveMq: boolean;
    checks: Check[];
}
