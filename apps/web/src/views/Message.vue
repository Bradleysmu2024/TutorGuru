<template>
  <div class="container-fluid d-flex bg-light flex-grow-1" style="min-height: 0;">
    <div class="col-3 p-3 border-end bg-white" style="min-height: 0;">
      <MessageSidebar @selectChat="selectChat" />
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
import { ref, watch, onUnmounted, onMounted } from 'vue'
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

onMounted(async () => {
  const tutorId = route.query.tutorId
  if (!tutorId) return
  try {
    // try loading by doc id
    const refDoc = doc(db, 'tutorProfile', String(tutorId))
    const snap = await getDoc(refDoc)
    if (snap.exists()) {
      activeUser.value = { id: snap.id, ...snap.data() }
      return
    }

    // fallback: try username field
    const q = query(collection(db, 'tutorProfile'), where('username', '==', String(tutorId)))
    const snap2 = await getDocs(q)
    if (!snap2.empty) {
      const d = snap2.docs[0]
      activeUser.value = { id: d.id, ...d.data() }
    }
  } catch (err) {
    console.error('Error loading tutor for chat:', err)
  }
})

const goToDashboard = () => {
  router.push({ path: '/dashboard' })
}

// cancel any timer if component destroyed (defensive)
onUnmounted(() => {})
</script>
