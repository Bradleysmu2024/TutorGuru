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
    path: "/parent-dashboard",
    name: "ParentDashboard",
    component: ParentDashboard,
  },
  {
    path: "/parent-profile",
    name: "ParentProfile",
    component: ParentProfile,
  },
  {
    path: "/post-assignment",
    name: "PostAssignment",
    component: PostAssignment,
  },
  {
    path: "/assignment/:id",
    name: "AssignmentDetail",
    component: AssignmentDetail,
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
  {
    path: "/calendar",
    name: "Calendar",
    component: Calendar,
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
