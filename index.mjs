import GoogleApis from "googleapis"
import fs from "fs"
import Dates from "./lib/Dates.mjs"
import Authorizer from "./Authorizer.mjs"
import Arguments from "./lib/Arguments.mjs"
import MarkDownIt from "markdown-it"
import assert from "assert"


/*
TODO: I'm exploring the idea of boundaries and making them explicit in the code. Using the concept of a 
"machine" to define a boundary with the communication strategy of sending messages to machines.
*/
const Machine = {
    async sendAsync(obj, method, ...args){
        if(obj[method]) return await obj[method](...args)
        return new Promise((resolve, reject)=>{resolve(null)})
    },
    send(obj, method, ...args){
        if(obj[method]) return obj[method](...args)
        return null
    },
    broadcast(obj, method, ...args){
        if(obj[method]) obj[method](...args)
    }
}

const md = new MarkDownIt({breaks: true})
const File = fs.promises
const google = GoogleApis.google

const GoogleAuthMachine = ()=>{
    const TOKEN_PATH = "token.json"
    let credentials = null
    let token = null
    let client = null
    const api = {
        async init(creds){
            credentials = creds
            const {client_secret, client_id, redirect_uris} = credentials.web
            client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
            let tokenData = null
            try{
                tokenData = await File.readFile(TOKEN_PATH, "utf-8")
                token = JSON.parse(tokenData)
            }catch(e){}
            if(token == null || token.expiry_date <= (new Date()).getTime()) {
                token = await Authorizer.executeAuthSequence(client)
            }
            client.setCredentials(token)
            let error = await File.writeFile(TOKEN_PATH, JSON.stringify(token))
            if(error) {
                return console.error(error)
            }
            return client    
        }
    }
    return api
}

const GoogleDriveMachine = ()=>{
    let client = null
    let drive = null
    const api = {
        init(c){
            if(!c) return null
            client = c
            drive = google.drive({version: "v3", auth: client})
            return api
        },
        async listFolders(query){
            return drive.files.list(query)
        },
        async export(query){
            return drive.files.export(query)
        },
        async listFiles(folderName, id){
            let response = await drive.files.list({q: `'${id}' in parents`,
                corpora: "user",
                fields: "nextPageToken, files(id, name),files/parents",
                pageToken: null
            })
            response = await drive.files.list({q: `'${response.data.files.find(f=>f.name==folderName).id}' in parents`,
                corpora: "user",
                fields: "nextPageToken, files(id, name),files/parents",
                pageToken: null
            })
            return response
        }
    
    }
    return api
}

// This is an "self documenting code" example where the funciton name conveys a rule.
const findAFolderForThisDay = (day, files)=>{
    return files.find(f=>f.name.toLowerCase() == day.month.toLowerCase())
}

/*

I'm exploring the idea of executing the test "with" the code when the program starts. It's another way where
to write self documenting code. The rule is explicitly asserted in code.

*/
const september = findAFolderForThisDay({day: 3, month: "SEPTEMBER 3"}, [{name: "September 3"}])
assert.ok(september != null)

async function main(args){
    let credentialsData = await Machine.sendAsync(File, "readFile", "credentials.json", "utf-8")
    let credentials = JSON.parse(credentialsData)
    let client = await GoogleAuthMachine().init(credentials)
    let drive = GoogleDriveMachine().init(client)
    let response = await Machine.sendAsync(drive, "listFolders", {q: "name = 'DAILY ANNOUNCEMENTS'",
        corpora: "user",
        fields: "nextPageToken, files(id, name),files/parents",
        pageToken: null
    })
    let id = response.data.files[0].id
    let today = new Date()
    const params = Machine.send(Arguments, "parse", ...args)
    if(params.date){
        today = new Date(params.date)
    }
    console.log(today)
    let folderName = Dates.MONTHS[today.getMonth()]
    response = await Machine.sendAsync(drive, "listFiles", folderName, id)

    let days = Dates.weekMondayThruFridayRange(today).map(d => {
        let month = Dates.formatMonthDate(d).toLowerCase()
        month = `${month.charAt(0).toUpperCase()}${month.slice(1)}`
        return {day: d, month}
    })
    let thisWeeksFiles = []
    for(let i = 0; i < days.length; i++) {
        let day = days[i]
        let folder = findAFolderForThisDay(day, response.data.files)
        if(!folder) continue
        let folderId = folder.id
        let filesForDay = await Machine.sendAsync(drive, "listFolders", {q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document'`,
            corpora: "user",
            fields: "nextPageToken, files(id, name, mimeType),files/parents",
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
            let fileMeta = await Machine.sendAsync(drive, "export", {
                fileId: file.id,
                mimeType: "text/plain"
            })
            console.log(`   ${file.name} - ${file.mimeType}`)
            html.push("<li>")
            html.push(md.render(fileMeta.data))
            html.push("</li>")
        }
        html.push("</ul>")
    }
    html.push("</div>")
    console.log(html.join("\r\n"))
    /* Only if you want to have a valid full html doc.
    html.unshift(`<!doctype html><html><head></head><body>`)
    html.push(`</body></html>`)
    */
    await Machine.sendAsync(File, "writeFile", "output.html", `${html.join("\r\n")}`, {encoding: "ascii"})
}

main(process.argv).then(c=>{
    process.exit(0)
}).catch(e=>console.error(e))