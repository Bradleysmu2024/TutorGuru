<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { getCurrentUser } from "../services/firebase";
import { db, getAssignmentApplications } from "../services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import StatusBadge from "../components/StatusBadge.vue";
import LoadingState from "../components/LoadingState.vue";

const router = useRouter();
const loading = ref(false);
const assignments = ref([]);
const filterStatus = ref("all");
const applicationCounts = ref({});

let unsubscribe = null;

const startRealtimeListener = async () => {
  loading.value = true;
  try {
    const user = await getCurrentUser();
    if (!user || !user.uid) {
      assignments.value = [];
      loading.value = false;
      return;
    }

    console.debug(
      "[ParentDashboard] starting realtime listener for user",
      user.uid
    );
    const q = query(
      collection(db, "assignments"),
      where("parentId", "==", user.uid)
    );
    unsubscribe = onSnapshot(
      q,
      async (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // sort client-side by createdAt (ISO string or Firestore timestamp)
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
        assignments.value = items;

        // Load application counts for each assignment
        for (const assignment of items) {
          const applications = await getAssignmentApplications(assignment.id);
          applicationCounts.value[assignment.id] = applications.length;
        }
        loading.value = false;
        console.debug(
          "[ParentDashboard] realtime snapshot, count=",
          assignments.value.length
        );
      },
      (err) => {
        console.error("[ParentDashboard] realtime listener error", err);
        loading.value = false;
      }
    );
  } catch (err) {
    console.error("Error starting realtime listener:", err);
    loading.value = false;
  }
};

onMounted(() => {
  startRealtimeListener();
});

onUnmounted(() => {
  if (typeof unsubscribe === "function") unsubscribe();
});

const filteredAssignments = computed(() => {
  if (filterStatus.value === "all") return assignments.value;
  return assignments.value.filter((a) => a.status === filterStatus.value);
});

const viewAssignment = (assignmentId) => {
  router.push(`/assignment/${assignmentId}`);
};

const createNewAssignment = () => {
  router.push("/post-assignment");
};

const formatDate = (date) => {
  if (!date) return "Unknown date";
  let ts = null;
  if (typeof date === "string") {
    ts = Date.parse(date);
  } else if (date.seconds) {
    ts = date.seconds * 1000;
  } else if (date.toDate) {
    try {
      ts = date.toDate().getTime();
    } catch (e) {
      ts = null;
    }
  }
  if (!ts) return "Unknown date";
  return new Date(ts).toLocaleDateString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getApplicationCount = (assignmentId) => {
  return applicationCounts.value[assignmentId] || 0;
};
</script>

<template>
  <div class="parent-dashboard">
    <div class="container py-4">
      <div class="dashboard-header mb-4">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h1 class="fw-bold mb-2">
              <i class="bi bi-house-door me-2"></i>
              Parent Dashboard
            </h1>
            <p class="text-muted">
              Manage your assignment postings and tutor applications
            </p>
          </div>
          <button class="btn btn-primary" @click="createNewAssignment">
            <i class="bi bi-plus-circle me-2"></i>
            Post New Assignment
          </button>
        </div>
      </div>

      <div class="stats-row row g-3 mb-4">
        <div class="col-md-4">
          <div class="stat-card card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Total Postings</p>
                  <h3 class="fw-bold mb-0">{{ assignments.length }}</h3>
                </div>
                <i class="bi bi-file-text fs-1 text-primary"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Pending Review</p>
                  <h3 class="fw-bold mb-0">
                    {{
                      assignments.filter((a) => a.status === "pending").length
                    }}
                  </h3>
                </div>
                <i class="bi bi-clock-history fs-1 text-warning"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Active Tutors</p>
                  <h3 class="fw-bold mb-0">
                    {{
                      assignments.filter((a) => a.status === "closed").length
                    }}
                  </h3>
                </div>
                <i class="bi bi-person-check fs-1 text-success"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="filter-section mb-4">
        <div class="btn-group" role="group">
          <button
            type="button"
            class="btn btn-outline-primary"
            :class="{ active: filterStatus === 'all' }"
            @click="filterStatus = 'all'"
          >
            All
          </button>
          <button
            type="button"
            class="btn btn-outline-success"
            :class="{ active: filterStatus === 'open' }"
            @click="filterStatus = 'open'"
          >
            Open
          </button>
          <button
            type="button"
            class="btn btn-outline-warning"
            :class="{ active: filterStatus === 'pending' }"
            @click="filterStatus = 'pending'"
          >
            Pending
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary"
            :class="{ active: filterStatus === 'closed' }"
            @click="filterStatus = 'closed'"
          >
            Closed
          </button>
        </div>
      </div>

      <LoadingState
        v-if="loading"
        :loading="true"
        message="Loading assignments..."
      />

      <div
        v-else-if="filteredAssignments.length === 0"
        class="text-center py-5"
      >
        <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
        <h5 class="text-muted">No assignments found</h5>
        <p class="text-muted">Create your first assignment posting</p>
        <button class="btn btn-primary mt-3" @click="createNewAssignment">
          <i class="bi bi-plus-circle me-2"></i>
          Post Assignment
        </button>
      </div>

      <div v-else class="assignments-list">
        <div
          v-for="assignment in filteredAssignments"
          :key="assignment.id"
          class="assignment-card card shadow-sm mb-3"
          @click="viewAssignment(assignment.id)"
        >
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-md-8">
                <div class="d-flex align-items-start mb-2">
                  <h5 class="card-title mb-0 me-3">{{ assignment.title }}</h5>
                  <StatusBadge :status="assignment.status" :show-icon="true" />
                </div>
                <p class="text-muted mb-2">{{ assignment.description }}</p>
                <div class="assignment-meta">
                  <span class="badge bg-primary me-2">
                    <i class="bi bi-book me-1"></i>
                    {{ assignment.subject }}
                  </span>
                  <span class="badge bg-info me-2">
                    <i class="bi bi-mortarboard me-1"></i>
                    {{ assignment.level }}
                  </span>
                  <span class="badge bg-secondary me-2">
                    <i class="bi bi-geo-alt me-1"></i>
                    {{ assignment.location }}
                  </span>
                  <span
                    v-if="assignment.location !== 'Online'"
                    class="badge bg-warning me-2"
                  >
                    <i class="bi bi-geo me-1"></i>
                    {{ assignment.postalCode }}
                  </span>
                  <span class="badge bg-success">
                    <i class="bi bi-cash me-1"></i>
                    ${{ assignment.rate }}/hr
                  </span>
                </div>
              </div>
              <div class="col-md-4 text-md-end mt-3 mt-md-0">
                <div class="mb-2">
                  <small class="text-muted">
                    <i class="bi bi-calendar3 me-1"></i>
                    Posted {{ formatDate(assignment.createdAt) }}
                  </small>
                </div>
                <div v-if="assignment.status === 'pending'" class="mb-2">
                  <span class="badge bg-warning text-dark">
                    <i class="bi bi-people me-1"></i>
                    {{ getApplicationCount(assignment.id) }} Applicant{{
                      getApplicationCount(assignment.id) !== 1 ? "s" : ""
                    }}
                  </span>
                </div>
                <div
                  v-if="assignment.files && assignment.files.length > 0"
                  class="mb-2"
                >
                  <small class="text-muted">
                    <i class="bi bi-paperclip me-1"></i>
                    {{ (assignment.files || []).length }} file{{
                      (assignment.files || []).length !== 1 ? "s" : ""
                    }}
                  </small>
                </div>
                <router-link
                  class="btn btn-sm btn-outline-primary"
                  :to="`/assignment/${assignment.id}`"
                >
                  View Details
                  <i class="bi bi-arrow-right ms-2"></i>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-header {
  padding: 1rem 0;
}

.stat-card {
  border: none;
  border-radius: 0.75rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.assignment-card {
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.assignment-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

.assignment-meta .badge {
  font-weight: 500;
  padding: 0.4rem 0.6rem;
}

.filter-section .btn-group .btn {
  min-width: 100px;
}

@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 1.5rem;
  }

  .dashboard-header .btn {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
  }
}
</style>
