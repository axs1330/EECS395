<template>
  <v-card height="100%" class="flexcard">
    <v-card-title>
      <p>{{group.name}}</p>
    </v-card-title>
    <v-container>
      <v-row>
        <v-col v-for="(member, i) in group.members" v-bind:key="i">
          <p>{{member}}</p>
        </v-col>
      </v-row>
    </v-container>
    <v-list dense>
      <v-list-item-group v-model="meeting" color="primary">
        <v-list-item v-for="(meeting, i) in group.meetings" v-bind:key="i">
          <p>{{meeting}}</p>
        </v-list-item>
      </v-list-item-group>
    </v-list>
    <v-dialog>
      <template v-slot:activator="{ on }">
        <v-btn outlined icon small v-on="on" color="primary">add</v-btn>
      </template>
      <MeetingAddModal/>
    </v-dialog>
  </v-card>
</template>

<script>
import MeetingAddModal from "./MeetingAddModal.vue";
import {HTTP} from "../http-common.js";
export default {
  name: "MainView",
  components: {
    MeetingAddModal
  },
  props: ["group"],
  data() {
    return {
      members: [],
      meetings: [],
      meeting: 0
    };
  },
  mounted(){
    HTTP.post('', {
      groupId: this.group.id
    })
    .then(response => {
      this.members = response.data.members
    })
    .catch(error => {
      console.log(error)
    })
  }
};
</script>
<style>
.flexcard {
  display: flex;
  flex-direction: column;
}
</style>