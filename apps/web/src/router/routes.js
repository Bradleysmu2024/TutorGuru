import { createRouter, createWebHistory } from "vue-router"
import Home from "../views/Home.vue"
import TutorDashboard from "../views/TutorDashboard.vue"
import TutorProfile from "../views/TutorProfile.vue"
import ParentDashboard from "../views/ParentDashboard.vue"
import ParentProfile from "../views/ParentProfile.vue"
import PostAssignment from "../views/PostAssignment.vue"
import AssignmentDetail from "../views/AssignmentDetail.vue"
import Login from "../views/Login.vue"
import Register from "../views/Register.vue"
import Calendar from "../views/Calendar.vue"
import Logout from "../views/Logout.vue"
import { ref } from "vue"
import { getAuth, onAuthStateChanged } from "firebase/auth"

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/dashboard",
    name: "TutorDashboard",
    component: TutorDashboard,
    meta: { requiresAuth: true },
  },
  {
    path: "/parent-dashboard",
    name: "ParentDashboard",
    component: ParentDashboard,
    meta: { requiresAuth: true },
  },
  {
    path: "/parent-profile",
    name: "ParentProfile",
    component: ParentProfile,
    meta: { requiresAuth: true },
  },
  {
    path: "/post-assignment",
    name: "PostAssignment",
    component: PostAssignment,
    meta: { requiresAuth: true },
  },
  {
    path: "/assignment/:id",
    name: "AssignmentDetail",
    component: AssignmentDetail,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "TutorProfile",
    component: TutorProfile,
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/logout",
    name: "Logout",
    component: Logout,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
  },
  {
    path: "/calendar",
    name: "Calendar",
    component: Calendar,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

//check if there is user session
export const LoginStatus = ref(false);
export const checkLoginStatus = () => {
  if(localStorage.getItem('user') == null) return false
  return true
}

export const getCurrentUser = async () => {
  try{
    return new Promise((resolve, reject) => {
      // Use the observer to get the current user and then unsubscribe immediately
      const removeListener = onAuthStateChanged(
        getAuth(),
        (user) => {
          removeListener(); // Clean up the observer
          resolve(user);
        },
        reject
      );
    });
  } catch (error){
    console.error("Error getting currentUser:", error)
    return false;
  }
};

// Navigation guard (check if login)
router.beforeEach(async (to, from, next) => {
  // Check if the route requires authentication
  LoginStatus.value = checkLoginStatus();
  console.log(LoginStatus)
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const user = await getCurrentUser();
    console.log(user);
    if (user) {
      next();
    } else {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    }
  } else {
    next();
  }
});

export default router
