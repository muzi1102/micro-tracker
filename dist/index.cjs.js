'use strict';

//版本
var TrackerConfig;
(function (TrackerConfig) {
    TrackerConfig["version"] = "1.0.0";
})(TrackerConfig || (TrackerConfig = {}));

const createHistoryEvent = (type) => {
    const origin = history[type];
    return function () {
        // TODO:还是不太理解apply 这里this的指向 妈的
        console.log('arguments', arguments, this);
        const res = origin.apply(this, arguments);
        const e = new Event(type);
        window.dispatchEvent(e);
        return res;
    };
};

const MouseEventList = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseenter', 'mouseout', 'mouseover'];
class Tracker {
    constructor(options) {
        this.data = Object.assign(this.initDef(), options);
        this.installInnerTrack();
    }
    initDef() {
        // TODO： 重写pushState， 重写就能监听吗？？
        window.history['pushState'] = createHistoryEvent('pushState');
        window.history['replaceState'] = createHistoryEvent('replaceState');
        return {
            sdkVersion: TrackerConfig.version,
            historyTracker: false,
            hashTracker: false,
            domTracker: false,
            jsError: false
        };
    }
    // TODO: 这里的T 我不理解啊啊啊 妈的 好难
    captureEvents(MouseEventList, targetKey, data) {
        // 为什么这里要遍历DOM事件，因为是history的事件;
        MouseEventList.forEach(event => {
            window.addEventListener(event, () => {
                console.log('我监听到了');
                // 数据上报！！
                this.reportTracker({ event, targetKey, data });
            });
        });
    }
    jsError() {
        this.errorEvent();
        this.promiseReject();
    }
    errorEvent() {
        // 代码里面Try catch了怎么处理
        window.addEventListener('error', (e) => {
            this.sendTracker({
                targetKey: 'message',
                event: 'error',
                message: e.message
            });
        });
    }
    promiseReject() {
        window.addEventListener('unhandledrejection', (event) => {
            event.promise.catch(error => {
                this.sendTracker({
                    targetKey: "reject",
                    event: "promise",
                    message: error
                });
            });
        });
    }
    installInnerTrack() {
        // 存在history上报 没有前端路由的要怎么处理
        if (this.data.historyTracker) {
            // 怎么触发监听
            this.captureEvents(['popstate', 'pushState', 'replaceState'], 'history-pv');
        }
        if (this.data.hashTracker) {
            this.captureEvents(['hashchange'], 'history-pv');
        }
        if (this.data.domTracker) {
            this.targetKeyReport();
        }
        if (this.data.jsError) {
            this.jsError();
        }
    }
    reportTracker(data) {
        const param = Object.assign(this.data, data, { time: new Date().getTime() });
        // TODO：这里的类型和json的区别啊啊 
        let headers = {
            type: 'application/x-www-form-urlencoded'
        };
        // TODO: 这里我不理解
        let blob = new Blob([JSON.stringify(param)], headers);
        console.log('blob', blob);
        navigator.sendBeacon(this.data.requestUrl, blob);
    }
    setUserId(uuid) {
        this.data.uuid = uuid;
    }
    setExtra(extra) {
        this.data.extra = extra;
    }
    sendTracker(data) {
        this.reportTracker(data);
    }
    targetKeyReport() {
        MouseEventList.forEach(event => {
            window.addEventListener(event, (e) => {
                console.log('eee0', e);
                const target = e.target;
                const targetValue = target.getAttribute('target-key');
                if (targetValue) {
                    this.sendTracker({
                        targetKey: targetValue,
                        event
                    });
                }
            });
        });
    }
}

module.exports = Tracker;
