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
import { addDoc, collection, serverTimestamp, doc, setDoc } from 'firebase/firestore'
import { db, auth } from '../services/firebase'

const props = defineProps({ chatId: [String, Number] })
const message = ref('')

const sendMessage = async () => {
  if (!message.value.trim()) return
  const user = auth.currentUser
  if (!user) {
    alert('You must be logged in to send messages.')
    return
  }

  const payload = {
    text: message.value,
    sender: user.uid,
    senderName: user.displayName || user.email || user.uid,
    timestamp: serverTimestamp()
  }

  try {
    const senderUid = user.uid
    const recipientUid = String(props.chatId)

    // canonical per-user paths:
    // chats/{senderUid}/chats/{recipientUid}/messages
    // chats/{recipientUid}/chats/{senderUid}/messages (recipient copy)

    // write message to sender's conversation
    await addDoc(collection(db, 'chats', senderUid, 'chats', recipientUid, 'messages'), payload)
    // write message to recipient's conversation (so they see it under their own nested path)
    await addDoc(collection(db, 'chats', recipientUid, 'chats', senderUid, 'messages'), payload)

    // update conversation doc metadata for both sides (merge)
    const convoData = {
      participants: [
        { id: senderUid, name: payload.senderName },
        { id: recipientUid }
      ],
      lastMessage: payload.text,
      updatedAt: serverTimestamp()
    }
    await setDoc(doc(db, 'chats', senderUid, 'chats', recipientUid), convoData, { merge: true })
    await setDoc(doc(db, 'chats', recipientUid, 'chats', senderUid), convoData, { merge: true })
  } catch (err) {
    console.error('Error sending message:', err)
  }

  message.value = ''
}
</script>
