<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import FileUpload from "../components/FileUpload.vue";
import {
  getSubjects,
  getLevels,
  getLocations,
  createAssignment,
  updateAssignment,
  getAssignmentById,
  getLevelsWithGrades,
} from "../services/firebase";
import { getCurrentUser } from "../router/routes";
// import { createAssignment, uploadAssignmentFiles } from '../services/firebase'

const router = useRouter();
const route = useRoute();
const fileUploadRef = ref(null);
const selectedFiles = ref([]);
const submitting = ref(false);

// Edit mode
const isEditMode = ref(false);
const assignmentId = ref(null);

// Postal code validation states
const geocoding = ref(false);
const postalError = ref("");
const postalSuccess = ref(false);
const geocodedData = ref(null);

// Firebase data
const subjects = ref([]);
const levels = ref([]);
const locations = ref([]);
const levelsWithGrades = ref([]);

const formData = ref({
  title: "",
  subject: "",
  level: "",
  studentGrade: "",
  description: "",
  requirements: "",
  sessionsPerWeek: 2,
  duration: "",
  rate: "",
  location: "",
  postalCode: "",
  formattedAddress: "",
});

// Computed property to get grades for selected level
const availableGrades = computed(() => {
  if (!formData.value.level || formData.value.level === "All Levels") {
    return [];
  }
  const selectedLevel = levelsWithGrades.value.find(
    (level) => level.name === formData.value.level
  );
  return selectedLevel ? selectedLevel.grades : [];
});

// Watch for level changes and reset student grade
watch(
  () => formData.value.level,
  (newLevel, oldLevel) => {
    // Reset student grade when level changes
    if (newLevel !== oldLevel) {
      formData.value.studentGrade = "";
    }
  }
);

// Validate Singapore postal code
const isValidSGPostal = (v) => /^\d{6}$/.test((v || "").trim());

//OneMap geocoding helper
const geocodePostalCode = async (postal) => {
  const cleaned = (postal || "").trim();
  if (!isValidSGPostal(cleaned)) {
    throw new Error("Please enter a valid 6-digit Singapore postal code.");
  }

  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${cleaned}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to contact OneMap API.");

  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("No location found for that postal code.");
  }

  const result = data.results[0];
  const lat = parseFloat(result.LATITUDE);
  const lng = parseFloat(result.LONGITUDE);
  const address =
    result.ADDRESS ||
    `${result.BUILDING || ""} ${result.ROAD_NAME || ""}`.trim();

  return { lat, lng, formattedAddress: address, postalCode: cleaned };
};

// Auto-validate and geocode postal code
const validateAndGeocodePostal = async () => {
  postalError.value = "";
  postalSuccess.value = false;
  geocodedData.value = null;

  const postal = formData.value.postalCode?.trim();

  if (!postal) {
    postalError.value = "Please enter a postal code";
    return;
  }

  if (!isValidSGPostal(postal)) {
    postalError.value = "Please enter a valid 6-digit Singapore postal code";
    return;
  }

  geocoding.value = true;

  try {
    const result = await geocodePostalCode(postal);
    geocodedData.value = result;
    postalSuccess.value = true;

    // Auto-fill formatted address
    formData.value.formattedAddress = result.formattedAddress;

    // Auto-detect and fill location/region from postal code
    const postalDistrict = parseInt(postal.substring(0, 2));
    formData.value.location = getRegionFromPostalDistrict(postalDistrict);
  } catch (error) {
    postalError.value = error.message;
    geocodedData.value = null;
  } finally {
    geocoding.value = false;
  }
};

// Helper function to determine region from postal district
const getRegionFromPostalDistrict = (district) => {
  // Singapore postal district to region mapping
  const regionMap = {
    // Central: 01-08
    central: [1, 2, 3, 4, 5, 6, 7, 8],
    // North: 25-28, 72-73, 77-78
    north: [25, 26, 27, 28, 72, 73, 77, 78],
    // Northeast: 19-20, 28, 53-55, 82
    northeast: [19, 20, 28, 53, 54, 55, 82],
    // East: 13-17, 38-42, 45-47, 48-52
    east: [
      13, 14, 15, 16, 17, 38, 39, 40, 41, 42, 45, 46, 47, 48, 49, 50, 51, 52,
    ],
    // West: 21-24, 60-71
    west: [21, 22, 23, 24, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71],
  };

  for (const [region, districts] of Object.entries(regionMap)) {
    if (districts.includes(district)) {
      return region.charAt(0).toUpperCase() + region.slice(1); // Capitalize
    }
  }

  return "Central"; // Default fallback
};

// Load data from Firebase on component mount
onMounted(async () => {
  try {
    // Check if we're in edit mode
    if (route.query.edit && route.query.id) {
      isEditMode.value = true;
      assignmentId.value = route.query.id;
      
      // Load assignment data
      const assignment = await getAssignmentById(assignmentId.value);
      if (assignment) {
        // Pre-fill form with existing data
        formData.value = {
          title: assignment.title || "",
          subject: assignment.subject || "",
          level: assignment.level || "",
          studentGrade: assignment.studentGrade || "",
          description: assignment.description || "",
          requirements: Array.isArray(assignment.requirements) 
            ? assignment.requirements.join("\n") 
            : assignment.requirements || "",
          sessionsPerWeek: assignment.sessionsPerWeek || 2,
          duration: assignment.duration || "",
          rate: assignment.rate || "",
          location: assignment.location || "",
          postalCode: assignment.postalCode || "",
          formattedAddress: assignment.formattedAddress || "",
        };
        
        // If we have coordinates, mark postal as validated
        if (assignment.lat && assignment.lng) {
          geocodedData.value = {
            lat: assignment.lat,
            lng: assignment.lng,
            formattedAddress: assignment.formattedAddress,
            postalCode: assignment.postalCode
          };
          postalSuccess.value = true;
        }
      } else {
        alert("Assignment not found");
        router.push("/parent-dashboard");
      }
    }
    
    // Load dropdown data
    subjects.value = await getSubjects();
    levels.value = await getLevels();
    locations.value = await getLocations();
    levelsWithGrades.value = await getLevelsWithGrades();
  } catch (error) {
    console.error("Error loading form data:", error);
  }
});

const handleFilesSelected = (files) => {
  selectedFiles.value = files;
};

// Submit handler with OneMap integration
const submitAssignment = async () => {
  if (!validateForm()) return;
  submitting.value = true;

  try {
    const user = await getCurrentUser();
    if (!user || !user.uid) {
      alert("You must be logged in as a parent to post an assignment");
      submitting.value = false;
      return;
    }

    // Convert postal code to coordinates (use already geocoded data if available)
    let geo = geocodedData.value;
    if (!geo && formData.value.postalCode?.trim()) {
      // Fallback: geocode if not already done
      geo = await geocodePostalCode(formData.value.postalCode);
    }

    // Construct data to save
    const assignmentData = {
      ...formData.value,
      requirements: formData.value.requirements
        ? formData.value.requirements
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean)
        : [],
      files: [],
      ...(geo
        ? {
            lat: geo.lat,
            lng: geo.lng,
            formattedAddress: geo.formattedAddress,
            postalCode: geo.postalCode,
          }
        : {}),
    };

    let result;
    if (isEditMode.value && assignmentId.value) {
      // Update existing assignment
      result = await updateAssignment(assignmentId.value, assignmentData);
    } else {
      // Create new assignment
      result = await createAssignment(user.uid, assignmentData);
    }

    if (!result?.success) {
      throw new Error(result?.error || `Failed to ${isEditMode.value ? 'update' : 'create'} assignment`);
    }

    submitting.value = false;
    alert(`Assignment ${isEditMode.value ? 'updated' : 'posted'} successfully!`);
    router.push({
      path: "/parent-dashboard",
      query: { refresh: Date.now().toString() },
    });
  } catch (error) {
    console.error(`Error ${isEditMode.value ? 'updating' : 'posting'} assignment:`, error);
    alert(error?.message || `Failed to ${isEditMode.value ? 'update' : 'post'} assignment. Please try again.`);
    submitting.value = false;
  }
};

const validateForm = () => {
  if (
    !formData.value.title ||
    !formData.value.subject ||
    !formData.value.level
  ) {
    alert("Please fill in all required fields");
    return false;
  }

  // Require postal code verification
  if (!formData.value.postalCode) {
    alert("Please enter your postal code");
    return false;
  }

  if (!postalSuccess.value) {
    alert("Please verify your postal code by clicking the location button");
    return false;
  }

  return true;
};

const cancel = () => {
  router.push("/parent-dashboard");
};
</script>

<template>
  <div class="post-assignment">
    <div class="container py-4">
      <div class="page-header mb-4">
        <h1 class="fw-bold mb-2">
          <i class="bi bi-plus-circle me-2" v-if="!isEditMode"></i>
          <i class="bi bi-pencil me-2" v-else></i>
          {{ isEditMode ? 'Edit Assignment' : 'Post New Assignment' }}
        </h1>
        <p class="text-muted">{{ isEditMode ? 'Update your tutoring assignment' : 'Create a new tutoring assignment posting' }}</p>
      </div>

      <div class="row">
        <div class="col-lg-8">
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title mb-4">
                <i class="bi bi-info-circle me-2"></i>
                Assignment Details
              </h5>

              <form @submit.prevent="submitAssignment">
                <div class="mb-3">
                  <label class="form-label"
                    >Assignment Title <span class="text-danger">*</span></label
                  >
                  <input
                    v-model="formData.title"
                    type="text"
                    class="form-control"
                    placeholder="e.g., Help with Algebra Homework"
                    required
                  />
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label"
                      >Subject <span class="text-danger">*</span></label
                    >
                    <select
                      v-model="formData.subject"
                      class="form-select"
                      required
                    >
                      <option value="">Select subject</option>
                      <option
                        v-for="subject in subjects.slice(1)"
                        :key="subject"
                        :value="subject"
                      >
                        {{ subject }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label"
                      >Education Level <span class="text-danger">*</span></label
                    >
                    <select
                      v-model="formData.level"
                      class="form-select"
                      required
                    >
                      <option value="">Select level</option>
                      <option
                        v-for="level in levels"
                        :key="level"
                        :value="level"
                      >
                        {{ level }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-12">
                    <label class="form-label">Student Grade</label>
                    <select
                      v-model="formData.studentGrade"
                      class="form-select"
                      :disabled="
                        !formData.level || formData.level === 'All Levels'
                      "
                    >
                      <option value="">
                        {{
                          !formData.level || formData.level === "All Levels"
                            ? "Select education level first"
                            : "Select grade"
                        }}
                      </option>
                      <option
                        v-for="grade in availableGrades"
                        :key="grade"
                        :value="grade"
                      >
                        {{ grade }}
                      </option>
                    </select>
                    <small
                      v-if="!formData.level || formData.level === 'All Levels'"
                      class="text-muted"
                    >
                      Please select an education level above to see available
                      grades
                    </small>
                  </div>
                </div>

                <!-- Smart Postal Code Input -->
                <div class="col-12 mb-3">
                  <label class="form-label">
                    Location (Postal Code)
                    <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <input
                      v-model="formData.postalCode"
                      type="text"
                      class="form-control"
                      placeholder="Enter 6-digit postal code"
                      @blur="validateAndGeocodePostal"
                      @keyup.enter="validateAndGeocodePostal"
                      maxlength="6"
                      :class="{
                        'is-invalid': postalError,
                        'is-valid': postalSuccess,
                      }"
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="validateAndGeocodePostal"
                      :disabled="geocoding || !formData.postalCode"
                    >
                      <span
                        v-if="geocoding"
                        class="spinner-border spinner-border-sm"
                      ></span>
                      <i v-else class="bi bi-geo-alt"></i>
                    </button>
                  </div>
                  <div v-if="postalError" class="invalid-feedback d-block">
                    <i class="bi bi-exclamation-circle me-1"></i>
                    {{ postalError }}
                  </div>
                  <div v-if="postalSuccess" class="valid-feedback d-block">
                    <i class="bi bi-check-circle me-1"></i>
                    <strong>{{ formData.formattedAddress }}</strong>
                    <span class="ms-2 badge bg-success">{{
                      formData.location
                    }}</span>
                  </div>
                  <small class="text-muted d-block mt-1">
                    <i class="bi bi-info-circle me-1"></i>
                    We'll automatically detect your region and address
                  </small>
                </div>

                <div class="mb-3">
                  <label class="form-label"
                    >Description <span class="text-danger">*</span></label
                  >
                  <textarea
                    v-model="formData.description"
                    class="form-control"
                    rows="4"
                    placeholder="Describe what help your child needs..."
                    required
                  ></textarea>
                </div>

                <div class="mb-3">
                  <label class="form-label">Requirements</label>
                  <textarea
                    v-model="formData.requirements"
                    class="form-control"
                    rows="3"
                    placeholder="Enter each requirement on a new line&#10;e.g., Patient and encouraging&#10;Experience with O-Level curriculum"
                  ></textarea>
                  <small class="text-muted"
                    >Enter each requirement on a new line</small
                  >
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-4">
                    <label class="form-label">Sessions per Week</label>
                    <input
                      v-model.number="formData.sessionsPerWeek"
                      type="number"
                      class="form-control"
                      min="1"
                      max="7"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Duration</label>
                    <input
                      v-model="formData.duration"
                      type="text"
                      class="form-control"
                      placeholder="e.g., 3 months"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Hourly Rate</label>
                    <input
                      v-model="formData.rate"
                      type="text"
                      class="form-control"
                      placeholder="e.g., $40-50"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title mb-4">
                <i class="bi bi-paperclip me-2"></i>
                Assignment Materials (Optional)
              </h5>

              <FileUpload
                ref="fileUploadRef"
                title="Upload Assignment Files"
                description="Upload homework sheets, textbook pages, or other relevant materials"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                :multiple="true"
                :max-size="10485760"
                @files-selected="handleFilesSelected"
              />

              <small class="text-muted d-block mt-2">
                <i class="bi bi-info-circle me-1"></i>
                Tutors will be able to download these files to better prepare
                for the assignment
              </small>
            </div>
          </div>

          <div class="d-flex gap-3">
            <button
              type="button"
              class="btn btn-primary text-white"
              @click="submitAssignment"
              :disabled="submitting"
            >
              <span v-if="submitting">
                <span class="spinner-border spinner-border-sm me-2"></span>
                {{ isEditMode ? 'Updating...' : 'Posting...' }}
              </span>
              <span v-else>
                <i class="bi bi-check-circle me-2"></i>
                {{ isEditMode ? 'Update Assignment' : 'Post Assignment' }}
              </span>
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="cancel"
              :disabled="submitting"
            >
              Cancel
            </button>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card shadow-sm sticky-top" style="top: 90px">
            <div class="card-body">
              <h6 class="fw-semibold mb-3">
                <i class="bi bi-lightbulb me-2"></i>
                Tips for a Great Posting
              </h6>
              <ul class="small text-muted">
                <li class="mb-2">
                  Be specific about what help your child needs
                </li>
                <li class="mb-2">Mention any upcoming tests or deadlines</li>
                <li class="mb-2">
                  Include your child's current level and learning style
                </li>
                <li class="mb-2">
                  Upload relevant materials to help tutors prepare
                </li>
                <li class="mb-2">
                  Set a realistic budget based on the tutor's experience
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  padding: 1rem 0;
}

.card {
  border: none;
  border-radius: 0.75rem;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.text-danger {
  color: #dc3545;
}

@media (max-width: 991px) {
  .sticky-top {
    position: relative !important;
    top: 0 !important;
    margin-top: 1rem;
  }
}
</style>
