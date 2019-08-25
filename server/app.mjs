import express from "express"
import bodyParser from "body-parser"
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
      res.send(code)
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

export default server