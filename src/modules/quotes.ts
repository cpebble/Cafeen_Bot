import fs from "fs";
import Discord from "discord.js";
import utils from "../utils/utils";
import { genQuote } from "../utils/inspirational";
import {IApp} from "IApp"
import { BotModule } from "./interface";
import * as SQ from "sequelize-typescript";
import {DBM} from "../utils/db";
// Global quote list
// Deprecated
let quotes: any[];
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
let App: IApp;

// Whether cache is valid
let cacheValid = false;
let pkCache = [];

@SQ.Table
export class Quote extends SQ.Model<Quote> {
    @SQ.AllowNull(false)
    @SQ.Column
    declare Author: string;

    @SQ.Column(SQ.DataType.TEXT)
    declare Text: string;

    @SQ.Column
    declare Snowflake?: string;
}

// Registers a quote into the list
async function registerQuote(quote: string, quotee: string, snowflake: string){
    cacheValid = false;
    let q = new Quote({Author: quotee, Text: quote, Snowflake: snowflake})
    await q.save();
    return true;
}

const quoteFlavorTexts = [
    "Kan i huske dengang ",
    "Alle grinte da ",
    "Jeg var lige ved at tage hjem, indtil ",
    "Var det ikke herre fedt da ",
    "Ingen ved hvad der gik igennem deres hovede da ",
    "Den bedste dag i mit liv, var da ",
    "Gæt en promille da ",
    "De var ikke engang fulde da "
]

function quoteMsgFun(message: Discord.Message, cmd){
    let qArr = message.content.split(" ")
    

    // Check if we should record or remember
    if (qArr.length > 2){
        // Get Quote
        let quotee = qArr[1];
        let quote = qArr.splice(2).join(" ");
        // Async register
        registerQuote(quote, quotee, message.id).then(()=>{
            message.channel.send("Det er noteret");
        })
    } else {
        let fl = quoteFlavorTexts[utils.getRandomInt(quoteFlavorTexts.length)];
        getRandomQuote()
        .then(quote=>{
            message.channel.send(`${fl}${quote.Author} sagde "${quote.Text}"`)
        })
        .catch((err)=>{
            console.warn(err);
            message.channel.send(`I couldn't fetch a quote. Boo Hoo`);
        })
    }
    return ""
}

function saveQuotes(message, cmd){
    return "To be deprecated"
    // fs.writeFileSync("quotes.json", JSON.stringify(quotes));
    // return "Jeg har skrevet mine noter ned"
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
async function getRandomQuote(): Promise<Quote>{
    let pk;
    if (!cacheValid){
        // Refresh cache
        let pks = await Quote.findAll({
            attributes: ["id"]
        });
        pkCache = pks.map(quote => quote.id );
        cacheValid = true;
    }
    pk = pkCache[utils.getRandomInt(pkCache.length)];

    try {
        let q = await Quote.findByPk(pk);
        return q;
    }
    catch (err) {
        console.warn("Couldn't get quote");
        console.debug(err);
        throw err;
    }
    //return `${q[0]} sagde "${q[1]}" \nDet herrens år ${timestamp.getUTCFullYear()}, sådan omkring ${months[timestamp.getMonth()]}`;
}

async function init(app: IApp, config){
    // Load quote file
    // Factor into sql 
    //quotes = await utils.loadJsonFile("utils/quotes");
    // Register command handler

    let t = await DBM.getInstance();
    await t.addModel(Quote);
    console.log("Added Quote model");
    await Quote.sync({alter: true});

    utils.registerCommandFun(app, "citat", quoteMsgFun);
    // Probably does not work anymore
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
    });

}


export class Module implements BotModule {
    public modInfo = { name: "Quotes",
               info: `Module handling "citat" commands` };
    constructor(){

    }
    async init (app: IApp, config){
        // TODO: Run initialization config
        await init(app, config)
        return true;
    }

    async destroy(app: IApp, config){
        // TODO: Shut down gracefully 
        return true;
    }
}