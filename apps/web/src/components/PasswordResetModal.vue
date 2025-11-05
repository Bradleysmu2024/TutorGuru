<template>
  <div v-if="show" class="modal-overlay" @click.self="handleCancel">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-envelope me-2"></i>Reset Your Password
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="handleCancel"
          ></button>
        </div>
        <div class="modal-body">
          <p class="text-muted mb-3">
            Enter the email associated with your account and we'll send you
            password reset instructions.
          </p>

          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>

          <div class="mb-3">
            <label class="form-label">Your Email Address</label>
            <div class="input-group">
              <span class="input-group-text">
                <i class="bi bi-envelope"></i>
              </span>

              <input
                v-model="localResetEmail"
                type="email"
                class="form-control"
                placeholder="your@email.com"
                :disabled="loading"
              />
            </div>
          </div>

          <!-- <div class="mb-3">
            <label class="form-label">Current Password</label>
            <input
              v-model="localPassword"
              type="password"
              class="form-control"
              placeholder="Enter your current password"
              :disabled="loading"
            />
            <small class="text-muted"
              >We need this to verify it's really you</small
            >
          </div> -->
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleCancel"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="handleSubmit"
            :disabled="loading"
          >
            <span v-if="loading">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Updating...
            </span>
            <span v-else>
              <i class="bi bi-check2 me-2"></i>Reset Password
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { useToast } from "../composables/useToast";

const toast = useToast();

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  // currentEmail: {
  //   type: String,
  //   required: true,
  // },
  // userCollection: {
  //   type: String,
  //   default: "users",
  //   validator: (value) => ["users", "parentProfile"].includes(value),
  // },
});

const emit = defineEmits(["update:show", "cancel"]);

const localResetEmail = ref("");
const error = ref("");
const loading = ref(false);

// Pre-fill email when modal opens
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      localResetEmail.value = "";
      error.value = "";
      loading.value = false;
    }
  }
);

const handleCancel = () => {
  emit("update:show", false);
  emit("cancel");
  // Reset form
  localResetEmail.value = "";
  error.value = "";
};

const handleSubmit = async () => {
  // Validate inputs
  if (!localResetEmail.value) {
    error.value = "Please provide your email address.";
    return;
  }

  error.value = "";
  loading.value = true;

  try {
    // Send Password Reset Email
    await sendPasswordResetEmail(auth, localResetEmail.value);

    loading.value = false;
    // Success! Emit event and close modal
    emit("update:show", false);
    toast.success(
      "If this email is registered, a reset link has been sent to your inbox",
      "Reset Email Sent"
    );
  } catch (err) {
    console.error("Error sending password reset email:", err);
    error.value =
      err.message || "Failed to send password reset email. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-dialog {
  max-width: 500px;
  width: 90%;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.5;
}

.btn-close:hover {
  opacity: 1;
}
</style>
