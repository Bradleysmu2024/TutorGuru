<template>
  <div class="container-fluid d-flex bg-light flex-grow-1" style="min-height: 0;">
    <div class="col-3 p-3 border-end bg-white" style="min-height: 0;">
  <MessageSidebar @selectChat="selectChat" @initial-chats="onInitialChats" />
    </div>
    <div class="col-9 d-flex flex-column" style="min-height: 0;">
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
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'

const activeUser = ref(null)
const router = useRouter()
const route = useRoute()

const selectChat = (user) => {
  activeUser.value = user
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
    const q = query(collection(db, 'users'), where('username', '==', tutorId))
    const snap2 = await getDocs(q)
    if (!snap2.empty) {
      const d = snap2.docs[0]
      activeUser.value = { id: d.id, ...d.data() }
      return
    }

    // Fallback: attempt to treat tutorId as a user document id
    const refDoc = doc(db, 'users', tutorId)
    const snap = await getDoc(refDoc)
    if (snap.exists()) {
      activeUser.value = { id: snap.id, ...snap.data() }
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
