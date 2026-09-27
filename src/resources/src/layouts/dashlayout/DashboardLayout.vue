<template>
    <div class="content-block d-flex" data-name="layout">
      <Sidebar/>
      <div class="mainbody">
        <Header/>  
        <div class="content">
          <slot></slot>
        </div>       
        <Footer/>
      </div><!--/mainbody-->
    </div><!--/layout-->
</template>

<script setup>
import("../../assets/custom/custom.js");

import "../../assets/custom/style.scss";
import Footer from "./DashboardFooter.vue";
import Header from "./DashboardHeader.vue";
import Sidebar from "./DashboardSidebar.vue";

defineOptions({ name: "DashboardLayout" });
</script>

<style lang="scss" scoped>

</style>