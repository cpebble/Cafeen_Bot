const utils = require("../utils/utils");
const Discord = require("discord.js");



async function init(app, dc, config) {
    utils.registerCommandFun(app, "howlow", (msg, cmd)=>{
        let carg = cmd.split(" ");
        let i;
        try {
            i = parseInt(carg[1]);
        } catch (error) {
            return "What's my age again?"
        }
        let low = Math.ceil((i / 2)+7);
        let res = `Du kan gå helt ned til ${low}`
        if (low < 20){
            res += "\nDet er jo lige nok til at score rus"
        }
        return res;
    });
    //utils.registerCommandFun(app, "nøgler", (msg, cmd)=>{
        //let description="[Det er simpelthen så nemt](http://mailto:cafe@cafeen.org)";
        //let embed= new Discord.MessageEmbed();
        //embed.setColor("#57e389")
          //.setTitle("Bare tryk her")
          //.setFooter("Vi ses på C?")
          //.setDescription(description);
        //await msg.channel.send("Hello", {embeds: [embed]});
        //console.log("Sent mail link");
        //return embed
    //});

}
async function destroy(){
    return
}

module.exports = {
    "modInfo": {
        "name": "random",
        "info": "Idk, random commands i wanted to get done"
    },
    "init": init,
    "destroy": destroy,
}
