<template>
  <div v-if="loading" class="loading-state text-center" :class="containerClass">
    <div class="spinner-border" :class="[spinnerClass, colorClass]" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <p v-if="message" class="text-muted mt-3 mb-0">{{ message }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    required: true
  },
  message: {
    type: String,
    default: 'Loading...'
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  color: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].includes(value)
  },
  padding: {
    type: String,
    default: 'py-5',
    validator: (value) => ['py-3', 'py-4', 'py-5', 'py-6'].includes(value)
  }
});

const spinnerClass = computed(() => {
  const sizes = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  };
  return sizes[props.size] || '';
});

const colorClass = computed(() => `text-${props.color}`);

const containerClass = computed(() => props.padding);
</script>

