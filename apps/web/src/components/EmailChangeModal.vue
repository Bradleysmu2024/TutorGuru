<template>
  <div v-if="show" class="modal-overlay" @click.self="handleCancel">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-envelope me-2"></i>Change Email Address
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="handleCancel"
          ></button>
        </div>
        <div class="modal-body">
          <p class="text-muted mb-3">
            For security, we need to verify your current password before
            changing your email.
          </p>

          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>

          <div class="mb-3">
            <label class="form-label">New Email Address</label>
            <input
              v-model="localNewEmail"
              type="email"
              class="form-control"
              placeholder="Enter new email"
              :disabled="loading"
            />
          </div>

          <div class="mb-3">
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
          </div>
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
            <span v-else> <i class="bi bi-check2 me-2"></i>Update Email </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { updateUserEmail, getCurrentUser } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  currentEmail: {
    type: String,
    required: true,
  },
  userCollection: {
    type: String,
    default: "users",
    validator: (value) => ["users", "parentProfile"].includes(value),
  },
});

const emit = defineEmits(["update:show", "email-changed", "cancel"]);

const localNewEmail = ref("");
const localPassword = ref("");
const error = ref("");
const loading = ref(false);

// Pre-fill email when modal opens
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      localNewEmail.value = props.currentEmail;
      localPassword.value = "";
      error.value = "";
      loading.value = false;
    }
  }
);

const handleCancel = () => {
  emit("update:show", false);
  emit("cancel");
  // Reset form
  localNewEmail.value = "";
  localPassword.value = "";
  error.value = "";
};

const handleSubmit = async () => {
  // Validate inputs
  if (!localNewEmail.value || !localPassword.value) {
    error.value = "Please provide both new email and current password.";
    return;
  }

  if (localNewEmail.value === props.currentEmail) {
    error.value = "The new email must be different from the current email.";
    return;
  }

  error.value = "";
  loading.value = true;

  try {
    // Step 1: Update Firebase Auth email
    const result = await updateUserEmail(
      localNewEmail.value,
      localPassword.value
    );

    if (!result.success) {
      error.value = result.error;
      loading.value = false;
      return;
    }

    // Step 2: Update Firestore profile email
    const user = await getCurrentUser();
    if (!user || !user.uid) {
      throw new Error("User not logged in");
    }

    await setDoc(
      doc(db, props.userCollection, user.uid),
      { email: localNewEmail.value },
      { merge: true }
    );

    // Success! Emit event and close modal
    emit("email-changed", localNewEmail.value);
    emit("update:show", false);

    alert(
      "Email updated successfully! You can now log in with your new email."
    );
  } catch (err) {
    console.error("Error changing email:", err);
    error.value = err.message || "Failed to change email. Please try again.";
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
