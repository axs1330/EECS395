<template>
  <v-card height="100%" class="fill-height">
    <v-card-title>
      <p>{{group.name}}</p>
    </v-card-title>
        <div class="text-center">
            <v-chip  close v-for="(member) in group.members" v-bind:key="member" @click:close="$emit('remove-member', group, member)" class="text-center">
                {{member}}
            </v-chip>
        </div>
    <v-list dense>
      <v-list-item-group v-model="meeting" color="primary">
        <v-list-item v-for="(meeting) in group.meetings" v-bind:key="meeting.id">
          <p>{{meeting.start}}</p>
          <p>{{meeting.end}}</p>
          <p>{{meeting.location}}</p>
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
// import {HTTP} from "../http-common.js";
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
  //   HTTP.get('/home', {
  //     groupId: this.group.id
  //   })
  //   .then(response => {
  //     this.members = response.data.members
  //     this.meetings = response.data.meetings
  //   })
  //   .catch(error => {
  //     console.log(error)
  //   })
  }
};
</script>
<style>
.flexcard {
  display: flex;
  flex-direction: column;
}
</style>