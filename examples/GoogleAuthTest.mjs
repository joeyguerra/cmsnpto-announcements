import assert from "assert"
import GoogleAuth from "../GoogleAuth.mjs"
import fs from "fs"

const File = fs.promises


it("Should auth with Google", async ()=>{
    //try {await File.unlink("./token.json")}catch(e){}
    let credentials = JSON.parse(await File.readFile("./credentials.json", "utf-8"))
    let client = await GoogleAuth.init(credentials)
    assert.ok(client.credentials.access_token)
    assert.ok(client.credentials.expiry_date >= (new Date()).getTime())
})