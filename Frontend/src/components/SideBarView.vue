<template>
  <div class="flexcard">
    <v-tabs vertical v-model="group" dark class="fill-height">
      <v-card dark fill-height>
        <v-card-title>
          <p>Groups</p>
        </v-card-title>
        <v-card-subtitle>
          <p>Your Groups</p>
          <v-dialog persistent v-model="dialog">
            <template v-slot:activator="{ on }">
              <v-btn outlined icon small v-on="on" color="primary">add</v-btn>
            </template>
            <GroupAddModal v-on:close-modal="dialog = false"></GroupAddModal>
          </v-dialog>
        </v-card-subtitle>
        <section v-if="errored">
          <p>We encountered an error, please reload the page</p>
        </section>
        <section v-else>
          <div v-if="loading">
            <v-progress-circular color="grey lighten-1" indeterminate> </v-progress-circular>
          </div>
          <div v-else>
            <v-tab v-for="(group, i) in groups" v-bind:key="i">
              <p>{{group.name}}</p>
            </v-tab>
          </div>
        </section>
      </v-card>
      <v-tabs-items v-model="group" vertical class="fill-height">
        <v-tab-item v-for="(group, i) in groups" v-bind:key="i" class="fill-height">
          <MainView v-bind:group="group"/>
        </v-tab-item>
      </v-tabs-items>
    </v-tabs>
  </div>
</template>

<script>
import MainView from "./MainView.vue";
import GroupAddModal from "./GroupAddModal.vue";
import {HTTP} from "../http-common.js";
export default {
  name: "SideBarView",
  components: {
    MainView,
    GroupAddModal
  },
  data() {
    return {
      group: 0,
      errored: false,
      loading: true,
      groups: [],
      dialog: false
    };
  },

  mounted(){
    HTTP.post('/home')
        .then(response => {
          this.groups = response.data
        })
        .catch(error => {
            console.log(error)
            this.errored = true
        })
        .finally(() => this.loading = false)
  }
};
</script>
<style>
.flexcard {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.height {
  flex: 1 1 auto;
  height: 100%;
}
</style>

