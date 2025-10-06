import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, query, where, orderBy, addDoc } from "firebase/firestore"
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

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

export { db, auth, storage }
