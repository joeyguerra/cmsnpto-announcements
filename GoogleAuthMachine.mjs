import express from "express"
import bodyParser from "body-parser"
import GoogleApis from "googleapis"
import fs from "fs"

const google = GoogleApis.google
const File = fs.promises
const SCOPES = ["https://www.googleapis.com/auth/drive"]
const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
  .use((err, req, res, next)=>{
      console.error(err)
      if(!err.message){
          return res.status(500).send("Something weird happened")
      }
      if(err.message == 401){
          return res.status(401).send("Unauthorized")
      }
      res.status(500).send("Something broke")
  })
  .get("/", (req, res)=>{
      const code = req.query.code
      process.emit("code was received", code)
      res.send(`<!doctype html><html><head><title>Authorized Code</title></head><body><pre>${code}</pre></body></html>`)
  })

const server = () => {
    const listener = app.listen(8000, () => {
        console.log(`Service istening on port ${listener.address().port}`)
    })
    ;["SIGINT", "SIGTERM"].forEach( sig => {
        process.on(sig, ()=>{
            console.log("shutting down")
            process.emit("shutting down", sig)
            process.exit()
        })
    })
    return listener
}

const TOKEN_PATH = "token.json"
const GoogleAuthMachine = {
    async init(credentials){
        const {client_secret, client_id, redirect_uris} = credentials.web
        const client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
        let tokenData = null
        let token = null
        try{
            tokenData = await File.readFile(TOKEN_PATH, "utf-8")
            token = JSON.parse(tokenData)
        }catch(e){}
        if(token == null || token.expiry_date <= (new Date()).getTime()) {
            token = await this.executeAuthSequence(client)
        }
        client.setCredentials(token)
        let error = await File.writeFile(TOKEN_PATH, JSON.stringify(token))
        if(error) {
            return console.error(error)
        }
        return client
    },
    async executeAuthSequence(oAuth2Client){
        const listener = server()
        return new Promise((resolve, reject)=>{
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: "offline",
                scope: SCOPES,
            })
            console.log("Go to URL:", authUrl)
            process.on("code was received", code => {
                oAuth2Client.getToken(code, async (err, token) => {
                    if (err) return reject(err)
                    console.log("Code was received. Setting credentials.")
                    resolve(token)
                    listener.close(()=>console.log("Server stopped"))
                })
            })
        })
    }
}

export default GoogleAuthMachine