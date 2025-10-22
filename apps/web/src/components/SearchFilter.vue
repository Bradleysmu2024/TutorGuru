<template>
  <div class="search-filter-card card shadow-sm mb-4">
    <div class="card-body">
      <h5 class="card-title mb-4">
        <i class="bi bi-funnel me-2"></i>
        Filter Opportunities
      </h5>

      <div class="row g-3">
        <div class="col-md-6 col-lg-3">
          <label class="form-label small fw-semibold">Subject</label>
          <select
            v-model="localFilters.subject"
            class="form-select"
            @change="emitFilters"
          >
            <option
              v-for="subject in subjects"
              :key="subject"
              :value="subject === 'All Subjects' ? '' : subject"
            >
              {{ subject }}
            </option>
          </select>
        </div>

        <div class="col-md-6 col-lg-3">
          <label class="form-label small fw-semibold">Level</label>
          <select
            v-model="localFilters.level"
            class="form-select"
            @change="emitFilters"
          >
            <option
              v-for="level in levels"
              :key="level"
              :value="level === 'All Levels' ? '' : level"
            >
              {{ level }}
            </option>
          </select>
        </div>

        <div class="col-md-6 col-lg-3">
          <label class="form-label small fw-semibold">Location</label>
          <select
            v-model="localFilters.location"
            class="form-select"
            @change="emitFilters"
          >
            <option
              v-for="location in locations"
              :key="location"
              :value="location === 'All Locations' ? '' : location"
            >
              {{ location }}
            </option>
          </select>
        </div>

          <div class="col-md-6 col-lg-3">
            <label class="form-label small fw-semibold">Status</label>
            <select
              v-model="localFilters.status"
              class="form-select"
              @change="emitFilters"
            >
              <option :value="''">All</option>
              <option :value="'open'">Open</option>
              <!-- 'Applied' shows postings the current tutor has applied to -->
              <option :value="'applied'">Applied</option>
              <!-- 'Rejected' shows postings where the current tutor's application was rejected -->
              <option :value="'rejected'">Rejected</option>
              <option :value="'approved'">Approved</option>
            </select>
            <div v-if="localFilters.status === 'rejected'" class="mt-2 small text-muted">
              Showing closed assignments where your application was rejected. Other closed assignments remain hidden.
            </div>
            <div v-else-if="localFilters.status === 'approved'" class="mt-2 small text-muted">
              Showing assignments where you were selected (approved). These may be closed.
            </div>
          </div>

        <div class="col-md-6 col-lg-3">
          <label class="form-label small fw-semibold">Search</label>
          <div class="input-group">
            <input
              v-model="localFilters.search"
              type="text"
              class="form-control"
              placeholder="Keywords..."
              @input="emitFilters"
            />
            <button class="btn btn-outline-secondary" type="button">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="mt-3 d-flex justify-content-between align-items-center">
        <button class="btn btn-sm btn-outline-secondary" @click="clearFilters">
          <i class="bi bi-x-circle me-1"></i>
          Clear Filters
        </button>
        <span class="text-muted small"
          >{{ resultCount }} opportunities found</span
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  subjects: { type: Array, default: () => [] },
  levels: { type: Array, default: () => [] },
  locations: { type: Array, default: () => [] },
  filters: {
    type: Object,
    default: () => ({}),
  },
  resultCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["update:filters"]);

const localFilters = ref({
  subject: props.filters.subject || "",
  level: props.filters.level || "",
  location: props.filters.location || "",
  status: props.filters.status || "",
  search: props.filters.search || "",
});

const emitFilters = () => {
  emit("update:filters", { ...localFilters.value });
};

const clearFilters = () => {
  localFilters.value = {
    subject: "",
    level: "",
    location: "",
    search: "",
  };
  emitFilters();
};
</script>

<style scoped>
.search-filter-card {
  border: none;
  border-radius: 0.75rem;
}

.form-select,
.form-control {
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
  transition: all 0.3s ease;
}

.form-select:focus,
.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
}

.form-label {
  color: #495057;
  margin-bottom: 0.5rem;
}
</style>
