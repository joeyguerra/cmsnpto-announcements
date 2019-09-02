import fs from "fs"
import Dates from "./lib/Dates.mjs"
import GoogleAuthMachine from "./GoogleAuthMachine.mjs"
import GoogleDriveMachine from "./GoogleDriveMachine.mjs"
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
    let client = await Machine.sendAsync(GoogleAuthMachine, "init", credentials)
    Machine.send(GoogleDriveMachine, "init", client)
    let response = await Machine.sendAsync(GoogleDriveMachine, "listFolders", {q: "name = 'DAILY ANNOUNCEMENTS'",
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
    response = await Machine.sendAsync(GoogleDriveMachine, "listFiles", folderName, id)

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
        let filesForDay = await Machine.sendAsync(GoogleDriveMachine, "listFolders", {q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document'`,
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
            let fileMeta = await Machine.sendAsync(GoogleDriveMachine, "export", {
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