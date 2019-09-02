import GoogleApis from "googleapis"
const google = GoogleApis.google
const GoogleDriveMachine = (oAuthClient)=>{
    const client = oAuthClient
    let drive = null
    const api = {
        init(){
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
export default GoogleDriveMachine