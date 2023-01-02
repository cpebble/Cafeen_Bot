const fs = require("fs");
const Discord = require("discord.js");
const utils = require("../utils/utils");
const { genQuote } = require("../utils/inspirational");
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
    quotes = await utils.loadJsonFile("utils/quotes");
    // Register command handler
    utils.registerCommandFun(app, "citat", quoteMsgFun);
    utils.registerCommandFun(app, "save_quotes", saveQuotes)
    utils.registerCommandFun(app, "inspire", sendInspQuote);

    App = app;
    App.io.on("connection", (socket)=>{
        socket.on("fetch_quotes", ()=>{
            socket.emit("quotes", quotes);
        });
        socket.on("quote_change_text", (qObj)=>{
            // qObj = {index: i, newText: str}
            if (qObj["index"] == undefined ||
                qObj["index"] < 0 ||
                qObj["index"] >= quotes.length ||
                qObj["newText"] == undefined){
                console.log("Error in qObj: " + JSON.stringify(qObj))
            } else{
                let q = quotes[qObj["index"]];
                q[1] = qObj["newText"];
                quotes[qObj["index"]] = q;
                console.log("New quote saved: " + JSON.stringify(q));
            }
        });
        socket.on("quote_change_author", (qObj)=>{
            // qObj = {index: i, newAuthor: str}
            if (qObj["index"] == undefined ||
                qObj["index"] < 0 ||
                qObj["index"] >= quotes.length ||
                qObj["newText"] == undefined){
                console.log("Error in qObj: " + JSON.stringify(qObj))
            } else{
                let q = quotes[qObj["index"]];
                q[0] = qObj["newText"];
                quotes[qObj["index"]] = q;
                console.log("New quote saved: " + JSON.stringify(q));
            }
        });
        socket.on("quote_save", ()=>{
            saveQuotes();
        });
        socket.on("quote_load", ()=>{
            console.log("Tried to load quotes but not available");
        })
        
    });

}

async function destroy(dc, config){
    let rand = saveQuotes();
}

module.exports = {
    "modInfo": {
        "name": "Quotes",
        "info": "Module for handling 'citat' commands"
    },
    "init": init,
    "destroy": destroy,
}
