import main from "./createNewsletterHtml.mjs"
import MtkMachine from "./duplicateNewsletter.mjs"

;(async ()=>{
    const c = await main(process.argv)
    await MtkMachine.start(process.argv)
    process.exit(0)
})()