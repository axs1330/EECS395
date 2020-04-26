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
    <v-dialog persistent v-model="mdialog" width="unset">
      <template v-slot:activator="{ on }">
        <v-btn outlined fab small v-on="on" color="primary">add</v-btn>
      </template>
      <MeetingAddModal v-on:close-modal="mdialog = false" v-on:send-meeting="sendMeetingDetails"/>
    </v-dialog>
    <v-dialog persistent v-model="pMeetingDialog" width="unset">
      <PotentialMeetingModal v-bind:meetings="potentialMeetings" v-on:close-modal="pMeetingDialog = false" v-on:confirm-meeting="confirmMeeting"/>
    </v-dialog>
  </v-card>
</template>

<script>
import MeetingAddModal from "./MeetingAddModal.vue";
import MemberAddModal from "./MemberAddModal.vue";
import PotentialMeetingModal from "./PotentialMeetingModal.vue";
import {HTTP} from "../http-common.js";
export default {
  name: "MainView",
  components: {
    MeetingAddModal,
    MemberAddModal,
    PotentialMeetingModal
  },
  props: ["group"],
  data() {
    return {
      dialog: false,
      mdialog: false,
      members: [],
      meetings: [],
      meeting: 0,
      potentialMeetings: [],
      pMeetingDialog: false

    };
  },
  mounted(){

  },
  methods: {
    removeMeeting(meetingId){
      console.log(this.group._id);
      console.log(meetingId);
    /*  HTTP.post('/delete-meeting', {
        groupId: this.group._id,
        meetingId: meetingId
      })
      .then(response => {
        response
      })
      .catch(error => {
        console.log(error)
      });*/
    },

    sendMeetingDetails(startDate, endDate, start, end, duration){
      HTTP.post('/schedule-meeting', {
        groupId: this.group._id,
        startDate: startDate,
        endDate: endDate,
        startTime: start,
        endTime: end,
        duration: duration
      })
      .then(response => {
        this.potentialMeetings = response.data,
        this.pMeetingDialog = true,
        console.log(this.potentialMeetings)
      })
      .catch(error => {
        console.log(error)
      });
    },

    confirmMeeting(meeting){
      HTTP.POST('/create-meeting', {
        groupId: this.group._id,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location.address
      })
      .then(response => {
        response
      })
      .catch(error => {
        console.log(error)
      });
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