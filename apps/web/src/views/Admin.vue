<template>
  <div class="container py-4">
    <h2 class="mb-3">Admin Console</h2>

    <section class="mb-4">
      <h5>Users</h5>
      <div class="d-flex mb-3 gap-2 align-items-center">
        <div style="min-width:160px">
          <select class="form-select" v-model="roleFilter">
            <option value="all">All roles</option>
            <option value="tutor">tutor</option>
            <option value="admin">admin</option>
            <option value="parent">parent</option>
          </select>
        </div>
        <div style="min-width:140px">
          <select class="form-select" v-model="pageSize" aria-label="Users per page" title="Users per page">
            <option :value="10">10 per page</option>
            <option :value="20">20 per page</option>
            <option :value="50">50 per page</option>
          </select>
        </div>
        <div class="flex-grow-1">
          <input class="form-control" placeholder="Search by email, username or name" v-model="searchQuery" />
        </div>
        <div>
          <button class="btn btn-outline-secondary" @click="clearFilters">Clear</button>
        </div>
      </div>
      <LoadingState :loading="loadingUser" message="Loading users..." color="primary" />
      <div v-if="!loadingUser">
        <div v-if="filteredAll.length === 0" class="text-muted">No users found.</div>
        <div class="mb-2 text-muted small">Showing {{ visibleUsers.length }} of {{ filteredAll.length }}</div>
        <ul class="list-group">
          <li v-for="t in visibleUsers" :key="t.id" class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{{ t.name || t.username || t.email }}</strong>
              <div class="text-muted small">{{ t.email }}</div>
              <div class="text-muted small">Role: <strong>{{ t.role || 'tutor' }}</strong></div>
              <div class="text-muted small">Verified: <strong>{{ t.verified ? 'Yes' : 'No' }}</strong></div>
            </div>
            <div class="d-flex gap-2">
              <button :disabled="t.role !== 'tutor' || t.verified" v-if="!t.verified" class="btn btn-sm btn-success" @click="setVerified(t, true)">Verify</button>
              <button v-else class="btn btn-sm btn-warning" @click="setVerified(t, false)">Unverify</button>
              <button class="btn btn-sm btn-primary" @click="openEdit(t)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="deleteUser(t)">Delete</button>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Edit Tutor Modal -->
  <div v-if="editUser" class="modal fade show" style="display:block; background: rgba(0,0,0,0.4)" tabindex="-1" @click.self="cancelEdit">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit User</h5>
            <button class="btn-close" @click="cancelEdit"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Username</label>
              <input class="form-control" v-model="editForm.username" />
            </div>
            <div class="mb-3">
              <label class="form-label">Name</label>
              <input class="form-control" v-model="editForm.name" />
            </div>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input class="form-control" v-model="editForm.email" />
            </div>
            <div class="mb-3">
              <label class="form-label">Role</label>
              <select class="form-select" v-model="editForm.role">
                <option value="tutor">tutor</option>
                <option value="admin">admin</option>
                <option value="parent">parent</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="cancelEdit">Cancel</button>
            <button class="btn btn-primary" @click="saveEdit">Save</button>
          </div>
        </div>
      </div>
    </div>

    <section>
      <h5>Subjects Database</h5>
      <p class="text-muted">Reset the Subjects database to default lists.</p>
      <div class="d-flex gap-2">
        <button class="btn btn-danger" :disabled="resetting" @click="resetSubjects">Reset Subjects Collection</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { db, setUserDoc } from '../services/firebase'
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore'
import { useToast } from '../composables/useToast'
import { useRouter } from 'vue-router'
import LoadingState from '../components/LoadingState.vue'

const toast = useToast()
const router = useRouter()

const users = ref([])
const loadingUser = ref(false)
const resetting = ref(false)
const roleFilter = ref('all')
const searchQuery = ref('')
const pageSize = ref(10)

// full filtered list (used for counts/empty-state)
const filteredAll = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase()
  return users.value.filter(u => {
    if (roleFilter.value && roleFilter.value !== 'all' && (u.role || 'tutor') !== roleFilter.value) return false
    if (!q) return true
    const name = (u.name || '').toLowerCase()
    const email = (u.email || '').toLowerCase()
    const username = (u.username || '').toLowerCase()
    return name.includes(q) || email.includes(q) || username.includes(q)
  })
})

// sliced list to display on-screen according to pageSize
const visibleUsers = computed(() => {
  return filteredAll.value.slice(0, pageSize.value)
})

    async function loadUser() {
  loadingUser.value = true
  users.value = []
  try {
    // load all users; client-side filtering will handle role/search
      const q = query(collection(db, 'users'))
      const snap = await getDocs(q)
      users.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error loading users', err)
    toast.error('Failed to load users')
  } finally {
    loadingUser.value = false
  }
}

function clearFilters() {
  roleFilter.value = 'all'
  searchQuery.value = ''
}

async function setVerified(t, value) {
  try {
    await setUserDoc(t.id, { verified: value }, { merge: true })
    toast.success(`User ${value ? 'verified' : 'unverified'}`)
    // update local list
    const idx = users.value.findIndex(x => x.id === t.id)
    if (idx !== -1) users.value[idx].verified = value
  } catch (err) {
    console.error('Error updating verified', err)
    toast.error('Failed to update user')
  }
}

async function deleteUser(t) {
  if (!confirm(`Delete user ${t.name || t.email}? This cannot be undone.`)) return
  try {
    await deleteDoc(doc(db, 'users', t.id))
    users.value = users.value.filter(x => x.id !== t.id)
    toast.success('User deleted')
  } catch (err) {
    console.error('Error deleting user', err)
    toast.error('Failed to delete user')
  }
}

const editUser = ref(null)
const editForm = ref({ username: '', name: '', email: '', role: 'tutor' })

function openEdit(t) {
  editUser.value = t
  editForm.value = { username: t.username || '', name: t.name || '', email: t.email || '', role: t.role || 'tutor' }
}

async function saveEdit() {
  if (!editUser.value) return
  // validate required fields
  if (!editForm.value.username || !editForm.value.email) {
    toast.error('Username and email are required')
    return
  }
  try {
    const updates = { username: editForm.value.username, name: editForm.value.name, email: editForm.value.email, role: editForm.value.role }
    await setUserDoc(editUser.value.id, updates, { merge: true })
    // update local list
      const idx = users.value.findIndex(x => x.id === editUser.value.id)
      if (idx !== -1) users.value[idx] = { ...users.value[idx], ...updates }
    toast.success('User updated')
    editUser.value = null
  } catch (err) {
    console.error('Error saving user edits', err)
    toast.error('Failed to save user')
  }
}

function cancelEdit() {
  editUser.value = null
}

const defaultLevels = [
  { name: 'All Levels', grades: ['All Levels'] },
  {
    name: 'Primary',
    grades: [
      'Primary 1',
      'Primary 2',
      'Primary 3',
      'Primary 4',
      'Primary 5',
      'Primary 6',
    ],
  },
  {
    name: 'Secondary',
    grades: [
      'Secondary 1',
      'Secondary 2',
      'Secondary 3',
      'Secondary 4',
      'Secondary 5',
    ],
  },
  { name: 'Junior College', grades: ['Junior College 1', 'Junior College 2'] },
  { name: 'Polytechnic', grades: ['Polytechnic Year 1', 'Polytechnic Year 2', 'Polytechnic Year 3'] },
  { name: 'ITE', grades: ['ITE Nitec Year 1', 'ITE Nitec Year 2', 'ITE Nitec Year 3', 'ITE Higher Nitec Year 1', 'ITE Higher Nitec Year 2'] },
  { name: 'University', grades: ['University Year 1', 'University Year 2', 'University Year 3', 'University Year 4'] },
]

const defaultLocations = [
  'All Locations',
  'Online',
  // 55 planning areas of Singapore (plus Online & All Locations)
  'Ang Mo Kio',
  'Bedok',
  'Bishan',
  'Boon Lay',
  'Bukit Batok',
  'Bukit Merah',
  'Bukit Panjang',
  'Bukit Timah',
  'Central Water Catchment',
  'Changi',
  'Changi Bay',
  'Choa Chu Kang',
  'Clementi',
  'Downtown Core',
  'Geylang',
  'Hougang',
  'Jurong East',
  'Jurong West',
  'Kallang',
  'Lim Chu Kang',
  'Mandai',
  'Marina East',
  'Marina South',
  'Marine Parade',
  'Museum',
  'Newton',
  'North-Eastern Islands',
  'Novena',
  'Orchard',
  'Outram',
  'Pasir Ris',
  'Paya Lebar',
  'Pioneer',
  'Punggol',
  'Queenstown',
  'River Valley',
  'Rochor',
  'Seletar',
  'Sembawang',
  'Sengkang',
  'Serangoon',
  'Simpang',
  'Singapore River',
  'Southern Islands',
  'Straits View',
  'Sungei Kadut',
  'Tampines',
  'Tanglin',
  'Tengah',
  'Toa Payoh',
  'Tuas',
  'Western Islands',
  'Western Water Catchment',
  'Woodlands',
  'Yishun'
]

const defaultSubjects = [
  'All Subjects',
  'English',
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Chinese',
  'Higher Chinese',
  'Malay',
  'Tamil',
  'Geography',
  'History',
  'Social Studies',
  'Computer Science',
  'Economics',
  'Accounting',
  'Art',
  'Music',
  'Physical Education'
]

async function resetSubjects() {
  if (!confirm('This will overwrite the Subjects collection documents. Continue?')) return
  resetting.value = true
  try {
    await setDoc(doc(db, 'Subjects', 'levels'), { list: defaultLevels })
    await setDoc(doc(db, 'Subjects', 'location'), { list: defaultLocations })
    await setDoc(doc(db, 'Subjects', 'subject'), { list: defaultSubjects })
  toast.success('Subjects collection reset')
  } catch (err) {
    console.error('Error resetting subjects', err)
    toast.error('Failed to reset subjects')
  } finally {
    resetting.value = false
  }
}

onMounted(() => {
  loadUser()
})

</script>

<style scoped>
.container { max-width: 900px; }
</style>
