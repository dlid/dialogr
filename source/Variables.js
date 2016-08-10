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
    STYLE_UNIT_PIXELS = 'px',
    ELEMENT_TYPE_DIV = 'div';