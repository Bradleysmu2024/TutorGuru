<template>
  <v-btn
    :icon="
      theme.global.current.value.dark
        ? 'mdi-weather-night'
        : 'mdi-weather-sunny'
    "
    @click="toggleTheme"
    variant="text"
    :color="theme.global.current.value.dark ? 'white' : 'default'"
    :title="
      theme.global.current.value.dark
        ? 'Switch to Light Mode'
        : 'Switch to Dark Mode'
    "
  ></v-btn>
</template>

<script setup>
import { useTheme } from "vuetify";
import { onMounted } from "vue";

const theme = useTheme();

// Load saved theme preference
onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    theme.global.name.value = savedTheme;
  }
});

const toggleTheme = () => {
  const newTheme = theme.global.current.value.dark
    ? "customLightTheme"
    : "customDarkTheme";
  theme.global.name.value = newTheme;
  localStorage.setItem("theme", newTheme);

  // Update body class for Bootstrap compatibility
  if (newTheme === "customDarkTheme") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
};
</script>
