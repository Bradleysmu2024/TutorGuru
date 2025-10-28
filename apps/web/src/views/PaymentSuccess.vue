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
          <div class="card-body text-center p-2">
            <i class="bi bi-check-circle-fill text-success" style="font-size: 5rem;"></i>
            <h2 class="mt-4 text-success">Payment Successful!</h2>
            <p class="lead">Thank you for your payment.</p>
            
            <!-- Payment Summary -->
            <div v-if="paymentSummary" class="payment-summary mt-4 mb-4">
              <div class="card bg-light">
                <div class="card-body">
                  <h5 class="card-title mb-3">
                    <i class="bi bi-receipt"></i> Payment Summary
                  </h5>
                  
                  <div class="summary-details text-start">
                    <div class="row mb-2">
                      <div class="col-5 text-muted">Assignment:</div>
                      <div class="col-7 fw-bold">{{ paymentSummary.assignmentTitle }}</div>
                    </div>
                    <div class="row mb-2">
                      <div class="col-5 text-muted">Tutor:</div>
                      <div class="col-7 fw-bold">{{ paymentSummary.tutorName }}</div>
                    </div>
                    <hr>
                    <div class="row">
                      <div class="col-5 text-muted fs-5">Total Amount:</div>
                      <div class="col-7 fw-bold text-success fs-4">
                        ${{ (paymentSummary.amount / 100).toFixed(2) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p class="text-muted mb-4">
              Your payment has been processed successfully. The tutor will be notified.
            </p>
            
            <div class="mt-4 mb-4">
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
const paymentSummary = ref(null)

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
      // payment summary for display
      paymentSummary.value = {
        assignmentTitle: paymentData.assignmentTitle || 'N/A',
        tutorName: paymentData.tutorName || 'N/A',
        amount: paymentData.amount || 0
      }

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

.payment-summary {
  max-width: 500px;
  margin: 0 auto;
}

.summary-details {
  font-size: 0.95rem;
}

.summary-details .row {
  align-items: center;
}
</style>