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
        <div v-for="job in filteredJobs" :key="job.id" class="col-md-6 col-lg-4">
          <!-- pass the current user's application status for this job (if any) -->
          <JobCard :job="job" :appliedStatus="userApplications[job.id]" @apply="handleApply"
            @withdraw="handleWithdraw" />
        </div>
      </div>
    </div>

    <!-- Application Modal  -->
    <div class="modal fade" id="applicationModal" tabindex="-1" aria-labelledby="applicationModalLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="applicationModalLabel">
              <i class="bi bi-send me-2"></i>
              Apply for Position
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedJob">
              <h6 class="fw-semibold mb-3">{{ selectedJob.title }}</h6>
              <form @submit.prevent="handleSubmitApplication">
                <div class="mb-3">
                  <label class="form-label">Cover Letter</label>
                  <textarea v-model="application.coverLetter" class="form-control" rows="4"
                    placeholder="Tell the parent why you're a great fit for this assignment..." required></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Available Start Date</label>
                  <input v-model="application.startDate" type="date" class="form-control" required />
                </div>
              </form>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary text-white" data-bs-dismiss="modal">
              Cancel
            </button>
            <button type="button" class="btn btn-primary text-white" @click="handleSubmitApplication">
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
  getEvent_,
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

    // check if tutor already apply a different session that clashes with this session
    async function getAssignmentsByIds(assignmentIds) {
      const assignmentsRef = collection(db, "assignments")
      const assignments = []

      // Split IDs into chunks of 10
      for (let i = 0; i < assignmentIds.length; i += 10) {
        const batch = assignmentIds.slice(i, i + 10)
        const q = query(assignmentsRef, where("__name__", "in", batch))
        const snap = await getDocs(q)
        snap.docs.forEach(doc => {
          assignments.push({ id: doc.id, ...doc.data() })
        })
      }

      return assignments
    }

    function getWeekdayDatesInRange(startDate, endDate, weekdays) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const result = [];

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (weekdays.includes(d.getDay())) {
          result.push(new Date(d));
        }
      }
      return result;
    }

    function expandAssignmentSessions(assignment) {
      const start = new Date(assignment.createdAt); // or assignment.startDate if you have it
      const end = new Date(start);
      end.setDate(start.getDate() + 30 * assignment.contractDuration);

      const days_obj = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      const weekdays = assignment.selectedDays.map(day => days_obj[day]);
      const dates = getWeekdayDatesInRange(start, end, weekdays);

      const [startHour, startMin] = assignment.sessionStartTime.split(':').map(Number);
      const durationMin = assignment.sessionDuration * 60;

      return dates.map(date => {
        const startTime = new Date(date);
        startTime.setHours(startHour, startMin, 0, 0);
        const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

        return { startTime, endTime };
      });
    }
    // output for one assignment example
    // [
    // { startTime: 2025-10-27T12:00:00, endTime: 2025-10-27T14:00:00 },
    // { startTime: 2025-10-28T12:00:00, endTime: 2025-10-28T14:00:00 },
    // ...
    // ]
    function expandCalendarEvents(calendarEvents) {
      return calendarEvents.map(ev => ({
        startTime: new Date(ev.start),
        endTime: new Date(ev.end)
      }));
    }

    function isOverlapping(a, b) {
      return a.startTime < b.endTime && b.startTime < a.endTime;
    }

    function hasScheduleConflict(existingAssignments, calendarEvents, newAssignment) {
      const newSessions = expandAssignmentSessions(newAssignment);

      // Expand old assignments
      const oldSessions = existingAssignments.flatMap(expandAssignmentSessions);

      // Expand calendar events
      const calendarSessions = expandCalendarEvents(calendarEvents);

      const allExistingSessions = [...oldSessions, ...calendarSessions];

      // Check if any new session overlaps
      for (const newSession of newSessions) {
        if (allExistingSessions.some(old => isOverlapping(old, newSession))) {
          return true;
        }
      }

      return false;
    }

    async function getEvents(type) {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        let querySnapshot = await getEvent_(type, user.uid);
        let events = [];
        if (querySnapshot) {
          querySnapshot.forEach((doc) => {
            // console.log(doc)
            // const data = doc.data()

            // Convert Firestore date fields to JS Date strings
            const startDate = new Date(doc.start); // assuming 'start' is stored as ISO string
            const endDate = new Date(doc.end); // assuming 'end' is stored as ISO string

            events.push({
              id: doc.id,
              ...doc,
              start: startDate, // e.g., "Sun Oct 12 2025 23:00:00 GMT+0800 (Singapore Standard Time)"
              end: endDate,
            });
            // console.log(doc.id, doc, 'start:', startDate, 'end:', endDate)
          });
        }
        // console.log(type, events);
        return events;
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    }

    if (user && user.uid) {
      const q = query(
        collectionGroup(db, "applications"),
        where("tutorId", "==", user.uid)
      )
      const snap = await getDocs(q)
      const applied = snap.docs.map(d => d.data())
      const assignmentIds = applied.map(a => a.assignmentId)

      // Fetch all assignments safely (even if >10)
      const assignments = await getAssignmentsByIds(assignmentIds)
      // console.log(assignments)

      // Fetch calendar event dates
      const calendarEvents = [
        ...(await getEvents("calendar")),
        ...(await getEvents("google")),
      ];

      const conflict = hasScheduleConflict(assignments, calendarEvents, selectedJob.value);
      // console.log('assignments', assignments)
      // console.log('calendarDates', calendarEvents)
      // console.log('selectedJob.value', selectedJob.value)

      if (conflict) {
        toast.warning("Schedule conflict detected! Unable to apply for this assignment.");
        applicationModal.hide();
        return

      } else {
        // console.log("No conflicts, safe to accept.");
        toast.info("No conflicts found, safe to accept this assignment.")
        setTimeout(() => {
          const cfm_apply = confirm("Confirm submission? The parent will see your application.")
          if (!cfm_apply) {
            applicationModal.hide();
            return
          }
        }, 100)
      }
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

// handle Withdraw
async function handleWithdraw(jobId) {
  const cfm_withdraw = confirm("Confirm application withdrawl? The parent will no longer see your application.")
  if (!cfm_withdraw) {
    return
  }
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
  
  

  } catch (error) {
    console.error("Error withdrawal of application:", error);
    toast.error("Failed to withdraw from application. Please try again", "Error");
  }
}
</script>
