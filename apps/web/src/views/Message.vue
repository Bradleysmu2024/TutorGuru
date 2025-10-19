<template>
  <div class="container-fluid d-flex bg-light flex-grow-1" style="min-height: 0;">
    <div class="col-3 p-3 border-end bg-white" style="min-height: 0;">
      <MessageSidebar @selectChat="selectChat" />
    </div>
    <div class="col-9 d-flex flex-column" style="min-height: 0;">
      <ChatWindow :activeUser="activeUser" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChatWindow from '../components/ChatWindow.vue'
import MessageSidebar from '../components/ChatSidebar.vue'

const activeUser = ref(null)
const selectChat = (user) => {
  activeUser.value = user
}
</script>
