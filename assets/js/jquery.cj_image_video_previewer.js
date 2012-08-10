/*globals window, document, jQuery */

/*
 jQuery('img.photo',this).imagesLoaded(myFunction)
 execute a callback when all images have loaded.
 needed because .load() doesn't work on cached images

 mit license. paul irish. 2010. (http://gist.github.com/268257)
 webkit fix from Oren Solomianik. thx!

 callback function is passed the last image to load
 as an argument, and the collection as `this`
*/
(function ($) {
	'use strict';
	// blank image data-uri bypasses webkit log warning (thx doug jones)
	var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
	$.fn.imagesLoaded = function (callback) {
		var $this = this,
			deferred = $.isFunction($.Deferred) ? $.Deferred() : 0,
			hasNotify = $.isFunction(deferred.notify),
			$images = $this.find('img').add($this.filter('img')),
			loaded = [],
			proper = [],
			broken = [];

		function doneLoading() {
			var $proper = $(proper),
				$broken = $(broken);
			if (deferred) {
				if (broken.length) {
					deferred.reject($images, $proper, $broken);
				} else {
					deferred.resolve($images);
				}
			}
			if ($.isFunction(callback)) {
				callback.call($this, $images, $proper, $broken);
			}
		}

		function imgLoaded(img, isBroken) {
			// don't proceed if BLANK image, or image is already loaded
			if (img.src === BLANK || $.inArray(img, loaded) !== -1) {
				return;
			}
			// store element in loaded images array
			loaded.push(img);
			// keep track of broken and properly loaded images
			if (isBroken) {
				broken.push(img);
			} else {
				proper.push(img);
			}
			// cache image and its state for future calls
			$.data(img, 'imagesLoaded', {
				isBroken: isBroken,
				src: img.src
			});
			// trigger deferred progress method if present
			if (hasNotify) {
				deferred.notifyWith($(img), [isBroken, $images, $(proper), $(broken)]);
			}
			// call doneLoading and clean listeners if all images are loaded
			if ($images.length === loaded.length) {
				window.setTimeout(doneLoading);
				$images.unbind('.imagesLoaded');
			}
		}
		// if no images, trigger immediately
		if (!$images.length) {
			doneLoading();
		} else {
			$images.bind('load.imagesLoaded error.imagesLoaded', function (event) {
				// trigger imgLoaded
				imgLoaded(event.target, event.type === 'error');
			}).each(function (i, el) {
				var src = el.src,
					cached;
				// find out if this image has been already checked for status
				// if it was, and src has not changed, call imgLoaded on it
				cached = $.data(el, 'imagesLoaded');
				if (cached && cached.src === src) {
					imgLoaded(el, cached.isBroken);
					return;
				}
				// if complete is true and browser supports natural sizes, try
				// to check for image status manually
				if (el.complete && el.naturalWidth !== undefined) {
					imgLoaded(el, el.naturalWidth === 0 || el.naturalHeight === 0);
					return;
				}
				// cached images don't fire load sometimes, so we reset src, but only when
				// dealing with IE, or image is complete (loaded) and failed manual check
				// webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
				if (el.readyState || el.complete) {
					el.src = BLANK;
					el.src = src;
				}
			});
		}
		return deferred ? deferred.promise($this) : $this;
	};
}(jQuery));


/*globals window,document,jQuery,alert */
/* ***********************************************************************************

	CJ Image Video Previewer JavaScript framework

	Copyright (c) 2009-2012, Doug Jones. All rights reserved.

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions
	are met:

	a) Redistributions of source code must retain the above copyright
	   notice, this list of conditions and the following disclaimer.

	b) Redistributions in binary form must reproduce the above copyright
	   notice, this list of conditions and the following disclaimer in the
	   documentation and/or other materials provided with the distribution.

	c) Neither the name of the Creative Juices, Bo. Co. nor the names of its
	   contributors may be used to endorse or promote products derived from
	   this software without specific prior written permission.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

	For further information, visit the Creative Juices website: www.cjboco.com.

	Version History

	2.0.0	(08-10-2012) - Complete re-write.
	1.1.1	(08-09-2012) - Fixed an IE9 bug. Updated jQuery.imagesLoaded.
	1.1.0	(07-04-2010) - Fixed an IE8 bug. Added autoPlay.
	1.0.2	(03-18-2010) - Fixed a bug with the mouse tracking. This
						   prevented the script from firing properly on mouseovers.
	1.0.1	(12-28-2009) - Tweaked the POSITIONING check. Now forcing RELATIVE
						   if it has not been set.
	1.0		(10-23-2009) - Initial release.

*********************************************************************************** */
(function ($) {
	'use strict';

	$.cjImageVideoPreviewer = function ($obj, settings) {

		var o = {
			// user editable settings
			method: 'fit',
			fade: 0,
			width: null,
			height: null,
			destElem: null,
			callback: null
		};

		// initializes our slideshow
		function _clear() {

			var sys = $obj.data('system');

			if (sys.timer !== null) {
				window.clearTimeout(sys.timer);
				sys.timer = null;
			}
		}

		// reset everything
		function _stop() {

			var sys = $obj.data('system');

			if (sys.state) {

				_clear();
				sys.idx = 0;
				sys.state = false;

				// show the first image
				$obj.find('div.cjImageVideoPreviewer img:first').css({
					display: 'block'
				});

				// hide all the other images
				$obj.find('div.cjImageVideoPreviewer img:not(:first)').css({
					display: 'none'
				});
			}
		}

		// this function handles the image transitions.
		function _thumbnail() {

			var sys = $obj.data('system'),
				curImg = $obj.attr('id') + '_IMG_' + sys.idx,
				nextImg = $obj.attr('id') + '_IMG_' + (sys.idx + 1 > o.images.length - 1 ? 1 : sys.idx + 1);

			sys.idx = sys.idx + 1 > o.images.length - 1 ? 1 : sys.idx + 1;

			$obj.find('.cjImageVideoPreviewer img#' + nextImg).css({
				display: 'block'
			});
			$obj.find('.cjImageVideoPreviewer img#' + curImg).css({
				display: 'none'
			});
			_clear();

			if (o.autoPlay) {

				sys.timer = window.setTimeout(_thumbnail, o.delay);

			} else {

				// let's make sure that the mouse is still over our element before we set another timer
				if (sys.mouseX >= $obj.offset().left && sys.mouseX <= $obj.offset().left + $obj.width() && sys.mouseY >= $obj.offset().top && sys.mouseY <= $obj.offset().top + $obj.height()) {
					sys.timer = window.setTimeout(_thumbnail, o.delay);
				} else {
					_stop();
				}
			}
		}

		// make sure all out images have loaded before starting the transition animation
		function _check() {

			var sys = $obj.data('system'),
				$pbox, $pbar;

			// check load count against our image array
			// (keep in mind we added an image to it, so length - 1 - 1)


			if (sys.loaded > o.images.length - 2) {

				$obj.find('div.cjImageVideoPreviewerProgress').hide();
				sys.timer = window.setTimeout(_thumbnail, o.delay);

			} else {

				// animate the progress bar (if set)
				if (o.showProgress) {
					$pbox = $obj.find('.cjImageVideoPreviewerProgress');
					$pbar = $obj.find('.cjImageVideoPreviewerProgressBar');
					if ($pbox.css('display') !== 'block') {
						$pbox.show();
					}
					$pbar.css({
						left: parseInt($pbar.css('left'), 10) + parseInt($pbar.width() / (o.images.length - 2), 10)
					});
				}
			}
		}

		// setup a que container and load all the images
		function _setup() {

			var sys = $obj.data('system'),
				$link = $obj.find('a'),
				link;

			// add our original image to the top of the array
			o.images.unshift($obj.find('img:first').attr('src'));

			// is the original image's parent a LINK?
			if ($link.length > 0) {
				link = $link[0].href;
				$obj.append(
					$('<div>').css({
						display: 'block',
						width: $obj.width(),
						height: $obj.height(),
						position: 'absolute',
						top: 0,
						left: 0,
						margin: 0,
						padding: 0,
						border: 0,
						cursor: 'pointer',
						zIndex: 30
					}).on('click', function() {
						document.location.href = link;
					})
				);
				$obj.find('a img').appendTo($obj);
				$obj.find('a').remove();
			}

			// need to create an container loader for the images.
			// this will help with faster transitions
			$obj.append('<div class="cjImageVideoPreviewer">');
			$obj.find('.cjImageVideoPreviewer').css({
				display: 'none',
				width: $obj.width(),
				height: $obj.height(),
				overflow: 'hidden',
				position: 'absolute',
				top: 0,
				left: 0
			});

			// add a progress indicator to the main element (if set)
			if (o.showProgress) {
				$obj.append(
				$('<div class="cjImageVideoPreviewerProgress">').css({
					display: 'none',
					width: ($obj.width() - 4),
					height: 8,
					overflow: 'hidden',
					position: 'absolute',
					top: 0,
					left: 0,
					backgroundColor: $obj.css('border-top-color') || '#000',
					borderWidth: '2px',
					borderStyle: 'solid',
					borderColor: $obj.css('border-top-color') || '#000',
					zIndex: 20
				}).append(
				$('<div class="cjImageVideoPreviewerProgressBar">').css({
					display: 'block',
					width: ($obj.width() - 4),
					height: 6,
					overflow: 'hidden',
					position: 'absolute',
					top: 0,
					left: '-' + ($obj.width() - 4),
					// the background is using a base64 encoded image, IE doesn't show this, so it will use the background color instead
					background: '#6bc4f7 url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAGCAIAAABSPBl5AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAANRJREFUeNpckUtyxDAIRGms8WIq+9lMTpzL5RC5QhYZ23QakCcfFaIQEo+P8Pb+5TDJAgzY8FOAi7ffANMi7aAFbQvbyV26Jf2MuhofnzFZTuGEWBesLoNrcvEPtwcfkUTpx8FCJ7SJQwe3WsywxTJJ5EkaLAPz/ulknM8O6+pSJ+52hXCLz2Yv3pKdjrId6HyFqHICWxYoG9vZ7BHQg3G/es/uz/iQCTS+9j+bDSKyEAVL49fgMGf3+pKPtVVCBeew+gcmy35w7B6J/pPSxTpvvwUYAKIhoZSkg7l0AAAAAElFTkSuQmCC) repeat-x top left',
					zIndex: 21
				})));
			}

			// add all the images to main element.
			$(o.images).each(function (i) {
				var id = $obj.attr('id') + '_IMG_' + i;
				$obj.find('.cjImageVideoPreviewer:first').append(
				$('<img src="' + o.images[i] + '" id="' + id + '" />').css({
					display: 'none',
					position: 'absolute',
					top: 0,
					left: 0,
					zIndex: 10
				}));
				$('#' + id).imagesLoaded(function () {
					sys.loaded++;
					_check();
				});
			});

			// reveal our creation
			$obj.find('.cjImageVideoPreviewer').css({
				display: 'block'
			});

		}

		function _start() {

			var sys = $obj.data('system');

			// set the sys.state to true when we are running. Special occassions
			// can make the mouseLeave event not trigger (alerts, dialogs, etc)
			sys.state = true;
			_clear();

			// make sure the que container is available. If not, create it.
			if ($obj.find('.cjImageVideoPreviewer:first').length === 0) {

				// set up our que container
				_setup();
				sys.timer = window.setTimeout(_start, 100);

			} else {

				// que has already been created, start out transition animation
				sys.timer = window.setTimeout(_thumbnail, o.delay);
			}
		}

		function _init() {

			var sys = $obj.data('system');

			// check to make sure we have items in our image array and
			// at least one image in the element
			if (o.images.length > 1 && $obj.find('img').length > 0) {

				// make sure the delay is a positive integer
				o.delay = (!o.delay || o.delay < 0) ? 0 : parseInt(o.delay, 10);

				// make sure the first image is top most
				if ($obj.css('position') !== 'relative' && $obj.css('position') !== 'absolute') {
					alert('CJ Image Video Preview v' + (sys.version) + ' Error!\n\nYou parent element (#' + $obj.attr('id') + ') must have it\'s positioning set to either RELATIVE or ABSOLUTE.\n\nPosition: ' + ($obj.css('position')));
					return;
				}

				if (o.autoPlay) {

					// user choose to auto play (without user interaction)
					_start();

				} else {

					// set up event tracking, this ensures the mouse is still in our element
					$(document).mousemove(function (e) {
						sys.mouseX = e.pageX;
						sys.mouseY = e.pageY;
					});

					// user choose to only activate on mouseOvers
					$obj.hover(

					function () {
						// make sure the image is loaded before continuing
						if (sys.timer === null) {

							_start();

						}
					}, function () {

						_stop();

					});
				}
			}
		}


		if (settings && typeof settings === 'object') {

			// extend our options and store locally
			o = $.extend({
				images: [],
				delay: 450,
				autoPlay: false,
				showProgress: true
			}, settings);
			$obj.data('options', o);
			$obj.data('system', {
				// function parameters
				version: '2.0.0',
				elem: null,
				idx: 1,
				timer: null,
				loaded: 0,
				mouseX: null,
				mouseY: null,
				state: false
			});

			// init/autostart
			if (_init() && o.autoRun) {
				_start();
			}

		} else if (settings && typeof settings === 'string') {

			// pull our settings
			o = $obj.data('options');

			// method call
			if (o) {
				switch (settings) {
				case 'start':
					_start();
					break;
				case 'pause':
					_stop();
					break;
				default:
					break;
				}
			}
		}

	};

	$.fn.extend({

		cjImageVideoPreviewer: function (settings) {

			// call to the plug-in
			return this.each(function () {

				$.cjImageVideoPreviewer($(this), settings);

			});

		}
	});

}(jQuery));
