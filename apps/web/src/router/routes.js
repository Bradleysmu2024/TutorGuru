import { createRouter, createWebHistory } from "vue-router"
import Home from "../views/Home.vue"
import TutorDashboard from "../views/TutorDashboard.vue"
import TutorProfile from "../views/TutorProfile.vue"
import Login from "../views/Login.vue"
import Register from "../views/Register.vue"

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
  },
  {
    path: "/profile",
    name: "TutorProfile",
    component: TutorProfile,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
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

export default router
