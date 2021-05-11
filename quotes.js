const utils = require("./utils");
const fs = require("fs")
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

    //
    dc.on("message", message=>{
        if (message.content.startsWith(config.command_char + "citat")){
            // Message split into array
        }
    })

}

async function destroy(dc, config){
    fs.writeFileSync("quotes.json", JSON.stringify(quotes));
}

module.exports = {
    "init": init,
    "destroy": destroy,
}