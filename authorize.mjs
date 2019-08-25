import Authorizer from "./Authorizer.mjs"
import GoogleApis from "googleapis"
import fs from "fs"
import {sendAsyncMessageTo} from "./lib/MessagePassing.mjs"
const TOKEN_PATH = "token.json"
const File = fs.promises
const google = GoogleApis.google

async function main(){
    let credentials = await sendAsyncMessageTo(File, "readFile", "credentials.json", "utf-8")
    credentials = JSON.parse(credentials)
    const {client_secret, client_id, redirect_uris} = credentials.web
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    const token = await sendAsyncMessageTo(Authorizer, "executeAuthSequence", oAuth2Client)
    return {token, oAuth2Client}
}
main().then(async ({token, oAuth2Client}) => {
    oAuth2Client.setCredentials(token)
    let error = await sendAsyncMessageTo(File, "writeFile", TOKEN_PATH, JSON.stringify(token))
    if(error) {
        return console.error(error)
    }
    console.log(token)
})