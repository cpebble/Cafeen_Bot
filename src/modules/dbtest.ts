import {BotModule} from "./interface"
import { IApp } from "../IApp";



export class DBTest implements BotModule {
    modInfo: { name: "DBTest",
               info: `
A module testing
- DB Integration
- TS Conversion of modules` };
    async init (app: IApp, config){
        // TODO: Run initialization config
        return true
    }

    async destroy(app: IApp, config){
        // TODO: Shut down gracefully 
    }
}


// module.exports = {
//     "modInfo": {
//         "name": "Testing DB Connection",
//         "info": "Don't activate in prod"
//     },
//     "init": init, 
//     "destroy": destroy,
// }
