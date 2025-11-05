<template>
  <div class="tutor-dashboard">
    <div class="container py-4">
      <div class="dashboard-header mb-4">
        <h1 class="fw-bold mb-2">
          <i class="bi bi-grid me-2"></i>
          Tutor Dashboard
        </h1>
        <p class="text-muted">Browse and apply to tutoring opportunities</p>
      </div>

      <SearchFilter :subjects="subjects" :filters="filters" :levels="levels" :locations="locations"
        :result-count="filteredJobs.length" @update:filters="updateFilters" />

      <LoadingState v-if="loading" :loading="true" message="Loading opportunities..." />

      <div v-else-if="filteredJobs.length === 0" class="text-center py-5">
        <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
        <h5 class="text-muted">No opportunities found</h5>
        <p class="text-muted">Try adjusting your filters</p>
      </div>

      <div v-else class="row g-4">
        <div
          v-for="job in paginatedJobs"
          :key="job.id"
          class="col-md-6 col-lg-4"
        >
          <JobCard :job="job" :appliedStatus="userApplications[job.id]" @apply="handleApply"
            @withdraw="handleWithdraw" />
        </div>
      </div>

      <!-- Pagination Controls -->
      <div
        v-if="filteredJobs.length > 0"
        class="d-flex justify-content-center align-items-center mt-4 gap-2"
      >
        <button
          class="btn btn-outline-primary btn-sm"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <i class="bi bi-chevron-left"></i>
          Previous
        </button>

        <span class="text-muted mx-3">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <button
          class="btn btn-outline-primary btn-sm"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          Next
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Application Modal Component -->
    <ApplicationModal
      ref="applicationModalRef"
      :job="selectedJob"
      modal-id="applicationModal"
      @application-submitted="handleApplicationSubmitted"
    />

    <!-- Withdraw Confirmation Modal -->
    <div class="modal fade" id="withdrawModal" tabindex="-1" aria-labelledby="withdrawModalLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="withdrawModalLabel">
              <i class="bi bi-exclamation-triangle me-2"></i>
              Confirm Withdrawal
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">Confirm application withdrawal? The parent will no longer see your application.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary text-white" data-bs-dismiss="modal">
              Cancel
            </button>
            <button type="button" class="btn btn-primary text-white" @click="confirmWithdraw">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Modal } from "bootstrap";
import { useRoute } from "vue-router";
import SearchFilter from "../components/SearchFilter.vue";
import JobCard from "../components/JobCard.vue";
import LoadingState from "../components/LoadingState.vue";
import ApplicationModal from "../components/ApplicationModal.vue";
import { useToast } from "../composables/useToast";

import {
  getSubjects,
  getLevels,
  getLocations,
} from "../services/firebase";
import {
  collection,
  getDocs,
  collectionGroup,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { getCurrentUser } from "../services/firebase";

const route = useRoute();
const toast = useToast();
const subjects = ref([]);
const levels = ref([]);
const locations = ref([]);

onMounted(async () => {
  subjects.value = await getSubjects();
  levels.value = ["All Levels", ...(await getLevels())];
  locations.value = await getLocations();
  
  // Apply search query from route if present
  if (route.query.search) {
    filters.value.search = route.query.search;
  }
});

const loading = ref(false);
const jobs = ref([]);
const filters = ref({
  subject: "",
  level: "",
  location: "",
  status: "",
  search: "",
});

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(9); // 9 cards (3x3 grid)

// Map assignmentId -> application status for current user
const userApplications = ref({});

const selectedJob = ref(null);
const applicationModalRef = ref(null);

let withdrawModal = null;
const pendingWithdrawJobId = ref(null);

onMounted(async () => {
  const withdrawElement = document.getElementById("withdrawModal");
  withdrawModal = new Modal(withdrawElement);

  // Load job postings
  await loadJobs();
  // Load current user's applications map
  try {
    const user = await getCurrentUser();
    if (user && user.uid) {
      const q = query(
        collectionGroup(db, "applications"),
        where("tutorId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data && data.assignmentId) {
          map[data.assignmentId] = data.status || "pending";
        }
      });
      userApplications.value = map;
    }
  } catch (e) {
    console.warn("Failed to load user applications map", e);
  }
});

const loadJobs = async () => {
  loading.value = true;
  try {
    // Load from Firestore 'assignments' collection
    const snap = await getDocs(collection(db, "assignments"));
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

    // Sort client-side by createdAt descending
    items.sort((a, b) => {
      const ta =
        a.createdAt && typeof a.createdAt === "string"
          ? Date.parse(a.createdAt)
          : a.createdAt && a.createdAt.seconds
            ? a.createdAt.seconds * 1000
            : 0;
      const tb =
        b.createdAt && typeof b.createdAt === "string"
          ? Date.parse(b.createdAt)
          : b.createdAt && b.createdAt.seconds
            ? b.createdAt.seconds * 1000
            : 0;
      return tb - ta;
    });

    jobs.value = items;
    loading.value = false;
  } catch (error) {
    console.error("Error loading jobs:", error);
    loading.value = false;
  }
};

const filteredJobs = computed(() => {
  return jobs.value.filter((job) => {
    
    const statusFilter = filters.value.status || "";
    if (job.status === "closed") {
      if (
        !((statusFilter === "rejected" &&
            userApplications.value[job.id] === "rejected") ||
          (statusFilter === "approved" &&
            userApplications.value[job.id] === "approved"))
      ) {
        return false;
      }
    }
    const norm = (s) => (s || "").toString().toLowerCase().trim();
    const matchesSubject =
      !filters.value.subject ||
      norm(job.subject) === norm(filters.value.subject);
    const matchesLevel =
      !filters.value.level || norm(job.level) === norm(filters.value.level);
    const matchesLocation = (() => {
      const f = (filters.value.location || "").toString().trim();
      if (!f) return true;
      const jobLoc = (job.location || "").toString();
      // match when filter is a substring of job location (case-insensitive)
      return norm(jobLoc).includes(norm(f));
    })();
    const matchesSearch =
      !filters.value.search ||
      job.title.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      job.description
        .toLowerCase()
        .includes(filters.value.search.toLowerCase());

    // Handle 'status' filter mapping: '', 'open', 'applied', 'rejected'
    // Note: statusFilter already declared above to support closed-assignment exception
    let matchesStatus = true;
    if (statusFilter === "open") {
      matchesStatus = job.status === "open";
    } else if (statusFilter === "applied") {
      matchesStatus = !!userApplications.value[job.id];
    } else if (statusFilter === "rejected") {
      matchesStatus = userApplications.value[job.id] === "rejected";
    } else if (statusFilter === "approved") {
      matchesStatus = userApplications.value[job.id] === "approved";
    }

    return (
      matchesSubject &&
      matchesLevel &&
      matchesLocation &&
      matchesSearch &&
      matchesStatus
    );
  });
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredJobs.value.length / itemsPerPage.value);
});

const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredJobs.value.slice(start, end);
});

const updateFilters = (newFilters) => {
  filters.value = { ...newFilters };
  currentPage.value = 1; // Reset to first page when filters change
};

const handleApply = (jobId) => {
  selectedJob.value = jobs.value.find((job) => job.id === jobId);
  if (applicationModalRef.value) {
    applicationModalRef.value.show();
  }
};

const handleApplicationSubmitted = async (jobId) => {
  // Mark this job as applied for the current user immediately (optimistic update)
  if (jobId) {
    userApplications.value = {
      ...userApplications.value,
      [jobId]: "pending",
    };
  }
  // Reload jobs to reflect updated status
  await loadJobs();
};

// handle Withdraw
async function handleWithdraw(jobId) {
  pendingWithdrawJobId.value = jobId;
  withdrawModal.show();
}

async function confirmWithdraw() {
  const jobId = pendingWithdrawJobId.value;
  if (!jobId) return;

  try {
    const user = await getCurrentUser();
    const existingQuery = query(
      collection(db, "assignments", jobId, "applications"),
      where("tutorId", "==", user.uid)
    );
    const existingSnap = await getDocs(existingQuery);

    await Promise.all(
      existingSnap.docs.map(docSnap =>
        deleteDoc(doc(db, "assignments", jobId, "applications", docSnap.id))
      )
    );

    await loadJobs();

    const updated = { ...userApplications.value }
    if (updated[jobId]) {
      delete updated[jobId]
      userApplications.value = updated
    }

  // Mark this job as open for the current user immediately (optimistic update)
  // userApplications.value = {
  //         ...userApplications.value,
  //         [jobId]: "open",
  //       };

  // Reload jobs to reflect updated status
  
  
    withdrawModal.hide();
    pendingWithdrawJobId.value = null;
    toast.success("Application withdrawn successfully", "Withdrawn");
    
  } catch (error) {
    console.error("Error withdrawal of application:", error);
    toast.error("Failed to withdraw from application. Please try again", "Error");
    withdrawModal.hide();
    pendingWithdrawJobId.value = null;
  }
}
</script>

<style scoped>
.dashboard-header {
  margin-bottom: 2rem;
}

.btn-outline-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Pagination styling */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

@media (max-width: 576px) {
  .pagination-controls {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
