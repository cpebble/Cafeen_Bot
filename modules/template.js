// OBS: Only a template module file, to allow easy extension
async function init (app, dc, config){
    // TODO: Run initialization config
}

async function destroy(dc, config){
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
