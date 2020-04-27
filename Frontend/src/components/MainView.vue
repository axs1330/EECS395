<template>
  <v-card height="100%" class="fill-height">
    <v-card-title class="justify-center">
      <p>{{group.name}}</p>
    </v-card-title>
        <div class="text-center">
            <v-chip  close v-for="member in tmembers" v-bind:key="member" @click:close="$emit('remove-member', group, member)" class="text-center">
                {{member}}
            </v-chip>
            <v-dialog persistent v-model="dialog" width="unset">
                <template v-slot:activator="{ on }">
                    <v-btn fab dark x-small color="grey" v-on="on">
                        <v-icon>mdi-plus</v-icon>
                    </v-btn>
                </template>
                <MemberAddModal v-bind:members="tmembers"
                                v-bind:groupName="group.name"
                                v-bind:groupId="group._id"
                                v-on:close-modal="dialog = false"
                                v-on:refresh-groups="$emit('refresh-groups')"
                                />
            </v-dialog>
        </div>
    <v-list dense class="justify-center">
      <v-list-item-group v-model="meetingIndex" color="primary">
        <v-list-item v-for="meeting in tmeetings" v-bind:key="meeting.id">
          <p>Start Time: {{new Date(meeting.start).toString()}}</p>
          <p>End Time: {{new Date(meeting.end).toString()}}</p>
          <p v-if="meeting.location != null">Location: {{meeting.location}}</p>
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
      meetingIndex: 0,
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
      HTTP.post('/delete-meeting', {
        groupId: this.group._id,
        meetingId: meetingId
      })
      .then(response => {
        response
        this.$emit('refresh-groups');
      })
      .catch(error => {
        console.log(error)
      });
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
      var ad;
      if(meeting.location == null){
        ad = null;
      }
      else{
        ad = meeting.location.address;
      }
      console.log(meeting);
      console.log(this.group._id, meeting.startTime, meeting.endTime, ad);
      HTTP.post('/create-meeting', {
        groupId: this.group._id,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: ad
      })
      .then(response => {
        response
        this.$emit('refresh-groups')
      })
      .catch(error => {
        console.log(error)
      });
    }

  },
  computed: {
    tmembers(){
      return this.group.members;
    },
    tmeetings(){
      return this.group.meetings;
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