// Auto-import all monitors
// Add new monitors here

import marketingWebsite from "./marketing-website";
import productionApi from "./production-api";

export const monitors = {
  "production-api": productionApi,
  "auth-service": authService,
  "marketing-website": marketingWebsite,
};
