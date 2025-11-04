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
  deleteObject,
  connectStorageEmulator,
} from "firebase/storage";
import { ref as vueRef } from "vue";

//Replace with your Firebase config in .env file
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
const useEmulators = false;
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
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const normalizedData = {
      ...assignmentData,
      parentId: parentId || user.uid,
      rate: Number(assignmentData.rate) || 0,
      contractDuration: Number(assignmentData.contractDuration) || 1,
      sessionDuration: Number(assignmentData.sessionDuration) || 1,
      sessionStartTime: assignmentData.sessionStartTime || "12:00",
      sessionsPerWeek:
        assignmentData.selectedDays?.length ||
        Number(assignmentData.sessionsPerWeek) ||
        1,
      selectedDays: Array.isArray(assignmentData.selectedDays)
        ? assignmentData.selectedDays
        : [],
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    Object.keys(normalizedData).forEach((key) => {
      if (normalizedData[key] === undefined || normalizedData[key] === null) {
        delete normalizedData[key];
      }
    });

    const docRef = await addDoc(collection(db, "assignments"), normalizedData);

    return { success: true, id: docRef.id, data: normalizedData };
  } catch (error) {
    console.error("Error creating assignment:", error);
    return { success: false, error: error.message };
  }
};

export const updateAssignment = async (assignmentId, updates) => {
  try {
    const normalizedUpdates = { ...updates };

    if ("rate" in updates) normalizedUpdates.rate = Number(updates.rate) || 0;
    if ("contractDuration" in updates)
      normalizedUpdates.contractDuration =
        Number(updates.contractDuration) || 1;
    if ("sessionDuration" in updates)
      normalizedUpdates.sessionDuration = Number(updates.sessionDuration) || 1;
    if ("sessionStartTime" in updates)
      normalizedUpdates.sessionStartTime = updates.sessionStartTime || "12:00";
    if ("selectedDays" in updates) {
      normalizedUpdates.selectedDays = Array.isArray(updates.selectedDays)
        ? updates.selectedDays
        : [];
      normalizedUpdates.sessionsPerWeek = normalizedUpdates.selectedDays.length;
    }

    normalizedUpdates.updatedAt = new Date().toISOString();

    Object.keys(normalizedUpdates).forEach((key) => {
      if (
        normalizedUpdates[key] === undefined ||
        normalizedUpdates[key] === null
      ) {
        delete normalizedUpdates[key];
      }
    });

    await updateDoc(doc(db, "assignments", assignmentId), normalizedUpdates);

    return { success: true };
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
export const submitApplication = async (
  assignmentId,
  tutorId,
  applicationData
) => {
  try {
    const existingQuery = query(
      collection(db, "assignments", assignmentId, "applications"),
      where("tutorId", "==", tutorId)
    );
    const existingSnap = await getDocs(existingQuery);
    if (!existingSnap.empty) {
      return {
        success: false,
        error: "Tutor has already applied to this assignment",
      };
    }
    const tutorDoc = await getDoc(doc(db, "users", tutorId));
    if (!tutorDoc.exists()) {
      throw new Error("Tutor profile not found");
    }
    const tutorData = tutorDoc.data();

    const application = {
      assignmentId,
      tutorId,
      tutorName: tutorData.name || "Unknown",
      tutorEmail: tutorData.email || "",
      tutorAvatar: tutorData.avatar || "",
      tutorExperience: tutorData.experience || 0,
      tutorRating: tutorData.rating || null,
      tutorTeaching: tutorData.teaching || [],
      tutorDocuments: tutorData.uploadedDocuments || [],
      coverLetter: applicationData.coverLetter,
      startDate: applicationData.startDate,
      status: "pending",
      appliedAt: new Date().toISOString(),
    };

    const appRef = await addDoc(
      collection(db, "assignments", assignmentId, "applications"),
      application
    );

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

export const approveApplication = async (
  assignmentId,
  applicationId,
  tutorId
) => {
  try {
    await updateDoc(
      doc(db, "assignments", assignmentId, "applications", applicationId),
      {
        status: "approved",
        approvedAt: new Date().toISOString(),
      }
    );

    await updateDoc(doc(db, "assignments", assignmentId), {
      status: "closed",
      selectedTutorId: tutorId,
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

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

export const calculateTutorRating = async (tutorId) => {
  try {
    if (!tutorId) return { success: false, error: "Missing tutorId" };
    // Query closed assignments where this tutor was selected
    const q = query(
      collection(db, "assignments"),
      where("selectedTutorId", "==", tutorId),
      where("status", "==", "closed")
    );

    const snap = await getDocs(q);
    if (snap.empty) return { success: true, average: 0, count: 0, sum: 0 };

    let sum = 0;
    let count = 0;

    snap.docs.forEach((d) => {
      const data = d.data() || {};
      const reviews = data.review || data.reviews || [];
      if (Array.isArray(reviews) && reviews.length > 0) {
        reviews.forEach((r) => {
          const raw = r.rating ?? null;
          const num = Number(raw);
          if (!Number.isNaN(num) && isFinite(num)) {
            sum += num;
            count += 1;
          }
        });
      }
    });

    const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0; // 1 decimal
    return { success: true, average, count, sum };
  } catch (err) {
    console.error("Error calculating tutor rating:", err);
    return { success: false, error: err.message || String(err) };
  }
};

// Return count of assignments where this tutor was selected
export const getSelectedAssignmentsCount = async (tutorId) => {
  try {
    if (!tutorId) return 0;
    const q = query(
      collection(db, "assignments"),
      where("selectedTutorId", "==", tutorId)
    );
    const snap = await getDocs(q);
    return snap.size || snap.docs.length || 0;
  } catch (err) {
    console.error("Error getting selected assignments count:", err);
    return 0;
  }
};

// Count assignments where tutor was selected AND the assignment period has ended
export const getCompletedAssignmentsCount = async (tutorId) => {
  try {
    if (!tutorId) return 0;
    const now = new Date();
    const assignmentsQ = query(
      collection(db, "assignments"),
      where("selectedTutorId", "==", tutorId)
    );
    const snap = await getDocs(assignmentsQ);
    if (snap.empty) return 0;

    let count = 0;

    // For each assignment, look for the approved application by this tutor to read startDate
    const promises = snap.docs.map(async (adoc) => {
      try {
        const assignment = { id: adoc.id, ...adoc.data() };
        // Query the applications subcollection for approved application by this tutor
        const appsQ = query(
          collection(db, "assignments", assignment.id, "applications"),
          where("tutorId", "==", tutorId),
          where("status", "==", "approved")
        );
        const appsSnap = await getDocs(appsQ);
        if (appsSnap.empty) return 0;

        // There should be at most one approved app for this tutor/assignment
        const appDoc = appsSnap.docs[0];
        const appData = appDoc.data() || {};
        const startRaw = appData.startDate || appData.approvedAt || assignment.startedAt || null;
        if (!startRaw) return 0;

        let startDate = new Date(startRaw);
        if (startDate.toString() === "Invalid Date") {
          // try Firestore timestamp
          if (startRaw && typeof startRaw.toDate === "function") {
            startDate = startRaw.toDate();
          } else if (startRaw && typeof startRaw.seconds === "number") {
            startDate = new Date(startRaw.seconds * 1000);
          } else {
            return 0;
          }
        }

        const durationMonths = Number(assignment.contractDuration || 1);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30 * durationMonths);

        if (endDate <= now) return 1;
        return 0;
      } catch (err) {
        console.warn("Error checking assignment completion for doc", adoc.id, err);
        return 0;
      }
    });

    const results = await Promise.all(promises);
    results.forEach((r) => (count += r || 0));

    return count;
  } catch (err) {
    console.error("Error getting completed assignments count:", err);
    return 0;
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

// Reactive login status shared across the app
export const loginStatus = vueRef(false);

// Keep loginStatus and localStorage in sync with Firebase Auth
onAuthStateChanged(auth, (user) => {
  loginStatus.value = !!user;
  if (user) {
    if (!localStorage.getItem("user")) {
      localStorage.setItem(
        "user",
        JSON.stringify({ uid: user.uid, email: user.email })
      );
    }
  } else {
    localStorage.removeItem("user");
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

    const user = userCredential.user;

    const expiryTime = Date.now() + 3600 * 1000; // 1 hour

    return {
      success: true,
      user: user,
      token: token,
      expiry: new Date(expiryTime),
    };
  } catch (error) {
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
    // Use the proper calendar endpoint and encode calendarId
    const encodedCalId = encodeURIComponent(calendarId);
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodedCalId}`,
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
        const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ...
        const diffToMonday = (dayOfWeek + 6) % 7;
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
  function generateUUID() {
  // Modern browsers and Node 19+
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Browser fallback using getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  // Node.js fallback using require('crypto')
  try {
    const { randomBytes } = require('crypto');
    const bytes = randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.substr(0,8)}-${hex.substr(8,4)}-${hex.substr(12,4)}-${hex.substr(16,4)}-${hex.substr(20,12)}`;
  } catch (err) {
    // Last resort (non-crypto random)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
  try {
    const userRef = doc(db, "users", userId);
    switch (type) {
      case "calendar": {
        const response = await updateDoc(userRef, {
          calendar: arrayUnion({
            id: "calendar_" + generateUUID(),
            name: name,
            details: details,
            start: start,
            end: end,
            color: color,
            timed: true,
            reminderSent: false,
          }),
        });
        return response;
      }
      case "google": {
        const response = await updateDoc(userRef, {
          googleCal: arrayUnion({
            id: "google_" + generateUUID(),
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
    const docRef = doc(db, "Subjects", "subject");
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
      if (data.length > 0 && typeof data[0] === "object" && data[0].name) {
        return data.map((level) => level.name);
      }
      return data;
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

      if (data.length > 0 && typeof data[0] === "object" && data[0].name) {
        return data;
      }
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
          if (typeof removeListener === "function") removeListener();
          resolve(user);
        },
        (err) => {
          reject(err);
        }
      );
    });
  } catch (error) {
    console.error("Error getting currentUser:", error);
    return null;
  }
};

// Convenience wrappers for user document operations
export const getUserDoc = async (uid) => {
  try {
    if (!uid) return null;
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error("Error fetching user doc:", err);
    return null;
  }
};

export const setUserDoc = async (uid, data, options = { merge: true }) => {
  try {
    if (!uid) throw new Error("Missing uid");
    await setDoc(doc(db, "users", uid), data, options);
    return { success: true };
  } catch (err) {
    console.error("Error setting user doc:", err);
    return { success: false, error: err };
  }
};

// Convert a user id (uid) to their username (if present). Returns username string or null.
export const getUsernameById = async (uid) => {
  try {
    if (!uid) return null;
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return data && data.username ? data.username : null;
  } catch (err) {
    console.error("Error fetching username by id:", err);
    return null;
  }
};

export const uploadUserAvatar = async (uid, file, folder = "users") => {
  try {
    if (!uid) throw new Error("Missing uid");
    if (!file) throw new Error("Missing file");

    // get previous avatar URL (if any)
    const userDoc = await getUserDoc(uid);
    const oldUrl = userDoc ? userDoc.avatar || userDoc.avator : null;

    const ext = (file.name || "").split(".").pop();
    const path = `${folder}/${uid}/avatar_${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    await setUserDoc(uid, { avatar: url }, { merge: true });

    if (oldUrl && oldUrl.includes("firebasestorage.googleapis.com")) {
      try {
        const parts = oldUrl.split("/o/");
        if (parts.length > 1) {
          const pathAndQuery = parts[1];
          const encodedPath = pathAndQuery.split("?")[0];
          const storagePath = decodeURIComponent(encodedPath);
          const oldRef = ref(storage, storagePath);
          await deleteObject(oldRef);
        }
      } catch (delErr) {
        console.warn("Failed to delete old avatar from storage:", delErr);
      }
    }

    return { success: true, url };
  } catch (err) {
    console.error("Error in uploadUserAvatar:", err);
    return { success: false, error: err.message || err };
  }
};

export const findUserByUsername = async (username) => {
  try {
    if (!username) return null;
    const q = query(collection(db, "users"), where("username", "==", username));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docRef = snap.docs[0];
    return { id: docRef.id, ...docRef.data() };
  } catch (err) {
    console.error("Error finding user by username:", err);
    return null;
  }
};

export const listAllUsers = async (role = null) => {
  try {
    let snap;
    if (role) {
      const q = query(collection(db, "users"), where("role", "==", role));
      snap = await getDocs(q);
    } else {
      snap = await getDocs(collection(db, "users"));
    }

    const enriched = await Promise.all(
      snap.docs.map(async (s) => {
        const u = { id: s.id, ...s.data() };
        const res = await calculateTutorRating(u.id);
        if (res && res.success) {
          return { ...u, rating: res.average ?? 0 };
        }
        return { ...u };
      })
    );

    return enriched;
  } catch (err) {
    console.error("Error listing users:", err);
    return [];
  }
};

// Payment functions
export const createPaymentRecord = async (assignmentId, paymentData) => {
  try {
    const paymentsRef = collection(db, "payments");

    const paymentDoc = {
      assignmentId,
      tutorId: paymentData.tutorId,
      tutorName: paymentData.tutorName,
      parentId: paymentData.parentId,
      parentName: paymentData.parentName,
      amount: paymentData.amount,
      assignmentTitle: paymentData.assignmentTitle,
      tutorRate: paymentData.tutorRate,
      status: "pending",
      paymentType: paymentData.paymentType || "full",
      totalMonths: paymentData.totalMonths || 1,
      monthNumber: paymentData.monthNumber || 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(paymentsRef, paymentDoc);
    return docRef.id;
  } catch (error) {
    console.error("Error creating payment record:", error);
    throw error;
  }
};

export const completePayment = async (assignmentId, sessionId) => {
  try {
    const paymentsRef = collection(db, "payments");
    const q = query(
      paymentsRef,
      where("assignmentId", "==", assignmentId),
      where("stripeSessionId", "==", sessionId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const paymentDoc = querySnapshot.docs[0];

      await updateDoc(doc(db, "payments", paymentDoc.id), {
        status: "completed",
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Payment completed successfully");
    }
  } catch (error) {
    console.error("Error completing payment:", error);
    throw error;
  }
};

// Get payment summary for an assignment
export const getPaymentSummary = async (assignmentId) => {
  try {
    const paymentsRef = collection(db, "payments");
    const q = query(
      paymentsRef,
      where("assignmentId", "==", assignmentId),
      where("status", "==", "completed")
    );
    const querySnapshot = await getDocs(q);

    const payments = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (payments.length === 0) {
      return {
        payments: [],
        totalMonths: 0,
        monthsPaid: 0,
        lastPayment: null,
        isComplete: false,
      };
    }

    // Sort by month number
    payments.sort((a, b) => a.monthNumber - b.monthNumber);

    const totalMonths = payments[0]?.totalMonths || 0;
    const lastPayment = payments[payments.length - 1];

    // For full payment, monthsPaid should be totalMonths
    let monthsPaid;
    if (payments[0]?.paymentType === "full") {
      monthsPaid = totalMonths;
    } else {
      monthsPaid = payments.length;
    }

    return {
      payments,
      totalMonths,
      monthsPaid,
      lastPayment,
      isComplete: monthsPaid >= totalMonths,
    };
  } catch (error) {
    console.error("Error getting payment summary:", error);
    throw error;
  }
};

export const submitFeedback = async (assignmentId, rating, comment) => {
  try {
    if (!assignmentId) return { success: false, error: "Missing assignmentId" };

    const assignmentRef = doc(db, "assignments", assignmentId);
    const assignmentSnap = await getDoc(assignmentRef);
    const createdAt = new Date().toISOString();
    const reviewerId = auth && auth.currentUser ? auth.currentUser.uid : null;
    const assignmentPayload = {
      rating: rating,
      comment: comment,
      createdAt,
    };

    if (assignmentSnap.exists()) {
      await updateDoc(assignmentRef, {
        review: arrayUnion(assignmentPayload),
        updatedAt: createdAt,
      });
      return { success: true };
    }

    return { success: false, error: "Assignment not found" };
  } catch (assignmentErr) {
    console.warn(
      "Failed to append review to assignment document:",
      assignmentErr
    );
    return { success: false, error: assignmentErr.message || assignmentErr };
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
