<script lang="ts">
  import * as T from '../data/types';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let type: T.CheckType = T.CheckType.chest;
  export let name = '';
  export let tags: T.Tag[] = [];
  export let state = T.CheckState.unchecked;

  $: checked = state == (T.CheckState.checked as T.CheckState);
  $: marked = state == (T.CheckState.marked as T.CheckState);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<button
  class="check-item interactable"
  class:checked
  class:marked
  on:click|preventDefault={e => dispatch('toggle', { range: e.shiftKey ?? false })}
  on:contextmenu|preventDefault={e => dispatch('mark')}
>
  <span class:crossed-out={checked}>{name}</span>
</button>

<style>
  .check-item {
    border: 1px solid lightblue;
    border-radius: 5px;
    padding: 5px;
    margin: 2px;
    user-select: none;
    text-align: left;

    background-color: var(--color-unchecked);

    &.marked {
      background-color: gold;
      font-weight: bold;
      box-shadow: rgba(0, 0, 0, 0.15) 2.4px 2.4px 3.2px;
    }

    &.checked {
      background-color: #eeeeee;
      opacity: 0.6;
    }

    &:focus {
      outline: 1px auto #129fea;
    }
  }
  .crossed-out {
    text-decoration-line: line-through;
    box-shadow: none;
  }
</style>
