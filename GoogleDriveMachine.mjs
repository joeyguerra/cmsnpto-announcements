import GoogleApis from "googleapis"
const google = GoogleApis.google
let drive = null
const GoogleDriveMachine = {
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
        response = await drive.files.list({q: `'${response.data.files.find(f=>f.name==folderName).id}' in parents`,
            corpora: "user",
            fields: "nextPageToken, files(id, name),files/parents",
            pageToken: null
        })
        return response
    }
}
export default GoogleDriveMachine