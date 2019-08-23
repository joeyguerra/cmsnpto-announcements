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
      res.send(code)
  })

const server = new Promise((resolve, reject)=>{
    const listener = app.listen(8000, () => {
        console.log(`Service istening on port ${listener.address().port}`)
    })      
    ;["SIGINT", "SIGTERM"].forEach( sig => {
        console.log("shutting down")
        process.on(sig, ()=>{
            process.emit("shutting down", sig)
            process.exit()
        })
    })
    resolve(listener)
})

export default server