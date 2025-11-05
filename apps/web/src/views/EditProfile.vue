<template>
  <div>
    <component :is="activeComponent" v-if="activeComponent" />
    <div v-else class="container py-4">
      <div class="alert alert-warning">Loading profile editor...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import TutorProfile from './TutorProfile.vue'
import ParentProfile from './ParentProfile.vue'
import { getUserRole } from '../services/firebase'
import router from '../router/routes'

const activeComponent = ref(null)

onMounted(async () => {
  const user = auth.currentUser
  if (!user) {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push({ path: '/login', query: { redirect: '/editprofile' } })
        return
      }
      const role = await getUserRole(u.uid)
      activeComponent.value = role === 'tutor' ? TutorProfile : ParentProfile
      if (typeof unsub === 'function') unsub()
    })
    return
  }

  const role = await getUserRole(user.uid)
  activeComponent.value = role === 'tutor' ? TutorProfile : ParentProfile
})
</script>
