const utils = require("./utils");
const Discord = require("discord.js");
const fs = require("fs")

// Env vars
let scoreboardCollectorOptions = { time: 24 * 60 * 60 * 1000, max: 32 };

// SaveLoad
let scoreboard = {};

// Register a local copy of the app
let App = undefined;

function onReactScoreboard(reaction, user){
    let emoji = reaction.emoji.name.toLowerCase();
    if (emoji in scoreboard){
        let member = reaction["message"]["member"];
        let id = member.id;
        let username = member.nickname;
        if (username === null){
            username = member.user.username;
        }
        if (id in scoreboard[emoji]){
            scoreboard[emoji][id]["score"] += 1;
        }
        else{
            scoreboard[emoji][id] = {
                "username": username,
                "score": 1
            }
        }
        App.io.emit("score", {"uid": id, "emoji": emoji})
        console.log(`User ${username} now has emoji ${emoji} score ${scoreboard[emoji][id]["score"]}`)
    }
}

function ratio(msg, cmd) {
    let uid = msg.author.id;
    let naughty = scoreboard["bonk"][uid];
    if (naughty === undefined) {
        return "Du jo slet ikke fræk";
    }
    let nice = scoreboard["upyolo"][uid];
    if (nice === undefined) {
        return "Du jo slet ikke sød";
    }
    let ratioNum = naughty.score / nice.score;
    let flavortxt = ""
    if (ratioNum < 0.3)
        flavortxt = "super uskyldig";
    else if (ratioNum < 0.6)
        flavortxt = "basically clean";
    else if (ratioNum < 0.9)
        flavortxt = "stadig på min gode side <3";
    else if (ratioNum < 1.1)
        flavortxt = "true neutral";
    else if (ratioNum < 1.4)
        flavortxt = "slightly slesk";
    else if (ratioNum < 1.7)
        flavortxt = "stadig bedre end Simba";
    else
        flavortxt = "Simba"

    return `Ifølge mine udregninger er du ${flavortxt} [${ratioNum.toFixed(2)}]`
}

function saveScores(){
    fs.writeFileSync("scoreboard.json", JSON.stringify(scoreboard));
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
        for (let i = 0; i < Math.min(scores.length, 3); i++){
            output += `${scores[i][1]["username"]}: ${scores[i][1]["score"]}\n`
        }
        output += "###############################\n"
    }
    return output;
}
function generatePrettyScoreboard(msg, cmd) {
    let embed = new Discord.MessageEmbed();
    embed.setColor("#fce303")
        .setTitle("Cafeens Scoreboard")
        .setURL("https://cafeen.cshare.dk/");
    for (let emoji in scoreboard) {
        var sortable = [];
        for (let user in scoreboard[emoji]) {
            sortable.push([user, scoreboard[emoji][user]]);
        }
        let scores = sortable.sort((a, b) => (b[1].score - a[1].score));
        if(scores == undefined || scores.length == 0){
            continue;
        }
        let field = {
            "name": emoji,
            "value": "",
        };
        let top = scores.slice(0, 3);
        let length = 0;
        for (let i = 0; i < top.length; i++)
            length = Math.max(length, scores[i][1]["username"].length)
        for (let i = 0; i < top.length; i++){
            field.value += `${top[i][1]["score"]}: ` +
                `${top[i][1]["username"]}\n`
        }
        embed.addFields(field);
    }
    return embed;
}

function grant(msg, cmd){
    if(msg.author.id != "333007839637536771" && msg.author.id != "98033868837232640")
        return "Only for påbøl and thea";
    // Get which id
    if(msg.mentions.users.size != 1)
        return "Til hvem though?";
    let user = msg.mentions.users.first();
    let id = user.id;
    // Now parse command arguments
    let cmdargs = cmd.split(" ");
    if (cmdargs.length != 4)
        return "Oh no, you did an oopsie woopsie with arguments"
    let emoji = cmdargs[2];
    let score = parseInt(cmdargs[3]);
    // Check those command args
    if(!(emoji in scoreboard))
        return "Unknown emoji"
    if (isNaN(score))
        return "Jeg aner ikke hvad du prøver på at give"
    
    if (id in scoreboard[emoji]){
        scoreboard[emoji][id]["score"] += score;
    }
    else{
        console.log("adding");
        let username = msg.member.nickname
        console.log(username)
        scoreboard[emoji][id] = {
            "username": username,
            "score": score
        }
    }


    console.log(`granting: ${user.id}, ${emoji}, ${score}`);
    return "Ok"
}

async function init(app, dc, config) {
    scoreboard = await utils.loadJsonFile("scoreboard");
    // Register command function
    utils.registerCommandFun(app, "score", generatePrettyScoreboard);
    utils.registerCommandFun(app, "ratio", ratio);
    utils.registerCommandFun(app, "grant", grant);
    dc.on("message", message => {
        message.createReactionCollector(() => true, scoreboardCollectorOptions).on("collect", onReactScoreboard);
    });

    // app.express_app.get("/", (req,res)=>{
    //     res.sendFile(__dirname + "/site/index.html")
    // });
    app.io.on("connection", (socket)=>{
        console.log("Socket connected");
        socket.emit("scoreboard", scoreboard)
    });
    App = app;
}
async function destroy(dc, config){

    fs.writeFileSync("scoreboard.json", JSON.stringify(scoreboard));
}


module.exports = { "init": init, "destroy": destroy, "saveScores": saveScores, "generateScoreboard": generateScoreboard }