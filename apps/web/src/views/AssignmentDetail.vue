<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { dummyParentAssignments, dummyTutorProfiles } from "../data/dummyData";
import {
  getAssignmentById,
  createPaymentRecord,
  deleteAssignment,
  getAssignmentApplications,
  approveApplication,
  rejectApplication,
  auth,
  db,
  getUsernameById,
} from "../services/firebase";
import { createPaymentSession } from "../services/stripe";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

const route = useRoute();
const router = useRouter();
const assignment = ref(null);
const loading = ref(true);
const selectedTutorId = ref(null);
const assignmentMap = ref(null);
const applications = ref([]); // Store applications from Firebase

// Payment-related state
const processing = ref(false);
const paymentStatus = ref(null);
const selectedTutor = ref(null);

// Modal state for viewing tutor profile
const showTutorProfileModal = ref(false);
const selectedApplicant = ref(null);

// Check if payment has been made for this assignment
const checkPaymentStatus = async (assignmentId) => {
  try {
    const paymentsRef = collection(db, "payments");
    const q = query(paymentsRef, where("assignmentId", "==", assignmentId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Get the most recent payment
      const payments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      payments.sort(
        (a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()
      );
      paymentStatus.value = payments[0];
      return payments[0];
    }

    return null;
  } catch (error) {
    console.error("Error checking payment status:", error);
    return null;
  }
};

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

      // Check payment status
      await checkPaymentStatus(assignmentId);

      // Load applications from Firebase subcollection
      applications.value = await getAssignmentApplications(assignmentId);

      // If assignment has a tutorId or selectedTutorId, fetch tutor details
      if (remote.tutorId || remote.selectedTutorId) {
        await loadTutorDetails(remote.tutorId || remote.selectedTutorId);
      }
    } else {
      // fallback to local dummy data for development
      assignment.value =
        dummyParentAssignments.find((a) => a.id === assignmentId) || null;

      // Load tutor profiles for applicants (if present) - for dummy data
      if (assignment.value && assignment.value.applicants) {
        assignment.value.applicants = (assignment.value.applicants || []).map(
          (app) => {
            const profile = dummyTutorProfiles.find((t) => t.id === app.id);
            return { ...app, ...profile };
          }
        );
      }
    }

    loading.value = false;
  } catch (error) {
    console.error("Error loading assignment:", error);
    loading.value = false;
  }
};

const isPaymentCompleted = computed(() => {
  return paymentStatus.value && paymentStatus.value.status === "completed";
});

const getStatusBadgeClass = (status) => {
  const classes = {
    open: "bg-success",
    pending: "bg-warning text-dark",
    closed: "bg-secondary",
  };
  return classes[status] || "bg-secondary";
};

const downloadFile = (file) => {
  // TODO: Implement actual file download
  console.log("Downloading file:", file.name);
  alert(`Downloading ${file.name}...`);
};

const downloadAllFiles = () => {
  // TODO: Implement zip download
  console.log("Downloading all files as zip");
  alert("Downloading all files as ZIP...");
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

const calculateTotalAmount = (assignment, tutor) => {
  const hourlyRate = Number(tutor?.rate || assignment?.rate || 0);
  const sessionsPerWeek = Number(assignment?.sessionsPerWeek || 1);
  const durationMonths = Number(assignment?.duration || 1);
  const hoursPerSession = Number(assignment?.hoursPerSession || 1);

  const totalSessions = sessionsPerWeek * 4 * durationMonths;
  return hourlyRate * totalSessions * hoursPerSession;
};

const calculateTotalSessions = (assignment) => {
  const sessionsPerWeek = Number(assignment?.sessionsPerWeek || 1);
  const durationMonths = Number(assignment?.duration || 1);
  return sessionsPerWeek * 4 * durationMonths;
};

const initiatePayment = async () => {
  const assignmentId = assignment.value?.id || route.params.id;

  if (!assignmentId || assignmentId === "undefined") {
    alert("Assignment data is missing. Please refresh the page.");
    return;
  }

  if (!assignment.value?.tutorId) {
    alert("No tutor has been selected for this assignment.");
    return;
  }

  if (!confirm("Proceed to payment for this assignment?")) {
    return;
  }

  processing.value = true;
  try {
    // Use the loaded tutor details or fetch if not available
    let tutor = selectedTutor.value;

    if (!tutor) {
      // Try to find from applicants list
      tutor = (assignment.value.applicants || []).find(
        (app) => app.id === assignment.value.tutorId
      );

      if (!tutor) {
        throw new Error("Tutor information not found. Please contact support.");
      }
    }

    // Calculate total amount
    const totalAmount = calculateTotalAmount(assignment.value, tutor);

    // Get current user ID (parent)
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("User not authenticated. Please log in.");
    }

    const existingPayment = await checkPaymentStatus(assignmentId);

    if (existingPayment && existingPayment.status === "completed") {
      alert("This assignment has already been paid for.");
      processing.value = false;
      return;
    }

    let paymentId;

    if (existingPayment && existingPayment.status === "pending") {
      paymentId = existingPayment.id;
      console.log("Reusing existing payment record:", paymentId);
    } else {
      paymentId = await createPaymentRecord(assignmentId, {
        tutorId: tutor.id,
        parentId: currentUser.uid,
        amount: totalAmount,
        assignmentTitle: assignment.value.title,
        tutorName: tutor.name || "Unknown Tutor",
        tutorRate: tutor.rate || assignment.value.rate,
      });
      console.log("Created new payment record:", paymentId);
    }

    // Pass both paymentId AND assignmentId
    await createPaymentSession({
      paymentId: paymentId,
      assignmentId: assignmentId, // Add this
      totalAmount: totalAmount,
      title: assignment.value.title,
      selectedTutor: tutor,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    alert(`Failed to initiate payment: ${error.message}`);
  } finally {
    processing.value = false;
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
  // Check if there's a previous page in history
  if (window.history.length > 1) {
    router.go(-1); // Go back to previous page
  } else {
    router.push("/parent-dashboard"); // Fallback to dashboard
  }
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

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
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
                  <span
                    class="badge"
                    :class="getStatusBadgeClass(assignment.status)"
                  >
                    {{ (assignment.status || "unknown").toUpperCase() }}
                  </span>
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
                  <span class="badge bg-warning">
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
                  <div class="col-md-4">
                    <div class="detail-box">
                      <i class="bi bi-calendar-week text-primary me-2"></i>
                      <div>
                        <small class="text-muted d-block"
                          >Sessions per Week</small
                        >
                        <strong>{{ assignment.sessionsPerWeek }}x</strong>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="detail-box">
                      <i class="bi bi-clock text-warning me-2"></i>
                      <div>
                        <small class="text-muted d-block">Duration</small>
                        <strong>{{ assignment.duration }}</strong>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="detail-box">
                      <i class="bi bi-person text-info me-2"></i>
                      <div>
                        <small class="text-muted d-block">Student Grade</small>
                        <strong>{{ assignment.studentGrade }}</strong>
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

            <!-- Payment Completed Alert -->
            <div v-if="isPaymentCompleted" class="alert alert-success mb-4">
              <div class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill fs-3 me-3"></i>
                <div>
                  <h5 class="mb-1">Payment Completed</h5>
                  <p class="mb-0">
                    This assignment has been paid for. Payment ID:
                    <code>{{ paymentStatus.id }}</code>
                  </p>
                  <small class="text-muted">
                    Paid on:
                    {{
                      paymentStatus.paidAt?.toDate().toLocaleString() ||
                      paymentStatus.createdAt?.toDate().toLocaleString()
                    }}
                  </small>
                </div>
              </div>
            </div>

            <!-- Payment Details Card (only if NOT paid) -->
            <div
              v-if="
                assignment.status === 'closed' &&
                assignment.tutorId &&
                !isPaymentCompleted
              "
              class="card shadow-sm mb-4 border-warning"
            >
              <div class="card-body">
                <h4 class="card-title">
                  <i class="bi bi-credit-card"></i> Payment Details
                </h4>

                <div class="row mb-3">
                  <div class="col-md-6">
                    <strong>{{
                      selectedTutor?.name || "Selected Tutor"
                    }}</strong>
                    <p class="text-muted mb-0">
                      ${{ selectedTutor?.rate || assignment.rate || 0 }}/hr
                    </p>
                  </div>
                </div>

                <table class="table">
                  <tbody>
                    <tr>
                      <td>Hourly Rate:</td>
                      <td class="text-end">
                        ${{ selectedTutor?.rate || assignment.rate || 0 }}
                      </td>
                    </tr>
                    <tr>
                      <td>Total Sessions:</td>
                      <td class="text-end">
                        {{ calculateTotalSessions(assignment) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Duration per Session:</td>
                      <td class="text-end">
                        {{ assignment.hoursPerSession || 1 }} hour(s)
                      </td>
                    </tr>
                    <tr>
                      <td>Contract Duration:</td>
                      <td class="text-end">
                        {{ assignment.duration }} month(s)
                      </td>
                    </tr>
                    <tr>
                      <td>Sessions per Week:</td>
                      <td class="text-end">
                        {{ assignment.sessionsPerWeek || 1 }}
                      </td>
                    </tr>
                    <tr class="table-success">
                      <td><strong>Total Amount:</strong></td>
                      <td class="text-end">
                        <strong class="text-success fs-5">
                          ${{
                            calculateTotalAmount(
                              assignment,
                              selectedTutor
                            ).toFixed(2)
                          }}
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <button
                  class="btn btn-primary w-100"
                  :disabled="processing"
                  @click="initiatePayment"
                >
                  <span v-if="processing">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Processing...
                  </span>
                  <span v-else>
                    <i class="bi bi-credit-card me-2"></i>
                    Proceed to Payment
                  </span>
                </button>

                <p class="text-center text-muted mt-2 mb-0">
                  <i class="bi bi-shield-check"></i> Secure payment powered by
                  Stripe
                </p>
              </div>
            </div>

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
                  <span
                    class="badge"
                    :class="getStatusBadgeClass(assignment.status)"
                  >
                    {{ (assignment.status || "unknown").toUpperCase() }}
                  </span>
                </div>
                <div
                  v-if="assignment.status === 'pending'"
                  class="info-item mb-3"
                >
                  <small class="text-muted d-block"
                    >Applications Received</small
                  >
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

            <div class="mt-4">
              <h6 class="fw-semibold mb-3">
                <i class="bi bi-file-text me-2"></i>
                Cover Letter
              </h6>
              <p class="text-muted">{{ selectedApplicant.coverLetter }}</p>
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
              class="btn btn-secondary"
              @click="closeProfileModal"
            >
              Close
            </button>
            <button
              type="button"
              class="btn btn-outline-primary"
              @click="messageTutorFromModal"
            >
              <i class="bi bi-chat-left-text me-2"></i>
              Message Tutor
            </button>
            <button
              type="button"
              class="btn btn-success"
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
