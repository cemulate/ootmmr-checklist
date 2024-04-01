# OoTMM co-op checklist tracker

An online/co-op capable checklist tracker for the [OoTMM Randomizer](https://ootmm.com/).
Join the same room to mark off checks collaboratively with other players.
[Try it here](https://cemulate.github.io/ootmmr-checklist).

Some tips:

-   Shift-click to toggle a range of checks
-   Right-click or long-press to mark a check for special/further attention
-   Click group names to toggle the whole group

## Development / how it works

At compile time, the item and check data is processed and manipulated directly from the item pools in the [OoTMM repo](https://github.com/OoTMM/OoTMM); everything related to this process lives in `src/data`.
The processing can be performed with `npm run process-data`, which produces `src/data/dist/structured-checks[-lite].json`.

The app itself is a [Vite](https://vitejs.dev/)/[Svelte](https://svelte.dev/) app written in TypeScript.

The functionality is powered by

-   [yjs](https://yjs.dev/), a powerful collaborative/shared-editing framework, together with
    -   [y-indexeddb](https://github.com/yjs/y-indexeddb), automatically persisting the shared data locally in the browser
    -   [y-webrtc](https://github.com/yjs/y-webrtc), automatically syncing the shared data to connected peers via WebRTC!
    -   An extremely lightweight _signaling_ server for y-webrtc based on [ngryman's implementation](https://github.com/ngryman/signaling), that helps peers connect over WebRTC, which is deployed with [fly.io](https://fly.io)
