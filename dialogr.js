/*jshint */
/*global window, document */

;window.dialogr = (function (window) {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        defaultStrings = {
            'OK_BTN' : 'OK',
            'CANCEL_BTN' : 'Cancel',
            'CLOSE_BTN' : 'Close'
        },
        updateDialogResultCallback,
        dialogDefaults,
        defaultButtons = {},
        dialogResult,
        restoreCSS = {},
        dialog = null;

        defaultButtons[defaultStrings['OK_BTN']] = true;
        defaultButtons[defaultStrings['CANCEL_BTN']] = false;

        dialogDefaults = {
            click : onButtonClick,
            idPrefix : 'dialogr-',
            args : null,
            container : null,
            buttons : null,
            width : null,
            height : null,
            offsetWidth : 0,
            offsetHeight : 0,
            url : null,
            html : null,
            title : null,
            makeButton : null,
            wrapperTemplate : '<div id="{{id}}"></div>'
         };

    function defaults(defaults) {
        dialogDefaults = extend(dialogDefaults, defaults);
    }

    function makeButton(options, args) {
        var elm, cfg = args.config, attr = { type : 'button', id : options.idPrefix + "btn-" + idFromString(args.key)}, text;

        if (cfg) {
            text = args.config.text ? cfg.text : "";
        }
        if(!text) text = args.key;

        elm = createElement('button', attr);
        elm.innerText = text;
        if (cfg['class']) addElementClass(elm, cfg['class']);
        if (cfg.close) addElementClass(elm, "close");
        if (cfg.updateFields) addElementClass(elm, "update-fields");
        return elm;
    }



    function idFromString(str) {
        if (str.match(/^[a-zA-Z]/) === null) {
            str = "a" + str;
        }
        return str.replace(/[^a-zA-Z0-9-_]/,'').toLowerCase();
    }

    function isElement(obj) {
        return (obj && obj.nodeType === 1)
    }

    /**
     * Get the property names for an object
     * @param  Object|null obj   The object to retreive properties from
     * @return string[]     An array of property names
     */
    function getKeys(obj) {
        var properties = [], propertyName;
        if (obj === null) return [];

        if (Object.keys) {
            properties = Object.keys(obj);
        } else {
            for (propertyName in obj) {
                if (hasOwnProperty.call(obj, propertyName)) {
                    properties.push(propertyName);
                }
            }
        }
        return properties;
    }

    /**
     * Returns true of the object is a function
     * @param  {Object}  obj [description]
     * @return Boolean     [description]
     */
    function isFunction(obj) {
        return typeof obj === "function";
    }

    /**
     * Override the properties in defaults with properties in options
     * @param  [object] defaults [description]
     * @param  [object] options  [description]
     * @return [object]          [description]
     */
    function extend(defaults, options) {
        var extended = {},
            prop,
            keys,
            i;

        if (isUndefined(options)) return defaults;

        keys = getKeys(defaults);
        for (i=0; i < keys.length; i += 1) {
            prop = keys[i];
            extended[prop] = defaults[prop];
        }

        keys = getKeys(options);
        for (i=0; i < keys.length; i += 1) {
            prop = keys[i];
            if (options[prop] == null) {
                delete extended[prop];
            } else if( options[prop].constructor == Array ) {
                extended[prop] = options[prop];
            } else if (typeof extended[prop] === "object" && typeof options[prop] === "object") {
                    extended[prop] = extend(extended[prop], options[prop]);
            } else {
                extended[prop] = options[prop];
            }
        }

        if (arguments.length > 2) {
            for (i=2; i < arguments.length; i += 1) {
                extended = extend(extended, arguments[i]);
            }
        }

        return extended;
    }

    /**
     * Return the value of a function, or the raw object if it's not a function
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
    */
    function getOrCall(obj) {
        return isFunction(obj) ? obj() : obj;
    }

    /**
     * Create a new HTML element with the specified properties
     * @param  {[type]} tagName [description]
     * @param  {[type]} attr    [description]
     * @param  {[type]} css     [description]
     * @return {[type]}         [description]
     */
    function createElement(tagName, attr, css) {
        var elmId, i = tagName.indexOf('#');
        if (i !== -1) {
            elmId = dialog.options.idPrefix + idFromString(tagName.substr(tagName.indexOf('#')+1));
            tagName = tagName.substr(0, tagName.indexOf('#'))
        }

        var elm = document.createElement(tagName);
        if (!isUndefined(css)) {
            setElementStyle(elm, css);
        }

        if (!isUndefined(attr)) {
            setElementAttributes(elm, attr);
        }

        if (elmId) {
            setElementAttributes(elm, {id : elmId});
        }
        return elm;
    }


    /**
     * Set the attributes for an element based on the attrObj object
     * Setting the value to null will remove an element
     * @param {[type]} elm     [description]
     * @param {[type]} attrObj [description]
     */
    function setElementAttributes(elm, attrObj) {
        var propertyNames = getKeys(attrObj),
            i;
        if (!isUndefined(elm)) {
            for (i=0; i < propertyNames.length; i+=1) {
                var o = attrObj[propertyNames[i]];

                if (isUndefined(o) || o === null) {
                    if (elm.hasAttribute(propertyNames[i])) {
                        elm.removeAttribute(propertyNames[i]);
                    }
                } else {
                    elm.setAttribute(propertyNames[i], o);
                }
            }
        }
    }

    var storedStyles = {};

    function preserveStyles(selector, styles) {

        if( selector.constructor == Array ) {
            for (var i=0; i < selector.length; i++) {
                preserveStyles(selector[i], styles);
            }
        } else {
            var e = findElement(selector);
            if (e) {
                storedStyles[selector] = {};
                for (var i=0; i < styles.length; i += 1) {
                    storedStyles[selector][styles[i]] = getStyle(e, styles[i]);
                }
            }
        }
    }

    function restoreStyles(selector) {
        if( selector.constructor == Array ) {
            for (var i=0; i < selector.length; i += 1) {
                restoreStyles(selector[i]);
            }
        } else {
            var e = findElement(selector);
            if (e && !isUndefined(storedStyles[selector])) {
                setElementStyle(e, storedStyles[selector]);
            }
        }
    }


    function setElementStyle(elm, cssObj) {
        var propertyNames = getKeys(cssObj),
            i;
        if (typeof elm != "undefined") {
            for (i=0; i < propertyNames.length; i+=1) {
                {
                    elm.style[propertyNames[i]] = cssObj[propertyNames[i]];
                }
            }
        }
    }

    function error(msg) {
        if (console && console.error) {
            console.error("dialogr: " + msg);
        }
    }

    function log(msg) {
        if (console && console.log) {
            console.log("dialogr: " + msg);
        }
    }

    function warn(msg) {
        if (console && console.warn) {
            console.warn("dialogr: " + msg);
        }
    }

    function createFromTemplate(template, options, getHtmlOnly) {

        var tmp = document.createElement('div'),
            i, keys;

        keys =  getKeys(options);
        for (i =0; i < keys.length; i += 1 ) {
            template = template.replace("{{" + keys[i] + "}}",  getOrCall(options[keys[i]]));
        }

        if (getHtmlOnly) {
            return template;
        }

        tmp.innerHTML = template;
        if (tmp.childNodes.length == 1) {
            return tmp.firstChild;
        }
        return tmp.childNodes;
    }

    function onButtonClick(e, eventArgs) {
        if (eventArgs.button.close === true) {
            close();
        }
    }

    function click(key) {
        if (inDialog()) {
            return window.parent.dialogr.click(key);
        }
        if (dialog.options.buttons) {
            var keys = getKeys(dialog.options.buttons),
                i;
            for (i = 0; i < keys.length; i += 1) {
                var btn = dialog.options.buttons[keys[i]]._runtime.elm;
                if (!isUndefined(key) || key === keys[i] ) {
                    btn.click();
                }
            }
        }
    }

    function close() {
        if (dialog && dialog.wrapper) {
            removeEvent(document, 'keydown', keyEventListener);
            removeEvent(window, 'resize', resizeDialog);
            removeEvent(window, 'wheel', preventWheelScroll);

            dialog.wrapper.parentElement.removeChild(dialog.wrapper);
            dialog.overlay.parentElement.removeChild(dialog.overlay);
            dialog = null;
            restoreStyles(['body','html']);
        }
    }

    function keyEventListener(e) {
        if (e.keyCode == 27) {
            close();
        }
    }

    function callMakeFunction(name, element, appendTo) {
        var o = dialog.options;
        if (isFunction(o['make' + name])) {
            element = o['make' + name]({elm : element});
        }
        if (isElement(element)) appendTo.appendChild(element);
        return element;
    }

    function preventWheelScroll(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function open(options) {
        var body, elm, docElm = document.documentElement,
            w = Math.max(docElm.clientWidth, window.innerWidth || 0),
            h = Math.max(docElm.clientHeight, window.innerHeight || 0),
            createFooter = false;

        preserveStyles(['body', 'html'], ['overflow-y']);
        
        
        if (options && options.footerTemplate) createFooter = true;
        if (options && isUndefined(options.buttons)) options.buttons = defaultButtons;

        // Merge options with defaults
        options = extend(dialogDefaults, options);
        dialog = {options : options};

        if (options.buttons) {
            keys = getKeys(options.buttons);
            for (var i=0; i < keys.length; i++) {
                if (options.buttons[keys[i]] === true) {
                    options.buttons[keys[i]] = { 
                        "text" : keys[i],
                        "updateFields" : true,
                        "close" : true,
                        "click" : onButtonClick
                    };
                } else if (options.buttons[keys[i]] === false) {
                    options.buttons[keys[i]] = { 
                        "text" : keys[i],
                        "close" : true,
                        "click" : onButtonClick
                    };
                }
            }
        }

        // Try to use 'body' if no container is specified
        if (!options.container) {
            body = document.getElementsByTagName('body');
            options.container = body.length == 1 ? body[0] : null;
        }

        // exit if there's no container
        if (!options.container) {
            warn("Container was not found");
            return;
        }

        container = options.container;

        // Kill any old dialog laying around! One dialogr at a time please!
        close();

        // Setup this dialog
        dialog.wrapper = createElement("div#wrapper", null, {visibility:'hidden', position : 'fixed', 'z-index' : 50001 })
        dialog.overlay = createElement('div#overlay', null, {visibility:'hidden', 'z-index' : 5000});

        container.appendChild(dialog.overlay);
        container.appendChild(dialog.wrapper);

        if (options.title) {

            var h = createElement('div#header', null, {'overflow-y' : 'auto'});
            var he = createElement('h1');
            he.innerText = options.title;
            h.appendChild(he);

            dialog.header = callMakeFunction('Header', h, dialog.wrapper);
        }

        if (options.html) {
            dialog.content = callMakeFunction('Content', createElement('div#content', null, {'overflow-y' : 'auto'}), dialog.wrapper);
        } else if (options.url) {
            dialog.content = callMakeFunction('Content', createElement('iframe#content', {"src" : options.url, "frameborder" : 0}), dialog.wrapper);
            /*addEvent(dialog.content, 'load', function() {
                alert("AHA!");
            });*/
        }

        if (createFooter || options.buttons) {
            dialog.footer = createElement('div#footer', {"class" : "buttons"}, {'position' : 'absolute'});
            dialog.footer = callMakeFunction('Footer', dialog.footer, dialog.wrapper);
        }

        if (options.buttons && dialog.footer) {
            var keys = getKeys(options.buttons),
                container = hasClass(dialog.footer, 'buttons') ? dialog.footer : dialog.footer.getElementsByClassName('buttons');

            if (container.length && container.length == 1) container = container[0];

            if(container && container.appendChild) {
                for (var i=0; i < keys.length; i += 1) {

                    var btnArgs = {
                            key : keys[i],
                            config : options.buttons[keys[i]],
                            bindEvents : true
                        }, 
                        btn = makeButton(dialog.options, btnArgs);

                    if (isFunction(options.makeButton)) {
                        btnArgs.elm = btn;
                        btn = options.makeButton(btnArgs);
                    }

                    if (!isElement(btn)) {
                        error("makeButton must return a DOM Element");
                        return;
                    }

                    container.appendChild(btn);
                    btn.dialogrButton = keys[i].toString();
                    options.buttons[keys[i]]._runtime = {
                        elm : btn
                    };

                    if (btnArgs.bindEvents) {
                        addEvent(btn, 'click', function(e) {
                            var button = dialog.options.buttons[e.target.dialogrButton],
                                eventArgs = { button : extend(button, {"_runtime" : null})};

                            if (button.updateFields === true) {
                                if (isFunction(updateDialogResultCallback)) {
                                    dialogResult = updateDialogResultCallback();
                                }
                            }

                            eventArgs.result = dialogResult;

                            // Update bound fields
                            if (eventArgs.button.updateFields === true && dialog.options.fieldArgs) {
                                var keys = getKeys(dialog.options.fieldArgs),
                                    i;
                                for (i=0; i < keys.length; i++) {
                                    var elm = findElement( dialog.options.fieldArgs[keys[i]] );
                                    if (!isUndefined(eventArgs.result[keys[i]])) {
                                        setFieldValue(elm, eventArgs.result[keys[i]]);
                                    }
                                }
                            }

                            if (isFunction(button.click)) {
                                button.click(e, eventArgs);
                            } else if (isFunction(dialog.options.click)) {
                                dialog.options.click(e, eventArgs);
                            }

                            if (button.close === true) {
                                close();
                            }

                        });
                    }
                }
            }           
            
         }

         setElementStyle(dialog.overlay, {
            position:'fixed',
            'visibility' : 'visible',
            'background-color' : 'rgba(0,0,0,0.5)',
            'width' : '100%',
            'height' : '100%',
            'z-index' : 5000,
            left : 0,top:0
        }, true);

        resizeDialog();
        addEvent(window, 'resize', resizeDialog);

        setElementStyle(dialog.wrapper, {visibility : 'visible'});
        addEvent(document, 'keydown', keyEventListener);
        addEvent(window, 'wheel', preventWheelScroll);
    }

    function hasClass(elm, className) {
        if (elm.attributes['class']) {
            var value = elm.attributes['class'].value;
            if (value == className) {
                return true;
            } else {
                var parts = value.split(' ');
                for (var i=0; i < parts.length; i += 1) {
                    if (parts.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '') == className) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function addEvent(object, type, callback) {
        if (object == null || isUndefined(object)) return;
        if (object.addEventListener) {
            object.addEventListener(type, callback, false);
        } else if (object.attachEvent) {
            object.attachEvent("on" + type, callback);
        } else {
            object["on"+type] = callback;
        }
    }

    function removeEvent(object, type, callback) {
        if (object == null || isUndefined(object)) return;
        if (object.removeEventListener) {
            object.removeEventListener(type, callback, false);
        } else if (object.detachEvent) {
            object.detachEvent("on" + type, callback);
        } else {
            object["on"+type] = null;
        }
    }

    function resizeDialog() {
        var options = dialog.options,
            docElm = document.documentElement,
            w = Math.max(docElm.clientWidth, window.innerWidth || 0),
            h = Math.max(docElm.clientHeight, window.innerHeight || 0),
            dialogWidth = options.width,
            dialogHeight = options.height;



        if ( (options.width == null && options.height == null) || (parseInt(options.width, 10) > w || parseInt(options.height, 10) > h)) {
            dialogWidth = w + 'px';
            dialogHeight = h + 'px';
            addElementClass(dialog.wrapper, 'dialogr-fullscreen');
            setElementStyle(findElement('body'), {'overflow-y' : 'hidden'});
            setElementStyle(findElement('html'), {'overflow-y' : 'hidden'});
        } else {
            restoreStyles(['body', 'html']);
            removeElementClass(dialog.wrapper, 'dialogr-fullscreen');
            if (getStyle(dialog.wrapper, 'box-sizing') == "border-box") {
                var d = getElementSpacing(dialog.wrapper, true);
                dialogWidth = (parseInt(dialogWidth, 10) - d.left - d.right) + 'px';
                dialogHeight = (parseInt(dialogHeight, 10) - d.top - d.bottom) + 'px';
            } else {
                var d = getPaddingMargin('border-width', dialog.wrapper);
                d = addPropertyValues(d, getPaddingMargin('padding', dialog.wrapper));
                dialogWidth = (parseInt(dialogWidth, 10) - d.left - d.right) + 'px';
                dialogHeight = (parseInt(dialogHeight, 10) - d.top - d.bottom) + 'px';
            }
        }

        setElementStyle(dialog.wrapper, {
           width : dialogWidth, 
           height : dialogHeight,
           left : ((w/2) - (parseInt(dialogWidth)/2)) + 'px',
           top : ((h/2) - (parseInt(dialogHeight)/2)) + 'px'
        });

        var wrapperMargin = getElementSpacing(dialog.wrapper),
            contentSpacing = getElementSpacing(dialog.content, true),
            contentMargin = getPaddingMargin('margin', dialog.content),
            footerMargin = getPaddingMargin('margin', dialog.footer),
            headerMargin = getPaddingMargin('margin', dialog.header);
            
        //console.warn(wrapperMargin);
        if (dialog.footer) contentSpacing.bottom += dialog.footer.offsetHeight ;

        var headerHeight = 0, headerTop = 0 ;
        if (dialog.header) headerHeight = dialog.header.offsetHeight;
        if (dialog.header) headerTop = dialog.header.offsetTop;

        var contentHeight = (parseInt(dialogHeight, 10) - parseInt(headerHeight, 10) - contentSpacing.top - contentSpacing.bottom),
            contentTop = headerHeight + headerTop +  headerMargin.bottom,
            contentWidth = (parseInt(dialogWidth) - contentSpacing.left - contentSpacing.right);

        contentHeight -= (contentMargin.bottom +  contentMargin.top + footerMargin.top +footerMargin.bottom );
        contentWidth -= (contentMargin.left + contentMargin.right );
        
        wrapperBorder = {top:0,bottom:0,right:0,left:0} ;
        if (getStyle(dialog.wrapper, 'box-sizing') == "border-box") {
            var wrapperBorder = getPaddingMargin('border-width', dialog.wrapper);
            wrapperBorder = addPropertyValues(wrapperBorder, getPaddingMargin('padding', dialog.wrapper));
            console.warn(getPaddingMargin('padding', dialog.wrapper));
            console.warn(getPaddingMargin('margin', dialog.wrapper));
            console.warn(getPaddingMargin('border-width', dialog.wrapper));
//            wrapperBorder = addPropertyValues(wrapperBorder, getElementSpacing(dialog.wrapper));
            contentWidth -= wrapperBorder.left + wrapperBorder.right;
            contentHeight -= wrapperBorder.top + wrapperBorder.bottom;
        } else {
//            var wrapperBorder = getPaddingMargin('border-width', dialog.wrapper);
          //  contentWidth -= wrapperBorder.left + wrapperBorder.right;
           // contentHeight -= wrapperBorder.top + wrapperBorder.bottom;
        }

        setElementStyle(dialog.content, {
            position : 'absolute',
            width : contentWidth + 'px',
            height : contentHeight + 'px',
            top : contentTop + 'px'
        });


        if (dialog.footer) {
            contentSpacing = getElementSpacing(dialog.footer);
            setElementStyle(dialog.footer, {
                'width' : (parseInt(dialogWidth) - contentSpacing.left - contentSpacing.right - footerMargin.left - footerMargin.right - wrapperBorder.left - wrapperBorder.right ) + 'px',
                top : (contentTop + dialog.content.offsetHeight + contentMargin.bottom + contentMargin.top  ) + 'px'
            });
        }

    }

    function addElementClass(elm, className) {
        setElementAttributes(elm, {
            "class" : className
        })
    }
    function removeElementClass(elm, className) {
        setElementAttributes(elm, {
            "class" : null
        })
    }

    function getElementSpacing(elm, skipMargin) {

        if (!elm) {return {top : 0, bottom : 0, right : 0, left : 0};}

        var r = getPaddingMargin('padding', elm);

        if(skipMargin !== true) {
            r = addPropertyValues(r, getPaddingMargin('margin', elm));
        }

        if (getStyle(elm, 'box-sizing') == "content-box") {
            r = addPropertyValues(r, getPaddingMargin('border-width', elm));
        } else if (getStyle(elm, 'box-sizing') == "border-box") {
            return {top : 0, bottom : 0, right : 0, left : 0};//getPaddingMargin('padding', elm);
        }


        return r;
    }

    function addPropertyValues(first, second) {
        var keys = getKeys(first),
            i;
        for (i=0; i < keys.length; i++) {
            first[keys[i]] += second[keys[i]];
        }
        return first;
    }

    function getPaddingMargin(type, elm) {
        var padding = {top : 0, right : 0, bottom : 0, left : 0};
        if (!elm) return padding;
        var    paddingStr = getStyle(elm, type),
            paddingArray = paddingStr.split(' '),
            i;


        if (paddingArray.length == 1) {
            i = parseInt(paddingArray[0], 10);
            padding = {top : i, right : i, bottom : i, left : i};
        } else {
            padding = {top : parseInt(paddingArray[0], 10), right : parseInt(paddingArray[1], 10), bottom : parseInt(paddingArray[2], 10), left : parseInt(paddingArray[3], 10)};
        }

        padding.top = isNaN(padding.top) ? 0 : padding.top;
        padding.right = isNaN(padding.right) ? 0 : padding.right;
        padding.bottom = isNaN(padding.bottom) ? padding.top : padding.bottom;
        padding.left = isNaN(padding.left) ? padding.right : padding.left;

        return padding;
    }

    function getStyle(x,styleProp) {
        if (x.currentStyle)
            var y = x.currentStyle[styleProp];
        else if (window.getComputedStyle)
            var y = document.defaultView.getComputedStyle(x,null).getPropertyValue(styleProp);
        return y;
    }

    function findElement(selector, root) {
        var elm = null;
        if(!root) root = document;
        if (selector[0] == "#") {
            elm = document.getElementById(selector.substr(1));
        } else if (selector[0] == ".") {
            elm = document.getElementsByClassName(selector.substr(1));
            if (elm && isUndefined(elm.length)) return elm;
            if (elm.length > 0) {elm = elm[0];} else {elm = null;}
        } else {
            elm = root.querySelector(selector);
            if (elm && isUndefined(elm.length)) return elm;
            if (elm.length > 0) {elm = elm[0];} else {elm = null;}
        }
        return elm;
    }

    function getArgs() {
        if (dialog) {
            var fieldArgs = {},
                o = dialog.options,
                keys,
                i,
                elm;
            if (o.fieldArgs) {
                keys = getKeys(o.fieldArgs),
                    elm = null;
                for (i=0; i < keys.length; i++) {
                    elm = findElement(o.fieldArgs[keys[i]]);
                    if (elm) {
                        fieldArgs[keys[i]] = getFieldValue(elm);
                    }
                }
            }
            return extend(o.args, fieldArgs);
        }
        if (inDialog()) {
            return window.parent.dialogr.getArgs();
        }
    }

    function getFieldValue(elm) {
        if (elm.tagName && (elm.tagName === "INPUT" || elm.tagName === "SELECT" || elm.tagName === "TEXTAREA")) {
            if (elm.attributes["type"] && elm.attributes["type"].value.toLowerCase() === "checkbox") {
                return elm.checked;
            }
            return elm.value;
        }
        return null;
    }
    function setFieldValue(elm, value) {
        if (elm.tagName && (elm.tagName === "INPUT" || elm.tagName === "SELECT" || elm.tagName === "TEXTAREA")) {
            if (elm.attributes["type"] && elm.attributes["type"].value.toLowerCase() === "checkbox") {
                elm.checked = value;
            } else {
                elm.value = value;
            }
        }
    }

    function inDialog() {
        if (window.parent && window.parent!= window && window.parent.dialogr) {
            return window.parent.dialogr.isOpen();
        }
        return false;
    }

    function updateDialogResult(fn) {
        if (inDialog()) {
            window.parent.dialogr.updateDialogResult(fn);
            return;
        }

        updateDialogResultCallback = null;

        if (isFunction(fn)) {
            updateDialogResultCallback = fn;
        } else {
            dialogResult = fn;
            updateDialogResultCallback = function() {
                return dialogResult;
            }
        }

    }

    function isOpen() {
        return dialog ? true : false;
    }

    function disableButton(key) {

        if (inDialog()) {
            window.parent.dialogr.disableButton(key);
            return;
        }

        if (dialog.options.buttons) {
            var keys = getKeys(dialog.options.buttons),
                i;
            for (i = 0; i < keys.length; i += 1) {
                var btn = dialog.options.buttons[keys[i]]._runtime.elm;
                if (!isUndefined(key) || key === keys[i] ) {
                    setElementAttributes(btn, {
                        disabled : "disabled"
                    });
                    addElementClass(btn, 'disabled');
                }
            }
        }
        
    }

    function isUndefined(obj) {
        return typeof obj === "undefined";
    }

    function enableButton(key) {

        if (inDialog()) {
            window.parent.dialogr.enableButton(key);
            return;
        }

        if (dialog.options.buttons) {
            var keys = getKeys(dialog.options.buttons),
                i;
            for (i = 0; i < keys.length; i += 1) {
                var btn = dialog.options.buttons[keys[i]]._runtime.elm;
                if (!isUndefined(key) || key === keys[i] ) {
                    setElementAttributes(btn, {
                        disabled : null
                    });
                    removeElementClass(btn, 'disabled');
                }
            }
        }
    }

    return {
        // Open the dialog
        open : open,
        getArgs : getArgs,


        updateDialogResult : updateDialogResult,
        isOpen : isOpen,

        disableButton : disableButton,
        enableButton : enableButton,
        click : click
    };

}(window));