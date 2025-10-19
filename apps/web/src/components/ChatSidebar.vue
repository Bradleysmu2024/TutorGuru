<template>
  <div>
    <div class="text-center mb-3">
      <img src="/src/assets/images/profileplaceholder.JPG" class="rounded-circle mb-2" width="100" height="100"/>
      <h5>Asiya Javayant</h5>
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
import { db, auth } from '../services/firebase'

const search = ref('')
const users = ref([])
let unsubscribe = null

// Try to listen to a 'chats' collection which should contain chat documents.
// Each chat doc is expected to have: { id, participants: [{id,name,avatar}], lastMessage, updatedAt }
// We'll map that into a simple list of user-like items for the sidebar: { id, name, avatar, lastMessage }
const loadChats = async () => {
  try {
    const currentUid = auth.currentUser ? auth.currentUser.uid : null
    if (!currentUid) return
    const q = query(collection(db, 'chats', currentUid, 'chats'), orderBy('updatedAt', 'desc'))
    unsubscribe = onSnapshot(q, async (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data()
        const otherUid = d.id
        const participant = (data.participants && Array.isArray(data.participants))
          ? data.participants.find((p) => p.id === otherUid) || { id: otherUid }
          : { id: otherUid }

        return {
          id: otherUid,
          name: participant.name || 'Unknown',
          avatar: participant.avatar || '/src/assets/images/profileplaceholder.JPG',
          lastMessage: data.lastMessage || '',
          bio: participant.bio || ''
        }
      })

      // Enrich items by fetching users/{uid} when participant info is missing or defaulted
      try {
        const enriched = await Promise.all(items.map(async (item) => {
          if (item.name === 'Unknown' || !item.bio || item.avatar === '/src/assets/images/profileplaceholder.JPG') {
            try {
              const uSnap = await getDoc(doc(db, 'users', item.id))
              if (uSnap.exists()) {
                const u = uSnap.data() || {}
                item.name = u.name || item.name
                item.avatar = u.avatar || item.avatar
                item.bio = u.bio || item.bio
              }
            } catch (e) {
              console.error('Error enriching user', item.id, e)
            }
          }
          return item
        }))
        users.value = enriched
      } catch (e) {
        console.error('Error enriching chat items:', e)
        users.value = items
      }
    })
  } catch (err) {
    console.error('Error loading chats:', err)
    // fallback: try to load a users collection so the sidebar still shows contacts
    try {
      const snap = await getDocs(collection(db, 'users'))
      users.value = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}), avatar: (d.data() && d.data().avatar) || '/src/assets/images/profileplaceholder.JPG' }))
    } catch (e) {
      console.error('Fallback users load failed:', e)
    }
  }
}

onMounted(() => {
  loadChats()
})

onUnmounted(() => {
  if (typeof unsubscribe === 'function') unsubscribe()
})

const filteredUsers = computed(() =>
  users.value.filter(u => u.name && u.name.toLowerCase().includes(search.value.toLowerCase()))
)
</script>
