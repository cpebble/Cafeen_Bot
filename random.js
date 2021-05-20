const utils = require("./utils");



async function init(app, dc, config) {
    utils.registerCommandFun(app, "howlow", (msg, cmd)=>{
        let carg = cmd.split(" ");
        let i;
        try {
            i = parseInt(carg[1]);
        } catch (error) {
            return "What's my age again?"
        }
        let low = Math.ceil((i / 2)+7);
        let res = `Du kan gå helt ned til ${low}`
        if (low < 20){
            res += "\nDet er jo lige nok til at score rus"
        }
        return res;
    });

}
function destroy(){
    return
}

module.exports = {
    "init": init,
    "destroy": destroy,
}