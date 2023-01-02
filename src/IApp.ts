import { BotModule } from "./modules/interface";
import { Express } from "express";
import { Server } from "socket.io";
import { Client } from "discord.js";
import { Sequelize } from "sequelize"

export interface IApp {
    commands: object;
    loaded_modules: BotModule[];
    active_guild: any;
    express_app: Express;
    io: Server;
    dc: Client;
    db: Sequelize;
    started: Number;

}