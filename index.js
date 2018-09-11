const fs = require("fs");
const axios = require("axios");
const Mastodon = require('mastodon-api');
const loadList = [];

const mstdn = new Mastodon({
  access_token: require("./.config.global").api.token,
  api_url: `https://${require("./.config.global").api.url}/api/v1/`,
})

const listener = mstdn.stream('streaming/public/local')

fs.readdir("./module/", (err, files) => {
  if (err) throw err;
  var dirList = [];
  files
    .filter(function (file) {
      return fs.statSync(`./module/${file}`).isDirectory();
    })
    .forEach(function (file) {
      dirList.push(file);
    });
  console.log(dirList);
  dirList.forEach(dirname => {
    let statIndex = fs.statSync(`./module/${dirname}/index.js`);
    if (statIndex) {
      loadList.push(`./module/${dirname}/index.js`)
    }
  })
  listener.on('message', msg => {
    if (msg.event === 'update' && msg.data.account.acct !== require("./.config.global").api.id) {
      let content = msg.data.content.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
      let acct = msg.data.account.acct;
      let statusID = msg.data.id;
      loadList.forEach(loadModule => {
        require(loadModule).main(acct, content, statusID, mstdn);
      });
    }
  })
});

listener.on('error', err => console.log(err))