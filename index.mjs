import GoogleApis from "googleapis"
import fs from "fs"
import readline from "readline"
import Dates from "./lib/Dates.mjs"

const File = fs.promises
const SCOPES = ["https://www.googleapis.com/auth/drive"]
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
        const response = await drive.files.export(options)
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
    let response = await GoogleDrive.list(oAuth2Client, {q: "name = 'DAILY ANNOUNCEMENTS'",
        corpora: "user",
        fields: "nextPageToken, files(id, name),files/parents",
        pageToken: null
    })
    let id = response.data.files[0].id
    let today = new Date()
    let folderName = Dates.MONTHS[today.getMonth()]
    response = await GoogleDrive.list(oAuth2Client, {q: `'${id}' in parents`,
        corpora: "user",
        fields: "nextPageToken, files(id, name),files/parents",
        pageToken: null
    })
    response = await GoogleDrive.list(oAuth2Client, {q: `'${response.data.files.find(f=>f.name==folderName).id}' in parents`,
        corpora: "user",
        fields: "nextPageToken, files(id, name),files/parents",
        pageToken: null
    })

    let days = Dates.weekMondayThurFridayRange(today).map(d => {
        let month = Dates.formatMonthDate(d).toLowerCase()
        month = `${month.charAt(0).toUpperCase()}${month.slice(1)}`
        return month
    })
    let thisWeeksFiles = []
    for(let i = 0; i < days.length-1; i++) {
        let day = days[i]
        let filesForDay = await GoogleDrive.list(oAuth2Client, {q: `'${response.data.files.find(f=>f.name == day).id}' in parents`,
            corpora: "user",
            fields: "nextPageToken, files(id, name),files/parents",
            pageToken: null
        })
        filesForDay.data.files.forEach(f=>thisWeeksFiles.push(f))
    }
    let fileMeta = await GoogleDrive.get(oAuth2Client, {
        fileId: thisWeeksFiles[0].id,
        mimeType: "text/plain"
    })
    //console.log(thisWeeksFiles)
    console.log(fileMeta.data)
}

main().then(c=>{}).catch(e=>console.error(e))
