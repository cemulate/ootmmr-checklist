<script>
  export let name = '';
  export let checks = [];
</script>

<div class="check-group">
  <div class="header"><strong>{name}</strong></div>
  <div class="checks-container">
    <slot></slot>
  </div>
</div>

<style>
  .check-group {
    margin: 10px;
    border: 1px solid gray;
    border-radius: 10px;
    overflow: hidden;
  }
  .header {
    padding: 10px;
    background: lightgray;
    border-bottom: 1px solid gray;
  }
  .checks-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(max(350px, 25%), 1fr));
  }
</style>
