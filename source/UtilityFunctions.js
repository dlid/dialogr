/*
    General utility functions
*/
function isUndefined(obj) {
    return typeof obj === "undefined";
}

function uniqid(prefix) {
    prefix = prefix || "u";
    _uniqidix ++;
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4) + _uniqidix;
}


function parseInteger(v) {
    var val = parseInt(v, 10);
    if (isNaN(val)) return 0;
    return val;
}

/**
 * This function will merge the dialog defined buttons with the ones used when opening the dialog
 */
function mergeDialogButtons(dialogButtons, openerButtons) {
    console.warn("Dialog", dialogButtons)
    console.warn("Opener", openerButtons)

    return [];
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


    function extend(obj) {
        Array.prototype.slice.call(arguments, 1).forEach(function(source) {
            if (source) {
                for (var prop in source) {
                    if (source[prop] === null || isUndefined(source[prop])) {
                        delete obj[prop];
                    } else if (source[prop].constructor === Object) {
                        if (!obj[prop] || obj[prop].constructor === Object) {
                            obj[prop] = obj[prop] || {};
                            extend(obj[prop], source[prop]);
                        } else {
                            obj[prop] = source[prop];
                        }
                    } else {
                        obj[prop] = source[prop];
                    }
                }
            }
        });
        return obj;
    }


function makeUrl(parsedUrlObject) {

    var querystring = [];
    for (var key in parsedUrlObject.params) {
        if (parsedUrlObject.params.hasOwnProperty(key)) {
            querystring.push( encodeURIComponent(key) + "=" + encodeURIComponent(parsedUrlObject.params[key]) );
        }
    }

    if (querystring.length > 0) {
        querystring = "?" + querystring.join('&');
    } else {
        querystring = "";
    }

//        console.warn("makeUrl", parsedUrlObject, "=>", parsedUrlObject.url + querystring + parsedUrlObject.hash);

    return parsedUrlObject.url + querystring + parsedUrlObject.hash;
}

function parseUrl(url) {
    var qi = url.indexOf('?'),
        hi = url.indexOf('#'),
        ret = {
            url : url,
            hash : '',
            params : {}
        };

    if (hi != -1) {
        ret.hash = ret.url.substring(hi);
        ret.url = ret.url.substring(0, hi);
    }

    if( qi != -1) {
        
        var d = ret.url.substring(qi+1).split('&');
        ret.url = ret.url.substring(0, qi);
        for (var i=0; i < d.length; i++) {
            var it = d[i].split('=');
            if (it.length == 2) {
                ret.params[it[0]] = it[1];
            } else {
                ret.params[it[0]] = "";
            }
        }
    }

    return ret;

}

function isArray(o) {
    return o.constructor === Array;
}

function logError(message) {
    console.error("[dialogr]", message);
}

function setQuerystringValue(url, params) {
    var u = parseUrl(url);
    u.params = extend({}, u.params, params);
    return makeUrl(u);
}


function getObjectKeys(o) {
    var ret = [];
    if (!Object.keys) {
        for(var key in o) {
            if (Object.prototype.hasOwnProperty.call(o,key)) {
                ret.push(key);
            }
        }
    } else {
        ret = Object.keys(o);
    }
    return ret;
}