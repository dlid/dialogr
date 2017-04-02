function Dialogr() {

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

function extendWithInternalOptions(o) {
    return extend({
        $$ : {
            isFather : true,
            isMother : true,
            id : null,
            byFather : false,

            // Store the actual data sent in by the user
            raw : extend({}, o)
        }
    }, o);
}

/**
 * Parse arguments-array into a unified options object
 * Will allow the following combinations:
 * (options)
 * (url)
 * (url, param)
 * (url, param, options)
 *
 * @param      {object}  args    The arguments
 * @return     {object}  A single options object
 */
function mergeOpenArgumentsToOptionsObject(args) {
    var options = {}, l = args.length, typeTmp;
    if (l > 0) {
        typeTmp = typeof args[0];
        if (typeTmp === "string") {
            options.url = args[0];
            if (l > 1) {
                options.param = args[1];
                if (l > 2) {
                    options = extend({}, args[2], options);
                }
            }
        } else if (typeTmp === "object") {
            options = args[0];
        }
    }
    return options;
}

function open(options) {

    options = mergeOpenArgumentsToOptionsObject(arguments);

    var id = null,
        openingDialogId = null;
    options = extendWithInternalOptions(options);

    if (options.$$.byFather !== false) {
        openingDialogId = options.$$.byFather;
        id = options.$$.id;
    }

    var dialogInstance,
        openDialogs = _dialogs.slice(0);
        options = options || {};
    
    


        if (_dialogContext) {
            options.$$.isMother = false;
            dialogInstance = new DialogrDialog(options, {}, true);

            _dialogContext.invoke('dialogr.open', {
                options : extend({}, options, 
                        { 
                            $$ : { 
                                id : dialogInstance.id, 
                                byFather : _dialogContextDialogId
                            }
                        }
                    ),
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
            dialogInstance = new DialogrDialog(options, {}, id, openingDialogId);
            
        }

    return dialogInstance;

}

function ready(options) {

    var deferred = self.Deferred();
    insideDialog = true;

    winloadDeferred.done(function() {

        // Setup the dialog context
        _dialogContext = new DialogContext(win.parent, contextReadyCallback, contextFailCallback, options);

        function contextReadyCallback(r) {
            deferred.resolve(_dialogContext);
        }

        function contextFailCallback(r) {
            deferred.reject(r);
        }
       

    });
    
    return deferred.promise();

}

    // Should be removed when closed
    attachEventHandler(win, 'keydown', function(e) {
        if (e.keyCode === 27 && dialogElement !== null) {
            close();
        }
    });

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
