    var dialogrDefaults = {
        zIndex : 1500,
        url : null,
        className : 'dialogr',
        width : '90%',
        height : '60%',
        title : null,
        buttons : ["Ok", "Cancel"],
        init : function(e) {
            var d = document.createElement('div');
            d.style.backgroundColor = 'yellow';
            d.innerHTML = "<p>hejsan alla glada</p>";

            e.parentNode.appendChild(d);

        },
        param : null,
        maxWidth : null,
        minWidth : 600
    },
    _uniqidix = 0,
    openedDialog = null,
    insideDialog = false,
    dialogElement = null,
    dialogElement__content = null,
    dialogElement__footer = null,
    dialogOptions = null,
    dialogDeferred = null,
    winloadDeferred,
    dialogId = null,
    self = this;

    var uniqnames = ["Bames", "Lilleskutt", "Skalman", "Vargen", "Teddy", "Jansson", "Husmusen"];

    /*! Deferred (https://github.com/warpdesign/deferred-js) */
    //=require ../build/_deferred_temp.js

    
    function uniqid(prefix) {
        prefix = prefix || "u";
        _uniqidix ++;
        return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4) + _uniqidix;
    }

    var EventingManager = 
		//=require _eventingManager.js 
		;

    attachEventHandler(win, 'keydown', function(e) {
        if (e.keyCode === 27 && dialogElement !== null) {
            close();
        }
    });

    function open(optionsOrUrl, options, id, openingDialogId) {
        
        var dialogInstance,
            openDialogs = _dialogs.slice(0);
				options = options || {};
        if (_dialogContext) {
            dialogInstance = new DialogrDialog(optionsOrUrl, options, {}, true);

            _dialogContext.invoke('dialogr.open', {
                optionsOrUrl : optionsOrUrl,
                options : options,
                newDialogId : dialogInstance.id,
                openerId : _dialogContextDialogId
            }).then(function(d) {

                dialogInstance.$$e.setDialogrId(dialogInstance.id);
                dialogInstance.$$e.setTargetWindow(win);
                dialogInstance.$$e.setNamedTarget('mother', this.messageEvent.source);
            });
            return dialogInstance;
        } else {
            if (openDialogs.length > 0) {
                var maxZindex = 0;
                for (var i=0; i < openDialogs.length; i++){
                    var zi = parseInteger(getStyle(openDialogs[i].$$el.dialog, 'z-index'));
                    if (zi > maxZindex) maxZindex = zi;
                }
                options.zIndex = maxZindex + 10;
            }

            dialogInstance = new DialogrDialog(optionsOrUrl, options, {}, id, openingDialogId);
            
        }

        return dialogInstance;

    }

    //=require _utilityFunctions.js 
 
    //
    // We always want the width and height in pixels
    //
    function normalizeOptions(options) {
        options.width = normalizeSize(options.width, window.innerWidth);
        options.height = normalizeSize(options.height, window.innerHeight);

        options.left =  Math.ceil( (window.innerWidth/2) - (parseInt(options.width,10) / 2)) + 'px';
        options.top =  Math.ceil( (window.innerHeight/2) - (parseInt(options.height,10) / 2)) + 'px';

        return options;
    }

    function normalizeSize(sizeValue, containerSize) {
        var match;

        if (typeof sizeValue === "function") {
            sizeValue = sizeValue(containerSize);
        }

        if (typeof sizeValue === "string") {
            if ( (match = sizeValue.match(/^(\d+)\%$/))) {
                sizeValue = Math.ceil((match[1] / 100) * containerSize) + 'px';
            } else if ( (match = sizeValue.match(/^(\d+)$/))) {
                sizeValue = parseInt(match[1], 10) + 'px';
            }
        } else if (typeof sizeValue === "number") {
            sizeValue = sizeValue + 'px';
        } else {
            sizeValue = 0;
        }
        return sizeValue;
    }



    var _dialogContext = null,
        _dialogContextDialogId = null;

    //
    // The dialogcontext is what is used when inside a dialog
    //
    function DialogContext(openingWindow, successCallback, failCallback) {
        var _eventing = new EventingManager(null, openingWindow, true),
            _context = this;  


        // We should have the dialog id via the querystring
        var u = parseUrl(win.location.href),
            dialogrIdParameter = null;
        if (u.params._dialogrId) {
            dialogrIdParameter = u.params._dialogrId;
        } else {
            console.error("[dialogr] _dialogrId parameter is missing. Can not create dialog context.");
            return;
        }
 
        _eventing.setDialogrId(dialogrIdParameter);

        // Find the opening window.
        _eventing.await('dialogr.find-opener', {
            dialogUrl : window.location.toString(),
            id : dialogrIdParameter
        }, openingWindow).then(function(data) {
            var weAre = {
                child : true,
                motherIdentified : true,
                fatherIdentified : true,
                childId : data.dialogrId
            };
            _context.param = data.param || {};
            _dialogContextDialogId = dialogrIdParameter;
            
            if (data.opener) {
                weAre.fatherIdentified = false;
                _eventing.setIdentity(weAre);
                _eventing.on('dialogr.i-am-your-father', function(data, msg, msgEvent) {
                    _eventing.off('dialogr.i-am-your-father');
                    //console.info("OK! We know who our father is!!", data,msg,msgEvent);
                    _eventing.setNamedTarget('father', msgEvent.source);
                    _context.unblock();
                    successCallback(data);
                });
                //console.warn("["+data.dialogrId+"] WE ARE CHILD (context) (I know mother - where's father?)", data, window.location.href);
                var t= win.parent;
                for (var i=0; i < t.window.frames.length; i++) {
                    _eventing.send("dialogr.find-father", { "frame" : i, "childId" : dialogrIdParameter }, null, t.window.frames[i]);
                }
            } else {
                _eventing.setIdentity(weAre);
               // console.warn("["+data.dialogrId+"] WE ARE CHILD (context) (I know my father+mother)", data, window.location.href);
                _context.unblock();
                successCallback(data);
            }
            
        }, function(r) {
            failCallback(r);
        });

        this.$$e = _eventing;
        this.$$w = openingWindow;
        //this.$$el = _elements;

        this.enable = function(button) {};
        this.disable = function(button) {
            _context.trigger('dialogr.disable-button', button);
        };
        this.addClass = function(elementName, className) {};
        this.removeClass = function(elementName, className) {};
        this.css = function(elementName, styleName, styleValue) {};
        this.attr = function(elementName, key, value) {};
        this.text = function(elementName, newValue) {
            _context.trigger('dialogr.set-text', {
                element : elementName, 
                value : newValue
            });
        };
        this.html = function(elementName, newValue) {
            _context.trigger('dialogr.set-html', {
                element : elementName, 
                value : newValue
            });
        };

        this.on = function(name, callback) {
            _eventing.on(name, callback);
            return _context;
        };
        this.invoke = function(name, data) {
            return _eventing.await(name, data, null, openingWindow);
        };
        
        this.trigger = function(name, data) {
            return _eventing.send(name, data, null, openingWindow);
        };

        this.close = function() {
            _eventing.send('dialogr.close');
        };
        this.block = function() {
            _eventing.send('dialogr.block');
        };
        this.unblock = function() {
            _eventing.send('dialogr.unblock');
        };
        this.resolve = function(data) {
            _eventing.send('dialogr.resolve', data);
        };
        this.reject = function(data){
            _eventing.send('dialogr.reject', data);
        };
        this.param = {};
    }

    function ready() {

        var deferred = self.Deferred();
        insideDialog = true;

        winloadDeferred.done(function() {

            // Setup the dialog context
            _dialogContext = new DialogContext(win.parent, contextReadyCallback, contextFailCallback);

            function contextReadyCallback(r) {
                deferred.resolve(_dialogContext);
            }

            function contextFailCallback(r) {
                deferred.reject(r);
            }
           

        });

         return deferred.promise();

    }


    function getElementSize(elm) {

        var cpadding, cborders, cmargins, borderBox, innerW, innerH, w, h, visible;

        function calculateSize() {

                cpadding = getOuterSizes(elm, "padding");
                cborders = getOuterSizes(elm, "border-width");
                cmargins = getOuterSizes(elm, "margin");
                borderBox = (getStyle(elm, "box-sizing") === "border-box");
                visible = (getStyle(elm, "display") === "block");
                

            if (!borderBox) {
                w = parseInteger(getStyle(elm, 'width')) + cpadding.l + cpadding.r + cmargins.l + cmargins.r + cborders.l + cborders.r;
                h = parseInteger(getStyle(elm, 'height')) + cpadding.t + cpadding.b + cmargins.t + cmargins.b + cborders.t + cborders.b;
                innerW = parseInteger(getStyle(elm, 'width'));
                innerH = parseInteger(getStyle(elm, 'height'));

               // console.warn( h, innerH );
            } else {
                w = parseInteger(getStyle(elm, 'width'));
                h = parseInteger(getStyle(elm, 'height'));


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
                elm.style.width = newWidth + 'px';
                calculateSize();

            },
            setHeight : function(newHeight) {

                if (!borderBox) {
                    newHeight = parseInteger(newHeight) - cpadding.t - cpadding.b - cmargins.t - cmargins.b - cborders.t - cborders.b;
                } else {
                    newHeight = parseInteger(newHeight);
                }

                elm.style.height = newHeight + 'px';
                calculateSize();
            },
            setTop : function(newTop) {
                newTop = parseInteger(newTop) ;
                elm.style.top = newTop + 'px';
            },
            setLeft : function(newLeft) {
                newLeft = parseInteger(newLeft) ;
                elm.style.left = newLeft + 'px';
            }
        };
    }

    function trigger(dialogId, name, data) {
        for (var i=0; i < _dialogs.length; i++) {
            if (_dialogs[i].id == dialogId) {
                _dialogs[i].trigger(name, data);
                break;
            }
        }
    }

    function triggerAs(dialogId, name, data, asDialogId) {
        for (var i=0; i < _dialogs.length; i++) {
            if (_dialogs[i].id == dialogId) {
                _dialogs[i].triggerAs(name, data, asDialogId);
                break;
            }
        }
    }

    function close(dialogId) {
        for (var i=0; i < _dialogs.length; i++) {
            if (_dialogs[i].id == dialogId) {
                return _dialogs[i].close();
            }
        }
    }

    function invokeAs(dialogId, name, data, asDialogId) {
        for (var i=0; i < _dialogs.length; i++) {
            if (_dialogs[i].id == dialogId) {
                return _dialogs[i].invokeAs(name, data, asDialogId);
            }
        }
    }

    function invoke(dialogId, name, data) {
        for (var i=0; i < _dialogs.length; i++) {
            if (_dialogs[i].id == dialogId) {
                return _dialogs[i].invoke(name, data);
            }
        }
    }


    function Dialogr() {
        return {
            open : open,
            ready : ready,
            close : close,
            trigger : trigger,
            'invoke' : invoke,
            triggerAs : triggerAs,
            'invokeAs' : invokeAs,
            deferred : function() {
                return self.Deferred();
            }
        };

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

    function setQuerystringValue(url, params) {
        var u = parseUrl(url);
        u.params = extend({}, u.params, params);
        return makeUrl(u);
    }

    var _dialogs = [];

    


    function onResize(elements, dialogOptions) {

        var dialogElement = elements.dialog,
            dialogElement__loaderOverlay = elements.loaderOverlay,
            dialogElement__content = elements.content,
            dialogElement__footer = elements.footer,
            dialogElement__loader = elements.loader,
            dialogElement__header = elements.header;

        var size = calculateDialogSize(elements, dialogOptions);
        dialogElement.style.width = size.w;
        dialogElement.style.height = size.h;
        dialogElement.style.left = size.l;
        dialogElement.style.top = size.t;

        dialogElement__loaderOverlay.style.width = size.w;
        dialogElement__loaderOverlay.style.height = size.h;
        dialogElement__loaderOverlay.style.left = size.l;
        dialogElement__loaderOverlay.style.top = size.t;

        var dialogSize =  getElementSize(dialogElement),
            headerElement =  getElementSize(dialogElement__header),
            contentElement =  getElementSize(dialogElement__content),
            footerElement =  getElementSize(dialogElement__footer),
            loaderElement = getElementSize(dialogElement__loader);

        contentElement.setWidth( dialogSize.innerWidth() );
        var x =  dialogSize.innerHeight() - footerElement.height() - headerElement.height();

       // alert( getStyle(dialogElement__content, 'visibility') );

//console.warn("content size", contentElement.height());
        contentElement.setHeight( dialogSize.innerHeight() - footerElement.height() - headerElement.height()  );
        footerElement.setTop( contentElement.height() + headerElement.height() );
        footerElement.setWidth( dialogSize.innerWidth() );


        loaderElement.setTop((dialogSize.innerHeight() / 2) - (loaderElement.height()/2));
        loaderElement.setLeft((dialogSize.innerWidth() / 2) - (loaderElement.width()/2));
    }

    function calculateDialogSize(elements, dialogOptions) {
        var width = normalizeSize(dialogOptions.width, window.innerWidth),
            height = normalizeSize(dialogOptions.height, window.innerHeight),
            left =  Math.ceil( (window.innerWidth/2) - (parseInt(width,10) / 2)) + 'px',
            top =  Math.ceil( (window.innerHeight/2) - (parseInt(height,10) / 2)) + 'px',
            actualW = width,
            actualH = height,
            iw = null;

         var padding = getOuterSizes(elements.dialog, "padding"), 
                borders = getOuterSizes(elements.dialog, "border-width"),
                margins = getOuterSizes(elements.dialog, "margin");

             if (parseInteger(dialogOptions.maxWidth) > 0 && parseInteger(actualW) > parseInt(dialogOptions.maxWidth)) {
            width = dialogOptions.maxWidth;
            left =  Math.ceil( (window.innerWidth/2) - (parseInt(width,10) / 2)) + 'px';
            if(getStyle(elements.dialog, "box-sizing") != "border-box") {
                iw = (parseInteger(width) ) + 'px';
            } else {
                iw = (parseInteger(width) - padding.r - padding.l - borders.l - borders.r ) + 'px';
            }
        }

            
        if (getStyle(elements.dialog, "box-sizing") != "border-box") {
            width = (parseInteger(width) - padding.l - padding.r - borders.l - borders.r - margins.l - margins.r) + 'px';
            height = (parseInteger(height) - padding.t - padding.b - borders.t - borders.b - margins.t - margins.b) + 'px';
        }

        if ( parseInteger(actualW) > window.innerWidth || (parseInteger(dialogOptions.minWidth) > 0 && parseInteger(window.innerWidth) < parseInteger(dialogOptions.minWidth))) {
            width = window.innerWidth + 'px';
            height = window.innerHeight + 'px';
            left = '0px';
            top = '0px';

            if(getStyle(elements.dialog, "box-sizing") != "border-box") {
                iw = (parseInteger(width) - padding.r ) + 'px';
            } else {
                iw =  (parseInteger(width) - padding.r - padding.l - borders.l - borders.r ) + 'px';
            }

       
        } else {
            if(getStyle(elements.dialog, "box-sizing") != "border-box") {
                iw = (parseInteger(width) ) + 'px';
            } else {
                iw = (parseInteger(width) - padding.r - padding.l - borders.l - borders.r ) + 'px';
            }
        }

        return {w : width, h : height, l: left, t : top, iw : iw};
    }


    ///
    /// Create and return the DOM elements for the new dialog
    ///
    function createDialogElements(id, dialogOptions) {

        var dialogElement,
            dialogElement__overlay,
            dialogElement__content,
            dialogElement__loaderOverlay,
            dialogElement__loader,
            dialogElement__footer,
            dialogElement__header,
            dialogElement__buttons = [];


        dialogElement = document.createElement('div');
        dialogElement.setAttribute("class", dialogOptions.className);
        dialogElement.style.position = 'fixed';
        dialogElement.style.zIndex = dialogOptions.zIndex;
        dialogElement.style.display = 'block';

        dialogElement__overlay = document.createElement('div');
        dialogElement__overlay.setAttribute("data-dialogr-id", id);
        dialogElement__overlay.setAttribute("class", dialogOptions.className + "__overlay");
        dialogElement__overlay.style.position = 'fixed';
        dialogElement__overlay.style.width = '100%';
        dialogElement__overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        dialogElement__overlay.style.height = '100%';
        dialogElement__overlay.style.top = '0';
        dialogElement__overlay.style.left = '0';
        dialogElement__overlay.style.zIndex = dialogElement.style.zIndex - 10;
        //
       // dialogElement__content.style.visibility = "hidden";

        dialogElement__content = document.createElement('iframe');
        dialogElement__content.setAttribute("class", dialogOptions.className + "__content");
        dialogElement__content.style.position = 'absolute';
        dialogElement__content.style.display = 'block';
        dialogElement__content.style.visibility = "hidden";

        dialogElement__loaderOverlay = document.createElement('div');
        dialogElement__loaderOverlay.setAttribute("class", dialogOptions.className + "__loader-overlay");
        dialogElement__loaderOverlay.style.position = 'fixed';
        dialogElement__loaderOverlay.style.border = '1px solid #aaa';
        dialogElement__loaderOverlay.style.backgroundColor = 'rgba(255,255,255,0.8)';
        dialogElement__loaderOverlay.style.cursor = 'wait';
        dialogElement__loaderOverlay.style.display = 'block';

        dialogElement__loader = document.createElement('div');
        dialogElement__loader.setAttribute("class", dialogOptions.className + "__overlay");
        dialogElement__loader.style.position = 'absolute';
        dialogElement__loader.style.backgroundColor = '#fff';
        dialogElement__loaderOverlay.style.visibility = 'visible';
        dialogElement__loaderOverlay.style.display = 'block';

        dialogElement__loader.innerHTML = "Loading...";        
        dialogElement__loader.style.display = 'block';

        dialogElement__footer = document.createElement('div');
        dialogElement__footer.setAttribute("class", dialogOptions.className + "__footer");
        dialogElement__footer.style.position = 'absolute';
        dialogElement__footer.style.display = 'block';

        dialogElement__header = document.createElement('div');
        dialogElement__header.setAttribute("class", dialogOptions.className + "__header");
        dialogElement__header.style.overflow = 'hidden';
        dialogElement__header.style.display = 'block';


        function createButton(buttonName, buttonHtml) {
            var btn = document.createElement('button');
            btn.setAttribute('id', 'button_' + id + '_' + buttonName);
            btn.setAttribute('onclick', "dialogr.trigger(\"" + id + "\", \"button_" + buttonName + "\");");
            btn.setAttribute('class', "dialogr__button button_" + buttonName);
            btn.innerHTML = buttonHtml;
            return btn;
        }


        var buttonCount = 0,
            buttonIds = [],
            btn,
            key;

        if(!isUndefined(dialogOptions.buttons)) {
            if (dialogOptions.buttons.constructor === Array) {
                for (i=0; i < dialogOptions.buttons.length; i++) {
                    btn = createButton(i, dialogOptions.buttons[i]);
                    dialogElement__footer.appendChild(btn);
                    dialogElement__buttons["button_" + i] = btn;
                        buttonCount++;
                }
            } else if (typeof dialogOptions.buttons === "object") {
                for (key in dialogOptions.buttons) {
                    if (dialogOptions.buttons.hasOwnProperty(key)) {
                        btn = createButton(key, dialogOptions.buttons[i]);
                        dialogElement__footer.appendChild(btn);
                        dialogElement__buttons["button_" + key] = btn;
                        buttonCount++;
                    }
                }
            }
        }

        if ( buttonCount === 0) {
            dialogElement__footer.style.display = "none";
        }

        if (!dialogOptions.title) {
            dialogElement__header.style.display = "none";
        } else {
            dialogElement__header.innerHTML = "<a href='javascript:dialogr.close(\"" + id + "\")'>x</a><h1>" + dialogOptions.title + "</h1>";
        }
        
        dialogElement.appendChild(dialogElement__header);
        dialogElement.appendChild(dialogElement__content);
        dialogElement.appendChild(dialogElement__footer);
        dialogElement__loaderOverlay.appendChild(dialogElement__loader);
        dialogElement.appendChild(dialogElement__loaderOverlay);

        return {
            overlay : dialogElement__overlay,
            loaderOverlay : dialogElement__loaderOverlay,
            loader : dialogElement__loader,
            dialog : dialogElement,
            header : dialogElement__header,
            footer : dialogElement__footer,
            content : dialogElement__content,
            buttons : dialogElement__buttons,
            destroy : function() {},
            addToDom : function() {
                document.body.appendChild(dialogElement);
                document.body.appendChild(dialogElement__overlay);
            }
        };
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

    
    winloadDeferred = this.Deferred();

    if (document.readyState === "complete") {
        winloadDeferred.resolve();
    } else {
        attachEventHandler(window, 'load', function() {
            winloadDeferred.resolve();
        });
    }
