// require('axios');
// const fs = require("fs");

module.exports.main = (acct, content) => {
  if (content.includes("Hello")) {
    return `${acct} Hello World!`;
  }
};
