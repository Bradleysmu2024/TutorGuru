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
  uploadFile,
} from "../services/firebase";
import { getCurrentUser } from '../services/firebase'
import { usePostalCodeGeocoding } from "../composables/usePostalCodeGeocoding";

const router = useRouter();
const route = useRoute();
const fileUploadRef = ref(null);
const selectedFiles = ref([]);
const submitting = ref(false);

// Edit mode
const isEditMode = ref(false);
const assignmentId = ref(null);

// Use postal code geocoding composable
const {
  geocoding,
  postalError,
  postalSuccess,
  geocodedData,
  validateAndGeocode,
  resetValidation,
} = usePostalCodeGeocoding();

// Online mode
const isOnline = ref(false);

// Firebase data
const subjects = ref([]);
const levels = ref([]);
const locations = ref([]);
const levelsWithGrades = ref([]);

const formData = ref({
  title: '',
  subject: '',
  level: '',
  studentGrade: '',
  description: '',
  requirements: [],
  contractDuration: 1, 
  sessionDuration: 1,
  sessionStartTime: '12:00',
  rate: 40,
  rating: NaN,
  selectedDays: [], // Array of day names ['Monday', 'Wednesday']
  location: '',
  postalCode: '',
  lat: null,
  lng: null,
  files: []
})

// Days of the week options
const daysOfWeek = [
  { value: 'Monday', label: 'Mon', fullLabel: 'Monday' },
  { value: 'Tuesday', label: 'Tue', fullLabel: 'Tuesday' },
  { value: 'Wednesday', label: 'Wed', fullLabel: 'Wednesday' },
  { value: 'Thursday', label: 'Thu', fullLabel: 'Thursday' },
  { value: 'Friday', label: 'Fri', fullLabel: 'Friday' },
  { value: 'Saturday', label: 'Sat', fullLabel: 'Saturday' },
  { value: 'Sunday', label: 'Sun', fullLabel: 'Sunday' }
]

// Toggle day selection
const toggleDay = (day) => {
  const index = formData.value.selectedDays.indexOf(day)
  if (index > -1) {
    formData.value.selectedDays.splice(index, 1)
  } else {
    formData.value.selectedDays.push(day)
  }
}

// Computed: sessions per week (derived from selected days)
const sessionsPerWeek = computed(() => formData.value.selectedDays.length)


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

// Watch for online mode changes
watch(isOnline, (newValue) => {
  if (newValue) {
    // When switching to online mode
    formData.value.location = "Online";
    formData.value.postalCode = "";
    formData.value.formattedAddress = "";
    resetValidation();
  } else {
    // When switching to physical location
    formData.value.location = "";
  }
});

// Auto-validate and geocode postal code
const validateAndGeocodePostal = async () => {
  const result = await validateAndGeocode(formData.value.postalCode, {
    includeCoordinates: true,
  });

  if (result.success) {
    // Update form data with geocoded information
    formData.value.formattedAddress = result.data.formattedAddress;
    formData.value.location = result.data.location;
  }
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
          contractDuration: assignment.contractDuration || 1,
          sessionDuration: assignment.sessionDuration || 1,
          sessionStartTime: assignment.sessionStartTime || '12:00',
          rate: assignment.rate || 40,
          selectedDays: assignment.selectedDays || [], // Load selected days
          location: assignment.location || "",
          postalCode: assignment.postalCode || "",
          formattedAddress: assignment.formattedAddress || "",
        };

        // Check if assignment is online
        if (assignment.location === "Online") {
          isOnline.value = true;
        }

  // If we have coordinates, mark postal as validated
        if (assignment.lat && assignment.lng) {
          geocodedData.value = {
            lat: assignment.lat,
            lng: assignment.lng,
            formattedAddress: assignment.formattedAddress,
            postalCode: assignment.postalCode,
          };
          postalSuccess.value = true;
        }
        // Preload existing files into the upload component and into selectedFiles so they can be removed/kept
        if (Array.isArray(assignment.files) && assignment.files.length > 0) {
          selectedFiles.value = assignment.files.map((f) => ({ ...f }));
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
    if (!isOnline.value && !geo && formData.value.postalCode?.trim()) {
      // Fallback: geocode if not already done (only for physical locations)
      geo = await geocodePostalCode(formData.value.postalCode);
    }

    // Construct data to save
    const assignmentData = {
      ...formData.value,
      sessionsPerWeek: sessionsPerWeek.value,
      requirements: (function() {
        const req = formData.value.requirements;
        if (!req) return [];
        if (Array.isArray(req)) {
          return req.map((r) => (typeof r === 'string' ? r.trim() : '')).filter(Boolean);
        }
        return String(req)
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean);
      })(),
      files: [],
      // Only add geo data for physical locations
      ...(isOnline.value
        ? {
            location: "Online",
            postalCode: null,
            formattedAddress: null,
            lat: null,
            lng: null,
          }
        : geo
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
      // Edit flow: upload any newly selected files first, then update assignment with combined files
      try {
        // Determine which existing files the user kept (selectedFiles contains both metadata and File objects)
        const keptExisting = (selectedFiles.value || []).filter((f) => f && f.url);

        // Files to upload are the File objects in selectedFiles
        const newFilesMeta = [];
        const filesToUpload = (selectedFiles.value || []).filter((f) => f && f instanceof File);

        for (const f of filesToUpload) {
          const safeName = `${Date.now()}_${f.name}`;
          const path = `assignments/${assignmentId.value}/${safeName}`;
          const uploadRes = await uploadFile(f, path);
          if (uploadRes.success) {
            newFilesMeta.push({ name: f.name, size: f.size, url: uploadRes.url });
          } else {
            console.warn('Failed to upload file', f.name, uploadRes.error);
          }
        }

        // Combined result is kept existing files plus newly uploaded file metadata
        assignmentData.files = [...keptExisting, ...newFilesMeta];

        // Update assignment doc
        result = await updateAssignment(assignmentId.value, assignmentData);
      } catch (err) {
        console.error('Error uploading files during update:', err);
        throw err;
      }
    } else {
      // Create new assignment: create doc first to obtain id, then upload files and patch the doc with file metadata
      result = await createAssignment(user.uid, assignmentData);

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to create assignment');
      }

      const createdId = result.id;

      try {
        const uploadedFiles = [];
        for (const f of selectedFiles.value || []) {
          if (f && f instanceof File) {
            const safeName = `${Date.now()}_${f.name}`;
            const path = `assignments/${createdId}/${safeName}`;
            const uploadRes = await uploadFile(f, path);
            if (uploadRes.success) {
              uploadedFiles.push({ name: f.name, size: f.size, url: uploadRes.url });
            } else {
              console.warn('Failed to upload file', f.name, uploadRes.error);
            }
          }
        }

        // Also include any metadata items that might already be present in selectedFiles
        const existingMeta = (selectedFiles.value || []).filter((f) => f && f.url);
        const finalFiles = [...existingMeta, ...uploadedFiles];

        if (finalFiles.length > 0) {
          // Patch assignment with uploaded files and any existing metadata
          await updateAssignment(createdId, { files: finalFiles });
        }
      } catch (err) {
        console.error('Error uploading files after create:', err);
        // We don't fail the whole create flow here but inform user
        alert('Assignment created but some files failed to upload.');
      }
    }

    submitting.value = false;
    alert(
      `Assignment ${isEditMode.value ? "updated" : "posted"} successfully!`
    );
    router.push({
      path: "/parent-dashboard",
      query: { refresh: Date.now().toString() },
    });
  } catch (error) {
    console.error(
      `Error ${isEditMode.value ? "updating" : "posting"} assignment:`,
      error
    );
    alert(
      error?.message ||
        `Failed to ${
          isEditMode.value ? "update" : "post"
        } assignment. Please try again.`
    );
    submitting.value = false;
  }
};

const validateForm = () => {
  if (!formData.value.title || 
      !formData.value.subject || 
      !formData.value.level ||
      !formData.value.contractDuration ||
      !formData.value.sessionDuration ||
      !formData.value.sessionStartTime ||
      !formData.value.rate) {
    alert('Please fill in all required fields')
    return false
  }

  // Only require postal code verification for physical locations
  if (!isOnline.value) {
    if (!formData.value.postalCode) {
      alert("Please enter your postal code or select 'Online' mode");
      return false;
    }

    if (!postalSuccess.value) {
      alert("Please verify your postal code by clicking the location button");
      return false;
    }
  }
  
    // Validate number fields
  if (formData.value.contractDuration < 1 || formData.value.contractDuration > 24) {
    alert('Contract duration must be between 1 and 24 months')
    return false
  }

  if (formData.value.sessionDuration < 0.5 || formData.value.sessionDuration > 4) {
    alert('Session duration must be between 0.5 and 4 hours')
    return false
  }

  if (formData.value.sessionStartTime < "09:00" || formData.value.sessionStartTime > "18:00"){
    alert('Session start time must be between 9 am and 6 pm inclusive')
    return false
  }

  if (formData.value.rate < 20 || formData.value.rate > 200) {
    alert('Hourly rate must be between $20 and $200')
    return false
  }

  // Validate at least one day is selected
  if (formData.value.selectedDays.length === 0) {
    alert('Please select at least one day per week for tutoring sessions')
    return false
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
          {{ isEditMode ? "Edit Assignment" : "Post New Assignment" }}
        </h1>
        <p class="text-muted">
          {{
            isEditMode
              ? "Update your tutoring assignment"
              : "Create a new tutoring assignment posting"
          }}
        </p>
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
                  <div
                    class="d-flex justify-content-between align-items-center mb-2"
                  >
                    <label class="form-label mb-0">
                      Location
                      <span v-if="!isOnline" class="text-danger">*</span>
                    </label>
                    <div class="form-check form-switch">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="onlineToggle"
                        v-model="isOnline"
                      />
                      <label class="form-check-label" for="onlineToggle">
                        <i class="bi bi-laptop me-1"></i>
                        Online Tutoring
                      </label>
                    </div>
                  </div>

                  <!-- Show postal code input only for physical locations -->
                  <div v-if="!isOnline">
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

                  <!-- Show online mode message -->
                  <div v-else class="alert alert-info mb-0">
                    <i class="bi bi-laptop me-2"></i>
                    <strong>Online Tutoring Selected</strong>
                    <p class="mb-0 mt-1 small">
                      This assignment will be conducted online via video call or
                      chat. No physical location required.
                    </p>
                  </div>
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

              <!-- Day Picker -->
              <div class="mb-3">
                <label class="form-label">
                  Tutoring Days <span class="text-danger">*</span>
                </label>
                <div class="day-picker">
                  <button
                    v-for="day in daysOfWeek"
                    :key="day.value"
                    type="button"
                    class="day-btn"
                    :class="{ active: formData.selectedDays.includes(day.value) }"
                    @click="toggleDay(day.value)"
                  >
                    <span class="day-label">{{ day.label }}</span>
                    <span class="day-full">{{ day.fullLabel }}</span>
                  </button>
                </div>
                <small class="text-muted d-block mt-2">
                  <i class="bi bi-info-circle me-1"></i>
                  Selected: 
                  <strong v-if="formData.selectedDays.length > 0">
                    {{ formData.selectedDays.join(', ') }} 
                    ({{ sessionsPerWeek }} session{{ sessionsPerWeek !== 1 ? 's' : '' }}/week)
                  </strong>
                  <span v-else class="text-danger">No days selected</span>
                </small>
              </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label">Contract Duration (Months)</label>
                    <input
                      v-model.number="formData.contractDuration"
                      type="number"
                      min="1"
                      max="24"
                      class="form-control"
                      id="contractDuration"
                      placeholder="Enter duration in months (e.g., 3)"
                      required
                    />
                    <small class="text-muted">How many months do you need tutoring?</small>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Session Duration (Hours)</label>
                    <input
                      v-model.number="formData.sessionDuration"
                      type="number"
                      min="0.5"
                      max="4"
                      step="0.5"
                      class="form-control"
                      id="sessionDuration"
                      placeholder="Enter hours per session (e.g., 1.5)"
                      required
                    />
                    <small class="text-muted">Duration of each tutoring session</small>
                  </div>
                </div>

                <!-- Hourly Rate -->
                 <div class="row g-3">
                 <div class="mb-3 col-md-6">
                  <label for="rate" class="form-label">
                    Session Start Time (Time)
                  </label>
                  <div class="input-group">
                    <input
                      v-model="formData.sessionStartTime"
                      type="time"
                      min="09:00"
                      max="18:00"         
                      step="1800"          
                      class="form-control"
                      id="sessionStartTime"
                      required
                    />
                  </div>
                  <small class="text-muted">The start time for each session</small>
                </div>
                <div class="mb-3 col-md-6">
                  <label for="rate" class="form-label">
                    Hourly Rate (SGD) <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input
                      v-model.number="formData.rate"
                      type="number"
                      min="20"
                      max="200"
                      step="5"
                      class="form-control"
                      id="rate"
                      placeholder="Enter hourly rate (e.g., 50)"
                      required
                    />
                    <span class="input-group-text">/hr</span>
                  </div>
                  <small class="text-muted">Your budget per hour</small>
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
                :initial-files="selectedFiles"
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
                {{ isEditMode ? "Updating..." : "Posting..." }}
              </span>
              <span v-else>
                <i class="bi bi-check-circle me-2"></i>
                {{ isEditMode ? "Update Assignment" : "Post Assignment" }}
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

/* Day Picker Styles */
.day-picker {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.day-btn {
  flex: 1;
  min-width: 60px;
  padding: 0.75rem 0.5rem;
  border: 2px solid #dee2e6;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.day-btn:hover {
  border-color: #0d6efd;
  background: #f8f9fa;
}

.day-btn.active {
  border-color: #0d6efd;
  background: #0d6efd;
  color: white;
}

.day-label {
  font-weight: 600;
  font-size: 0.875rem;
  display: block;
}

.day-full {
  font-size: 0.75rem;
  opacity: 0.8;
  display: none;
}

@media (min-width: 768px) {
  .day-full {
    display: block;
  }
  .day-label {
    display: none;
  }
}

@media (max-width: 767px) {
  .day-btn {
    min-width: 45px;
    padding: 0.5rem 0.25rem;
  }
}
</style>
