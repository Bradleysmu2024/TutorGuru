<script setup>
// No reactive state or scroll handlers needed for this static navbar
</script>

<template>
  <nav class="navbar navbar-expand-lg bg-white border-bottom sticky-top py-2">
    <div class="container">
      <a class="navbar-brand fw-bold fs-4" href="#">TutorGuru</a>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNav"
        aria-controls="mainNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav ms-auto align-items-lg-center gap-3">
          <li class="nav-item"><a class="nav-link" href="#">Find Tutors</a></li>
          <li class="nav-item"><a class="nav-link" href="#">Assignments</a></li>
          <li class="nav-item"><a class="nav-link" href="#">Profile</a></li>
          <li class="nav-item">
            <a class="btn btn-outline-primary rounded-pill px-3" href="#">Sign In</a>
          </li>
          <li class="nav-item">
            <a class="btn btn-warning rounded-pill text-white px-3" href="#">Join</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.btn-outline-primary {
  color: var(--tg-navy);
  border-color: var(--tg-navy);
}
.btn-outline-primary:hover {
  background-color: var(--tg-navy);
  color: #fff;
}
.btn-warning {
  background-color: var(--tg-gold);
  border-color: var(--tg-gold);
}
.btn-warning:hover {
  background-color: #b99355;
  border-color: #b99355;
}
</style>
