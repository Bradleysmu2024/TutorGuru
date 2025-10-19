<template>
  <div class="p-3 border-top d-flex">
    <input v-model="message" @keyup.enter="sendMessage" type="text" class="form-control me-2" placeholder="Type a message"/>
    <button @click="sendMessage" class="btn btn-primary">
      <i class="bi bi-send"></i> Send
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'

const props = defineProps({ chatId: Number })
const message = ref('')

const sendMessage = async () => {
  if (!message.value.trim()) return
  await addDoc(collection(db, `chats/${props.chatId}/messages`), {
    text: message.value,
    sender: 'me',
    timestamp: serverTimestamp()
  })
  message.value = ''
}
</script>
