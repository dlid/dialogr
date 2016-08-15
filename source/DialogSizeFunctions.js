  

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
            dialogElement__loaderOverlay = elements.dialogElementLoaderOverlay_r,
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
            dialogElementOverlay_r : dialogElement__overlay,
            dialogElementLoaderOverlay_r : dialogElement__loaderOverlay,
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
