<script setup>
import { ref, computed, watch } from "vue";
import {
  createPaymentRecord,
  auth,
  db,
  getUserDoc,
  getPaymentSummary,
} from "../services/firebase";
import { createPaymentSession } from "../services/stripe";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useToast } from "../composables/useToast";

const toast = useToast();

const props = defineProps({
  assignment: {
    type: Object,
    required: true,
  },
  selectedTutor: {
    type: Object,
    default: null,
  },
});

const processing = ref(false);
const paymentSummary = ref(null);
const paymentType = ref('full');
const showConfirmModal = ref(false);
const pendingPaymentData = ref(null);

// Check payment status
const checkPaymentStatus = async () => {
  if (!props.assignment?.id) return;

  try {
    const summary = await getPaymentSummary(props.assignment.id);
    paymentSummary.value = summary;
    
    // Set payment type based on first payment
    if (summary.payments.length > 0) {
      paymentType.value = summary.payments[0].paymentType;
    }
    
    return summary;
  } catch (error) {
    console.error("Error checking payment status:", error);
    return null;
  }
};

// Watch for assignment changes
watch(
  () => props.assignment?.id,
  async (newId) => {
    if (newId) {
      await checkPaymentStatus();
    }
  },
  { immediate: true }
);

const isPaymentCompleted = computed(() => {
  if (!paymentSummary.value) return false;
  return paymentSummary.value.isComplete;
});

const needsNextPayment = computed(() => {
  if (!paymentSummary.value) return false;
  
  const { monthsPaid, totalMonths } = paymentSummary.value;
  const firstPaymentType = paymentSummary.value.payments[0]?.paymentType;
  
  return firstPaymentType === 'monthly' && monthsPaid < totalMonths;
});

const remainingMonths = computed(() => {
  if (!paymentSummary.value) return 0;
  return Math.max(0, paymentSummary.value.totalMonths - paymentSummary.value.monthsPaid);
});

const nextPaymentDue = computed(() => {
  if (!paymentSummary.value?.lastPayment?.paidAt) return null;
  
  const lastPaidDate = paymentSummary.value.lastPayment.paidAt.toDate();
  const nextDue = new Date(lastPaidDate);
  nextDue.setMonth(nextDue.getMonth() + 1);
  
  return nextDue;
});

const emit = defineEmits(["payment-completed"]);
const paymentEventEmitted = ref(false);

watch(isPaymentCompleted, (val) => {
  if (val && !paymentEventEmitted.value) {
    emit("payment-completed", { assignmentId: props.assignment?.id });
    paymentEventEmitted.value = true;
  }
});

const calculateTotalSessions = () => {
  const sessionsPerWeek = props.assignment?.selectedDays?.length || 1;
  const contractDuration = props.assignment?.contractDuration || 1;
  return sessionsPerWeek * 4 * contractDuration;
};

const calculateMonthlyAmount = () => {
  const hourlyRate = props.selectedTutor?.rate || props.assignment?.rate || 0;
  const sessionsPerWeek = props.assignment?.selectedDays?.length || 1;
  const sessionDuration = props.assignment?.sessionDuration || 1;
  
  const sessionsPerMonth = sessionsPerWeek * 4;
  return hourlyRate * sessionsPerMonth * sessionDuration;
};

const calculateTotalAmount = () => {
  const hourlyRate = props.selectedTutor?.rate || props.assignment?.rate || 0;
  const sessionsPerWeek = props.assignment?.selectedDays?.length || 1;
  const contractDuration = props.assignment?.contractDuration || 1;
  const sessionDuration = props.assignment?.sessionDuration || 1;

  const totalSessions = sessionsPerWeek * 4 * contractDuration;
  return hourlyRate * totalSessions * sessionDuration;
};

const currentPaymentAmount = computed(() => {
  return paymentType.value === 'monthly' 
    ? calculateMonthlyAmount() 
    : calculateTotalAmount();
});

const confirmPayment = () => {
  showConfirmModal.value = false;
  processPendingPayment();
};

const cancelPayment = () => {
  showConfirmModal.value = false;
  pendingPaymentData.value = null;
};

const initiatePayment = async () => {
  const assignmentId = props.assignment?.id;

  if (!assignmentId) {
    toast.error(
      "Assignment data is missing. Please refresh the page",
      "Missing Data"
    );
    return;
  }

  const selectedTutorId = props.assignment?.selectedTutorId;
  if (!selectedTutorId) {
    toast.warning(
      "No tutor has been selected for this assignment",
      "Tutor Not Selected"
    );
    return;
  }

  const summary = await checkPaymentStatus();
  const isSubsequentPayment = summary && summary.monthsPaid > 0;
  const nextMonthNumber = isSubsequentPayment ? summary.monthsPaid + 1 : 1;
  
  const paymentAmount = isSubsequentPayment ? calculateMonthlyAmount() : currentPaymentAmount.value;
  const currentPaymentType = isSubsequentPayment ? 'monthly' : paymentType.value;

  // Store payment data for modal confirmation
  pendingPaymentData.value = {
    assignmentId,
    selectedTutorId,
    paymentAmount,
    currentPaymentType,
    nextMonthNumber,
    isSubsequentPayment,
    summary
  };

  // Show confirmation modal (where user chooses payment option)
  // For subsequent payments, proceed directly
  if (isSubsequentPayment) {
    processPendingPayment();
  } else {
    showConfirmModal.value = true;
  }
};

const processPendingPayment = async () => {
  if (!pendingPaymentData.value) return;

  const {
    assignmentId,
    selectedTutorId,
    paymentAmount,
    currentPaymentType,
    nextMonthNumber
  } = pendingPaymentData.value;

  processing.value = true;
  try {
    const tutor = props.selectedTutor;

    if (!tutor) {
      throw new Error("Tutor information not found. Please contact support.");
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("User not authenticated. Please log in.");
    }

    // Fetch parent details
    const parentDoc = await getUserDoc(currentUser.uid);
    const parentName = parentDoc?.name || "Unknown Parent";

    const totalMonths = props.assignment?.contractDuration || 1;

    // Check for all existing pending payments for this assignment
    const paymentsRef = collection(db, 'payments');
    const allPendingQuery = query(
      paymentsRef,
      where('assignmentId', '==', assignmentId),
      where('status', '==', 'pending')
    );
    const allPendingSnapshot = await getDocs(allPendingQuery);

    let paymentId;
    let shouldCreateNew = false;

    // Check if there's a pending payment with the same payment type
    const matchingPending = allPendingSnapshot.docs.find(doc => 
      doc.data().paymentType === currentPaymentType && 
      doc.data().monthNumber === nextMonthNumber
    );

    if (matchingPending) {
      // Reuse matching pending payment
      paymentId = matchingPending.id;
      console.log(`Reusing existing pending payment:`, paymentId);
    } else {
      shouldCreateNew = true;
      
      // Cancel all other pending payments with different payment types
      const cancelPromises = allPendingSnapshot.docs
        .filter(doc => doc.data().paymentType !== currentPaymentType)
        .map(doc => {
          console.log(`Cancelling pending payment with different type:`, doc.id);
          return updateDoc(doc.ref, {
            status: 'cancelled',
            cancelledAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });
      
      await Promise.all(cancelPromises);
    }

    if (shouldCreateNew) {
      // Create new payment record
      paymentId = await createPaymentRecord(assignmentId, {
        tutorId: selectedTutorId,
        tutorName: tutor.name || tutor.tutorName || "Unknown Tutor",
        parentId: currentUser.uid,
        parentName: parentName,
        amount: paymentAmount,
        assignmentTitle: props.assignment.title,
        tutorRate: tutor.rate || props.assignment.rate,
        paymentType: currentPaymentType,
        totalMonths: totalMonths,
        monthNumber: nextMonthNumber,
      });
      
      console.log(`Created new payment record for month ${nextMonthNumber}:`, paymentId);
    }

    await createPaymentSession({
      paymentId: paymentId,
      assignmentId: assignmentId,
      totalAmount: paymentAmount,
      title: props.assignment.title,
      selectedTutor: tutor,
      paymentType: currentPaymentType,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    toast.error(
      `Failed to initiate payment: ${error.message}`,
      "Payment Failed"
    );
  } finally {
    processing.value = false;
    pendingPaymentData.value = null;
  }
};
</script>

<template>
  <div>
    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title fw-bold">Confirm Payment Option</h5>
            <button type="button" class="btn-close" @click="cancelPayment"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning mb-3">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Important:</strong> Once you proceed, you won't be able to change your payment option later.
            </div>

            <p class="mb-3 fw-semibold text-info">
              <template v-if="pendingPaymentData?.currentPaymentType === 'monthly'">
                Proceed to pay the first month?
              </template>
              <template v-else>
                Proceed to pay the full amount upfront?
              </template>
            </p>

            <div class="payment-summary p-3 bg-body-secondary rounded border">
              <div class="d-flex justify-content-between mb-2">
                <span class="text-body-secondary">Payment Option:</span>
                <strong class="text-body">
                  {{ pendingPaymentData?.currentPaymentType === 'monthly' ? 'Monthly Payment' : 'Full Amount Upfront' }}
                </strong>
              </div>
              <div class="d-flex justify-content-between">
                <span class="text-body-secondary">Amount:</span>
                <strong class="text-success fs-5">
                  ${{ pendingPaymentData?.paymentAmount.toFixed(2) }}
                </strong>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-secondary" @click="cancelPayment">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" @click="confirmPayment">
              OK
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Status Alert -->
    <div 
      v-if="paymentSummary && paymentSummary.payments.length > 0" 
      class="alert mb-4"
      :class="{
        'alert-success': !needsNextPayment,
        'alert-info': needsNextPayment
      }"
    >
      <h5 class="alert-heading mb-3">
        <i class="bi bi-info-circle-fill me-2"></i>
        <span v-if="paymentSummary.payments[0].paymentType === 'full'">
          Payment Completed - All fully paid
        </span>
        <span v-else-if="needsNextPayment">
          Payment Status - {{ paymentSummary.monthsPaid }} of {{ paymentSummary.totalMonths }} months paid
        </span>
        <span v-else>
          Payment Completed - All fully paid
        </span>
      </h5>
      
      <div class="row g-0 mb-3">
        <!-- Show Payment ID for both full and completed monthly payments -->
        <template v-if="!needsNextPayment">
          <div class="col-6 col-md-3 mb-2">
            <strong>Last Payment ID:</strong>
          </div>
          <div class="col-6 col-md-9 mb-2">
            {{ paymentSummary.lastPayment?.id }}
          </div>
        </template>
        
        <!-- Only show detailed breakdown for ongoing monthly payments -->
        <template v-if="paymentSummary.payments[0].paymentType === 'monthly' && needsNextPayment">
          <div class="col-6 col-md-3 mb-2">
            <strong>Months Paid:</strong>
          </div>
          <div class="col-6 col-md-3 mb-2">
            {{ paymentSummary.monthsPaid }} / {{ paymentSummary.totalMonths }}
          </div>
          
          <div v-if="remainingMonths > 0" class="col-6 col-md-3 mb-2">
            <strong>Remaining Months:</strong>
          </div>
          <div v-if="remainingMonths > 0" class="col-6 col-md-3 mb-2">
            {{ remainingMonths }}
          </div>
        </template>
        
        <!-- Show for all payment types -->
        <div class="col-6 col-md-3 mb-2">
          <strong>Last Payment:</strong>
        </div>
        <div class="col-6 col-md-3 mb-2">
          {{ paymentSummary.lastPayment?.paidAt?.toDate().toLocaleDateString() || 'N/A' }}
        </div>
        
        <!-- Monthly payment specific fields -->
        <template v-if="paymentSummary.payments[0].paymentType === 'monthly' && needsNextPayment">
          <div v-if="nextPaymentDue" class="col-6 col-md-3 mb-2">
            <strong class="text-danger">Next Payment Due:</strong>
          </div>
          <div v-if="nextPaymentDue" class="col-6 col-md-3 mb-2">
            <span class="text-danger">{{ nextPaymentDue.toLocaleDateString() }}</span>
          </div>
          
          <div class="col-6 col-md-3 mb-2">
            <strong>Amount Per Month:</strong>
          </div>
          <div class="col-6 col-md-3 mb-2">
            <span class="text-success">${{ calculateMonthlyAmount().toFixed(2) }}</span>
          </div>
          
          <div v-if="remainingMonths > 0" class="col-6 col-md-3 mb-2">
            <strong>Remaining Amount:</strong>
          </div>
          <div v-if="remainingMonths > 0" class="col-6 col-md-3 mb-2">
            <span class="text-warning">${{ (calculateMonthlyAmount() * remainingMonths).toFixed(2) }}</span>
          </div>
        </template>
      </div>

      <button
        v-if="needsNextPayment"
        @click="initiatePayment"
        :disabled="processing"
        class="btn btn-primary"
      >
        <i v-if="!processing" class="bi bi-credit-card me-2"></i>
        <span>{{ processing ? 'Processing...' : `Pay Month ${paymentSummary.monthsPaid + 1}` }}</span>
        <span
          v-if="processing"
          class="spinner-border spinner-border-sm ms-2"
          role="status"
          aria-hidden="true"
        ></span>
      </button>
    </div>

    <!-- Initial Payment Card -->
    <div
      v-if="
        assignment.status === 'closed' &&
        assignment.selectedTutorId &&
        (!paymentSummary || paymentSummary.payments.length === 0)
      "
      class="card shadow-sm mb-4 rounded-3 border"
    >
      <div class="card-body">
        <h4 class="card-title">
          <i class="bi bi-credit-card"></i> Payment Details
        </h4>

        <p class="mb-3">
          <strong>Payment to: {{ selectedTutor?.name || "Selected Tutor" }}</strong>
        </p>

        <!-- Payment Type Selection -->
        <div class="mb-4 p-3 bg-light rounded">
          <label class="form-label fw-bold">Choose Payment Option:</label>
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              id="payFull"
              value="full"
              v-model="paymentType"
            />
            <label class="form-check-label" for="payFull">
              <strong>Pay Full Amount Upfront</strong>
              <span class="text-success ms-2">${{ calculateTotalAmount().toFixed(2) }}</span>
              <br>
              <small class="text-muted">Pay for all {{ assignment.contractDuration }} months now</small>
            </label>
          </div>
          <div class="form-check mt-2">
            <input
              class="form-check-input"
              type="radio"
              id="payMonthly"
              value="monthly"
              v-model="paymentType"
            />
            <label class="form-check-label" for="payMonthly">
              <strong>Pay Monthly</strong>
              <span class="text-primary ms-2">${{ calculateMonthlyAmount().toFixed(2) }}/month</span>
              <br>
              <small class="text-muted">Pay per month for {{ assignment.contractDuration }} months</small>
            </label>
          </div>
        </div>

        <table class="table">
          <tbody>
            <tr>
              <td>Hourly Rate:</td>
              <td class="text-end">
                ${{ selectedTutor?.rate || assignment.rate || 0 }}
              </td>
            </tr>
            <tr v-if="paymentType === 'monthly'">
              <td>Sessions per Month:</td>
              <td class="text-end">
                {{ assignment.selectedDays.length }} × 4 = <strong>{{ assignment.selectedDays.length * 4 }}</strong>
              </td>
            </tr>
            <tr v-else>
              <td>Total Sessions:</td>
              <td class="text-end">
                {{ assignment.selectedDays.length }} × 4 ×
                {{ assignment.contractDuration }} =
                <strong>{{ calculateTotalSessions() }}</strong>
                <br />
                <small class="text-muted">
                  ({{ assignment.selectedDays.join(", ") }} × 4 weeks/month ×
                  {{ assignment.contractDuration }} months)
                </small>
              </td>
            </tr>
            <tr>
              <td>Duration per Session:</td>
              <td class="text-end">{{ assignment.sessionDuration }} hour(s)</td>
            </tr>
            <tr class="table-success">
              <td><strong>{{ paymentType === 'monthly' ? 'First Month:' : 'Total Amount:' }}</strong></td>
              <td class="text-end">
                <strong class="text-success fs-5">
                  ${{ currentPaymentAmount.toFixed(2) }}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>

        <button
          class="btn btn-primary w-100 d-flex align-items-center justify-content-center"
          :disabled="processing"
          @click="initiatePayment"
        >
          <i v-if="!processing" class="bi bi-credit-card me-2"></i>
          <span>{{ processing ? 'Processing...' : `Pay ${paymentType === 'monthly' ? 'First Month' : 'Full Amount'}` }}</span>
          <span
            v-if="processing"
            class="spinner-border spinner-border-sm ms-2"
            role="status"
            aria-hidden="true"
          ></span>
        </button>

        <p class="text-center text-muted mt-2 mb-0">
          <i class="bi bi-shield-check"></i> Secure payment powered by Stripe
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal.d-block {
  display: block !important;
}
</style>
