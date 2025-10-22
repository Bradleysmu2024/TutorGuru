<script setup>
import { ref, onMounted } from "vue";
import { getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db, updateUserEmail, getLevelsWithGrades } from "../services/firebase";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { uploadUserAvatar } from '../services/firebase'
import { getCurrentUser } from '../services/firebase'
import { getParentAssignments } from "../services/firebase";
import { usePostalCodeGeocoding } from "../composables/usePostalCodeGeocoding";

const profile = ref({
  name: "",
  email: "",
  phone: "",
  location: "",
  postalCode: "",
  formattedAddress: "",
  children: [],
});
const assignments = ref([]);
const levelsWithGrades = ref([]); // Add this for nested grades structure

// Use postal code geocoding composable
const { geocoding, postalError, postalSuccess, validateAndGeocode } =
  usePostalCodeGeocoding();

const showEmailModal = ref(false);
const newEmail = ref("");
const currentPassword = ref("");
const emailChangeError = ref("");
const emailChangeLoading = ref(false);

const loadProfile = async () => {
  try {
    const user = await getCurrentUser();
    if (!user || !user.uid) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      profile.value = { ...profile.value, ...snap.data() };
    }
  } catch (err) {
    console.error("Error loading parent profile:", err);
  }
};

// Avatar upload state for parent
const avatarInputRef = ref(null);
const avatarUploading = ref(false);

const triggerAvatarInput = () => {
  if (avatarInputRef.value) avatarInputRef.value.click();
};

const handleAvatarChange = async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  await uploadAvatar(file);
  e.target.value = "";
};

const uploadAvatar = async (file) => {
  const user = await getCurrentUser();
  if (!user || !user.uid) return alert('You must be logged in to change your photo.');

  avatarUploading.value = true;
  try {
    const res = await uploadUserAvatar(user.uid, file, 'parents');
    if (res.success) {
      profile.value.avatar = res.url;
      alert('Profile photo updated successfully!');
    } else {
      console.error('uploadUserAvatar failed:', res.error);
      alert('Failed to upload avatar. Please try again.');
    }
  } catch (err) {
    console.error('Parent avatar upload error:', err);
    alert('Failed to upload avatar. Please try again.');
  } finally {
    avatarUploading.value = false;
  }
};

const saveProfile = async () => {
  try {
    const user = await getCurrentUser();
    if (!user || !user.uid) {
      alert("You must be logged in to save your profile");
      return;
    }
    // write profile into users/{uid}
    await setDoc(doc(db, "users", user.uid), profile.value, { merge: true });
    alert("Profile saved successfully!");
  } catch (err) {
    console.error("Error saving profile:", err);
    alert("Failed to save profile. Please try again.");
  }
};

const addChild = () => {
  profile.value.children.push({ name: "", grade: "", subjects: [] });
};

const removeChild = (index) => {
  profile.value.children.splice(index, 1);
};

// Auto-validate and geocode postal code
const validateAndGeocodePostal = async () => {
  const result = await validateAndGeocode(profile.value.postalCode, {
    includeCoordinates: false, // Profile doesn't need lat/lng
  });

  if (result.success) {
    // Update profile data with geocoded information
    profile.value.formattedAddress = result.data.formattedAddress;
    profile.value.location = result.data.location;
  }
};

onMounted(loadProfile);

// load parent assignments for quick stats
const loadAssignments = async () => {
  try {
    const user = await getCurrentUser();
    if (!user || !user.uid) return;
    assignments.value = await getParentAssignments(user.uid);
  } catch (err) {
    console.error("Error loading parent assignments:", err);
  }
};

const openEmailChangeModal = () => {
  newEmail.value = profile.value.email; // Pre-fill with current email
  currentPassword.value = "";
  emailChangeError.value = "";
  showEmailModal.value = true;
};

const changeEmail = async () => {
  //validate that the user knows email and pw
  if (!newEmail.value || !currentPassword.value) {
    emailChangeError.value =
      "Please provide both new email and current password.";
    return;
  }

  if (newEmail.value === profile.value.email) {
    emailChangeError.value =
      "The new email must be different from the current email.";
    return;
  }

  emailChangeError.value = "";
  emailChangeLoading.value = true;
  try {
    // update Firebase Auth email first, so they can login with new email next time
    const result = await updateUserEmail(newEmail.value, currentPassword.value);

    if (!result.success) {
      emailChangeError.value = result.error;
      emailChangeLoading.value = false;
      return;
    }

    // then update Firestore profile email
    const user = await getCurrentUser();
    if (!user || !user.uid) throw new Error("User not logged in");
    else {
      await setDoc(doc(db, "parentProfile", user.uid), {
        ...profile.value,
        email: newEmail.value,
      });
      // Update local state
      profile.value.email = newEmail.value;

      // Close modal and show success
      showEmailModal.value = false;
      alert(
        "Email updated successfully! You can now log in with your new email."
      );
    }
  } catch (err) {
    console.error("Error changing email:", err);
    emailChangeError.value =
      err.message || "Failed to change email. Please try again.";
  } finally {
    // will always run at the end
    emailChangeLoading.value = false;
  }
};

const cancelEmailChange = () => {
  showEmailModal.value = false;
  newEmail.value = "";
  currentPassword.value = "";
  emailChangeError.value = "";
};

onMounted(loadAssignments);

// Load levels with grades on mount, rather than asking user type themselves
onMounted(async () => {
  try {
    levelsWithGrades.value = await getLevelsWithGrades();
  } catch (error) {
    console.error("Error loading levels with grades:", error);
  }
});
</script>

<template>
  <div class="parent-profile">
    <div class="container py-4">
      <div class="profile-header mb-4">
        <h1 class="fw-bold mb-2">
          <i class="bi bi-person-circle me-2"></i>
          Parent Profile
        </h1>
        <p class="text-muted">Manage your profile and children's information</p>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card shadow-sm">
            <div class="card-body text-center">
              <div class="profile-avatar mb-3">
                <img
                  :src="profile.avatar || '../assets/images/profileplaceholder.JPG'"
                  alt="Profile"
                  class="rounded-circle img-fluid"
                  style="width: 150px; height: 150px; object-fit: cover"
                />
              </div>
              <h4 class="fw-bold mb-1">{{ profile.name }}</h4>
              <p class="text-muted mb-3">{{ profile.email }}</p>
              <span class="badge bg-primary mb-3">
                <i class="bi bi-shield-check me-1"></i>
                Verified Parent
              </span>
              <div class="d-grid">
                <button
                  class="btn btn-outline-primary btn-sm"
                  type="button"
                  @click="triggerAvatarInput"
                  :disabled="avatarUploading"
                >
                  <template v-if="avatarUploading">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Uploading...
                  </template>
                  <template v-else>
                    <i class="bi bi-camera me-2"></i>
                    Change Photo
                  </template>
                </button>
                <input
                  ref="avatarInputRef"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleAvatarChange"
                />
              </div>
            </div>
          </div>

          <div class="card shadow-sm mt-4">
            <div class="card-body">
              <h6 class="fw-semibold mb-3">Quick Stats</h6>
              <div class="stat-item d-flex justify-content-between mb-2">
                <span class="text-muted">Active Postings</span>
                <span class="fw-semibold">{{ assignments.length }}</span>
              </div>
              <div class="stat-item d-flex justify-content-between mb-2">
                <span class="text-muted">Active Tutors</span>
                <span class="fw-semibold">{{
                  /* placeholder for active tutors */ 0
                }}</span>
              </div>
              <div class="stat-item d-flex justify-content-between">
                <span class="text-muted">Children</span>
                <span class="fw-semibold">{{ profile.children.length }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-8">
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title mb-4">
                <i class="bi bi-person-badge me-2"></i>
                Personal Information
              </h5>
              <form @submit.prevent="saveProfile">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Full Name</label>
                    <input
                      v-model="profile.name"
                      type="text"
                      class="form-control"
                      required
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Email</label>
                    <div class="input-group">
                      <input
                        v-model="profile.email"
                        type="email"
                        class="form-control"
                        disabled
                        style="background-color: #e9ecef"
                      />
                      <button
                        class="btn btn-outline-primary"
                        type="button"
                        @click="openEmailChangeModal"
                      >
                        <i class="bi bi-pencil"></i> Change
                      </button>
                    </div>
                    <small class="text-muted"
                      >Email changes require password verification</small
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Phone</label>
                    <input
                      v-model="profile.phone"
                      type="tel"
                      class="form-control"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Location (Postal Code)</label>
                    <div class="input-group">
                      <input
                        v-model="profile.postalCode"
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
                        :disabled="geocoding || !profile.postalCode"
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
                      <strong>{{ profile.formattedAddress }}</strong>
                      <span class="ms-2 badge bg-success">{{
                        profile.location
                      }}</span>
                    </div>
                    <small class="text-muted d-block mt-1">
                      <i class="bi bi-info-circle me-1"></i>
                      We'll automatically detect your region and address
                    </small>
                  </div>
                </div>
                <div class="mt-3">
                  <button type="submit" class="btn btn-primary text-white">
                    <i class="bi bi-save me-2"></i>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div class="card shadow-sm">
            <div class="card-body">
              <div
                class="d-flex justify-content-between align-items-center mb-4"
              >
                <h5 class="fw-semibold mb-0">
                  <i class="bi bi-people me-2"></i>
                  Children Information
                </h5>
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="addChild"
                >
                  <i class="bi bi-plus-circle me-2"></i>
                  Add Child
                </button>
              </div>

              <div
                v-for="(child, index) in profile.children"
                :key="index"
                class="child-card mb-3"
              >
                <div
                  class="d-flex justify-content-between align-items-start mb-3"
                >
                  <h6 class="fw-semibold mb-0">Child {{ index + 1 }}</h6>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    @click="removeChild(index)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Name</label>
                    <input
                      v-model="child.name"
                      type="text"
                      class="form-control"
                      placeholder="Child's name"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Grade</label>
                    <select v-model="child.grade" class="form-select">
                      <option value="">-- Select Grade --</option>
                      <optgroup
                        v-for="level in levelsWithGrades"
                        :key="level.name"
                        :label="level.name"
                      >
                        <option
                          v-for="grade in level.grades"
                          :key="grade"
                          :value="grade"
                        >
                          {{ grade }}
                        </option>
                      </optgroup>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Subjects Studying</label>
                    <input
                      v-model="child.subjects"
                      type="text"
                      class="form-control"
                      placeholder="e.g., Mathematics, Science, English"
                    />
                    <small class="text-muted"
                      >Separate subjects with commas</small
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Email Change Modal -->
  <div
    v-if="showEmailModal"
    class="modal-overlay"
    @click.self="cancelEmailChange"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-envelope me-2"></i>Change Email Address
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="cancelEmailChange"
          ></button>
        </div>
        <div class="modal-body">
          <p class="text-muted mb-3">
            For security, we need to verify your current password before
            changing your email.
          </p>

          <div v-if="emailChangeError" class="alert alert-danger">
            {{ emailChangeError }}
          </div>

          <div class="mb-3">
            <label class="form-label">New Email Address</label>
            <input
              v-model="newEmail"
              type="email"
              class="form-control"
              placeholder="Enter new email"
              :disabled="emailChangeLoading"
            />
          </div>

          <div class="mb-3">
            <label class="form-label">Current Password</label>
            <input
              v-model="currentPassword"
              type="password"
              class="form-control"
              placeholder="Enter your current password"
              :disabled="emailChangeLoading"
            />
            <small class="text-muted"
              >We need this to verify it's really you</small
            >
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="cancelEmailChange"
            :disabled="emailChangeLoading"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="changeEmail"
            :disabled="emailChangeLoading"
          >
            <span v-if="emailChangeLoading">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Updating...
            </span>
            <span v-else> <i class="bi bi-check2 me-2"></i>Update Email </span>
          </button>
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

.profile-avatar {
  margin: 0 auto;
}

.stat-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.child-card {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 0.75rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-dialog {
  max-width: 500px;
  width: 90%;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.5;
}

.btn-close:hover {
  opacity: 1;
}

@media (max-width: 991px) {
  .col-lg-4 {
    margin-bottom: 2rem;
  }
}
</style>
