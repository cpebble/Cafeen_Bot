// Import local config and secrets immediately
import secrets from "./secrets.json";
import config from "./config.json";
// Then import local configs
import utils from "./utils/utils.js";
import {BotModule} from "./modules/interface.js"

// Libs
import {Client as DiscordClient} from "discord.js";
// Setup express baseline app
import Express from "express";
const express_app = Express();
import http from "http";
const express_server = http.createServer(express_app);
express_app.use(Express.static("site"));

// Setup socket.io baseline app
import { Server as IOServer } from "socket.io";
const io = new IOServer(express_server);

// Setup sequelize
import { Sequelize } from "sequelize"
const db = new Sequelize(config.db_url);
(async ()=>{
    try{
        await db.authenticate();
        console.log("DB Has been successfully authenticated");
        app.db = db;
    } catch (err) {
        console.error("Unable to connect to db. Falling back");
        app.db = new Sequelize("sqlite::memory");
        await db.close().catch()
    }
})

// Discord stuffs
const dc = new DiscordClient();


// Listeners
dc.on("message", message => {
    if (message.content.startsWith(config.command_char)) {
        let cmd = message.content.substring(1)
        console.log(`Got command: ${cmd}`);
        try {
            let response = handleCommand(message, cmd);
            if (response != "") // Edge-case recovery
                message.channel.send(response);
        } catch (error) {
            console.log("Error:");
            console.warn(error);
            message.channel.send(`An error occured: ${error}`);
        }
    }
});

import {IApp} from "./IApp"
import { time } from "console";
let app: IApp = {
    // A set of baseline commands
    "commands": {
        "loaded_modules": ((msg, cmd)=>{
            let res = ""
            for (const mod of app.loaded_modules)
                res += `# Module: [${mod.modInfo.name}]\n${mod.modInfo.info}\n`
            return res
        }),
        "loaded_commands": ((msg,cmd)=>{
            let res = ""
            for (const mod in app.commands)
                res += `# Command: ${mod}\n`
            return res
        }),
        "github": ((msg,cmd)=>{
            return "https://github.com/cpebble/cafeen_bot"
        }),
        "uptime": ((msg, cmd)=>{
            return utils.timeSince(app.started);
        }),
    },
    "loaded_modules": [],
    "active_guild": "nyi",
    "express_app": express_app,
    "io": io,
    "dc": dc,
    "db": db,
    "started": Date.now()
}
// This handles input from either cli or bot dm
function handleCommand(msg, cmd) {
    let cmdArg = cmd.split(" ")
    // Switch statements are sooo 1987
    let cmdfun = app.commands[cmdArg[0]] 
    let response;
    if (cmdfun != undefined) {
        response = cmdfun(msg, cmd)
    }
    else {
        response = "OwO you typed an oopsie woopsie";
    }
    return response;
}


// Exit cleanly
async function exitHandler(options, exitCode) {
    if (options.cleanup) {
        // Destroy modules
        let queue: Promise<any>[] = [];
        for (const mod of app.loaded_modules) {
            queue.push(mod.destroy(app, config));
        }
        Promise.all(queue);
    }
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) {
        console.log("Exit cleanly");
        process.exit();
    }
}
// Exit binds
process.on('exit', exitHandler.bind(null, { cleanup: true, exit: true }));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { cleanup: true, exit: true }));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));


// Startup binds
dc.once("ready", () => {
    console.log("Discord ready");
    // Edge case where we haven't got a bot user connected
    if (dc.user != null)
        dc.user.setActivity('Your conversations', { type: 'LISTENING' });
    // Finally init arrything
    init().then(() => {
        console.log("Main init() reported done");
    })
});

// Startup webserver
express_server.listen(3000, ()=>{
    "Web server loaded"
});

async function init() {
    // Load the config file
    await RegisterModules();
}


// Module loading
/// Wraps a module file to add error-handling, 
declare function require(moduleName: string): any;
async function registerModule(modulePath, app, config): Promise<boolean> {
    try {
        // Try reading module
        const MOD: BotModule = await import(modulePath + ".js").then(m => {
            return new m(app, config)}
            );

        // If loaded, create promise initializing our mod
        let p = MOD.init(app, config)
        .then(()=>{
            return app.loaded_modules.push(
                MOD
            );
        })
        .catch(err=>{
            console.error(`An error occured in initializing module ${MOD.modInfo.name}`);
            console.debug(err);
            return false;
        })
        return p;
    } catch (error) {
        console.error(`An error occured in loading module at ${modulePath}`)
        console.debug(error)
        return new Promise((r,rj)=>{
            r(false);
        });
    }
}

// Async load func
async function RegisterModules() {
    let promises: Promise<boolean>[] = []
    // Gather promises
    for (const modPath of config.installed_modules) {
        promises.push(registerModule("./modules/"+modPath, app, config));
    }

    // Load async
    await Promise.all(promises);
    console.log("Loaded the following modules:");
    for (const mod of app.loaded_modules){
        console.log("\t" + mod.modInfo.name)
    }
}


// Start the bot server
// Note, once dc calls back as 'ready' all other module loading etc. takes place
// Thus called last
console.log("Logging in with" + secrets["discord-api-token"]);
dc.login(secrets["discord-api-token"]);

