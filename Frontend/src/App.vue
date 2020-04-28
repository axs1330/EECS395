<template>
  <v-app>
    <v-app-bar app dark color="blue darken-4">
        <v-toolbar-title color="white">CampusScheduler</v-toolbar-title>
    </v-app-bar>
    <v-content fluid class="fill-height">
      <v-container fluid class="fill-height">
        <section v-if="isUserAuthenticated" fluid class="fill-height">
        <v-row class="fill-height">
            <v-col fill-height>
              <SideBarView/>
            </v-col>
          </v-row>
        </section>
        <section v-else class="mx-auto">
          <v-card outlined>
            <v-card-title dark color="blue darken-4">
              <p>Sign In to CampusScheduler</p>
            </v-card-title>
            <v-text-field type="email" label="Enter your Email address" v-model="authEmail" v-on:keyup.enter="sendAuthEmail">
            </v-text-field>
            <v-card-actions>
              <v-btn fab dark color="blue darken-4" @click="sendAuthEmail"><v-icon>mdi-send</v-icon></v-btn>
            </v-card-actions>
          </v-card>
        </section>
      </v-container>
    </v-content>
    <link href="https://cdn.jsdelivr.net/npm/@mdi/font@4.x/css/materialdesignicons.min.css" rel="stylesheet">
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
    return {
      isUserAuthenticated: false,
      authEmail: null
    }
  },
  methods:{
    sendAuthEmail(){
      HTTP.post('/api/authorize', {
        email: this.authEmail
      })
      .then(response => {
        window.location.href = response.data;
      })
      .catch(error => {
        console.log(error)
      });
    }
  },
  mounted() {
    const code = this.$route.query.code;
    if (!code) return;

    HTTP.post('/auth', {
      code: code
    })
    .then(response => {
      this.$router.replace({ 'query': null });
      if (response.status === 200) {
        this.isUserAuthenticated = true;
      }
    })
    .catch(error => console.log(error));
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
