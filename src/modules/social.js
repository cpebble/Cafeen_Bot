const utils = require("../utils/utils");

let socialRole = "875062048533401680";
let movieRole = "894562803069911050";

function handleSocialRole (msg, cmd){
    let user = msg.author.id;
    let member = msg.member;
    let carr = cmd.split(" ");
    if (carr[1] == "yes"){
        member.roles.add(socialRole);
        return "Du er monster social";
    } else if (carr[1] == "no"){
        member.roles.remove(socialRole);
        return "Ok, We're gonna miss u~~~ :'(";
    }
    return 'Please sig \"Yes\" eller "No"';
}

function handleMovieRole (msg, cmd){
    let user = msg.author.id;
    let member = msg.member;
    let carr = cmd.split(" ");
    if (carr[1] == "yes"){
        member.roles.add(movieRole);
        return "Dårlig film Ja-Tak";
    } else if (carr[1] == "no"){
        member.roles.remove(movieRole);
        return "Så du har fået nok ~amazing~ film?";
    }
    return 'Please sig \"Yes\" eller "No"';

}

async function init(app, dc, config){
    utils.registerCommandFun(app, "movierole", handleMovieRole);
    utils.registerCommandFun(app, "socialrole", handleSocialRole);
}
async function destroy(dc, config){
    // Nothing really to be done here

}
module.exports = {
    "modInfo": {
        "name": "SocialRole",
        "info": "Maintains roles with $movierole and $socialrole (yes/no)"
    },
    "init": init,
    "destroy": destroy
}
