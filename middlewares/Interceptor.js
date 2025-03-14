const { log } = require("#common/Logger.js");
log("Interceptor initialized", "DEBUG", "Interceptor");
/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 *
 * @returns {void} This function does not return anything, it just logs the request
 */
const interceptor = async (req, res, next) => {
  // const reqString = ("NEW REQUEST\n",
  //   req.method, " ", req.url, "\n",

  log(`New request from ${req.ip}`, "WARN", "Interceptor");
  log(`${req.method} ${req.url}`, "INFO", "Interceptor");
  // "Headers: ", req.headers, "\n",
  log(`Headers: ${JSON.stringify(req.headers)}`, "INFO", "Interceptor");
  // Authorization
  if (req.headers.authorization) {
    log(`Authorization: ${req.headers.authorization}`, "INFO", "Interceptor");
  }
  //   "Body: ", req.body, "\n",
  log(`Body: ${JSON.stringify(req.body)}`, "INFO", "Interceptor");
  //   "Params: ", req.params, "\n",
  log(`Params: ${JSON.stringify(req.params)}`, "INFO", "Interceptor");
  //   "Query: ", req.query, "\n",
  log(`Query: ${JSON.stringify(req.query)}`, "INFO", "Interceptor");
  //   "Cookies: ", req.cookies, "\n")
  log(`Cookies: ${JSON.stringify(req.cookies)}`, "INFO", "Interceptor");
  // "Signed Cookies: ", req.signedCookies, "\n",
  // "Session: ", req.session, "\n",
  // "User: ", req.user, "\n",
  // "JWT: ", req.jwt, "\n",
  // "IP: ", req.ip, "\n",
  // "Hostname: ", req.hostname, "\n",
  // "Original URL: ", req.originalUrl, "\n",
  // "Protocol: ", req.protocol, "\n",
  // "Secure: ", req.secure, "\n",
  // "Stale: ", req.stale, "\n",
  // "Subdomains: ", req.subdomains, "\n",
  // "XHR: ", req.xhr, "\n",
  // "Accepted: ", req.accepts(), "\n",
  // "Accepted Charsets: ", req.acceptsCharsets(), "\n",
  // "Accepted Encodings: ", req.acceptsEncodings(), "\n",
  // "Accepted Languages: ", req.acceptsLanguages(), "\n",
  // "Is: ", req.is(), "\n",
  // "IPs: ", req.ips, "\n"
  // log(reqString, "INFO", "Interceptor");
  next();
};

module.exports = interceptor;
