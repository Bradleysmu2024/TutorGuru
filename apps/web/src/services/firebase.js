import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, query, where, orderBy, addDoc, doc, getDoc } from "firebase/firestore"
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, getAdditionalUserInfo } from "firebase/auth"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { GoogleAuthProvider } from "firebase/auth";

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: process.env.VUE_APP_API_KEY,
  authDomain: process.env.VUE_APP_AUTH_DOMAIN,
  projectId: process.env.VUE_APP_PROJECT_ID,
  storageBucket: process.env.VUE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_APP_ID,
  measurementId: process.env.VUE_APP_MEASUREMENT_ID
};

// Initialize Firebase
console.log(firebaseConfig.apiKey);

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)
const provider = new GoogleAuthProvider();

// Request permission to access Calendar
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');


// Firestore functions
export const getJobPostings = async (filters = {}) => {
  try {
    let q = collection(db, "jobPostings")

    // Apply filters
    if (filters.subject) {
      q = query(q, where("subject", "==", filters.subject))
    }
    if (filters.level) {
      q = query(q, where("level", "==", filters.level))
    }
    if (filters.location) {
      q = query(q, where("location", "==", filters.location))
    }

    q = query(q, orderBy("postedDate", "desc"))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Error fetching job postings:", error)
    return []
  }
}

export const applyToJob = async (jobId, tutorId, applicationData) => {
  try {
    await addDoc(collection(db, "applications"), {
      jobId,
      tutorId,
      ...applicationData,
      appliedDate: new Date(),
      status: "pending",
    })
    return { success: true }
  } catch (error) {
    console.error("Error applying to job:", error)
    return { success: false, error }
  }
}

// Storage functions
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return { success: true, url: downloadURL }
  } catch (error) {
    console.error("Error uploading file:", error)
    return { success: false, error }
  }
}

// Auth functions
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error("Error logging in:", error)
    return { success: false, error: error.message }
  }
}

export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error("Error registering:", error)
    return { success: false, error: error.message }
  }
}

export const logoutUser = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error) {
    console.error("Error logging out:", error)
    return { success: false, error }
  }
}

// Google Auth with FireBase
export const signInWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, provider)

    // This gives you a Google Access Token. You can use it to access Google APIs.
    const credential = GoogleAuthProvider.credentialFromResult(userCredential)
    const token = credential.accessToken

    // The signed-in user info. firebase user info
    const user = userCredential.user

    // IdP data available using getAdditionalUserInfo(result)
    const additionalUserInfo = getAdditionalUserInfo(userCredential)

    return { success: true, user: user, token: token }

  } catch (error) {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const errorCredential = GoogleAuthProvider.credentialFromError(error);
    // ...

    console.error("Error logging in:", error)
    return { success: false, error }
  }
}


// GET Operations

// Google Calendar API - get All Calendars of User
export const getUserCalendars = async (token) => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      
    })

    return { success: true, calendar: response }
  } catch (error) {
    console.error("Error getting user calendar:", error)
    return { success: false, error }
  }
}

// Google Calendar API - get Calendar by CalendarId (primary as default input)
export const getPrimaryCalendar = async (token, calendarId = 'primary') => {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/calendarId?calendarId=${calendarId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return { success: true, calendar: response }
  } catch (error) {
    console.error("Error getting user calendar:", error)
    return { success: false, error }
  }
}

// Google Calendar API - get All Events by calendarId for the current month
export const getEvents = async (token, calendarId = 'primary') => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()


    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?
      singleEvents=true&
      orderBy=startTime&
      timeMin=${startOfMonth}&
      timeMax=${endOfMonth}`
      , {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

    return { success: true, calendar: response }
  } catch (error) {
    console.error("Error getting month events:", error)
    return { success: false, error }
  }
}

// Google Calendar API - get All Events by calendarId for the current month
export const getEventById = async (token, calendarId = 'primary', eventId) => {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`
      , {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

    return { success: true, calendar: response }
  } catch (error) {
    console.error("Error getting event:", error)
    return { success: false, error }
  }
}

// CREATE Operations
// Google Calendar API - create new event for a calendar
export const createEvent = async (token, calendarId = 'primary', event) => {
  try {

    // event body format
    // event = {
    //   'summary': eventName,
    //   'description': eventDescription,
    //   'start':{
    //     'dateTime': start.toISOString(), // Date.toISOString() -> google date formatting
    //     'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
    //   },
    //   'end':{
    //     'dateTime': end.toISOString(), // Date.toISOString() -> google date formatting
    //     'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
    //   }
    // }
    // {
    // "summary": "Meeting with Team",
    // "description": "Discuss project roadmap",
    // "start": {
    //   "dateTime": "2025-10-07T11:00:00.000Z",
    //   "timeZone": "Asia/Singapore"
    // },
    // "end": {
    //   "dateTime": "2025-10-08T11:00:00.000Z",
    //   "timeZone": "Asia/Singapore"
    // },
    // "colorId": "5"
    // }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`
      , {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: event
      })

    return { success: true, calendar: response }
  } catch (error) {
    console.error("Error creating new event:", error)
    return { success: false, error }
  }
}

// UPDATE Operations
// Google Calendar API - update an event for a calendar
export const updateEvent = async (token, calendarId = 'primary', eventId, event) => {
  try {

  // requires start and end in body
  //   {
  // "summary": "Meeting with Team",
  // "description": "Discuss project roadmap",
  // "start": {
  //   "dateTime": "2025-10-09T11:00:00.000Z",
  //   "timeZone": "Asia/Singapore"
  // },
  // "end": {
  //   "dateTime": "2025-10-10T11:00:00.000Z",
  //   "timeZone": "Asia/Singapore"
  // },
  // "colorId": "5"
  // }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`
      , {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: event
      })

    return { success: true, calendar: response }
  } catch (error) {
    console.error("Error updating event:", error)
    return { success: false, error }
  }
}

// Google Calendar API - update an event for a calendar
export const patchEvent = async (token, calendarId = 'primary', eventId, event) => {
  try {

    // no fixed requirement on fields in event, able to patch one field without overwriting the whole event

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`
      , {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: event
      })

    return { success: true, calendar: response }
  } catch (error) {
    console.error("Error updating event:", error)
    return { success: false, error }
  }
}


// DELETE Operations
// Google Calendar API - delete an event for a calendar
export const deleteEvent = async (token, calendarId = 'primary', eventId) => {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`
      , {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        }
      })

    return { success: true, calendar: response }
  } catch (error) {
    console.error("Error deleting event:", error)
    return { success: false, error }
  }
}

export const getSubjects = async () => {
  try {
    const docRef = doc(db, 'Subjects', 'subject') // Note: capital 'S' in Subjects
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data().list || []
    } else {
      console.log('No subjects found!')
      return []
    }
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return []
  }
}

export const getLevels = async () => {
  try {
    const docRef = doc(db, 'Subjects', 'levels')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data().list || []
    } else {
      console.log('No levels found!')
      return []
    }
  } catch (error) {
    console.error('Error fetching levels:', error)
    return []
  }
}

export const getLocations = async () => {
  try {
    const docRef = doc(db, 'Subjects', 'location')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data().list || []
    } else {
      console.log('No locations found!')
      return []
    }
  } catch (error) {
    console.error('Error fetching locations:', error)
    return []
  }
}


export { app as firebaseApp }
export { db, auth, storage }
