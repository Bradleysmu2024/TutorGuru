<template>
  <div class="tutor-profile">
    <div class="container py-4">
      <!-- Header -->
      <div class="profile-header mb-4">
        <h1 class="fw-bold mb-2">
          <i class="bi bi-person-circle me-2"></i>
          Tutor Profile
        </h1>
        <p class="text-muted">Manage your profile and credentials</p>
      </div>

      <div class="row g-4">
        <!-- Left column -->
        <div class="col-lg-4">
          <div class="card shadow-sm">
            <div class="card-body text-center">
              <div class="profile-avatar mb-3">
                <img
                  :src="
                    profile.avatar ||
                    '/src/assets/images/profileplaceholder.JPG'
                  "
                  alt="Profile"
                  class="rounded-circle img-fluid"
                  style="width: 150px; height: 150px; object-fit: cover"
                />
              </div>
              <h4 class="fw-bold mb-1">{{ profile.name }}</h4>
              <p class="text-muted mb-3">{{ profile.email }}</p>
              <span v-if="profile.verified" class="badge bg-success mb-3">
                <i class="bi bi-check-circle me-1"></i> Verified Tutor
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
                    <i class="bi bi-camera me-2"></i> Change Photo
                  </template>
                </button>
                <!-- hidden file input -->
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

          <!-- Quick Stats -->
          <div class="card shadow-sm mt-4">
            <div class="card-body">
              <h6 class="fw-semibold mb-3">Quick Stats</h6>
              <div class="stat-item d-flex justify-content-between mb-2">
                <span class="text-muted">Applications Sent</span>
                <span class="fw-semibold">12</span>
              </div>
              <div class="stat-item d-flex justify-content-between mb-2">
                <span class="text-muted">Active Students</span>
                <span class="fw-semibold">5</span>
              </div>
              <div class="stat-item d-flex justify-content-between">
                <span class="text-muted">Rating</span>
                <span class="fw-semibold">{{ profile.rating ?? "—" }} ⭐</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right column -->
        <div class="col-lg-8">
          <!-- Personal Info -->
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title mb-4">
                <i class="bi bi-person-badge me-2"></i> Personal Information
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
                        style="background-color: #e9ecef"
                        disabled
                      />
                      <button
                        type="button"
                        class="btn btn-outline-primary"
                        @click="openEmailChangeModal"
                      >
                        <i class="bi bi-pencil">Change</i>
                      </button>
                    </div>
                    <small class="text-muted"
                      >Email changes require password verification.</small
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

                  <div class="col-12">
                    <label class="form-label">Bio</label>
                    <textarea
                      v-model="profile.bio"
                      class="form-control"
                      rows="3"
                      placeholder="Tell students about yourself..."
                    ></textarea>
                  </div>
                </div>

                <div class="mt-3 text-end">
                  <button type="submit" class="btn btn-primary text-light">
                    <i class="bi bi-save me-2"></i>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Teaching Expertise -->
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title mb-4">
                <i class="bi bi-mortarboard me-2"></i> Teaching Expertise
              </h5>

              <form @submit.prevent="saveProfile">
                <div
                  v-for="(item, index) in profile.teaching"
                  :key="index"
                  class="border rounded p-3 mb-3"
                >
                  <div
                    class="d-flex justify-content-between align-items-center mb-2"
                  >
                    <strong>Subject {{ index + 1 }}</strong>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      @click="removeSubject(index)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>

                  <label class="form-label">Subject</label>
                  <select v-model="item.subject" class="form-select mb-2">
                    <option disabled value="">-- Select Subject --</option>
                    <option
                      v-for="subject in subjects"
                      :key="subject"
                      :value="subject"
                    >
                      {{ subject }}
                    </option>
                  </select>

                  <label class="form-label">Levels</label>
                  <select
                    v-model="item.levels"
                    class="form-select"
                    multiple
                    size="4"
                  >
                    <option v-for="level in levels" :key="level" :value="level">
                      {{ level }}
                    </option>
                  </select>
                  <small class="text-muted"
                    >Hold Ctrl/Cmd to select multiple</small
                  >
                </div>

                <button
                  type="button"
                  class="btn btn-outline-primary mt-2"
                  @click="addSubject"
                >
                  <i class="bi bi-plus"></i> Add Another Subject
                </button>

                <div class="col-12 mt-4">
                  <label class="form-label">Years of Experience</label>
                  <input
                    v-model="profile.experience"
                    type="number"
                    class="form-control"
                    min="0"
                  />
                </div>

                <!-- ✅ Save button now here -->
                <div class="mt-4 text-end">
                  <button type="submit" class="btn btn-primary text-light">
                    <i class="bi bi-save me-2"></i> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Documents -->
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title mb-4">
                <i class="bi bi-file-earmark-text me-2"></i> Documents &
                Credentials
              </h5>

              <FileUpload
                ref="fileUploadRef"
                title="Upload Credentials"
                description="Upload your certificates, degrees, or other credentials (PDF, JPG, PNG)"
                accept=".pdf,.jpg,.jpeg,.png"
                :multiple="true"
                :max-size="5242880"
                @files-selected="handleFilesSelected"
                @upload-complete="handleUploadComplete"
              />

              <div v-if="uploadedDocuments.length > 0" class="mt-4">
                <h6 class="small fw-semibold mb-3">Your Documents:</h6>
                <div class="list-group">
                  <div
                    v-for="(docItem, index) in uploadedDocuments"
                    :key="index"
                    class="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div class="d-flex align-items-center">
                      <i
                        class="bi bi-file-earmark-check text-success me-2 fs-5"
                      ></i>
                      <div>
                        <div class="fw-semibold">{{ docItem.name }}</div>
                        <small class="text-muted"
                          >Uploaded {{ docItem.uploadDate }}</small
                        >
                      </div>
                    </div>
                    <div>
                      <button class="btn btn-sm btn-outline-primary me-2">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-3 text-end">
                <button
                  class="btn btn-primary"
                  @click="uploadDocuments"
                  :disabled="selectedFiles.length === 0"
                >
                  <i class="bi bi-cloud-upload me-2"></i> Upload Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Email Change Modal, opens up when change email button is clicked on -->
  <EmailChangeModal
    v-model:show="showEmailModal"
    :current-email="profile.email"
    user-collection="users"
    @email-changed="handleEmailChanged"
  />
</template>

<script setup>
import { ref, onMounted } from "vue";
import FileUpload from "../components/FileUpload.vue";
import {
  auth,
  db,
  getSubjects,
  getLevels,
  updateUserEmail,
} from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { uploadUserAvatar } from "../services/firebase";
import EmailChangeModal from "../components/EmailChangeModal.vue";
import { usePostalCodeGeocoding } from "../composables/usePostalCodeGeocoding";
import { useToast } from "../composables/useToast";

const toast = useToast();
const fileUploadRef = ref(null);
const selectedFiles = ref([]);

// Add Firebase data
const subjects = ref([]);
const levels = ref([]);

// Email change modal state
const showEmailModal = ref(false);

// Use postal code geocoding composable
const { geocoding, postalError, postalSuccess, validateAndGeocode } =
  usePostalCodeGeocoding();

const profile = ref({
  name: "",
  email: "",
  phone: "",
  location: "",
  postalCode: "",
  formattedAddress: "",
  bio: "",
  teaching: [{ subject: "", levels: [] }],
  experience: 0,
  avatar: "",
  verified: false,
});

// Load Firebase data on mount
onMounted(async () => {
  try {
    subjects.value = await getSubjects();
    levels.value = await getLevels();
  } catch (error) {
    console.error("Error loading form data:", error);
  }
});

const uploadedDocuments = ref([]);
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
  const user = auth.currentUser;
  if (!user)
    return toast.error(
      "You must be logged in to change your photo",
      "Authentication Required"
    );

  avatarUploading.value = true;
  try {
    const res = await uploadUserAvatar(user.uid, file, "tutors");
    if (res.success) {
      profile.value.avatar = res.url;
      toast.success("Profile photo updated successfully!", "Photo Updated");
    } else {
      console.error("uploadUserAvatar failed:", res.error);
      toast.error("Failed to upload avatar. Please try again", "Upload Failed");
    }
  } catch (err) {
    console.error("Avatar upload error:", err);
    toast.error("Failed to upload avatar. Please try again", "Upload Error");
  } finally {
    avatarUploading.value = false;
  }
};

const addSubject = () => {
  profile.value.teaching.push({ subject: "", levels: [] });
};

const removeSubject = (index) => {
  profile.value.teaching.splice(index, 1);
};

const handleFilesSelected = (files) => {
  selectedFiles.value = files;
};

const uploadDocuments = async () => {
  const user = auth.currentUser;
  if (!user)
    return toast.error(
      "You must be logged in to upload documents",
      "Authentication Required"
    );

  if (selectedFiles.value.length === 0) {
    return toast.warning(
      "Please select at least one file",
      "No Files Selected"
    );
  }

  const storage = getStorage();
  const tutorRef = doc(db, "users", user.uid);
  const newUploads = [];

  try {
    for (const file of selectedFiles.value) {
      const fileRef = storageRef(
        storage,
        `tutors/${user.uid}/documents/${file.name}`
      );
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      newUploads.push({
        name: file.name,
        uploadDate: new Date().toISOString().split("T")[0],
        url,
      });
    }

    uploadedDocuments.value.push(...newUploads);
    await updateDoc(tutorRef, { uploadedDocuments: uploadedDocuments.value });

    toast.success("Documents uploaded successfully!", "Upload Complete");
    selectedFiles.value = [];
  } catch (err) {
    console.error("Upload error:", err);
    toast.error("Error uploading files. Please try again", "Upload Error");
  }
};

const handleUploadComplete = (files) => {
  files.forEach((file) => {
    uploadedDocuments.value.push({
      name: file.name,
      uploadDate: new Date().toISOString().split("T")[0],
      url: "#",
    });
  });
  selectedFiles.value = [];
  toast.success("Documents uploaded successfully!", "Upload Complete");
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

// Load profile when logged in
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const refDoc = doc(db, "users", user.uid);
      const snap = await getDoc(refDoc);
      if (snap.exists()) {
        profile.value = snap.data();
        uploadedDocuments.value = snap.data().uploadedDocuments || [];
      } else {
        toast.warning("Please log in to view your profile", "Login Required");
      }
    }
  });
});

import { setUserDoc, getCurrentUser } from "../services/firebase";

// Save profile to Firestore
const saveProfile = async () => {
  const user = auth.currentUser;
  if (!user)
    return toast.error(
      "You must be logged in to save your profile",
      "Authentication Required"
    );

  // Persist to users/{uid}
  const result = await setUserDoc(user.uid, profile.value, { merge: true });
  if (result && result.success) {
    toast.success("Profile saved successfully!", "Profile Saved");
  } else {
    toast.error("Failed to save profile. Please try again", "Save Failed");
  }
};

const openEmailChangeModal = () => {
  showEmailModal.value = true;
};

const handleEmailChanged = (newEmail) => {
  // Update local profile email state
  profile.value.email = newEmail;
};
</script>

<style scoped>
.profile-header {
  padding: 1rem 0;
}
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

@media (max-width: 991px) {
  .col-lg-4 {
    margin-bottom: 2rem;
  }
}
</style>
