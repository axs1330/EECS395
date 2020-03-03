<template>
  <div>
    <v-card>
      <v-card-title class="headline">Add a Meeting</v-card-title>
      <v-form>
        <v-select label="length of meeting" :items="hours"></v-select>
      </v-form>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "MeetingAddModal",
  data() {
    return {
      hours: ["one hour", "two hours", "three hours"]
    };
  }
};
</script>