import { Options, DefaultOptons, TrackerConfig, reportTrackerData } from "../types/index";
import { createHistoryEvent } from '../utils/pv';

const MouseEventList: string[] = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseenter', 'mouseout', 'mouseover']


export default class Tracker {
    public data: Options;
    constructor(options: Options){
        this.data = Object.assign(this.initDef(), options);
        this.installInnerTrack();
    }
    private initDef(): DefaultOptons{
        // TODO： 重写pushState， 重写就能监听吗？？
        window.history['pushState'] = createHistoryEvent('pushState');
        window.history['replaceState'] = createHistoryEvent('replaceState');
        return <DefaultOptons>{
            sdkVersion: TrackerConfig.version,
            historyTracker: false,
            hashTracker: false,
            domTracker: false,
            jsError: false
        }
    }

    // TODO: 这里的T 我不理解啊啊啊 妈的 好难
    private captureEvents<T>(MouseEventList: string[], targetKey: string, data?: T){
        // 为什么这里要遍历DOM事件，因为是history的事件;
        MouseEventList.forEach(event => {
            window.addEventListener(event, () => {
                console.log('我监听到了');
                // 数据上报！！
                this.reportTracker({ event, targetKey, data })
            })
        })
    }



    private jsError() {
        this.errorEvent()
        this.promiseReject()
    }

    private errorEvent(){
        // 代码里面Try catch了怎么处理
        window.addEventListener('error', (e) => {
            this.sendTracker({
                targetKey: 'message',
                event: 'error',
                message: e.message
            })
        })
    }

    private promiseReject() {
        window.addEventListener('unhandledrejection', (event) => {
            event.promise.catch(error => {
                this.sendTracker({
                    targetKey: "reject",
                    event: "promise",
                    message: error
                })
            })
        })
    }

    private installInnerTrack(){
        // 存在history上报 没有前端路由的要怎么处理
        if (this.data.historyTracker) {
            // 怎么触发监听
            this.captureEvents(['popstate', 'pushState', 'replaceState'], 'history-pv');
        }
        if (this.data.hashTracker) {
            this.captureEvents(['hashchange'], 'history-pv');
        }

        if (this.data.domTracker) {
            this.targetKeyReport()
        }

        if (this.data.jsError) {
            this.jsError();
        }
    }

    

    private reportTracker<T>(data: T){
        const param = Object.assign(this.data, data, { time: new Date().getTime() })
        // TODO：这里的类型和json的区别啊啊 
        let headers = {
            type: 'application/x-www-form-urlencoded'
        };

        // TODO: 这里我不理解
        let blob = new Blob([JSON.stringify(param)], headers);
        console.log('blob', blob);
        navigator.sendBeacon(this.data.requestUrl, blob);
    }

    public setUserId<T extends DefaultOptons['uuid']>(uuid: T) {
        this.data.uuid = uuid;
    }

    public setExtra<T extends DefaultOptons['extra']>(extra: T) {
        this.data.extra = extra
    }

    public sendTracker<T extends reportTrackerData>(data:T){
        this.reportTracker(data);
    }

    private targetKeyReport(){
        MouseEventList.forEach(event => {
            window.addEventListener(event, (e) => {
                console.log('eee0', e);
                const target = e.target as HTMLElement;
                const targetValue = target.getAttribute('target-key');
                if (targetValue) {
                    this.sendTracker({
                        targetKey: targetValue,
                        event
                    })
                }
            })
        })
    }


}
