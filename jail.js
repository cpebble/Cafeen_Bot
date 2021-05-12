const utils = require("./utils");
let jail = {};
let collectorOptions = {time: 60*60*1000, max: 1};
let collectors = [];
let activeGuild = undefined;

// Set users role
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
    jail = await utils.loadJsonFile("jail");
    // Check for cleanups
    setInterval(jailCleanup, 5000);
    // init acG
    // Bad
    //activeGuild = app["active_guild"];

    utils.registerCommandFun(app, "unlock_jail", unJailAll);

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
                    markUser(user, member, role);
                }
                
            });
            collectors.push(collector);
        });
    });

}
async function destroy(dc, config){
    fs.writeFileSync("jail.json", JSON.stringify(jail));
}
module.exports = {
    "init": init,
    "destroy": destroy
}