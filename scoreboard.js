const utils = require("./utils");

// Env vars
let scoreboardCollectorOptions = { time: 24 * 60 * 60 * 1000, max: 32 };

// SaveLoad
let scoreboard = {};

function onReactScoreboard(reaction, user){
    console.log("HERE");
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
        console.log(`User ${username} now has emoji ${emoji} score ${scoreboard[emoji][id]["score"]}`)
    }
}

async function init(dc, config) {
    scoreboard = await utils.loadJsonFile("scoreboard");
    dc.on("message", message => {
        message.createReactionCollector(() => true, scoreboardCollectorOptions).on("collect", onReactScoreboard);
    })
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
        for (let i = 0; i < Math.min(scores.length, 5); i++){
            output += `${scores[i][1]["username"]}: ${scores[i][1]["score"]}\n`
        }
        output += "###############################\n"
    }
    return output;
}

module.exports = { "init": init, "saveScores": saveScores, "generateScoreboard": generateScoreboard }