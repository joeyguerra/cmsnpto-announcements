import {sendAsyncMessageTo} from "./MessagePassing.mjs"

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

export default FileListerInFolder