/**
 * Use this to cache the response of a route.
 * Note: Usually only GET requests are cached.
 *
 * @example
 * router.get("/", cache("5 minutes"), getUser);
 * router.get("/:userId", cache("5 minutes"), getUser);
 */
const cache = require("apicache").middleware;

module.exports = {
  cache,
};
