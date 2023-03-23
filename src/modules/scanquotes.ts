import { BotModule } from "./interface";
import { IApp } from "../IApp";
import * as DC from "discord.js";
import utils from "../utils/utils";
import { open, writeFile } from "fs/promises";
import { writeFileSync } from "fs";
import { Quote } from "./quotes";

async function main(msg: DC.Message, cmd) {
    let qArr = msg.content.split(" ");
    let earliest = '817487078974554163';
    try {
        console.log(earliest)
        let c: DC.TextChannel = 
            await <Promise<DC.TextChannel>>msg.client.channels.fetch(qArr[1])
        let running = true;
        let foundQuotes = []
        let i = 0;
        while (running) {
            i++;
            if (i > 60) {
                console.log("Ran i > 50 times");
                break;
            };
            let batch = await c.messages.fetch({
                after: earliest,
            });
            if (batch.size == 0) {
                console.log("No more batches");
                running = false;
            } else {
                for (const pair of batch) {
                    if (parseInt(pair[0]) > parseInt(earliest)) {
                        earliest = pair[0];
                    } else if (pair[0] == earliest) {
                        console.log("Completed")
                        running = false;
                        break;
                    }
                    let v = pair[1];
                    if (!(v.content.split(" ").length > 2
                        && v.content.startsWith("$citat"))) continue;
                    let qA = v.content.split(" ");
                    let quotee = qA[1];
                    let quote = qA.splice(2).join(" ");
                    foundQuotes.push([quotee, quote, v.id]);
                }
                console.log(`Processed ${i} batch of size ${batch.size}. Quotes: ${foundQuotes.length}, earliest: ${earliest}`);
            }
        }

        writeFileSync("collected.json", JSON.stringify(foundQuotes));
        foundQuotes.forEach((q => {
            let qm = new Quote({Snowflake: q[2], Author: q[0], Text: q[1]});
            qm.save();
        }))
    } catch (error) {
        console.log(error)
    }
    // while(running) {
    //     .then(return )

    // }
}


export class Module implements BotModule {
    public modInfo = {
        name: "Scan Quotes Module",
        info: "Simple lol"
    };

    async init(app: IApp, config: any) {
        utils.registerCommandFun(app, "scan", (m, c) => { main(m, c); return "Started" })
    }
    async destroy(app: IApp, config: any) { };
}