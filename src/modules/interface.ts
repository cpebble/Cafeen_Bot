import {IApp} from "../IApp"
// OBS: Only a template module file, to allow easy extension
async function init (app, config){
    // TODO: Run initialization config
}

async function destroy(app, config){
    // TODO: Shut down gracefully 
}

module.exports = {
    "modInfo": {
        "name": "Template",
        "info": "A template, describing how a module skeleton should look like"
    },
    "init": init, 
    "destroy": destroy,
}

export interface BotModule {
    modInfo: {
        name: string;
        info: string;
    };
    init: ((app: IApp, config) => Promise<any>);
    destroy: ((app: IApp, config) => Promise<any>);
}