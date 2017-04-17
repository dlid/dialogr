function DialogContext(openingWindow, successCallback, failCallback, options) {
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

    options = refineUserOptions(options);

    // Find the opening window.
    _eventing.await('dialogr.find-opener', {
        dialogUrl : window.location.toString(),
        id : dialogrIdParameter,
        hej : options.buttons,
        options : options
    }, options, openingWindow).then(function(data) {
        var weAre = {
            child : true,
            motherIdentified : true,
            fatherIdentified : true,
            childId : data.dialogrId
        };
         _context.param = extend({}, u.params,  data.param || {});
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
                _eventing.send('dialogr.find-father', { "frame" : i, "childId" : dialogrIdParameter }, null, t.window.frames[i]);
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

    this.enable = function(button) {
        _context.trigger('dialogr.enable-button', button);
    };
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
    this.buttons = function(data) {
        _eventing.send('dialogr.buttons', data);
    };
    this.param = {};
    };