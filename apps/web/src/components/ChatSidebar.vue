<template>
  <div>
    <div class="text-center mb-3">
      <img :src="currentProfile.avatar || '/src/assets/images/profileplaceholder.JPG'" class="rounded-circle mb-2" width="100" height="100"/>
      <h5>{{ currentProfile.name || 'You' }}</h5>
    </div>

    <input v-model="search" type="text" class="form-control mb-3" placeholder="Search" />

    <ul class="list-group overflow-auto" style="max-height: 70vh;">
      <li v-for="user in filteredUsers" :key="user.id"
          @click="$emit('selectChat', user)"
          class="list-group-item d-flex align-items-center list-group-item-action">
            <img :src="user.avatar || '/src/assets/images/profileplaceholder.JPG'" class="rounded-circle me-2" width="40" height="40"/>
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
import { collection, query, orderBy, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../services/firebase'
const emit = defineEmits(['selectChat', 'initial-chats'])

const search = ref('')
const users = ref([])
let unsubscribe = null
const initialized = ref(false)
const currentProfile = ref({ name: '', avatar: '', username: '' })
let authUnsubscribe = null

const enrichItems = async (items) => {
  return Promise.all(items.map(async (item) => {
    if (!item || !item.id) return item
    const needsEnrich = item.name === 'Unknown' || !item.bio || item.avatar === '/src/assets/images/profileplaceholder.JPG'
    if (!needsEnrich) return item
    try {
      const uSnap = await getDoc(doc(db, 'users', item.id))
      if (uSnap && typeof uSnap.exists === 'function' && uSnap.exists()) {
        const u = uSnap.data() || {}
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

const fetchUsersFallback = async () => {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => ({ id: d.id, ...(d.data() || {}), username: (d.data() && d.data().username) || '', avatar: (d.data() && d.data().avatar) || '/src/assets/images/profileplaceholder.JPG' }))
}

const emitInitialIfNeeded = (list) => {
  if (!initialized.value && Array.isArray(list) && list.length > 0) {
    if (typeof emit === 'function') emit('initial-chats', list[0])
    initialized.value = true
  }
}

const loadChats = async () => {
  try {
    const currentUid = auth.currentUser ? auth.currentUser.uid : null
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
            avatar: participant.avatar || '/src/assets/images/profileplaceholder.JPG',
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
    try {
      users.value = await fetchUsersFallback()
      emitInitialIfNeeded(users.value)
    } catch (e) {
      console.error('Fallback users load failed:', e)
    }
  }
}

onMounted(() => {
  loadChats()
  // load current user's profile for header
  const tryLoadProfile = async (uid) => {
    if (!uid) return
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap && snap.exists()) {
        currentProfile.value = { id: snap.id, ...(snap.data() || {}) }
      }
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
