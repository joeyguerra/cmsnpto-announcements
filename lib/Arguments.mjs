const Arguments = {
    parse(...args){
        let params = {}
        args.shift()
        args.shift()
        args.forEach(kv=>{
            const pair = kv.split("=")
            if(pair[1].trim().length > 0) params[pair[0].replace("--", "")] = pair[1]
        })
        return params
    }
}
export default Arguments