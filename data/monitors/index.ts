// Auto-import all monitors
// Add new monitors here
import productionApi from "./production-api";
import authService from "./auth-service";
import marketingWebsite from "./marketing-website";

export const monitors = {
  "production-api": productionApi,
  "auth-service": authService,
  "marketing-website": marketingWebsite,
};
