<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useToast } from "../composables/useToast";

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    required: true,
    validator: (value) => ["parent", "tutor", "admin"].includes(value),
  },
});

const transactions = ref([]);
const loading = ref(true);
const error = ref(null);
const sortBy = ref("latest"); // 'latest', 'oldest', 'amount-high', 'amount-low'
const filterStatus = ref("all"); // 'all', 'completed', 'pending', 'cancelled'
const pageSize = ref(10); // 5, 10, 20
const isExpanded = ref(true); // ADD THIS
const toast = useToast();

const loadTransactions = async () => {
  console.log(
    "Loading transactions for userId:",
    props.userId,
    "userType:",
    props.userType
  );

  if (!props.userId) {
    console.warn("No userId provided");
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const paymentsRef = collection(db, "payments");
    let q;

    // Query based on user type
    if (props.userType === "parent") {
      q = query(paymentsRef, where("parentId", "==", props.userId));
    } else {
      q = query(paymentsRef, where("tutorId", "==", props.userId));
    }

    console.log("Executing query...");
    const snapshot = await getDocs(q);
    console.log("Query result - docs count:", snapshot.docs.length);

    transactions.value = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log("Transaction doc:", doc.id, data);
      return {
        id: doc.id,
        ...data,
      };
    });

    console.log("Loaded transactions:", transactions.value.length);
  } catch (err) {
    console.error("Error loading transactions:", err);
    error.value = "Failed to load transaction history. Please try again.";
  } finally {
    loading.value = false;
  }
};

// add the watcher after loadTransactions is defined
watch(
  () => props.userId,
  (newVal) => {
    console.log("TransactionHistory - userId changed:", newVal);
    if (newVal) {
      loadTransactions();
    }
  },
  { immediate: true }
);

const filteredTransactions = computed(() => {
  let filtered = transactions.value;

  // Filter by status
  if (filterStatus.value !== "all") {
    filtered = filtered.filter((t) => t.status === filterStatus.value);
  }

  // Sort
  const sorted = [...filtered];
  switch (sortBy.value) {
    case "latest":
      sorted.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
      );
      break;
    case "oldest":
      sorted.sort(
        (a, b) =>
          (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)
      );
      break;
    case "amount-high":
      sorted.sort((a, b) => (b.amount || 0) - (a.amount || 0));
      break;
    case "amount-low":
      sorted.sort((a, b) => (a.amount || 0) - (b.amount || 0));
      break;
  }

  return sorted;
});

// Paginated transactions
const paginatedTransactions = computed(() => {
  return filteredTransactions.value.slice(0, pageSize.value);
});

const totalAmount = computed(() => {
  return transactions.value
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
});

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount); // amount from firestore
};

const getStatusClass = (status) => {
  const classes = {
    completed: "success",
    pending: "warning",
    cancelled: "danger",
    refunded: "info",
  };
  return classes[status] || "secondary";
};

const downloadCSV = () => {
  if (filteredTransactions.value.length === 0) {
    toast.warning("No transactions to export");
    return;
  }

  const headers = [
    "Transaction ID",
    "Date",
    "Assignment",
    "Amount",
    "Status",
    props.userType === "parent" ? "Tutor" : "Parent",
  ];
  const rows = filteredTransactions.value.map((t) => [
    t.id,
    formatDate(t.createdAt),
    t.assignmentTitle || "N/A",
    formatCurrency(t.amount),
    t.status,
    props.userType === "parent" ? t.tutorName || "N/A" : t.parentName || "N/A",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions_${props.userType}_${
    new Date().toISOString().split("T")[0]
  }.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
</script>

<template>
  <div class="transaction-history">
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div class="d-flex align-items-center">
            <h5 class="fw-bold mb-0">
              <i class="bi bi-clock-history me-2"></i>
              Transaction History
            </h5>
            <!-- COLLAPSE BUTTON -->
            <button
              class="btn btn-sm btn-outline-secondary collapse-btn ms-3"
              @click="isExpanded = !isExpanded"
              :aria-expanded="isExpanded"
            >
              <i
                :class="isExpanded ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"
              ></i>
              {{ isExpanded ? "Hide" : "Show" }}
            </button>
          </div>
          <button
            class="btn btn-sm btn-outline-primary"
            @click="downloadCSV"
            :disabled="filteredTransactions.length === 0"
          >
            <i class="bi bi-download me-2"></i>
            Export CSV
          </button>
        </div>

        <!-- WRAP CONTENT IN COLLAPSIBLE DIV -->
        <div v-show="isExpanded">
          <p class="text-muted mb-4">
            {{
              userType === "parent"
                ? "Payments made to tutors"
                : "Payments received from parents"
            }}
          </p>

          <!-- Summary Stats -->
          <div class="row g-3 mb-4">
              <div class="col-md-4">
                <div class="stat-card d-flex align-items-center p-3 bg-primary text-white rounded">
                  <div class="stat-icon fs-2 me-3 opacity-75">
                    <i class="bi bi-receipt"></i>
                  </div>
                  <div class="stat-content flex-grow-1">
                    <div class="stat-label small text-white-50">Total Transactions</div>
                    <div class="stat-value h4 fw-bold">{{ transactions.length }}</div>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="stat-card d-flex align-items-center p-3 bg-success text-white rounded">
                  <div class="stat-icon fs-2 me-3 opacity-75">
                    <i class="bi bi-cash-stack"></i>
                  </div>
                  <div class="stat-content flex-grow-1">
                    <div class="stat-label small text-white-50">
                      Total {{ userType === "parent" ? "Spent" : "Earned" }}
                    </div>
                    <div class="stat-value h4 fw-bold">
                      {{ formatCurrency(totalAmount) }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="stat-card d-flex align-items-center p-3 bg-info text-white rounded">
                  <div class="stat-icon fs-2 me-3 opacity-75">
                    <i class="bi bi-check-circle"></i>
                  </div>
                  <div class="stat-content flex-grow-1">
                    <div class="stat-label small text-white-50">Completed</div>
                    <div class="stat-value h4 fw-bold">
                      {{
                        transactions.filter((t) => t.status === "completed")
                          .length
                      }}
                    </div>
                  </div>
                </div>
              </div>
          </div>

          <!-- Filters and Sort -->
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label small">Filter by Status</label>
              <select v-model="filterStatus" class="form-select form-select-sm">
                <option value="all">All Transactions</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label small">Sort by</label>
              <select v-model="sortBy" class="form-select form-select-sm">
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="amount-high">Highest Amount</option>
                <option value="amount-low">Lowest Amount</option>
              </select>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted mt-2">Loading transactions...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            {{ error }}
            <button
              class="btn btn-sm btn-danger ms-2"
              @click="loadTransactions"
            >
              Retry
            </button>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="filteredTransactions.length === 0"
            class="text-center py-5"
          >
            <i class="bi bi-inbox display-1 text-muted"></i>
            <p class="text-muted mt-3">No transactions found</p>
          </div>

          <!-- Transaction Table -->
          <div v-else class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Date, Time</th>
                  <th>{{ userType === "parent" ? "Tutor" : "Parent" }}</th>
                  <th>Assignment</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="transaction in paginatedTransactions"
                  :key="transaction.id"
                >
                  <td>
                    <small class="text-muted font-monospace">
                      #{{ transaction.id }}
                    </small>
                  </td>
                  <td>{{ formatDate(transaction.createdAt) }}</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div>
                        <div class="fw-semibold">
                          {{
                            userType === "parent"
                              ? transaction.tutorName
                              : transaction.parentName || "N/A"
                          }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="text-truncate" style="max-width: 200px">
                      {{ transaction.assignmentTitle || "N/A" }}
                    </div>
                  </td>
                  <td class="fw-semibold">
                    {{ formatCurrency(transaction.amount) }}
                  </td>
                  <td>
                    <span
                      class="badge"
                      :class="`bg-${getStatusClass(transaction.status)}`"
                    >
                      {{ transaction.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Page Size selector at bottom -->
            <div class="d-flex justify-content-between align-items-center mt-3">
              <div class="text-muted small">
                Showing {{ Math.min(pageSize, filteredTransactions.length) }} of
                {{ filteredTransactions.length }} transactions
              </div>
              <div class="d-flex align-items-center">
                <label class="me-2 mb-0 small">Page size:</label>
                <select
                  v-model.number="pageSize"
                  class="form-select form-select-sm"
                  style="width: auto"
                >
                  <option :value="5">5</option>
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <!-- END COLLAPSIBLE CONTENT -->
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Minimal overrides: keep Bootstrap for most styling and only adjust card radius */
.card {
  border: none;
  border-radius: 0.75rem;
}

/* Slight icon sizing for the stat tiles */
.stat-icon i {
  font-size: 1.6rem;
}

/* Make collapse button icon slightly larger */
.collapse-btn i {
  font-size: 0.95rem;
}
</style>
