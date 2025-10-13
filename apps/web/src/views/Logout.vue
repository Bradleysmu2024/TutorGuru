<script setup>
import { useRouter } from 'vue-router'
import { logoutUser, signInWithGoogle } from '../services/firebase'

const router = useRouter()

const handleLogout = async () => {
  try {
    const response = await logoutUser()

    if (!response.success) {
      alert(`Logout failed: ${response.error}`)
      return
    }

    const user = response.user
    localStorage.clear();

    console.log('Logout successful:', user)
    alert('Logout successful!')
    router.push('/')

  } catch (error) {
    console.error('Logout error:', error)
    alert('Unexpected error during logout.')
  }
}
handleLogout()
</script>


<template>
</template>
