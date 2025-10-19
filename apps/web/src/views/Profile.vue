<template>
  <div class="tutor-profile">
    <div class="container py-4">
      <!-- Header -->
      <div class="row g-4">
        <!-- Left column -->
        <div class="pr-10 col-lg-8">
          <div class="card shadow-sm">
            <div class="card-body px-10">
              <div class="profile text-center mb-3">
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
                <h4 class="fw-bold mb-2">{{ profile.name }}</h4>
                <span v-if="profile.verified" class="badge bg-success mb-3">
                  <i class="bi bi-check-circle me-1"></i> Verified Tutor
                </span>
                <div class="d-grid" v-if="!isPublicView">
                  <button
                    class="btn btn-outline-primary btn-sm"
                    @click="editProfile()"
                  >
                    <i class="bi bi-gear-wide-connected me-2"></i> Edit Profile
                  </button>
                </div>

                <!-- Public profile: show Message button when viewer isn't the profile owner -->
                <div class="d-grid" v-if="isPublicView && showMessageButton">
                  <button
                    class="btn btn-primary btn-sm mt-2"
                    @click="messageTutor()"
                  >
                    <i class="bi bi-chat-left-text me-2"></i> Message me
                  </button>
                </div>
              </div>
              <div class="mb3 info">
                <div class="subjects-list mb-3">
                  <h6>Subjects</h6>
                  <span
                    class="subject-tag"
                    v-for="(item, index) in profile.teaching"
                    >{{ item.levels + " " + item.subject }}</span
                  >
                </div>
                <div class="experience mb-3">
                  <h6>Years of teaching experience</h6>
                  <p>{{ profile.experience }}</p>
                </div>
                <div class="location mb-3">
                  <h6>Location</h6>
                  <p>{{ profile.location }}</p>
                </div>
                <div class="bio mb-3">
                  <h6>Bio</h6>
                  <p>{{ profile.bio }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="card shadow-sm mt-6 col-lg-4">
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

        <!-- Documents -->
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-4">
              <i class="bi bi-file-earmark-text me-2"></i> Documents &
              Credentials
            </h5>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import FileUpload from "../components/FileUpload.vue";
import { auth, db, getSubjects, getLevels } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import router from "../router/routes";
import { useRoute } from 'vue-router'

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

const route = useRoute()
const isPublicView = ref(false)
const currentUserId = ref(null)
onAuthStateChanged(auth, (user) => {
  currentUserId.value = user ? user.uid : null
})

const profileId = computed(() => profile.value.id || profile.value.uid || profile.value.username || null)
const showMessageButton = computed(() => {
  return profileId.value && currentUserId.value && profileId.value !== currentUserId.value
})


onMounted(async () => {
  try {
    subjects.value = await getSubjects();
    levels.value = await getLevels();
  } catch (error) {
    console.error("Error loading form data:", error);
  }
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
  const tutorRef = doc(db, "tutorProfile", user.uid);
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
onMounted(async () => {
  // If route has username param, load that tutor's profile for public view
  const username = route.params.username || null
  if (username) {
    isPublicView.value = true
    try {
  const q = query(collection(db, 'users'), where('username', '==', username))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const docRef = snap.docs[0]
        const docData = docRef.data()
        // ensure we record the document id (owner uid) so comparisons work
        profile.value = { ...docData, id: docRef.id }
        uploadedDocuments.value = docData.uploadedDocuments || []
      } else {
        console.warn('Tutor not found for username:', username)
      }
    } catch (err) {
      console.error('Error loading public tutor profile:', err)
    }
    return
  }

  // Otherwise load current user's profile as before
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const refDoc = doc(db, "users", user.uid);
      const snap = await getDoc(refDoc);
      if (snap.exists()) {
        // include doc id for consistency
        profile.value = { ...snap.data(), id: snap.id };
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

  const tutorRef = doc(db, "users", user.uid);
  await updateDoc(tutorRef, profile.value);
  alert("Profile saved successfully!");
};

// Start a chat with this tutor (navigates to /chat?tutorId=...)
const messageTutor = () => {
  if (!profileId.value) return alert('Unable to start chat: missing tutor id.');
  router.push({ path: '/chat', query: { tutorId: profileId.value } });
}

const editProfile = () => {
  router.push("tutorProfile");
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

.subject-tag {
  background: #81b29a;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 2px;
  display: inline-block;
}

@media (max-width: 991px) {
  .col-lg-4 {
    margin-bottom: 2rem;
  }
}
</style>
