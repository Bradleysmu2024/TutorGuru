<template>
  <div class="job-card card h-100 shadow-sm">
    <div class="card-body d-flex flex-column">
      <div class="d-flex justify-content-between align-items-start mb-3">
        <h5 class="card-title mb-0">{{ job.title }}</h5>
        <div class="d-flex align-items-center gap-2">
          <span
            v-if="job.files && job.files.length > 0"
            class="badge bg-light text-dark"
          >
            <i class="bi bi-paperclip me-1"></i>
            {{ job.files.length }} file{{ job.files.length !== 1 ? "s" : "" }}
          </span>
          <StatusBadge
            :status="displayStatus"
            :show-icon="true"
            :status-config="statusConfig"
          />
        </div>
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
            Posted {{ formatDate(job.createdAt) }}
          </small>
          <div class="d-flex gap-2 align-items-center">
            <button
              v-if="job.files && job.files.length > 0"
              class="btn btn-outline-secondary btn-sm"
              @click.stop.prevent="downloadFiles"
              title="Download attached files"
            >
              <i class="bi bi-download me-1"></i>
              Download
            </button>

            <button
              v-if="job.status !== 'closed'"
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
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from "vue";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import StatusBadge from "./StatusBadge.vue";

const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
  appliedStatus: {
    type: String,
    required: false,
    default: null,
  },
});

defineEmits(["apply"]);

// expose `job` for use inside the script (and template already uses `job`)
const job = props.job;

// Removed getStatusBadgeClass and getStatusIcon - now using StatusBadge component

// Compute display status for this card. If current user has applied and it's not rejected, show 'applied'.
const displayStatus = computed(() => {
  // If current user has an application for this job, show a per-user state
  if (props.appliedStatus) {
    if (props.appliedStatus === "approved") return "approved";
    if (props.appliedStatus === "rejected") return "rejected";
    return "applied";
  }

  // User hasn't applied. Show 'open' for open/pending assignments, 'closed' for closed ones
  if (job.status === "pending") return "open";

  return job.status || "open";
});

// Status badge configuration for extended statuses (applied, rejected, approved)
const statusConfig = {
  applied: {
    color: "primary",
    icon: "bi-person-check",
  },
  rejected: {
    color: "danger",
    icon: "bi-person-x",
  },
  approved: {
    color: "success",
    icon: "bi-check-circle",
  },
};

const formatDate = (dateVal) => {
  if (!dateVal) return "unknown";
  let postedDate = NaN;

  try {
    if (typeof dateVal === "object") {
      if (typeof dateVal.toDate === "function") {
        postedDate = dateVal.toDate();
      } else if (dateVal.seconds) {
        postedDate = new Date(dateVal.seconds * 1000);
      } else if (dateVal instanceof Date) {
        postedDate = dateVal;
      }
    }

    if (!postedDate && typeof dateVal === "string") {
      const ts = Date.parse(dateVal);
      if (!isNaN(ts)) postedDate = new Date(ts);
    }

    if (!postedDate) {
      const d = new Date(dateVal);
      if (!isNaN(d)) postedDate = d;
    }
  } catch (e) {}

  const now = new Date();
  // Zero out hours for day-diff consistency
  const diffTime = Math.abs(now - postedDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

const downloadFiles = async () => {
  try {
    if (!job.files || job.files.length === 0) return alert("No files attached");

    const zip = new JSZip();
    const folder = zip.folder(`assignment_${job.id || "files"}`) || zip;

    // Fetch each file as a blob and add to the zip
    const fetchPromises = (job.files || []).map(async (f) => {
      if (!f || !f.url) return null;
      try {
        const resp = await fetch(f.url);
        if (!resp.ok) throw new Error(`Failed to fetch ${f.name}`);
        const blob = await resp.blob();
        // Use original filename if present, otherwise use generated name
        const filename = f.name || `file_${Date.now()}`;
        folder.file(filename, blob);
        return true;
      } catch (err) {
        console.warn("Failed to fetch file for zipping", f, err);
        return false;
      }
    });

    const results = await Promise.all(fetchPromises);

    if (!results.some(Boolean)) {
      return alert("Failed to fetch any files for download");
    }

    const content = await zip.generateAsync({ type: "blob" });
    const zipName = `${(job.title || "assignment").replace(
      /[^a-z0-9_-]/gi,
      "_"
    )}_files.zip`;
    saveAs(content, zipName);
  } catch (err) {
    console.error("Error creating zip:", err);
    alert("Failed to create ZIP of files");
  }
};
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
