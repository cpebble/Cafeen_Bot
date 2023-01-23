import config from "../config.json";
import * as SQ from "sequelize-typescript";

export class DBM {
    // Singleton
    private static instance: DBM;
    public static async getInstance(): Promise<DBM>{
        // We don't want to be returning an instance unless it's ready
        // Hackish tmpDB Fix
        let tmpDB = DBM.instance;
        if (DBM.instance == undefined)
            tmpDB = DBM.instance = new DBM();
        // Ensure readyness on instance get
        await tmpDB.ready;
        return DBM.instance;
    }

    private sq: SQ.Sequelize;
    private models: SQ.Model[];
    public ready: Promise<any>;

    private constructor(){
        if (DBM.instance){
            console.warn("Initialized singleton twice");
            return DBM.instance;
        }
        this.ready = this.initConnection();
    };
    
    private async initConnection(){
        // Init DB Connection
        this.sq = new SQ.Sequelize(config.db_url)
        await this.sq.authenticate()
    }

    public async addModel(model: SQ.ModelCtor<SQ.Model<any, any>>){
        this.sq.addModels([model]);
    }
    /// Probably shouldn't be used
    public async syncDB(alter: boolean = false){
        return this.sq.sync({alter: alter})
    }
}


// _____ _____ ____ _____ 
//|_   _| ____/ ___|_   _|
//  | | |  _| \___ \ | |  
//  | | | |___ ___) || |  
//  |_| |_____|____/ |_|  

@SQ.Table
class Quote extends SQ.Model<Quote> {
    @SQ.AllowNull(false)
    @SQ.Column
    declare Author: string;
    @SQ.Column(SQ.DataType.TEXT)
    declare Text: string;
    @SQ.Column
    declare Snowflake?: string;
}

(async ()=>{
    let t = await DBM.getInstance();
    await t.addModel(Quote);
    console.log("Added Quote model");
    await Quote.sync();
    console.log("Synced");

    let p = new Quote({Author: "Pebble", Text: "Fuack"});
    await p.save();
    console.log("Saved");

    let p_ = await Quote.findAll();
    console.log(p_[0].Author)
    // console.log(`${p_.id}: ${p_.Author}`);
    
})()