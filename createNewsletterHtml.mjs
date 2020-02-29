import fs from "fs"
import Dates from "./lib/Dates.mjs"
import GoogleAuthMachine from "./GoogleAuthMachine.mjs"
import GoogleDriveMachine from "./GoogleDriveMachine.mjs"
import Arguments from "./lib/Arguments.mjs"
import MarkDownIt from "markdown-it"
import assert from "assert"
import MakeObservable from "./lib/MakeObservable.mjs"
import Machine from "./lib/Machine.mjs"

const md = new MarkDownIt({breaks: true})
const File = fs.promises

// This is an "self documenting code" example where the funciton name conveys a rule.
const findAFolderForThisDay = (day, files)=>{
    return files.find(f=>f.name.trim().toLowerCase() == day.month.toLowerCase())
}

/*

I'm exploring the idea of executing the test "with" the code when the program starts. It's another way where
to write self documenting code. The rule is explicitly asserted in code.

*/
const september = findAFolderForThisDay({day: 3, month: "SEPTEMBER 3"}, [{name: "September 3"}])
assert.ok(september != null)

const model = MakeObservable({
    credentials: null,
    client: null,
    drive: null,
    weekDays: [],
    html: [],
    dailyAnnouncementsFolderId: null
})
model.observe("drive", (key, old, v)=>{
    console.log("Drive was initialized")
})

async function main(args){
    model.credentials = JSON.parse(await Machine.sendAsync(File, "readFile", "credentials.json", "utf-8"))
    model.client = await Machine.sendAsync(GoogleAuthMachine, "init", model.credentials)
    model.drive = Machine.send(GoogleDriveMachine, "init", model.client)
    const dailyAnnouncements = await Machine.sendAsync(GoogleDriveMachine, "listFolders", {q: "name = 'DAILY ANNOUNCEMENTS'",
        corpora: "user",
        fields: "nextPageToken, files(id, name),files/parents",
        pageToken: null
    })
    model.dailyAnnouncementsFolderId = dailyAnnouncements.data.files[0].id
    const params = Machine.send(Arguments, "parse", ...args)
    console.log("params = ", params)
    const today = params.date ? new Date(params.date) : new Date()
    const thisMonth = Dates.MONTHS[today.getMonth()]
    const thisMonthFolder = await Machine.sendAsync(GoogleDriveMachine, "listFiles", thisMonth, model.dailyAnnouncementsFolderId)
    model.weekDays = Dates.startDayThruFridayRange(today).map(d => {
        let month = Dates.formatMonthDate(d).toLowerCase()
        month = `${month.charAt(0).toUpperCase()}${month.slice(1)}`
        return {day: d, month}
    })
    const thisWeeksFiles = []
    console.log(model.weekDays)
    for(let i = 0; i < model.weekDays.length; i++) {
        let day = model.weekDays[i]
        let folder = findAFolderForThisDay(day, thisMonthFolder.data.files)
        if(!folder) continue
        let folderId = folder.id
        let filesForDay = await Machine.sendAsync(GoogleDriveMachine, "listFolders", {q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document'`,
            corpora: "user",
            fields: "nextPageToken, files(id, name, mimeType),files/parents",
            pageToken: null
        })
        thisWeeksFiles.push({day: day, files: filesForDay.data.files})
    }
    model.html.push(`<div style="text-align: left;">`)
    for(let i = 0; i < thisWeeksFiles.length; i++){
        let f = thisWeeksFiles[i]
        model.html.push(`<p style="text-decoration: underline;"><strong>${Dates.DAYS[f.day.day.getDay()]}</strong></p><ul>`)
        console.log(`Getting ${Dates.DAYS[f.day.day.getDay()]}'s announcements.`)
        for(let k = 0; k < f.files.length; k++){
            let file = f.files[k]
            let fileMeta = await Machine.sendAsync(GoogleDriveMachine, "export", {
                fileId: file.id,
                mimeType: "text/plain"
            })
            console.log(`   ${file.name} - ${file.mimeType}`)
            model.html.push("<li>")
            try{
                model.html.push(md.render(fileMeta.data))
            }catch(e){
                console.error("**************ERROR", e, fileMeta)
            }
            model.html.push("</li>")
        }
        model.html.push("</ul>")
    }
    model.html.push("</div>")
    let emailBody = model.html.join("\r\n")
    /* Only if you want to have a valid full html doc.
    html.unshift(`<!doctype html><html><head></head><body>`)
    html.push(`</body></html>`)
    */

    emailBody = emailBody.replace("Vadiapatia", "Vadlapatla")
    await Machine.sendAsync(File, "writeFile", "output.html", emailBody, {encoding: "ascii"})
}

export default main