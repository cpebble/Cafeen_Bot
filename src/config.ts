import fs from "fs"
import os from "os"

let config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
let secrets = JSON.parse(fs.readFileSync("secrets.json", "utf-8"));

for (const k in config) {
   if (process.env[k] !== undefined){
    config[k] = process.env[k];
    console.log(`Overwriting conf ${k} with ${config[k]}`);
   }
}
for (const k in secrets) {
   if (process.env[k] !== undefined){
    secrets[k] = process.env[k];
    console.log(`Overwriting secret ${k} with ${secrets[k]}`);
   }
}

export {
    config,
    secrets
}
