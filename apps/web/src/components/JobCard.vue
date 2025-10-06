<template>
  <div class="job-card card h-100 shadow-sm">
    <div class="card-body d-flex flex-column">
      <div class="d-flex justify-content-between align-items-start mb-3">
        <h5 class="card-title mb-0">{{ job.title }}</h5>
        <span class="badge bg-success">{{ job.status }}</span>
      </div>
      
      <div class="job-meta mb-3">
        <span class="badge bg-primary me-2">
          <i class="bi bi-book me-1"></i>
          {{ job.subject }}
        </span>
        <span class="badge bg-info me-2">
          <i class="bi bi-mortarboard me-1"></i>
          {{ job.level }}
        </span>
        <span class="badge bg-secondary">
          <i class="bi bi-geo-alt me-1"></i>
          {{ job.location }}
        </span>
      </div>
      
      <p class="card-text text-muted mb-3">{{ job.description }}</p>
      
      <div class="job-details mb-3">
        <div class="detail-item">
          <i class="bi bi-cash text-success me-2"></i>
          <span class="fw-semibold">{{ job.rate }}</span>
        </div>
        <div class="detail-item">
          <i class="bi bi-calendar-week text-primary me-2"></i>
          <span>{{ job.sessionsPerWeek }}x per week</span>
        </div>
        <div class="detail-item">
          <i class="bi bi-clock text-warning me-2"></i>
          <span>{{ job.duration }}</span>
        </div>
      </div>
      
      <div class="requirements mb-3">
        <h6 class="small fw-semibold mb-2">Requirements:</h6>
        <ul class="small text-muted mb-0">
          <li v-for="(req, index) in job.requirements.slice(0, 2)" :key="index">
            {{ req }}
          </li>
        </ul>
      </div>
      
      <div class="mt-auto">
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">
            <i class="bi bi-calendar3 me-1"></i>
            Posted {{ formatDate(job.postedDate) }}
          </small>
          <button 
            class="btn btn-primary btn-sm"
            @click="$emit('apply', job.id)"
          >
            <i class="bi bi-send me-1"></i>
            Apply Now
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  job: {
    type: Object,
    required: true
  }
})

defineEmits(['apply'])

const formatDate = (date) => {
  const now = new Date()
  const posted = new Date(date)
  const diffTime = Math.abs(now - posted)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}
</script>

<style scoped>
.job-card {
  border: none;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.job-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

.card-title {
  color: #2c3e50;
  font-size: 1.1rem;
}

.job-meta .badge {
  font-weight: 500;
  padding: 0.4rem 0.6rem;
}

.job-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}

.requirements ul {
  padding-left: 1.2rem;
  margin-bottom: 0;
}

.requirements li {
  margin-bottom: 0.25rem;
}

@media (max-width: 768px) {
  .job-card {
    margin-bottom: 1rem;
  }
}
</style>
