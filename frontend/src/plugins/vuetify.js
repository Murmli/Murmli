/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Composables
import { createVuetify } from "vuetify";

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides

// node_modules/vuetify/dist/vuetify.css
export default createVuetify({
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        colors: {
          'primary': "#f57f17ff", // Orange color for primary
          'on-primary': "#FFFFFF", // White color for text on primary
          'info': "#f57f17ff", // Orange color for info
          'on-info': "#FFFFFF", // White color for text on info
          // 'on-surface': '#3a1800ff', // Dark brown color for main text
        },
      },
    },
  },
});
