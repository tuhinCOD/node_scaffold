import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			component: () => import("../layouts/AuthLayout.vue"),
			children: [
				{
					path: "",
					redirect: "/login",
				},
				{
					path: "login",
					name: "login",
					component: () => import("../views/authentication/LoginView.vue"),
				},
				{
					path: "resetpass",
					name: "resetpass",
					component: () => import("../views/authentication/ResetPassView.vue"),
					meta: { requiresAuth: true },
				},
				{
					path: "forget",
					name: "forget",
					component: () => import("../views/authentication/ForgetView.vue"),
				},
				{
					path: "forgetotp",
					name: "forgetotp",
					component: () => import("../views/authentication/ForgetOtp.vue"),
				},
				{
					path: "signup",
					name: "signup",
					component: () => import("../views/authentication/SignupView.vue"),
				},
				{
					path: "reset-password",
					name: "reset-password",
					component: () => import("../views/authentication/ForgetPassView.vue"),
				},
				{
					path: "verification",
					name: "verification",
					component: () =>
						import("../views/authentication/VerificationView.vue"),
				},
			],
		},
		{
			path: "/dashlayout",
			component: () => import("../layouts/dashlayout/DashboardLayoutView.vue"),
			meta: { requiresAuth: true },
			children: [
				{
					path: "/dashboard",
					name: "dashboard",
					component: () => import("../views/dashboard/DashboardView.vue"),
					meta: { requiresAuth: true },
				},
				{
					path: "/clients",
					name: "clients",
					component: () => import("../views/client/ClientView.vue"),
					meta: { requiresAuth: true },
				},
				// 		{
				// 			path: '/users',
				// 			name: 'users',
				// 			component: () => import('../views/users/index.vue'),
				// 			meta: { requiresAuth: true, requiresAdmin: true },
				// 		},
				// 		{
				// 			path: '/all_user',
				// 			name: 'all_user',
				// 			component: () => import('../views/allUser/index.vue'),
				// 			meta: { requiresAuth: true },
				// 		},
			],
		},
		// {
		// 	path: '/client',
		// 	name: 'client',
		// 	component: () => import('../views/client/index.vue'),
		// 	meta: { requiresAuth: true },
		// },
		{
			path: "/:catchAll(.*)",
			name: "404-page",
			component: () => import("../views/404-page/NotFoundView.vue"),
		},
	],
});

router.beforeEach(async (to, _from) => {
	const auth = useAuthStore();

	if (to.meta.requiresAuth && !auth.isAuthenticated) {
		await auth.bootstrap();
		if (!auth.isAuthenticated) {
			return { path: "/login" };
		}
	}

	if (to.meta.guest && auth.isAuthenticated) {
		return { path: "/dashboard" };
	}

	if (to.meta.requiresAdmin && !auth.user?.isAdmin) {
		return { path: "/dashboard" };
	}

	return true;
});

export default router;
