import * as T from '../data/types';
import structuredChecksUrl from '../data/dist/structured-checks-lite.json?url';

export async function initializeStructuredChecks(): Promise<[T.CheckGroup]> {
    const response = await fetch(structuredChecksUrl);
    return response.json();
}
