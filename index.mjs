import CliArguments from "./lib/CliArguments.mjs"
import GoogleAuth from "./GoogleAuth.mjs"
import GoogleDrive from "./GoogleDrive.mjs"
import Dates from "./lib/Dates.mjs"
import fs from "fs"
import MarkDownIt from "markdown-it"
import MembershipToolKit from "./MembershipToolKit.mjs"

const File = fs.promises
const md = new MarkDownIt({breaks: true})

const findAFolderForThisDay = (day, files)=>{
    // folder.name convention: Month Day (e.g. September 15)
    // folder.name convention: Day (e.g. 8)
    return files.find(f=>{
        return Number(f.name.trim().toLowerCase()) == day.day.getDate()
    })
}


;(async ()=>{
    const params = CliArguments.parse(...process.argv);
    const today = params.date ? new Date(params.date) : new Date()
    const folder = params.folder || "DAILY ANNOUNCEMENTS"
    const credentials = JSON.parse(await File.readFile("credentials.json", "utf-8"))
    const client = await GoogleAuth.init(credentials)
    const drive = await GoogleDrive.init(client)
    const dailyAnnouncementsFolder = await drive.listFolders({
        q: `name = '${folder}'`,
        corpora: "user",
        fields: "nextPageToken, files(id, name),files/parents",
        pageToken: null
    })
    const dailyAnnouncementsFolderId = dailyAnnouncementsFolder.data.files[0].id
    const thisMonth = Dates.MONTHS[today.getMonth()]
    const weekDays = Dates.startDayThruFridayRange(today).map(d => {
        let month = Dates.formatMonthDate(d).toLowerCase()
        month = `${month.charAt(0).toUpperCase()}${month.slice(1)}`
        return {day: d, month}
    })
    const thisWeeksFiles = []
    let previous = null
    const thisMonthFolder = await drive.listFiles(thisMonth, dailyAnnouncementsFolder.data.files[0].id)
    for (let i = 0; i < weekDays.length; i++) {
        let day = weekDays[i]
        if(!thisMonthFolder.data) {
            console.log("error", thisMonthFolder)
            throw new Error("There's no announcements")
        }
        if(previous && previous.day.getMonth() != day.day.getMonth()){
            console.log("need to get files from different folder", previous, day)
            thisMonthFolder = await drive.listFiles(Dates.MONTHS[day.day.getMonth()], dailyAnnouncementsFolderId)
        }
        let folder = findAFolderForThisDay(day, thisMonthFolder.data.files)
        console.log(`Reading for day = `, day.month)
        if(!folder) continue
        let folderId = folder.id
        let filesForDay = await drive.listFolders({q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document'`,
            corpora: "user",
            fields: "nextPageToken, files(id, name, mimeType),files/parents",
            pageToken: null
        })
        thisWeeksFiles.push({day: day, files: filesForDay.data.files})
        previous = day
    }
    let html = []
    //html.push(`<div style="text-align: left;">`)
    for(let i = 0; i < thisWeeksFiles.length; i++){
        let f = thisWeeksFiles[i]
        //html.push(`<p style="text-decoration: underline;"><strong>${Dates.DAYS[f.day.day.getDay()]}</strong></p><ul>`)
        html.push(`${Dates.DAYS[f.day.day.getDay()]}`)
        console.log(`Getting ${Dates.DAYS[f.day.day.getDay()]}'s announcements. ${f.files.length} # of files.`)
        for(let k = 0; k < f.files.length; k++){
            let file = f.files[k]
            let fileMeta = await drive.export({
                fileId: file.id,
                mimeType: "text/plain"
            })
            console.log(`   ${file.name} - ${file.mimeType}`)            
            //html.push("<li>")
            try{
                //html.push(md.render(fileMeta.data))
                html.push(fileMeta.data)
            }catch(e){
                console.error("**************ERROR", e, fileMeta)
            }
            //html.push("</li>")
        }
        //html.push("</ul>")
    }
    //html.push("</div>")
    let emailBody = html.join("\r\n")
    /* Only if you want to have a valid full html doc.
    html.unshift(`<!doctype html><html><head></head><body>`)
    html.push(`</body></html>`)
    */

    emailBody = emailBody.replace("Vadiapatia", "Vadlapatla")
    await File.writeFile("output.html", emailBody, {encoding: "ascii"})

    const config = {
        email: process.env.email,
        password: process.env.password
    }
    
    await MembershipToolKit.start(config)
    process.exit(0)
})()


//Coppell Middle School North PTO
///cmsnorthpto@gmail.com