const fs = require("fs").promises;
async function loadJsonFile(filename) {
  const data = await fs.readFile(`${filename}.json`)
  ret = JSON.parse(data);
  console.log(`Loaded ${filename} File`);
  return ret;
}


function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// Could be safer but meh
function registerCommandFun(app, fname, fun) {
  app.commands[fname] = fun;
}

module.exports = {
  "loadJsonFile": loadJsonFile,
  "getRandomInt": getRandomInt,
  "registerCommandFun": registerCommandFun
}