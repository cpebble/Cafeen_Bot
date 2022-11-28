// Libs
const Discord = require("discord.js");
// Setup express baseline app
const Express = require("express")
const express_app = Express();
const http = require("http");
const express_server = http.createServer(express_app);
express_app.use(Express.static("site"));
// Setup socket.io baseline app
const { Server } = require("socket.io");
const io = new Server(express_server);

// Discord stuffs
const dc = new Discord.Client();
const secrets = require("./secrets.json");
const utils = require("./utils/utils.js");

// Config init
let config = undefined;
let uptime = undefined;


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

let app = {
    // A set of baseline commands
    "commands": {
        "loaded_modules": ((msg, cmd)=>{
            res = ""
            for (const mod of app.loaded_modules)
                res += `# Module: [${mod.name}]\n${mod.info}\n`
            return res
        }),
        "loaded_commands": ((msg,cmd)=>{
            res = ""
            for (const mod in app.commands)
                res += `# Command: ${mod}\n`
            return res
        }),
        "github": ((msg,cmd)=>{
            return "https://github.com/cpebble/cafeen_bot"
        }),
        "uptime": ((msg, cmd)=>{
            return utils.timeSince(uptime);
        }),
    },
    "loaded_modules": [],
    "active_guild": "nyi",
    "express_app": express_app,
    "io": io,
    "dc": dc
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

// Start the bot server
console.log("Logging in with" + secrets["discord-api-token"]);
dc.login(secrets["discord-api-token"]);


// Exit cleanly
function exitHandler(options, exitCode) {
    if (options.cleanup) {
        // Destroy modules
        console.error("WARNING, Shutdown-handler not defined")
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
    dc.user.setActivity('Your conversations', { type: 'LISTENING' });
    init().then(() => {
        console.log("Main init() reported done");
    })
});

// Startup webserver
express_server.listen(3000, ()=>{
    "Web server loaded"
});

async function init() {
    uptime = Date.now();
    // Load the config file
    await RegisterModules();
}


// Load conf before anything else
utils.loadJsonFile("config").then(data => config = data)

// Module loading
/// Wraps a module file to add error-handling, 
async function registerModule(modulePath, app, dc, config) {
    try {
        // Try reading module
        const MOD = require(modulePath);
        if (!("modInfo" in MOD)){
            // Handle missing module Info
            console.warn(`Module at ${modulePath} didn't supply a module info object`)
            MOD.modInfo = {
                "name": `[${modulePath}]`,
                "info": "No info found"
            }
        }

        // If loaded, create promise initializing our mod
        let p = MOD.init(app, dc, config)
        .then(()=>{
            return app.loaded_modules.push({
                "name": MOD.modInfo.name,
                "info": MOD.modInfo.info,
                "module": MOD,
            });
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
    let promises = []
    // Gather promises
    for (const modPath of config.installed_modules) {
        promises.push(registerModule(modPath, app, dc, config));
    }

    // Load async
    await Promise.all(promises);
    console.log("Loaded the following modules:");
    for (const modJSON of app.loaded_modules){
        console.log("\t" + modJSON.name)
    }
}
