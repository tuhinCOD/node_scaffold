<template>
  <div class="container-box">
    <div class="form-box">
      <h1 id="title">Log In</h1>
      <form id="loginForm" @submit.prevent="_handleLogin">
        <div id="input-group">
          <div class="input-field">
            <i class="bi bi-envelope-fill"></i>
            <input v-model="email" name="email" type="text" placeholder="Email" />
            <div class="error">{{ errors.email?.[0] }}</div>
          </div>
          <div class="input-field">
            <i class="bi bi-lock-fill"></i>
            <input v-model="password" name="password" type="password" placeholder="password" />
            <div class="error">{{ errors.password?.[0] }}</div>
          </div>
          <p><router-link to="/forget">Forget Password?</router-link></p>
          <p>Create a new account <router-link to="/signup">Click Here!</router-link></p>
        </div>
        <div class="btn-field">
          <button id="loginBtn" type="submit" :disabled="auth.processing">
            {{ auth.processing ? 'Processing...' : 'Login' }}
          </button>
        </div>
        <div id="ajaxError" style="color: red; text-align: center; margin-top: 10px">
          {{ message }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import "../../assets/custom/project1.css";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

defineOptions({ name: "LoginView" });

const auth = useAuthStore();
const router = useRouter();
const email = ref("");
const password = ref("");
const message = ref("");
const errors = ref({});

const _handleLogin = async () => {
	message.value = "";
	errors.value = {};
	try {
		message.value = await auth.login({
			email: email.value,
			password: password.value,
		});
		setTimeout(() => {
			router.push("/dashboard");
		}, 1200);
	} catch (error) {
		message.value = error.message;
		errors.value = error.errors || {};
	}
};
</script>

<style lang="scss" scoped></style>
