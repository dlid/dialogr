  /*! dialogr v0.0.8 © 2016 David Lidström. https://docs.dlid.se/dialogr License: MIT */
  (function(win) {
    var dialogrDefaults = {
          zIndex : 1500,
          url : null,
          className : 'dialogr',
          width : 300,
          height : 100,
          title : null,
          breakpointW : 600,  // Always snap to fullscreen if window width <= n
          breakpointH : 500,  // Always snap to fullscreen if window height <= n
         // buttons : ["Ok", "Cancel"],
          /*init : function(e) {
              var d = document.createElement('div');
              d.style.backgroundColor = 'yellow';
              d.innerHTML = "<p>hejsan alla glada</p>";

              e.parentNode.appendChild(d);

          },*/
          param : null,
          maxWidth : null,
          minWidth : 0
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
      self = this,
      _dialogContext = null,
      _dialogContextDialogId = null,

      // Some constants to improve minification
      STYLE_DISPLAY_BLOCK = 'block',
      STYLE_DISPLAY_NONE = 'none',
      STYLE_POSITION_FIXED = 'fixed',
      STYLE_POSITION_ABSOLUTE = 'absolute',
      STYLE_VISIBILITY_HIDDEN = "hidden",
      STYLE_VISIBILITY_VISIBLE = 'visible',
      STYLE_UNIT_PIXELS = 'px',
      ELEMENT_TYPE_DIV = 'div',
      STYLE_OVERFLOW_Y = 'overflow-y',
      ATTR_DISABLED = 'disabled',
      STYLE_BORDERBOX = 'border-box',
      STYLE_BOXSIZING = "box-sizing",
      STYLE_WIDTH = "width",
      STYLE_HEIGHT = "height";
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
  								else {	// if new return val is passed, it is passed to the piped done
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
  					rp = new Array(size);	// resolve params: params of each resolve, we need to track down them to be able to pass them in the correct order if the master needs to be resolved

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
  /*
      General utility functions
  */
  function isUndefined(obj) {
      return typeof obj === "undefined";
  }

  function uniqid(prefix) {
      prefix = prefix || "u";
      _uniqidix ++;
      return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4) + _uniqidix;
  }


  function parseInteger(v) {
      var val = parseInt(v, 10);
      if (isNaN(val)) return 0;
      return val;
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
          element.setAttribute(keys[i], attributes[keys[i]]);
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
              _messageId++;
              options.messageId =  _messageIdPrefix + "_" + _messageId;
          }

          var sendToTargetWindow = 'mother',
              messagesToMother = ['$c', '$b', '$m', '$n']; 
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
                      if (o.messageType.indexOf('$o') === -1) {
                          return;
                      }
                  } else if (_boundDialogId !== o.dialogrId) {
                      return;
                  }

                  if(!isUndefined(_eventHandlers[o.messageType])) {
                     // console.warn("handlers", eventingDialogId, _eventHandlers);
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

    

      /*! Deferred (https://github.com/warpdesign/deferred-js) */


      //
      // We always want the width and height in pixels
      //
      function normalizeOptions(options) {
          options.width = normalizeSize(options.width, window.innerWidth);
          options.height = normalizeSize(options.height, window.innerHeight);

          options.left =  Math.ceil( (window.innerWidth/2) - (parseInt(options.width,10) / 2)) + STYLE_UNIT_PIXELS;
          options.top =  Math.ceil( (window.innerHeight/2) - (parseInt(options.height,10) / 2)) + STYLE_UNIT_PIXELS;

          return options;
      }

      function normalizeSize(sizeValue, containerSize) {
          var match;

          if (typeof sizeValue === "function") {
              sizeValue = sizeValue(containerSize);
          }

          if (typeof sizeValue === "string") {
              if ( (match = sizeValue.match(/^(\d+)\%$/))) {
                  sizeValue = Math.ceil((match[1] / 100) * containerSize) + STYLE_UNIT_PIXELS;
              } else if ( (match = sizeValue.match(/^(\d+)$/))) {
                  sizeValue = parseInt(match[1], 10) + STYLE_UNIT_PIXELS;
              }
          } else if (typeof sizeValue === "number") {
              sizeValue = sizeValue + STYLE_UNIT_PIXELS;
          } else {
              sizeValue = 0;
          }
          return sizeValue;
      }

      var _dialogs = [];

      


      function onResize(elements, dialogOptions) {

          var dialogElement = elements.dialog,
              dialogElement__loaderOverlay = elements.p,
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
              loaderElement = getElementSize(dialogElement__loader),
              dialogInnerWidth = dialogSize.innerWidth(),
              dialogInnerHeight = dialogSize.innerHeight(),
              footerHeight = footerElement.height(),
              headerHeight = headerElement.height();

              getInnerWidth()

          contentElement.setWidth( dialogInnerWidth );
          var x =  dialogInnerHeight - footerHeight - headerHeight;

          contentElement.setHeight( dialogInnerHeight - footerHeight - headerHeight  );
          footerElement.setTop( contentElement.height() + headerHeight );
          footerElement.setWidth( dialogInnerWidth );


          loaderElement.setTop((dialogInnerHeight / 2) - (loaderElement.height()/2));
          loaderElement.setLeft((dialogInnerWidth / 2) - (loaderElement.width()/2));
      }

      function calculateDialogSize(elements, dialogOptions) {
          var width = normalizeSize(dialogOptions.width, window.innerWidth),
              height = normalizeSize(dialogOptions.height, window.innerHeight),
              left =  Math.ceil( (window.innerWidth/2) - (parseInt(width,10) / 2)) + STYLE_UNIT_PIXELS,
              top =  Math.ceil( (window.innerHeight/2) - (parseInt(height,10) / 2)) + STYLE_UNIT_PIXELS,
              actualW = width,
              actualH = height,
              iw = null;

           var padding = getOuterSizes(elements.dialog, "padding"), 
                  borders = getOuterSizes(elements.dialog, "border-width"),
                  margins = getOuterSizes(elements.dialog, "margin");

               if (parseInteger(dialogOptions.maxWidth) > 0 && parseInteger(actualW) > parseInt(dialogOptions.maxWidth)) {
              width = dialogOptions.maxWidth;
              left =  Math.ceil( (window.innerWidth/2) - (parseInt(width,10) / 2)) + STYLE_UNIT_PIXELS;
              if(getStyle(elements.dialog, STYLE_BOXSIZING) != STYLE_BORDERBOX) {
                  iw = (parseInteger(width) ) + STYLE_UNIT_PIXELS;
              } else {
                  iw = (parseInteger(width) - padding.r - padding.l - borders.l - borders.r ) + STYLE_UNIT_PIXELS;
              }
          }

              
          if (getStyle(elements.dialog, STYLE_BOXSIZING) != STYLE_BORDERBOX) {
              width = (parseInteger(width) - padding.l - padding.r - borders.l - borders.r - margins.l - margins.r) + STYLE_UNIT_PIXELS;
              height = (parseInteger(height) - padding.t - padding.b - borders.t - borders.b - margins.t - margins.b) + STYLE_UNIT_PIXELS;
          }



          if ( parseInteger(actualW) > window.innerWidth 
              || parseInteger(actualH) > window.innerHeight 
              || (parseInteger(dialogOptions.minWidth) > 0 && parseInteger(window.innerWidth) < parseInteger(dialogOptions.minWidth))
              || (parseInteger(dialogOptions.minHeight) > 0 && parseInteger(window.innerHeight) < parseInteger(dialogOptions.minHeight))
              ) {
              width = window.innerWidth + STYLE_UNIT_PIXELS;
              height = window.innerHeight + STYLE_UNIT_PIXELS;
              left = 0;
              top = 0;

              if(getStyle(elements.dialog, STYLE_BOXSIZING) != STYLE_BORDERBOX) {
                  iw = (parseInteger(width) - padding.r ) + STYLE_UNIT_PIXELS;
              } else {
                  iw =  (parseInteger(width) - padding.r - padding.l - borders.l - borders.r ) + STYLE_UNIT_PIXELS;
              }

         
          } else {
              if(getStyle(elements.dialog, STYLE_BOXSIZING) != STYLE_BORDERBOX) {
                  iw = (parseInteger(width) ) + STYLE_UNIT_PIXELS;
              } else {
                  iw = (parseInteger(width) - padding.r - padding.l - borders.l - borders.r ) + STYLE_UNIT_PIXELS;
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
              dialogElement__buttons = [],
              className = dialogOptions.className;


          dialogElement = setStyle(setAttribute(createElement(ELEMENT_TYPE_DIV), {
              class : className,
              id : uniqid()
          }), {
              position : STYLE_POSITION_FIXED,
              zIndex : dialogOptions.zIndex,
              display : STYLE_DISPLAY_BLOCK
          });

          dialogElement__overlay = setAttribute(setStyle(createElement(ELEMENT_TYPE_DIV), {
              position : STYLE_POSITION_FIXED,
              width : '100%',
              backgroundColor : 'rgba(0,0,0,0.5)',
              height : '100%',
              top : 0,
              left : 0,
              zIndex : dialogElement.style.zIndex - 10
          }), {
              "data-dialogr-id" : id,
              "class" : className + "__overlay"
          });

          dialogElement__content = setStyle(
              setAttribute(
                  createElement('iframe'), 
                  {
                      class : className + "__content"
                  }
              ), {
                  position : STYLE_POSITION_ABSOLUTE,
                  display : STYLE_DISPLAY_BLOCK,
                  visibility : STYLE_VISIBILITY_HIDDEN
              }
          );



          dialogElement__loaderOverlay = setStyle(setAttribute(createElement(ELEMENT_TYPE_DIV), {
              "class" : className + "__loader-overlay"
          }), {
              position : STYLE_POSITION_FIXED,
              border : '1px solid #aaa',
              backgroundColor : 'rgba(255,255,255,0.8)',
              cursor : 'wait',
              display : STYLE_DISPLAY_BLOCK,
              visibility : 'visible'
          });

          dialogElement__loader = setInnerHtml(setStyle(setAttribute(createElement(ELEMENT_TYPE_DIV), {
              "class" : className + "__overlay"
          }), {
              position : STYLE_POSITION_ABSOLUTE,
              backgroundColor : '#fff',
              display : STYLE_DISPLAY_BLOCK
          }), 'Loading...');

          dialogElement__footer = setStyle(setAttribute(createElement(ELEMENT_TYPE_DIV), {
              class : className + "__footer"
          }), {
              position : STYLE_POSITION_ABSOLUTE,
              display : STYLE_DISPLAY_BLOCK
          });

          dialogElement__header = setStyle(setAttribute(createElement(ELEMENT_TYPE_DIV), {
              class : className + "__header"
          }), {
              overflow : STYLE_VISIBILITY_HIDDEN,
              display : STYLE_DISPLAY_BLOCK
          });

          function createButton(buttonName, buttonHtml) {
              return setInnerHtml(
                  setAttribute(
                      createElement('button'), {
                          id : 'button_' + id + '_' + buttonName,
                          onclick : "dialogr.trigger(\"" + id + "\", \"button_" + buttonName + "\");",
                          class : "dialogr__button button_" + buttonName
                      }
                  ), buttonHtml);
          }



           function createButtons(dialogOptions) {

              var buttonCount = 0,
                  btn,
                  keys,
                  existing = dialogElement__footer.querySelectorAll('.dialogr__button');

                  for (var i=0; i < existing.length; i++) {
                      existing[i].parentNode.removeChild(existing[i]);
                  }

                  dialogElement__buttons = [];
          
              if(!isUndefined(dialogOptions.buttons)) {
                  if (dialogOptions.buttons.constructor === Array) {
                      for (i=0; i < dialogOptions.buttons.length; i++) {
                          btn = createButton(i, dialogOptions.buttons[i]);
                          appendChildren(dialogElement__footer, [btn]);
                          dialogElement__buttons["button_" + i] = btn;
                          buttonCount++;
                      }
                  } else if (typeof dialogOptions.buttons === "object") {
                      keys = getKeys(dialogOptions.buttons)
                      for (i=0; i < keys.length; i++) {
                          btn = createButton(keys[i], dialogOptions.buttons[keys[i]].text);
                          appendChildren(dialogElement__footer, [btn]);
                          dialogElement__buttons["button_" + keys[i]] = btn;
                          buttonCount++;
                      }
                  }
              }

              setStyle(dialogElement__footer, {display : buttonCount === 0 ? 'none' : 'block'});

          }


          if (!dialogOptions.title) {
              setStyle(dialogElement__header, {display : STYLE_DISPLAY_BLOCK});
          } else {
              setInnerHtml(dialogElement__header, "<a href='javascript:dialogr.close(\"" + id + "\")'>x</a><h1>" + dialogOptions.title + "</h1>");
          }
          createButtons(dialogOptions);
          appendChildren(dialogElement__loaderOverlay, [dialogElement__loader]);
          appendChildren(dialogElement, [dialogElement__header, dialogElement__content, dialogElement__footer, dialogElement__loaderOverlay]);
          return {
              o : dialogElement__overlay,
              p : dialogElement__loaderOverlay,
              loader : dialogElement__loader,
              dialog : dialogElement,
              header : dialogElement__header,
              footer : dialogElement__footer,
              content : dialogElement__content,
              buttons : dialogElement__buttons,
              createButtons : createButtons,
              destroy : function() {},
              addToDom : function() {
                  appendChildren(document.body, [dialogElement, dialogElement__overlay]);
              }
          };
      }

      winloadDeferred = self.Deferred();

      if (document.readyState === "complete") {
          winloadDeferred.resolve();
      } else {
          attachEventHandler(window, 'load', function() {
              winloadDeferred.resolve();
          });
      }

  // The actual instance of the dialog
      function DialogrDialog(options, internalOptions, idFromDialogEvent, openerDialogId) {

          var _dialogOptions, 
              _elements = {},
              _currentDialog = this,
              _weAre = null,
              _isFather = options.$$.isFather,
              _isMother = options.$$.isMother,
              _thisId = null;

          _dialogOptions = extend({}, dialogrDefaults, options);
          _dialogOptions.maxWidth = normalizeSize(_dialogOptions.maxWidth, window.outerWidth);
          _dialogOptions.minWidth = normalizeSize(_dialogOptions.minWidth, window.outerWidth);

          if (isUndefined(_dialogOptions.url)) {
              console.error("[dialogr] No url was given");
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
              _disableScrollForElements = [];
              
           if (_weAre.father) {
              _eventing.on('$f', function(d, msg, msgEvent) {
                  if (_weAre.fatherTo == d.childId) {
                      _eventing.setNamedTarget('child', msgEvent.source);
                      _eventing.send('$k', null, null, msgEvent.source);
                  }
              }); 

          } else if (_weAre.mother) {

              _eventing.on('$h', function(buttonName) {
                  if (_elements.buttons[buttonName]) {
                      _elements.buttons[buttonName].setAttribute(ATTR_DISABLED,ATTR_DISABLED);
                  }
              })
              .on('$i', function(buttonName) {
                  if (_elements.buttons[buttonName]) {
                      _elements.buttons[buttonName].removeAttribute(ATTR_DISABLED);
                  }
              })
              .on('$a', function(e) {
                  if (_elements.buttons[e.element]) {
                      _elements.buttons[e.element].innerText = e.value;
                  }
              })
              .on('$g', function(e) {
                  if (_elements.buttons[e.element]) {
                      _elements.buttons[e.element].innerHTML = e.value;
                  }
              }).on('$l', function(e) {
                  if (_elements.buttons[e.element]) {
                      _elements.buttons[e.element].innerHTML = e.value;
                  }
              });
          }

          // Event to hook up the dialog window
          //
          _eventing.on('$o', function(data, msg, e) {
              //_eventing.off('$o');
              var updateSize = false,
                  deferred = self.Deferred();
              _eventing.setDialogrId(_currentDialog.id);
              _eventing.setNamedTarget('dialog', e.source);

              if (!isUndefined(data.options)) {
                  console.warn("before", JSON.stringify(_dialogOptions) );

                  if (data.options.width && !_dialogOptions.$$.raw.width) {
                      updateSize = true;
                      _dialogOptions.width = normalizeSize(data.options.width, getInnerWidth());
                  }
                  if (data.options.height&& !_dialogOptions.$$.raw.height) {
                      updateSize = true;
                      _dialogOptions.height = normalizeSize(data.options.height, getInnerWidth());
                  }

                  if (data.options.buttons && !_dialogOptions.$$.raw.buttons) {
                      updateSize = true;
                      _dialogOptions.buttons = data.options.buttons;
                      _elements.createButtons(_dialogOptions);
                  }

                  if (updateSize) {
                      onResize(_elements, _dialogOptions);
                  }
              }


              deferred.resolve(extend({
                  openerUrl : window.location.href.toString(),
                  dialogrId : _currentDialog.id,
                  param : _dialogOptions.param
              }, {
                  opener : openerDialogId
              }));
              
              return deferred.promise();
          });

          function onResizeEventHandler() {
              onResize(_elements, _dialogOptions);
          }

          _eventing.on('$e', function(d) {
              dialogDeferred.reject(d);
              _currentDialog.close();
          });

          _eventing.on('$j', function(d) {
              dialogDeferred.resolve(d);
              _currentDialog.close();
          });

          _eventing.on('$c', function(d,e,f) {
            // console.warn("Received close",d,e,f);
              _currentDialog.close();
          });

          _eventing.on('$b', function() {
              _elements.p.style.visibility = STYLE_VISIBILITY_VISIBLE;
          });

          _eventing.on('$m', function() {
              _elements.p.style.visibility = STYLE_VISIBILITY_HIDDEN;
              _elements.content.style.visibility = STYLE_VISIBILITY_VISIBLE;
          });

          if ( _isMother ) {

              _eventing.on('$n', function(d) {
                  var deferred = self.Deferred();
                  d.options.$$.isMother = true;
                  d.options.$$.isFather = false;
                  var x = dialogr.open(d.options, d.newDialogId, d.openerId);
                  deferred.resolve({
                      dialogrId : d.newDialogId
                  });
                  return deferred.promise();
              });

              _elements = createDialogElements(_thisId, _dialogOptions);

              i = document.getElementsByTagName('html');
              if (i.length == 1) _disableScrollForElements.push(i[0]);
              i = document.getElementsByTagName('body');
              if (i.length == 1) _disableScrollForElements.push(i[0]);

              var _originalStyles = [];
              for (i=0; i < _disableScrollForElements.length; i++) {
                  _originalStyles.push(getStyle(_disableScrollForElements[i], STYLE_OVERFLOW_Y));
                  setStyle(_disableScrollForElements[i], {STYLE_OVERFLOW_Y : STYLE_VISIBILITY_HIDDEN});
              }

              _elements.addToDom();

                  onResize(_elements, _dialogOptions);
          

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
              //    _eventing.send('$c');
             // }
              if (_dialogs.length == 1) {
                  for (var i=0; i < _disableScrollForElements.length; i++) {
                      setStyle(_disableScrollForElements[i], {STYLE_OVERFLOW_Y : _originalStyles[i]});
                  }
              }
             if (_weAre.father && !_weAre.mother) {
                  _eventing.send('$c');
             } else if (_weAre.mother) {
                 for (var i=0; i < _dialogs.length; i++) {
                  if (_dialogs[i].id == _currentDialog.id) {
                      _dialogs.splice(i, 1);
                      break;
                  }
                 }
                 if (_elements && _elements.dialog && _elements.dialog.parentNode && _elements.o) {
                     _elements.dialog.parentNode.removeChild(_elements.dialog);
                     _elements.o.parentNode.removeChild(_elements.o);
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

      // Find the opening window.
      _eventing.await('$o', {
          dialogUrl : window.location.toString(),
          id : dialogrIdParameter,
          options : options
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
              _eventing.on('$k', function(data, msg, msgEvent) {
                  _eventing.off('$k');
                  //console.info("OK! We know who our father is!!", data,msg,msgEvent);
                  _eventing.setNamedTarget('father', msgEvent.source);
                  _context.unblock();
                  successCallback(data);
              });
              //console.warn("["+data.dialogrId+"] WE ARE CHILD (context) (I know mother - where's father?)", data, window.location.href);
              var t= win.parent;
              for (var i=0; i < t.window.frames.length; i++) {
                  _eventing.send('$f', { "frame" : i, "childId" : dialogrIdParameter }, null, t.window.frames[i]);
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
          _context.trigger('$h', button);
      };
      this.addClass = function(elementName, className) {};
      this.removeClass = function(elementName, className) {};
      this.css = function(elementName, styleName, styleValue) {};
      this.attr = function(elementName, key, value) {};
      this.text = function(elementName, newValue) {
          _context.trigger('$a', {
              element : elementName, 
              value : newValue
          });
      };
      this.html = function(elementName, newValue) {
          _context.trigger('$g', {
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
          _eventing.send('$c');
      };
      this.block = function() {
          _eventing.send('$b');
      };
      this.unblock = function() {
          _eventing.send('$m');
      };
      this.resolve = function(data) {
          _eventing.send('$j', data);
      };
      this.reject = function(data){
          _eventing.send('$e', data);
      };
      this.buttons = function(data) {
          _eventing.send('$l', data);
      };
      this.param = {};
      };



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

          _dialogContext.invoke('$n', {
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


      //
      // The dialogcontext is what is used when inside a dialog
      //
      

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
  win.dialogr = Dialogr();
  }(window));
