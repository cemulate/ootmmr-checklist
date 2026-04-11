import * as T from '../data/types';
import structuredChecksUrl from '../data/dist/structured-checks-lite.json?url';

export async function initializeStructuredChecks(): Promise<[T.CheckGroup]> {
    const response = await fetch(structuredChecksUrl);
    return response.json();
}

export function randomRoomName(): string {
    const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const B = DIGITS.length;
    const MAX = Math.pow(B, 4);
    const dig = (n, x) => Math.floor((x % Math.pow(B, n+1)) / Math.pow(B, n));
    
    const n = Date.now() % MAX;

    let ds = [];
    for (let i = 0; i < 4; i ++) {
        let d = dig(3 - i, n);
        if (ds.includes(d)) d = (d < B) ? (d + 1) : (d - 1);
        ds.push(d);
    }

    return ds.map(d => DIGITS[d]).join('');
}
