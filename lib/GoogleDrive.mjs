import {sendMessageTo, sendAsyncMessageTo} from "./MessagePassing.mjs"
const GoogleDrive = {
    async execute(credentials, File, google, Authorizer){
        const TOKEN_PATH = "token.json"
        const {client_secret, client_id, redirect_uris} = credentials.web
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
        let token = null
        try{
            token = await sendAsyncMessageTo(File, "readFile", TOKEN_PATH, "utf-8")
            token = JSON.parse(token)
        } catch(e){ }
        if(token == null || token.expiry_date <= (new Date()).getTime()) {
            token = await sendAsyncMessageTo(Authorizer, "executeAuthSequence", oAuth2Client)
        }
        sendMessageTo(oAuth2Client, "setCredentials", token)
        let error = await sendAsyncMessageTo(File, "writeFile", TOKEN_PATH, JSON.stringify(token))
        if(error) {
            return console.error(error)
        }
        const drive = sendMessageTo(google, "drive", {version: "v3", auth: oAuth2Client})
        return drive
    }
}
export default GoogleDrive