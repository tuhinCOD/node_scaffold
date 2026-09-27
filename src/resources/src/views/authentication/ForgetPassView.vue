<template>
  <nav class="navbar navbar-expand-lg navbar-light navbar-laravel">
    <div class="container">
      <a class="navbar-brand" href="#">Password Forget Form</a>
    </div>
  </nav>

  <main class="login-form">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">Reset Your Password</div>
            <div class="card-body">
              <form id="newForgetForm" @submit.prevent="_submitForm">
                <div class="form-group row">
                  <input type="hidden" name="email" v-model="email" />
                  <label
                    for="password"
                    class="col-md-4 col-form-label text-md-right"
                    >New Password</label
                  >
                  <div class="col-md-6">
                    <input
                      type="password"
                      v-model="password"
                      id="password"
                      class="form-control"
                      name="password"
                      placeholder="New Password"
                      required
                      autofocus
                    />
                    <small class="text-danger">{{ errors.password?.[0] }}</small>
                  </div>

                  <label
                    for="password_confirmation"
                    class="col-md-4 col-form-label text-md-right mt-3"
                    >Re-type Password</label
                  >
                  <div class="col-md-6">
                    <input
                      type="password"
                      v-model="password_confirmation"
                      id="password_confirmation"
                      class="form-control mt-3"
                      name="password_confirmation"
                      placeholder="Confirm Password"
                      required
                      autofocus
                    />
                    <small class="text-danger">{{ errors.password_confirmation?.[0] }}</small>
                  </div>
                </div>

                <div class="col-md-6 offset-md-4 mt-3">
                  <button
                    type="submit"
                    id="resetBtn"
                    class="btn btn-primary"
                    :disabled="auth.processing"
                  >
                    {{ auth.processing ? 'Processing...' : 'Reset' }}
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
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

defineOptions({ name: "ForgetPassView" });

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const email = ref(route.query.email || "");
const password = ref("");
const password_confirmation = ref("");
const message = ref("");
const errors = ref({});

const _submitForm = async () => {
	message.value = "";
	errors.value = {};
	try {
		message.value = await auth.resetPasswordByToken({
			email: email.value,
			token: route.query.token || "",
			password: password.value,
			password_confirmation: password_confirmation.value,
		});

		setTimeout(() => {
			router.push({ path: "/login" });
		}, 1500);
	} catch (error) {
		message.value = error.message;
		errors.value = error.errors || {};
	}
};
</script>

<style lang="scss" scoped></style>
