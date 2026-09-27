<template>
    <div class="sidebar bg-dark-black">
        <div class="topbar text-center border-bottom border-primary bg-dark-black">
          <div class="logo-lg">
            <a href="#" class="nav-link text-light fs-6 px-3 py-2">
              <h5 class="m-0"><b>A</b>dmin <b>P</b>anel</h5>
            </a>
          </div>
          <div class="logo-sm">
            <a href="#" class="nav-link text-light fs-6 px-auto py-2">
              <h5 class="m-0"><b>AP</b></h5>
            </a>
          </div>
        </div><!--/topbar-->
        <div class="accordion" id="accordion">
          <ul class="list-unstyled">
            <li class="active">
              <router-link to="/dashboard" role="button" class="nav-link d-flex align-items-center ps-0 py-0 pe-md-0 collapsed text-light">
                <div class="sidemenu-icon">
                  <i class="bi bi-speedometer2"></i>
                </div>
                <div class="position-relative d-flex align-items-center flex-grow-1">
                  <div class="plus text-capitalize position-absolute">
                    <span>Dashboard</span>
                  </div>
                </div>
              </router-link>
            </li><!--/single-->
            <li class="active">
              <router-link to="/clients" role="button" class="nav-link d-flex align-items-center ps-0 py-0 pe-md-0 collapsed text-light">
                <div class="sidemenu-icon">
                  <i class="bi bi-people-fill"></i>
                </div>
                <div class="position-relative d-flex align-items-center flex-grow-1">
                  <div class="plus text-capitalize position-absolute">
                    <span>Clients</span>
                  </div>
                </div>
              </router-link>
            </li><!--/single-->
            <li>
              <a role="button" class="nav-link d-flex align-items-center ps-0 py-0 pe-md-0 collapsed text-light"
                data-bs-toggle="collapse" data-bs-target="#post" data-show="onoff">
                <div class="sidemenu-icon">
                  <i class="bi bi-clipboard2-minus-fill"></i>
                </div>
                <div class="sidetoggle d-flex align-items-center flex-grow-1">
                  <div class="plus text-capitalize">
                    <span>posts</span>
                  </div>
                  <!-- <div class="sidemenu-icon ms-auto">
                    <i class="fas fa-angle-right fz-0 caret"></i>
                  </div> -->
                </div>
              </a>
              <ul class="list-unstyled collapse" id="post" data-bs-parent="#accordion">
                <li><a href="#" class="nav-link text-capitalize text-light fz-1 px-3 py-2">all posts</a></li>
                <li><a href="#" class="nav-link text-capitalize text-light fz-1 px-3 py-2">add new</a></li>
                <li><a href="#" class="nav-link text-capitalize text-light fz-1 px-3 py-2">categories</a></li>
                <li><a href="#" class="nav-link text-capitalize text-light fz-1 px-3 py-2">tags</a></li>
              </ul>
            </li><!--/dropdown-->
            <li>
              <a role="button" class="nav-link ps-0 py-0 d-flex align-items-center pe-md-0 collapsed text-light"
                data-bs-toggle="collapse" data-bs-target="#media" data-show="onoff">
                <div class="sidemenu-icon">
                  <i class="bi bi-disc-fill"></i>
                </div>
                <div class="sidetoggle d-flex align-items-center flex-grow-1">
                  <div class="plus text-capitalize">
                    <span>media</span>
                  </div>
                </div>
              </a>
              <ul class="list-unstyled collapse" id="media" data-bs-parent="#accordion">
                <li><a href="#" class="nav-link text-capitalize text-light fz-1 px-3 py-2">library</a></li>
                <li><a href="#" class="nav-link text-capitalize text-light fz-1 px-3 py-2">add new</a></li>
              </ul>
            </li><!--/dropdown-->
            <li>
              <a role="button" class="nav-link ps-0 py-0 d-flex align-items-center pe-md-0 collapsed text-light"
                data-bs-toggle="collapse" data-bs-target="#page" data-show="onoff">
                <div class="sidemenu-icon">
                  <i class="bi bi-file-earmark-fill"></i>
                </div>
                <div class="sidetoggle d-flex align-items-center flex-grow-1">
                  <div class="plus text-capitalize">
                    <span>pages</span>
                  </div>
                </div>
              </a>
              <ul class="list-unstyled collapse" id="page" data-bs-parent="#accordion">
                <li><a href="#" class="nav-link text-capitalize text-light fz-1 px-3 py-2">all pages</a></li>
                <li><a href="#" class="nav-link text-capitalize text-light fz-1 px-3 py-2">add new</a></li>
              </ul>
            </li><!--/dropdown-->
            <li class="active">
              <a role="button" class="nav-link d-flex align-items-center ps-0 py-0 pe-md-0 collapsed text-light">
                <div class="sidemenu-icon">
                  <i class="bi bi-chat-square-fill"></i>
                </div>
                <div class="position-relative d-flex align-items-center flex-grow-1">
                  <div class="plus text-capitalize position-absolute">
                    <span>comments</span>
                  </div>
                </div>
              </a>
            </li><!--/single-->
          </ul>
          <ul class="list-unstyled">
            <li>
              <a role="button" class="nav-link ps-0 py-0 d-flex align-items-center pe-md-0 collapsed text-light"
                data-bs-toggle="collapse" data-bs-target="#appearance" data-show="onoff">
                <div class="sidemenu-icon">
                  <i class="bi bi-palette-fill"></i>
                </div>
                <div class="sidetoggle d-flex align-items-center flex-grow-1">
                  <div class="plus text-capitalize">
                    <span>appearance</span>
                  </div>
                </div>
              </a>
              <ul class="list-unstyled collapse" id="appearance" data-bs-parent="#accordion">
                <li><a href="#" class="nav-link text-capitalize text-light fz-1 px-3 py-2">menus</a></li>
              </ul>
            </li><!--/dropdown-->
            <li>
              <a role="button" class="nav-link ps-0 py-0 d-flex align-items-center pe-md-0 collapsed text-light"
                data-bs-toggle="collapse" data-bs-target="#users" data-show="onoff">
                <div class="sidemenu-icon">
                  <i class="bi bi-people-fill"></i>
                </div>
                <div class="sidetoggle d-flex align-items-center flex-grow-1">
                  <div class="plus text-capitalize">
                    <span>users</span>
                  </div>
                </div>
              </a>
              <ul class="list-unstyled collapse" id="users" data-bs-parent="#accordion">
                <li><router-link to="/all_user" class="nav-link text-capitalize text-light fz-1 px-3 py-2">all user</router-link></li>
                <li v-if="_auth.user?.isAdmin"><router-link to="/users" class="nav-link text-capitalize text-light fz-1 px-3 py-2">add new</router-link></li>
                <li><a href="#" class="nav-link text-capitalize text-light fz-1 px-3 py-2">your profile</a></li>
              </ul>
            </li><!--/dropdown-->
            <li>
              <a role="button" class="nav-link ps-0 py-0 d-flex align-items-center pe-md-0 collapsed text-light"
                data-bs-toggle="collapse" data-bs-target="#settings" data-show="onoff">
                <div class="sidemenu-icon">
                  <i class="bi bi-gear-fill"></i>
                </div>
                <div class="sidetoggle d-flex align-items-center flex-grow-1">
                  <div class="plus text-capitalize">
                    <span>settings</span>
                  </div>
                </div>
              </a>
              <ul class="list-unstyled collapse" id="settings" data-bs-parent="#accordion">
                <li><a href="#" class="nav-link text-capitalize text-light fz-1 px-3 py-2">general</a></li>
                <li><a href="#" class="nav-link text-capitalize text-light fz-1 px-3 py-2">reading</a></li>
              </ul>
            </li><!--/dropdown-->
          </ul>
        </div><!--/accordion-->
      </div><!--/sidebar-->
</template>

<script setup>
import { useAuthStore } from "../../stores/auth";

defineOptions({ name: "DashboardSidebar" });

const _auth = useAuthStore();
</script>

<style lang="scss" scoped>

</style>