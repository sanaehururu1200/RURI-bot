const execSync = require("child_process").execSync;
const axios = require("axios");
const moment = require("moment");
const fs = require("fs");
const path = require("path");

function parseWeather(main) {
  switch (main) {
    case "Clear":
      return "晴れ";
      break;
    case "Clouds":
      return "曇り";
      break;
    case "Rain":
      return "雨";
      break;
    case "Drizzle":
      return "霧雨";
      break;
    default:
      return main;
      break;
  }
}

async function main(acct, content, statusID, mstdn) {
  if (content.includes("の天気")) {
    let outText = "";
    var inputCityNames = [content.split(/今の|現在の|いまの/)[1].split("の天気")[0]];
    if (inputCityNames[0].includes("と")) {
      if (typeof inputCityNames[0].split("と")[1] !== "undefined") {
        inputCityNames = inputCityNames[0].split("と");
      }
    }
    cityList = JSON.parse(fs.readFileSync(path.resolve("module/tenki/.config.json")));
    if (inputCityNames.length > 0) {
      for (let i = 0; inputCityNames.length > i; i++) {
        inputCityName = inputCityNames[i];
        let cityListArray = [];
        if (inputCityName in cityList) {
          const city = cityList[inputCityName];
          const name = inputCityName;
          const lat = city.lat;
          const lon = city.lon;
          await axios
            .get(
              `https://api.openweathermap.org/data/2.5/weather?APPID=4bd53dae21f5d10566313d3fc71d8814&units=metric&lat=${lat}&lon=${lon}`
            )
            .then(result => {
              const data = result.data;
              const weather = parseWeather(data.weather[0].main);
              outText += `${name} の今の天気は「${weather}」！\n`;
            })
            .catch(err => {
              console.log(err);
            });
        } else {
          let command =
            "echo " +
            inputCityName +
            " | nkf -e | kakasi -Ja | nkf -w"
              .replace(/\\/g, "\\\\")
              .replace(/\$/g, "\\$")
              .replace(/'/g, "\\'")
              .replace(/"/g, '\\"');
          var romaSearchCity = execSync(command).toString();
          await axios
            .get(
              `https://api.openweathermap.org/data/2.5/weather?APPID=4bd53dae21f5d10566313d3fc71d8814&units=metric&q=${romaSearchCity}`
            )
            .then(result => {
              const data = result.data;
              const weather = parseWeather(data.weather[0].main);
              outText += `${inputCityName}(${
                data.name
              }) の今の天気は「${weather}」！\n`;
            })
            .catch(err => {
              outText += `${inputCityName} の天気を取得出来なかったよ...`;
            });
        }
      }
      outText += "\nPowered by OpenWeatherMap\n";
      outText += "[https://openweathermap.org/]";
      var sendData = {};
      if (outText.length > 200 || outText.split("\n") > 8) {
        sendData = {
          spoiler_text: "天気",
          visibility: "unlisted",
          status: outText,
          quote_id: statusID
        };
      } else {
        sendData = {
          visibility: "unlisted",
          status: outText,
          quote_id: statusID
        };
      }

      mstdn.post("statuses", sendData);
      console.log(outText);
    }
  }
}

module.exports.main = main;
