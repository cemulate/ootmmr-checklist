<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let type = '';
  export let name = '';
  export let checked = false;

  const toggle = event => {
    dispatch('toggle', { state: event.target.checked });
  };
</script>

<tr class="thin">
  <td>{type}</td>
  <td class:crossed-out={checked}>{name}</td>
  <td><input type="checkbox" bind:checked on:change={toggle} /></td>
</tr>

<style>
  tr.thin {
    line-height: 0;
    font-size: 0.9em;
  }
  .crossed-out {
    text-decoration-line: line-through;
  }
</style>
