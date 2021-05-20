// Libs
const Discord = require("discord.js");
const fs = require("fs");
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
const readline = require("readline");
const dc = new Discord.Client();
const secrets = require("./secrets.json");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ">>"
});
const utils = require("./utils.js");

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
        }
    } else {
        // I guess do nothing
    }
});

let app = {
    "commands": {
        "save_scores": ((msg,cmd)=>{
            Scoreboard.saveScores();
            return "Save_scores started"
        }),
        "github": ((msg,cmd)=>{
            return "https://github.com/cpebble/cafeen_bot"
        }),
        "uptime": ((msg, cmd)=>{
            return utils.timeSince(uptime);
        })
    },
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
    if (cmdfun != undefined)
    {
        response = cmdfun(msg, cmd)
    }
    else
    {
        response = "OwO you typed an oopsie woopsie";
    }
    return response;
}

// Start the bot server
console.log("Logging in with" + secrets["discord-api-token"]);
dc.login(secrets["discord-api-token"]);
// TODO: Fix
rl.prompt();
rl.on('line', (line) => {
    let res = handleCommand(line.trim());
    console.log(res);
    rl.prompt();
});
// Exit cleanly
function exitHandler(options, exitCode) {
    if (options.cleanup) {
        // Destroy modules
        fs.writeFileSync("config.json", JSON.stringify(config));
        Scoreboard.destroy(dc, config);
        Quotes.destroy(dc, config);
        Jail.destroy(dc, config);
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
const Scoreboard = require("./scoreboard");
const Quotes = require("./quotes");
const Jail = require("./jail");
const Dyrestalden = require("./dyrestalden")
const Random = require("./random");

// Async load func
async function RegisterModules() {
    // Gather promises
    let sP = Scoreboard.init(app, dc, config);
    let qP = Quotes.init(app, dc, config);
    let jP = Jail.init(app, dc, config);
    let rP = Random.init(app, dc, config);
    // Load async
    await Promise.all([sP, qP, jP, rP]);
}
