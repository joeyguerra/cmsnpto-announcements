
export const MessageNotHandled = m => {
    return {
        error: m | "Message Not Handled"
    }
}
export const sendMessageTo = (obj, selector, ...parameters) => {
    if(obj[selector]) return obj[selector](...parameters)
    else return MessageNotHandled()
}

export const sendAsyncMessageTo = async (obj, selector, ...parameters) => {
    if(obj[selector]) return await obj[selector](...parameters)
    else return MessageNotHandled()
}