<template>
  <nav class="navbar navbar-expand-lg navbar-light navbar-laravel">
    <div class="container">
      <a class="navbar-brand" href="#">User Password Recover</a>
      <button
        class="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
    </div>
  </nav>

  <main class="login-form">
    <div class="cotainer">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">Password Recover</div>
            <div class="card-body">
              <form id="forgetForm" @submit.prevent="_submitForm">
                <div class="form-group row">
                  <label for="email_address" class="col-md-4 col-form-label text-md-right"
                    >E-Mail Address</label
                  >
                  <div class="col-md-6">
                    <input
                      type="text"
                      v-model="email"
                      id="email_address"
                      class="form-control"
                      name="email"
                      required
                    />
                    <small class="error text-danger">{{ errors.email?.[0] }}</small>
                    <p class="mt-2">
                      I have an account <router-link to="/login"><b>click here</b></router-link>
                    </p>
                  </div>
                </div>

                <div class="col-md-6 offset-md-4">
                  <button type="submit" class="btn btn-primary" :disabled="auth.processing">
                    {{ auth.processing ? 'Processing...' : 'Recover' }}
                  </button>
                </div>
                <div id="ajaxError" class="mt-2 text-danger">{{ message }}</div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

defineOptions({ name: "ForgetView" });

const auth = useAuthStore();
const _router = useRouter();
const email = ref("");
const message = ref("");
const errors = ref({});

const _submitForm = async () => {
	message.value = "";
	errors.value = {};
	try {
		await auth.forgotPassword({ email: email.value });
		_router.push({ path: "/forgetotp", query: { email: email.value } });
	} catch (error) {
		message.value = error.message;
		errors.value = error.errors || {};
	}
};
</script>

<style lang="scss" scoped></style>
