import GoogleApis from "googleapis"
import fs from "fs"
import Dates from "./lib/Dates.mjs"
import Authorizer from "./Authorizer.mjs"
import MessagePassing from "./lib/MessagePassing.mjs"
const TOKEN_PATH = "token.json"
const {MessageNotHandled, sendMessageTo, sendAsyncMessageTo} = MessagePassing

const File = fs.promises
const google = GoogleApis.google

const Arguments = {
    parse(...args){
        let params = {}
        args.shift()
        args.shift()
        args.forEach(kv=>{
            const pair = kv.split("=")
            if(pair[1].trim().length > 0) params[pair[0].replace("--", "")] = pair[1]
        })
        return params
    }
}

const FileListerInFolder = {
    async list(drive, folderName, id){
        let response = await sendAsyncMessageTo(drive.files, "list", {q: `'${id}' in parents`,
            corpora: "user",
            fields: "nextPageToken, files(id, name),files/parents",
            pageToken: null
        })
        response = await sendAsyncMessageTo(drive.files, "list", {q: `'${response.data.files.find(f=>f.name==folderName).id}' in parents`,
            corpora: "user",
            fields: "nextPageToken, files(id, name),files/parents",
            pageToken: null
        })
        return response
    }
}

async function main(args){
    const params = sendMessageTo(Arguments, "parse", ...args)
    let credentials = await sendAsyncMessageTo(File, "readFile", "credentials.json", "utf-8")
    credentials = JSON.parse(credentials)
    const {client_secret, client_id, redirect_uris} = credentials.web
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    let token = null
    try{
        token = await sendAsyncMessageTo(File, "readFile", TOKEN_PATH, "utf-8")
        token = JSON.parse(token)
    } catch(e){ }
    if(token == null || token.expiry_date <= (new Date()).getTime()) {
        token = await sendAsyncMessageTo(Authorizer, "executeAuthSequence", oAuth2Client)
    }
    sendMessageTo(oAuth2Client, "setCredentials", token)
    let error = await sendAsyncMessageTo(File, "writeFile", TOKEN_PATH, JSON.stringify(token))
    if(error) {
        return console.error(error)
    }
    const drive = sendMessageTo(google, "drive", {version: "v3", auth: oAuth2Client})
    let response = await sendAsyncMessageTo(drive.files, "list", {q: "name = 'DAILY ANNOUNCEMENTS'",
        corpora: "user",
        fields: "nextPageToken, files(id, name),files/parents",
        pageToken: null
    })
    let id = response.data.files[0].id
    let today = new Date()
    if(params.date){
        today = new Date(params.date)
    }
    console.log(today)
    let folderName = Dates.MONTHS[today.getMonth()]
    response = await sendAsyncMessageTo(FileListerInFolder, "list", drive, folderName, id)

    let days = Dates.weekMondayThurFridayRange(today).map(d => {
        let month = Dates.formatMonthDate(d).toLowerCase()
        month = `${month.charAt(0).toUpperCase()}${month.slice(1)}`
        return {day: d, month}
    })
    let thisWeeksFiles = []
    for(let i = 0; i < days.length; i++) {
        let day = days[i]
        let filesForDay = await sendAsyncMessageTo(drive.files, "list", {q: `'${response.data.files.find(f=>f.name == day.month).id}' in parents`,
            corpora: "user",
            fields: "nextPageToken, files(id, name),files/parents",
            pageToken: null
        })
        thisWeeksFiles.push({day: day, files: filesForDay.data.files})
    }
    let html = []
    html.push(`<div style="text-align: left;">`)
    for(let i = 0; i < thisWeeksFiles.length; i++){
        let f = thisWeeksFiles[i]
        html.push(`<p style="text-decoration: underline;"><strong>${Dates.DAYS[f.day.day.getDay()]}</strong></p><ul>`)
        console.log(`Getting ${Dates.DAYS[f.day.day.getDay()]}'s announcements.`)
        for(let k = 0; k < f.files.length; k++){
            let file = f.files[k]
            let fileMeta = await sendAsyncMessageTo(drive.files, "export", {
                fileId: file.id,
                mimeType: "text/plain"
            })
            console.log(`   ${file.name}`)
            html.push("<li>")
            fileMeta.data.split("\r\n").filter(t=>t.length > 0).map(t=>`<p>${t.trim()}</p>`).forEach(t=>html.push(t))
            html.push("</li>")
        }
        html.push("</ul>")
    }
    html.push("</div>")
    console.log(html.join("\r\n"))
    await sendAsyncMessageTo(File, "writeFile", "output.html", `<!doctype html><html><head></head><body>${html.join("\r\n")}</body></html>`, {encoding: "UTF-8"})
}
main(process.argv).then(c=>{
    process.exit(0)
}).catch(e=>console.error(e))