import GoogleApis from "googleapis"
import fs from "fs"
import Dates from "./lib/Dates.mjs"
import Authorizer from "./Authorizer.mjs"
import {sendMessageTo, sendAsyncMessageTo} from "./lib/MessagePassing.mjs"
import Arguments from "./lib/Arguments.mjs"
import FileListerInFolder from "./lib/FileListerInFolder.mjs"
import GoogleDrive from "./lib/GoogleDrive.mjs"
const File = fs.promises
const google = GoogleApis.google

async function main(args){
    let credentials = await sendAsyncMessageTo(File, "readFile", "credentials.json", "utf-8")
    credentials = JSON.parse(credentials)
    let drive = await sendAsyncMessageTo(GoogleDrive, "execute", credentials, File, google, Authorizer)
    let response = await sendAsyncMessageTo(drive.files, "list", {q: "name = 'DAILY ANNOUNCEMENTS'",
        corpora: "user",
        fields: "nextPageToken, files(id, name),files/parents",
        pageToken: null
    })
    let id = response.data.files[0].id
    let today = new Date()
    const params = sendMessageTo(Arguments, "parse", ...args)
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