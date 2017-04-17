
/**
 * Utility function to attach an event handler to an object
 * @param  {DOMElement}   object   The DOM Element to attach the event to
 * @param  {string}       type     The name of the event
 * @param  {Function}     callback The callback function
 */
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

/**
 * Utility function get the the innerWidth of an element
 * @param  {DOMElement} obj DOM Element to get innerWidth of. Will use window object if omitted
 * @return {int} The innerWidth of the element
 */
function getInnerWidth(obj) {
    obj = isUndefined(obj) ? win : obj;
    return obj.innerWidth
}

/**
 * Remove an eventhandler from an object
 * TBD
 * @param  {[type]}   object   [description]
 * @param  {[type]}   type     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
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

function setStyle(element, styles) {
    var i,keys = getKeys(styles);
    for (i=0; i < keys.length; i++ ) {
        element.style[keys[i]] = styles[keys[i]];
    }
    return element;
}

function appendChildren(element, soonToBeChildren) {
    var i = 0;
    for (i=0; i < soonToBeChildren.length; i++) {
        element.appendChild(soonToBeChildren[i]);
    }
}

function setAttribute(element, attributes) {
    var i, keys = getKeys(attributes);
    for (i=0; i < keys.length; i++ ) {
        if (attributes[keys[i]] !== null) {
            element.setAttribute(keys[i], attributes[keys[i]]);
        } else {
            element.removeAttribute(keys[i]);
        }
    }
    return element;
}

function setInnerHtml(element, text) {
    element.innerHTML = text;
    return element;
}

function getKeys(object) {
    var n,keys = [];
    for (n in object) {
        if (Object.prototype.hasOwnProperty.call(object, n)) {
            keys.push(n);
        }
    }
    return keys;
}

function createElement(tagName, options) {
    return document.createElement(tagName, options);
}

function getElementSize(elm) {

    var cpadding, cborders, cmargins, borderBox, innerW, innerH, w, h, visible;

    function calculateSize() {

            cpadding = getOuterSizes(elm, "padding");
            cborders = getOuterSizes(elm, "border-width");
            cmargins = getOuterSizes(elm, "margin");
            borderBox = (getStyle(elm, STYLE_BOXSIZING) === STYLE_BORDERBOX);
            visible = (getStyle(elm, "display") === STYLE_DISPLAY_BLOCK);
            

        if (!borderBox) {
            w = parseInteger(getStyle(elm, STYLE_WIDTH)) + cpadding.l + cpadding.r + cmargins.l + cmargins.r + cborders.l + cborders.r;
            h = parseInteger(getStyle(elm, STYLE_HEIGHT)) + cpadding.t + cpadding.b + cmargins.t + cmargins.b + cborders.t + cborders.b;
            innerW = parseInteger(getStyle(elm, STYLE_WIDTH));
            innerH = parseInteger(getStyle(elm, STYLE_HEIGHT));

           // console.warn( h, innerH );
        } else {
            w = parseInteger(getStyle(elm, STYLE_WIDTH));
            h = parseInteger(getStyle(elm, STYLE_HEIGHT));


            innerW = w - cpadding.l - cpadding.r - cmargins.l - cmargins.r - cborders.l - cborders.r;
            innerH = h - cpadding.t - cpadding.b - cmargins.t - cmargins.b - cborders.t - cborders.b;
        }

    }
    
    calculateSize();

    return {
        width : function(){return visible ? w : 0;},
        height : function(){return visible ? h : 0;},
        innerWidth : function(){return innerW;},
        innerHeight : function(){return innerH;},
        padding : cpadding,
        border : cborders,
        margin : cmargins,
        setWidth :  function(newWidth) {
            if (!borderBox) {
                newWidth = parseInteger(newWidth) - cpadding.l - cpadding.r - cmargins.l - cmargins.r - cborders.l - cborders.r;
            } else {
                newWidth = parseInteger(newWidth);
            }
            elm.style.width = newWidth + STYLE_UNIT_PIXELS;
            calculateSize();

        },
        setHeight : function(newHeight) {

            if (!borderBox) {
                newHeight = parseInteger(newHeight) - cpadding.t - cpadding.b - cmargins.t - cmargins.b - cborders.t - cborders.b;
            } else {
                newHeight = parseInteger(newHeight);
            }

            elm.style.height = newHeight + STYLE_UNIT_PIXELS;
            calculateSize();
        },
        setTop : function(newTop) {
            newTop = parseInteger(newTop) ;
            elm.style.top = newTop + STYLE_UNIT_PIXELS;
        },
        setLeft : function(newLeft) {
            newLeft = parseInteger(newLeft) ;
            elm.style.left = newLeft + STYLE_UNIT_PIXELS;
        }
    };
}