<template>
  <v-row class="fill-height">
    <v-col>
      <v-sheet height="64">
        <v-toolbar flat>
          <v-btn class="me-4" color="primary" variant="outlined" dark @click="dialog = true">
            New Event
          </v-btn>
          <v-btn class="me-4" color="grey-darken-2" variant="outlined" @click="setToday">
            Today
          </v-btn>
          <v-btn color="grey-darken-2" size="small" variant="text" icon @click="prev">
            <v-icon size="small">
              mdi-chevron-left
            </v-icon>
          </v-btn>
          <v-btn color="grey-darken-2" size="small" variant="text" icon @click="next">
            <v-icon size="small">
              mdi-chevron-right
            </v-icon>
          </v-btn>
          <v-toolbar-title v-if="calendar">
            {{ calendar.title }}
          </v-toolbar-title>
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn color="grey-darken-2" variant="outlined" v-bind="props">
                <span>{{ typeToLabel[type] }}</span>
                <v-icon end>
                  mdi-menu-down
                </v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="type = 'day'">
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
              <v-text-field v-model="name" type="text" label="event name (required)"></v-text-field>
              <v-text-field v-model="details" type="text" label="details"></v-text-field>
              <v-text-field v-model="start" type="datetime-local" label="start (required)"></v-text-field>
              <v-text-field v-model="end" type="datetime-local" label="end (required)"></v-text-field>
              <v-text-field v-model="color" type="type" label="color (click to open color menu)"></v-text-field>
              <v-btn type="submit" color="primary" class="mr-4" @click.stop="dialog = false">
                Create Event
              </v-btn>
            </v-form>
          </v-container>
        </v-card>
      </v-dialog>

      <v-sheet height="600">
        <v-calendar ref="calendar" v-model="focus" :event-color="getEventColor" :events="events" :type="type"
          color="primary" @change="updateRange" @click:date="viewDay" @click:event="showEvent"
          @click:more="viewDay"></v-calendar>
        <v-menu v-model="selectedOpen" :activator="selectedElement" :close-on-content-click="false" location="end">
          <v-card color="grey-lighten-4" min-width="350px" flat>
            <v-toolbar :color="selectedEvent.color" dark>
              <v-btn @click="deleteEvent(selectedEvent.id)" icon>
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              <v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
              <v-btn icon>
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon>
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card-text>
              <form v-if="currentlyEditing !== selectedEvent.id">
                {{ selectedEvent.details }}
              </form>
              <form v-else>
                <textarea v-model="selectedEvent.details" type="text" style="width:100%" :min-height="100"
                  placeholder="add note"></textarea>
              </form>
            </v-card-text>
            <v-card-actions>
              <v-btn color="secondary" variant="text" @click="selectedOpen = false">
                Close
              </v-btn>
              <v-btn variant="text" v-if="currentlyEditing !== selectedEvent.id"
                @click.prevent="editEvent(selectedEvent)">
                Edit
              </v-btn>
              <v-btn variant="text" v-else @click.prevent="updateEvent(selectedEvent)">
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
import { db } from '../services/firebase.js'
import { doc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'

import { onMounted, ref } from 'vue'

const calendar = ref()

const typeToLabel = {
  month: 'Month',
  week: 'Week',
  day: 'Day',
  '4day': '4 Days',
}
// const colors = ['blue', 'indigo', 'deep-purple', 'cyan', 'green', 'orange', 'grey darken-1']
// const names = ['Meeting', 'Holiday', 'PTO', 'Travel', 'Event', 'Birthday', 'Conference', 'Party']

const focus = ref('')
const type = ref('month')
const selectedEvent = ref({})
const selectedElement = ref(null)
const selectedOpen = ref(false)
const events = ref([])
const currentlyEditing = ref('')
const dialog = ref(false)

const name = ref(null)
const details = ref(null)
const start = ref(null)
const end = ref(null)
const color = ref('#14B8A6')

onMounted(() => {
  calendar.value.checkChange()
})

async function getEvents() {
  try {
    let querySnapshot = await getDocs(collection(db, 'calEvent'))
    let events = []
    querySnapshot.forEach(doc => {
      const data = doc.data()

      // Convert Firestore date fields to JS Date strings
      const startDate = new Date(data.start)  // assuming 'start' is stored as ISO string
      const endDate = new Date(data.end)      // assuming 'end' is stored as ISO string

      events.push({
        id: doc.id, ...data, start: startDate,   // e.g., "Sun Oct 12 2025 23:00:00 GMT+0800 (Singapore Standard Time)"
        end: endDate
      })
      console.log(doc.id, data, 'start:', startDate, 'end:', endDate)
    })
    return events
  } catch (error) {
    console.error('Error fetching events:', error)
  }
}

async function addEvent() {
  try {
    if (name.value && start.value && end.value) {
      start.value = convertInput(start.value)
      end.value = convertInput(end.value)
      const response = await addDoc(collection(db, 'calEvent'), {
        name: name.value,
        details: details.value,
        start: start.value,
        end: end.value,
        color: color.value,
        timed: true
      })
      await updateRange('', '')
      name.value = "";
      details.value = "";
      start.value = "";
      end.value = "";
      color.value = "#14B8A6";
    } else {
      alert('Name, start and end are required');
    }
  } catch (error) {
    console.error('Error adding new event', error)
  }
}

async function updateEvent(ev) {
  try {
    await updateDoc(doc(db, 'calEvent', this.currentlyEditing), {
      details: ev.details,
    })
    selectedOpen.value = false
    currentlyEditing.value = null
  } catch (error) {
    console.error('Error updating event:', error)
  }
}

async function deleteEvent(ev) {
  try {
    await deleteDoc(doc(db, 'calEvent', ev))
    selectedOpen.value = false
    await updateRange('', '')
  } catch (error) {
    console.error('Error deleting event:', error)
  }
}

function convertInput(input) {
  const date = new Date(input);

  // Format output
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}+08:00`;
}

function viewDay(nativeEvent, { date }) {
  focus.value = date
  type.value = 'day'
}
function getEventColor(event) {
  return event.color
}
function setToday() {
  focus.value = ''
}
function prev() {
  calendar.value.prev()
}
function next() {
  calendar.value.next()
}
function editEvent(event) {
  currentlyEditing.value = event.id
}


function showEvent(nativeEvent, { event }) {
  const open = () => {
    selectedEvent.value = event
    selectedElement.value = nativeEvent.target
    requestAnimationFrame(() => requestAnimationFrame(() => selectedOpen.value = true))
  }
  if (selectedOpen.value) {
    selectedOpen.value = false
    requestAnimationFrame(() => requestAnimationFrame(() => open()))
  } else {
    open()
  }
  nativeEvent.stopPropagation()
}
async function updateRange({ start, end }) {
  // const _events = []
  // const min = new Date(`${start.date}T00:00:00`)
  // const max = new Date(`${end.date}T23:59:59`)
  // const days = (max.getTime() - min.getTime()) / 86400000
  // const eventCount = rnd(days, days + 20)
  // for (let i = 0; i < eventCount; i++) {
  //   const allDay = rnd(0, 3) === 0
  //   const firstTimestamp = rnd(min.getTime(), max.getTime())
  //   const first = new Date(firstTimestamp - (firstTimestamp % 900000))
  //   const secondTimestamp = rnd(2, allDay ? 288 : 8) * 900000
  //   const second = new Date(first.getTime() + secondTimestamp)
  //   _events.push({
  //     name: names[rnd(0, names.length - 1)],
  //     start: first,
  //     end: second,
  //     color: colors[rnd(0, colors.length - 1)],
  //     timed: !allDay,
  //   })
  // }
  // console.log(start,end)
  // console.log(_events)
  events.value = await getEvents()
  // console.log('testing', events.value)
}
// function rnd (a, b) {
//   return Math.floor((b - a + 1) * Math.random()) + a
// }

</script>