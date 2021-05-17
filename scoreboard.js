const utils = require("./utils");
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

async function init(app, dc, config) {
    scoreboard = await utils.loadJsonFile("scoreboard");
    // Register command function
    utils.registerCommandFun(app, "score", (msg,cmd)=>{
        return generateScoreboard();
    });
    utils.registerCommandFun(app, "ratio", ratio);
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