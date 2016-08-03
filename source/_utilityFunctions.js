/*
    General utility functions
*/
function isUndefined(obj) {
    return typeof obj === "undefined";
}


function attachEventHandler(object, type, callback) {
    if (object === null || isUndefined(object)) return;
    if (object.addEventListener) {
        object.addEventListener(type, callback, false);
    } else if (object.attachEvent) {
        object.attachEvent("on" + type, callback);
    } else {
        object["on"+type] = callback;
    }
}

function removeEventHandler(object, type, callback) {
    if (object === null || isUndefined(object)) return;
    if (object.removeEventListener) {
        object.removeEventListener(type, callback, false);
    } else if (object.detachEvent) {
        object.detachEvent("on" + type, callback);
    } else {
        object["on"+type] = null;
    }
}

function parseInteger(v) {
    var val = parseInt(v, 10);
    if (isNaN(val)) return 0;
    return val;
}

function getOuterSizes(d, styleName) {
    return {
        t: parseInteger(getStyle(d, styleName + '-top')),
        r: parseInteger(getStyle(d, styleName + '-right')),
        b: parseInteger(getStyle(d, styleName + '-bottom')),
        l: parseInteger(getStyle(d, styleName + '-left'))
    };
}

function getStyle(x,styleProp) {
    var y;
    if (window.getComputedStyle)
        y = document.defaultView.getComputedStyle(x,null).getPropertyValue(styleProp);
    else if (x.currentStyle)
        y = x.currentStyle[styleProp];
    return y;
}

function hashCode(str) {
    var hash = 0, i, chr, len;
    if (str.length === 0) return hash;
    for (i = 0, len = str.length; i < len; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }

    return hash < 0 ? hash * -1 : hash;
}