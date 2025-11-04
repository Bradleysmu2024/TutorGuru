<template>
  <div>
    <!-- Application Modal  -->
    <div
      class="modal fade"
      :id="modalId"
      tabindex="-1"
      :aria-labelledby="`${modalId}Label`"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" :id="`${modalId}Label`">
              <i class="bi bi-send me-2"></i>
              Apply for Position
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="job">
              <h6 class="fw-semibold mb-3">{{ job.title }}</h6>
              <form @submit.prevent="handleSubmit">
                <div class="mb-3">
                  <label class="form-label">Cover Letter</label>
                  <textarea
                    v-model="localApplication.coverLetter"
                    class="form-control"
                    rows="4"
                    placeholder="Tell the parent why you're a great fit for this assignment..."
                    required
                  ></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Available Start Date</label>
                  <input
                    v-model="localApplication.startDate"
                    type="date"
                    class="form-control"
                    required
                  />
                </div>
              </form>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary text-white"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary text-white"
              @click="handleSubmit"
            >
              <i class="bi bi-send me-2"></i>
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div
      class="modal fade"
      :id="confirmModalId"
      tabindex="-1"
      :aria-labelledby="`${confirmModalId}Label`"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" :id="`${confirmModalId}Label`">
              <i class="bi bi-check-circle me-2"></i>
              Confirm Submission
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <p class="mb-0">
              Confirm submission? The parent will see your application.
            </p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary text-white"
              data-bs-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary text-white"
              @click="handleConfirm"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { Modal } from "bootstrap";
import { useToast } from "../composables/useToast";
import {
  submitApplication,
  getCurrentUser,
  getEvent_,
} from "../services/firebase";
import { collection, getDocs, query, where, collectionGroup } from "firebase/firestore";
import { db } from "../services/firebase";

const props = defineProps({
  job: {
    type: Object,
    default: null,
  },
  modalId: {
    type: String,
    default: "applicationModal",
  },
});

const emit = defineEmits(["application-submitted"]);

const toast = useToast();
const confirmModalId = `${props.modalId}Confirmation`;

const localApplication = ref({
  coverLetter: "",
  startDate: "",
});

let applicationModal = null;
let confirmationModal = null;

onMounted(() => {
  const modalElement = document.getElementById(props.modalId);
  if (modalElement) {
    applicationModal = new Modal(modalElement);
  }

  const confirmElement = document.getElementById(confirmModalId);
  if (confirmElement) {
    confirmationModal = new Modal(confirmElement);
  }
});

// Reset form when job changes
watch(
  () => props.job,
  (newJob) => {
    if (newJob) {
      localApplication.value = {
        coverLetter: "",
        startDate: "",
      };
    }
  }
);

// Expose show/hide methods
const show = () => {
  if (applicationModal) {
    applicationModal.show();
  }
};

const hide = () => {
  if (applicationModal) {
    applicationModal.hide();
  }
};

defineExpose({ show, hide });

const handleSubmit = async () => {
  // Validate inputs
  if (!localApplication.value.coverLetter.trim()) {
    toast.warning(
      "Please write a cover letter before submitting your application",
      "Cover Letter Required"
    );
    return;
  }

  if (!localApplication.value.startDate) {
    toast.warning(
      "Please select an available start date from the assignment",
      "Start Date Required"
    );
    return;
  }

  // Validate that start date is not in the past
  const selectedDate = new Date(localApplication.value.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    toast.warning(
      "Start date cannot be in the past. Please select a future date",
      "Invalid Date"
    );
    return;
  }

  try {
    const user = await getCurrentUser();
    if (!user || !user.uid) {
      toast.error(
        "You must be logged in to apply for assignments",
        "Authentication Required"
      );
      return;
    }

    // Check for schedule conflicts
    const conflict = await checkScheduleConflict(user.uid);

    if (conflict) {
      toast.warning(
        "Schedule conflict detected! Unable to apply for this assignment."
      );
      hide();
      return;
    } else {
      toast.info("No conflicts found, safe to accept this assignment.");
      // Show confirmation modal
      hide();
      setTimeout(() => {
        if (confirmationModal) {
          confirmationModal.show();
        }
      }, 300);
    }
  } catch (error) {
    console.error("Error submitting application:", error);
    toast.error("Failed to submit application. Please try again", "Error");
  }
};

const handleConfirm = async () => {
  try {
    const user = await getCurrentUser();
    if (!user || !user.uid) {
      toast.error(
        "You must be logged in to apply for assignments",
        "Authentication Required"
      );
      if (confirmationModal) {
        confirmationModal.hide();
      }
      return;
    }

    // Submit application to Firebase
    const result = await submitApplication(
      props.job.id,
      user.uid,
      localApplication.value
    );

    if (result.success) {
      toast.success(
        "Your application has been submitted successfully!",
        "Application Submitted"
      );
      if (confirmationModal) {
        confirmationModal.hide();
      }

      // Emit event to parent
      emit("application-submitted", props.job.id);

      // Reset form
      localApplication.value = {
        coverLetter: "",
        startDate: "",
      };
    } else {
      toast.error(
        `Failed to submit application: ${result.error}`,
        "Submission Failed"
      );
      if (confirmationModal) {
        confirmationModal.hide();
      }
    }
  } catch (error) {
    console.error("Error submitting application:", error);
    toast.error("Failed to submit application. Please try again", "Error");
    if (confirmationModal) {
      confirmationModal.hide();
    }
  }
};

// Schedule conflict checking logic
async function checkScheduleConflict(userId) {
  try {
    const q = query(
      collectionGroup(db, "applications"),
      where("tutorId", "==", userId)
    );
    const snap = await getDocs(q);
    const applied = snap.docs.map((d) => d.data());
    const assignmentIds = applied.map((a) => a.assignmentId);

    const assignments = await getAssignmentsByIds(assignmentIds);

    const calendarEvents = [
      ...(await getEvents("calendar")),
      ...(await getEvents("google")),
    ];

    return hasScheduleConflict(assignments, calendarEvents, props.job);
  } catch (error) {
    console.error("Error checking schedule conflict:", error);
    return false;
  }
}

async function getAssignmentsByIds(assignmentIds) {
  const assignmentsRef = collection(db, "assignments");
  const assignments = [];

  for (let i = 0; i < assignmentIds.length; i += 10) {
    const batch = assignmentIds.slice(i, i + 10);
    const q = query(assignmentsRef, where("__name__", "in", batch));
    const snap = await getDocs(q);
    snap.docs.forEach((doc) => {
      assignments.push({ id: doc.id, ...doc.data() });
    });
  }

  return assignments;
}

async function getEvents(type) {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    let querySnapshot = await getEvent_(type, user.uid);
    let events = [];
    if (querySnapshot) {
      querySnapshot.forEach((doc) => {
        const startDate = new Date(doc.start);
        const endDate = new Date(doc.end);

        events.push({
          id: doc.id,
          ...doc,
          start: startDate,
          end: endDate,
        });
      });
    }
    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

function getWeekdayDatesInRange(startDate, endDate, weekdays) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const result = [];

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (weekdays.includes(d.getDay())) {
      result.push(new Date(d));
    }
  }
  return result;
}

function expandAssignmentSessions(assignment) {
  const start = new Date(assignment.createdAt);
  const end = new Date(start);
  end.setDate(start.getDate() + 30 * assignment.contractDuration);

  const days_obj = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const weekdays = assignment.selectedDays.map((day) => days_obj[day]);
  const dates = getWeekdayDatesInRange(start, end, weekdays);

  const [startHour, startMin] = assignment.sessionStartTime
    .split(":")
    .map(Number);
  const durationMin = assignment.sessionDuration * 60;

  return dates.map((date) => {
    const startTime = new Date(date);
    startTime.setHours(startHour, startMin, 0, 0);
    const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

    return { startTime, endTime };
  });
}

function expandCalendarEvents(calendarEvents) {
  return calendarEvents.map((ev) => ({
    startTime: new Date(ev.start),
    endTime: new Date(ev.end),
  }));
}

function isOverlapping(a, b) {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

function hasScheduleConflict(
  existingAssignments,
  calendarEvents,
  newAssignment
) {
  const newSessions = expandAssignmentSessions(newAssignment);
  const oldSessions = existingAssignments.flatMap(expandAssignmentSessions);
  const calendarSessions = expandCalendarEvents(calendarEvents);
  const allExistingSessions = [...oldSessions, ...calendarSessions];

  for (const newSession of newSessions) {
    if (allExistingSessions.some((old) => isOverlapping(old, newSession))) {
      return true;
    }
  }

  return false;
}
</script>
