import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  connectFirestoreEmulator,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  connectAuthEmulator,
  onAuthStateChanged,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  connectStorageEmulator,
} from "firebase/storage";

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: process.env.VUE_APP_API_KEY,
  authDomain: process.env.VUE_APP_AUTH_DOMAIN,
  projectId: process.env.VUE_APP_PROJECT_ID,
  storageBucket: process.env.VUE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_APP_ID,
  measurementId: process.env.VUE_APP_MEASUREMENT_ID,
};

// Initialize Firebase
const useEmulators = true;
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// Connect to Firebase Emulators
if (useEmulators) {
  connectFirestoreEmulator(db, "dodieboy.codes", 8081);
  connectAuthEmulator(auth, "http://dodieboy.codes:9091");
  connectStorageEmulator(storage, "dodieboy.codes", 9191);
}

// Request permission to access Calendar
provider.addScope("https://www.googleapis.com/auth/calendar");
provider.addScope("https://www.googleapis.com/auth/calendar.events");

// Firestore functions
export const getJobPostings = async (filters = {}) => {
  try {
    let q = collection(db, "jobPostings");

    // Apply filters
    if (filters.subject) {
      q = query(q, where("subject", "==", filters.subject));
    }
    if (filters.level) {
      q = query(q, where("level", "==", filters.level));
    }
    if (filters.location) {
      q = query(q, where("location", "==", filters.location));
    }

    q = query(q, orderBy("postedDate", "desc"));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching job postings:", error);
    return [];
  }
};

export const applyToJob = async (jobId, tutorId, applicationData) => {
  try {
    await addDoc(collection(db, "applications"), {
      jobId,
      tutorId,
      ...applicationData,
      appliedDate: new Date(),
      status: "pending",
    });
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error applying to job:", error);
    return {
      success: false,
      error,
    };
  }
};

// Assignments
export const createAssignment = async (parentId, assignmentData) => {
  try {
    const payload = {
      parentId,
      ...assignmentData,
      createdAt: new Date().toISOString(),
      status: "open",
    };
    const docRef = await addDoc(collection(db, "assignments"), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating assignment:", error);
    return { success: false, error: error.message };
  }
};

export const updateAssignment = async (assignmentId, assignmentData) => {
  try {
    const docRef = doc(db, "assignments", assignmentId);
    const payload = {
      ...assignmentData,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(docRef, payload);
    return { success: true, id: assignmentId };
  } catch (error) {
    console.error("Error updating assignment:", error);
    return { success: false, error: error.message };
  }
};

export const deleteAssignment = async (assignmentId) => {
  try {
    const docRef = doc(db, "assignments", assignmentId);
    await deleteDoc(docRef);
    return { success: true, id: assignmentId };
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return { success: false, error: error.message };
  }
};

// ============= APPLICATION FUNCTIONS =============

/**
 * Submit an application for a tutoring assignment
 * @param {string} assignmentId - The ID of the assignment
 * @param {string} tutorId - The ID of the tutor applying
 * @param {Object} applicationData - Application details (coverLetter, startDate)
 * @returns {Promise<Object>} Result with success status
 */
export const submitApplication = async (
  assignmentId,
  tutorId,
  applicationData
) => {
  try {
    // Get tutor details for the application
    const tutorDoc = await getDoc(doc(db, "users", tutorId));
    if (!tutorDoc.exists()) {
      throw new Error("Tutor profile not found");
    }
    const tutorData = tutorDoc.data();

    // Create the application document
    const application = {
      assignmentId,
      tutorId,
      tutorName: tutorData.name || "Unknown",
      tutorEmail: tutorData.email || "",
      tutorAvatar: tutorData.avatar || "",
      tutorExperience: tutorData.experience || 0,
      tutorRating: tutorData.rating || null,
      coverLetter: applicationData.coverLetter,
      startDate: applicationData.startDate,
      status: "pending", // pending, approved, rejected
      appliedAt: new Date().toISOString(),
    };

    // Add to applications subcollection
    const appRef = await addDoc(
      collection(db, "assignments", assignmentId, "applications"),
      application
    );

    // Update assignment status to "pending" if it's currently "open"
    const assignmentDoc = await getDoc(doc(db, "assignments", assignmentId));
    if (assignmentDoc.exists() && assignmentDoc.data().status === "open") {
      await updateDoc(doc(db, "assignments", assignmentId), {
        status: "pending",
        updatedAt: new Date().toISOString(),
      });
    }

    return { success: true, applicationId: appRef.id };
  } catch (error) {
    console.error("Error submitting application:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all applications for a specific assignment
 * @param {string} assignmentId - The ID of the assignment
 * @returns {Promise<Array>} List of applications
 */
export const getAssignmentApplications = async (assignmentId) => {
  try {
    const q = query(
      collection(db, "assignments", assignmentId, "applications"),
      orderBy("appliedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting applications:", error);
    return [];
  }
};

/**
 * Approve a tutor application and close the assignment
 * @param {string} assignmentId - The ID of the assignment
 * @param {string} applicationId - The ID of the approved application
 * @param {string} tutorId - The ID of the approved tutor
 * @returns {Promise<Object>} Result with success status
 */
export const approveApplication = async (
  assignmentId,
  applicationId,
  tutorId
) => {
  try {
    // Update the approved application status
    await updateDoc(
      doc(db, "assignments", assignmentId, "applications", applicationId),
      {
        status: "approved",
        approvedAt: new Date().toISOString(),
      }
    );

    // Update assignment status to "closed" and add selectedTutorId
    await updateDoc(doc(db, "assignments", assignmentId), {
      status: "closed",
      selectedTutorId: tutorId,
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Get all other applications and reject them
    const applications = await getAssignmentApplications(assignmentId);
    const rejectPromises = applications
      .filter((app) => app.id !== applicationId)
      .map((app) =>
        updateDoc(
          doc(db, "assignments", assignmentId, "applications", app.id),
          {
            status: "rejected",
            rejectedAt: new Date().toISOString(),
          }
        )
      );

    await Promise.all(rejectPromises);

    return { success: true };
  } catch (error) {
    console.error("Error approving application:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Reject a tutor application
 * @param {string} assignmentId - The ID of the assignment
 * @param {string} applicationId - The ID of the application to reject
 * @returns {Promise<Object>} Result with success status
 */
export const rejectApplication = async (assignmentId, applicationId) => {
  try {
    await updateDoc(
      doc(db, "assignments", assignmentId, "applications", applicationId),
      {
        status: "rejected",
        rejectedAt: new Date().toISOString(),
      }
    );
    return { success: true };
  } catch (error) {
    console.error("Error rejecting application:", error);
    return { success: false, error: error.message };
  }
};

export const getParentAssignments = async (parentId) => {
  try {
    // Fetch assignments for parentId without server-side ordering to avoid composite index requirements.
    const q = query(
      collection(db, "assignments"),
      where("parentId", "==", parentId)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort client-side by createdAt (support ISO string or Firestore timestamp)
    items.sort((a, b) => {
      const ta =
        a.createdAt && typeof a.createdAt === "string"
          ? Date.parse(a.createdAt)
          : a.createdAt && a.createdAt.seconds
          ? a.createdAt.seconds * 1000
          : 0;
      const tb =
        b.createdAt && typeof b.createdAt === "string"
          ? Date.parse(b.createdAt)
          : b.createdAt && b.createdAt.seconds
          ? b.createdAt.seconds * 1000
          : 0;
      return tb - ta;
    });
    return items;
  } catch (error) {
    console.error("Error fetching parent assignments:", error);
    return [];
  }
};

export const getAssignmentById = async (id) => {
  try {
    const docRef = doc(db, "assignments", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // IMPORTANT: Make sure ID is included
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting assignment:", error);
    return null;
  }
};

// Storage functions
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return {
      success: true,
      url: downloadURL,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      success: false,
      error,
    };
  }
};

// Auth functions
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error) {
    console.error("Error logging in:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in.
    console.log("User is logged in:", user.uid);
    // Here you can store the user data in a global state (e.g., Pinia, Vuex, or a reactive variable)
  } else {
    // User is signed out.
    console.log("User is logged out");
    // Clear the user data from your global state here
  }
});

export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error) {
    console.error("Error registering:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error logging out:", error);
    return {
      success: false,
      error,
    };
  }
};

// Google Auth with FireBase
export const signInWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, provider);

    // This gives you a Google Access Token. You can use it to access Google APIs.
    const credential = GoogleAuthProvider.credentialFromResult(userCredential);
    const token = credential.accessToken;

    // The signed-in user info. firebase user info
    const user = userCredential.user;

    // IdP data available using getAdditionalUserInfo(result)
    const additionalUserInfo = getAdditionalUserInfo(userCredential);

    const expiryTime = Date.now() + 3600 * 1000; // 1 hour

    return {
      success: true,
      user: user,
      token: token,
      expiry: new Date(expiryTime),
    };
  } catch (error) {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const errorCredential = GoogleAuthProvider.credentialFromError(error);
    // ...

    console.error("Error logging in:", error);
    return {
      success: false,
      error,
    };
  }
};

// GET Operations

// Google Calendar API - get All Calendars of User
export const getUserCalendars = async (token) => {
  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    return {
      success: true,
      calendar: data,
    };
  } catch (error) {
    console.error("Error getting user calendar:", error);
    return {
      success: false,
      error,
    };
  }
};

// Google Calendar API - get Calendar by CalendarId (primary as default input)
export const getPrimaryCalendar = async (token, calendarId = "primary") => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/calendarId?calendarId=${calendarId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    return {
      success: true,
      calendar: data,
    };
  } catch (error) {
    console.error("Error getting user calendar:", error);
    return {
      success: false,
      error,
    };
  }
};

// Google Calendar API - get All Events by calendarId for the current month
// for day, week, month, 4 day
export const getEvents = async (token, calendarId = "primary", type) => {
  function toLocalISOString(date) {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - tzOffset);
    return localDate.toISOString().slice(0, 23) + "Z";
  }

  try {
    let calStart = "";
    let calEnd = "";
    const now = new Date();
    switch (type) {
      case "day":
        calStart = toLocalISOString(
          new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        );
        calEnd = toLocalISOString(
          new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        );
        break;
      case "week":
        const firstDayOfWeek = new Date(now);
        const lastDayOfWeek = new Date(now);
        // assuming week starts on Monday
        const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ...
        const diffToMonday = (dayOfWeek + 6) % 7; // Monday offset
        firstDayOfWeek.setDate(now.getDate() - diffToMonday);
        firstDayOfWeek.setHours(0, 0, 0, 0);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);
        calStart = toLocalISOString(firstDayOfWeek);
        calEnd = toLocalISOString(lastDayOfWeek);
        break;
      case "month":
        calStart = toLocalISOString(
          new Date(now.getFullYear(), now.getMonth(), 1)
        );
        calEnd = toLocalISOString(
          new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        );
        break;
      case "4day":
        // Start of today
        calStart = toLocalISOString(
          new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        );
        // End of the 4th day (today + 3)
        calEnd = toLocalISOString(
          new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 3,
            23,
            59,
            59
          )
        );
        break;
    }
    // console.log(calStart, calEnd)
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?singleEvents=true&orderBy=startTime&timeMin=${calStart}&timeMax=${calEnd}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    const data = await response.json();
    // console.log(data)
    data.items.forEach((element) => {
      console.log(
        element.start.dateTime,
        element.end.dateTime,
        element.colorId ?? null,
        element.description ?? null
      );
    });

    return {
      success: true,
      calendar: data.items,
    };
  } catch (error) {
    console.error("Error getting month events:", error);
    return {
      success: false,
      error,
    };
  }
};

// Google Calendar API - get Event by calendarId
export const getEventById = async (token, calendarId = "primary", eventId) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    return {
      success: true,
      calendar: data,
    };
  } catch (error) {
    console.error("Error getting event:", error);
    return {
      success: false,
      error,
    };
  }
};

// CREATE Operations
// Google Calendar API - create new event for a calendar
export const createEvent = async (token, calendarId = "primary", event) => {
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
    //   "dateTime": "2025-10-07T11:00:00",
    //   "timeZone": "Asia/Singapore"
    // },
    // "end": {
    //   "dateTime": "2025-10-08T11:00:00",
    //   "timeZone": "Asia/Singapore"
    // },
    // "colorId": "5"
    // }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: event,
      }
    );

    const data = await response.json();

    return {
      success: true,
      calendar: data,
    };
  } catch (error) {
    console.error("Error creating new event:", error);
    return {
      success: false,
      error,
    };
  }
};

// UPDATE Operations
// Google Calendar API - update an event for a calendar
export const updateEvent = async (
  token,
  calendarId = "primary",
  eventId,
  event
) => {
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

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: event,
      }
    );

    const data = await response.json();

    return {
      success: true,
      calendar: data,
    };
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      error,
    };
  }
};

// Google Calendar API - update an event for a calendar
export const patchEvent = async (
  token,
  calendarId = "primary",
  eventId,
  event
) => {
  try {
    // no fixed requirement on fields in event, able to patch one field without overwriting the whole event

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: event,
      }
    );

    const data = await response.json();

    return {
      success: true,
      calendar: data,
    };
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      error,
    };
  }
};

// DELETE Operations
// Google Calendar API - delete an event for a calendar
export const deleteEvent = async (token, calendarId = "primary", eventId) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    return {
      success: true,
      calendar: data,
    };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      error,
    };
  }
};

// firebase storage calendar
// get events
export const getEvent_ = async (type, userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const response = await getDoc(userRef);
    const data = response.data();
    // console.log(data.calendar)
    switch (type) {
      case "calendar": {
        return data.calendar;
      }
      case "google": {
        return data.googleCal;
      }
    }
  } catch (error) {
    console.error("Error getting event:", error);
    return {
      success: false,
      error,
    };
  }
};

// add event
export const addEvent_ = async (
  type,
  name,
  details,
  start,
  end,
  color,
  userId
) => {
  try {
    const userRef = doc(db, "users", userId);
    switch (type) {
      case "calendar": {
        const response = await updateDoc(userRef, {
          calendar: arrayUnion({
            id: "calendar_" + crypto.randomUUID(),
            name: name,
            details: details,
            start: start,
            end: end,
            color: color,
            timed: true,
          }),
        });
        return response;
      }
      case "google": {
        const response = await updateDoc(userRef, {
          googleCal: arrayUnion({
            id: "google_" + crypto.randomUUID(),
            name: name,
            details: details,
            start: start,
            end: end,
            color: color,
            timed: true,
          }),
        });
        return response;
      }
    }
  } catch (error) {
    console.error("Error adding event:", error);
    return {
      success: false,
      error,
    };
  }
};

// update event
export const updateEvent_ = async (currentlyEditing, details, userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    const type = currentlyEditing.split("_")[0];
    switch (type) {
      case "calendar": {
        const calendar = snap.data().calendar || [];
        let updateDetails = { details: details };
        const updatedCalendar = calendar.map((event) =>
          event.id === currentlyEditing ? { ...event, ...updateDetails } : event
        );
        const response = await updateDoc(userRef, {
          calendar: updatedCalendar,
        });
        return response;
      }
      case "google": {
        const calendar = snap.data().googleCal || [];
        let updateDetails = { details: details };
        const updatedCalendar = calendar.map((event) =>
          event.id === currentlyEditing ? { ...event, ...updateDetails } : event
        );
        const response = await updateDoc(userRef, {
          googleCal: updatedCalendar,
        });
        return response;
      }
    }
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      error,
    };
  }
};

// delete event
export const deleteEvent_ = async (ev, userId) => {
  try {
    // console.log(ev)
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    const type = ev.split("_")[0];
    switch (type) {
      case "calendar": {
        const calendar = snap.data().calendar || [];
        const updatedCalendar = calendar.filter((e) => e.id !== ev);
        const response = await updateDoc(userRef, {
          calendar: updatedCalendar,
        });
        return response;
      }
      case "google": {
        const calendar = snap.data().googleCal || [];
        const updatedCalendar = calendar.filter((e) => e.id !== ev);
        const response = await updateDoc(userRef, {
          googleCal: updatedCalendar,
        });
        return response;
      }
    }
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      error,
    };
  }
};

// clear all events
export const clearEvents_ = async (type, userId) => {
  try {
    const userRef = doc(db, "users", userId);
    switch (type) {
      case "calendar": {
        await updateDoc(userRef, {
          calendar: [],
        });
        break;
      }
      case "google": {
        await updateDoc(userRef, {
          googleCal: [],
        });
        break;
      }
    }
  } catch (error) {
    console.error("Error clearing events:", error);
    return {
      success: false,
      error,
    };
  }
};

export const getSubjects = async () => {
  try {
    const docRef = doc(db, "Subjects", "subject"); // Note: capital 'S' in Subjects
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().list || [];
    } else {
      console.log("No subjects found!");
      return [];
    }
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return [];
  }
};

export const getLevels = async () => {
  try {
    const docRef = doc(db, "Subjects", "levels");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data().list || [];

      // Check if data is in new nested format (array of objects with 'name' field)
      if (data.length > 0 && typeof data[0] === "object" && data[0].name) {
        // Extract just the level names for backward compatibility
        return data.map((level) => level.name);
      }

      // If still in old format (array of strings), return as-is
      return data;
      console.log(data);
    } else {
      console.log("No levels found!");
      return [];
    }
  } catch (error) {
    console.error("Error fetching levels:", error);
    return [];
  }
};

// Get levels with grades (nested structure)
// Returns: [{ name: "Primary", grades: ["Primary 1", "Primary 2", ...] }, ...]
export const getLevelsWithGrades = async () => {
  try {
    const docRef = doc(db, "Subjects", "levels");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data().list || [];

      // Check if data is in new nested format (array of objects)
      if (data.length > 0 && typeof data[0] === "object" && data[0].name) {
        return data; // Return full nested structure
      }

      // If still in old format, return empty array
      console.warn(
        "Levels data is in old format. Please update Firestore structure."
      );
      return [];
    } else {
      console.log("No levels found!");
      return [];
    }
  } catch (error) {
    console.error("Error fetching levels with grades:", error);
    return [];
  }
};

export const getLocations = async () => {
  try {
    const docRef = doc(db, "Subjects", "location");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().list || [];
    } else {
      console.log("No locations found!");
      return [];
    }
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
};

// User helpers
export const getUserRole = async (uid) => {
  try {
    if (!uid) return null;
    const userDoc = doc(db, "users", uid);
    const snap = await getDoc(userDoc);
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.role || null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
};

// Small helper to obtain the current authenticated user via an observer
export const getCurrentUser = async () => {
  try {
    return new Promise((resolve, reject) => {
      const removeListener = onAuthStateChanged(
        auth,
        (user) => {
          // unsubscribe immediately after receiving the value
          if (typeof removeListener === 'function') removeListener();
          resolve(user);
        },
        (err) => {
          reject(err);
        }
      );
    });
  } catch (error) {
    console.error('Error getting currentUser:', error);
    return null;
  }
};

// Payment functions
export const createPaymentRecord = async (assignmentId, paymentData) => {
  try {
    const docRef = await addDoc(collection(db, "payments"), {
      assignmentId,
      ...paymentData,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating payment record:", error);
    throw error;
  }
};

export const completePayment = async (assignmentId, sessionId) => {
  try {
    const paymentsRef = collection(db, "payments");

    let q = query(paymentsRef, where("assignmentId", "==", assignmentId));
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      try {
        const paymentDoc = await getDoc(doc(db, "payments", assignmentId));
        if (paymentDoc.exists()) {
          await updateDoc(doc(db, "payments", assignmentId), {
            status: "completed",
            sessionId,
            paidAt: serverTimestamp(),
          });
          return { success: true };
        }
      } catch (docError) {
        console.error("Payment not found by document ID");
      }
    }

    if (!querySnapshot.empty) {
      const paymentDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "payments", paymentDoc.id), {
        status: "completed",
        sessionId,
        paidAt: serverTimestamp(),
      });
      return { success: true };
    }

    console.warn("Payment record not found, creating new completed record");
    await addDoc(collection(db, "payments"), {
      assignmentId,
      sessionId,
      status: "completed",
      paidAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error completing payment:", error);
    throw error;
  }
};

// Update user email function (teammate's code)
export const updateUserEmail = async (newEmail, currentPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "No user is currently logged in" };
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    await updateEmail(user, newEmail);

    return { success: true };
  } catch (error) {
    console.error("Error updating email:", error);

    let errorMessage = "Failed to update email";

    if (error.code === "auth/wrong-password") {
      errorMessage = "Current password is incorrect";
    } else if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already in use by another account";
    } else if (error.code === "auth/requires-recent-login") {
      errorMessage =
        "For security, please log out and log back in before changing your email";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email format";
    }

    return { success: false, error: errorMessage };
  }
};

export { app as firebaseApp };
export { db, auth, storage };
