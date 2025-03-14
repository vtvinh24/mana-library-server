const { log } = require("#common/Logger.js");

module.exports.notFoundHandler = (req, res, next) => {
  const url = req.originalUrl;
  const method = req.method;
  log(`Not found`, "DEBUG", `routes ${method} ${url}`);
  res.status(404).send();
};

module.exports.errorHandler = (err, req, res, next) => {
  const method = req.method;
  const url = req.originalUrl;
  log(`${err.message}`, "DEBUG", `routes ${method} ${url}`);
  res.status(err.status || 500).send();
};
