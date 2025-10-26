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

      <SearchFilter
        :subjects="subjects"
        :filters="filters"
        :levels="levels"
        :locations="locations"
        :result-count="filteredJobs.length"
        @update:filters="updateFilters"
      />

      <LoadingState
        v-if="loading"
        :loading="true"
        message="Loading opportunities..."
      />

      <div v-else-if="filteredJobs.length === 0" class="text-center py-5">
        <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
        <h5 class="text-muted">No opportunities found</h5>
        <p class="text-muted">Try adjusting your filters</p>
      </div>

      <div v-else class="row g-4">
        <div
          v-for="job in filteredJobs"
          :key="job.id"
          class="col-md-6 col-lg-4"
        >
          <!-- pass the current user's application status for this job (if any) -->
          <JobCard
            :job="job"
            :appliedStatus="userApplications[job.id]"
            @apply="handleApply"
          />
        </div>
      </div>
    </div>

    <!-- Application Modal  -->
    <div
      class="modal fade"
      id="applicationModal"
      tabindex="-1"
      aria-labelledby="applicationModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="applicationModalLabel">
              <i class="bi bi-send me-2"></i>
              Apply for Position
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedJob">
              <h6 class="fw-semibold mb-3">{{ selectedJob.title }}</h6>
              <form @submit.prevent="handleSubmitApplication">
                <div class="mb-3">
                  <label class="form-label">Cover Letter</label>
                  <textarea
                    v-model="application.coverLetter"
                    class="form-control"
                    rows="4"
                    placeholder="Tell the parent why you're a great fit for this assignment..."
                    required
                  ></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Available Start Date</label>
                  <input
                    v-model="application.startDate"
                    type="date"
                    class="form-control"
                    required
                  />
                </div>
              </form>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary text-white"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary text-white"
              @click="handleSubmitApplication"
            >
              <i class="bi bi-send me-2"></i>
              Submit Application
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
import SearchFilter from "../components/SearchFilter.vue";
import JobCard from "../components/JobCard.vue";
import LoadingState from "../components/LoadingState.vue";
import { useToast } from "../composables/useToast";

import {
  getSubjects,
  getLevels,
  getLocations,
  submitApplication,
} from "../services/firebase";
import {
  collection,
  getDocs,
  collectionGroup,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { getCurrentUser } from "../services/firebase";

const toast = useToast();
const subjects = ref([]);
const levels = ref([]);
const locations = ref([]);

onMounted(async () => {
  subjects.value = await getSubjects();
  levels.value = ["All Levels", ...(await getLevels())];
  locations.value = await getLocations();
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

// Map assignmentId -> application status for current user
const userApplications = ref({});

const selectedJob = ref(null);
const application = ref({
  coverLetter: "",
  startDate: "",
});

let applicationModal = null;

onMounted(async () => {
  // Initialize Bootstrap modal
  const modalElement = document.getElementById("applicationModal");
  applicationModal = new Modal(modalElement);

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

    // Sort client-side by createdAt (handle ISO strings and Firestore timestamps)
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
    // Exclude closed assignments from tutor view by default.
    // Exception: if the user explicitly filters for 'rejected' and this tutor's application was rejected,
    // show the closed assignment so the tutor can review their rejected applications.
    const statusFilter = filters.value.status || "";
    if (job.status === "closed") {
      // Allow closed assignments to pass only when the tutor explicitly filters
      // for rejected or approved applications and they have that application state.
      if (
        !(
          (statusFilter === "rejected" &&
            userApplications.value[job.id] === "rejected") ||
          (statusFilter === "approved" &&
            userApplications.value[job.id] === "approved")
        )
      ) {
        return false;
      }
      // otherwise allow closed+rejected/approved for this tutor to pass through
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

const updateFilters = (newFilters) => {
  filters.value = { ...newFilters };
};

const handleApply = (jobId) => {
  selectedJob.value = jobs.value.find((job) => job.id === jobId);
  application.value = {
    coverLetter: "",
    startDate: "",
  };
  applicationModal.show();
};

// validation so ppl wont submit empty or past dates
const handleSubmitApplication = async () => {
  // Validate inputs
  if (!application.value.coverLetter.trim()) {
    toast.warning(
      "Please write a cover letter before submitting your application",
      "Cover Letter Required"
    );
    return;
  }

  if (!application.value.startDate) {
    toast.warning(
      "Please select an available start date from the assignment",
      "Start Date Required"
    );
    return;
  }

  // Validate that start date is not in the past
  const selectedDate = new Date(application.value.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to beginning of day for comparison

  if (selectedDate < today) {
    toast.warning(
      "Start date cannot be in the past. Please select a future date",
      "Invalid Date"
    );
    return;
  }

  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user || !user.uid) {
      toast.error(
        "You must be logged in to apply for assignments",
        "Authentication Required"
      );
      return;
    }

    // Submit application to Firebase
    const result = await submitApplication(
      selectedJob.value.id,
      user.uid,
      application.value
    );

    if (result.success) {
      toast.success(
        "Your application has been submitted successfully!",
        "Application Submitted"
      );
      applicationModal.hide();

      // Mark this job as applied for the current user immediately (optimistic update)
      if (selectedJob.value && selectedJob.value.id) {
        userApplications.value = {
          ...userApplications.value,
          [selectedJob.value.id]: "pending",
        };
      }
      // Reload jobs to reflect updated status
      await loadJobs();
    } else {
      toast.error(
        `Failed to submit application: ${result.error}`,
        "Submission Failed"
      );
    }
  } catch (error) {
    console.error("Error submitting application:", error);
    toast.error("Failed to submit application. Please try again", "Error");
  }
};
</script>
