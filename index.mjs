import GoogleApis from "googleapis"
import fs from "fs"
import readline from "readline"

const File = fs.promises
const SCOPES = ["https://www.googleapis.com/auth/drive.metadata.readonly"]
const google = GoogleApis.google
const TOKEN_PATH = "token.json"

const GoogleDrive = {
    async list(authClient, options){
        const drive = google.drive({version: "v3", auth: authClient})
        const response = await drive.files.list(options)
        return response
    },
    async get(authClient, options){
        const drive = google.drive({version: "v3", auth: authClient})
        const response = await drive.files.get(options)
        return response
    },
    async isAuthed(){
        let token = null
        try{ token = await File.readFile(TOKEN_PATH, "utf-8") }
        catch(e){ }
        return token
    },
    async executeAuthSequence(oAuth2Client){
        return new Promise((resolve, reject)=>{
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: "offline",
                scope: SCOPES,
            })
            console.log("Go to URL:", authUrl)
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            })
            rl.question("Enter the code from that page here:", code => {
                rl.close()
                oAuth2Client.getToken(code, (err, token) => {
                    if (err) return reject(err)
                    oAuth2Client.setCredentials(token)
                    let error = File.writeFile(TOKEN_PATH, JSON.stringify(token))
                    if(error) return reject(error)
                    resolve(oAuth2Client)
                })
            })
        })
    }
}

async function main(){
    let credentials = await File.readFile("credentials.json", "utf-8")
    credentials = JSON.parse(credentials)
    const {client_secret, client_id, redirect_uris} = credentials.web
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    let token = await GoogleDrive.isAuthed()
    if(token != null) oAuth2Client.setCredentials(JSON.parse(token))
    else await GoogleDrive.executeAuthSequence(oAuth2Client)
    let response = await GoogleDrive.list(oAuth2Client, {q: "name = 'May 1'",
        corpora: "user",
        pageToken: null
    })
    console.log(response)
}

main().then(c=>{}).catch(e=>console.error(e))
