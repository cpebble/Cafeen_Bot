// Libs
const Discord = require("discord.js");
const fs = require("fs");
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


function handleCommandMessage(message, cmd) {
    let response = handleCommand(cmd);
    message.channel.send(response);
}

// Listeners
dc.on("message", message => {
    if (message.content.startsWith(config.command_char)) {
        let cmd = message.content.substring(1)
        console.log(`Got command: ${cmd}`);
        handleCommandMessage(message, cmd);
    } else {
        // I guess do nothing
    }
});

// This handles input from either cli or bot dm
function handleCommand(cmd) {
    let cmdArg = cmd.split(" ")
    switch (cmdArg[0]) {
        // case 'reload_conf':
        //     loadConfigFile();
        //     return "Reload conf started";
        //     break;
        // case 'reload_jail':
        //     loadJailFile();
        //     jailCleanup();
        //     return "Reload jail started";
        //     break;
        // case 'reload_scores':
        //     return "Reload scores broken";
        //     break;
        case 'save_scores':
            Scoreboard.saveScores()
            return "Saved score file"
            break;
        case 'github':
            return 'https://github.com/cpebble/Cafeen_Bot'
            break;
        case 'exit':
            process.exit();
            break;
        case 'score':
            // Generate scoreboard
            return Scoreboard.generateScoreboard();
        case 'help':
            return `
**Commands:**
\`score\`: List scoreboard
\`save_scores\`: Save scores to file(debug)
\`github\`: View source code
\`help\`: This list
\`reload_jail\`: Mostly for if people are stuck in a specific role
            `
        default:
            return `Unrecognized command "${cmd}"`;

    }
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
async function init() {
    // Load the config file
    await RegisterModules();
}

// Load conf before anything else
utils.loadJsonFile("config").then(data => config = data)

// Module loading
const Scoreboard = require("./scoreboard");
const Quotes = require("./quotes");
const Jail = require("./jail");

// Async load func
async function RegisterModules() {
    // Gather promises
    let sP = Scoreboard.init(dc, config);
    let qP = Quotes.init(dc, config);
    let jP = Jail.init(dc, config);
    // Load async
    await Promise.all([sP, qP, jP]);
}
