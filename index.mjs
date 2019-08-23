import GoogleApis from "googleapis"
import fs from "fs"
import readline from "readline"
import Dates from "./lib/Dates.mjs"
import service from "./server/app.mjs"

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
                oAuth2Client.getToken(code, async (err, token) => {
                    if (err) return reject(err)
                    oAuth2Client.setCredentials(token)
                    let error = await File.writeFile(TOKEN_PATH, JSON.stringify(token))
                    if(error) return reject(error)
                    resolve(JSON.stringify(token))
                })
            })
        })
    }
}

async function main(args){
    console.log(args)
    let credentials = await File.readFile("credentials.json", "utf-8")
    credentials = JSON.parse(credentials)
    const {client_secret, client_id, redirect_uris} = credentials.web
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    let token = await GoogleDrive.isAuthed()
    if(token == null) {
        token = await GoogleDrive.executeAuthSequence(oAuth2Client)        
    }
    oAuth2Client.setCredentials(JSON.parse(token))
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
        return {day: d, month}
    })
    let thisWeeksFiles = []
    for(let i = 0; i < days.length; i++) {
        let day = days[i]
        let filesForDay = await GoogleDrive.list(oAuth2Client, {q: `'${response.data.files.find(f=>f.name == day.month).id}' in parents`,
            corpora: "user",
            fields: "nextPageToken, files(id, name),files/parents",
            pageToken: null
        })
        thisWeeksFiles.push({day: day, files: filesForDay.data.files})
    }
    let html = []
    for(let i = 0; i < thisWeeksFiles.length; i++){
        let f = thisWeeksFiles[i]
        html.push(`<div style="text-align: left;"><p style="text-decoration: underline;"><strong>${Dates.DAYS[f.day.day.getDay()]}</strong></p><ul>`)
        for(let k = 0; k < f.files.length; k++){
            let file = f.files[k]
            let fileMeta = await GoogleDrive.get(oAuth2Client, {
                fileId: file.id,
                mimeType: "text/plain"
            })
            html.push("<li>")
            fileMeta.data.split("\r\n").filter(t=>t.length > 0).map(t=>`<p>${t}</p>`).forEach(t=>html.push(t))
            html.push("</li>")
        }
        html.push("</ul></div>")
    }
    console.log(html.join("\r\n"))
    await File.writeFile("output.html", `<!doctype html><html><head></head><body>${html.join("\r\n")}</body></html>`)
}
service.then(s=>{
    main(process.argv).then(c=>{
        process.exit(0)
    }).catch(e=>console.error(e))
}).catch(e=>{
    console.error(e)
    process.exit(1)
})
