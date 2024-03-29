import fs from "fs"
import cookie from "cookie"
import https from "https"
import Url from "url"
import cheerio from "cheerio"
import querystring from "querystring"

const File = fs.promises

const MembershipToolKit = {
    cookie: [],
    headers: {
        "Cookie": null,
        "User-Agent": "Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11",
        "Accept":"/",
        "Connection": "keep-alive"
    },
    async start(config){
        const rawCookie = await File.readFile("cookies.txt", "utf-8")
        if(!rawCookie.code) MembershipToolKit.headers.Cookie = rawCookie.split("\n")
        if(MembershipToolKit.headers.Cookie){
            MembershipToolKit.cookie = MembershipToolKit.headers.Cookie.map(c=>cookie.parse(c))
            if(new Date(MembershipToolKit.cookie.find(c=>c["AWSALB"]).Expires) < new Date()){
                MembershipToolKit.headers.Cookie = null
                MembershipToolKit.cookie = []
            }
        }
        if(MembershipToolKit.cookie.length == 0){
            let res = await MembershipToolKit.login(config, "https://cmsnpto.membershiptoolkit.com/login-form", this.done.bind(this))
            if(res.error != null){
                console.error("error occurred", res)
                return process.exit(1)
            }
        }
        const sentNewsLetters = await MembershipToolKit.listSentNewsletters(null)
        const response = await MembershipToolKit.duplicateNewsletter(sentNewsLetters[0])
        console.log(response)
    },
    async done(){
        console.log("logged in")
    },
    async login(config, url, callback){
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
                res.setEncoding("utf-8");
                switch(res.statusCode){
                    case(300):
                        console.log("UNEXPECTED: Multiple choices?", res.statusCode, res.headers)
                        process.exit(0)
                    case(301):
                        console.error("ERROR: Moved permanently", res.statusCode, res.headers)
                        process.exit(0)
                    case(303):
                        break
                    case(400):
                        console.error("ERROR: Bad Request", res.statusCode, res.headers)
                        process.exit(0)
                    case(401):
                        console.error("ERROR: Unauthorized", res.statusCode, res.headers)
                        process.exit(0)
                    default:
                        break
                }
                if(res.statusCode > 400){
                    console.error("ERROR: Irrecoverable", res.statusCode, res.headers)
                    process.exit(0)
                }

                const data = []
                res.on("data", chunk=>{
                    data.push(chunk)
                })
                res.on("error", e=>console.error("error on response", e))
                res.on("end", async ()=>{
                    const $ = cheerio.load(data.join("\n"))
                    const alertError = $(".alert-error").text()
                    if(alertError){
                        reject({error: {message: alertError, statusCode: res.statusCode, headers: res.headers }})
                    } else {
                        MembershipToolKit.headers.Cookie = res.headers["set-cookie"]
                        MembershipToolKit.cookie = MembershipToolKit.headers.Cookie.map(c=>cookie.parse(c))
                        await File.writeFile("cookies.txt", MembershipToolKit.headers.Cookie.join("\n"), "utf-8")
                        await callback()
                        resolve({cookie: MembershipToolKit.cookie, data: data.join("\n"), error: null})
                    }
                })
            })
            req.on("error", e=>console.error("error from https request to ", url, e))
            req.write(`email=${config.email}&password=${config.password}&browser_stats=Netscape~5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15~24~1920~1080~1920~1055~MacIntel`)
            req.end()    
        })
    },
    async listSentNewsletters(){
        let response = await MembershipToolKit.get("https://cmsnpto.membershiptoolkit.com/dashboard/newsletters/sent")
        const $ = cheerio.load(response.body);
        const list = $("table tr").filter((i, n)=>{
            return $("td:nth-child(2) a", n).text().indexOf('Student Announcements') > -1;
        }).map((i, n)=>{
            const newsLetter = {
                id: $("td:first-child input", n).attr("value"),
                name: $("td:nth-child(2) a", n).text(),
                link: $("td:nth-child(2) a", n).attr("href")
            };
            return newsLetter;
        }).toArray();
        return list;
    },
    async duplicateNewsletter(newsLetter){
        const data = await File.readFile("output.html", "utf-8")
        let response = await MembershipToolKit.post(newsLetter.link, `action=duplicate`)
        const url = Url.parse(response.res.headers.location)
        response = await MembershipToolKit.get(url.href)
        await File.writeFile("duplicatedNewsLetter.html", response.body, "utf-8");
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
        response = await MembershipToolKit.post(`${url.protocol}//${url.hostname}/gateway`, (new URLSearchParams(params)).toString())
        let letter = {
            id: id,
            option: "save"
        }

        $("#mail-body td:nth-child(2) table tr:nth-child(2) td div.mtk-editable", newsLetterBody).html(data)
        letter.body = newsLetterBody.html()

        response = await MembershipToolKit.post(`${url.protocol}//${url.hostname}/dashboard/newsletters/editor/${letter.id}`,
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
                headers: Object.assign(MembershipToolKit.headers, headers)
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
                headers: MembershipToolKit.headers
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
}

export default MembershipToolKit