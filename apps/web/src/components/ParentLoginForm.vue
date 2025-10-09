<template>
  <div class="login-form">
    <h2>Parent Login</h2>
    <form>
      <div class="mb-3">
        <label for="parentEmail" class="form-label">Email address</label>
        <input type="email" class="form-control" id="parentEmail" aria-describedby="emailHelp">
      </div>
      <div class="mb-3">
        <label for="parentPassword" class="form-label">Password</label>
        <input type="password" class="form-control" id="parentPassword">
      </div>
      <button type="submit" class="btn btn-primary">Login</button>
    </form>
  </div>
</template>

<script setup>
</script>

<style scoped>
.login-form {
  width: 300px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
</style>