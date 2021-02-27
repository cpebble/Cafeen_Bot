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

// Env Vars
const filter = (reaction, user) =>{
    return reaction.emoji.name.startsWith("bonk");
}
let hornyLimit = 5;
let collectorOptions = {time: 60*60*1000, max: 1};
let scoreboardCollectorOptions = {time: 24*60*60*1000, max: 1};
let collectors = [];
let config = undefined;
let activeGuild = undefined;

// Init code
dc.once("ready", ()=>{
    console.log("ready");
    dc.user.setActivity('Your conversations', { type: 'LISTENING' });
});
// Load the config file
function loadConfigFile(){
    fs.readFile('config.json', (err, data)=>{
        if (err) throw err;
        config = JSON.parse(data);
        console.log("Loaded Config File");
        console.log(config);
        activeGuild = undefined;
    })
}
loadConfigFile();
let jail = {};
function loadJailFile(){
    fs.readFile('jail.json', (err, data)=>{
        if (err) throw err;
        jail = JSON.parse(data);
        console.log("Loaded Jail File");
    })
}
loadJailFile();
let scoreboard = {};
function loadScoreboardFile(){
    fs.readFile('scoreboard.json', (err, data)=>{
        if (err) throw err;
        scoreboard = JSON.parse(data);
        console.log("Loaded Scoreboard File");
    })
}
loadScoreboardFile();

// Save the config file
function exitHandler(options, exitCode){
    if (options.cleanup){
        fs.writeFileSync("config.json", JSON.stringify(config));
        fs.writeFileSync("jail.json", JSON.stringify(jail));
        fs.writeFileSync("scoreboard.json", JSON.stringify(scoreboard));
    } 
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit){
        console.log("Exit cleanly");
        process.exit();
    } 
}

setInterval(()=>{ // Jailed clean-up
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
}, 5000);

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

function onReactScoreboard(reaction, user){
    console.log("HERE");
    let emoji = reaction.emoji.name.toLowerCase();
    if (emoji in scoreboard){
        let member = reaction["message"]["member"];
        let id = member.id;
        let username = member.nickname;
        if (id in scoreboard[emoji]){
            scoreboard[emoji][id]["score"] += 1;
        }
        else{
            scoreboard[emoji][id] = {
                "username": username,
                "score": 1
            }
        }
        console.log(`User ${username} now has emoji ${emoji} score ${scoreboard[emoji][id]["score"]}`)
    }
}

function generateScoreboard(){
    let output = "Cafeens Scoreboard \n";
    for (let emoji in scoreboard){
        output += `**${emoji}**\n`
        // convert dict to array
        var sortable = [];
        for (let user in scoreboard[emoji]) {
            sortable.push([user, scoreboard[emoji][user]]);
        }
        let scores = sortable.sort((a, b)=>{
            return b[1].score - a[1].score
        });
        for (let i = 0; i < scores.length; i++){
            output += `${scores[i][1]["username"]}: ${scores[i][1]["score"]}\n`
        }
        output += "###############################\n"
    }
    return output;
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
    if (message.content.startsWith("$")){
        let cmd = message.content.substring(1)
        console.log(`Got command: ${cmd}`);
        handleCommandMessage(message, cmd);
    } else {

        message.createReactionCollector(()=>true, scoreboardCollectorOptions).on("collect", onReactScoreboard);
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


// This handles input from either cli or bot dm
function handleCommand(cmd){
    switch (cmd){
        case 'reload_conf':
            loadConfigFile();
            return "Reload conf started";
            break;
        case 'reload_jail':
            loadJailFile();
            return "Reload jail started";
            break;
        case 'save_scores':
            fs.writeFileSync("scoreboard.json", JSON.stringify(scoreboard));
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
            return generateScoreboard();
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
