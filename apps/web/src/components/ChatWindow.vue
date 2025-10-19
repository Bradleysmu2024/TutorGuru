<template>
  <div class="d-flex flex-column flex-grow-1" style="min-height: 0;">
    <!-- Header -->
    <div class="p-3 border-bottom d-flex align-items-center" v-if="activeUser">
      <img :src="activeUser.avatar || '/src/assets/images/profileplaceholder.JPG'" class="rounded-circle me-2" width="40" height="40"/>
      <div>
        <a href="#" class="text-decoration-none text-dark" @click.prevent="openProfile">
          <strong>{{ activeUser.name }}</strong>
        </a>
        <br />
      </div>
    </div>

    <!-- Message List -->
    <div class="flex-grow-1 p-3 overflow-auto bg-light" style="min-height: 0;">
   <div v-for="msg in messages" :key="msg.id" class="mb-3 d-flex"
     :class="msg.senderIsMe ? 'justify-content-end' : 'justify-content-start'">
     <div :class="msg.senderIsMe ? 'bg-primary text-white' : 'bg-white border'"
       class="p-2 rounded-3" style="max-width: 60%;">
          {{ msg.text }}
          <div class="small text-end text-muted text-white">{{ formatTime(msg.timestamp) }}</div>
        </div>
      </div>
    </div>

    <!-- Input Bar -->
    <div class="border-top bg-white">
      <MessageInput v-if="activeUser" :chatId="activeUser.id" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db, auth } from '../services/firebase'
import MessageInput from './MessageInput.vue'

const props = defineProps({ activeUser: Object })
const router = useRouter()

function openProfile() {
  const user = props.activeUser
  if (!user) return
  const username = user.username || user.name || user.id
  router.push({ name: 'PublicTutorProfile', params: { username } }).catch(() => {})
}
const messages = ref([])
let unsubscribe = null

watch(() => props.activeUser, (user) => {
  // clean up previous listener
  if (typeof unsubscribe === 'function') unsubscribe()
  messages.value = []
  if (user) {
    const currentUid = auth.currentUser ? auth.currentUser.uid : null
    // listen to messages under the logged-in user's nested chat path
    const q = query(collection(db, 'chats', currentUid, 'chats', String(user.id), 'messages'), orderBy('timestamp'))
    unsubscribe = onSnapshot(q, (snapshot) => {
      messages.value = snapshot.docs.map(doc => {
        const d = doc.data()
        return { id: doc.id, ...d, senderIsMe: d.sender === currentUid }
      })
    })
  }
})

onUnmounted(() => {
  if (typeof unsubscribe === 'function') unsubscribe()
})

function formatTime(ts) {
  return ts ? new Date(ts.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
}
</script>

<style scoped>
/* Important to prevent input bar from going off screen */
.d-flex.flex-column.flex-grow-1 {
  overflow: hidden;
  min-height: 0;
}
</style>
