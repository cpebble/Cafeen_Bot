const utils = require("./utils");
const fs = require("fs");
const Discord = require("discord.js");
const { genQuote } = require("./inspirational");
// Global quote list
let quotes;
// Env vars
let months = [
    "Januar",
    "Februar",
    "Marts",
    "April",
    "Maj",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "December"
]
let App;

// Registers a quote into the list
async function registerQuote(quote, quotee){
    quotes.push([quotee, quote, Date.now()]);
}
function quoteMsgFun(message, cmd){
    let qArr = message.content.split(" ")

    // Check if we should record or remember
    if (qArr.length > 2){
        // Get Quote
        let quotee = qArr[1];
        let quote = qArr.splice(2).join(" ");
        // Async register
        registerQuote(quote, quotee).then(()=>{
            message.channel.send("Det er noteret");
            
        })
    } else {
        getRandomQuote()
        .then(quote=>{
            message.channel.send(quote)
        })
    }
    return ""
}

function saveQuotes(message, cmd){
    fs.writeFileSync("quotes.json", JSON.stringify(quotes));
    return "Jeg har skrevet mine noter ned"
}

function sendInspQuote(msg, cmd) {
    let i = utils.getRandomInt(quotes.length);
    let q = quotes[i];
    genQuote(q[1], q[0])
        .then((canvas) => {
            const attachment = new Discord.MessageAttachment(canvas.toBuffer(), "smukt.png");
            msg.channel.send("Her er din nye wallpaper", attachment);
        });
    return "";
}

// Read a random quote
async function getRandomQuote(){
    let i = utils.getRandomInt(quotes.length);
    let q = quotes[i];
    let timestamp = new Date(q[2]);
    return `${q[0]} sagde "${q[1]}" \nDet herrens år ${timestamp.getUTCFullYear()}, sådan omkring ${months[timestamp.getMonth()]}`;
}

async function init(app, dc, config){
    // Load quote file
    quotes = await utils.loadJsonFile("quotes");
    // Register command handler
    utils.registerCommandFun(app, "citat", quoteMsgFun);
    utils.registerCommandFun(app, "save_quotes", saveQuotes)
    utils.registerCommandFun(app, "inspire", sendInspQuote);

    App = app;
    app.io.on("fetch_quotes", (socket)=>{
        socket.emit("quotes", quotes);
    });

}

async function destroy(dc, config){
    let rand = saveQuotes();
}

module.exports = {
    "init": init,
    "destroy": destroy,
}
