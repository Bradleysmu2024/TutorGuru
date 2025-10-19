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
import { ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import ChatWindow from '../components/ChatWindow.vue'
import MessageSidebar from '../components/ChatSidebar.vue'

const activeUser = ref(null)
const router = useRouter()

const selectChat = (user) => {
  activeUser.value = user
}

const goToDashboard = () => {
  router.push({ path: '/dashboard' })
}

// cancel any timer if component destroyed (defensive)
onUnmounted(() => {})
</script>
