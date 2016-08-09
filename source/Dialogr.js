


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


    //
    // The dialogcontext is what is used when inside a dialog
    //
    

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

function Dialogr() {

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
