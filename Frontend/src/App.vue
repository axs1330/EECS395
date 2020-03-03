<template>
  <v-app>
    <v-app-bar app color="blue darken-4">CampusScheduler [icon] [account related icons on the right]</v-app-bar>
    <v-container fluid>
      <v-row dense>
        <v-col>
          <SideBarView/>
        </v-col>
      </v-row>
    </v-container>
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
  margin-top: 60px;
}
</style>
