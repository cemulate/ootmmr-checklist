import * as Y from 'yjs';
import structuredChecksUrl from '../data/dist/structured-checks.json?url';

export async function initializeStructuredChecks() {
    const response = await fetch(structuredChecksUrl);
    const data = await response.json();
    window.localStorage.setItem('structured-checks', JSON.stringify(data));
    return data;
}
