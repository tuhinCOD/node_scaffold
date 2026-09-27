<template>
  <nav class="navbar navbar-expand-lg navbar-light navbar-laravel">
    <div class="container">
      <a class="navbar-brand" href="#">Password Reset Form</a>
    </div>
  </nav>

  <main class="login-form">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">Reset Your Password</div>
            <div class="card-body">
              <form id="resetForm" @submit.prevent="_handleReset">
                <div class="form-group row">
                  <label for="current_password" class="col-md-4 col-form-label text-md-right"
                    >Old Password</label
                  >
                  <div class="col-md-6">
                    <input
                      type="password"
                      v-model="current_password"
                      id="current_password"
                      class="form-control"
                      name="current_password"
                      placeholder="Current Password"
                    />
                    <small class="text-danger">{{ errors.current_password?.[0] }}</small>
                  </div>

                  <label for="new_password" class="col-md-4 col-form-label text-md-right mt-4"
                    >New Password</label
                  >
                  <div class="col-md-6">
                    <input
                      type="password"
                      v-model="new_password"
                      id="new_password"
                      class="form-control mt-4"
                      name="new_password"
                      placeholder="New Password"
                    />
                    <small class="text-danger">{{ errors.password?.[0] }}</small>
                  </div>

                  <label for="pass" class="col-md-4 col-form-label text-md-right mt-4"
                    >Re-type Password</label
                  >
                  <div class="col-md-6">
                    <input
                      type="password"
                      v-model="new_password_confirmation"
                      class="form-control mt-4"
                      id="pass"
                      name="new_password_confirmation"
                      placeholder="Confirm Password"
                    />
                    <small class="text-danger">{{ errors.password_confirmation?.[0] }}</small>
                  </div>
                </div>
                <div class="col-md-6 offset-md-4 mt-2">
                  <button type="submit" class="btn btn-primary" :disabled="auth.processing">
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
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

defineOptions({ name: "ResetPassView" });

const auth = useAuthStore();
const _router = useRouter();

const current_password = ref("");
const new_password = ref("");
const new_password_confirmation = ref("");
const message = ref("");
const errors = ref({});

const _handleReset = async () => {
	console.log("🔥 FORM VALUES:", {
		current_password: current_password.value,
		new_password: new_password.value,
		new_password_confirmation: new_password_confirmation.value,
	});

	message.value = "";
	errors.value = {};

	try {
		const result = await auth.resetPassword({
			current_password: current_password.value,
			password: new_password.value,
			password_confirmation: new_password_confirmation.value,
		});

		message.value = result;

		if (result) {
			_router.push({ path: "/login" });
		}
	} catch (error) {
		message.value = error.message;
		errors.value = error.errors || {};
	}
};
</script>

<style lang="scss" scoped></style>
