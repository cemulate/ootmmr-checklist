<script lang="ts">
  import * as T from '../data/types';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let type: T.CheckType = T.CheckType.chest;
  export let name = '';
  export let tags: T.Tag[] = [];
  export let checked = false;
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
