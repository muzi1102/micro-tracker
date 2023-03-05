export const createHistoryEvent = <T extends keyof History>(type: T) => {
    const origin = history[type];
    return function(this: any){
        // TODO:还是不太理解apply 这里this的指向 妈的
        console.log('arguments', arguments, this);
        const res = origin.apply(this, arguments);
        const e = new Event(type);
        window.dispatchEvent(e);
        return res;
    }
}
