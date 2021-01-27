// Libs
const Discord = require("discord.js");
const dc = new Discord.Client();
const secrets = require("./secrets.json");
const fs = require("fs");

// Env Vars
const filter = (reaction, user) =>{
    return reaction.emoji.name.startsWith("bonk");
}
let hornyLimit = 5;
let hornyOptions = {time: 10*1000, max: 1};
let collectors = [];
let config = undefined;

// Init code
dc.once("ready", ()=>{
    console.log("ready with config:");
    console.log(config);
});
// Load the config file
fs.readFile('config.json', (err, data)=>{
    if (err) throw err;
    config = JSON.parse(data);
})
// Save the config file
function exitHandler(options, exitCode){
    if (options.cleanup){
        fs.writeFileSync("config.json", JSON.stringify(config));
    } 
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

setInterval(() => { // Collector clean-up
    collectors.forEach(val=>{
        // console.log(`Found collector: ${val}`);
        // console.log(`Has ended: ${val.ended}`);
    })
}, 5000);

setInterval(()=>{ // Jailed clean-up
    let toRemove = [];
    for(let i = 0; i < config.jailed.length; i++){
        // Check if they should be let out of jail
        let dT = Date.now() - config.jailed[i].timestamp;
        if (dT > config.jail_time) {
            console.log(`User ${config.jailed[i].username} has been jailed for ${dT / 1000} seconds, \
and will now be released`);
            toRemove.push(i);
            letUserOut(config.jailed[i]);
        }
    }
}, 5000);

// Functions
function userTooHorny(user, member){
    console.log("User too horny:")
    let id = user.id;
    let username = user.username;
    let roles = [];
    member.roles.cache.each(role =>{
        roles.push({"id": role.id, "name": role.name});
    });

    // We need to remember this users
    let jailConfig = {"id": id, "username": username, "timestamp": Date.now(), "roles": roles}
    console.log(jailConfig);
    config.jailed.push(jailConfig);
}
function letUserOut(jailCfg){

}

function handleReactCollect(reaction, user){
    console.log("Got Bonk")
}
function handleReactEnd(collected, reaction) {
    console.log("Finished collecting bonks");
    if (reaction === "time"){
        // Timed out
    }
    else if (reaction === "limit"){
        // Ban this Bonk
        let user = collected.first()["message"]["author"];
        let member = collected.first()["message"]["member"];
        userTooHorny(user, member);
        
    }

}

// Listeners
dc.on("message", message=>{
    if (message.content.startsWith("8=D")){
        console.log(`Got command: ${message.content}`);
        // TODO: Expand
    } else {
        //console.log(message.content);
        let collector = message.createReactionCollector(filter, hornyOptions);
        collectors.push(collector);
        collector.on("collect", handleReactCollect);
        collector.on("end", handleReactEnd);
    }
});


// Start the bot server
console.log("Logging in with" + secrets["discord-api-token"]);
dc.login(secrets["discord-api-token"]);
// Exit binds
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
