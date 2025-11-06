<template>
  <div>
    <div class="text-center mb-3">
      <img :src="currentProfile.avatar || defaultAvatar" class="rounded-circle mb-2" width="100" height="100" style=" object-fit: cover"/>
      <h5>{{ currentProfile.name || 'You' }}</h5>
    </div>

    <input v-model="search" type="text" class="form-control mb-3" placeholder="Search" />

    <ul class="list-group overflow-auto" style="max-height: 70vh;">
      <li v-for="user in filteredUsers" :key="user.id"
          @click="$emit('selectChat', user)"
          :class="['list-group-item d-flex align-items-center list-group-item-action', user.id === props.selectedId ? 'selected-chat' : '']">
            <img :src="user.avatar || defaultAvatar" class="rounded-circle me-2" width="40" height="40"/>
        <div>
          <strong>{{ user.name }}</strong>
          <div class="small text-muted">{{ user.bio || 'No bio available' }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, getUserDoc, db, getCurrentUser } from '../services/firebase'
import { query, collection, orderBy, onSnapshot } from 'firebase/firestore'
const emit = defineEmits(['selectChat', 'initial-chats'])
const props = defineProps({ selectedId: [String, Number, null] })

const search = ref('')
const users = ref([])
let unsubscribe = null
const initialized = ref(false)
const currentProfile = ref({ name: '', avatar: '', username: '' })
let authUnsubscribe = null

import defaultAvatar from '../assets/images/profileplaceholder.jpg'

const enrichItems = async (items) => {
  return Promise.all(items.map(async (item) => {
    if (!item || !item.id) return item
    const needsEnrich = item.name === 'Unknown' || !item.bio || item.avatar === defaultAvatar
    if (!needsEnrich) return item
    try {
      const u = await getUserDoc(item.id)
      if (u) {
        return {
          id: item.id,
          name: u.name || item.name,
          username: u.username || item.username || '',
          avatar: u.avatar || item.avatar,
          lastMessage: item.lastMessage || '',
          bio: u.bio || item.bio || ''
        }
      }
    } catch (e) {
      console.error('Error enriching user', item.id, e)
    }
    return item
  }))
}
const emitInitialIfNeeded = (list) => {
  if (!initialized.value && Array.isArray(list) && list.length > 0) {
    if (typeof emit === 'function') emit('initial-chats', list[0])
    initialized.value = true
  }
}

const loadChats = async () => {
  try {
    let currentUid = auth.currentUser ? auth.currentUser.uid : null
    if (!currentUid) {
      // wait briefly for auth to initialize
      const user = await getCurrentUser()
      currentUid = user ? user.uid : null
    }
    if (!currentUid) return
    const q = query(collection(db, 'chats', currentUid, 'chats'), orderBy('updatedAt', 'desc'))
    unsubscribe = onSnapshot(q, async (snap) => {
      try {
        const items = snap.docs.map((d) => {
          const data = d.data() || {}
          const otherUid = d.id
          const participant = (data.participants && Array.isArray(data.participants))
            ? data.participants.find((p) => p.id === otherUid) || { id: otherUid }
            : { id: otherUid }

          return {
            id: otherUid,
            name: participant.name || 'Unknown User',
            username: participant.username || '',
            avatar: participant.avatar || defaultAvatar,
            lastMessage: data.lastMessage || '',
            bio: participant.bio || ''
          }
        })

        try {
          const enriched = await enrichItems(items)
          users.value = enriched
          emitInitialIfNeeded(users.value)
        } catch (e) {
          console.error('Error enriching chat items:', e)
          users.value = items
          emitInitialIfNeeded(users.value)
        }
      } catch (err) {
        console.error('Error processing chat snapshot:', err)
      }
    })
  } catch (err) {
    console.error('Error loading chats:', err)
  }
}

onMounted(() => {
  loadChats()
  const tryLoadProfile = async (uid) => {
    if (!uid) return
    try {
      const u = await getUserDoc(uid)
      if (u) currentProfile.value = u
    } catch (e) {
      console.error('Error loading current profile:', e)
    }
  }

  const userNow = auth.currentUser
  if (userNow) {
    tryLoadProfile(userNow.uid)
  } else {
    authUnsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && u.uid) tryLoadProfile(u.uid)
      if (typeof authUnsubscribe === 'function') { authUnsubscribe() ; authUnsubscribe = null }
    })
  }
})

onUnmounted(() => {
  if (typeof unsubscribe === 'function') unsubscribe()
  if (typeof authUnsubscribe === 'function') {
    try { authUnsubscribe() } catch (e) { /* ignore */ }
    authUnsubscribe = null
  }
})

const filteredUsers = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u => {
    const name = (u.name || '').toLowerCase()
    const username = (u.username || '').toLowerCase()
    return (name && name.includes(q)) || (username && username.includes(q))
  })
})
</script>

<style scoped>
.selected-chat {
  background-color: #e9f5ff; /* light blue */
}
</style>
