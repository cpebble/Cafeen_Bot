import config from "../config.json";
import * as SQ from "sequelize";
import { DataType } from "sequelize-typescript";
import { InferCreationAttributes, Model } from "sequelize";

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

    public async registerModel(model: SQ.ModelStatic<any>, initObj){
        let sq = this.sq;
        model.init(initObj, {sequelize: sq});
        await this.sq.sync({alter: true});
        return true;
    }
}

// Types for declaring and interfacing
type MDecl = {
    table: string
    fields: {
        [col: string]: SQ.DataType
    }
}
type MProps<T extends MDecl> = {
    [Prop in keyof T['fields']]
}

// Testing can be deleted
const Pa = {
    "table": "Person",
    "fields": {
        "name": SQ.STRING,
        "bday": SQ.DATE
    }
};
function getObj<T extends MDecl>(obj: T) {
    return obj.fields as MProps<T>;
}
let b: MProps<typeof Pa> = getObj(Pa);

// Wrapper class
// Might not be relevant idc
// class DBModel<MD extends MDecl> {
//     private model;

//     public tableName;

//     constructor(decl: MD) {
//         this.tableName = decl.table;
//     }
// }

class DBObj<A extends SQ.Model<any, any>> 
        extends SQ.Model<SQ.InferAttributes<A>,SQ.InferCreationAttributes<A>> {
    static initObj: SQ.ModelAttributes;
}
class Quote extends DBObj<Quote> {
    declare author: string;
    declare text: string;
    declare snowflake: string;
    static initObj = {
        "author": SQ.DataTypes.STRING,
        "text": SQ.DataTypes.TEXT,
        "snowflake": SQ.DataTypes.STRING
    }
}

// Testing code
(async ()=>{
    let t = await DBM.getInstance();
    console.log("SQL Is Up and Running");
    Quote
    //let m = t.registerModel(Quote);
})()