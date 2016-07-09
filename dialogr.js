/*jshint */
/*global window, document */

(function(win) {

    var dialogrDefaults = {
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
    dialogId = null;
    self = this;

    var uniqnames = ["Bames", "Lilleskutt", "Skalman", "Vargen", "Teddy", "Jansson", "Husmusen"]

    function uniqid(prefix) {
        prefix = prefix || "u";
        _uniqidix ++;
        return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4) + _uniqidix;
    }


    function EventingManager(eventingDialogId, targetWindow, isDialogContext, openingDialogId) {

        console.warn("NEW EventingManager", arguments, window.location.href.toString());

        var _targetWindow = targetWindow || null,
            _eventingTargetWindow = null,
            _messageId = 0,
            _messageIdPrefix = uniqid('m'),
            _eventHandlers = {},
            _boundDialogId = null,
            _direction = "";

        function reset() {
            _messageIdPrefix = uniqid('m');
            _eventHandlers = {};
        }

        function on(eventName, callback) {
            if (isUndefined(_eventHandlers[eventName])) _eventHandlers[eventName] = [];
            _eventHandlers[eventName].push(callback);
          //  console.warn("on", eventingDialogId, eventName, _eventHandlers, window.location);
        }

        function off(eventName, callback) {
//            if (!isUndefined(_eventHandlers[eventName])) _eventHandlers[eventName] = [];
            return this;
        }

        attachEventHandler(window, 'message', messageHandler);

        function send(name, data, options, targetWindow, asDialogId) {

            options = extend({
                await : null,
                messageId : null
            }, options || {});

            if (!targetWindow) {
                if (_targetWindow) {
                    targetWindow = _targetWindow;
                }
            }

            if(asDialogId) {
                console.warn("SEND AS", asDialogId, name, data);
            }

            if (!options.messageId) {
                _messageId++;
                options.messageId =  _messageIdPrefix + "_" + _messageId;
            }

             var message = {
                direction : _direction,
                source : 'dialogr',
                messageType : name,
                messageData : data,
                messageId : options.messageId,
                dialogrId : asDialogId ? asDialogId : _boundDialogId,
                await : options.await
            };
            console.warn("[x]", {
                isDialogContext : isDialogContext,
                _boundDialogId : _boundDialogId
            });

            var targetName = (!isDialogContext ? (_boundDialogId ? _boundDialogId : 'NONAME') : 'ROOT');
            
             if (_eventingTargetWindow) {
                if (message.messageType.indexOf('dialogr.') === -1 || 
                    message.messageType === "dialogr.reject") {
                    targetWindow = _eventingTargetWindow;
                    targetName = "father";

                }
            }

            console.info('[' + (isDialogContext ? (_boundDialogId ? _boundDialogId : 'NONAME') : 'ROOT' + (_boundDialogId ? ":" + _boundDialogId : ':UNBOUND')) + ']=>[' + targetName + "]", name, message, window.location.href);

           

            targetWindow.postMessage(JSON.stringify(message), '*');

        }

        if (targetWindow == null) {
            _direction = "opener=>dialog";
        } else {
            _direction = "dialog=>opener";
        }

        function messageHandler(e) {
            if (e.source == window) {
                console.warn("same source")
                return;
            }
           
            var o;
            try { o = JSON.parse(e.data); } catch(e) {}
            if (o) {
                if (!isUndefined(o.source) && o.source === "dialogr") {

                    if (!_boundDialogId) {
                        if (o.messageType.indexOf('dialogr.find-opener') === -1) {
                            console.warn("["+_boundDialogId+"]."+eventingDialogId+" Ignoring message (no dialog id is set)", o, window.location);
                            return;
                        }
                    } else if (_boundDialogId !== o.dialogrId) {
                       /*  if (isDialogContext && _dialogs.length > 0) {
                            console.warn("I en dialog, finns", o.dialogrId, "bland barnen? ->", _dialogs);
                            for (var i=0; i < _dialogs.length; i++) {
                                if (_dialogs[i].id == o.dialogrId) {
                                    console.warn("hittade", _dialogs[i]);
                                    return;
                                }
                            }
                        }*/

                        console.info("[" + (isDialogContext ? (_boundDialogId ? _boundDialogId : 'NONAME') : (openingDialogId ? openingDialogId : 'ROOT') + (_boundDialogId ? ":" + _boundDialogId : ':UNBOUND')) + "] ignoring....", o.messageType, o, window.location);
                        return;
                    }

                    if (o.messageType == "dialogr.i-am-your-father") {
                        setEventingTargetWindow(e.source);
                        document.getElementsByTagName('body')[0].style.backgroundColor = 'orange';
                        console.info("Ok. Send non-dialogr-stuff here: ", openingDialogId, e);
                        return;
                    }

                    console.info("[" + (isDialogContext ? (_boundDialogId ? _boundDialogId : 'NONAME') :  (openingDialogId ? openingDialogId : 'ROOT') + (_boundDialogId ? ":" + _boundDialogId : ':UNBOUND')) + "].receive", o.messageType, o);

                    if (isUndefined(_eventHandlers[o.messageType])) {
                        if (openingDialogId && !_dialogContext && o.messageType.indexOf('dialogr.') !== 0) {
                            console.info("Meddelande från " + o.dialogrId +  " - skicka vidare till dialogen som öppnade den: ", openingDialogId, o.await);
                            if (o.await) {
                                dialogr.invokeAs(openingDialogId, o.messageType, o.messageData, o.dialogrId).then(function(dddd) {
                                    console.warn("InvokeAs fungerade iaf...", dddd);
                                }, function(ddd) {
                                    console.warn("InvokeAs fungerade INTE!!", ddd);
                                });
                            } else {
                                dialogr.triggerAs(openingDialogId, o.messageType, o.messageData, o.dialogrId);
                            }
                            return;
                        }
                    }

                   
                    if(!isUndefined(_eventHandlers[o.messageType])) {
                        console.warn("handlers", eventingDialogId, _eventHandlers);
                        if (!o.await) {
                            for (var i = 0; i < _eventHandlers[o.messageType].length; i++) {
                                var fnRet = _eventHandlers[o.messageType][i](o.messageData, o, e);
                            }
                        } else {

                            var _boundEventHandlers = _eventHandlers[o.messageType].slice(0),
                                 n = 0,
                                responses = [],
                                timer = null,
                                isSuccess = true;

                            function callbackReady(data) {
                                n++;
                                if (data.type === "fail") isSuccess = false;

                                responses.push(data);
                                if (n === _boundEventHandlers.length) {
                                    clearTimeout(timer);
                                    send(o.messageId + "_response", {
                                        type : isSuccess ? "success" : "fail",
                                        response : responses
                                    }, null, e.source);
                                }
                            }

                            timer = setTimeout(function() {
                                send(o.messageId + "_response", {
                                    type : "fail",
                                    response : ["Operation took too long > " + o.await + "ms"]
                                }, null, e.source);
                            }, o.await);

                            for (var i = 0; i < _boundEventHandlers.length; i++) {
                                var fnRet = _boundEventHandlers[i](o.messageData, o, e);
                                
                                if (o.await) {
                                    if (fnRet && fnRet.done && fnRet.fail && fnRet.promise) {

                                        fnRet.then(function(r) {

                                            if (!timer) return;
                                            callbackReady( {
                                                index : i,
                                                type : "success",
                                                data : r
                                            });
                                        },
                                        function(r) {
                                            if (!timer) return;
                                            callbackReady({
                                                index : i,
                                                type : "fail",
                                                data : r
                                            });
                                        });
                                    } else {
                                        if (!timer) return;
                                        callbackReady( {
                                            apa : 3,
                                            index : i,
                                            type : "success",
                                            data : fnRet
                                        });
                                    }
                                }
                            }
                        }
                    } else {
                        if (o.await) {
                            console.warn("no handlers in", eventingDialogId, _eventHandlers, window.location);
                            // No listeners? Let's just return a success without any data
                            send(o.messageId + "_response", {
                                type : "fail",
                                response : ["Nothing listening for '" + o.messageType + "'"]
                            }, null, e.source);
                        }
                    }
                }
            }
        }

        function sendAndWait(name, data, options, targetWindow, asDialogId) {
            var d = self.Deferred();
            options = extend({
                await : 5000
            }, options || {});

            // Create the id here so we can start listening for the reply before sending the message
            _messageId++;
            options.messageId =  name + "://await" + _messageIdPrefix + _messageId;

            on(options.messageId + "_response", function(r) {
                
                var responseData = [];
                for (var i=0; i < r.response.length; i++) {
                    if (typeof r.response[i] === "string") {
                         responseData.push(r.response[i]);
                    } else if (r.response[i].data ) {
                        responseData.push(r.response[i].data );
                    }
                }
                if (r.type === "fail") {
                    d.reject( responseData.length == 1 ? responseData[0] : responseData );
                } else {
                    d.resolve( responseData.length == 1 ? responseData[0] : responseData );
                }
            });
            var msg = send(name, data, options, targetWindow, asDialogId);
            return d.promise();
        }

        function setDialogrId(id) {
            console.warn("SETDALOGRID", eventingDialogId, id);
            _boundDialogId = id;
        }

        function setTargetWindow(targetWin) {
            _targetWindow = targetWin;
        }

        function setEventingTargetWindow(targetWin) {
            _eventingTargetWindow = targetWin;
        }

        return {
            send : send,
            await : sendAndWait,
            setDialogrId : setDialogrId,
            setTargetWindow : setTargetWindow,
            on : on,
            off : off,
            handleMessage : messageHandler,
            $$eventHandlers : _eventHandlers
        }

    }


    var eventing = (function() {

        var messageId = 0,
            messageIdPrefix,
            eventHandlers;

        function reset() {
            hashCode(window.location.toString()) + (new Date()).getTime() + "_";
            eventHandlers = {};
        }

        function on(eventName, callback) {
            if (isUndefined(eventHandlers[eventName])) eventHandlers[eventName] = [];
            eventHandlers[eventName].push(callback);
        }

        function off(eventName, callback) {
            console.error("eventing.off not implemented");
            return this;
        }

        function isOpener() {
            return (dialogElement !== null);
        }

        attachEventHandler(window, 'message', messageHandler);

   
        function messageHandler(e) {
            //console.warn("incoming-message", e);
            return;
            if (e.source == window) {
                console.warn("same source")
                return;
            }
           
            var o;
            try { o = JSON.parse(e.data); } catch(e) {}
            if (o) {
                if (!isUndefined(o.source) && o.source === "dialogr") {
                    //console.warn("eventing.received("+(isOpener() ? "opener":"dialog")+")", o.messageType, o);

                    if(!isUndefined(eventHandlers[o.messageType])) {

                        if (!o.await) {
                            for (var i = 0; i < eventHandlers[o.messageType].length; i++) {
                                var fnRet = eventHandlers[o.messageType][i](o.messageData, o);

                            }
                        } else {

                            var n = 0,
                                responses = [],
                                timer = null,
                                isSuccess = true;

                            function callbackReady(data) {
                                n++;
                                if (data.type === "fail") isSuccess = false;

                                responses.push(data);
                                if (n === n, eventHandlers[o.messageType].length) {
                                    clearTimeout(timer);
                                    send(o.messageId + "_response", {
                                        type : isSuccess ? "success" : "fail",
                                        response : responses
                                    });
                                }
                            }

                            timer = setTimeout(function() {
                                send(o.messageId + "_response", {
                                    type : "fail",
                                    response : ["Operation took too long > " + o.await + "ms"]
                                });
                            }, o.await);

                            for (var i = 0; i < eventHandlers[o.messageType].length; i++) {
                                var fnRet = eventHandlers[o.messageType][i](o.messageData, o);
                                console.warn("fnRet", o);
                                if (o.await) {
                                    console.warn("is await");
                                    if (fnRet && fnRet.done && fnRet.fail && fnRet.promise) {
                                    console.warn("is romise");
                                        fnRet.then(function(r) {
                                            if (!timer) return;
                                            console.warn("success, yes?");
                                            callbackReady( {
                                                index : i,
                                                type : "success",
                                                data : r
                                            });
                                        },
                                        function(r) {
                                            if (!timer) return;
                                            callbackReady({
                                                index : i,
                                                type : "fail",
                                                data : r
                                            });
                                        });
                                    } else {
                                        if (!timer) return;
                                        callbackReady( {
                                            apa : 3,
                                            index : i,
                                            type : "success",
                                            data : fnRet
                                        });
                                    }
                                }
                            }
                        }
                    } else {
                        if (o.await) {
                            // No listeners? Let's just return a success without any data
                            send(o.messageId + "_response", {
                                type : "fail",
                                response : ["Nothing listening for '" + o.messageType + "'"]
                            });
                        }
                    }
                }
            }
        }

        function send(name, data, options) {

            options = extend({
                await : null,
                messageId : null
            }, options || {});


            if (!options.messageId) {
                messageId++;
                options.messageId =  messageIdPrefix + messageId;
            }
            
            var message = {
                source : 'dialogr',
                messageType : name,
                messageData : data,
                messageId : options.messageId,
                dialogId : dialogId,
                await : options.await
            };

            if (options.replyTo) {

            }

            if (isOpener()) {
                 dialogElement__content.contentWindow.postMessage(JSON.stringify(message), '*');
            } else {
                win.parent.postMessage(JSON.stringify(message), '*');
            }

            return message;
        }

        function sendAndWait(name, data, options) {
            var d = self.Deferred();
            options = extend({
                await : 5000
            }, options || {});

            // Create the id here so we can start listening for the reply before sending the message
            messageId++;
            options.messageId =  "await_" + name + "_" + messageIdPrefix + messageId;

            on(options.messageId + "_response", function(r) {
                console.warn("response", JSON.stringify(r));
                var responseData = [];
                for (var i=0; i < r.response.length; i++) {
                    if (r.response[i].data ) {
                        responseData.push(r.response[i].data );
                    } else if (typeof r.response[i] === "string") {
                        responseData.push(r.response[i]);
                    }
                }

                console.warn("response", JSON.stringify(responseData));

                if (r.type === "fail") {
                    d.reject( responseData.length == 1 ? responseData[0] : responseData );
                } else {
                    d.resolve( responseData.length == 1 ? responseData[0] : responseData );
                }
            });
            var msg = send(name, data, options);
            return d.promise();
        }

        reset();
        return {
            'on' : on,
            'off' : off,
            'send' : send,
            'await' : sendAndWait,
            'reset' : reset
        }
    }());

    attachEventHandler(win, 'keydown', function(e) {
        if (e.keyCode === 27 && dialogElement != null) {
            close();
        }
    });


    /*function messageHandler(e) {
        if (dialogElement__content) {
            if (e.source == dialogElement__content.contentWindow) {
                var o;
                try {o = JSON.parse(e.data)} catch(e){}
                if (o && o.source && o.source == "dialogr") {
                    dialogId = o.id;

                    eventing.send('hello', {

                    });

                    dialogElement__content.contentWindow.postMessage(JSON.stringify({
                        'source' : 'dialogr',
                        'event' : 'hello',
                        'param' : dialogOptions.param,
                        'id' : o.id
                    }), '*');
                    dialogElement__loaderOverlay.style.visibility = "hidden";
                    dialogElement__content.style.visibility = "visible";
                }
            }
        }
    }*/

    function open(optionsOrUrl, options, id, openingDialogId) {
        
        var dialogInstance;
        if (_dialogContext) {
            dialogInstance = new DialogrDialog(optionsOrUrl, options, true);

            _dialogContext.invoke('dialogr.open', {
                optionsOrUrl : optionsOrUrl,
                options : options,
                newDialogId : dialogInstance.id,
                openerId : _dialogContextDialogId
            }).then(function(d) {
                console.info("ok, dialog from dialog was opened", d, "set eventing id to", dialogInstance.id);
                console.info("aand set eventing target window to", win.location.toString());
                dialogInstance.$$e.setDialogrId(dialogInstance.id);
                //dialogInstance.$$e.setEventTargetWindow(win);
            });
            return dialogInstance;
        } else {
            dialogInstance = new DialogrDialog(optionsOrUrl, options, id, openingDialogId);
        }

       // dialogDeferred = self.Deferred();

        return dialogInstance;

       // eventing.reset(); // Reset


        /*eventing.off('ready').on('ready', function(e) {
            var deferred = dialogr.deferred();
            
            /*dialogElement__content.contentWindow.postMessage(JSON.stringify({
                'source' : 'dialogr',
                'event' : 'hello',
                'param' : dialogOptions.param,
                'id' : o.id
            }), '*');* /
            dialogElement__loaderOverlay.style.visibility = "hidden";
            dialogElement__content.style.visibility = "visible";

            deferred.resolve({
                'param' : dialogOptions.param
            });

            return deferred.promise();
        });

        eventing.off('dialogr.block').on('dialogr.block', function() {
             dialogElement__loaderOverlay.style.visibility = "visible";
        });

        eventing.off('dialogr.unblock').on('dialogr.unblock', function() {
             dialogElement__loaderOverlay.style.visibility = "hidden";
        });

        eventing.off('dialogr.resolve').on('dialogr.resolve', function(d) {
             dialogDeferred.resolve(d);
             close();
        });

       eventing.off('dialogr.reject').on('dialogr.reject', function(d) {
             dialogDeferred.reject(d);
             close();
        });

        eventing.off('dialogr.close').on('dialogr.close', function(d) {
             close();
        });*/

      // attachEventHandler(window, 'message', messageHandler);
    // removeEventHandler(window, 'message', messageHandler);


//        window.addEventListener("message", messageHandler, true);
       

        console.warn( "body original overflow-y", getStyle(document.getElementsByTagName('body')[0], 'overflow-y') );

        document.getElementsByTagName('body')[0].style.overflowY = 'hidden';

        dialogElement = document.createElement('div');
        dialogElement.setAttribute("class", dialogOptions.className);
        dialogElement.style.position = 'fixed';
        dialogElement.style.zIndex = '150';
        document.body.appendChild(dialogElement);

        dialogElement__overlay = document.createElement('iframe');
        dialogElement__overlay.setAttribute("class", dialogOptions.className + "__overlay");
        dialogElement__overlay.style.position = 'fixed';
        dialogElement__overlay.style.width = '100%';
        dialogElement__overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        dialogElement__overlay.style.height = '100%';
        dialogElement__overlay.style.top = '0';
        dialogElement__overlay.style.left = '0';
        dialogElement__overlay.style.zIndex = '100';
         document.body.appendChild(dialogElement__overlay);
       // dialogElement__content.style.visibility = "hidden";

        dialogElement__content = document.createElement('iframe');
        dialogElement__content.setAttribute("class", dialogOptions.className + "__content");
        dialogElement__content.style.position = 'absolute';
        dialogElement__content.style.visibility = "hidden";

        dialogElement__loaderOverlay = document.createElement('div');
        dialogElement__loaderOverlay.setAttribute("class", dialogOptions.className + "__loader-overlay");
        dialogElement__loaderOverlay.style.position = 'fixed';
        dialogElement__loaderOverlay.style.border = '1px solid #aaa';
        dialogElement__loaderOverlay.style.backgroundColor = 'rgba(255,255,255,0.8)';
        dialogElement__loaderOverlay.style.cursor = 'wait';

        dialogElement__loader = document.createElement('div');
        dialogElement__loader.setAttribute("class", dialogOptions.className + "__overlay");
        dialogElement__loader.style.position = 'absolute';
        dialogElement__loader.style.backgroundColor = '#fff';
        dialogElement__loaderOverlay.style.visibility = 'visible';

        dialogElement__loader.innerHTML = "Loading...";        

        dialogElement__footer = document.createElement('div');
        dialogElement__footer.setAttribute("class", dialogOptions.className + "__footer");
        dialogElement__footer.style.position = 'absolute';

        dialogElement__header = document.createElement('div');
        dialogElement__header.setAttribute("class", dialogOptions.className + "__header");
        dialogElement__header.style.overflow = 'hidden';


        var buttonCount = 0;

        if(typeof dialogOptions.buttons !== "undefined") {
            if (dialogOptions.buttons.constructor === Array) {
                for (var i=0; i < dialogOptions.buttons.length; i++) {
                    dialogElement__footer.innerHTML += "<button  onclick='javascript:dialogr.trigger(\"button_" + key + "\")' class='dialogr__button'>" + dialogOptions.buttons[i] + "</button>";
                    buttonCount++;
                }
            } else if (typeof dialogOptions.buttons === "object") {
                for (var key in dialogOptions.buttons) {
                    if (dialogOptions.buttons.hasOwnProperty(key)) {
                        dialogElement__footer.innerHTML += "<button onclick='javascript:dialogr.trigger(\"button_" + key + "\")' class='dialogr__button' >" + dialogOptions.buttons[key].text + "</button>";
                    buttonCount++;
                    }
                }
            }
        }

        if (buttonCount == 0) {
            dialogElement__footer.style.display = "none";
        }

        if (!dialogOptions.title) {
            dialogElement__header.style.display = "none";
        } else {
            dialogElement__header.innerHTML = "<a href='javascript:dialogr.close()'>x</a><h1>" + dialogOptions.title + "</h1>";
        }
        
        dialogElement.appendChild(dialogElement__header);
        dialogElement.appendChild(dialogElement__content);
        dialogElement.appendChild(dialogElement__footer);
        dialogElement__loaderOverlay.appendChild(dialogElement__loader);
        dialogElement.appendChild(dialogElement__loaderOverlay);


        setTimeout(onResize, 5);

        attachEventHandler(window, 'resize', onResize);
        openedDialog = true;

        dialogElement__content.setAttribute('src', dialogOptions.url);

        var promise = dialogDeferred.promise();

        promise.on = function(name, callback) {
            eventing.on(name, function(e) {
                return callback(e);
            });
            return this;
        }

        return dialogDeferred.promise();
    }

    function isUndefined(obj) {
        return typeof obj === "undefined";
    }


    function attachEventHandler(object, type, callback) {
        if (object == null || isUndefined(object)) return;
        if (object.addEventListener) {
            object.addEventListener(type, callback, false);
        } else if (object.attachEvent) {
            object.attachEvent("on" + type, callback);
        } else {
            object["on"+type] = callback;
        }
    }

    function removeEventHandler(object, type, callback) {
        if (object == null || isUndefined(object)) return;
        if (object.removeEventListener) {
            object.removeEventListener(type, callback, false);
        } else if (object.detachEvent) {
            object.detachEvent("on" + type, callback);
        } else {
            object["on"+type] = null;
        }
    }

    function parseInteger(v) {
        return parseInt(v, 10);
    }

    function getOuterSizes(d, styleName) {
        var p = getStyle(d, styleName),
                match,
                ret = {t:0,r:0,b:0,l:0};

//                console.warn( p, styleName );
            if (match = p.match(/^(\d+)px$/)) {
                ret = {t : parseInteger(match[1]), l : parseInteger(match[1]), b : parseInteger(match[1]), r : parseInteger(match[1])}
            } else if (match = p.match(/^(\d+)px (\d+)px$/)) {
                ret = {t : parseInteger(match[1]), l : parseInteger(match[2]), b : parseInteger(match[1]), r : parseInteger(match[2])}
            } else if (match = p.match(/^(\d+)px (\d+)px (\d+)px (\d+)px$/)) {
                ret = {t : parseInteger(match[1]), l : parseInteger(match[4]), b : parseInteger(match[3]), r : parseInteger(match[2])}
            } else if (match = p.match(/^(\d+)px (\d+)px (\d+)px$/)) {
                ret = {t : parseInteger(match[1]), l : parseInteger(match[2]), b : parseInteger(match[3]), r : parseInteger(match[2])}
            }
            return ret;
    }

    function getStyle(x,styleProp) {
        if (x.currentStyle)
            var y = x.currentStyle[styleProp];
        else if (window.getComputedStyle)
            var y = document.defaultView.getComputedStyle(x,null).getPropertyValue(styleProp);
        return y;
    }

    //
    // We always want the width and height in pixels
    //
    function normalizeOptions(options) {
        options.width = normalizeSize(options.width, window.innerWidth);
        options.height = normalizeSize(options.height, window.innerHeight);

        options.left =  Math.ceil( (window.innerWidth/2) - (parseInt(options.width,10) / 2)) + 'px'
        options.top =  Math.ceil( (window.innerHeight/2) - (parseInt(options.height,10) / 2)) + 'px'

        return options;
    }

    function normalizeSize(sizeValue, containerSize) {
        var match;

        if (typeof sizeValue === "function") {
            sizeValue = sizeValue(containerSize);
        }

        if (typeof sizeValue === "string") {
            if (match = sizeValue.match(/^(\d+)\%$/)) {
                sizeValue = Math.ceil((match[1] / 100) * containerSize) + 'px';
            } else if (match = sizeValue.match(/^(\d+)$/)) {
                sizeValue = parseInt(match[1], 10) + 'px';
            }
        } else if (typeof sizeValue === "number") {
            sizeValue = sizeValue + 'px';
        } else {
            sizeValue = 0;
        }
        return sizeValue;
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
    };



    var _dialogContext = null,
        _dialogContextDialogId = null;

    //
    // The dialogcontext is what is used when inside a dialog
    //
    function DialogContext(openingWindow, successCallback, failCallback) {
        var _eventing = new EventingManager(null, openingWindow, true),
            _context = this;   

        // Find the opening window.
        _eventing.await('dialogr.find-opener', {
            dialogUrl : window.location.toString()
        }, null, openingWindow).then(function(data) {
            _dialogContextDialogId = data.dialogrId;
            _eventing.setDialogrId(data.dialogrId);
            successCallback(data);
        }, function(r) {
            failCallback(r);
        });

        this.$$e = _eventing;
        this.$$w = openingWindow;
        this.on = function() {
            console.info("context.on", arguments);
            return _context;
        }
        this.invoke = function(name, data) {
            return _eventing.await(name, data, null, openingWindow);
        }
        
        this.trigger = function(name, data) {
            return _eventing.send(name, data, null, openingWindow);
        }

        this.close = function() {}
        this.block = function() {}
        this.unblock = function() {}
        this.resolve = function(data) {
            _eventing.send('dialogr.resolve', data);
        }
        this.reject = function(data){
            _eventing.send('dialogr.reject', data);
        }
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

return;

        if (win.parent!= win) {

            

            console.warn("Sending ready and waiting for response...");
            eventing.await('ready', {
                dialogUrl : window.location.toString(),
                dialogId : d
            }).then(function(d) {
                console.warn("Got ready-response!",d);

                attachEventHandler(window, 'keydown', function(e) {
                    if (e.keyCode == 27) {
                        if (e.srcElement.nodeName === "BODY") {
                            alert("Close");
                        }
                    }
                });

               deferred.resolve({
                'resolve' : function(data) {
                    eventing.send('dialogr.resolve', data);
                },
                'reject' : function(data) {
                    eventing.send('dialogr.reject', data);
                },
                'param' : d.param ? d.param : null,
                'block' : function() {
                    eventing.send('dialogr.block');
                },
                'unblock' : function() {eventing.send('dialogr.unblock');},
                'close' : function() {eventing.send('dialogr.close');},
                'on' : function(name, callback) {
                    eventing.on(name, function(e) {
                        return callback(e);
                    });
                    return this;
                },
                'trigger' : function(name, data) {
                   return eventing.send(name, data);
                },
                'invoke' : function(name, data) {
                   return eventing.await(name, data);
                },
                'buttons' : (function() {
                    return {
                        enable : function() {},
                        disable : function() {},
                        onClick : function() {}
                    }
                }())
               });

            }, function(r) {
                console.warn("ready failed?",r);
            });

           
           /* win.parent.postMessage(JSON.stringify({
                'source' : 'dialogr',
                'event' : 'ready',
                'id' : d
            }), '*');*/

          //  var waitTimeout = setTimeout(function() {
          //      deferred.reject();
            //}, 500);
///
        } else {
            deferred.reject();
        }

       
    }


    function getElementSize(elm) {

        var cpadding, cborders, cmargins, borderBox, innerW, innerH, w, h, visible;

        function calculateSize() {

                cpadding = getOuterSizes(elm, "padding"), 
                cborders = getOuterSizes(elm, "border-width"),
                cmargins = getOuterSizes(elm, "margin"),
                borderBox = getStyle(elm, "box-sizing") === "border-box";
                visible = getStyle(elm, "display") === "block";

            if (!borderBox) {
                w = parseInteger(getStyle(elm, 'width')) + cpadding.l + cpadding.r + cmargins.l + cmargins.r + cborders.l + cborders.r;
                h = parseInteger(getStyle(elm, 'height')) + cpadding.t + cpadding.b + cmargins.t + cmargins.b + cborders.t + cborders.b;
                innerW = parseInteger(getStyle(elm, 'width'));
                innerH = parseInteger(getStyle(elm, 'height'));

               // console.warn( h, innerH );
            } else {
                w = parseInteger(getStyle(elm, 'width'));
                h = parseInteger(getStyle(elm, 'height'));


                innerW = w - cpadding.l - cpadding.r - cmargins.l - cmargins.r - cborders.l - cborders.r,
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
        }
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

    function close() {
        console.warn("CLOSE ME!!");
        if (dialogElement) {
                removeEventHandler(window, 'resize', onResize);
            dialogElement.parentNode.removeChild(dialogElement);
            dialogElement__overlay.parentNode.removeChild(dialogElement__overlay);
            dialogOptions = null;
            dialogElement = null;
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

    var _dialogs = [];

    // The actual instance of the dialog
    function DialogrDialog(optionsOrUrl, options, idFromDialogEvent, openerDialogId) {

        var _dialogOptions, 
            _elements = {},
            _currentDialog = this;

        if( typeof optionsOrUrl === "string") {
            if (typeof options === "undefined" || typeof options !== "object") {
                options = {};
            }
            options.url = optionsOrUrl;
        } else if (typeof optionsOrUrl === "object") {
            options = optionsOrUrl;
        }

        _dialogOptions = extend({}, dialogrDefaults, options);
        _dialogOptions.maxWidth = normalizeSize(_dialogOptions.maxWidth, window.outerWidth);
        _dialogOptions.minWidth = normalizeSize(_dialogOptions.minWidth, window.outerWidth);

        if (isUndefined(_dialogOptions.url)) {
            console.error("[dialogr] No url was given");
            return;
        }

        var fakeContext = false;

        if (idFromDialogEvent && idFromDialogEvent !== true) {
            this.id = idFromDialogEvent;
                    
        } else {
            dialogId ++;
            this.id = "d" + uniqid('dlg') +  "_" + dialogId;
        }

        if (idFromDialogEvent === true) fakeContext = true;    

        var dialogDeferred = self.Deferred(),
            _eventing = new EventingManager(this.id, null, fakeContext, openerDialogId);

        //
        // Event to hook up the dialog window
        //
        _eventing.on('dialogr.find-opener', function(data, msg, e) {
            _eventing.off('dialogr.find-opener');
            var deferred = self.Deferred();
            _eventing.setDialogrId(_currentDialog.id);
            _eventing.setTargetWindow(e.source);

            _eventing.on('dialogr.i-am-your-father', function(e) {
                console.warn("Found my parent. yay!",e);
            })

            if (openerDialogId) {
                dialogr.triggerAs(openerDialogId, 'dialogr.ping-your-dialog', null, _currentDialog.id);
            }

            deferred.resolve(extend({
                openerUrl : window.location.href.toString(),
                dialogrId : _currentDialog.id
            }, {
                opener : openerDialogId
            }));
            console.info("EventingManager Connected to dialog", _currentDialog.id);
            _elements.loaderOverlay.style.visibility = "hidden";
            _elements.content.style.visibility = "visible";
            return deferred.promise();
        });

        _eventing.on('dialogr.ping-your-dialog', function(e) {
            console.info("OK, attempt to find my dialog...", _currentDialog.id);

            var t= win.parent;
            for (var i=0; i < t.window.frames.length; i++) {
                _eventing.send("dialogr.i-am-your-father", { "n" : "ooo" }, null, t.window.frames[i]);
            }


        })

        _eventing.on('dialogr.reject', function(d) {
            dialogDeferred.reject(d);
            console.warn("REJECT",d);
            close();
        });

        if ( (!idFromDialogEvent) || (idFromDialogEvent && idFromDialogEvent !== true) ) {

            console.info("Ok, this new dialog was opened by the dialog with id", openerDialogId);

            

            _eventing.on('dialogr.open', function(d) {
                var deferred = self.Deferred();
                var x = dialogr.open(d.optionsOrUrl, d.options, d.newDialogId, d.openerId);
                deferred.resolve({
                    dialogrId : d.newDialogId
                });
                return deferred.promise();
            });

             _elements = createDialogElements(this.id, _dialogOptions);
            _elements.addToDom();

              setTimeout(function() {
                onResize(_elements, _dialogOptions);
            }, 5);

            attachEventHandler(window, 'resize', function() {
                onResize(_elements, _dialogOptions);
            });
            openedDialog = true;

            _elements.content.setAttribute('src', _dialogOptions.url);

        }
       
        this.$$e = _eventing;
        this.block = function() {}
        this.unblock = function() {}
        this.close = function() {}
        this.always = dialogDeferred.then;
        this.done = dialogDeferred.done;
        this.fail = dialogDeferred.fail;
        this.then = function(cb) {
            dialogDeferred.then(cb);
            return _currentDialog;
        }
        this.invokeAs = function(name, data, asDialogId) {
            return _eventing.await(name, data, null, null, asDialogId);
        }
        this.triggerAs = function(name, data, asDialogId) {
            _eventing.send(name, data, null, null, asDialogId);
        }
        this.trigger = function(name, data) {
            _eventing.send(name, data);
            return _currentDialog;
        };
       
        this.invoke = function(name, data) {
            return _eventing.await(name, data);
        };

        this.on = function(name, callback) {
            console.warn(_currentDialog.id, "LISTEN FOR", name);
            _eventing.on(name, callback);
            return _currentDialog;
        };

        _dialogs.push(this);
    
     }


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
            left =  Math.ceil( (window.innerWidth/2) - (parseInt(width,10) / 2)) + 'px'
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

        return {w : width, h : height, l: left, t : top, iw : iw}
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
            dialogElement__header;


        dialogElement = document.createElement('div');
        dialogElement.setAttribute("class", dialogOptions.className);
        dialogElement.style.position = 'fixed';
        dialogElement.style.zIndex = '150';

        dialogElement__overlay = document.createElement('div');
        dialogElement__overlay.setAttribute("data-dialogr-id", id);
        dialogElement__overlay.setAttribute("class", dialogOptions.className + "__overlay");
        dialogElement__overlay.style.position = 'fixed';
        dialogElement__overlay.style.width = '100%';
        dialogElement__overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        dialogElement__overlay.style.height = '100%';
        dialogElement__overlay.style.top = '0';
        dialogElement__overlay.style.left = '0';
        dialogElement__overlay.style.zIndex = '100';
        //
       // dialogElement__content.style.visibility = "hidden";

        dialogElement__content = document.createElement('iframe');
        dialogElement__content.setAttribute("class", dialogOptions.className + "__content");
        dialogElement__content.style.position = 'absolute';
        dialogElement__content.style.visibility = "hidden";

        dialogElement__loaderOverlay = document.createElement('div');
        dialogElement__loaderOverlay.setAttribute("class", dialogOptions.className + "__loader-overlay");
        dialogElement__loaderOverlay.style.position = 'fixed';
        dialogElement__loaderOverlay.style.border = '1px solid #aaa';
        dialogElement__loaderOverlay.style.backgroundColor = 'rgba(255,255,255,0.8)';
        dialogElement__loaderOverlay.style.cursor = 'wait';

        dialogElement__loader = document.createElement('div');
        dialogElement__loader.setAttribute("class", dialogOptions.className + "__overlay");
        dialogElement__loader.style.position = 'absolute';
        dialogElement__loader.style.backgroundColor = '#fff';
        dialogElement__loaderOverlay.style.visibility = 'visible';

        dialogElement__loader.innerHTML = "Loading...";        

        dialogElement__footer = document.createElement('div');
        dialogElement__footer.setAttribute("class", dialogOptions.className + "__footer");
        dialogElement__footer.style.position = 'absolute';

        dialogElement__header = document.createElement('div');
        dialogElement__header.setAttribute("class", dialogOptions.className + "__header");
        dialogElement__header.style.overflow = 'hidden';


        var buttonCount = 0;

        if(typeof dialogOptions.buttons !== "undefined") {
            if (dialogOptions.buttons.constructor === Array) {
                for (var i=0; i < dialogOptions.buttons.length; i++) {
                    dialogElement__footer.innerHTML += "<button  onclick='javascript:dialogr.trigger(\"" + id + "\", \"button_" + key + "\")' class='dialogr__button'>" + dialogOptions.buttons[i] + "</button>";
                    buttonCount++;
                }
            } else if (typeof dialogOptions.buttons === "object") {
                for (var key in dialogOptions.buttons) {
                    if (dialogOptions.buttons.hasOwnProperty(key)) {
                        dialogElement__footer.innerHTML += "<button onclick='javascript:dialogr.trigger(\"" + id + "\", \"button_" + key + "\")' class='dialogr__button' >" + dialogOptions.buttons[key].text + "</button>";
                    buttonCount++;
                    }
                }
            }
        }

        if (buttonCount == 0) {
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
                    if (source[prop] === null || typeof source[prop] === "undefined") {
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



    /*! Deferred (https://github.com/warpdesign/deferred-js) */
    (function(global) {
        function isArray(arr) {
            return Object.prototype.toString.call(arr) === '[object Array]';
        }

        function foreach(arr, handler) {
            if (isArray(arr)) {
                for (var i = 0; i < arr.length; i++) {
                    handler(arr[i]);
                }
            }
            else
                handler(arr);
        }

        function D(fn) {
            var status = 'pending',
                doneFuncs = [],
                failFuncs = [],
                progressFuncs = [],
                resultArgs = null,

            promise = {
                done: function() {
                    for (var i = 0; i < arguments.length; i++) {
                        // skip any undefined or null arguments
                        if (!arguments[i]) {
                            continue;
                        }

                        if (isArray(arguments[i])) {
                            var arr = arguments[i];
                            for (var j = 0; j < arr.length; j++) {
                                // immediately call the function if the deferred has been resolved
                                if (status === 'resolved') {
                                    arr[j].apply(this, resultArgs);
                                }

                                doneFuncs.push(arr[j]);
                            }
                        }
                        else {
                            // immediately call the function if the deferred has been resolved
                            if (status === 'resolved') {
                                arguments[i].apply(this, resultArgs);
                            }

                            doneFuncs.push(arguments[i]);
                        }
                    }
                    
                    return this;
                },

                fail: function() {
                    for (var i = 0; i < arguments.length; i++) {
                        // skip any undefined or null arguments
                        if (!arguments[i]) {
                            continue;
                        }

                        if (isArray(arguments[i])) {
                            var arr = arguments[i];
                            for (var j = 0; j < arr.length; j++) {
                                // immediately call the function if the deferred has been resolved
                                if (status === 'rejected') {
                                    arr[j].apply(this, resultArgs);
                                }

                                failFuncs.push(arr[j]);
                            }
                        }
                        else {
                            // immediately call the function if the deferred has been resolved
                            if (status === 'rejected') {
                                arguments[i].apply(this, resultArgs);
                            }

                            failFuncs.push(arguments[i]);
                        }
                    }
                    
                    return this;
                },

                always: function() {
                    return this.done.apply(this, arguments).fail.apply(this, arguments);
                },

                progress: function() {
                    for (var i = 0; i < arguments.length; i++) {
                        // skip any undefined or null arguments
                        if (!arguments[i]) {
                            continue;
                        }

                        if (isArray(arguments[i])) {
                            var arr = arguments[i];
                            for (var j = 0; j < arr.length; j++) {
                                // immediately call the function if the deferred has been resolved
                                if (status === 'pending') {
                                    progressFuncs.push(arr[j]);
                                }
                            }
                        }
                        else {
                            // immediately call the function if the deferred has been resolved
                            if (status === 'pending') {
                                progressFuncs.push(arguments[i]);
                            }
                        }
                    }
                    
                    return this;
                },

                then: function() {
                    // fail callbacks
                    if (arguments.length > 1 && arguments[1]) {
                        this.fail(arguments[1]);
                    }

                    // done callbacks
                    if (arguments.length > 0 && arguments[0]) {
                        this.done(arguments[0]);
                    }

                    // notify callbacks
                    if (arguments.length > 2 && arguments[2]) {
                        this.progress(arguments[2]);
                    }
                },

                promise: function(obj) {
                    if (obj == null) {
                        return promise;
                    } else {
                        for (var i in promise) {
                            obj[i] = promise[i];
                        }
                        return obj;
                    }
                },

                state: function() {
                    return status;
                },

                debug: function() {
                    console.log('[debug]', doneFuncs, failFuncs, status);
                },

                isRejected: function() {
                    return status === 'rejected';
                },

                isResolved: function() {
                    return status === 'resolved';
                },

                pipe: function(done, fail, progress) {
                    return D(function(def) {
                        foreach(done, function(func) {
                            // filter function
                            if (typeof func === 'function') {
                                deferred.done(function() {
                                    var returnval = func.apply(this, arguments);
                                    // if a new deferred/promise is returned, its state is passed to the current deferred/promise
                                    if (returnval && typeof returnval === 'function') {
                                        returnval.promise().then(def.resolve, def.reject, def.notify);
                                    }
                                    else {  // if new return val is passed, it is passed to the piped done
                                        def.resolve(returnval);
                                    }
                                });
                            }
                            else {
                                deferred.done(def.resolve);
                            }
                        });

                        foreach(fail, function(func) {
                            if (typeof func === 'function') {
                                deferred.fail(function() {
                                    var returnval = func.apply(this, arguments);
                                    
                                    if (returnval && typeof returnval === 'function') {
                                        returnval.promise().then(def.resolve, def.reject, def.notify);
                                    } else {
                                        def.reject(returnval);
                                    }
                                });
                            }
                            else {
                                deferred.fail(def.reject);
                            }
                        });
                    }).promise();
                }
            },

            deferred = {
                resolveWith: function(context) {
                    if (status === 'pending') {
                        status = 'resolved';
                        var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
                        for (var i = 0; i < doneFuncs.length; i++) {
                            doneFuncs[i].apply(context, args);
                        }
                    }
                    return this;
                },

                rejectWith: function(context) {
                    if (status === 'pending') {
                        status = 'rejected';
                        var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
                        for (var i = 0; i < failFuncs.length; i++) {
                            failFuncs[i].apply(context, args);
                        }
                    }
                    return this;
                },

                notifyWith: function(context) {
                    if (status === 'pending') {
                        var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
                        for (var i = 0; i < progressFuncs.length; i++) {
                            progressFuncs[i].apply(context, args);
                        }
                    }
                    return this;
                },

                resolve: function() {
                    return this.resolveWith(this, arguments);
                },

                reject: function() {
                    return this.rejectWith(this, arguments);
                },

                notify: function() {
                    return this.notifyWith(this, arguments);
                }
            }

            var obj = promise.promise(deferred);

        if (fn) {
            fn.apply(obj, [obj]);
        }

        return obj;
    }

    D.when = function() {
        if (arguments.length < 2) {
            var obj = arguments.length ? arguments[0] : undefined;
            if (obj && (typeof obj.isResolved === 'function' && typeof obj.isRejected === 'function')) {
                return obj.promise();           
            }
            else {
                return D().resolve(obj).promise();
            }
        }
        else {
            return (function(args){
                var df = D(),
                    size = args.length,
                    done = 0,
                    rp = new Array(size);   // resolve params: params of each resolve, we need to track down them to be able to pass them in the correct order if the master needs to be resolved

                for (var i = 0; i < args.length; i++) {
                    (function(j) {
                        var obj = null;
                        
                        if (args[j].done) {
                            args[j].done(function() { rp[j] = (arguments.length < 2) ? arguments[0] : arguments; if (++done == size) { df.resolve.apply(df, rp); }})
                            .fail(function() { df.reject(arguments); });
                        } else {
                            obj = args[j];
                            args[j] = new Deferred();
                            
                            args[j].done(function() { rp[j] = (arguments.length < 2) ? arguments[0] : arguments; if (++done == size) { df.resolve.apply(df, rp); }})
                            .fail(function() { df.reject(arguments); }).resolve(obj);
                        }
                    })(i);
                }

                return df.promise();
            })(arguments);
        }
    }

    global.Deferred = D;
})(this);

    winloadDeferred = this.Deferred();

    if (document.readyState === "complete") {
        winloadDeferred.resolve();
    } else {
        attachEventHandler(window, 'load', function() {
            winloadDeferred.resolve();
        });
    }

    
    win.dialogr = Dialogr();



}(window));