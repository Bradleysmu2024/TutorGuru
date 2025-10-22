<script setup>
import { ref, computed, watch } from 'vue'
import { createPaymentRecord, auth, db } from '../services/firebase'
import { createPaymentSession } from '../services/stripe'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

const props = defineProps({
  assignment: {
    type: Object,
    required: true
  },
  selectedTutor: {
    type: Object,
    default: null
  }
})

const processing = ref(false)
const paymentStatus = ref(null)

// Check payment status when component mounts or assignment changes
const checkPaymentStatus = async () => {
  if (!props.assignment?.id) return

  try {
    const paymentsRef = collection(db, 'payments')
    const q = query(
      paymentsRef,
      where('assignmentId', '==', props.assignment.id)
    )
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const payments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))

      payments.sort(
        (a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()
      )
      paymentStatus.value = payments[0]
      return payments[0]
    }

    return null
  } catch (error) {
    console.error('Error checking payment status:', error)
    return null
  }
}

// Watch for assignment changes
watch(() => props.assignment?.id, async (newId) => {
  if (newId) {
    await checkPaymentStatus()
  }
}, { immediate: true })

const isPaymentCompleted = computed(() => {
  return paymentStatus.value && paymentStatus.value.status === 'completed'
})

const calculateTotalSessions = () => {
  const sessionsPerWeek = props.assignment?.selectedDays?.length || 1
  const contractDuration = props.assignment?.contractDuration || 1
  return sessionsPerWeek * 4 * contractDuration
}

const calculateTotalAmount = () => {
  const hourlyRate = props.selectedTutor?.rate || props.assignment?.rate || 0
  const sessionsPerWeek = props.assignment?.selectedDays?.length || 1
  const contractDuration = props.assignment?.contractDuration || 1
  const sessionDuration = props.assignment?.sessionDuration || 1

  const totalSessions = sessionsPerWeek * 4 * contractDuration
  return hourlyRate * totalSessions * sessionDuration
}

const initiatePayment = async () => {
  const assignmentId = props.assignment?.id

  if (!assignmentId) {
    alert('Assignment data is missing. Please refresh the page.')
    return
  }

  const selectedTutorId = props.assignment?.selectedTutorId
  if (!selectedTutorId) {
    alert('No tutor has been selected for this assignment.')
    return
  }

  if (!confirm('Proceed to payment for this assignment?')) {
    return
  }

  processing.value = true
  try {
    const tutor = props.selectedTutor

    if (!tutor) {
      throw new Error('Tutor information not found. Please contact support.')
    }

    const totalAmount = calculateTotalAmount()
    const currentUser = auth.currentUser

    if (!currentUser) {
      throw new Error('User not authenticated. Please log in.')
    }

    const existingPayment = await checkPaymentStatus()

    if (existingPayment && existingPayment.status === 'completed') {
      alert('This assignment has already been paid for.')
      processing.value = false
      return
    }

    let paymentId

    if (existingPayment && existingPayment.status === 'pending') {
      paymentId = existingPayment.id
      console.log('Reusing existing payment record:', paymentId)
    } else {
      paymentId = await createPaymentRecord(assignmentId, {
        tutorId: selectedTutorId,
        parentId: currentUser.uid,
        amount: totalAmount,
        assignmentTitle: props.assignment.title,
        tutorName: tutor.name || tutor.tutorName || 'Unknown Tutor',
        tutorRate: tutor.rate || props.assignment.rate
      })
      console.log('Created new payment record:', paymentId)
    }

    await createPaymentSession({
      paymentId: paymentId,
      assignmentId: assignmentId,
      totalAmount: totalAmount,
      title: props.assignment.title,
      selectedTutor: tutor,
    })
  } catch (error) {
    console.error('Payment initiation error:', error)
    alert(`Failed to initiate payment: ${error.message}`)
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div>
    <!-- Payment Completed Alert -->
    <div v-if="isPaymentCompleted" class="alert alert-success mb-4">
      <div class="d-flex align-items-center">
        <i class="bi bi-check-circle-fill fs-3 me-3"></i>
        <div>
          <h5 class="mb-1">Payment Completed</h5>
          <p class="mb-0">
            This assignment has been paid for. Payment ID:
            <code>{{ paymentStatus.id }}</code>
          </p>
          <small class="text-muted">
            Paid on:
            {{
              paymentStatus.paidAt?.toDate().toLocaleString() ||
              paymentStatus.createdAt?.toDate().toLocaleString()
            }}
          </small>
        </div>
      </div>
    </div>

    <!-- Payment Details Card (only if NOT paid) -->
    <div
      v-if="
        assignment.status === 'closed' &&
        assignment.selectedTutorId &&
        !isPaymentCompleted
      "
      class="card shadow-sm mb-4 border-warning"
    >
      <div class="card-body">
        <h4 class="card-title">
          <i class="bi bi-credit-card"></i> Payment Details
        </h4>

        <p class="mb-3">
          <strong>Payment to: {{ selectedTutor?.name || 'Selected Tutor' }}</strong>
        </p>

        <table class="table">
          <tbody>
            <tr>
              <td>Hourly Rate:</td>
              <td class="text-end">
                ${{ selectedTutor?.rate || assignment.rate || 0 }}
              </td>
            </tr>
            <tr>
              <td>Total Sessions:</td>
              <td class="text-end">
                {{ assignment.selectedDays.length }} × 4 × {{ assignment.contractDuration }} = 
                <strong>{{ calculateTotalSessions() }}</strong>
                <br>
                <small class="text-muted">
                  ({{ assignment.selectedDays.join(', ') }} × 4 weeks/month × {{ assignment.contractDuration }} months)
                </small>
              </td>
            </tr>
            <tr>
              <td>Duration per Session:</td>
              <td class="text-end">
                {{ assignment.sessionDuration }} hour(s)
              </td>
            </tr>
            <tr class="table-success">
              <td><strong>Total Amount:</strong></td>
              <td class="text-end">
                <strong class="text-success fs-5">
                  ${{ calculateTotalAmount().toFixed(2) }}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>

        <button
          class="btn btn-primary w-100"
          :disabled="processing"
          @click="initiatePayment"
        >
          <span v-if="processing">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Processing...
          </span>
          <span v-else>
            <i class="bi bi-credit-card me-2"></i>
            Proceed to Payment
          </span>
        </button>

        <p class="text-center text-muted mt-2 mb-0">
          <i class="bi bi-shield-check"></i> Secure payment powered by Stripe
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border: none;
  border-radius: 0.75rem;
}
</style>