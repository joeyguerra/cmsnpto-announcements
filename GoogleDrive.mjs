import GoogleApis from "googleapis"
const google = GoogleApis.google
let drive = null
const GoogleDrive = {
    init(client){
        drive = google.drive({version: "v3", auth: client})
        return this
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
        console.log(`Find folder for ${folderName} - List of folders are:`, response.data.files.map(f=>f.name))
        response = await drive.files.list({q: `'${response.data.files.find(f=>f.name.toLowerCase().indexOf(folderName.toLowerCase()) > -1).id}' in parents`,
            corpora: "user",
            fields: "nextPageToken, files(id, name),files/parents",
            pageToken: null
        })
        console.log(`Folder Name=${folderName}, number of files in folder = ${response?.data?.files.length}, folder id = ${id}`)
        console.log(`First folder is`, response?.data?.files[0])
        return response
    }
}
export default GoogleDrive