<template>
  <span class="badge status-badge" :class="[badgeClass, sizeClass]">
    <i v-if="showIcon" :class="iconClass" class="me-1"></i>
    <slot>{{ statusText }}</slot>
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) =>
      ["open", "pending", "closed", "rejected", "approved", "applied"].includes(
        value
      ),
  },
  showIcon: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  statusConfig: {
    type: Object,
    default: () => ({}),
  },
});

const statusConfig = {
  open: {
    class: "bg-success",
    icon: "bi-circle",
    text: "OPEN",
  },
  pending: {
    class: "bg-warning text-dark",
    icon: "bi-clock-history",
    text: "PENDING",
  },
  closed: {
    class: "bg-secondary",
    icon: "bi-check-circle",
    text: "CLOSED",
  },
  applied: {
    class: "bg-primary text-white",
    icon: "bi-person-check",
    text: "APPLIED",
  },
  rejected: {
    class: "bg-danger",
    icon: "bi-x-circle",
    text: "REJECTED",
  },
  approved: {
    class: "bg-success",
    icon: "bi-check-circle-fill",
    text: "APPROVED",
  },
};

const config = computed(() => {
  // Check if custom status config provided for this status
  if (props.statusConfig[props.status]) {
    const custom = props.statusConfig[props.status];
    return {
      class: custom.color
        ? `bg-${custom.color} text-white`
        : statusConfig[props.status]?.class || "bg-secondary",
      icon: custom.icon || statusConfig[props.status]?.icon || "bi-circle",
      text: custom.text || props.status.toUpperCase(),
    };
  }
  return statusConfig[props.status] || statusConfig.closed;
});
const badgeClass = computed(() => config.value.class);
const iconClass = computed(() => config.value.icon);
const statusText = computed(() => config.value.text);

const sizeClass = computed(() => {
  const sizes = {
    sm: "badge-sm",
    md: "",
    lg: "badge-lg",
  };
  return sizes[props.size] || "";
});
</script>

<style scoped>
.status-badge {
  font-weight: 500;
  padding: 0.4rem 0.6rem;
  display: inline-flex;
  align-items: center;
}

.badge-sm {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.badge-lg {
  font-size: 1rem;
  padding: 0.5rem 0.8rem;
}
</style>
