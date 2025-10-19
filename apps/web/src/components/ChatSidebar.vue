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
        <img :src="user.avatar" class="rounded-circle me-2" width="40" height="40"/>
        <div>
          <strong>{{ user.name }}</strong>
          <div class="small text-muted">Sed do eiusmod...</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const search = ref('')
const users = ref([
  { id: 1, name: 'Ioni Bowcher', avatar: '/src/assets/images/profileplaceholder.JPG' },
  { id: 2, name: 'Stephen Shaw', avatar: '/src/assets/images/profileplaceholder.JPG' },
  { id: 3, name: 'Xuxue Feng', avatar: '/src/assets/images/profileplaceholder.JPG' },
  { id: 4, name: 'Ivan Magalhaes', avatar: '/src/assets/images/profileplaceholder.JPG' },
  { id: 5, name: 'Onyama Limba', avatar: '/src/assets/images/profileplaceholder.JPG' }
])

const filteredUsers = computed(() =>
  users.value.filter(u => u.name.toLowerCase().includes(search.value.toLowerCase()))
)
</script>
