<template>
  <div class="container py-4">
    <h2 class="mb-3">Admin Console</h2>

    <section class="mb-4">
      <h5>Tutors</h5>
        <LoadingState :loading="loadingTutors" message="Loading tutors..." color="primary" />
        <div v-if="!loadingTutors">
          <div v-if="tutors.length === 0" class="text-muted">No tutors found.</div>
          <ul class="list-group">
            <li v-for="t in tutors" :key="t.id" class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{{ t.name || t.username || t.email }}</strong>
                <div class="text-muted small">{{ t.email }}</div>
                <div class="text-muted small">Verified: <strong>{{ t.verified ? 'Yes' : 'No' }}</strong></div>
              </div>
              <div class="d-flex gap-2">
                <button v-if="!t.verified" class="btn btn-sm btn-success" @click="setVerified(t, true)">Verify</button>
                <button v-else class="btn btn-sm btn-warning" @click="setVerified(t, false)">Unverify</button>
                <button class="btn btn-sm btn-primary" @click="openEdit(t)">Edit</button>
                <button class="btn btn-sm btn-danger" @click="deleteTutor(t)">Delete</button>
              </div>
            </li>
          </ul>
        </div>
    </section>

    <!-- Edit Tutor Modal -->
    <div v-if="editingTutor" class="modal fade show" style="display:block; background: rgba(0,0,0,0.4)" tabindex="-1" @click.self="cancelEdit">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Tutor</h5>
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
import { ref, onMounted } from 'vue'
import { db, setUserDoc } from '../services/firebase'
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore'
import { useToast } from '../composables/useToast'
import { useRouter } from 'vue-router'
import LoadingState from '../components/LoadingState.vue'

const toast = useToast()
const router = useRouter()

const tutors = ref([])
const loadingTutors = ref(false)
const resetting = ref(false)

async function loadTutors() {
  loadingTutors.value = true
  tutors.value = []
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'tutor'))
    const snap = await getDocs(q)
    tutors.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error loading tutors', err)
    toast.error('Failed to load tutors')
  } finally {
    loadingTutors.value = false
  }
}

async function setVerified(t, value) {
  try {
    await setUserDoc(t.id, { verified: value }, { merge: true })
    toast.success(`Tutor ${value ? 'verified' : 'unverified'}`)
    // update local list
    const idx = tutors.value.findIndex(x => x.id === t.id)
    if (idx !== -1) tutors.value[idx].verified = value
  } catch (err) {
    console.error('Error updating verified', err)
    toast.error('Failed to update tutor')
  }
}

async function deleteTutor(t) {
  if (!confirm(`Delete tutor ${t.name || t.email}? This cannot be undone.`)) return
  try {
    await deleteDoc(doc(db, 'users', t.id))
    tutors.value = tutors.value.filter(x => x.id !== t.id)
    toast.success('Tutor deleted')
  } catch (err) {
    console.error('Error deleting tutor', err)
    toast.error('Failed to delete tutor')
  }
}

const editingTutor = ref(null)
const editForm = ref({ username: '', name: '', email: '', role: 'tutor' })

function openEdit(t) {
  editingTutor.value = t
  editForm.value = { username: t.username || '', name: t.name || '', email: t.email || '', role: t.role || 'tutor' }
}

async function saveEdit() {
  if (!editingTutor.value) return
  // validate required fields
  if (!editForm.value.username || !editForm.value.email) {
    toast.error('Username and email are required')
    return
  }
  try {
    const updates = { username: editForm.value.username, name: editForm.value.name, email: editForm.value.email, role: editForm.value.role }
    await setUserDoc(editingTutor.value.id, updates, { merge: true })
    // update local list
    const idx = tutors.value.findIndex(x => x.id === editingTutor.value.id)
    if (idx !== -1) tutors.value[idx] = { ...tutors.value[idx], ...updates }
    toast.success('Tutor updated')
    editingTutor.value = null
  } catch (err) {
    console.error('Error saving tutor edits', err)
    toast.error('Failed to save tutor')
  }
}

function cancelEdit() {
  editingTutor.value = null
}

function viewTutor(t) {
  if (t.username) {
    router.push({ path: `/tutor/${t.username}` }).catch(() => {})
  } else {
    toast.info('Tutor has no public username')
  }
}



const defaultLevels = [
  'All Levels',
  'Primary',
  'Secondary',
  'Junior College',
  'Polytechnic',
  'ITE',
  'University'
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
  loadTutors()
})

</script>

<style scoped>
.container { max-width: 900px; }
</style>
