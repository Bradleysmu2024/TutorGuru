<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useRoute, useRouter } from "vue-router";
import {
  getAssignmentById,
  deleteAssignment,
  getAssignmentApplications,
  approveApplication,
  rejectApplication,
  getUsernameById,
  addEvent_,
  submitFeedback,
  getCurrentUser,
} from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import PaymentCard from "../components/PaymentCard.vue";
import StatusBadge from "../components/StatusBadge.vue";
import LoadingState from "../components/LoadingState.vue";

const route = useRoute();
const router = useRouter();
const assignment = ref(null);
const loading = ref(true);
const selectedTutorId = ref(null);
const assignmentMap = ref(null);
const applications = ref([]);
const selectedTutor = ref(null);

// Modal state for viewing tutor profile
const showTutorProfileModal = ref(false);
const selectedApplicant = ref(null);

// Feedback modal state
const showFeedbackModal = ref(false);
const feedbackRating = ref(5);
const feedbackComment = ref("");
const feedbackSubmitted = ref(false);
const currentUser = ref(null);

const hasReviewed = computed(() => {
  try {
    if (!assignment.value) return false;

    const reviews = assignment.value.review || [];
    if (!Array.isArray(reviews) || reviews.length === 0) return false;
    return true;
  } catch (e) {
    return false;
  }
});

const userReview = computed(() => {
  try {
    const reviews = assignment.value?.review || [];
    console.log('User reviews:', reviews[0].comment);
    if (!Array.isArray(reviews) || reviews.length === 0) return null;
    return (
      {comment: reviews[0].comment, rating: reviews[0].rating, reviewDate: reviews[0].createdAt} || null
    );
  } catch (e) {
    return null;
  }
});

const loadTutorDetails = async (tutorId) => {
  try {
    const tutorRef = doc(db, "users", tutorId);
    const tutorSnap = await getDoc(tutorRef);

    if (tutorSnap.exists()) {
      selectedTutor.value = {
        id: tutorSnap.id,
        ...tutorSnap.data(),
      };
    } else {
      const applicant = (assignment.value.applicants || []).find(
        (app) => app.id === tutorId
      );
      if (applicant) {
        selectedTutor.value = applicant;
      }
    }
  } catch (error) {
    console.error("Error loading tutor details:", error);
  }
};

const loadAssignment = async () => {
  loading.value = true;
  try {
    const assignmentId = route.params.id;
    // Try Firestore first
    const remote = await getAssignmentById(assignmentId);

    if (remote) {
      assignment.value = {
        ...remote,
        id: remote.id || assignmentId,
      };

      // Load applications from Firebase subcollection
      applications.value = await getAssignmentApplications(assignmentId);

      // If assignment has selectedTutorId, fetch tutor details
      if (remote.selectedTutorId) {
        await loadTutorDetails(remote.selectedTutorId);
      }
    } else {
      // No assignment found
      assignment.value = null;
    }

    loading.value = false;
  } catch (error) {
    console.error("Error loading assignment:", error);
    loading.value = false;
  }
};

// Load current user for feedback permissions
onMounted(async () => {
  try {
    currentUser.value = await getCurrentUser();
  } catch (err) {
    console.warn('Could not get current user for feedback permissions', err);
  }
});

const openFeedbackModal = () => {
  feedbackRating.value = 5;
  feedbackComment.value = "";
  showFeedbackModal.value = true;
};

const submitReviewHandler = async () => {
  if (hasReviewed.value) {
    alert('You have already submitted feedback for this assignment.');
    return;
  }
  try {
    const res = await submitFeedback(
      assignment.value?.id,
      feedbackRating.value,
      feedbackComment.value
    );
    if (res && res.success) {
      feedbackSubmitted.value = true;
      showFeedbackModal.value = false;
      await loadAssignment();
      alert('Thank you for your feedback');
    } else {
      throw new Error('Failed to submit feedback');
    }
  } catch (err) {
    console.error('Error submitting review', err);
    alert('Failed to submit review. Please try again.');
  }
};

// Removed getStatusBadgeClass - now using StatusBadge component

const downloadFile = (file) => {
  try {
    if (file && file.url) {
      // Open the file URL in a new tab/window
      window.open(file.url, '_blank')
    } else {
      alert('File not available for download.')
    }
  } catch (err) {
    console.error('Error downloading file:', err)
    alert('Failed to download file')
  }
};

const downloadAllFiles = async () => {
  try {
    const files = assignment.value.files || [];
    if (files.length === 0) return alert('No files to download');

    const zip = new JSZip();
    const folder = zip.folder(`assignment_${assignment.value.id || 'files'}`) || zip;

    const fetchPromises = (files || []).map(async (f) => {
      if (!f || !f.url) return null;
      try {
        const resp = await fetch(f.url);
        if (!resp.ok) throw new Error(`Failed to fetch ${f.name}`);
        const blob = await resp.blob();
        const filename = f.name || `file_${Date.now()}`;
        folder.file(filename, blob);
        return true;
      } catch (err) {
        console.warn('Failed to fetch file for zipping', f, err);
        return false;
      }
    });

    const results = await Promise.all(fetchPromises);

    if (!results.some(Boolean)) {
      return alert('Failed to fetch any files for download');
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const zipName = `${(assignment.value.title || 'assignment').replace(/[^a-z0-9_-]/gi, '_')}_files.zip`;
    saveAs(content, zipName);
  } catch (err) {
    console.error('Error downloading all files as zip:', err);
    alert('Failed to create ZIP of files');
  }
};

const viewTutorProfile = (application) => {
  selectedApplicant.value = application;
  showTutorProfileModal.value = true;
};

const closeProfileModal = () => {
  showTutorProfileModal.value = false;
  selectedApplicant.value = null;
};

// Start a chat with the selected applicant from the modal
const messageTutorFromModal = async () => {
  const app = selectedApplicant.value;
  const tutorIdentifier = await getUsernameById(app.tutorId);
  if (!app) return alert('No tutor selected');

  if (!tutorIdentifier) {
    return alert('Unable to start chat: missing tutor identifier.');
  }

  // Close modal then navigate to chat view with tutor query parameter
  showTutorProfileModal.value = false;
  selectedApplicant.value = null;
  router.push({ path: '/chat', query: { tutor: tutorIdentifier } });
};

const selectTutorForAssignment = async (application) => {
  if (
    !confirm(
      `Are you sure you want to select ${application.tutorName}? This will close the assignment and reject all other applicants.`
    )
  ) {
    return;
  }

  try {
    const result = await approveApplication(
      assignment.value.id,
      application.id,
      application.tutorId
    );

    if (result.success) {
      alert("Tutor selected successfully! The assignment has been closed.");
      // Reload assignment to reflect changes
      await loadAssignment();

  // console.log('app', application)
  // console.log('assignment', assignment.value)
  // application.tutorName
  // application.tutorId
  // application.tutorEmail
  //assignment.selectedDays ['Monday', 'Tuesday']
  //assignment.sessionDuration 2 (hour(s))
  //assignment.sessionsPerWeek 2 (visual data)
  //assignment.contractDuration 1 (month(s))

  function getWeekdayDatesInRange(startDate, endDate, weekdays) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const result = [];

        // Normalize to remove time
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        // Loop through all days in range
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          // getDay(): Sunday=0, Monday=1, ..., Saturday=6
          if (weekdays.includes(d.getDay())) {
            result.push(new Date(d)); // copy date
          }
        }

        return result;
      }

  function convertInput(input) {
    const date = new Date(input);

    // Format output
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}+08:00`;
  }

      const start = new Date(application.startDate)
      const end = new Date(start)
      end.setDate(start.getDate() + 30 * assignment.value.contractDuration)
      const days_obj = {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6
      }
      // console.log('test',assignment.value.selectedDays)
      const selected_days = assignment.value.selectedDays.map(day => days_obj[day]);
      let days = getWeekdayDatesInRange(start, end, selected_days);
      days = days.map(d => d.toDateString());
      console.log(days)

      const colors_obj = {
      default: "#039be5",   // blue (peacock)
      1: "#7986cb",         // soft purple (lavender)
      2: "#33b679",         // light green (sage)
      3: "#8e24aa",         // purple (grape)
      4: "#e67c73",         // pinkish red (flamingo)
      5: "#f6bf26",         // yellow (banana)
      6: "#f4511e",         // orange (tangerine)
      8: "#616161",         // grey (graphite)
      9: "#3f51b5",         // indigo blue (blueberry)
      10: "#0b8043",        // dark green (basil)
      11: "#d50000",        // bright red (tomato)
      };
      let randomColor = Object.values(colors_obj)[Math.floor(Math.random() * Object.values(colors_obj).length)];
      for (let d of days){
        let startDate = new Date(d)
        const timeStr = assignment.value.sessionStartTime || "12:00"; // default to "12:00"
        const [hours, minutes] = timeStr.split(":").map(Number)
        startDate.setHours(hours, minutes, 0, 0); // set hours, minutes, seconds, ms
        let endDate = new Date(d)
        endDate.setHours(startDate.getHours() + assignment.value.sessionDuration) // add session Duration to find out ending time
        startDate = convertInput(startDate)
        endDate = convertInput(endDate)
        console.log(startDate)
        console.log(endDate)
        await addEvent_('calendar', `${assignment.value.title} + ${assignment.value.subject}`, assignment.value.description, startDate, endDate, randomColor, assignment.value.parentId)
        await addEvent_('calendar', `${assignment.value.title} + ${assignment.value.subject}`, assignment.value.description, startDate, endDate, randomColor, application.tutorId)
      }

    } else {
      alert(`Failed to select tutor: ${result.error}`);
    }
  } catch (error) {
    console.error("Error selecting tutor:", error);
    alert("Failed to select tutor. Please try again.");
  }
};

const rejectTutorApplication = async (application) => {
  if (
    !confirm(
      `Are you sure you want to reject ${application.tutorName}'s application?`
    )
  ) {
    return;
  }

  try {
    const result = await rejectApplication(assignment.value.id, application.id);

    if (result.success) {
      alert("Application rejected.");
      await loadAssignment();
    } else {
      alert(`Failed to reject application: ${result.error}`);
    }
  } catch (error) {
    console.error("Error rejecting application:", error);
    alert("Failed to reject application. Please try again.");
  }
};

const formatDate = (date) => {
  if (!date) return "Unknown date";

  // Firestore Timestamp objects may have toDate() or seconds property
  try {
    let d = date;
    if (typeof d.toDate === "function") {
      d = d.toDate();
    } else if (d && typeof d.seconds === "number") {
      d = new Date(d.seconds * 1000);
    } else {
      d = new Date(d);
    }

    if (isNaN(d.getTime())) return "Unknown date";

    return d.toLocaleDateString("en-SG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return "Unknown date";
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const goBack = () => {
    router.push("/parent-dashboard"); // go to parent dashboard
};

const editAssignment = () => {
  // Navigate to PostAssignment page with edit mode
  router.push({
    path: "/post-assignment",
    query: {
      edit: "true",
      id: assignment.value.id || route.params.id,
    },
  });
};

const deleteAssignmentHandler = async () => {
  const assignmentTitle = assignment.value?.title || "this assignment";

  // Show confirmation dialog
  if (
    !confirm(
      `Are you sure you want to delete "${assignmentTitle}"?\n\n` +
        `This action cannot be undone. All applicants and data will be permanently removed.`
    )
  ) {
    return;
  }

  // Double confirmation for safety
  if (!confirm(`Final confirmation: Delete "${assignmentTitle}"?`)) {
    return;
  }

  try {
    const assignmentId = assignment.value?.id || route.params.id;

    if (!assignmentId) {
      alert("Assignment ID not found");
      return;
    }

    // Delete from Firestore
    const result = await deleteAssignment(assignmentId);

    if (!result?.success) {
      throw new Error(result?.error || "Failed to delete assignment");
    }

    alert("Assignment deleted successfully!");

    // Redirect to parent dashboard
    router.push({
      path: "/parent-dashboard",
      query: { refresh: Date.now().toString() },
    });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    alert(`Failed to delete assignment: ${error.message}`);
  }
};

// Initialize map for assignment location
const initializeMap = async () => {
  await nextTick(); // Wait for DOM to render

  if (!assignment.value?.lat || !assignment.value?.lng) {
    return;
  }

  // Clean up existing map if any
  if (assignmentMap.value) {
    assignmentMap.value.remove();
  }

  try {
    // Initialize map centered on assignment location
    assignmentMap.value = L.map("assignment-map").setView(
      [assignment.value.lat, assignment.value.lng],
      16 // Zoom level - closer view
    );

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(assignmentMap.value);

    // Custom marker icon (optional - using default for now)
    const marker = L.marker([assignment.value.lat, assignment.value.lng])
      .addTo(assignmentMap.value)
      .bindPopup(
        `
        <div style="text-align: center;">
          <strong>${assignment.value.title}</strong><br>
          <small>${
            assignment.value.formattedAddress || assignment.value.postalCode
          }</small>
        </div>
      `
      )
      .openPopup();
  } catch (error) {
    console.error("Error initializing map:", error);
  }
};

onMounted(async () => {
  await loadAssignment();
  // Initialize map after assignment is loaded
  if (assignment.value?.lat && assignment.value?.lng) {
    await initializeMap();
  }
});
</script>

<template>
  <div class="assignment-detail">
    <div class="container py-4">
      <button class="btn btn-outline-secondary mb-4" @click="goBack">
        <i class="bi bi-arrow-left me-2"></i>
        Back to Dashboard
      </button>

      <div v-if="loading">
        <LoadingState :loading="true" message="Loading assignment details..." />
      </div>

      <div v-else-if="!assignment" class="text-center py-5">
        <i class="bi bi-exclamation-circle fs-1 text-muted mb-3"></i>
        <h5 class="text-muted">Assignment not found</h5>
      </div>

      <div v-else>
        <div class="row g-4">
          <div class="col-lg-8">
            <div class="card shadow-sm mb-4">
              <div class="card-body">
                <div
                  class="d-flex justify-content-between align-items-start mb-3"
                >
                  <h2 class="fw-bold mb-0">{{ assignment.title }}</h2>
                  <StatusBadge :status="assignment.status" size="lg" />
                </div>

                <div class="assignment-meta mb-4">
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
                  <span class="badge bg-success me-2">
                    <i class="bi bi-cash me-2"></i>
                    {{ assignment.rate }}
                  </span>
                  <span 
                    v-if="assignment.location !== 'Online'"
                    class="badge bg-warning me-2"
                  >
                    <i class="bi bi-geo me-1"></i>
                    {{ assignment.postalCode }}
                  </span>
                </div>

                <div class="mb-4">
                  <h5 class="fw-semibold mb-2">Description</h5>
                  <p class="text-muted">{{ assignment.description }}</p>
                </div>

                <div class="mb-4">
                  <h5 class="fw-semibold mb-2">Requirements</h5>
                  <ul class="text-muted">
                    <li
                      v-for="(req, index) in assignment.requirements || []"
                      :key="index"
                    >
                      {{ req }}
                    </li>
                  </ul>
                </div>

                <div class="row g-3 mb-4">
                  <!-- Contract Duration, Tutoring Days, Session Duration -->
                  <div class="col-md-4">
                    <div class="detail-box">
                      <i class="bi bi-calendar-range text-info me-2"></i>
                      <div>
                        <small class="text-muted d-block">Contract Duration</small>
                        <strong>{{ assignment.contractDuration || assignment.duration }} month(s)</strong>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="detail-box">
                      <i class="bi bi-calendar-week text-primary me-2"></i>
                      <div>
                        <small class="text-muted d-block">Tutoring Days</small>
                        <strong v-if="assignment.selectedDays && assignment.selectedDays.length > 0">
                          {{ assignment.selectedDays.join(', ') }} ({{ assignment.selectedDays.length }})
                        </strong>
                        <strong v-else>
                          {{ assignment.sessionsPerWeek || 1 }}x per week
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="detail-box">
                      <i class="bi bi-clock text-warning me-2"></i>
                      <div>
                        <small class="text-muted d-block">Session Duration</small>
                        <strong>{{ assignment.sessionDuration || assignment.hoursPerSession || 1 }} hour(s)</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="row g-3 mb-4">
                  <!-- Student Grade, Hourly Rate -->
                  <div class="col-md-4">
                    <div class="detail-box">
                      <i class="bi bi-person text-info me-2"></i>
                      <div>
                        <small class="text-muted d-block">Student Grade</small>
                        <strong>{{ assignment.studentGrade }}</strong>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="detail-box">
                      <i class="bi bi-cash text-success me-2"></i>
                      <div>
                        <small class="text-muted d-block">Session Start Time</small>
                        <strong>{{ assignment.sessionStartTime }}</strong>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="detail-box">
                      <i class="bi bi-cash text-success me-2"></i>
                      <div>
                        <small class="text-muted d-block">Hourly Rate</small>
                        <strong>${{ assignment.rate }}/hr</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Location Map Section -->
                <div v-if="assignment.lat && assignment.lng" class="mb-4">
                  <h5 class="fw-semibold mb-3">
                    <i class="bi bi-map me-2"></i>
                    Location
                  </h5>
                  <div class="card border-0 shadow-sm">
                    <div class="card-body p-0">
                      <div
                        id="assignment-map"
                        style="
                          height: 300px;
                          border-radius: 0.75rem 0.75rem 0 0;
                        "
                      ></div>
                    </div>
                    <div class="card-footer bg-white border-0">
                      <div
                        class="d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <small class="text-muted d-block mb-1">Address</small>
                          <strong>{{
                            assignment.formattedAddress || assignment.postalCode
                          }}</strong>
                          <span class="badge bg-light text-dark ms-2">{{
                            assignment.location
                          }}</span>
                        </div>
                        <a
                          :href="`https://www.google.com/maps/search/?api=1&query=${assignment.lat},${assignment.lng}`"
                          target="_blank"
                          class="btn btn-sm btn-outline-primary"
                        >
                          <i class="bi bi-box-arrow-up-right me-1"></i>
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="(assignment.files || []).length > 0" class="mb-4">
                  <div
                    class="d-flex justify-content-between align-items-center mb-3"
                  >
                    <h5 class="fw-semibold mb-0">
                      <i class="bi bi-paperclip me-2"></i>
                      Assignment Materials
                    </h5>
                    <button
                      class="btn btn-sm btn-outline-primary"
                      @click="downloadAllFiles"
                    >
                      <i class="bi bi-download me-2"></i>
                      Download All (ZIP)
                    </button>
                  </div>
                  <div class="list-group">
                    <div
                      v-for="(file, index) in assignment.files || []"
                      :key="index"
                      class="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div class="d-flex align-items-center">
                        <i
                          class="bi bi-file-earmark-pdf text-danger me-3 fs-4"
                        ></i>
                        <div>
                          <div class="fw-semibold">{{ file.name }}</div>
                          <small class="text-muted">{{
                            formatFileSize(file.size)
                          }}</small>
                        </div>
                      </div>
                      <button
                        class="btn btn-sm btn-outline-primary"
                        @click="downloadFile(file)"
                      >
                        <i class="bi bi-download"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment Component -->
            <PaymentCard
              v-if="assignment"
              :assignment="assignment"
              :selected-tutor="selectedTutor"
              @payment-completed="openFeedbackModal"
            />

            <!-- Applicants Section -->
            <div
              v-if="
                (assignment.status === 'pending' ||
                  assignment.status === 'open') &&
                applications.length > 0
              "
              class="card shadow-sm"
            >
              <div class="card-body">
                <h5 class="fw-semibold mb-4">
                  <i class="bi bi-people me-2"></i>
                  Tutor Applications ({{ applications.length }})
                </h5>

                <div
                  v-for="application in applications.filter(
                    (app) => app.status === 'pending'
                  )"
                  :key="application.id"
                  class="applicant-card mb-3 p-3 border rounded"
                >
                  <div class="row align-items-center">
                    <div class="col-md-2 text-center">
                      <img
                        :src="
                          application.tutorAvatar ||
                          '/src/assets/images/profileplaceholder.JPG'
                        "
                        alt="Tutor"
                        class="rounded-circle img-fluid mb-2"
                        style="width: 80px; height: 80px; object-fit: cover"
                      />
                      <div class="rating" v-if="application.tutorRating">
                        <small class="text-warning"
                          >★ {{ application.tutorRating }}</small
                        >
                      </div>
                    </div>
                    <div class="col-md-7">
                      <h6 class="fw-bold mb-1">{{ application.tutorName }}</h6>
                      <p class="text-muted small mb-2">
                        {{ application.tutorEmail }}
                      </p>
                      <div class="mb-2" v-if="application.tutorExperience">
                        <small class="text-muted">
                          <i class="bi bi-briefcase me-1"></i>
                          {{ application.tutorExperience }} years experience
                        </small>
                      </div>
                      <div class="mb-2">
                        <small class="text-muted">
                          <i class="bi bi-calendar-event me-1"></i>
                          Available from:
                          {{
                            new Date(application.startDate).toLocaleDateString()
                          }}
                        </small>
                      </div>
                      <details class="mt-2">
                        <summary class="text-primary" style="cursor: pointer">
                          View Cover Letter
                        </summary>
                        <p class="text-muted small mt-2 ps-3">
                          {{ application.coverLetter }}
                        </p>
                      </details>
                      <small class="text-muted d-block mt-2">
                        Applied
                        {{ new Date(application.appliedAt).toLocaleString() }}
                      </small>
                    </div>
                    <div class="col-md-3 text-md-end mt-3 mt-md-0">
                      <button
                        class="btn btn-sm btn-outline-primary mb-2 w-100"
                        @click="viewTutorProfile(application)"
                      >
                        <i class="bi bi-person me-1"></i>
                        View Profile
                      </button>
                      <button
                        class="btn btn-sm btn-success w-100 mb-2"
                        @click="selectTutorForAssignment(application)"
                      >
                        <i class="bi bi-check-circle me-1"></i>
                        Select Tutor
                      </button>
                      <button
                        class="btn btn-sm btn-outline-danger w-100"
                        @click="rejectTutorApplication(application)"
                      >
                        <i class="bi bi-x-circle me-1"></i>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  v-if="
                    applications.filter((app) => app.status === 'pending')
                      .length === 0
                  "
                  class="text-center text-muted py-3"
                >
                  <i class="bi bi-inbox"></i>
                  <p class="mb-0">No pending applications</p>
                </div>
              </div>
            </div>

            <div
              v-else-if="assignment.status === 'open'"
              class="alert alert-info"
            >
              <i class="bi bi-info-circle me-2"></i>
              This assignment is open and waiting for tutor applications.
            </div>

            <div
              v-else-if="assignment.status === 'closed'"
              class="alert alert-success"
            >
              <i class="bi bi-check-circle me-2"></i>
              This assignment has been closed.
              <span v-if="selectedTutor">
                Tutor selected: <strong>{{ selectedTutor.name }}</strong>
              </span>
              <span v-else>
                A tutor has been selected for this assignment.
              </span>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="card shadow-sm sticky-top" style="top: 90px">
              <div class="card-body">
                <h6 class="fw-semibold mb-3">Assignment Info</h6>
                <div class="info-item mb-3">
                  <small class="text-muted d-block">Posted On</small>
                  <strong>{{ formatDate(assignment.createdAt) }}</strong>
                </div>
                <div class="info-item mb-3">
                  <small class="text-muted d-block">Status</small>
                  <StatusBadge :status="assignment.status" />
                </div>
                <div class="info-item mb-3">
                  <small class="text-muted d-block">Applications Received</small>
                  <strong>{{ applications.length }}</strong>
                </div>
                <hr />
                <div class="d-grid gap-2">
                  <button
                    class="btn btn-outline-primary btn-sm"
                    @click="editAssignment"
                  >
                    <i class="bi bi-pencil me-2"></i>
                    Edit Assignment
                  </button>
                  <button
                    class="btn btn-outline-danger btn-sm"
                    @click="deleteAssignmentHandler"
                  >
                    <i class="bi bi-trash me-2"></i>
                    Delete Assignment
                  </button>
                </div>
                <!-- Feedback card placed below Assignment Info card -->
                <div v-if="showFeedbackModal && !feedbackSubmitted && !hasReviewed" class="card mt-3 border-primary">
                  <div class="card-body">
                    <h6 class="fw-semibold mb-3"><i class="bi bi-star-fill text-warning me-2"></i>Leave Feedback</h6>
                    <div class="mb-3">
                      <label class="form-label">Rating</label>
                      <select v-model.number="feedbackRating" class="form-select">
                        <option v-for="n in 5" :key="n" :value="n">{{ n }} star{{ n>1 ? 's' : '' }}</option>
                      </select>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Comment</label>
                      <textarea v-model="feedbackComment" class="form-control" rows="3" placeholder="Share your experience..."></textarea>
                    </div>
                    <div class="d-flex gap-2">
                      <button class="btn btn-outline-secondary" @click="showFeedbackModal = false">Cancel</button>
                      <button class="btn btn-primary ms-auto" @click="submitReviewHandler">Submit Review</button>
                    </div>
                  </div>
                </div>
                <div v-if="feedbackSubmitted" class="alert alert-success mt-3">Thank you — your feedback has been submitted.</div>

                <!-- Display the user's submitted review if present -->
                <div v-if="userReview" class="card mt-3 border-success">
                  <div class="card-body">
                    <h6 class="fw-semibold mb-2"><i class="bi bi-star-fill text-warning me-2"></i>Your Review</h6>
                    <div class="mb-2">
                      <strong class="text-warning">{{ userReview.rating }} / 5</strong>
                    </div>
                    <div class="mb-2 text-muted">{{ userReview.comment }}</div>
                    <div class="small text-muted">Submitted: {{ formatDate(userReview.reviewDate) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tutor Profile Modal -->
    <div
      v-if="showTutorProfileModal && selectedApplicant"
      class="modal fade show"
      style="display: block; background-color: rgba(0, 0, 0, 0.5)"
      tabindex="-1"
      @click.self="closeProfileModal"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-person-circle me-2"></i>
              Tutor Profile
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeProfileModal"
            ></button>
          </div>
          <div class="modal-body">
            <div class="text-center mb-4">
              <img
                :src="
                  selectedApplicant.tutorAvatar ||
                  '/src/assets/images/profileplaceholder.JPG'
                "
                alt="Tutor"
                class="rounded-circle mb-3"
                style="width: 120px; height: 120px; object-fit: cover"
              />
              <h4 class="fw-bold mb-1">{{ selectedApplicant.tutorName }}</h4>
              <p class="text-muted mb-2">{{ selectedApplicant.tutorEmail }}</p>
              <div v-if="selectedApplicant.tutorRating" class="rating mb-3">
                <span class="text-warning fs-5"
                  >★ {{ selectedApplicant.tutorRating }}</span
                >
              </div>
            </div>

            <div class="row g-3">
              <div class="col-md-6">
                <div class="card bg-light border-0">
                  <div class="card-body text-center">
                    <i class="bi bi-briefcase fs-3 text-primary mb-2"></i>
                    <p class="mb-1 small text-muted">Experience</p>
                    <p class="fw-bold mb-0">
                      {{ selectedApplicant.tutorExperience || 0 }} years
                    </p>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card bg-light border-0">
                  <div class="card-body text-center">
                    <i class="bi bi-calendar-event fs-3 text-success mb-2"></i>
                    <p class="mb-1 small text-muted">Available From</p>
                    <p class="fw-bold mb-0">
                      {{
                        new Date(
                          selectedApplicant.startDate
                        ).toLocaleDateString()
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <!-- Subjects Taught Section -->
            <div
              v-if="selectedApplicant.tutorTeaching && selectedApplicant.tutorTeaching.length"
              class="mt-4"
            >
              <h6 class="fw-semibold mb-3">
                <i class="bi bi-book me-2"></i>
                Subjects Taught
              </h6>

              <div class="row g-3">
                <div
                  v-for="(subjectObj, idx) in selectedApplicant.tutorTeaching"
                  :key="idx"
                  class="col-12 col-sm-6 col-md-4"
                >
                  <div class="card h-100 border-0 bg-light shadow-sm p-3">
                    <h6 class="fw-semibold mb-2 text-primary text-truncate">
                      {{ subjectObj.subject }}
                    </h6>
                    <div class="d-flex flex-wrap gap-2">
                      <span
                        v-for="(lvl, i) in subjectObj.levels"
                        :key="i"
                        class="badge bg-secondary text-white"
                      >
                        {{ lvl }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4">
              <h6 class="fw-semibold mb-3">
                <i class="bi bi-file-text me-2"></i>
                Cover Letter
              </h6>
              <p class="text-muted">{{ selectedApplicant.coverLetter }}</p>
            </div>
            <!-- Tutor Credentials Section -->
            <div
              v-if="selectedApplicant.tutorDocuments && selectedApplicant.tutorDocuments.length"
              class="mt-4"
            >
              <h6 class="fw-semibold mb-3">
                <i class="bi bi-file-earmark-text me-2"></i>
                Credentials & Certifications
              </h6>

              <div class="list-group shadow-sm">
                <a
                  v-for="(doc, idx) in selectedApplicant.tutorDocuments"
                  :key="idx"
                  :href="doc.url"
                  target="_blank"
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center flex-wrap"
                >
                  <div>
                    <i class="bi bi-file-earmark-pdf text-danger me-2"></i>
                    <strong>{{ doc.name }}</strong>
                    <small class="d-block text-muted">
                      Uploaded on: {{ new Date(doc.uploadDate).toLocaleDateString() }}
                    </small>
                  </div>
                  <i class="bi bi-box-arrow-up-right text-primary"></i>
                </a>
              </div>
            </div>

            <div class="mt-4">
              <small class="text-muted">
                <i class="bi bi-clock me-1"></i>
                Applied on
                {{ new Date(selectedApplicant.appliedAt).toLocaleString() }}
              </small>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary text-white"
              @click="closeProfileModal"
            >
              Close
            </button>
            <button
              type="button"
              class="btn btn-primary text-white"
              @click="messageTutorFromModal"
            >
              <i class="bi bi-chat-left-text me-2"></i>
              Message Tutor
            </button>
            <button
              type="button"
              class="btn btn-success text-white"
              @click="
                selectTutorForAssignment(selectedApplicant);
                closeProfileModal();
              "
            >
              <i class="bi bi-check-circle me-2"></i>
              Select This Tutor
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- feedback card replaced modal; UI now appended below Assignment Info -->
</template>

<style scoped>
.card {
  border: none;
  border-radius: 0.75rem;
}

.assignment-meta .badge {
  font-weight: 500;
  padding: 0.4rem 0.6rem;
}

.detail-box {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}

.detail-box i {
  font-size: 1.5rem;
}

.applicant-card {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.applicant-card:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
}

.info-item {
  padding-bottom: 0.5rem;
}

@media (max-width: 991px) {
  .sticky-top {
    position: relative !important;
    top: 0 !important;
    margin-top: 1rem;
  }
}
</style>
