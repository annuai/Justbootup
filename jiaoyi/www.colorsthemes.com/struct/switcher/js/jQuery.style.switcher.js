/*
1. jQuery.style.switcher.js
2. jquery.tabSlideOut.v1.3.js
3. custom.js
*/
/* ----------------------------------------------------------------------
    1. styleswitch.js
---------------------------------------------------------------------- */
/**
@author Cameron Manavian
jQuery Style Switcher

The MIT License (MIT)

Copyright (c) 2014 Cameron Manavian

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
**/

(function ($) {
	var jStyleSwitcher,
		_defaultOptions = {
			hasPreview: true,
			defaultThemeId: 'jssDefault',
			fullPath: 'css/',
			cookie: {
				expires: 30,
				isManagingLoad: true
			}
		},
		// private
		_cookieKey = 'jss_selected',
		_docCookies = {};

	/*\
	|*|
	|*|  :: cookies.js ::
	|*|
	|*|  A complete cookies reader/writer framework with full unicode support.
	|*|
	|*|  revision #1
	|*|
	|*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
	|*|
	|*|  This framework is released under the GNU Public License, version 3 or later.
	|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
	|*|
	|*|  Syntaxes:
	|*|
	|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
	|*|  * docCookies.getItem(name)
	|*|  * docCookies.removeItem(name[, path[, domain]])
	|*|  * docCookies.hasItem(name)
	|*|  * docCookies.keys()
	|*|
	\*/
	_docCookies = {
		getItem: function (sKey) {
			if (!sKey) {
				return null;
			}
			return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
		},
		setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
			if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
				return false;
			}
			var sExpires = "";
			if (vEnd) {
				switch (vEnd.constructor) {
					case Number:
						sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
						break;
					case String:
						sExpires = "; expires=" + vEnd;
						break;
					case Date:
						sExpires = "; expires=" + vEnd.toUTCString();
						break;
				}
			}
			document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
			return true;
		},
		removeItem: function (sKey, sPath, sDomain) {
			if (!this.hasItem(sKey)) {
				return false;
			}
			document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
			return true;
		},
		hasItem: function (sKey) {
			if (!sKey) {
				return false;
			}
			return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
		},
		keys: function () {
			var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
			for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
				aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
			}
			return aKeys;
		}
	};

	jStyleSwitcher = function ($root, config) {
		return this.init($root, config);
	};

	jStyleSwitcher.prototype = {

		/**
		 * {Object} DOM reference to style option list
		 */
		$root: null,

		/**
		 * {Object} configs for the style switcher
		 */
		config: {},

		/**
		 * {Object} jQuery reference to <link> tag for swapping CSS
		 */
		$themeCss: null,
		
		/**
		 * {String} default theme page was loaded with
		 */
		defaultTheme: null,

		init: function ($root, config) {
			this.$root = $root;
			this.config = config ? config : {};
			this.setDefaultTheme();
			if(this.defaultTheme) {
				// try cookies
				if (this.config.cookie) {
					this.checkCookie();
				}
				// try hover
				if (this.config.hasPreview) {
					this.addHoverEvents();
				}
				// finally, add click events
				this.addClickEvents();
			} else {
				this.$root.addClass('jssError error level0');
			}
		},

		setDefaultTheme: function () {
			this.$themeCss = $('link[id=' + this.config.defaultThemeId + ']');
			if(this.$themeCss.length) {
				this.defaultTheme = this.$themeCss.attr('href');
			}
		},
		
		resetStyle: function() {
			this.updateStyle(this.defaultTheme);
		},
		
		updateStyle: function(newStyle) {
			this.$themeCss.attr('href', newStyle);
		},
		
		getFullAssetPath: function(asset) {
			return this.config.fullPath + asset + '.css';
		},

		checkCookie: function () {
			var styleCookie;
			// if using cookies and using JavaScript to load css
			if (this.config.cookie && this.config.cookie.isManagingLoad) {
				// check if css is set in cookie
				styleCookie = _docCookies.getItem(_cookieKey);
				if (styleCookie) {
					newStyle = this.getFullAssetPath(styleCookie);
					// update link tag
					this.updateStyle(newStyle);
					// update default ref
					this.defaultTheme = newStyle;
				}
			}
		},

		addHoverEvents: function () {
			var self = this;
			this.$root.find('a').hover(
				function () {
					var asset = $(this).data('theme'),
						newStyle = self.getFullAssetPath(asset);
					// update link tag
					self.updateStyle(newStyle);
				},
				function () {
					// reset link tag
					self.resetStyle();
				}
			);
		},

		addClickEvents: function () {
			var self = this;
			this.$root.find('a').click(
				function () {
					var asset = $(this).data('theme'),
						newStyle = self.getFullAssetPath(asset);
					// update link tag
					self.updateStyle(newStyle);
					// update default ref
					self.defaultTheme = newStyle;
					// try to store cookie
					if (self.config.cookie) {
						_docCookies.setItem(_cookieKey, asset, self.config.cookie.expires, '/');
					}
				}
			);
		}
	};

	$.fn.styleSwitcher = function (options) {
		return new jStyleSwitcher(this, $.extend(true, _defaultOptions, options));
	};
})(jQuery);





/* ----------------------------------------------------------------------
    2. jquery.tabSlideOut.v1.3.js
---------------------------------------------------------------------- */
/*
    tabSlideOUt v1.3
    
    By William Paoli: http://wpaoli.building58.com

    To use you must have an image ready to go as your tab
    Make sure to pass in at minimum the path to the image and its dimensions:
    
    example:
    
        $('.slide-out-div').tabSlideOut({
                tabHandle: '.handle',                         //class of the element that will be your tab -doesnt have to be an anchor
                pathToTabImage: 'images/contact_tab.gif',     //relative path to the image for the tab *required*
                imageHeight: '133px',                         //height of tab image *required*
                imageWidth: '44px',                           //width of tab image *required*    
        });

    
*/


(function($){
    $.fn.tabSlideOut = function(callerSettings) {
        var settings = $.extend({
            tabHandle: '.handle',
            speed: 300, 
            action: 'click',
            tabLocation: 'left',
            topPos: '200px',
            leftPos: '20px',
            fixedPosition: false,
            positioning: 'absolute',
            pathToTabImage: null,
            imageHeight: null,
            imageWidth: null,
            onLoadSlideOut: false                       
        }, callerSettings||{});

        settings.tabHandle = $(settings.tabHandle);
        var obj = this;
        if (settings.fixedPosition === true) {
            settings.positioning = 'fixed';
        } else {
            settings.positioning = 'absolute';
        }
        
        //ie6 doesn't do well with the fixed option
        if (document.all && !window.opera && !window.XMLHttpRequest) {
            settings.positioning = 'absolute';
        }
        

        
        //set initial tabHandle css
        
        if (settings.pathToTabImage != null) {
            settings.tabHandle.css({
            'background' : 'url('+settings.pathToTabImage+') no-repeat',
            'width' : settings.imageWidth,
            'height': settings.imageHeight
            });
        }
        
        settings.tabHandle.css({ 
            'display': 'block',
            'textIndent' : '-99999px',
            'outline' : 'none',
            'position' : 'absolute'
        });
        
        obj.css({
            'line-height' : '1',
            'position' : settings.positioning
        });

        
        var properties = {
                    containerWidth: parseInt(obj.outerWidth(), 10) + 'px',
                    containerHeight: parseInt(obj.outerHeight(), 10) + 'px',
                    tabWidth: parseInt(settings.tabHandle.outerWidth(), 10) + 'px',
                    tabHeight: parseInt(settings.tabHandle.outerHeight(), 10) + 'px'
                };

        //set calculated css
        if(settings.tabLocation === 'top' || settings.tabLocation === 'bottom') {
            obj.css({'left' : settings.leftPos});
            settings.tabHandle.css({'right' : 0});
        }
        
        if(settings.tabLocation === 'top') {
            obj.css({'top' : '-' + properties.containerHeight});
            settings.tabHandle.css({'bottom' : '-' + properties.tabHeight});
        }

        if(settings.tabLocation === 'bottom') {
            obj.css({'bottom' : '-' + properties.containerHeight, 'position' : 'fixed'});
            settings.tabHandle.css({'top' : '-' + properties.tabHeight});
            
        }
        
        if(settings.tabLocation === 'left' || settings.tabLocation === 'right') {
            obj.css({
                'height' : properties.containerHeight,
                'top' : settings.topPos
            });
            
            settings.tabHandle.css({'top' : 0});
        }
        
        if(settings.tabLocation === 'left') {
            obj.css({ 'left': '-' + properties.containerWidth});
            settings.tabHandle.css({'right' : '-' + properties.tabWidth});
        }

        if(settings.tabLocation === 'right') {
            obj.css({ 'right': '-' + properties.containerWidth});
            settings.tabHandle.css({'left' : '-' + properties.tabWidth});
            
            $('html').css('overflow-x', 'hidden');
        }

        //functions for animation events
        
        settings.tabHandle.click(function(event){
            event.preventDefault();
        });
        
        var slideIn = function() {
            
            if (settings.tabLocation === 'top') {
                obj.animate({top:'-' + properties.containerHeight}, settings.speed).removeClass('open');
            } else if (settings.tabLocation === 'left') {
                obj.animate({left: '-' + properties.containerWidth}, settings.speed).removeClass('open');
            } else if (settings.tabLocation === 'right') {
                obj.animate({right: '-' + properties.containerWidth}, settings.speed).removeClass('open');
            } else if (settings.tabLocation === 'bottom') {
                obj.animate({bottom: '-' + properties.containerHeight}, settings.speed).removeClass('open');
            }    
            
        };
        
        var slideOut = function() {
            
            if (settings.tabLocation == 'top') {
                obj.animate({top:'-3px'},  settings.speed).addClass('open');
            } else if (settings.tabLocation == 'left') {
                obj.animate({left:'-3px'},  settings.speed).addClass('open');
            } else if (settings.tabLocation == 'right') {
                obj.animate({right:'-3px'},  settings.speed).addClass('open');
            } else if (settings.tabLocation == 'bottom') {
                obj.animate({bottom:'-3px'},  settings.speed).addClass('open');
            }
        };

        var clickScreenToClose = function() {
            obj.click(function(event){
                event.stopPropagation();
            });
            
            $(document).click(function(){
                slideIn();
            });
        };
        
        var clickAction = function(){
            settings.tabHandle.click(function(event){
                if (obj.hasClass('open')) {
                    slideIn();
                } else {
                    slideOut();
                }
            });
            
            clickScreenToClose();
        };
        
        var hoverAction = function(){
            obj.hover(
                function(){
                    slideOut();
                },
                
                function(){
                    slideIn();
                });
                
                settings.tabHandle.click(function(event){
                    if (obj.hasClass('open')) {
                        slideIn();
                    }
                });
                clickScreenToClose();
                
        };
        
        var slideOutOnLoad = function(){
            slideIn();
            setTimeout(slideOut, 500);
        };
        
        //choose which type of action to bind
        if (settings.action === 'click') {
            clickAction();
        }
        
        if (settings.action === 'hover') {
            hoverAction();
        }
        
        if (settings.onLoadSlideOut) {
            slideOutOnLoad();
        };
        
    };
})(jQuery);


/* ----------------------------------------------------------------------
    3. custom.js
---------------------------------------------------------------------- */
(function ($) {
    "use strict";
    $(function () {


/* tabslider-custom.js */
        $('.slide-out-div').tabSlideOut({
            tabHandle: '.handle', //class of the element that will be your tab
            tabLocation: 'left', //side of screen where tab lives, top, right, bottom, or left
            speed: 300, //speed of animation
            action: 'click', //options: 'click' or 'hover', action to trigger animation
            fixedPosition: true, //options: true makes it stick(fixed position) on scroll
            topPos: '150px', //position from the top
            pathToTabImage: 'switcher/images/switcher-tab.png', //path to the image for the tab (optionaly can be set using css)
            imageHeight: '50px', //height of tab image
            imageWidth: '50px' //width of tab image    
			
        });


    });
}(jQuery));




















