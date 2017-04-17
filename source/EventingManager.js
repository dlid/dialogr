/*
 The EventingManager will send and receive data between the dialogs (child), its opener (father) and the first opener (mother).
*/

var EventingManager = function EventingManager(eventingDialogId, targetWindow, isDialogContext, openingDialogId) {
    var _targetWindow = targetWindow || null,
        _eventingTargetWindow = null,
        _messageId = 0,
        _messageIdPrefix = uniqid('m'),
        _eventHandlers = {},
        _boundDialogId = null,
        _weAre = null,
        _namedTargets = {
            'mother' : targetWindow || null,
            'father' : targetWindow || null,
            'child' : null
        };
 
    function reset() {
        _messageIdPrefix = uniqid('m');
        _eventHandlers = {};
    }

    function newid() {
        _messageId++;
        return _messageIdPrefix + "_" + _messageId;
    }

    function on(eventName, callback) {
        if (isUndefined(_eventHandlers[eventName])) _eventHandlers[eventName] = [];
        _eventHandlers[eventName].push(callback);
        return this;
    }

    function off(eventName, callback) {
        return this;
    }

    attachEventHandler(window, 'message', messageHandler);

    function send(name, data, options, targetWindow, asDialogId) {
        var customTargetWindow = typeof targetWindow !== "undefined" && targetWindow !== null; 
        options = extend({
            await : null,
            messageId : null
        }, options || {});

        if (!options.messageId) {
            options.messageId =  newid();
        }

        var sendToTargetWindow = 'mother',
            messagesToMother = ['dialogr.close', 'dialogr.block', 'dialogr.unblock', 'dialogr.open']; 
        if (customTargetWindow) {
            sendToTargetWindow = "custom target window";
        } else if (_weAre !== null) {
            if (_weAre.child) {
                if (messagesToMother.indexOf(name) === -1) {
                    sendToTargetWindow = "father";
                }
            } else if (!_weAre.mother && _weAre.father && messagesToMother.indexOf(name) !== -1) {
                sendToTargetWindow = "mother";
            } else if (_weAre.mother || _weAre.father) {
                sendToTargetWindow = "dialog";
            }
        }

         var message = {
            source : 'dialogr',
            messageType : name,
            messageData : data,
            messageId : options.messageId,
            dialogrId : asDialogId ? asDialogId : _boundDialogId,
            await : options.await,
            fromLocation : win.location.href
        };
    
        var resolvedTargetWindow = customTargetWindow ? targetWindow : _namedTargets[sendToTargetWindow];
        if (typeof resolvedTargetWindow === "undefined" || resolvedTargetWindow === null) {
            console.error("Target window was null or undefined", sendToTargetWindow);
            return;
        }

        resolvedTargetWindow.postMessage(JSON.stringify(message), '*');

    }   

    function messageHandler(e) {

        //console.warn("[handleMessage]",window.location.href.substr( window.location.href.lastIndexOf('/') ), e);

        if (e.source == window) {
            return;
        }

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

        function eventHandlerReady(r) {
              if (!timer) return;
              callbackReady( {
                  index : i,
                  type : "success",
                  data : r
              });
        }

        function eventHandlerFail(r) {
              if (!timer) return;
                callbackReady({
                    index : i,
                    type : "fail",
                    data : r
                });
        }

        var o,i,fnRet;
        try { o = JSON.parse(e.data); } catch(ev) {}

        if (o) {
            if (!isUndefined(o.source) && o.source === "dialogr") {
                    

                if (!_boundDialogId) {
                    if (o.messageType.indexOf('dialogr.find-opener') === -1) {
                        return;
                    }
                } else if (_boundDialogId !== o.dialogrId) {
                    return;
                }
                if(!isUndefined(_eventHandlers[o.messageType])) {
                    if (!o.await) {
                        for (i = 0; i < _eventHandlers[o.messageType].length; i++) {
                            fnRet = _eventHandlers[o.messageType][i](o.messageData, o, e);
                        }
                    } else {

                        var _boundEventHandlers = _eventHandlers[o.messageType].slice(0),
                             n = 0,
                            responses = [],
                            timer = null,
                            isSuccess = true;

                        

                        timer = setTimeout(function() {
                            send(o.messageId + "_response", {
                                type : "fail",
                                response : ["Operation took too long > " + o.await + "ms"]
                            }, null, e.source);
                        }, o.await);

                        

                        for (i = 0; i < _boundEventHandlers.length; i++) {
                            fnRet = _boundEventHandlers[i](o.messageData, o, e);
                            
                            if (o.await) {
                                if (fnRet && fnRet.done && fnRet.fail && fnRet.promise) {

                                    fnRet.then(eventHandlerReady, eventHandlerFail);
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

        on(options.messageId + "_response", function(r,e,f) {
            //console.warn("onresponse", r,e,f);
            var responseData = [];
            for (var i=0; i < r.response.length; i++) {
                if (typeof r.response[i] === "string") {
                     responseData.push(r.response[i]);
                } else if (r.response[i].data ) {
                    responseData.push(r.response[i].data );
                }
            }

            var ddd = {
                messageEvent : f,
                message : e
            };

            if (r.type === "fail") {
                d.rejectWith(ddd, [responseData.length == 1 ? responseData[0] : responseData] );
            } else {
                d.resolveWith(ddd, [responseData.length == 1 ? responseData[0] : responseData] );
            }
        });
        var msg = send(name, data, options, targetWindow, asDialogId);
        return d.promise();
    }

    function setDialogrId(id) {
    //    console.warn("SETDALOGRID", eventingDialogId, id);
        _boundDialogId = id;
    }

    function setTargetWindow(targetWin) {
        _targetWindow = targetWin;
    }

    function setEventingTargetWindow(targetWin) {
        _eventingTargetWindow = targetWin;
    }

    function weAreToString() {

        if (!_weAre) return "UNKNOWN";
        if (_weAre.father && _weAre.mother) 
            return "fa+mo to " + _weAre.fatherTo;

        if (_weAre.father ) 
            return "father to " + _weAre.fatherTo;

        if (_weAre.mother ) 
            return "mother to " + _weAre.motherTo;

        if (_weAre.child ) 
            return (!_weAre.fatherIdentified ? ' fatherless ' : '') + "child " + _weAre.childId;

        return _weAre.toString();
    }

    function setNamedTarget(name, namedTargetWindiw) {
        if (name == "father") _weAre.fatherIdentified = true;
        _namedTargets[name] = namedTargetWindiw;
    }

    return {
        newid : newid,
        send : send,
        await : sendAndWait,
        setDialogrId : setDialogrId,
        setTargetWindow : setTargetWindow,
        setEventingTargetWindow : setEventingTargetWindow,
        setNamedTarget : setNamedTarget,
        on : on,
        off : off,
        handleMessage : messageHandler,
        $$eventHandlers : _eventHandlers,
        setIdentity : function(val) {
            _weAre = val;
        }
    };

};
