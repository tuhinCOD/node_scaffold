<template>
  <nav class="navbar navbar-expand-lg navbar-light navbar-laravel">
    <div class="container">
      <a class="navbar-brand" href="#">Verification Account</a>
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
            <div class="card-header">Verification Account</div>
            <div class="card-body">
              <form id="varifyForm" @submit.prevent="_submitForm">
                <div class="form-group row">
                  <input type="hidden" name="email" v-model="email" />
                  <label for="email_address" class="col-md-4 col-form-label text-md-right"
                    >OTP Code</label
                  >
                  <div class="col-md-6">
                    <input
                      type="text"
                      v-model="otp"
                      id="otp"
                      class="form-control"
                      name="otp"
                      required
                      autofocus
                    />
                    <small class="text-danger">{{ errors.token?.[0] }}</small>
                  </div>
                </div>
                <div class="col-md-6 offset-md-4 mt-3">
                  <button
                    class="btn btn-primary"
                    type="submit"
                    name="verify"
                    :disabled="auth.processing"
                  >
                    {{ auth.processing ? 'Verifying...' : 'Verify' }}
                  </button>
                </div>
                <div id="ajaxError" style="color: red; margin-top: 10px">{{ message }}</div>
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

defineOptions({ name: "VerificationView" });

const auth = useAuthStore();
const router = useRouter();
const otp = ref("");
const email = ref(localStorage.getItem("signup_email") || "");
const message = ref("");
const errors = ref({});

const _submitForm = async () => {
	message.value = "";
	errors.value = {};
	try {
		message.value = await auth.verifyEmail({
			email: email.value,
			token: otp.value,
		});
		router.push("/login");
	} catch (error) {
		message.value = error.message;
		errors.value = error.errors || {};
	}
};
</script>

<style lang="scss" scoped></style>
