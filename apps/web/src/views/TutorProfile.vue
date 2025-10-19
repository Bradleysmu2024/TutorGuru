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
                <button class="btn btn-outline-primary btn-sm">
                  <i class="bi bi-camera me-2"></i> Change Photo
                </button>
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
                <span class="fw-semibold">{{ profile.rating ?? '—' }} ⭐</span>
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
                    <label class="form-label">Username</label>
                    <input
                      v-model="profile.username"
                      type="text"
                      class="form-control"
                    />
                  </div>

                  <div class="col-md-6">
                    <label class="form-label">Phone</label>
                    <input
                      v-model="profile.phone"
                      type="tel"
                      class="form-control"
                    />
                  </div>

                  <div class="col-12">
                    <label class="form-label">Location</label>
                    <input
                      v-model="profile.location"
                      type="text"
                      class="form-control"
                    />
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
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const fileUploadRef = ref(null);
const selectedFiles = ref([]);

// Add Firebase data
const subjects = ref([]);
const levels = ref([]);

const profile = ref({
  name: "",
  username: "",
  email: "",
  phone: "",
  location: "",
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

  // // Existing auth state change logic
  // onAuthStateChanged(auth, async (user) => {
  //   if (user) {
  //     const refDoc = doc(db, "users", user.uid)
  //     const snap = await getDoc(refDoc)
  //     if (snap.exists()) {
  //       profile.value = snap.data()
  //       uploadedDocuments.value = snap.data().uploadedDocuments || []
  //     }
  //   } else {
  //     alert("Please log in to view your profile.")
  //   }
  // })
});

const uploadedDocuments = ref([]);

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
  if (!user) return alert("You must be logged in to upload documents!");

  if (selectedFiles.value.length === 0) {
    return alert("Please select at least one file.");
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

    alert("✅ Documents uploaded successfully!");
    selectedFiles.value = [];
  } catch (err) {
    console.error("Upload error:", err);
    alert("Error uploading files. Please try again.");
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
  alert("Documents uploaded successfully!");
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
        alert("Please log in to view your profile.");
      }
    }
  });
});

// Save profile to Firestore
const saveProfile = async () => {
  const user = auth.currentUser;
  if (!user) return alert("You must be logged in!");

  // Validate username uniqueness (if provided)
  const desiredUsername = (profile.value.username || "").trim();
  if (desiredUsername) {
    try {
      const q = query(collection(db, 'users'), where('username', '==', desiredUsername));
      const snap = await getDocs(q);
      if (!snap.empty) {
        // if any matching doc belongs to someone else, block save
        const takenByOther = snap.docs.some(d => d.id !== user.uid);
        if (takenByOther) {
          alert('That username is already taken. Please choose another.');
          return;
        }
      }
    } catch (err) {
      console.error('Error validating username uniqueness:', err);
      alert('Could not validate username uniqueness. Please try again.');
      return;
    }
  }

  const tutorRef = doc(db, "users", user.uid);
  await updateDoc(tutorRef, profile.value);
  alert("Profile saved successfully!");
};

const openEmailChangeModal = () => {
  newEmail.value = profile.value.email;
  currentPassword.value = "";
  emailChangeError.value = "";
  showEmailModal.value = true;
};

const changeEmail = async () => {
  if (!newEmail.value || !currentPassword.value) {
    emailChangeError.value = "Please fill in all fields";
    return;
  }

  if (newEmail.value === profile.value.email) {
    emailChangeError.value = "New email is the same as current email";
    return;
  }

  emailChangeLoading.value = true;
  emailChangeError.value = "";

  try {
    // Step 1: Update Firebase Authentication email
    const result = await updateUserEmail(newEmail.value, currentPassword.value);

    if (!result.success) {
      emailChangeError.value = result.error;
      emailChangeLoading.value = false;
      return;
    }

    // Step 2: Update Firestore profile
    const user = await getCurrentUser();
    if (user && user.uid) {
      await setDoc(doc(db, "tutorProfile", user.uid), {
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
    console.error("Error updating email:", err);
    emailChangeError.value = "Failed to update email. Please try again.";
  } finally {
    emailChangeLoading.value = false;
  }
};

const cancelEmailChange = () => {
  showEmailModal.value = false;
  newEmail.value = "";
  currentPassword.value = "";
  emailChangeError.value = "";
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
