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
                <div class="mb-3 info">
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
        <!-- test needed -->
        <div v-if="uploadedDocuments.length > 0" class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-4">
              <i class="bi bi-file-earmark-text me-2"></i> Documents &
              Credentials
            </h5>

            <div class="list-group">
              <div v-for="(docItem, idx) in uploadedDocuments" :key="idx" class="list-group-item d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  <i class="bi bi-file-earmark-check text-success me-2 fs-5"></i>
                  <div>
                    <div class="fw-semibold">{{ docItem.name }}</div>
                    <small class="text-muted">Uploaded {{ docItem.uploadDate }}</small>
                  </div>
                </div>
                <div>
                  <a :href="docItem.url || '#'" target="_blank" class="btn btn-sm btn-outline-primary me-2"> <i class="bi bi-eye"></i> </a>
                  <button class="btn btn-sm btn-outline-danger"> <i class="bi bi-trash"></i> </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRoute } from 'vue-router'
import router from "../router/routes";

// Add Firebase data
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

const uploadedDocuments = ref([])

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

// Load profile when logged in
onMounted(async () => {
  const username = route.params.username || null
  if (username) {
    isPublicView.value = true
    try {
      const q = query(collection(db, 'users'), where('username', '==', username))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const docRef = snap.docs[0]
        const docData = docRef.data()
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

  const loadProfile = async (uid) => {
    const refDoc = doc(db, 'users', uid)
    const snap = await getDoc(refDoc)
    if (snap.exists()) {
      profile.value = { ...snap.data(), id: snap.id }
      uploadedDocuments.value = snap.data().uploadedDocuments || []
    } else {
      alert('Please log in to view your profile.')
    }
  }

  const userNow = auth.currentUser
  if (userNow) {
    await loadProfile(userNow.uid)
  } else {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadProfile(user.uid)
      } else {
        alert('Please log in to view your profile.')
      }
      if (typeof unsub === 'function') unsub()
    })
  }
})

// Start a chat with this tutor (navigates to /chat?tutorId=<username>)
const messageTutor = () => {
  if (!profile.value || !profile.value.username) return alert('Unable to start chat: missing tutor username.');
  router.push({ path: '/chat', query: { tutor: profile.value.username } });
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
