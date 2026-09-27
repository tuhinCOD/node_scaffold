<template>
  <nav class="navbar navbar-expand-lg navbar-light navbar-laravel">
    <div class="container">
      <a class="navbar-brand" href="#">Reset Password Verification</a>
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
            <div class="card-header">Reset Password Verification</div>
            <div class="card-body">
              <form id="forgetOtpForm" @submit.prevent="_submitForm">
                <div class="form-group row">
                  <input type="hidden" name="email" v-model="email" />
                  <label for="otp" class="col-md-4 col-form-label text-md-right">OTP Code</label>
                  <div class="col-md-6">
                    <input
                      type="text"
                      v-model="otp"
                      id="otp"
                      class="form-control"
                      name="otp"
                      placeholder="Enter OTP"
                      required
                      autofocus
                    />
                  </div>
                </div>
                <div class="col-md-6 offset-md-4 mt-3">
                  <button
                    class="btn btn-primary"
                    type="submit"
                    name="verify"
                    :disabled="submitting"
                  >
                    {{ submitting ? 'Verifying...' : 'Verify' }}
                  </button>
                </div>
                <div id="ajaxError" style="color: green; margin-top: 10px">{{ message }}</div>
                <div v-if="resetUrl" class="mt-3">
                  <p>Click the link below to reset your password:</p>
                  <a :href="resetUrl" class="btn btn-link">Reset Password</a>
                </div>
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
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const route = useRoute();
const otp = ref("");
const email = ref(route.query.email || "");
const message = ref("");
const errors = ref({});
const resetUrl = ref("");
const submitting = ref(false);

const _submitForm = async () => {
	message.value = "";
	errors.value = {};
	resetUrl.value = "";
	try {
		if (!otp.value) {
			message.value = "Please enter the code";
			return;
		}
		const result = await auth.verifyResetOtp({
			email: email.value,
			token: otp.value,
		});

		message.value = result.message;
		resetUrl.value = result.resetUrl;
	} catch (error) {
		message.value = error.message;
		errors.value = error.errors || {};
	} finally {
		submitting.value = false;
	}
};
</script>

<style lang="scss" scoped></style>
