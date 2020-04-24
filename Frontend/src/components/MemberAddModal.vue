<template>
  <div>
    <v-card>
      <v-card-title class="headline">Add New Members to {{groupName}}</v-card-title>
      <v-form>

        <v-combobox :rules="[rules.required, rules.email]" label="email address" chips multiple v-model="members"></v-combobox>
      </v-form>
      <v-card-actions>
        <v-btn color="blue darken-1" text v-on:click="$emit('close-modal')">Close</v-btn>
        <v-btn color="blue darken-1" text @click="addMember">Add Members</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import {HTTP} from "../http-common.js";
export default {
  name: "MemberAddModal",
  props: ["members", "groupName", "groupId"],
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
  },
  methods: {
    cleanupModal() {
      this.name= "";
      this.$emit('close-modal');
      this.$emit('refresh-groups');
      //TODO: create event to refresh list of groups
    },
    addMember() {
      HTTP.post('/add-members', {
        groupId: this.groupId,
        members: this.members
      })
      .then(response => {
        response
      })
      this.cleanupModal();
    }
  }
};
</script>