<template>
  <div>
    <v-card>
      <v-card-title class="headline">Add a Meeting</v-card-title>
      <v-form>
        <v-menu
          ref="datemenu"
          v-model="datemenu"
          :close-on-content-click="false"
          :nudge-right="40"
          transition="scale-transition"
          offset-y
          max-width="290px"
          min-width="290px"
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              v-model="date"
              label="Meet By"
              prepend-icon="mdi-calendar"
              readonly
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker
            v-if="datemenu"
            v-model="date"
            full-width
          ></v-date-picker>
        </v-menu>
        <v-menu
          ref="menu"
          v-model="menu"
          :close-on-content-click="false"
          :nudge-right="40"
          :return-value.sync="start"
          transition="scale-transition"
          offset-y
          max-width="290px"
          min-width="290px"
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              v-model="start"
              label="Start Time"
              prepend-icon="mdi-clock"
              readonly
              v-on="on"
            ></v-text-field>
          </template>
          <v-time-picker
            v-if="menu"
            v-model="start"
            full-width
            @click:minute="$refs.menu.save(start)"
            :max="end"
          ></v-time-picker>
        </v-menu>
        <v-menu
          ref="menu2"
          v-model="menu2"
          :close-on-content-click="false"
          :nudge-right="40"
          :return-value.sync="end"
          transition="scale-transition"
          offset-y
          max-width="290px"
          min-width="290px"
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              v-model="end"
              label="End Time"
              prepend-icon="mdi-clock"
              readonly
              v-on="on"
            ></v-text-field>
          </template>
          <v-time-picker
            v-if="menu2"
            v-model="end"
            full-width
            @click:minute="$refs.menu2.save(end)"
            :min="start"
          ></v-time-picker>
        </v-menu>
        <v-text-field type="time" label="length of meeting" v-model="duration"></v-text-field>
      </v-form>
      <v-card-actions>
              <v-btn color="blue darken-1" text v-on:click="$emit('close-modal')">Close</v-btn>
              <v-btn color="blue darken-1" text @click="sendMeetingInfo">Create Meeting</v-btn>
            </v-card-actions>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "MeetingAddModal",
  data() {
    return {
      datemenu: false,
      start: null,
      end: null,
      date: null,
      menu: false,
      menu2: false,
      duration: ""
    };
  },

  methods: {
    sendMeetingInfo(){
      var date = new Date(this.date);
      var startres = this.start.concat(':00');
      var endres = this.end.concat(':00');
      var durationres = this.duration.slice(0, -2).concat(':00');
      console.log(date.toISOString(), startres, endres, durationres)
      //this.$emit('send-meeting', this.date, this.start, this.end, this.duration)

    }
  }
};
</script>