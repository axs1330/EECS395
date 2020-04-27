<template>
  <div>
    <v-card>
      <v-card-title class="headline">Add a Meeting</v-card-title>
      <v-card-text>
        <v-tabs vertical>
          <v-tab v-for="(meeting, i) in meetings" v-bind:key="meeting.startTime" class="text-center">
            Meeting {{i + 1}}
          </v-tab>
          <v-tabs-items v-model="meeting" vertical>
            <v-tab-item v-for="meeting in meetings" v-bind:key="meeting.startTime">
              <p>Start Time: {{new Date(meeting.startTime).toString()}}</p>
              <p>End Time: {{new Date(meeting.endTime).toString()}}</p>
              <p v-if="meeting.location != null">Location: {{meeting.location.address}}</p>
            </v-tab-item>
          </v-tabs-items>
        </v-tabs>
      </v-card-text>
      <v-card-actions>
              <v-btn color="blue darken-1" text v-on:click="$emit('close-modal')">Close</v-btn>
              <v-btn color="blue darken-1" text @click="confirmMeeting">Confirm Meeting</v-btn>
            </v-card-actions>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "PotentialMeetingModal",
  props: ["meetings"],
  data() {
    return {
      meeting: 0
    };
  },

  methods: {
    confirmMeeting(){
      this.$emit('confirm-meeting', this.meetings[this.meeting]);
      this.$emit('close-modal');
    }
  }
};
</script>