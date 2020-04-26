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
        <section v-else-if="url">
          <a :href="this.url">Click this link to sign in.</a>
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
      url: null,
      auth: true,
      authEmail: ""
    }
  },
  methods:{
    sendAuthEmail(){
      HTTP.post('/api/authorize', {
        email: this.authEmail
      })
      .then(response => {
        this.url = response.data;

        // TODO
        // i think that the google sign-in flow can only be configured to redirect to some route on the server
        // so there's currently no way for the frontend to initiate a http request for user group data
        // the only way the server response data is displayed correctly is when the server sends a response and the frontend unknowingly receives it
        // if there is a way for the frontend to listen for the next incoming http response and then call a method, this can be solved
        // uncommenting the line below gets all group info to show up, but completely skips the sign-in process
        // this.auth = true;
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
