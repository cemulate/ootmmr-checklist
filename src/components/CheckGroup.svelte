<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let groupName = '';
  export let canBeMq = false;
  export let isMq = false;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="check-group">
  <h3 class="header">
    <span class="interactable" on:click|preventDefault={e => dispatch('toggleGroup')} style="margin-right: 5px"
      ><strong>{groupName}</strong></span
    >
    {#if canBeMq}
      <span class="interactable" on:click|preventDefault={e => dispatch('toggleMq')}
        ><strong>{isMq ? '(MQ)' : '(Vanilla)'}</strong></span
      >
    {/if}
  </h3>
  <div class="checks-container">
    <slot />
  </div>
</div>

<style>
  .header {
    color: #777;
    border-bottom: 1px solid #777;
    font-weight: normal;
    width: 100%;
    user-select: none;
  }

  .checks-container {
    margin: 5px;
    display: grid;
    /* https://css-tricks.com/an-auto-filling-css-grid-with-max-columns/ */
    grid-template-columns: repeat(auto-fill, minmax(max(250px, 12%), 1fr));
  }
</style>
