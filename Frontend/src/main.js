import Vue from "vue";
import App from "./App.vue";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.css";

Vue.config.productionTip = false;

Vue.use(Vuetify);
export default new Vuetify({});

new Vue({
  vuetify: new Vuetify(),
  render: h => h(App)
}).$mount("#app");
