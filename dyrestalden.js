const https = require('https');
const secrets = require("./secrets.json");
const child_process = require("child_process");
const axios = require("axios")

let token;

function calcBasicAuth(){
    let auth = "Basic "+Buffer.from(secrets['battlenet-api-client']+':'+secrets['battlenet-api-secret']).toString("base64");
    return auth;
}

function calcTokenAuth(tok){
    return `Bearer ${tok.access_token}`
}
let buildUrl = (path, tok)=>`https://us.api.blizzard.com${path}?namespace=static_us&access_token=${tok.access_token}`

// access_token=US8cTb6LkeR07Hbz7toC7L42msrfXfz9sI
async function getToken(){
    const postdata = "grant_type=client_credentials"; //JSON.stringify({"grant_type": "client_credentials"});
    // console.log(postdata);

    const options = {
        hostname: 'us.battle.net',
        port: 443,
        path: '/oauth/token',
        method: 'POST',
        auth: `${secrets['battlenet-api-client']}:${secrets['battlenet-api-secret']}`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postdata.length
        }

    }

    let response = await axios.post(
    "https://"+options.hostname + options.path,
        postdata,
        { 
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postdata.length,
                'Authorization': calcBasicAuth()
            },
            // auth: options.auth
        }
    )
    // console.log(response);
    token = getToken;
    return response.data;

}

async function init(){
    let tok = await getToken();
    setInterval(getToken, tok.expires_in);
    let mount

    try {
        https.get(
            buildUrl("/data/wow/mount/6", tok)
        )
        .then((data)=>{
            console.log(data)
        })
        // let mount = await axios.get(
        //     buildUrl("/data/wow/mount/6", tok)
        //     // { "headers": {"Authorization": calcTokenAuth(tok)} }
        //)
        console.log("hey")
    } catch (error) {
        console.log(error)
    }
    
    console.log(mount)

}



module.exports = {
    "init": init
}