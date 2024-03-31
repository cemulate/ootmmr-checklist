<script lang="ts">
  import * as Y from 'yjs';
  import { readableArray, readableMap } from 'svelt-yjs';
  import { WebrtcProvider } from 'y-webrtc';
  import { IndexeddbPersistence } from 'y-indexeddb';
  import { initializeStructuredChecks } from './util/util';
  import CheckGroup from './components/CheckGroup.svelte';
  import CheckItem from './components/CheckItem.svelte';
  import * as T from './data/types';

  // Top level yjs document; will be persisted locally via Indexeddb
  const ydoc = new Y.Doc();
  const persistenceProvider = new IndexeddbPersistence('local', ydoc);

  // The document will be shared with any WebRTC peers, if connected to a room
  let roomName: string | null = null;
  let connectionProvider: WebrtcProvider | null = null;

  // Set hash any time roomName changes
  $: window.location.hash = roomName ?? '';

  function joinCoopRoom(name?: string) {
    roomName = name ?? new Date().getTime().toString(36);
    const signaling = ['https://ootmmr-checklist-signaling.fly.dev/'];
    connectionProvider = new WebrtcProvider(roomName, ydoc, { signaling });
  }

  function leaveCoopRoom() {
    if (window.confirm('Are you sure you want to disconnect? Your progress will be preserved as it is now.')) {
      connectionProvider?.disconnect();
      connectionProvider = null;
      roomName = null;
    }
  }

  // If the link has a room name, connect to it now
  if (window.location.hash.length > 0 && /#[a-z0-9]+/.test(window.location.hash)) {
    const name = window.location.hash.slice(1);
    joinCoopRoom(name);
  }

  // The shared document consist of three Boolean-valued Maps y[...]
  // Each will be mirrored by a Svelte store s[...] to use in the UI

  // The main map representing whether checks are marked off or not
  const yChecks: Y.Map<boolean> = ydoc.getMap('checks');
  const sChecks = readableMap(yChecks);

  // The settings map controlling which checks to display
  const ySettings: Y.Map<boolean> = ydoc.getMap('settings');
  const sSettings = readableMap(ySettings);
  const settingNames = {
    goldSkulltulas: 'Gold Skulltulas',
    mmSkulltulas: 'MM Skulltulas',
    ootScrubs: 'Oot Scrubs',
    cows: 'Cows',
    strayFairies: 'Stray Fairies',
    ootTreasureChestGame: 'OoT Treasure Chest Game',
    ootHideoutShuffle: 'OoT Hideout Shuffle',
  };

  // The settings map controlling which dungeons are MQ
  const yMqSettings: Y.Map<boolean> = ydoc.getMap('mqSettings');
  const sMqSettings = readableMap(yMqSettings);

  // This data structure details how checks are organized and displayed and their metadata
  let structuredChecks: T.CheckGroup[] | null = null;

  // The source of this structure is a JSON file created at compile time
  initializeStructuredChecks().then((data: T.CheckGroup[]) => {
    structuredChecks = data;
  });

  // Global search/filter
  let filter = '';

  // From settings, craft the predicate that tells whether or not we should display a particular check
  $: checkPredicate = (group: T.CheckGroup, check: T.Check) => {
    const impliesSetting = (condition: boolean, setting: string) => !condition || ($sSettings.get(setting) ?? false);
    const matchesSettings =
      impliesSetting(check.type == T.CheckType.gs, 'goldSkulltulas') &&
      impliesSetting(check.tags.includes(T.Tag.mm_skulltula), 'mmSkulltulas') &&
      impliesSetting(check.type == T.CheckType.scrub && !check.tags.includes(T.Tag.special_scrub), 'ootScrubs') &&
      impliesSetting(check.type == T.CheckType.cow, 'cows') &&
      impliesSetting(check.type == T.CheckType.sf, 'strayFairies') &&
      impliesSetting(check.tags.includes(T.Tag.setting_tcg), 'ootTreasureChestGame') &&
      impliesSetting(check.tags.includes(T.Tag.setting_hideout_shuffle), 'ootHideoutShuffle');

    const lowerFilter = filter.toLowerCase();
    const matchesFilter =
      filter.length == 0
        ? true
        : check.name.toLowerCase().includes(lowerFilter) || group.groupName.toLowerCase().includes(lowerFilter);

    const matchesMq = check.canBeMq
      ? ($sMqSettings.get(group.groupName) == check.isMq)
      : true;

    return matchesSettings && matchesFilter && matchesMq;
  };

  // Filter the structuredChecks, omitting entirely groups that are left with an empty array of checks
  $: filteredChecks = structuredChecks?.flatMap(group => {
    const filtered = group.checks.filter(checkPredicate.bind(null, group));
    return filtered.length == 0 ? [] : [{ ...group, checks: filtered }];
  });

  // Shorthand to toggle one of the Boolean-valued yMaps
  function toggleYmap(map: Y.Map<boolean>, key: string, defaultVal = false) {
    map.set(key, !(map.get(key) ?? defaultVal));
  }

  // Toggle entire groups; if all checks are marked, unmark them all. Otherwise, mark them all.
  function toggleWholeGroup(group: T.CheckGroup) {
    let newVal = !group.checks.every(({ name }) => yChecks.get(name) ?? false);
    group.checks.map(({ name }) => yChecks.set(name, newVal));
  }

  interface Toggle {
    group: T.CheckGroup;
    checkIndex: number;
  }

  let lastPlace: Toggle | null = null;

  function toggleRangeTo(place: Toggle) {
    if (lastPlace == null || lastPlace.group.groupName != place.group.groupName) return;

    for (let i = lastPlace.checkIndex + 1; i < place.checkIndex + 1; i++) {
      toggleYmap(yChecks, place.group.checks[i].name);
    }
  }

  function reset() {
    if (window.confirm('Are you sure you want to clear all checks?')) {
      const keys = Array.from(yChecks.keys());
      keys.map(k => yChecks.delete(k));
    }
  }
</script>

<main>
  <section class="section top-bar">
    <details class="details" open>
      <summary><strong class="interactable">Config</strong></summary>
      <div class="settings-container">
        <form class="pure-form pure-form-stacked">
          <fieldset>
            {#each Object.entries(settingNames) as [setting, name]}
              <label>
                <input
                  type="checkbox"
                  checked={$sSettings.get(setting) ?? false}
                  on:change|preventDefault={e => toggleYmap(ySettings, setting)}
                />
                {name}
              </label>
            {/each}
          </fieldset>
          <button class="pure-button" on:click|preventDefault={reset}>Clear/Reset</button>
        </form>
        <div>
          {#if connectionProvider == null}
            <form
              class="pure-form"
              on:submit|preventDefault={e => joinCoopRoom(e.target?.querySelector('#room-code-input').value)}
            >
              <fieldset>
                <input id="room-code-input" class="" type="text" placeholder="Room code" required pattern="[a-z0-9]+" />
                <button type="submit" class="pure-button">Join room</button>
              </fieldset>
            </form>
            <button class="pure-button" on:click={e => joinCoopRoom()}>Create new co-op room</button>
          {:else}
            <p>Connected to room: <code>{roomName}</code></p>
            <button class="pure-button" on:click={e => window.navigator.clipboard.writeText(window.location.href)}
              >Copy Link</button
            >
            <button class="pure-button" on:click={leaveCoopRoom}>Disconnect</button>
          {/if}
        </div>
      </div>
    </details>
  </section>
  <section class="section">
    <form class="pure-form">
      <input type="text" class="pure-u-1" placeholder="Filter..." bind:value={filter} />
    </form>
  </section>
  {#if filteredChecks != null}
    {#each filteredChecks as group}
      <section class="section">
        <CheckGroup
          groupName={group.groupName}
          canBeMq={group.canHaveMq}
          isMq={$sMqSettings.get(group.groupName) ?? false}
          on:toggleGroup={e => toggleWholeGroup(group)}
          on:toggleMq={e => toggleYmap(yMqSettings, group.groupName)}
        >
          {#each group.checks as check, checkIndex}
            <CheckItem
              name={check.shortName}
              type={check.type}
              checked={$sChecks.get(check.name) ?? false}
              tags={check.tags}
              on:click={e => {
                if (e.shiftKey) {
                  toggleRangeTo({ group, checkIndex });
                } else {
                  lastPlace = { group, checkIndex };
                  toggleYmap(yChecks, check.name);
                }
              }}
            />
          {/each}
        </CheckGroup>
      </section>
    {/each}
  {/if}
</main>

<style>
  main {
    margin: 10px;
  }

  .details {
    border: 1px solid lightgray;
    padding: 0.5em 1em 0.5em 1em;
    border-radius: 0.2em;
  }

  .settings-container {
    margin-top: 5px;
    display: flex;
    flex-wrap: wrap;

    > *:not(:last-child) {
      margin-right: 20px;
    }
  }
</style>
