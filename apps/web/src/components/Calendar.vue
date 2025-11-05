<template>
  <!-- Add Event Confirmation Modal -->
  <div v-if="showAddConfirmModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header border-0">
          <h5 class="modal-title fw-bold">Confirm Add Event</h5>
          <button type="button" class="btn-close" @click="showAddConfirmModal = false"></button>
        </div>
        <div class="modal-body">
          <p class="mb-0">Are you sure you want to add this event?</p>
        </div>
        <div class="modal-footer border-0">
          <button type="button" class="btn btn-secondary" @click="showAddConfirmModal = false">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="confirmAddEvent">
            OK
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Update Event Confirmation Modal -->
  <div v-if="showUpdateConfirmModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header border-0">
          <h5 class="modal-title fw-bold">Confirm Update Event</h5>
          <button type="button" class="btn-close" @click="showUpdateConfirmModal = false"></button>
        </div>
        <div class="modal-body">
          <p class="mb-0">Are you sure you want to update this event?</p>
        </div>
        <div class="modal-footer border-0">
          <button type="button" class="btn btn-secondary" @click="showUpdateConfirmModal = false">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="confirmUpdateEvent">
            OK
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Event Confirmation Modal -->
  <div v-if="showDeleteConfirmModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header border-0">
          <h5 class="modal-title fw-bold">Confirm Delete Event</h5>
          <button type="button" class="btn-close" @click="showDeleteConfirmModal = false"></button>
        </div>
        <div class="modal-body">
          <p class="mb-0">Are you sure you want to delete this event?</p>
        </div>
        <div class="modal-footer border-0">
          <button type="button" class="btn btn-secondary" @click="showDeleteConfirmModal = false">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="confirmDeleteEvent">
            OK
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Google Sync Confirmation Modal -->
  <div v-if="showSyncConfirmModal" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header border-0">
          <h5 class="modal-title fw-bold">Google Login Required</h5>
          <button type="button" class="btn-close" @click="showSyncConfirmModal = false"></button>
        </div>
        <div class="modal-body">
          <p class="mb-0">Are you sure you want to login to Google to sync calendar?</p>
        </div>
        <div class="modal-footer border-0">
          <button type="button" class="btn btn-secondary" @click="showSyncConfirmModal = false">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="confirmGoogleSync">
            OK
          </button>
        </div>
      </div>
    </div>
  </div>

  <v-row class="fill-height">
    <v-col>
      <v-sheet height="64">
        <v-toolbar flat>
          <v-btn
            size="small"
            class="me-4"
            color="primary"
            variant="outlined"
            dark
            @click="dialog = true"
          >
            New Event
          </v-btn>
          <v-btn
            size="small"
            type="button"
            color="primary"
            variant="outlined"
            class="me-4"
            @click="sync_from_google()"
          >
            Sync
          </v-btn>
          <!-- <v-btn class="me-4" color="grey-darken-2" variant="outlined" @click="setToday">
            Today
          </v-btn> -->
          <v-btn
            color="grey-darken-2"
            size="small"
            variant="text"
            icon
            @click="prev"
          >
            <v-icon size="small"> mdi-chevron-left </v-icon>
          </v-btn>
          <v-btn
            color="grey-darken-2"
            size="small"
            variant="text"
            icon
            @click="next"
          >
            <v-icon size="small"> mdi-chevron-right </v-icon>
          </v-btn>
          <v-toolbar-title v-if="calendar" class="d-none d-sm-flex">
            {{ calendar.title }}
          </v-toolbar-title>
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn
                size="small"
                color="grey-darken-2"
                variant="outlined"
                v-bind="props"
              >
                <span>{{ typeToLabel[type] }}</span>
                <v-icon end> mdi-menu-down </v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                @click="
                  type = 'day';
                  setToday;
                "
              >
                <v-list-item-title>Day</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'week'">
                <v-list-item-title>Week</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'month'">
                <v-list-item-title>Month</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = '4day'">
                <v-list-item-title>4 days</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-toolbar>
      </v-sheet>

      <v-dialog v-model="dialog" max-width="500">
        <v-card>
          <v-container>
            <v-form @submit.prevent="addEvent">
              <v-text-field
                v-model="name"
                type="text"
                label="event name (required)"
              ></v-text-field>
              <v-text-field
                v-model="details"
                type="text"
                label="details"
              ></v-text-field>
              <v-text-field
                v-model="start"
                type="datetime-local"
                label="start (required)"
              ></v-text-field>
              <v-text-field
                v-model="end"
                type="datetime-local"
                label="end (required)"
              ></v-text-field>
              <v-color-picker v-model="color" class="mb-4"></v-color-picker>
              <v-btn
                type="submit"
                color="primary"
                class="mr-4"
                @click.stop="dialog = false"
              >
                Create Event
              </v-btn>
            </v-form>
          </v-container>
        </v-card>
      </v-dialog>

      <v-sheet height="600">
        <v-calendar
          ref="calendar"
          v-model="focus"
          :event-color="getEventColor"
          :events="events"
          :type="type"
          color="primary"
          @change="updateRange"
          @click:date="viewDay"
          @click:event="showEvent"
          @click:more="viewDay"
        ></v-calendar>
        <v-menu
          v-model="selectedOpen"
          :activator="selectedElement"
          :close-on-content-click="false"
          location="end"
        >
          <v-card color="grey-lighten-4" min-width="350px" flat>
            <v-toolbar :color="selectedEvent.color" dark>
              <v-btn @click="deleteEvent(selectedEvent.id)" icon>
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              <v-toolbar-title>{{ selectedEvent.name }}</v-toolbar-title>
              <!-- <v-btn icon>
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon>
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn> -->
            </v-toolbar>
            <v-card-text>
              <form v-if="currentlyEditing !== selectedEvent.id">
                {{ selectedEvent.details }}
              </form>
              <form v-else>
                <textarea
                  v-model="selectedEvent.details"
                  type="text"
                  style="width: 100%"
                  :min-height="100"
                  placeholder="add note"
                ></textarea>
              </form>
            </v-card-text>
            <v-card-actions>
              <v-btn
                color="secondary"
                variant="text"
                @click="selectedOpen = false"
              >
                Close
              </v-btn>
              <v-btn
                variant="text"
                v-if="currentlyEditing !== selectedEvent.id"
                @click.prevent="editEvent(selectedEvent)"
              >
                Edit
              </v-btn>
              <v-btn
                variant="text"
                v-else
                @click.prevent="updateEvent(selectedEvent)"
              >
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script setup>
import {
  db,
  getEvents as firebaseGetEvents,
  getEvent_,
  addEvent_,
  updateEvent_,
  deleteEvent_,
  signInWithGoogle,
  clearEvents_,
} from "../services/firebase";
import { onMounted, ref } from "vue";
import { useToast } from "../composables/useToast";

const toast = useToast();
const userToken = ref(localStorage.getItem("user"));
const calendar = ref();

const typeToLabel = {
  month: "Month",
  week: "Week",
  day: "Day",
  "4day": "4 Days",
};

const focus = ref("");
const type = ref("month");
const selectedEvent = ref({});
const selectedElement = ref(null);
const selectedOpen = ref(false);
const events = ref([]);
const currentlyEditing = ref("");
const dialog = ref(false);

const name = ref(null);
const details = ref(null);
const start = ref(null);
const end = ref(null);
const color = ref("#14B8A6");

// Confirmation modals
const showAddConfirmModal = ref(false);
const showUpdateConfirmModal = ref(false);
const showDeleteConfirmModal = ref(false);
const showSyncConfirmModal = ref(false);
const pendingEventData = ref(null);

onMounted(() => {
  calendar.value.checkChange();
});

async function getEvents(type) {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    let querySnapshot = await getEvent_(type, user.uid);
    let events = [];
    if (querySnapshot) {
      querySnapshot.forEach((doc) => {
        // Convert Firestore date fields to JS Date strings
        const startDate = new Date(doc.start); // assuming 'start' is stored as ISO string
        const endDate = new Date(doc.end); // assuming 'end' is stored as ISO string

        events.push({
          id: doc.id,
          ...doc,
          start: startDate, // e.g., "Sun Oct 12 2025 23:00:00 GMT+0800 (Singapore Standard Time)"
          end: endDate,
        });
      });
    }
    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
  }
}

async function addEvent() {
  showAddConfirmModal.value = true;
}

async function confirmAddEvent() {
  showAddConfirmModal.value = false;
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (name.value && start.value && end.value) {
      start.value = convertInput(start.value);
      end.value = convertInput(end.value);
      const response = await addEvent_(
        "calendar",
        name.value,
        details.value,
        start.value,
        end.value,
        color.value,
        user.uid
      );

      await updateRange("", "");
      name.value = "";
      details.value = "";
      start.value = "";
      end.value = "";
      color.value = "#14B8A6";
    } else {
      toast.warning("Name, start and end are required", "Incomplete Event");
    }
  } catch (error) {
    console.error("Error adding new event", error);
  }
}

async function updateEvent(ev) {
  pendingEventData.value = ev;
  showUpdateConfirmModal.value = true;
}

async function confirmUpdateEvent() {
  showUpdateConfirmModal.value = false;
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const response = await updateEvent_(
      currentlyEditing.value,
      pendingEventData.value.details,
      user.uid
    );
    selectedOpen.value = false;
    currentlyEditing.value = null;
    pendingEventData.value = null;
  } catch (error) {
    console.error("Error updating event:", error);
  }
}

async function deleteEvent(ev) {
  pendingEventData.value = ev;
  showDeleteConfirmModal.value = true;
}

async function confirmDeleteEvent() {
  showDeleteConfirmModal.value = false;
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const response = await deleteEvent_(pendingEventData.value, user.uid);
    selectedOpen.value = false;
    await updateRange("", "");
    pendingEventData.value = null;
  } catch (error) {
    console.error("Error deleting event:", error);
  }
}

function convertInput(input) {
  const date = new Date(input);

  // Format output
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}+08:00`;
}

function viewDay(nativeEvent, { date }) {
  focus.value = date;
  type.value = "day";
}
function getEventColor(event) {
  return event.color;
}
function setToday() {
  focus.value = "";
}
function prev() {
  calendar.value.prev();
}
function next() {
  calendar.value.next();
}
function editEvent(event) {
  currentlyEditing.value = event.id;
}

function showEvent(nativeEvent, { event }) {
  const open = () => {
    selectedEvent.value = event;
    selectedElement.value = nativeEvent.target;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => (selectedOpen.value = true))
    );
  };
  if (selectedOpen.value) {
    selectedOpen.value = false;
    requestAnimationFrame(() => requestAnimationFrame(() => open()));
  } else {
    open();
  }
  nativeEvent.stopPropagation();
}
async function updateRange({ start, end }) {
  events.value = [
    ...(await getEvents("calendar")),
    ...(await getEvents("google")),
  ];
}

// sync your calendar events from google calendar to firebase storage
async function sync_from_google() {
  try {
    let events = [];
    const colors_obj = {
      default: "#039be5", // blue (peacock)
      1: "#7986cb", // soft purple (lavender)
      2: "#33b679", // light green (sage)
      3: "#8e24aa", // purple (grape)
      4: "#e67c73", // pinkish red (flamingo)
      5: "#f6bf26", // yellow (banana)
      6: "#f4511e", // orange (tangerine)
      8: "#616161", // grey (graphite)
      9: "#3f51b5", // indigo blue (blueberry)
      10: "#0b8043", // dark green (basil)
      11: "#d50000", // bright red (tomato)
    };
    const user_ = JSON.parse(localStorage.getItem("user"));
    const now = new Date(Date.now());
    if (
      !user_.token ||
      !user_.expiry ||
      now >= new Date(user_.expiry) - 5 * 60 * 1000
    ) {
      toast.info("Invalid/Expired Google Token");
      showSyncConfirmModal.value = true;
    } else {
      await performGoogleSync(user_, colors_obj);
    }
  } catch (error) {
    console.error("Error getting event", error);
  }
}

async function confirmGoogleSync() {
  showSyncConfirmModal.value = false;
  try {
    const colors_obj = {
      default: "#039be5",
      1: "#7986cb",
      2: "#33b679",
      3: "#8e24aa",
      4: "#e67c73",
      5: "#f6bf26",
      6: "#f4511e",
      8: "#616161",
      9: "#3f51b5",
      10: "#0b8043",
      11: "#d50000",
    };
    const user_ = JSON.parse(localStorage.getItem("user"));
    const response_ = await signInWithGoogle();
    const expiryTime = Date.now() + 3600 * 1000; // 1 hour
    user_.token = response_.token;
    user_.expiry = new Date(expiryTime);
    localStorage.setItem("user", JSON.stringify(user_));
    await performGoogleSync(user_, colors_obj);
    toast.success("Google Login successful! Calendar has been synced.");
  } catch (error) {
    console.error("Error during Google sync:", error);
  }
}

async function performGoogleSync(user_, colors_obj) {
  let events = [];
  const response = await firebaseGetEvents(user_.token, "primary", "month");
  response.calendar.forEach((event) => {
    events.push({
      name: event.summary ?? "(No title)",
      details: event.description ?? "(No Description)",
      start: event.start.dateTime,
      end: event.end.dateTime,
      colorId: colors_obj[event.colorId] ?? colors_obj.default,
    });
  });
  await clearEvents_("google", user_.uid);
  for (let ev of events) {
    await addEvent_(
      "google",
      ev.name,
      ev.details,
      ev.start,
      ev.end,
      ev.colorId,
      user_.uid
    );
  }
  await updateRange("", "");
  toast.success(
    "Successfully synced from Google Calendar",
    "Sync Complete"
  );
}
</script>

<style scoped>
.modal.d-block {
  display: block !important;
}
</style>
