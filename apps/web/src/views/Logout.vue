<script setup>
import { useRouter } from "vue-router";
import { logoutUser, signInWithGoogle } from "../services/firebase";
import { useToast } from "../composables/useToast";

const toast = useToast();
const router = useRouter();

const handleLogout = async () => {
  try {
    const response = await logoutUser();

    if (!response.success) {
      toast.error(`Logout failed: ${response.error}`, "Logout Failed");
      return;
    }

    const user = response.user;
    localStorage.clear();

    console.log("Logout successful:", user);
    toast.success("Logout successful!", "Goodbye");
    router.push("/");
  } catch (error) {
    console.error("Logout error:", error);
    toast.error("Unexpected error during logout", "Logout Error");
  }
};
handleLogout();
</script>

<template></template>
