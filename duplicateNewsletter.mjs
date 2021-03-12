import fs from "fs"
import cookie from "cookie"
import https from "https"
import MakeObservable from "./lib/MakeObservable.mjs"
import Url from "url"
import Arguments from "./lib/Arguments.mjs"
import Machine from "./lib/Machine.mjs"
import cheerio from "cheerio"
import querystring from "querystring"

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
            let res = await Machine.sendAsync(MtkMachine, "login", "https://cmsnpto.membershiptoolkit.com/login-form", "done")
            if(res){
                console.error("error occurred", res)
                return process.exit(1)
            }
        }
        const params = Machine.send(Arguments, "parseNp", ...args)
        const sentNewsLetters = await Machine.sendAsync(MtkMachine, "listSentNewsletters", null)
        const response = await Machine.sendAsync(MtkMachine, "duplicateNewsletter", sentNewsLetters[0])
    },
    async done(){
        console.log("logged in")
    },
    async login(url, method){
        if(!config.email) throw new Error("Make sure there's a .env file with email and password")
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
                if(res.statusCode > 299) {
                    console.error("ERROR: login url is wrong", res.statusCode, res.headers)
                    process.exit(0)
                }
                const data = []
                res.on("data", chunk=>data.push(chunk))
                res.on("error", e=>console.error("error on response", e))
                res.on("end", async ()=>{
                    const $ = cheerio.load(data.join("\n"))
                    if(!res.headers.location){
                        reject({error: {message: $(".alert-error").text(), statusCode: res.statusCode }})
                    } else {
                        MtkMachine.headers.Cookie = res.headers["set-cookie"]
                        MtkMachine.cookie = MtkMachine.headers.Cookie.map(c=>cookie.parse(c))
                        await File.writeFile("cookies.txt", MtkMachine.headers.Cookie.join("\n"), "utf-8")
                        await Machine.sendAsync(MtkMachine, method)
                        resolve()
                    }
                })
            })
            req.on("error", e=>console.error("error from https request to ", url, e))
            req.write(`email=${config.email}&password=${config.password}`)
            req.end()    
        })
    },
    async listSentNewsletters(){
        let response = await Machine.sendAsync(MtkMachine, "get", "https://cmsnpto.membershiptoolkit.com/dashboard/newsletters/sent")
        const $ = cheerio.load(response.body)
        const list = []
        $(".dashboard-summary table tr").each((i, n)=>{
            const newsLeter = {
                id: $("td:first-child input", n).attr("value"),
                name: $("td:nth-child(2) a", n).text(),
                link: $("td:nth-child(2) a", n).attr("href")
            }
            if(newsLeter.name.indexOf("Student Announcements") > -1) list.push(newsLeter)
        })
        return list
    },
    async duplicateNewsletter(newsLetter){
        const data = await Machine.sendAsync(File, "readFile", "output.html", "utf-8")
        let response = await Machine.sendAsync(MtkMachine, "post", newsLetter.link, `action=duplicate`)
        const url = Url.parse(response.res.headers.location)
        response = await Machine.sendAsync(MtkMachine, "get", url.href)
        const $ = cheerio.load(response.body)
        const id = url.href.split("/").pop()
        const form = $("#edit_newsletter_form")
        const newsLetterBody = $("#mtk-newsletter-editor-body")
        const list_ids = []
        $("[name='list_id[]']:checked", form).each((i, listId)=>{
            list_ids.push($(listId).attr("value"))
        })
        const from_email_name = $("[name='from_email_name']", form).attr("value")
        const from_email = $("[name='from_email']", form).attr("value")
        //const subject = $("[name='subject']", form).attr("value")
        const scheduled_datetime = $("[name='scheduled_datetime']", form).attr("value")
        const today = new Date()
        const params = {command: "savenlsettings", id, list_ids, from_email, from_email_name, subject: `CMSN Student Announcements - ${today.getMonth()+1}/${today.getDate()}/${today.getFullYear()}`}
        response = await Machine.sendAsync(MtkMachine, "post", `${url.protocol}//${url.hostname}/gateway`, querystring.stringify(params))
        let letter = {
            id: id,
            option: "save"
        }
        if(data.code){
            console.error(data)
        } else {
            $("#mail-body td:nth-child(2) table tr:nth-child(2) td div.mtk-editable", newsLetterBody).html(data)
            letter.body = newsLetterBody.html()
        }
        response = await Machine.sendAsync(MtkMachine, "post", `${url.protocol}//${url.hostname}/dashboard/newsletters/edit2/${letter.id}`,
`------WebKitFormBoundarygVfmXWoqCWgGd8Ki
Content-Disposition: form-data; name="id"

${letter.id}
------WebKitFormBoundarygVfmXWoqCWgGd8Ki
Content-Disposition: form-data; name="option"

${letter.option}
------WebKitFormBoundarygVfmXWoqCWgGd8Ki
Content-Disposition: form-data; name="body"

${letter.body}

------WebKitFormBoundarygVfmXWoqCWgGd8Ki--`, {"Content-Type":"multipart/form-data; boundary=----WebKitFormBoundarygVfmXWoqCWgGd8Ki", "Referer":`${url.protocol}//${url.hostname}/dashboard/newsletters/edit2/${letter.id}`})
        console.log("POSTing newsletter", response.res.statusCode, response.body)
   },
    async post(url, data, headers = {"Content-Type": "application/x-www-form-urlencoded"}){
        return new Promise((resolve, reject)=>{
            const u = Url.parse(url)
            const req = https.request({
                hostname: u.hostname,
                path: u.pathname,
                method: "POST",
                headers: Object.assign(MtkMachine.headers, headers)
            }, res => {
                console.log(`POSTing ${url}, statuscode = ${res.statusCode}, headers = `, res.headers)
                let buffer = []
                res.setEncoding("utf-8")
                res.on("data", chunk => buffer.push(chunk))
                res.on("error", e=>reject({res, error: e}))
                res.on("end", ()=>resolve({res, body: buffer.join("\r\n")}))
            })
            req.on("error", e=>reject(e))
            req.write(data)
            req.end()
        })
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
                //console.log(`GETting ${url}, statuscode = ${res.statusCode}, headers = `, res.headers)
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

export default MtkMachine