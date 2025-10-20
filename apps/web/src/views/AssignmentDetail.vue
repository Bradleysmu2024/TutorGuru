<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { dummyParentAssignments, dummyTutorProfiles } from "../data/dummyData";
import {
  getAssignmentById,
  createPaymentRecord,
  deleteAssignment,
  auth,
  db,
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
// import { getTutorApplications, selectTutor } from '../services/firebase'

const route = useRoute();
const router = useRouter();
const assignment = ref(null);
const loading = ref(true);
const selectedTutorId = ref(null);
const assignmentMap = ref(null);

// Payment-related state
const processing = ref(false);
const paymentStatus = ref(null);
const selectedTutor = ref(null);

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

      // If assignment has a tutorId, fetch tutor details
      if (remote.tutorId) {
        await loadTutorDetails(remote.tutorId);
      }
    } else {
      // fallback to local dummy data for development
      assignment.value =
        dummyParentAssignments.find((a) => a.id === assignmentId) || null;
    }

    // Load tutor profiles for applicants (if present)
    if (assignment.value && assignment.value.applicants) {
      assignment.value.applicants = (assignment.value.applicants || []).map(
        (app) => {
          // If applicant has an id, try enrich from dummy tutor profiles (development only)
          const profile = dummyTutorProfiles.find((t) => t.id === app.id);
          return { ...app, ...profile };
        }
      );
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

const viewTutorProfile = (tutorId) => {
  // TODO: Navigate to tutor profile view
  console.log("Viewing tutor profile:", tutorId);
};

const selectTutorForAssignment = async (tutorId) => {
  if (
    !confirm(
      "Are you sure you want to select this tutor? This action cannot be undone."
    )
  ) {
    return;
  }

  try {
    // TODO: Replace with Firebase call
    // await selectTutor(assignment.value.id, tutorId)

    console.log("Selecting tutor:", tutorId);
    alert("Tutor selected successfully!");
    router.push("/parent-dashboard");
  } catch (error) {
    console.error("Error selecting tutor:", error);
    alert("Failed to select tutor. Please try again.");
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
      id: assignment.value.id || route.params.id
    }
  });
};

const deleteAssignmentHandler = async () => {
  const assignmentTitle = assignment.value?.title || "this assignment";
  
  // Show confirmation dialog
  if (!confirm(
    `Are you sure you want to delete "${assignmentTitle}"?\n\n` +
    `This action cannot be undone. All applicants and data will be permanently removed.`
  )) {
    return;
  }

  // Double confirmation for safety
  if (!confirm(
    `Final confirmation: Delete "${assignmentTitle}"?`
  )) {
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
      query: { refresh: Date.now().toString() }
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
                assignment.status === 'pending' &&
                (assignment.applicants || []).length > 0
              "
              class="card shadow-sm"
            >
              <div class="card-body">
                <h5 class="fw-semibold mb-4">
                  <i class="bi bi-people me-2"></i>
                  Tutor Applications ({{
                    (assignment.applicants || []).length
                  }})
                </h5>

                <div
                  v-for="applicant in assignment.applicants || []"
                  :key="applicant.id"
                  class="applicant-card mb-3"
                >
                  <div class="row align-items-center">
                    <div class="col-md-2 text-center">
                      <img
                        :src="applicant.avatar"
                        alt="Tutor"
                        class="rounded-circle img-fluid mb-2"
                        style="width: 80px; height: 80px; object-fit: cover"
                      />
                      <div class="rating">
                        <small class="text-warning"
                          >★ {{ applicant.rating }}</small
                        >
                      </div>
                    </div>
                    <div class="col-md-7">
                      <h6 class="fw-bold mb-1">{{ applicant.name }}</h6>
                      <p class="text-muted small mb-2">{{ applicant.bio }}</p>
                      <div class="mb-2">
                        <span
                          class="badge bg-light text-dark me-1"
                          v-for="subject in applicant.subjects"
                          :key="subject"
                        >
                          {{ subject }}
                        </span>
                      </div>
                      <div class="mb-2">
                        <small class="text-muted">
                          <i class="bi bi-briefcase me-1"></i>
                          {{ applicant.experience }} years experience
                        </small>
                        <small class="text-muted ms-3">
                          <i class="bi bi-people me-1"></i>
                          {{ applicant.totalStudents }} students taught
                        </small>
                      </div>
                      <div class="mb-2">
                        <strong class="text-success">{{
                          applicant.rate
                        }}</strong>
                      </div>
                      <details class="mt-2">
                        <summary class="text-primary" style="cursor: pointer">
                          View Cover Letter
                        </summary>
                        <p class="text-muted small mt-2 ps-3">
                          {{ applicant.coverLetter }}
                        </p>
                      </details>
                    </div>
                    <div class="col-md-3 text-md-end mt-3 mt-md-0">
                      <button
                        class="btn btn-sm btn-outline-primary mb-2 w-100"
                        @click="viewTutorProfile(applicant.id)"
                      >
                        <i class="bi bi-person me-1"></i>
                        View Profile
                      </button>
                      <button
                        class="btn btn-sm btn-success w-100"
                        @click="selectTutorForAssignment(applicant.id)"
                      >
                        <i class="bi bi-check-circle me-1"></i>
                        Select Tutor
                      </button>
                    </div>
                  </div>
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
              v-else-if="assignment.status === 'closed' && !assignment.tutorId"
              class="alert alert-success"
            >
              <i class="bi bi-check-circle me-2"></i>
              This assignment has been closed. Tutor selected:
              <strong>{{
                assignment.selectedTutor
                  ? assignment.selectedTutor.name
                  : "Unknown"
              }}</strong>
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
                  <strong>{{ (assignment.applicants || []).length }}</strong>
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
