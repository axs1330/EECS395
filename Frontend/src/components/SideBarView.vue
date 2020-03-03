<template>
  <div>
    <v-tabs vertical v-model="group" dark>
      <v-card height="100%" class="flexcard" dark>
        <v-card-title>
          <p>Groups</p>
        </v-card-title>
        <v-card-subtitle>
          <p>Your Groups</p>
          <v-dialog persistent v-model="dialog">
            <template v-slot:activator="{ on }">
              <v-btn outlined icon small v-on="on" color="primary">add</v-btn>
            </template>
            <GroupAddModal v-on:close-modal="dialog = false"></GroupAddModal>
          </v-dialog>
        </v-card-subtitle>
        <v-tab v-for="(group, i) in groups" v-bind:key="i">
          <p>{{group.name}}</p>
        </v-tab>
      </v-card>
      <v-tabs-items v-model="group" vertical>
        <v-tab-item v-for="(group, i) in groups" v-bind:key="i">
          <MainView v-bind:group="group"/>
        </v-tab-item>
      </v-tabs-items>
    </v-tabs>
  </div>
</template>

<script>
import MainView from "./MainView.vue";
import GroupAddModal from "./GroupAddModal.vue";
export default {
  name: "SideBarView",
  components: {
    MainView,
    GroupAddModal
  },
  data() {
    return {
      group: 0,
      groups: [
        {
          name: "EECS 395",
          members: ["member 1", "member 2", "member 3"],
          meetings: ["395 meeting 1", "395 meeting 2"]
        },
        {
          name: "EECS 393",
          members: ["member A", "member B", "member C"],
          meetings: ["393 meeting 1", "393 meeting 2"]
        }
      ],
      dialog: false
    };
  }
};
</script>
<style>
.flexcard {
  display: flex;
  flex-direction: column;
}
</style>

