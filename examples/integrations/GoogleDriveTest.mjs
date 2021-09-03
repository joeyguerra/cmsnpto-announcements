import assert from "assert"
import GoogleAuth from "../../GoogleAuth.mjs"
import GoogleDrive from "../../GoogleDrive.mjs"
import Dates from "../../lib/Dates.mjs"
import fs from "fs"

const File = fs.promises

async function getFolderByName(folder) {
    let credentials = JSON.parse(await File.readFile("./credentials.json", "utf-8"))
    let client = await GoogleAuth.init(credentials)
    let folders = await GoogleDrive.init(client).listFolders({
        q: `name = '${folder}'`,
        corpora: "user",
        fields: "nextPageToken, files(id, name),files/parents",
        pageToken: null
    })
    return folders
}

async function getFilesInFolder(folder, id){
    let credentials = JSON.parse(await File.readFile("./credentials.json", "utf-8"))
    let client = await GoogleAuth.init(credentials)
    return await GoogleDrive.init(client).listFiles(folder, id)
}

it.skip("Should get daily announcements folder Google Drive", async ()=>{
    const folder = "DAILY ANNOUNCEMENTS"
    let folders = await getFolderByName(folder)
    assert.ok(folders.data.files[0].id)
    assert.strictEqual(folders.data.files[0].name, folder)
})

it("Should list files", async ()=>{
    const folder = "2021-2022"
    const today = new Date()
    const thisMonth = Dates.MONTHS[today.getMonth()]
    const weekDays = Dates.startDayThruFridayRange(today).map(d => {
        let month = Dates.formatMonthDate(d).toLowerCase()
        month = `${month.charAt(0).toUpperCase()}${month.slice(1)}`
        return {day: d, month}
    })
    let folders = await getFolderByName(folder)
    let thisMonthFolder = await getFilesInFolder(thisMonth, folders.data.files[0].id)
    assert.ok(thisMonthFolder.data.files.length > 0)
})

