<template>
  <div class="profile-view">
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

                <!-- Tutor-specific badge -->
                <span
                  v-if="isTutorProfile && profile.verified"
                  class="badge bg-success mb-3"
                >
                  <i class="bi bi-check-circle me-1"></i> Verified Tutor
                </span>

                <!-- Parent-specific badge -->
                <span v-if="isParentProfile" class="badge bg-primary mb-3">
                  <i class="bi bi-person-hearts me-1"></i> Parent
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
                <div
                  class="d-grid"
                  v-if="isPublicView && showMessageButton && isTutorProfile"
                >
                  <button
                    class="btn btn-primary btn-sm mt-2"
                    @click="messageTutor()"
                  >
                    <i class="bi bi-chat-left-text me-2"></i> Message me
                  </button>
                </div>
              </div>

              <div class="mb-3 info">
                <!-- Tutor-specific information -->
                <div v-if="isTutorProfile">
                  <div class="subjects-list mb-3">
                    <h6>Subjects</h6>
                    <div
                      v-for="(item, index) in profile.teaching"
                      :key="index"
                      class="subject-item mb-3 p-3 bg-light rounded"
                    >
                      <div class="fw-semibold text-primary mb-2">
                        <i class="bi bi-book me-2"></i>{{ item.subject }}
                      </div>
                      <div class="levels-list">
                        <span
                          v-for="(level, idx) in item.levels"
                          :key="idx"
                          class="level-badge badge bg-success me-1 mb-1"
                        >
                          {{ level }}
                        </span>
                      </div>
                    </div>
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

                <!-- Parent-specific information -->
                <div v-if="isParentProfile">
                  <div class="location mb-3">
                    <h6><i class="bi bi-geo-alt me-2"></i>Location</h6>
                    <p class="mb-1">
                      {{ profile.location || "Not specified" }}
                    </p>
                    <small class="text-muted" v-if="profile.formattedAddress">
                      {{ profile.formattedAddress }}
                    </small>
                  </div>

                  <div
                    class="children-list mb-3"
                    v-if="profile.children && profile.children.length > 0"
                  >
                    <h6><i class="bi bi-people me-2"></i>Children</h6>
                    <div
                      v-for="(child, index) in profile.children"
                      :key="index"
                      class="child-card mb-2 p-3 bg-light rounded"
                    >
                      <div
                        class="d-flex justify-content-between align-items-start"
                      >
                        <div>
                          <p class="mb-1 fw-semibold">{{ child.name }}</p>
                          <p class="mb-1 text-muted small">
                            Grade: {{ child.grade }}
                          </p>
                          <div
                            v-if="child.subjects && child.subjects.length > 0"
                          >
                            <span
                              v-for="(subject, idx) in child.subjects"
                              :key="idx"
                              class="badge bg-secondary me-1"
                            >
                              {{ subject }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="contact mb-3" v-if="profile.phone">
                    <h6><i class="bi bi-telephone me-2"></i>Phone</h6>
                    <p>{{ profile.phone }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="card shadow-sm mt-6 col-lg-4">
          <div class="card-body">
            <h6 class="fw-semibold mb-3">Quick Stats</h6>

            <!-- Tutor stats -->
            <div v-if="isTutorProfile">
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

            <!-- Parent stats -->
            <div v-if="isParentProfile">
              <div class="stat-item d-flex justify-content-between mb-2">
                <span class="text-muted">Assignments Posted</span>
                <span class="fw-semibold">{{
                  profile.assignmentsPosted || 0
                }}</span>
              </div>
              <div class="stat-item d-flex justify-content-between mb-2">
                <span class="text-muted">Active Assignments</span>
                <span class="fw-semibold">{{
                  profile.activeAssignments || 0
                }}</span>
              </div>
              <div class="stat-item d-flex justify-content-between">
                <span class="text-muted">Children</span>
                <span class="fw-semibold">{{
                  profile.children?.length || 0
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Documents - Only for tutors -->
        <div
          v-if="isTutorProfile && uploadedDocuments.length > 0"
          class="card shadow-sm"
        >
          <div class="card-body">
            <h5 class="card-title mb-4">
              <i class="bi bi-file-earmark-text me-2"></i> Documents &
              Credentials
            </h5>

            <div class="list-group">
              <div
                v-for="(docItem, idx) in uploadedDocuments"
                :key="idx"
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
                  <a
                    :href="docItem.url || '#'"
                    target="_blank"
                    class="btn btn-sm btn-outline-primary me-2"
                  >
                    <i class="bi bi-eye"></i>
                  </a>
                  <button class="btn btn-sm btn-outline-danger">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Transaction History - Only show for own profile -->
      <div
        class="row g-4 mt-4"
        v-if="!loading && !isPublicView && profile.uid && currentUser && profile.uid === currentUser.uid"
      >
        <div class="col-12">
          <TransactionHistory
            :user-id="profile.uid"
            :user-type="userRole"
            @view-transaction="handleViewTransaction"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import {
  auth,
  db,
  getUserRole,
  findUserByUsername,
  getUserDoc,
} from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useRoute } from "vue-router";
import router from "../router/routes";
import TransactionHistory from "../components/TransactionHistory.vue";

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
  // Parent-specific fields
  children: [],
  postalCode: "",
  formattedAddress: "",
  uid: "",
});

const userRole = ref(null); // 'tutor' or 'parent'
const uploadedDocuments = ref([]);
const loading = ref(true);
const currentUser = ref(null); 

const route = useRoute();
const isPublicView = ref(false);
const currentUserId = ref(null);

onAuthStateChanged(auth, (user) => {
  currentUserId.value = user ? user.uid : null;
  currentUser.value = user;
});

const profileId = computed(
  () => profile.value.id || profile.value.uid || profile.value.username || null
);
const showMessageButton = computed(() => {
  return (
    profileId.value &&
    currentUserId.value &&
    profileId.value !== currentUserId.value
  );
});

// Check if viewing profile is a tutor (for conditional rendering)
const isTutorProfile = computed(() => userRole.value === "tutor");
const isParentProfile = computed(() => userRole.value === "parent");

// Load profile when logged in
onMounted(async () => {
  const username = route.params.username || null;
  if (username) {
    isPublicView.value = true;
    try {
      const u = await findUserByUsername(username);
      if (u) {
        profile.value = u;
        uploadedDocuments.value = u.uploadedDocuments || [];
        userRole.value = u.role || "tutor";
      } else {
        console.warn("User not found for username:", username);
      }
    } catch (err) {
      console.error("Error loading public profile:", err);
    }
    loading.value = false; 
    return;
  }

  const loadProfile = async (uid) => {
    // Get user role first
    userRole.value = await getUserRole(uid);

    const u = await getUserDoc(uid);
    if (u) {
      profile.value = { ...u, uid }; // add uid to profile
      uploadedDocuments.value = u.uploadedDocuments || [];
      currentUser.value = auth.currentUser;
    } else {
      alert("Please log in to view your profile.");
    }
    loading.value = false;
  };

  const userNow = auth.currentUser;
  if (userNow) {
    await loadProfile(userNow.uid);
  } else {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadProfile(user.uid);
      } else {
        alert("Please log in to view your profile.");
        loading.value = false;
      }
      if (typeof unsub === "function") unsub();
    });
  }
});

// Start a chat with this tutor (navigates to /chat?tutorId=<username>)
const messageTutor = () => {
  if (!profile.value || !profile.value.username)
    return alert("Unable to start chat: missing tutor username.");
  router.push({ path: "/chat", query: { tutor: profile.value.username } });
};

const editProfile = () => {
  router.push("/editprofile");
};

// ADD THIS FUNCTION
const handleViewTransaction = (transaction) => {
  console.log('View transaction:', transaction);
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

.subject-item {
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.subject-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.level-badge {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.35em 0.65em;
}

.child-card {
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.child-card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 991px) {
  .col-lg-4 {
    margin-bottom: 2rem;
  }
}
</style>
