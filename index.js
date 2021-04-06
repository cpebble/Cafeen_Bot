// Libs
const Discord = require("discord.js");
const dc = new Discord.Client();
const secrets = require("./secrets.json");
const fs = require("fs");
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ">>"
});
const utils = require("./utils.js");

// Env Vars
const filter = (reaction, user) =>{
    return reaction.emoji.name.startsWith("bonk");
}
let hornyLimit = 5;
let collectorOptions = {time: 60*60*1000, max: 1};
let collectors = [];
let config = undefined;
let activeGuild = undefined;

// Init code
let jail = {};
function loadJailFile(){
    fs.readFile('jail.json', (err, data)=>{
        if (err) throw err;
        jail = JSON.parse(data);
        console.log("Loaded Jail File");
    })
}
let scoreboard = {};
utils.loadJsonFile("scoreboard")
.then((data)=>
    scoreboard = data
)
loadJailFile();
let quotes = [];
function loadQuoteFile(){
    fs.readFile('quotes.json', (err, data)=>{
        if (err) throw err;
        quotes = JSON.parse(data);
        console.log("Loaded quotes File");
    });
}
loadQuoteFile();

// Save the config file
function exitHandler(options, exitCode){
    if (options.cleanup){
        fs.writeFileSync("config.json", JSON.stringify(config));
        fs.writeFileSync("jail.json", JSON.stringify(jail));
        fs.writeFileSync("scoreboard.json", JSON.stringify(scoreboard));
        fs.writeFileSync("quotes.json", JSON.stringify(quotes));
    } 
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit){
        console.log("Exit cleanly");
        process.exit();
    } 
}

function jailCleanup(){
    let toRemove = [];
    for(let i = 0; i < jail.length; i++){
        // Check if they should be let out of jail
        let dT = Date.now();
        if (dT > jail[i].freedom) {
            console.log(`User ${jail[i].username} has been jailed for ${dT / 1000} seconds, \
and will now be released`);
            toRemove.push(i);
            letUserOut(jail[i]);
        }
    }
    toRemove = toRemove.reverse();
    for(let i = 0; i < toRemove.length; i++){
        jail.splice(toRemove[i], 1);
    }
}

setInterval(jailCleanup, 5000);

async function letUserOut(jailed){
    if (activeGuild == undefined) return;
    let id = jailed.id;
    let member = await activeGuild.members.fetch(id);
    let role = jailed.role; // To ensure promise is fulfilled
    let roleObj = await activeGuild.roles.fetch(role);
    console.log(`Letting out ${id} with member: ${member}`);
    member.roles.remove(roleObj);
}

async function markUser(user, member, roleCfg){
    let id = user.id;
    let username = user.username;
    member.guild.roles.fetch(roleCfg.roleid).then((roleObj)=>{
        let jailCfg = {"id": id, "username": username, "timestamp": Date.now(), "freedom": Date.now()+roleCfg.timeout, "role": roleCfg.roleid}
        jail.push(jailCfg)
        member.roles.add(roleObj);
        console.log(`Jailed ${username} with ${roleCfg.name}`)
    });
}

function handleCommandMessage (message, cmd){
    let response = handleCommand(cmd);
    message.channel.send(response);
}

// Listeners
dc.on("message", message=>{
    if (activeGuild == undefined){
        activeGuild = message.guild;
    }
    if (message.content.startsWith("^")){
        let cmd = message.content.substring(1)
        console.log(`Got command: ${cmd}`);
        handleCommandMessage(message, cmd);
    } else {
        config.roles.forEach(role=>{
            let filter = (reaction, user) =>{
                return reaction.emoji.name == (role.emoji);
            }
            let collector = message.createReactionCollector(filter, collectorOptions);
            collector.on("end", (collected, reaction)=>{
                if (reaction === "limit"){
                    console.log("Finished collecting bonks");
                    // Ban this Bonk
                    let user = collected.first()["message"]["author"];
                    let member = collected.first()["message"]["member"];
                    markUser(user, member, role);
                }
                
            });
            collectors.push(collector);
        });
    }
});

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
let months = [
    "Januar",
    "Februar",
    "Marts",
    "April",
    "Maj",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "December"
]
function getRandomQuote(){
    let i = getRandomInt(quotes.length);
    let q = quotes[i];
    let timestamp = new Date(q[2]);
    return `${q[0]} sagde "${q[1]}" \nDet herrens år ${timestamp.getUTCFullYear()}, sådan omkring ${months[timestamp.getMonth()]}`;
}

// This handles input from either cli or bot dm
function handleCommand(cmd){
    let cmdArg = cmd.split(" ")
    switch (cmdArg[0]){
        case 'reload_conf':
            loadConfigFile();
            return "Reload conf started";
            break;
        case 'reload_jail':
            loadJailFile();
            jailCleanup();
            return "Reload jail started";
            break;
        case 'reload_scores':
            return "Reload scores broken";
            break;
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
        case 'citat':
            if (cmdArg.length > 2){
                let quotee = cmdArg[1];
                let quote = cmdArg.splice(2).join(" ");
                quotes.push([quotee, quote, Date.now()]);
                return "Det er noteret";
            } else {
                return getRandomQuote();
            }
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
rl.prompt();
rl.on('line', (line)=>{
    let res = handleCommand(line.trim());
    console.log(res);
    rl.prompt();
})
// Exit binds
process.on('exit', exitHandler.bind(null,{cleanup:true, exit: true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {cleanup:true,exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

utils.loadJsonFile("config").then(data=>config = data)

dc.once("ready", ()=>{
    console.log("Discord ready");
    dc.user.setActivity('Your conversations', { type: 'LISTENING' });
    init().then(()=>{
        console.log("Main init() reported done");
    })
});
async function init(){
// Load the config file
    activeGuild = undefined;
    await RegisterModules()
}

// Module loading
const Scoreboard = require("./scoreboard")
async function RegisterModules(){
    await Scoreboard.init(dc, config)
}
