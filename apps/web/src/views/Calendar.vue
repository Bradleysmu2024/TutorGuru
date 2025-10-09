<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// import { loginUser, signInWithGoogle } from '../services/firebase'
import Calendar from '../components/Calendar.vue'

const router = useRouter()
const loginForm = ref({
  email: '',
  password: '',
  remember: false
})
</script>

<template>
  <calendar/>
</template>

<style scoped>

</style>
