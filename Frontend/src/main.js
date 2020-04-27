import Vue from "vue";
import App from "./App.vue";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.css";

import sbv from "./components/SideBarView";
import VueRouter from "vue-router";

Vue.use(VueRouter);
const routes = [
  { path: '/', component: sbv }
];
const router = new VueRouter({
  mode: 'history',
  routes: routes
});

Vue.config.productionTip = false;

Vue.use(Vuetify);
export default new Vuetify({});

new Vue({
  router,
  vuetify: new Vuetify({
    icons: {iconfont: 'mdi'}
  }),
  render: h => h(App)
}).$mount("#app");
