<template>
  <div class="container py-4">
    <h2 class="mb-3">Admin Console</h2>

    <section class="mb-4">
      <h5>Unverified Tutors</h5>
      <LoadingState :loading="loadingTutors" message="Loading tutors..." color="primary" />
      <div v-if="!loadingTutors">
        <div v-if="tutors.length === 0" class="text-muted">No unverified tutors.</div>
        <ul class="list-group">
          <li v-for="t in tutors" :key="t.id" class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{{ t.name || t.username || t.email }}</strong>
              <div class="text-muted small">{{ t.email }}</div>
            </div>
            <div>
              <button class="btn btn-sm btn-success me-2" @click="verifyTutor(t)">Verify</button>
              <button class="btn btn-sm btn-outline-secondary" @click="viewTutor(t)">View</button>
            </div>
          </li>
        </ul>
      </div>
    </section>

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
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore'
import { useToast } from '../composables/useToast'
import { useRouter } from 'vue-router'
import LoadingState from '../components/LoadingState.vue'

const toast = useToast()
const router = useRouter()

const tutors = ref([])
const loadingTutors = ref(false)
const resetting = ref(false)
const preview = ref(null)

async function loadUnverifiedTutors() {
  loadingTutors.value = true
  tutors.value = []
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'tutor'), where('verified', '==', false))
    const snap = await getDocs(q)
    tutors.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error loading tutors', err)
    toast.error('Failed to load tutors')
  } finally {
    loadingTutors.value = false
  }
}

function viewTutor(t) {
  if (t.username) {
    router.push({ path: `/tutor/${t.username}` }).catch(() => {})
  } else {
    toast.info('Tutor has no public username')
  }
}

async function verifyTutor(t) {
  try {
    await setUserDoc(t.id, { verified: true }, { merge: true })
    toast.success('Tutor verified')
    tutors.value = tutors.value.filter(x => x.id !== t.id)
  } catch (err) {
    console.error('Error verifying tutor', err)
    toast.error('Failed to verify tutor')
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
    loadPreview()
  } catch (err) {
    console.error('Error resetting subjects', err)
    toast.error('Failed to reset subjects')
  } finally {
    resetting.value = false
  }
}

onMounted(() => {
  loadUnverifiedTutors()
})

</script>

<style scoped>
.container { max-width: 900px; }
</style>
