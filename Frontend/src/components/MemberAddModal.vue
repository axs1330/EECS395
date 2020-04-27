<template>
  <div>
    <v-card>
      <v-card-title class="headline">Add New Members to {{groupName}}</v-card-title>
      <v-chip  v-for="member in members" v-bind:key="member" class="text-center">
        {{member}}
      </v-chip>
      <v-form>
        <v-combobox :rules="[rules.required]" label="email address" chips multiple v-model="tmembers"></v-combobox>
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
      tmembers: [],
      rules: {
        required: value => !!value || "Required.",
      }
    };
  },
  methods: {
    cleanupModal() {
      this.tmembers= [];
      this.$emit('close-modal');
      this.$emit('refresh-groups');
      //TODO: create event to refresh list of groups
    },
    addMember() {
      HTTP.post('/add-members', {
        groupId: this.groupId,
        userIds: this.tmembers
      })
      .then(response => {
        response
      })
      this.cleanupModal();
    }
  }
};
</script>