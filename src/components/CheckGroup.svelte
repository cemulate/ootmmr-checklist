<script>
  export let name = '';
  export let checks = [];
</script>

<div class="check-group">
  <div class="header">
    <p><strong>{name}</strong></p>
  </div>
  <table class="pure-table pure-table-horizontal">
    <tbody>
      <slot></slot>
    </tbody>
  </table>
</div>

<style>
  .header {
    border: 1px solid gray;

    p {
      margin: 2px 0 2px 0;
    }
  }
</style>
