<template>
  <div class="container-fluid d-flex bg-light flex-grow-1" style="min-height: 0;">
    <!-- Desktop sidebar: visible md+ -->
    <div class="col-3 p-3 border-end bg-white d-none d-md-block" style="min-height: 0;">
        <MessageSidebar :selectedId="activeUser && activeUser.id" @selectChat="selectChat" @initial-chats="onInitialChats" />
    </div>

    <!-- Mobile sidebar overlay (slide-in) -->
      <div v-if="showSidebar" class="mobile-backdrop d-lg-none" @click="closeSidebar"></div>
      <div v-if="showSidebar" class="mobile-sidebar d-lg-none">
      <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
        <strong>Chats</strong>
        <button class="btn btn-sm btn-outline-secondary" @click="closeSidebar">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="p-2">
        <MessageSidebar :selectedId="activeUser && activeUser.id" @selectChat="(u)=>{ selectChat(u); closeSidebar(); }" @initial-chats="onInitialChats" />
      </div>
    </div>

    <!-- Chat column -->
    <div class="col-12 col-lg-9 d-flex flex-column" style="min-height: 0;">
      <!-- Mobile top bar with toggle -->
        <div class="d-flex d-lg-none align-items-center p-2 border-bottom">
          <button class="btn btn-outline-secondary me-2" @click="toggleSidebar">
          <i class="bi bi-list"></i>
        </button>
        <div class="flex-grow-1">
          <strong>{{ activeUser ? (activeUser.name || activeUser.username || 'Chat') : 'Messages' }}</strong>
        </div>
      </div>

      <template v-if="activeUser">
        <ChatWindow :activeUser="activeUser" />
      </template>
      <template v-else>
        <div class="d-flex flex-column flex-grow-1 justify-content-center align-items-center text-center p-4">
          <h4 class="mb-3">No messages yet</h4>
          <p class="text-muted">You haven't started any chat.</p>
          <div class="mt-3">
            <button class="btn btn-primary" @click="goToDashboard">Go to Dashboard</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ChatWindow from '../components/ChatWindow.vue'
import MessageSidebar from '../components/ChatSidebar.vue'
import { getUserDoc, findUserByUsername } from '../services/firebase'

const activeUser = ref(null)
const showSidebar = ref(false)
const router = useRouter()
const route = useRoute()

const selectChat = (user) => {
  // normalize minimal user objects that may come from sidebar
  if (user && typeof user === 'object') {
    activeUser.value = {
      id: user.id || user.uid || user.userId || null,
      name: user.name || user.displayName || '',
      username: user.username || '',
      avatar: user.avatar || ''
    }
  } else {
    activeUser.value = user
  }
}

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const closeSidebar = () => {
  showSidebar.value = false
}

const onInitialChats = (user) => {
  try {
    if (!activeUser || !activeUser.value) {
      selectChat(user)
    }
  } catch (err) {
    console.error('onInitialChats handler error:', err)
  }
}

onMounted(async () => {
  // Support both ?tutor=<username> (preferred) and legacy ?tutorId=<uid or username>
  const tutorRaw = route.query.tutor || route.query.tutorId
  if (!tutorRaw) return
  const tutorId = String(tutorRaw).trim()
  try {
    // Prefer resolving tutorId as a username (friendly URLs)
    const userByName = await findUserByUsername(tutorId)
    if (userByName) {
      activeUser.value = userByName
      return
    }

    // Fallback: attempt to treat tutorId as a user document id
    const userById = await getUserDoc(tutorId)
    if (userById) {
      activeUser.value = userById
      return
    }
  } catch (err) {
    console.error('Error loading tutor for chat (username or uid):', err)
  }
})

const goToDashboard = () => {
  router.push({ path: '/dashboard' })
}

onUnmounted(() => {})
</script>

<style scoped>
/* Mobile sidebar overlay */
.mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1040;
}
.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 320px;
  max-width: 90%;
  background: #fff;
  z-index: 1050;
  box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
  overflow: auto;
}

/* Ensure chat column takes full height on small screens */
.d-flex.flex-column > .chat-window {
  min-height: 0;
}
</style>
