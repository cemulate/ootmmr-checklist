<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let type = '';
  export let name = '';
  export let tags = [];
  export let checked = false;

  const toggle = event => {
    dispatch('toggle', { state: event.target.checked });
  };

  const typeIcons = {
    chest: '',
    collectible: '',
    cow: '🐮',
    fairy: '🧚',
    fairy_spot: '🧚',
    fish: '🐟',
    grass: '',
    gs: '🕸️',
    heart: '♥️',
    npc: '🧑',
    pot: '',
    rupee: '',
    scrub: '',
    shop: '',
    sr: '',
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="interactable check-item" class:checked on:click|preventDefault>
  <span class:crossed-out={checked} style="margin-right: auto">{name}</span>
  <!-- <input type="checkbox" {checked} /> -->
</div>

<style>
  .check-item {
    border: 1px solid lightblue;
    border-radius: 5px;
    padding: 5px;
    margin: 2px;
    background-color: #fff2cc;
    /* box-shadow: rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px; */
    /* box-shadow: rgba(67, 71, 85, 0.27) 0px 0px 0.25em, rgba(90, 125, 188, 0.05) 0px 0.25em 1em; */
    box-shadow: rgba(0, 0, 0, 0.15) 2.4px 2.4px 3.2px;
    user-select: none;

    display: inline-flex;
    flex-direction: row;
  }
  .crossed-out {
    text-decoration-line: line-through;
  }

  .checked {
    background-color: #eeeeee;
    opacity: 0.6;
  }
</style>
