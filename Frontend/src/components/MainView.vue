<template>
  <v-card height="100%" class="fill-height">
    <v-card-title class="justify-center">
      <p>{{group.name}}</p>
    </v-card-title>
        <div class="text-center">
            <v-chip  close v-for="member in group.members" v-bind:key="member" @click:close="$emit('remove-member', group, member)" class="text-center">
                {{member}}
            </v-chip>
            <v-dialog persistent v-model="dialog" width="unset">
                <template v-slot:activator="{ on }">
                    <v-btn fab dark x-small color="grey" v-on="on">
                        <v-icon>mdi-plus</v-icon>
                    </v-btn>
                </template>
                <MemberAddModal v-bind:members="group.members"
                                v-bind:groupName="group.name"
                                v-bind:groupId="group._id"
                                v-on:close-modal="dialog = false"
                                v-on:refresh-groups="$emit('refresh-groups')"
                                />
            </v-dialog>
        </div>
    <v-list dense class="justify-center">
      <v-list-item-group v-model="meeting" color="primary">
        <v-list-item v-for="meeting in group.meetings" v-bind:key="meeting.id">
          {{meeting.start}}
          {{meeting.end}}
          {{meeting.location}}
          <v-btn fab x-small outlined color="primary" @click="removeMeeting(meeting.id)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-list-item>
      </v-list-item-group>
    </v-list>
    <v-dialog width="unset">
      <template v-slot:activator="{ on }">
        <v-btn outlined fab small v-on="on" color="primary">add</v-btn>
      </template>
      <MeetingAddModal/>
    </v-dialog>
  </v-card>
</template>

<script>
import MeetingAddModal from "./MeetingAddModal.vue";
import MemberAddModal from "./MemberAddModal.vue";
// import {HTTP} from "../http-common.js";
export default {
  name: "MainView",
  components: {
    MeetingAddModal,
    MemberAddModal
  },
  props: ["group"],
  data() {
    return {
      dialog: false,
      members: [],
      meetings: [],
      meeting: 0
    };
  },
  mounted(){

  },
  methods: {
  removeMeeting(meetingId){
  console.log(this.group._id);
  console.log(meetingId);
  /*  HTTP.get('/delete-meeting', {
        groupId: this.group._id
        meetingId: meetingId
    })
    .then(response => {
        response
    })
    .catch(error => {
        console.log(error)
    });*/
  }

  }
};
</script>
<style>
.flexcard {
  display: flex;
  flex-direction: column;
}
</style>