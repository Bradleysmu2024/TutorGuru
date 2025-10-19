<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <!-- Loading state -->
        <div v-if="loading" class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Verifying payment...</span>
          </div>
          <p class="mt-3">Processing your payment...</p>
        </div>

        <!-- Success state -->
        <div v-else-if="success" class="card border-success">
          <div class="card-body text-center p-5">
            <i class="bi bi-check-circle-fill text-success" style="font-size: 5rem;"></i>
            <h2 class="mt-4 text-success">Payment Successful!</h2>
            <p class="lead">Thank you for your payment.</p>
            <p class="text-muted">
              Your payment has been processed successfully. The tutor will be notified.
            </p>
            <div class="mt-4">
              <button @click="goToDashboard" class="btn btn-primary btn-lg me-2">
                <i class="bi bi-house-door"></i> Go to Dashboard
              </button>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else class="card border-danger">
          <div class="card-body text-center p-5">
            <i class="bi bi-x-circle-fill text-danger" style="font-size: 5rem;"></i>
            <h2 class="mt-4 text-danger">Payment Verification Failed</h2>
            <p class="text-muted">{{ error }}</p>
            <div class="mt-4">
              <button @click="goToDashboard" class="btn btn-secondary">
                <i class="bi bi-arrow-left"></i> Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { completePayment } from '../services/firebase'
import { verifyPayment } from '../services/stripe'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const success = ref(false)
const error = ref('')

onMounted(async () => {
  const sessionId = route.query.session_id
  const assignmentId = route.query.assignment_id

  if (!sessionId) {
    error.value = 'No session ID provided'
    loading.value = false
    return
  }

  try {
    console.log('Verifying payment with session ID:', sessionId)
    
    const paymentData = await verifyPayment(sessionId)
    console.log('Payment verification response:', paymentData)
    
    if (paymentData.status === 'paid') {
      if (assignmentId) {
        await completePayment(assignmentId, sessionId)
      }
      
      success.value = true
    } else {
      error.value = 'Payment was not completed'
    }
    
  } catch (err) {
    console.error('Error:', err)
    error.value = err.message || 'Failed to verify payment'
  } finally {
    loading.value = false
  }
})

const goToDashboard = () => {
  router.push('/parent-dashboard')
}
</script>

<style scoped>
.card {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}
</style>