<template>
  <div>
    <v-card>
      <v-card-title class="headline">Create New Group</v-card-title>
      <v-form>
        <v-text-field :rules="[rules.required, rules.email]" label="email address"></v-text-field>
      </v-form>
      <v-card-actions>
        <v-btn color="blue darken-1" text v-on:click="$emit('close-modal')">Close</v-btn>
        <v-btn color="blue darken-1" text @click="dialog = false">Save</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "GroupAddModal",
  data() {
    return {
      rules: {
        required: value => !!value || "Required.",
        counter: value => value.length <= 20 || "Max 20 characters",
        email: value => {
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return pattern.test(value) || "Invalid e-mail.";
        }
      }
    };
  }
};
</script>