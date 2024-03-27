<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let type = '';
  export let name = '';
  export let checked = false;

  const toggle = event => {
    dispatch('toggle', { state: event.target.checked });
  };

  const typeIcons = {
    'chest': '',
    'collectible': '',
    'cow': '🐮',
    'fairy': '🧚',
    'fairy_spot': '🧚',
    'fish': '🐟',
    'grass': '',
    'gs': '🕸️',
    'heart': '♥️',
    'npc': '🧑',
    'pot': '',
    'rupee': '',
    'scrub': '',
    'shop': '',
    'sr': '',
  };

</script>

<div class="check-item">
  <span>{typeIcons[type]}</span>
  <span class:crossed-out={checked}>{name}</span>
  <input type="checkbox" checked={checked} on:change={toggle}>
</div>

<style>
  .check-item {
    border: 1px solid #aaaaaa;
    border-radius: 4px;
    padding: 5px;
    margin: 2px;

    display: inline-flex;
    flex-direction: row;

    span:nth-child(2) {
      margin-right: auto;
    }
  }
  .crossed-out {
    text-decoration-line: line-through;
  }
</style>
