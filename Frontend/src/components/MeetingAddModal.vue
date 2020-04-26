<template>
  <div>
    <v-card>
      <v-card-title class="headline">Add a Meeting</v-card-title>
      <v-form>
        <v-menu
                  ref="startDateMenu"
                  v-model="startDateMenu"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  max-width="290px"
                  min-width="290px"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="startDate"
                      label="Meet After"
                      prepend-icon="mdi-calendar"
                      readonly
                      v-on="on"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-if="startDateMenu"
                    v-model="startDate"
                    full-width
                  ></v-date-picker>
                </v-menu>
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
              v-model="endDate"
              label="Meet By"
              prepend-icon="mdi-calendar"
              readonly
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker
            v-if="datemenu"
            v-model="endDate"
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
        <v-slider
                v-model="durationHr"
                :tick-labels="hourLabels"
                :max="13"
                step="1"
                ticks="always"
                tick-size="4"
              ></v-slider>
        <v-slider
                v-model="durationMn"
                :tick-labels="minLabels"
                :max="3"
                step="1"
                ticks="always"
                tick-size="4"
        ></v-slider>
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
      startDateMenu: false,
      datemenu: false,
      start: null,
      end: null,
      startDate: null,
      endDate: null,
      menu: false,
      menu2: false,
      durationHr: "",
      durationMn: "",
      hourLabels: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
      minLabels: ['00', '15', '30', '45']
    };
  },

  methods: {
    sendMeetingInfo(){
      var endDate = new Date(this.endDate);
      var startDate = new Date(this.endDate);
      var startres = this.start.concat(':00-05:00');
      var endres = this.end.concat(':00-05:00');
      var durationres = this.hourLabels[this.durationHr].concat(':', this.minLabels[this.durationMn], ':00');
      this.$emit('send-meeting', startDate.toISOString(), endDate.toISOString(), startres, endres, durationres)

    }
  }
};
</script>