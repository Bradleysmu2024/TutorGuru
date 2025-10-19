<template>
  <div class="d-flex flex-column flex-grow-1" style="min-height: 0;">
    <!-- Header -->
    <div class="p-3 border-bottom d-flex align-items-center" v-if="activeUser">
      <img :src="activeUser.avatar" class="rounded-circle me-2" width="40" height="40"/>
      <div>
        <strong>{{ activeUser.name }}</strong><br/>
        <small class="text-muted">Last active 1 hour ago</small>
      </div>
    </div>

    <!-- Message List -->
    <div class="flex-grow-1 p-3 overflow-auto bg-light" style="min-height: 0;">
      <div v-for="msg in messages" :key="msg.id" class="mb-3 d-flex"
           :class="msg.sender === 'me' ? 'justify-content-end' : 'justify-content-start'">
        <div :class="msg.sender === 'me' ? 'bg-primary text-white' : 'bg-white border'"
             class="p-2 rounded-3" style="max-width: 60%;">
          {{ msg.text }}
          <div class="small text-end text-muted">{{ formatTime(msg.timestamp) }}</div>
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
import { ref, watch } from 'vue'
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from '../services/firebase'
import MessageInput from './MessageInput.vue'

const props = defineProps({ activeUser: Object })
const messages = ref([])

watch(() => props.activeUser, (user) => {
  if (user) {
    const q = query(collection(db, `chats/${user.id}/messages`), orderBy('timestamp'))
    onSnapshot(q, (snapshot) => {
      messages.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    })
  }
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
