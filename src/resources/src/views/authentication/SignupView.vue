<template>
  <div class="container-box">
    <div class="form-box">
      <h1 id="title">Sign Up</h1>

      <form @submit.prevent="_submit">
        <div id="input-group">
          <div class="input-field">
            <i class="bi bi-person-fill"></i>
            <input type="text" placeholder="Name" v-model="name" name="name" />
            <div class="error">{{ errors.name?.[0] }}</div>
          </div>

          <div class="input-field">
            <i class="bi bi-envelope-fill"></i>
            <input type="email" placeholder="Email" v-model="email" name="email" />
            <div class="error">{{ errors.email?.[0] }}</div>
          </div>

          <div class="input-field">
            <i class="bi bi-lock-fill"></i>
            <input type="password" placeholder="Password" v-model="password" name="password" />
            <div class="error">{{ errors.password?.[0] }}</div>
          </div>

          <div class="input-field">
            <i class="bi bi-lock-fill"></i>
            <input
              type="password"
              placeholder="Confirm Password"
              v-model="password_confirmation"
              name="password_confirmation"
            />
            <div class="error">{{ errors.password_confirmation?.[0] }}</div>
          </div>

          <p class="pt-3">
            Already have an account?
            <router-link to="/login">Click Here!</router-link>
          </p>
        </div>

        <div class="btn-field">
          <button type="submit" :disabled="auth.processing">Sign Up</button>
        </div>

        <div
          id="ajaxError"
          class="pt-3"
          :style="{ color: message ? 'red' : '', textAlign: 'center', marginTop: '10px' }"
        >
          {{ auth.processing ? 'Processing...' : message }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import "../../assets/custom/project1.css";

defineOptions({ name: "SignupView" });

const auth = useAuthStore();
const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");
const password_confirmation = ref("");
const message = ref("");
const errors = ref({});

const _submit = async () => {
	message.value = "";
	errors.value = {};
	try {
		message.value = await auth.register({
			name: name.value,
			email: email.value,
			password: password.value,
			password_confirmation: password_confirmation.value,
		});
		setTimeout(() => {
			router.push({ path: "/verification" });
		}, 1500);
	} catch (error) {
		message.value = error.message;
		errors.value = error.errors || {};
	}
};
</script>

<style lang="scss" scoped></style>
