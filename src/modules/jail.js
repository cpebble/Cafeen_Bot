const { getMessageLink } = require("../utils/utils");
const utils = require("../utils/utils");
const fs = require("fs")
let jail = [];
let collectorOptions = {time: 60*60*1000, max: 1};
let collectors = [];
let activeGuild = undefined;

// Set users role
async function markUser(user, member, message, roleCfg){
    let id = user.id;
    let username = user.username;
    let messagelink = getMessageLink(message);
    member.guild.roles.fetch(roleCfg.roleid).then((roleObj)=>{
        let jailCfg = {
            "id": id,
            "username": username,
            "emoji": roleCfg.emoji,
            "timestamp": Date.now(),
            "freedom": Date.now()+roleCfg.timeout,
            "role": roleCfg.roleid,
            "messagelink": messagelink
        }
        jail.push(jailCfg)
        member.roles.add(roleObj);
        console.log(`Jailed ${username} with ${roleCfg.name}[${messagelink}]`)
    });
}
// Proc for removing role
async function letUserOut(jailed){
    if (activeGuild == undefined) return;
    let id = jailed.id;
    let member = await activeGuild.members.fetch(id);
    let role = jailed.role; // To ensure promise is fulfilled
    let roleObj = await activeGuild.roles.fetch(role);
    console.log(`Letting out ${id} with member: ${member}`);
    member.roles.remove(roleObj);
}

const whyFlavorText = [
    "du har været så vovet at skrive",
    "Natasha kedede sig",
    "således skrev Jon Sporring",
    "Thea kedede sig",
    "Påbøl er en unfair botmager",
    "Arinrinrin kørte dig over i sin lastbil",
    "din mor ringede til os og bad os pænt",
    "du gav consent til veganske vampyre",
    "du lod rus styre musikken",
    "discord ikke ville lade dig skrive",
    "jeg siger det",
    "jeg blev offended af det her",
    "jeg blev triggered af det her",
    "det her virker som fysiker-propaganda",
    "ingen syntes det her var sjovt",
    "Thea blev skræmt af en rus",
    "en rus blev stødt og meldte dig til KU",
    "Påbøl sagde noget dumt"
]
function why(message, cmd){
    let userId = message.author.id;
    // Get a list of jail sentences
    let sentences = jail.filter(sent=> sent.id == userId);
    let sentenceFieldArr = sentences.map(sent=>{
        let r = message.guild.roles.cache.get(sent.role);
        let i = utils.getRandomInt(whyFlavorText.length);
        let flavortxt = whyFlavorText[i];
        return {
            "name": `${r.name}`,
            "value": `Du har fået :${sent.emoji}: fordi [${flavortxt}](${sent.messagelink})`
        }
    });
    // Early exit
    if (sentenceFieldArr.length == 0){
        return "Du 100p clean af"
    }

    let retval = sentenceFieldArr.join("\n")
    let embed = {
        "title": "Du ved jo godt hvorfor",
        "description": "*Ifølge mine noter har du følgende domme*",
        "color": 3207707,
        "fields": sentenceFieldArr,
    }
    message.channel.send("", {embed})
    return "";
}

// Check if any roles should be removed
function jailCleanup(){
    let toRemove = [];
    // Loop over the whole jail
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
    // To fix indexing
    toRemove = toRemove.reverse();
    for(let i = 0; i < toRemove.length; i++){
        // Weird splice hack since objects are unsorted
        jail.splice(toRemove[i], 1);
    }
}

function unJailAll(msg, cmd){
    if(msg.author.id != "333007839637536771")
        return "Only 4 good boys";
    
    let toRemove = [];
    for(let i = 0; i < jail.length; i++){
        letUserOut(jail[i]);
        toRemove.push(i);
    }
    toRemove = toRemove.reverse();
    for(let i = 0; i < toRemove.length; i++){
        // Weird splice hack since objects are unsorted
        jail.splice(toRemove[i], 1);
    }
    return "Release the people"
}

async function init(app, dc, config){
    // load jail file
    jail = await utils.loadJsonFile("utils/jail");
    // Check for cleanups
    setInterval(jailCleanup, 5000);
    // init acG
    // Bad
    //activeGuild = app["active_guild"];

    utils.registerCommandFun(app, "unlock_jail", unJailAll);
    utils.registerCommandFun(app, "why", why);

    // Set up message listener
    dc.on("message", (message)=>{
        // This should be better
        if (activeGuild == undefined){
            activeGuild = message.guild;
        }
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
                    markUser(user, member, message, role);
                }
                
            });
            collectors.push(collector);
        });
    });

}
async function destroy(dc, config){
    let f = JSON.stringify(jail);
    try {
        console.log(fs.writeFileSync("jail.json", f));
    } catch (error) {
        console.log(error)
    }
}
module.exports = {
    "modInfo": {
        "name": "Not-So-Horny Jail",
        "info": "Originally made to :bonk: Rumle and Simba. Now mostly for hygge"
    },
    "init": init,
    "destroy": destroy
}