import fs from "fs"
import cookie from "cookie"
import https from "https"
import MakeObservable from "./lib/MakeObservable.mjs"
import Url from "url"
import Arguments from "./lib/Arguments.mjs"
import Machine from "./lib/Machine.mjs"
import cheerio from "cheerio"

const config = {
    email: process.env.email,
    password: process.env.password
}
const File = fs.promises

const MtkMachine = MakeObservable({
    cookie: [],
    headers: {
        "Cookie": null,
        "User-Agent": "Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11",
        "Accept":"/",
        "Connection": "keep-alive"
    },
    async start(args){
        const rawCookie = await Machine.sendAsync(File, "readFile", "cookies.txt", "utf-8")
        if(!rawCookie.code) MtkMachine.headers.Cookie = rawCookie.split("\n")
        if(MtkMachine.headers.Cookie){
            MtkMachine.cookie = MtkMachine.headers.Cookie.map(c=>cookie.parse(c))
            if(new Date(MtkMachine.cookie.find(c=>c["AWSALB"]).Expires) < new Date()){
                MtkMachine.headers.Cookie = null
                MtkMachine.cookie = []
            }
        }
        if(MtkMachine.cookie.length == 0){
            let res = await Machine.sendAsync(MtkMachine, "login", "https://cmsnpto.membershiptoolkit.com/login", "done")
            if(res){
                console.error(res)
                return process.exit(1)
            }
        }
        const params = Machine.send(Arguments, "parseNp", ...args)
        const html = await Machine.sendAsync(MtkMachine, "listSentNewsletters", null)
    },
    async done(){
        console.log("logged in")
    },
    async login(url, method){
        return new Promise((resolve, reject)=>{
            const u = Url.parse(url)
            const options = {
                hostname: u.hostname,
                port: 443,
                method: "POST",
                path: u.pathname,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
            const req = https.request(options, async res => {
                res.setEncoding("utf-8")
                const data = []
                res.on("data", chunk=>data.push(chunk))
                res.on("error", e=>console.error(e))
                res.on("end", async ()=>{
                    const $ = cheerio.load(data.join("\n"))
                    if(!res.headers.location){
                        reject({error: {message: $(".alert-error").text()}})
                    } else {
                        MtkMachine.headers.Cookie = res.headers["set-cookie"]
                        MtkMachine.cookie = MtkMachine.headers.Cookie.map(c=>cookie.parse(c))
                        await File.writeFile("cookies.txt", MtkMachine.headers.Cookie.join("\n"), "utf-8")
                        await Machine.sendAsync(MtkMachine, method)
                        resolve()
                    }
                })
            })
            req.on("error", e=>console.error(e))
            req.write(`email=${config.email}&password=${config.password}`)
            req.end()    
        })
    },
    async listSentNewsletters(){
        let response = await Machine.sendAsync(MtkMachine, "get", "https://cmsnpto.membershiptoolkit.com/dashboard/newsletters/sent")
        const $ = cheerio.load(response.body)
        const list = []
        $(".dashboard-summary table tr td:nth-child(2)").each((i, n)=>{
            const t = $(n).text()
            if(t.indexOf("Student Announcements") > -1) list.push(t)
        })

        console.log(list)
        return response.body
    },
    async get(url){
        return new Promise((resolve, reject)=>{
            const u = Url.parse(url)
            const req = https.request({
                hostname: u.hostname,
                path: u.pathname,
                method: "GET",
                headers: MtkMachine.headers
            }, res => {
                let buffer = []
                res.setEncoding("utf-8")
                res.on("data", chunk => buffer.push(chunk))
                res.on("error", e=>reject(e))
                res.on("end", ()=>resolve({res, body: buffer.join("\n")}))
            })
            req.on("error", e=>reject(e))
            req.end()
        })
    }
})

MtkMachine.start(process.argv).then().catch(e=>console.error(e))
