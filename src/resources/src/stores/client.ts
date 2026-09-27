import axios from "axios";
import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { socket } from "../plugins/socket";

type City = { id: number; name: string };
type Owner = { id: number; name: string; email: string };
type Client = {
	id: number;
	name: string;
	email: string;
	phone: string;
	cityId: number;
	createdBy: number;
	image: string | null;
	createdAt?: string;
	updatedAt?: string;
	city?: City | null;
	owner?: Owner | null;
};
type Pagination<T> = {
	current_page: number;
	last_page: number;
	per_page: number;
	total: number;
	from: number | null;
	to: number | null;
	path: string;
	first_page_url: string | null;
	last_page_url: string | null;
	next_page_url: string | null;
	prev_page_url: string | null;
	links: Array<{
		url: string | null;
		label: string;
		page: number | null;
		active: boolean;
	}>;
	data: T[];
};
type ApiResponse<T> = { message: string; data?: T };
type FieldErrors = Record<string, string[]>;
type EventMessage = {
	type: "success" | "info" | "warning";
	text: string;
};
type Meta = {
	current_page: number;
	last_page: number;
	per_page: number;
	total: number;
	from: number | null;
	to: number | null;
};

async function request<T>(
	method: "GET" | "POST" | "PUT" | "DELETE",
	path: string,
	payload?: unknown,
): Promise<ApiResponse<T>> {
	try {
		const response = await axios.request<ApiResponse<T>>({
			method,
			url: `/api/client${path}`,
			data: payload,
		});

		return response.data;
	} catch (error: unknown) {
		if (axios.isAxiosError(error)) {
			const data = error.response?.data as {
				message?: string;
				errors?: { fieldErrors?: FieldErrors };
			};
			const err = new Error(
				String(data?.message || error.message || "Request failed"),
			) as Error & {
				errors?: FieldErrors;
			};
			err.errors = data?.errors?.fieldErrors;
			throw err;
		}
		throw new Error("Request failed");
	}
}

let socketWired = false;

export const useClientStore = defineStore("client", () => {
	const clients = ref<Client[]>([]);
	const cities = ref<City[]>([]);
	const meta = reactive<Meta>({
		current_page: 1,
		last_page: 1,
		per_page: 15,
		total: 0,
		from: null,
		to: null,
	});
	const loading = ref(false);
	const saving = ref(false);
	const deletingId = ref<number | null>(null);
	const search = ref("");
	const cityFilter = ref<number | "">("");
	const page = ref(1);
	const event = ref<EventMessage | null>(null);

	const notify = (type: EventMessage["type"], text: string) => {
		event.value = { type, text };
		setTimeout(() => {
			event.value = null;
		}, 4000);
	};

	const fetchCities = async () => {
		try {
			const data = await request<City[]>("GET", "/cities");
			cities.value = data?.data || [];
		} catch (error) {
			notify(
				"warning",
				error instanceof Error ? error.message : "Request failed",
			);
		}
	};

	const fetchClients = async () => {
		loading.value = true;
		try {
			const query = new URLSearchParams();
			query.set("page", String(page.value));
			if (search.value.trim()) query.set("search", search.value.trim());
			if (cityFilter.value) query.set("city_id", String(cityFilter.value));

			const data = await request<Pagination<Client>>("GET", `/?${query}`);
			const paginated = data?.data;
			clients.value = paginated?.data || [];
			if (paginated) {
				meta.current_page = paginated.current_page;
				meta.last_page = paginated.last_page;
				meta.per_page = paginated.per_page;
				meta.total = paginated.total;
				meta.from = paginated.from;
				meta.to = paginated.to;
			}
		} catch (error) {
			notify(
				"warning",
				error instanceof Error ? error.message : "Request failed",
			);
		} finally {
			loading.value = false;
		}
	};

	const applySearch = () => {
		page.value = 1;
		fetchClients();
	};

	const applyCityFilter = () => {
		page.value = 1;
		fetchClients();
	};

	const resetFilters = () => {
		search.value = "";
		cityFilter.value = "";
		page.value = 1;
		fetchClients();
	};

	const setPage = (next: number) => {
		if (next < 1 || next > meta.last_page || next === meta.current_page) return;
		page.value = next;
		fetchClients();
	};

	const saveClient = async (payload: FormData, id?: number) => {
		saving.value = true;
		try {
			if (id) {
				await request<Client>("PUT", `/${id}`, payload);
				notify("success", "client updated successfully");
			} else {
				await request<Client>("POST", "/", payload);
				notify("success", "client created successfully");
			}
			await fetchClients();
		} finally {
			saving.value = false;
		}
	};

	const removeClient = async (id: number) => {
		deletingId.value = id;
		try {
			await request<{ id: number }>("DELETE", `/${id}`);
			notify("success", "client deleted successfully");
			await fetchClients();
		} finally {
			deletingId.value = null;
		}
	};

	const wireSocket = () => {
		if (socketWired) return;
		socketWired = true;

		socket.on("client:created", () => {
			notify("info", "A new client was added");
			fetchClients();
		});
		socket.on("client:updated", () => {
			notify("info", "A client was updated");
			fetchClients();
		});
		socket.on("client:deleted", () => {
			notify("info", "A client was removed");
			fetchClients();
		});
		socket.on("client:processed", (data: { action?: string }) => {
			notify("info", `Client ${data?.action || "event"} processed by queue`);
		});
	};

	wireSocket();

	return {
		clients,
		cities,
		meta,
		loading,
		saving,
		deletingId,
		search,
		cityFilter,
		page,
		event,
		fetchCities,
		fetchClients,
		applySearch,
		applyCityFilter,
		resetFilters,
		setPage,
		saveClient,
		removeClient,
		notify,
	};
});
