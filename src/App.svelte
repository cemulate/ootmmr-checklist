<script>
  import * as Y from 'yjs';
  import { readableArray, readableMap } from 'svelt-yjs';
  import { WebrtcProvider } from 'y-webrtc';
  import { IndexeddbPersistence } from 'y-indexeddb';
  import { initializeStructuredChecks } from './util/initialize';
  import CheckGroup from './components/CheckGroup.svelte';
  import CheckItem from './components/CheckItem.svelte';

  let ootChecks = null;

  const ydoc = new Y.Doc();
  // const connectionProvider = new WebrtcProvider('test-room', ydoc, { signaling: ['ws://192.168.1.100:5010'] });
  const persistenceProvider = new IndexeddbPersistence('local', ydoc);

  const ychecks = ydoc.getMap('checks');
  let sChecks = readableMap(ychecks);

  let structuredChecks = null;

  const localStructuredChecks = localStorage.getItem('structured-checks');
  if (localStructuredChecks == null) {
    initializeStructuredChecks().then(data => {
      structuredChecks = data;
    });
  } else {
    structuredChecks = JSON.parse(localStructuredChecks);
  }
</script>

<main>
  {#if structuredChecks != null}
    <div class="check-group-container">
    {#each Object.entries(structuredChecks.oot) as [group, checks]}
      <CheckGroup name={group}>
        {#each checks as check}
          <CheckItem
            name={check.name}
            type={check.type}
            checked={$sChecks.get(check.name) ?? false}
            on:toggle={e => sChecks.y.set(check.name, e.detail.state)}
          />
        {/each}
      </CheckGroup>
    {/each}
    </div>
  {/if}
</main>

<style>
</style>
