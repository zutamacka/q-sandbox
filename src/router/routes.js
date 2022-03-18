const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("src/pages/Search.vue") },
      { path: "/upload", component: () => import("src/pages/FileAdmin.vue") },
      { path: "/delete", component: () => import("src/pages/DeletePost.vue") },
      { path: "/delete-firestore", component: () => import("src/pages/DeletePost.vue") },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/Error404.vue"),
  },
];
// 
export default routes;
