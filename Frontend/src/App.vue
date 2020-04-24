<template>
  <v-app>
    <v-app-bar app dark color="blue darken-4">
        <v-toolbar-title color="white">CampusScheduler</v-toolbar-title>
    </v-app-bar>
    <v-content>
    <v-container fluid class="fill-height">
      <v-row class="fill-height">
        <v-col fill-height>
          <SideBarView/>
        </v-col>
      </v-row>
    </v-container>
    </v-content>
  </v-app>
</template>

<script>
import SideBarView from "./components/SideBarView";

export default {
  name: "App",
  components: {
    SideBarView
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.container #app .row .col{
  height: 100%;
}

</style>
