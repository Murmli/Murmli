/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from "vue-router/auto";
import { setupLayouts } from "virtual:generated-layouts";
import { routes } from "vue-router/auto-routes";
import { useUserStore } from '@/stores/userStore';

let startupRedirectDone = false;


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
});

// Global navigation guard to redirect from "/" to the saved start page,
// only if the saved start page is not "/" (to avoid an infinite redirect loop).
router.beforeEach((to, from, next) => {
  if (!startupRedirectDone && to.path === "/") {
    const userStore = useUserStore();
    const savedStartpage = userStore.getStartpage();
    if (savedStartpage !== "/") {
      startupRedirectDone = true;
      next(savedStartpage);
      return;
    }
  }
  next();
});


// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.("Failed to fetch dynamically imported module")) {
    if (!localStorage.getItem("vuetify:dynamic-reload")) {
      localStorage.setItem("vuetify:dynamic-reload", "true");
      location.assign(to.fullPath);
    } else {
      console.error("Dynamic import error, reloading page did not fix it", err);
    }
  } else {
    console.error(err);
  }
});

router.isReady().then(() => {
  localStorage.removeItem("vuetify:dynamic-reload");
});

export default router;
