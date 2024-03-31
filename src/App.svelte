<script>
  import * as Y from 'yjs';
  import { readableArray, readableMap } from 'svelt-yjs';
  import { WebrtcProvider } from 'y-webrtc';
  import { IndexeddbPersistence } from 'y-indexeddb';
  import { initializeStructuredChecks } from './util/util';
  import CheckGroup from './components/CheckGroup.svelte';
  import CheckItem from './components/CheckItem.svelte';

  // Top level yjs document; will be persisted locally via Indexeddb
  const ydoc = new Y.Doc();
  const persistenceProvider = new IndexeddbPersistence('local', ydoc);

  // The document will be shared with any WebRTC peers, if connected to a room
  let roomName = null;
  let connectionProvider = null;

  // Set hash any time roomName changes
  $: window.location.hash = roomName ?? '';

  function joinCoopRoom(name) {
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
  const yChecks = ydoc.getMap('checks');
  const sChecks = readableMap(yChecks);

  // The settings map controlling which checks to display
  const ySettings = ydoc.getMap('settings');
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
  const yMqSettings = ydoc.getMap('mqSettings');
  const sMqSettings = readableMap(yMqSettings);

  // This data structure details how checks are organized and displayed and their metadata
  let structuredChecks = null;

  // The source of this structure is a JSON file created at compile time
  initializeStructuredChecks().then(data => {
    structuredChecks = data;
  });

  // Global search/filter
  let filter = '';

  // From settings, craft the predicate that tells whether or not we should display a particular check
  $: checkPredicate = (group, check) => {
    const impliesSetting = (condition, setting) => !condition || ($sSettings.get(setting) ?? false);
    const matchesSettings =
      impliesSetting(check.type == 'gs', 'goldSkulltulas') &&
      impliesSetting(check.tags.includes('mm-skulltula'), 'mmSkulltulas') &&
      impliesSetting(check.type == 'scrub' && !check.tags.includes('special-scrub'), 'ootScrubs') &&
      impliesSetting(check.type == 'cow', 'cows') &&
      impliesSetting(check.type == 'sf', 'strayFairies') &&
      impliesSetting(check.tags.includes('setting-tcg'), 'ootTreasureChestGame') &&
      impliesSetting(check.tags.includes('setting-hideout-shuffle'), 'ootHideoutShuffle');

    const lowerFilter = filter.toLowerCase();
    const matchesFilter =
      filter.length == 0
        ? true
        : check.name.toLowerCase().includes(lowerFilter) || group.groupName.toLowerCase().includes(lowerFilter);

    const matchesMq =
      ($sMqSettings.get(group.groupName) ?? false) == (check.tags.includes('mq') || check.tags.includes('boss'));

    return matchesSettings && matchesFilter && matchesMq;
  };

  // Filter the structuredChecks, omitting entirely groups that are left with an empty array of checks
  $: filteredChecks = structuredChecks?.flatMap(group => {
    const filtered = group.checks.filter(checkPredicate.bind(this, group));
    return filtered.length == 0 ? [] : [{ ...group, checks: filtered }];
  });

  // Shorthand to toggle one of the Boolean-valued yMaps
  function toggleYmap(map, key, defaultVal = false) {
    map.set(key, !(map.get(key) ?? defaultVal));
  }

  // Toggle entire groups; if all checks are marked, unmark them all. Otherwise, mark them all.
  function toggleWholeGroup(group) {
    let newVal = !group.checks.every(({ name }) => yChecks.get(name) ?? false);
    group.checks.map(({ name }) => yChecks.set(name, newVal));
  }

  let lastToggle = null;
  function toggleRangeTo(group, checkIndex) {
    if (lastToggle == null || lastToggle.group.groupName != group.groupName) return;

    for (let i = lastToggle.checkIndex + 1; i < checkIndex + 1; i++) {
      toggleYmap(yChecks, group.checks[i].name);
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
              on:submit|preventDefault={e => joinCoopRoom(e.target.querySelector('#room-code-input').value)}
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
          canBeMq={group.canBeMq}
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
                  toggleRangeTo(group, checkIndex);
                } else {
                  lastToggle = { group, checkIndex };
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
