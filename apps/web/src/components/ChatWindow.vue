<template>
  <div class="d-flex flex-column flex-grow-1" style="min-height: 0;">
    <!-- Header -->
    <div class="p-3 border-bottom d-flex align-items-center" v-if="activeUser">
      <img :src="activeUser.avatar || '/src/assets/images/profileplaceholder.JPG'" class="rounded-circle me-2" width="50" height="50"/>
      <div class="chat-user-info">
        <a href="#" class="text-decoration-none text-dark" @click.prevent="openProfile">
          <strong class="d-block mb-0">{{ activeUser.name }}</strong>
          <small class="text-muted d-block mt-1">@{{ activeUser.username }}</small>
        </a>
      </div>
    </div>

    <!-- Message List -->
    <div class="flex-grow-1 p-3 overflow-auto bg-light" style="min-height: 0;">
      
  <div v-for="msg in messages" :key="msg.id" class="mb-3 d-flex"
     :class="msg.senderIsMe ? 'justify-content-end' : 'justify-content-start'">
     <div :class="msg.senderIsMe ? 'bg-primary' : 'bg-white border'"
       class="p-2 rounded-3" style="max-width: 60%;">
          {{ msg.text }}
          <div class="small text-end text-muted" :class="msg.senderIsMe ? 'text-white' : 'text-dark'">{{ formatTime(msg.timestamp) }}</div>
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
import { ref, watch, onUnmounted, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db, auth } from '../services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import MessageInput from './MessageInput.vue'

const props = defineProps({ activeUser: Object })
const router = useRouter()

function openProfile() {
  const user = props.activeUser
  if (!user) return
  const username = user.username
  router.push({ name: 'PublicTutorProfile', params: { username } }).catch(() => {})
}

const messages = ref([])
let unsubscribe = null
let authUnsubscribe = null
let retryInterval = null
let retryCount = 0
const MAX_RETRY = 20 // ~5s with 250ms interval

const attachListener = (currentUid, otherId) => {
  // cleanup previous
  if (typeof unsubscribe === 'function') unsubscribe()
  if (!currentUid || !otherId) return
  try {
    const q = query(collection(db, 'chats', currentUid, 'chats', String(otherId), 'messages'), orderBy('timestamp'))
    unsubscribe = onSnapshot(q, (snapshot) => {
      messages.value = snapshot.docs.map(doc => {
        const d = doc.data()
        return { id: doc.id, ...d, senderIsMe: d.sender === currentUid }
      })
    }, (err) => {
      console.error('[ChatWindow] Messages snapshot error:', err)
    })
  } catch (err) {
    console.error('[ChatWindow] Error attaching messages listener:', err)
  }
}

const handleActiveUser = (user) => {
  
  // Clean up previous listeners
  if (typeof unsubscribe === 'function') {
    try { unsubscribe() } catch (e) { /* ignore */ }
    unsubscribe = null
  }
  if (typeof authUnsubscribe === 'function') {
    try { authUnsubscribe() } catch (e) { /* ignore */ }
    authUnsubscribe = null
  }

  messages.value = []

  if (!user) return

  const current = auth.currentUser
  if (current && current.uid) {
    // auth ready -> attach directly
    attachListener(current.uid, user.id)
  } else {
    // wait for auth to become available, then attach
    authUnsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && u.uid) {
        attachListener(u.uid, user.id)
        // remove this auth listener; we'll re-run watch if activeUser changes
        if (typeof authUnsubscribe === 'function') {
          try { authUnsubscribe() } catch (e) { /* ignore */ }
          authUnsubscribe = null
        }
        // clear any retry interval if set
        if (retryInterval) {
          clearInterval(retryInterval)
          retryInterval = null
          retryCount = 0
        }
      }
    })

    // fallback polling in case onAuthStateChanged doesn't fire in time
    if (!retryInterval) {
      retryCount = 0
      retryInterval = setInterval(() => {
        retryCount += 1
        const u = auth.currentUser
        if (u && u.uid) {
          attachListener(u.uid, user.id)
          if (typeof authUnsubscribe === 'function') {
            try { authUnsubscribe() } catch (e) { /* ignore */ }
            authUnsubscribe = null
          }
          clearInterval(retryInterval)
          retryInterval = null
          retryCount = 0
        } else if (retryCount >= MAX_RETRY) {
          clearInterval(retryInterval)
          retryInterval = null
        }
      }, 250)
    }
  }
}

// watch for changes to activeUser
watch(() => props.activeUser, (user) => {
  handleActiveUser(user)
})

// ensure we run once on mount in case activeUser was set before this component mounted
onMounted(() => {
  try {
    handleActiveUser(props.activeUser)
  } catch (err) {
    console.error('[ChatWindow] onMounted handleActiveUser error:', err)
  }
})

onUnmounted(() => {
  if (typeof unsubscribe === 'function') unsubscribe()
  if (typeof authUnsubscribe === 'function') {
    try { authUnsubscribe() } catch (e) { /* ignore */ }
    authUnsubscribe = null
  }
  if (retryInterval) {
    try { clearInterval(retryInterval) } catch (e) { /* ignore */ }
    retryInterval = null
    retryCount = 0
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

.chat-user-info strong {
  line-height: 1;
}
.chat-user-info small {
  line-height: 1.1;
  opacity: 0.85;
}
</style>
