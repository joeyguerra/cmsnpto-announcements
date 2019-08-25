const MessagePassing = {
    MessageNotHandled(m){
        return {
            error: m | "Message Not Handled"
        }
    },
    sendMessageTo(obj, selector, ...parameters){
        if(obj[selector]) return obj[selector](...parameters)
        else return MessageNotHandled()
    },
    async sendAsyncMessageTo(obj, selector, ...parameters){
        if(obj[selector]) return await obj[selector](...parameters)
        else return MessageNotHandled()
    }
}
export default MessagePassing