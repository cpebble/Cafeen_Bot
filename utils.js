const fs = require("fs").promises;
async function loadJsonFile(filename){
    const data = await fs.readFile(`${filename}.json`)
    ret = JSON.parse(data);
    console.log(`Loaded ${filename} File`);
    return ret;
}

module.exports = {loadJsonFile}