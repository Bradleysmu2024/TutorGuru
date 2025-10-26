// Composable for using PrimeVue Toast notifications
import { useToast as usePrimeToast } from "primevue/usetoast";

export function useToast() {
  const toast = usePrimeToast();

  return {
    success: (message, title = "Success", life = 3000) => {
      toast.add({
        severity: "success",
        summary: title,
        detail: message,
        life: life,
      });
    },

    error: (message, title = "Error", life = 5000) => {
      toast.add({
        severity: "error",
        summary: title,
        detail: message,
        life: life,
      });
    },

    warning: (message, title = "Warning", life = 4000) => {
      toast.add({
        severity: "warn",
        summary: title,
        detail: message,
        life: life,
      });
    },

    info: (message, title = "Info", life = 3000) => {
      toast.add({
        severity: "info",
        summary: title,
        detail: message,
        life: life,
      });
    },
  };
}
