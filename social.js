const utils = require("./utils");

let socialRole = "875062048533401680"
let socialRoleObj = undefined;

function handleSocialRole (msg, cmd){
    let user = msg.author.id;
    let member = msg.member;
    let carr = cmd.split(" ");
    //let roleObj = member.guild.roles.fetch(socialRole).then((roleObj)
    if (carr[1] == "yes"){
        member.roles.add(socialRole);
        return "Du er monster social";
    } else if (carr[1] == "no"){
        member.roles.remove(socialRole);
        return "Ok, tag hjem til din kælder";
    }
    return 'Please sig \"Yes\" eller "No"';

}

async function init(app, dc, config){
    //utils.registerCommandFun(app, "unlock_jail", unJailAll);
    //utils.registerCommandFun(app, "why", why);
    utils.registerCommandFun(app, "socialrole", handleSocialRole);

}
async function destroy(dc, config){

}
module.exports = {
    "init": init,
    "destroy": destroy
}
