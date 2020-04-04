<template>
  <div>
    <v-card>
      <v-card-title class="headline">Create New Group</v-card-title>
      <v-form>
        <v-text-field label="Group Name" placeholder="Enter Name" v-model="groupName"></v-text-field>
        <v-combobox :rules="[rules.required, rules.email]" label="email address" chips multiple v-model="members"></v-combobox>
      </v-form>
      <v-card-actions>
        <v-btn color="blue darken-1" text v-on:click="$emit('close-modal')">Close</v-btn>
        <v-btn color="blue darken-1" text @click="createGroup">Create Group</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import {HTTP} from "../http-common.js";
export default {
  name: "GroupAddModal",
  data() {
    return {
      groupName: "",
      members: [],
      rules: {
        required: value => !!value || "Required.",
        counter: value => value.length <= 20 || "Max 20 characters",
        email: value => {
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return pattern.test(value) || "Invalid e-mail.";
        }
      }
    };
  },
  methods: {
    cleanupModal() {
      this.members = [];
      this.name= "";
      this.$emit('close-modal');
      this.$emit('refresh-groups');
      //TODO: create event to refresh list of groups
    },
    createGroup() {

      HTTP.post('/create-group', {
        _id: "test",
        name: this.groupName,
        members: this.members,
        meetings: [],
        group_prefs: {}
      })
      .then(response => {
        response
      })
      .catch(error => {
        console.log(error)
      })
      this.cleanupModal();
    }
  }
};
</script>