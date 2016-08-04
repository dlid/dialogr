// The actual instance of the dialog
    function DialogrDialog(optionsOrUrl, options, internalOptions, idFromDialogEvent, openerDialogId) {

        var _dialogOptions, 
            _elements = {},
            _currentDialog = this;

            var _weAre = null;

       
        if( typeof optionsOrUrl === "string") {
            if (isUndefined(options) || typeof options !== "object") {
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

        // Add dialog id to url
        _dialogOptions.url = setQuerystringValue(_dialogOptions.url, {'_dialogrId' : this.id});

        if (idFromDialogEvent === true) fakeContext = true;    

        // Identify where and who we are? Child? Father? Mother+Father? Mother only?
        _weAre = { father : false, mother : false, child : false };
        if (idFromDialogEvent === true) {
            _weAre.father = true;
            _weAre.fatherTo = this.id;
        } else if (!isUndefined(idFromDialogEvent)) {
            _weAre.mother = true;
            _weAre.motherTo = this.id;
        } else {
            _weAre.mother = true;
            _weAre.motherTo = this.id;
            _weAre.father = true;
            _weAre.fatherTo = this.id;
        }

        var dialogDeferred = self.Deferred(),
            _eventing = new EventingManager(this.id, null, fakeContext, openerDialogId);
            _eventing.setIdentity(_weAre);
            
        
         if (_weAre.father) {
            _eventing.on('dialogr.find-father', function(d, msg, msgEvent) {
                if (_weAre.fatherTo == d.childId) {
                    _eventing.setNamedTarget('child', msgEvent.source);
                    _eventing.send("dialogr.i-am-your-father", { "fatherLocation" : win.location.href }, null, msgEvent.source);
                }
            }); 

        } else if (_weAre.mother) {

            _eventing.on('dialogr.disable-button', function(buttonName) {
                if (_elements.buttons[buttonName]) {
                    _elements.buttons[buttonName].setAttribute('disabled','disabled');
                }
            })
            .on('dialogr.enable-button', function(buttonName) {
                if (_elements.buttons[buttonName]) {
                    _elements.buttons[buttonName].removeAttribute('disabled');
                }
            })
            .on('dialogr.set-text', function(e) {
                if (_elements.buttons[e.element]) {
                    _elements.buttons[e.element].innerText = e.value;
                }
            })
            .on('dialogr.set-html', function(e) {
                if (_elements.buttons[e.element]) {
                    _elements.buttons[e.element].innerHTML = e.value;
                }
            });
        }

        // Event to hook up the dialog window
        //
        _eventing.on('dialogr.find-opener', function(data, msg, e) {
            //_eventing.off('dialogr.find-opener');
            var deferred = self.Deferred();
            _eventing.setDialogrId(_currentDialog.id);
            _eventing.setNamedTarget('dialog', e.source);

            deferred.resolve(extend({
                openerUrl : window.location.href.toString(),
                dialogrId : _currentDialog.id,
                param : _dialogOptions.param
            }, {
                opener : openerDialogId
            }));
            
            return deferred.promise();
        });

        /*_eventing.on('dialogr.ping-your-dialog', function(e) {
            console.info("OK, attempt to find my dialog...", _currentDialog.id, window.location.href);
            var t= win.parent;
            for (var i=0; i < t.window.frames.length; i++) {
                _eventing.send("dialogr.i-am-your-father", { "n" : "ooo" }, null, t.window.frames[i]);
            }
        })*/

        function onResizeEventHandler() {
            onResize(_elements, _dialogOptions);
        }

        _eventing.on('dialogr.reject', function(d) {
            dialogDeferred.reject(d);
            _currentDialog.close();
        });

        _eventing.on('dialogr.resolve', function(d) {
            dialogDeferred.resolve(d);
            //if (idFromDialogEvent) {
            //    _eventing.send('dialogr.close', null, null, 'eventingTarget', openerDialogId);
            //} else {
               _currentDialog.close();
            //}
        });

        _eventing.on('dialogr.close', function(d,e,f) {
          // console.warn("Received close",d,e,f);
            _currentDialog.close();
        });

        _eventing.on('dialogr.block', function() {
            _elements.loaderOverlay.style.visibility = 'visible';
        });

        _eventing.on('dialogr.unblock', function() {
            _elements.loaderOverlay.style.visibility = 'hidden';
            _elements.content.style.visibility = "visible";
        });

        if ( (!idFromDialogEvent) || (idFromDialogEvent && idFromDialogEvent !== true) ) {

           // console.info("Ok, this new dialog was opened by the dialog with id", openerDialogId);

            

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

            attachEventHandler(window, 'resize', onResizeEventHandler);
            openedDialog = true;

            _elements.content.setAttribute('src', _dialogOptions.url);

        }
      
        this.$$e = _eventing;
        this.$$el = _elements;
        this.block = function() {};
        this.unblock = function() {};
        this.close = function() {
            //if (openerDialogId) {
            //    _eventing.send('dialogr.close');
           // }
           if (_weAre.father && !_weAre.mother) {
            _eventing.send('dialogr.close');
           } else if (_weAre.mother) {
               
               for (var i=0; i < _dialogs.length; i++) {
                if (_dialogs[i].id == _currentDialog.id) {
                    _dialogs.splice(i, 1);
                    break;
                }
               }
               if (_elements && _elements.dialog && _elements.dialog.parentNode && _elements.overlay) {
                   _elements.dialog.parentNode.removeChild(_elements.dialog);
                   _elements.overlay.parentNode.removeChild(_elements.overlay);
               }
            }
        };
        this.always = dialogDeferred.then;
        this.done = dialogDeferred.done;
        this.fail = dialogDeferred.fail;
        this.then = function(cb) {
            dialogDeferred.then(cb);
            return _currentDialog;
        };
        this.invokeAs = function(name, data, asDialogId) {
            return _eventing.await(name, data, null, null, asDialogId);
        };
        this.triggerAs = function(name, data, asDialogId) {
            _eventing.send(name, data, null, null, asDialogId);
        };
        this.trigger = function(name, data) {
            _eventing.send(name, data);
            return _currentDialog;
        };
       
        this.invoke = function(name, data) {
            return _eventing.await(name, data);
        };

        this.on = function(name, callback) {
        //            console.warn(_currentDialog.id, "LISTEN FOR", name);
            _eventing.on(name, callback);
            return _currentDialog;
        };

        _dialogs.push(this);
    
     }