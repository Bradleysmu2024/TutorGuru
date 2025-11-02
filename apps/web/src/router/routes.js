import { createRouter, createWebHistory } from "vue-router"
import Home from "../views/Home.vue"
import TutorDashboard from "../views/TutorDashboard.vue"
import EditProfile from "../views/EditProfile.vue"
import TopTutors from "../views/TopTutors.vue"
import ParentDashboard from "../views/ParentDashboard.vue"
import ParentProfile from "../views/ParentProfile.vue"
import PostAssignment from "../views/PostAssignment.vue"
import AssignmentDetail from "../views/AssignmentDetail.vue"
import Login from "../views/Login.vue"
import Register from "../views/Register.vue"
import Calendar from "../views/Calendar.vue"
import Logout from "../views/Logout.vue"
import TutorMap from "../views/TutorMap.vue"
import Profile from "../views/Profile.vue"
import { getCurrentUser } from '../services/firebase'
import PaymentSuccess from '../views/PaymentSuccess.vue'
import { getUserRole } from '../services/firebase'
import Message from "../views/Message.vue"
import Admin from "../views/Admin.vue"

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
    meta: { requiresAuth: true, allowedRoles: ['tutor'] },
  },
  {
    path: "/parent-dashboard",
    name: "ParentDashboard",
    component: ParentDashboard,
    meta: { requiresAuth: true, allowedRoles: ['parent'] },
  },
  {
    path: "/parent-profile",
    name: "ParentProfile",
    component: ParentProfile,
    meta: { requiresAuth: true, allowedRoles: ['parent'] },
  },
  {
    path: "/post-assignment",
    name: "PostAssignment",
    component: PostAssignment,
    meta: { requiresAuth: true, allowedRoles: ['parent'] },
  },
  {
    path: "/assignment/:id",
    name: "AssignmentDetail",
    component: AssignmentDetail,
    meta: { requiresAuth: true },
  },
  {
    path: "/editprofile",
    name: "EditProfile",
    component: EditProfile,
    meta: { requiresAuth: true },
  },
  {
    path: "/tutor/:username",
    name: "PublicTutorProfile",
    component: Profile,
    meta: { requiresAuth: true},
  },
  {
    path: "/tutor-maps",
    name: "TutorMaps",
    component: TutorMap,
    meta: { requiresAuth: true, allowedRoles: ['tutor'] },

  },
  {
    path: "/top-tutors",
    name: "TopTutors",
    component: TopTutors,
    meta: { requiresAuth: true},
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
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: "/payment-success",
    name: "PaymentSuccess",
    component: PaymentSuccess,
    meta: { requiresAuth: true, allowedRoles: ['parent'] },
  },
  {
    path: "/chat",
    name: "Chat",
    component: Message,
    meta: { requiresAuth: true },
  },
  {
    path: "/admin",
    name: "Admin",
    component: Admin,
    meta: { requiresAuth: true, allowedRoles: ['admin'] },
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


router.beforeEach(async (to, from, next) => {
  // Check if the route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const user = await getCurrentUser();
    if (!user) {
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }

    // If route has role restrictions, verify them
    const allowedRoles = to.meta && to.meta.allowedRoles ? to.meta.allowedRoles : null
    if (allowedRoles && allowedRoles.length > 0) {
      const role = await getUserRole(user.uid)
      console.log('Route requires role in', allowedRoles, 'user role=', role)
      if (role === 'admin') {
        return next()
      }
      if (!role || !allowedRoles.includes(role)) {
        return next({ path: '/' })
      }
    }

    return next()
  }

  return next()
})

// Add global navigation guard
router.beforeEach((to, from, next) => {
  // Prevent navigation to assignment detail with undefined ID
  if (to.name === 'AssignmentDetail') {
    if (!to.params.id || to.params.id === 'undefined') {
      console.error('❌ Blocked navigation to assignment with undefined ID')
      console.log('From:', from.path)
      next('/parent-dashboard')
      return
    }
  }
  
  next()
})

export default router
