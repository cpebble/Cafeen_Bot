import { BotModule } from "./modules/interface";
import { Express } from "express";
import { Server } from "socket.io";
import { Client, Message} from "discord.js";
import { Sequelize } from "sequelize"
import { User } from "discord.js";

type BotCommand = ((msg: Message, cmd: String) => (String | void))
export interface IApp {
    commands: {[index: string]: BotCommand};
    loaded_modules: BotModule[];
    active_guild: any;
    express_app: Express;
    blacklist: User[];
    io: Server;
    dc: Client;
    started: Number;

}