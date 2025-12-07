module.exports = {
  name: "Production Status",
  slug: "production",
  public: true,
  monitors: ["production-api", "marketing-website", "auth-service"],
  slaTarget: 99.9,
}
