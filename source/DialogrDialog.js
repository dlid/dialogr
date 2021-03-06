// The actual instance of the dialog

    

    function refineUserOptions(options, buttonIndexStart) {
        var keys, i, b, p = buttonIndexStart || 0;
        // Fix sizes
       /* options.width = normalizeSize(options.width, window.innerWidth);
        options.height = normalizeSize(options.height, window.innerHeight);

        options.left =  Math.ceil( (window.innerWidth/2) - (parseInt(options.width,10) / 2)) + STYLE_UNIT_PIXELS;
        options.top =  Math.ceil( (window.innerHeight/2) - (parseInt(options.height,10) / 2)) + STYLE_UNIT_PIXELS;
*/
        // Normalize buttons
        if (isUndefined(options.buttons))
            options.buttons = [];

        if(isArray(options.buttons)) {
            b = [];
            for (i=0; i < options.buttons.length; i++) {
                if (typeof options.buttons[i] === "string") {
                    b.push({name : "b" + i, text : options.buttons[i]});
                } else if (typeof options.buttons[i] === "object") {
                    b.push(options.buttons[i]);
                } else {
                    continue;
                }

                if (!b[b.length-1].index)
                    b[b.length-1].index = p;
                p+=10;

            }
            options.buttons = b;
        } else {
         logError("buttons must be an array");   
        }
        return options;
    }

    function DialogrDialog(options, internalOptions, idFromDialogEvent, openerDialogId) {

        var _dialogOptions, 
            _elements = {},
            _currentDialog = this,
            _weAre = null,
            _isFather = options.$$.isFather,
            _isMother = options.$$.isMother,
            _thisId = null;

        _dialogOptions = extend({}, dialogrDefaults, refineUserOptions(options, 1000));
        _dialogOptions.maxWidth = normalizeSize(_dialogOptions.maxWidth, window.outerWidth);
        _dialogOptions.minWidth = normalizeSize(_dialogOptions.minWidth, window.outerWidth);

        if (isUndefined(_dialogOptions.url)) {
            logError()("[dialogr] No url was given");
            return;
        }

        var fakeContext = _isFather && !_isMother;

        _thisId = options.$$.id || null;
        if (!_thisId) {
            dialogId ++;
            _thisId = "d" + uniqid('dlg') +  "_" + dialogId;
        }

        this.id = _thisId;

        // Add dialog id to url
        _dialogOptions.url = setQuerystringValue(_dialogOptions.url, {'_dialogrId' : this.id});

        // Identify where and who we are? Child? Father? Mother+Father? Mother only?
        _weAre = { father : _isFather, mother : _isMother, child : false };
        if (_isFather) _weAre.fatherTo = _thisId;
        if (_isMother) _weAre.motherTo = _thisId;

        _dialogOptions.$r = _weAre;

        var dialogDeferred = self.Deferred(),
            _eventing = new EventingManager(_thisId, null, fakeContext, openerDialogId);
            _eventing.setIdentity(_weAre),
            _disableScrollForElements = [],
            _originalStyles = [];
        
         /**
          * If we are the father window we must listen for the event from the dialog
          * that attempts to find the father.
          */
         if (_weAre.father) {
            _eventing.on('dialogr.find-father', function(d, msg, msgEvent) {
                if (_weAre.fatherTo == d.childId) {
                    _eventing.setNamedTarget('child', msgEvent.source);
                    _eventing.send('dialogr.i-am-your-father', null, null, msgEvent.source);
                }
            }); 

        }

        /**
          * If we are the mother window we must listen for the events  from te dialog
          * that affects the DOM elements for the dialog
          */
        if (_weAre.mother) {

            _eventing.on('dialogr.disable-button', function(buttonName) {
                if (_elements.buttons[buttonName]) {
                    _elements.buttons[buttonName].setAttribute(ATTR_DISABLED,ATTR_DISABLED);
                }
            })
            .on('dialogr.enable-button', function(buttonName) {
                if (_elements.buttons[buttonName]) {
                    _elements.buttons[buttonName].removeAttribute(ATTR_DISABLED);
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
            }).on('dialogr.buttons', function(e) {
                if (_elements.buttons[e.element]) {
                    _elements.buttons[e.element].innerHTML = e.value;
                }
            });
        }

        /**
         * Listen for the event that tries to connect the dialog frame to its opening window
         * This is invoked from the dialog when dialogr.ready() is called
         */
        _eventing.on('dialogr.find-opener', function(data, msg, e) {
            // Ignore opener events from other dialogs.
            // It is unlikely there would be any, but you never know...
            if (_thisId != data.id) {
                return;
            }

            var updateSize = false,
                deferred = self.Deferred();
            _eventing.setDialogrId(_currentDialog.id);
            _eventing.setNamedTarget('dialog', e.source);
            
            /**
             * Let's merge the dialogr.open options with the dialogr.ready options
             */
            
            if (!isUndefined(data.options)) {
                if (data.options.width && !_dialogOptions.$$.raw.width) {
                    updateSize = true;
                    _dialogOptions.width = normalizeSize(data.options.width, getInnerWidth());
                }
                if (data.options.height&& !_dialogOptions.$$.raw.height) {
                    updateSize = true;
                    _dialogOptions.height = normalizeSize(data.options.height, getInnerWidth());
                }
                
                if (_dialogOptions.buttons) {

                    // console.log("[dialogr] MERGE BUTTONS:", data.options.buttons, _dialogOptions.buttons);
                    data.options.buttons = mergeDialogButtons(data.options.buttons, _dialogOptions.buttons);

                //    data.options.buttons = extend({}, data.options.buttons, _dialogOptions.buttons);
                }

                if (data.options.buttons) {

                    updateSize = true;
                    _dialogOptions.buttons = data.options.buttons;
                    _elements.buttons = _elements.createButtons(_dialogOptions);
                }

                if (updateSize) {
                    onResize(_elements, _dialogOptions);
                }
            }

            var param = _dialogOptions.param;
            if (!isUndefined(param) && param.param) param = param.param;
            deferred.resolve(extend({
                openerUrl : window.location.href.toString(),
                dialogrId : _currentDialog.id,
                param : param
            }, {
                opener : openerDialogId
            }));
            
            return deferred.promise();
        });

        function onResizeEventHandler() {
            onResize(_elements, _dialogOptions);
        }

        _eventing.on('dialogr.reject', function(d) {
            dialogDeferred.reject(d);
            _currentDialog.close();
        });

        _eventing.on('dialogr.resolve', function(d) {
            dialogDeferred.resolve(d);
            _currentDialog.close();
        });

        _eventing.on('dialogr.close', function(d,e,f) {
          // console.warn("Received close",d,e,f);
            _currentDialog.close();
        });

        _eventing.on('dialogr.block', function() {
            _elements.dialogElementLoaderOverlay_r.style.visibility = STYLE_VISIBILITY_VISIBLE;
        });

        _eventing.on('dialogr.unblock', function() {
            _elements.dialogElementLoaderOverlay_r.style.visibility = STYLE_VISIBILITY_HIDDEN;
            _elements.content.style.visibility = STYLE_VISIBILITY_VISIBLE;
        });

        if ( _isMother ) {

            _eventing.on('dialogr.open', function(d) {
                var deferred = self.Deferred();
                d.options.$$.isMother = true;
                d.options.$$.isFather = false;
                var x = dialogr.open(d.options, d.newDialogId, d.openerId);
                deferred.resolve({
                    dialogrId : d.newDialogId
                });
                return deferred.promise();
            });

            // We make sure that the DOM is loaded before we create elements 
            winloadDeferred.done(function() {

                _elements = createDialogElements(_thisId, _dialogOptions);

                i = document.getElementsByTagName('html');
                if (i.length == 1) _disableScrollForElements.push(i[0]);
                i = document.getElementsByTagName('body');
                if (i.length == 1) _disableScrollForElements.push(i[0]);

                
                for (i=0; i < _disableScrollForElements.length; i++) {
                    _originalStyles.push(getStyle(_disableScrollForElements[i], STYLE_OVERFLOW_Y));
                    setStyle(_disableScrollForElements[i], {STYLE_OVERFLOW_Y : STYLE_VISIBILITY_HIDDEN});
                }

                _elements.addToDom();

                    onResize(_elements, _dialogOptions);
            

                attachEventHandler(window, 'resize', onResizeEventHandler);
                openedDialog = true;

                _elements.content.setAttribute('src', _dialogOptions.url);

            });

        }
      
        this.$$e = _eventing;
        this.$$el = _elements;
        this.block = function() {};
        this.unblock = function() {};
        this.close = function() {
            if (_dialogs.length == 1) {
                for (var i=0; i < _disableScrollForElements.length; i++) {
                    setStyle(_disableScrollForElements[i], {STYLE_OVERFLOW_Y : _originalStyles[i]});
                }
            }
           if (_weAre.father && !_weAre.mother) {
                _eventing.send('dialogr.close');
           } else if (_weAre.mother) {
               for (var i=0; i < _dialogs.length; i++) {
                if (_dialogs[i].id == _currentDialog.id) {
                    _dialogs.splice(i, 1);
                    break;
                }
               }
               if (_elements && _elements.dialog && _elements.dialog.parentNode && _elements.dialogElementOverlay_r) {
                   _elements.dialog.parentNode.removeChild(_elements.dialog);
                   _elements.dialogElementOverlay_r.parentNode.removeChild(_elements.dialogElementOverlay_r);
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
            _eventing.on(name, callback);
            return _currentDialog;
        };

        _dialogs.push(this);
    
     }