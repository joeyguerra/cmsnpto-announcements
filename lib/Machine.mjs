/*
TODO: I'm exploring the idea of boundaries and making them explicit in the code. Using the concept of a 
"machine" to define a boundary with the communication strategy of sending messages to machines.
*/
const Machine = {
    async sendAsync(obj, method, ...args){
        if(obj[method]) {
            try{
                return await obj[method](...args)
            }catch(e){
                return e
            }
        }
        return new Promise((resolve, reject)=>{resolve(null)})
    },
    send(obj, method, ...args){
        if(obj[method]) return obj[method](...args)
        return null
    },
    broadcast(obj, method, ...args){
        if(obj[method]) obj[method](...args)
    }
}

export default Machine