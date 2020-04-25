<template>
  <v-app>
    <v-app-bar app dark color="blue darken-4">
        <v-toolbar-title color="white">CampusScheduler</v-toolbar-title>
    </v-app-bar>
    <v-content>
      <v-container fluid class="fill-height">
        <section v-if="auth">
          <v-row class="fill-height">
            <v-col fill-height>
              <SideBarView/>
            </v-col>
          </v-row>
        </section>
        <section v-else>
          <v-text-field type="email" label="Enter your Email address" v-model="authEmail">
          </v-text-field>
          <v-btn fab dark color="primary" @click="sendAuthEmail"><v-icon>mdi-send</v-icon></v-btn>
        </section>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import SideBarView from "./components/SideBarView";
import {HTTP} from "./http-common.js";

export default {
  name: "App",
  components: {
    SideBarView
  },
  data(){
    return{
      auth: false,
      authEmail: ""
    }
  },
  methods:{
    sendAuthEmail(){
      HTTP.get('/api/authorize', {
        email: this.authEmail
      })
      .then(response => {
        response
        this.auth=true;
      })
      .catch(error => {
        console.log(error)
      });
    }
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
