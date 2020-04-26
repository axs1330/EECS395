<template>
  <div>
    <v-card>
      <v-card-title class="headline">Add a Meeting</v-card-title>
      <v-card-text>
        <v-tabs vertical>
          <v-tab v-for="(meeting, i) in meetings" v-bind:key="meeting.id">
            <p>Meeting {{i}}</p>
          </v-tab>
          <v-tabs-items v-model="mIndex" vertical>
            <p>bleh</p>
          </v-tabs-items>
        </v-tabs>
      </v-card-text>
      <v-card-actions>
              <v-btn color="blue darken-1" text v-on:click="$emit('close-modal')">Close</v-btn>
              <v-btn color="blue darken-1" text @click="sendMeetingInfo">Create Meeting</v-btn>
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
      mIndex: 0
    };
  },

  methods: {
    sendMeetingInfo(){
      var date = new Date(this.date);
      var startres = this.start.concat(':00');
      var endres = this.end.concat(':00');
      var durationres = this.hourLabels[this.durationHr].concat(':', this.minLabels[this.durationMn], ':00');
      this.$emit('send-meeting', date, startres, endres, durationres)

    }
  }
};
</script>