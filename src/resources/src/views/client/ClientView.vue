<template>
  <div class="container-fluid py-4">
    <div
      v-if="store.event"
      :class="[
        'alert',
        'alert-dismissible',
        'fade',
        'show',
        'shadow-sm',
        store.event.type === 'warning'
          ? 'alert-danger'
          : store.event.type === 'success'
            ? 'alert-success'
            : 'alert-info',
      ]"
      role="alert"
    >
      <i
        :class="`bi ${store.event.type === 'warning' ? 'bi-exclamation-triangle-fill' : store.event.type === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle-fill'} me-2`"
      ></i>
      {{ store.event.text }}
      <button type="button" class="btn-close shadow-none" @click="store.event = null"></button>
    </div>

    <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
      <div>
        <h4 class="m-0">Clients</h4>
        <small class="text-muted">Manage your client records with realtime updates</small>
      </div>
      <button class="btn btn-primary shadow-none" @click="_openCreate">
        <i class="bi bi-plus-lg me-1"></i> Add New Client
      </button>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body">
        <div class="row g-2 mb-3">
          <div class="col-md-5">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input
                v-model="store.search"
                type="text"
                class="form-control shadow-none"
                placeholder="Search by name, email or phone"
                @keyup.enter="store.applySearch()"
              />
            </div>
          </div>
          <div class="col-md-3">
            <select v-model="store.cityFilter" class="form-select shadow-none" @change="store.applyCityFilter()">
              <option value="">All cities</option>
              <option v-for="city in store.cities" :key="city.id" :value="city.id">
                {{ city.name }}
              </option>
            </select>
          </div>
          <div class="col-md-auto d-flex align-items-center gap-2">
            <button class="btn btn-outline-secondary shadow-none btn-sm" @click="store.applySearch()">Search</button>
            <button class="btn btn-link shadow-none text-decoration-none p-0" @click="store.resetFilters()">Reset</button>
          </div>
        </div>

        <div v-if="store.loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="text-center">#</th>
                <th>Image</th>
                <th>Name</th>
                <th>Phone</th>
                <th>City</th>
                <th>Created By</th>
                <th>Created At</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(client, index) in store.clients" :key="client.id">
                <td class="text-center text-muted">{{ _fromRow + index }}</td>
                <td>
                  <img
                    v-if="client.image"
                    :src="client.image"
                    alt="client"
                    class="rounded object-fit-cover"
                    width="42"
                    height="42"
                  />
                  <div
                    v-else
                    class="bg-secondary-subtle rounded d-flex align-items-center justify-content-center"
                    style="width: 42px; height: 42px"
                  >
                    <i class="bi bi-person text-secondary"></i>
                  </div>
                </td>
                <td>
                  <div class="fw-semibold">{{ client.name }}</div>
                  <small class="text-muted">{{ client.email }}</small>
                </td>
                <td>{{ client.phone }}</td>
                <td>{{ client.city?.name || "-" }}</td>
                <td>{{ client.owner?.name || "-" }}</td>
                <td>{{ _formatDate(client.createdAt) }}</td>
                <td class="text-end text-nowrap">
                  <button
                    class="btn btn-sm btn-outline-primary shadow-none me-1"
                    title="Edit"
                    @click="_openEdit(client)"
                  >
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger shadow-none"
                    title="Delete"
                    :disabled="store.deletingId === client.id"
                    @click="_confirmDelete(client)"
                  >
                    <i v-if="store.deletingId === client.id" class="bi bi-hourglass-split"></i>
                    <i v-else class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="!store.clients.length">
                <td colspan="8" class="text-center text-muted py-5">No clients found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-flex flex-wrap justify-content-between align-items-center mt-3 gap-2">
          <small class="text-muted">
            Showing {{ store.meta.from || 0 }} to {{ store.meta.to || 0 }} of {{ store.meta.total }} clients
          </small>
          <nav v-if="store.meta.last_page > 1">
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: store.meta.current_page === 1 }">
                <button
                  class="page-link shadow-none"
                  @click="store.setPage(store.meta.current_page - 1)"
                >
                  &laquo;
                </button>
              </li>
              <li
                v-for="p in _visiblePages"
                :key="p"
                class="page-item"
                :class="{ active: p === store.meta.current_page }"
              >
                <button class="page-link shadow-none" @click="store.setPage(p)">
                  {{ p }}
                </button>
              </li>
              <li class="page-item" :class="{ disabled: store.meta.current_page === store.meta.last_page }">
                <button
                  class="page-link shadow-none"
                  @click="store.setPage(store.meta.current_page + 1)"
                >
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="modal fade show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title m-0">{{ editingId ? "Edit Client" : "Add New Client" }}</h5>
            <button type="button" class="btn-close btn-close-white shadow-none" @click="closeForm"></button>
          </div>
          <form @submit.prevent="_submit">
            <div class="modal-body">
              <div class="text-center mb-3">
                <img
                  :src="preview"
                  alt="preview"
                  class="rounded object-fit-cover border"
                  width="96"
                  height="96"
                  v-if="preview"
                />
                <div
                  v-else
                  class="bg-secondary-subtle rounded border d-flex align-items-center justify-content-center mx-auto"
                  style="width: 96px; height: 96px"
                >
                  <i class="bi bi-person text-secondary fs-1"></i>
                </div>
                <input
                  id="clientImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="form-control form-control-sm mt-2 mx-auto shadow-none"
                  style="max-width: 260px"
                  @change="_onImageChange"
                />
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Name <span class="text-danger">*</span></label>
                  <input v-model="formName" type="text" class="form-control shadow-none" placeholder="Client name" />
                  <div class="error text-danger small">{{ formErrors.name?.[0] || "" }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email <span class="text-danger">*</span></label>
                  <input v-model="formEmail" type="email" class="form-control shadow-none" placeholder="client@example.com" />
                  <div class="error text-danger small">{{ formErrors.email?.[0] || "" }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone <span class="text-danger">*</span></label>
                  <input v-model="formPhone" type="tel" class="form-control shadow-none" placeholder="01700000000" />
                  <div class="error text-danger small">{{ formErrors.phone?.[0] || "" }}</div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">City <span class="text-danger">*</span></label>
                  <select v-model="formCityId" class="form-select shadow-none">
                    <option value="">Select city</option>
                    <option v-for="city in store.cities" :key="city.id" :value="city.id">
                      {{ city.name }}
                    </option>
                  </select>
                  <div class="error text-danger small">{{ formErrors.city_id?.[0] || "" }}</div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary shadow-none" @click="closeForm">Cancel</button>
              <button type="submit" class="btn btn-primary shadow-none" :disabled="store.saving">
                <span
                  v-if="store.saving"
                  class="spinner-border spinner-border-sm me-1"
                  role="status"
                ></span>
                {{ store.saving ? "Saving..." : editingId ? "Update Client" : "Create Client" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div v-if="showForm" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useClientStore } from "@/stores/client";

defineOptions({ name: "ClientView" });

const store = useClientStore();

const showForm = ref(false);
const editingId = ref(null);
const formName = ref("");
const formEmail = ref("");
const formPhone = ref("");
const formCityId = ref("");
const imageFile = ref(null);
const preview = ref(null);
const formErrors = ref({});

const _fromRow = computed(
	() => (store.meta.current_page - 1) * store.meta.per_page + 1,
);

const _visiblePages = computed(() => {
	const total = store.meta.last_page;
	const current = store.meta.current_page;
	const start = Math.max(1, current - 2);
	const end = Math.min(total, start + 4);
	const pages = [];
	for (let p = start; p <= end; p++) pages.push(p);
	return pages;
});

const _formatDate = (value) =>
	value ? new Date(value).toLocaleDateString() : "-";

onMounted(() => {
	store.fetchCities();
	store.fetchClients();
});

const resetForm = () => {
	editingId.value = null;
	formName.value = "";
	formEmail.value = "";
	formPhone.value = "";
	formCityId.value = "";
	imageFile.value = null;
	preview.value = null;
	formErrors.value = {};
};

const _openCreate = () => {
	resetForm();
	showForm.value = true;
};

const _openEdit = (client) => {
	editingId.value = client.id;
	formName.value = client.name;
	formEmail.value = client.email;
	formPhone.value = client.phone;
	formCityId.value = client.cityId;
	imageFile.value = null;
	preview.value = client.image;
	formErrors.value = {};
	showForm.value = true;
};

const closeForm = () => {
	showForm.value = false;
	resetForm();
};

const _onImageChange = (event) => {
	const file = event.target.files?.[0];
	imageFile.value = file || null;
	if (file) {
		preview.value = URL.createObjectURL(file);
	}
};

const _submit = async () => {
	formErrors.value = {};
	const payload = new FormData();
	payload.append("name", formName.value.trim());
	payload.append("email", formEmail.value.trim());
	payload.append("phone", formPhone.value.trim());
	payload.append("city_id", String(formCityId.value));
	if (imageFile.value) {
		payload.append("image", imageFile.value);
	}
	try {
		await store.saveClient(payload, editingId.value);
		closeForm();
	} catch (error) {
		formErrors.value = error.errors || {};
	}
};

const _confirmDelete = async (client) => {
	if (!window.confirm(`Are you sure you want to delete "${client.name}"?`))
		return;
	try {
		await store.removeClient(client.id);
	} catch (error) {
		store.notify("warning", error.message);
	}
};
</script>

<style lang="scss" scoped>
.error {
	min-height: 1rem;
}
.alert {
	z-index: 1080;
}
</style>