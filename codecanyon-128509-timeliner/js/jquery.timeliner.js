/*
 * Title: Timeliner (jQuery plugin)
 * Author: Berend de Jong, Frique
 * Author URI: http://www.frique.me/
 * Version: 1.2 (20110725.1)
 */

(function($){
	jQuery.fn.timeliner = function(options){

		// OPTION DEFAULTS
		var o = $.extend({
			// Container
			containerwidth:				800,		// Total width (value in pixels)
			containerheight:			400,		// Total height (value in pixels)
			showpauseplay:				true,		// Whether to show the pause/play button when hovering the presentation (true or false)
			showprevnext:				true,		// Whether to show the previous/next buttons when hovering the presentation (true or false)
			controls_always_visible:	false,		// Always keep the pause/play/previous/next buttons visible (true or false)
			// Timeline
			timelinewidth:				720,		// Width of the timeline/progress bar (value in pixels)
			timelineheight:				8,			// Height of the timeline/progress bar (value in pixels)
			timelinehorizontalmargin:	'auto',		// Timeline left and right margin ('auto' (center) or number value in pixels)
			timelineverticalmargin:		30,			// Timeline top and bottom margin (number value in pixels)
			timelineposition:			'bottom',	// Position the timeline at the top or bottom of the slide ('top' or 'bottom')
			// Time display
			showtimedisplay:			true,		// Whether to show the time display or not (true or false)
			timedisplayposition:		'above',	// Position the time display above or below the progress bar ('above' or 'below')
			showtotaltime:				false,		// Whether to add the total presentation time after the current playing time (true or false)
			// Node tooltip
			showtooltip:				true,		// Whether to show the slide title in a tooltip when hovering a node (true or false)
			showtooltiptime:			false,		// Whether to show the slide start time in a tooltip when hovering a node (true or false)
			tooltipposition:			'above',	// Position the tooltip above or below the progress bar ('above' or 'below')
			// Playback
			interval:					10,			// Time between slides in seconds, except when individually specified in the HTML
			repeat:						true,		// Whether to restart the presentation after completing (true or false)
			autoplay:					true,		// Whether to start the presentation as soon as it loads (true or false)
			keyboard:					true,		// Whether to use keyboard functionality (true or false)
			transition:					'slide'		// Transition type between slides ('fade', 'instant', 'slide' or 'reveal')
		},options);

		$(this).each(function(){

// PRE-SETUP

			// Function to generate minutes:seconds format from seconds
			function getdisplaytime(secs){
				var mins = Math.floor(secs/60);
				secs = (secs-(mins*60));
				if(secs<10){ secs = '0'+secs; }
				return mins+':'+secs;
			}

// SETUP

			// DECLARE VARIABLES
			var timelinehorizontalmargin,
				prenodepos = [0],
				nodepos = [0,0], //= Start position of this node
				nodesec = [0,0], //= Start time(seconds) of this node
				nodeinterval = [0], //= duration of this node
				targetpos,
				x = 1,
				activenode = 1,
				seconds = 0,
				timeinterval,
				totaltime = 0,
				playing = false,
				started = false,
				timeremaining,
				animationtime,

			// CREATE / CACHE ELEMENTS
				$container = $(this).show(),
				$slides = $container.find('> li'),
				$timeline = $('<li class="timeline"></li>').prependTo($container),
				$innertimeline = $('<div class="innertimeline">&nbsp;</div>').prependTo($timeline),
				nodes = $slides.length;
			if(o.showtimedisplay){
				var $time = $('<div class="timedisplay">0:00</div>').prependTo($timeline);
				if(o.showtotaltime){
					$time.append(' / 0:00');
				}
				var halftimewidth = Math.round($time.outerWidth(true)/2);
			}
			if(o.showpauseplay){
				var $pauseplay = $('<li class="play"></li>').prependTo($container).animate({ opacity:0 },0);
				if(o.showprevnext){
					var $prev = $('<li class="previous"></li>').prependTo($container).animate({ opacity:0 },0);
					var $next = $('<li class="next"></li>').prependTo($container).animate({ opacity:0 },0);
				}
			}

			// SLIDES
			$slides.each(function(){
				var $this = $(this);
				$this
					.addClass('slide')
					.addClass('slide'+x)
					.data('title',$this.attr('title'))
					.removeAttr('title')
					.animate({ opacity:0 },0);

				// Associated node data
				if(x<nodes || o.repeat){
					if( $this.attr('lang') ){
						nodeinterval[x] = parseInt( $this.attr('lang'),10 );
					}
					else{
						nodeinterval[x] = o.interval;
					}
					totaltime = +totaltime+nodeinterval[x];
				}else{
					nodeinterval[x] = 0;
				}
				nodesec[x] = +nodesec[(x-1)] + nodeinterval[(x-1)];
				x++;
			});
			x=1;

			// TIMELINE
			if(o.timelinehorizontalmargin=='auto'){
				timelinehorizontalmargin = (o.containerwidth - o.timelinewidth)/2;
			}else{
				timelinehorizontalmargin = o.timelinehorizontalmargin;
			}

			// Generate displayable total time
			var totaltimedisplay = getdisplaytime(totaltime);

			// NODE ELEMENTS
			for(x=1; x<(nodes+1); x++){
				$('<div class="node node'+x+'"></div>').appendTo($timeline).data('id',x);
			}
			var $nodes = $timeline.find('.node');
			x=1;

			// Get node css
			var nodewidth = $nodes.outerWidth(true),
				nodeheight = $nodes.outerHeight(true),
				halfnodewidth = Math.round(nodewidth/2);

			$nodes.each(function(){
				var $this = $(this);
				// Set node position
				prenodepos[x] = ((nodeinterval[(x-1)]/totaltime)*100).toFixed(4);
				nodepos[x] = +nodepos[(x-1)]+Math.round(o.timelinewidth*(prenodepos[x]/100));

				$this.css({ left:(nodepos[x]-halfnodewidth), top:-(Math.round(nodeheight/2)-Math.round(o.timelineheight/2)) });
				// Add tooltip
				if(o.showtooltip){
					var title = $container.find('.slide'+x).data('title');
					if(title){
						$this.prepend('<div class="tooltip">'+title+'</div>');
					}
				}
				if(o.showtooltiptime){
					$this.find('.tooltip').prepend('<label class="tooltiptime">'+getdisplaytime(nodesec[x])+'</label><br>');
				}
				x++;
			});
			if(o.showtooltip){
				var $tooltips = $container.find('.tooltip');
			}

			// APPLY SETTINGS
			$container.css({ width:o.containerwidth, height:o.containerheight });
			if(o.transition=='slide' || o.transition=='reveal' || o.transition=='cover'){
				$container.css({ overflow:'hidden' });
			}
			$slides.css({ width:o.containerwidth, height:o.containerheight });
			$timeline.css({ width:o.timelinewidth, height:o.timelineheight, margin:timelinehorizontalmargin, marginTop:o.timelineverticalmargin, marginBottom:o.timelineverticalmargin }).css(o.timelineposition,0);
			$innertimeline.css({ height:o.timelineheight });
			if(o.showtimedisplay && o.timedisplayposition=='below'){
				$time.css({ top:(o.timelineheight+5), left:-halftimewidth });
			}else if(o.showtimedisplay){
				$time.css({ bottom:(o.timelineheight+5), left:-halftimewidth });
			}
			if(o.showtooltip){
				if(o.tooltipposition=='below'){
					$tooltips.css({ top:nodeheight+5 });
				}else{
					$tooltips.css({ bottom:nodeheight+5 });
				}
				$tooltips.each(function(){
					var $this = $(this);
					$this.css({ left:-(Math.round($this.outerWidth(true)/2)-halfnodewidth) });
				});
			}
			if(o.showpauseplay){
				$pauseplay.css({ top:(Math.round(o.containerheight/2)-Math.round($pauseplay.outerHeight(true)/2)), left:(Math.round(o.containerwidth/2)-Math.round($pauseplay.outerWidth(true)/2)) });
				if(o.showprevnext){
					$prev.css({ top:(Math.round(o.containerheight/2)-Math.round($prev.outerHeight(true)/2)), right:(Math.round(o.containerwidth/2)+Math.round($pauseplay.outerWidth(true)/2)) });
					$next.css({ top:(Math.round(o.containerheight/2)-Math.round($next.outerHeight(true)/2)), left:(Math.round(o.containerwidth/2)+Math.round($pauseplay.outerWidth(true)/2)) });
				}
			}
			
			// Fix cross-browser padding
			$slides.each(function(){
				var $this = $(this);
				if( $this.outerWidth() > o.containerwidth ){
					$this.width( ($this.width()-parseInt($this.css('paddingLeft'),10)-parseInt($this.css('paddingRight'),10)) );
				}
				if( $this.outerHeight() > o.containerheight ){
					$this.height( ($this.height()-parseInt($this.css('paddingTop'),10)-parseInt($this.css('paddingBottom'),10)) );
				}
			});

// FUNCTIONS

			// Fill the time display
			function dtime(secs){
				$time.html(getdisplaytime(secs));
				if(o.showtotaltime){
					$time.append(' / '+totaltimedisplay);
				}
			}

			// Start the time display clock
			function time_start(secs){
				dtime(secs);
				timeinterval = setInterval(function(){
					seconds++;
					dtime(seconds);
				},1000);
			}

			// Stop the time display clock
			function time_stop(){
				clearInterval(timeinterval);
			}

			// Stop everything
			function stop(){
				$innertimeline.stop();
				if(o.showtimedisplay){
					time_stop();
					$time.stop();
				}
				playing = false;
				if(o.showpauseplay){
					$pauseplay.attr('class','play');
				}
			}

			// Start playing from the beginning of a slide or resume
			function start(startnode, resume_seconds){
				// Presentation start callback function
				if(startnode<2 && !resume_seconds && !started){
					the_start_callback();
				}
				// Start the timer
				if(!resume_seconds){
					seconds = nodesec[startnode];
				}
				if(o.showtimedisplay){
					time_start(seconds);
				}
				// Reset positions
				if(!resume_seconds){
					$innertimeline.css({ width:nodepos[startnode] });
					if(o.showtimedisplay){
						$time.css({ left:nodepos[startnode]-halftimewidth });
					}
				}
				// Calculate animation time
				if(resume_seconds){
					animationtime = (resume_seconds*1000);
				}else{
					animationtime = (nodeinterval[startnode]*1000);
				}
				// Animate time display
				if(startnode<nodes){
					targetpos = nodepos[(startnode+1)];
				}else{
					targetpos = o.timelinewidth;
				}
				if(o.showtimedisplay){
					$time.animate({
						left:(targetpos-halftimewidth)
					}, animationtime, 'linear');
				}
				// Animate timeline bar
				$innertimeline.animate({
					width:targetpos
				}, animationtime, 'linear', function(){
					// Slide end callback
					if(o.showtimedisplay){
						time_stop();
					}
					if(startnode<nodes){
						start((startnode+1));
					}else{
						// Presentation end callback function
						the_end_callback();
						started = false;
						// Repeat presentation
						if(o.repeat){
							start(1);
						}
					}
				});
				// Slide transition
				if(startnode != activenode){
					$container.find('.slide:not(.slide'+startnode+'):not(.slide'+activenode+')').stop().animate({ opacity:0 },0).css({ 'z-index':0 });
					if(o.transition=='fade'){
						$container.find('.slide'+activenode)
							.stop()
							.animate({ opacity:0 },300,function(){
								$(this).css({ 'z-index':0 });
							});
						$container.find('.slide'+startnode)
							.stop()
							.animate({ opacity:1 },300,function(){
								$(this).css({ 'z-index':1 });
							});
					}
					if(o.transition=='slide' || o.transition=='reveal'){
						$container.find('.slide'+activenode)
							.css({ 'z-index':1 })
							.stop(true,true)
							.animate({ left:-o.containerwidth },600,function(){
								$(this)
									.css({ 'z-index':0, left:0 })
									.animate({ opacity:0 },0);
							});
					}
					if(o.transition=='reveal'){
						$container.find('.slide'+startnode)
							.css({ 'z-index':0 })
							.stop(true,true)
							.animate({ opacity:1 },0);
					}
					if(o.transition=='slide'){
						$container.find('.slide'+startnode)
							.css({ 'z-index':1, left:o.containerwidth })
							.stop(true,true)
							.animate({ opacity:1 },0)
							.animate({ left:0 },600);
					}
					if(o.transition=='instant'){
						$container.find('.slide'+activenode).animate({ opacity:0 },0);
						$container.find('.slide'+startnode).animate({ opacity:1 },0);
					}
				}
				// Activate node
				$container.find('.node'+activenode).removeClass('node_active');
				$container.find('.node'+startnode).addClass('node_active');

				activenode = startnode;
				playing = true;
				if(o.showpauseplay){
					$pauseplay.attr('class','pause');
				}
				// Pause if this is the last node and repeat is off
				if(o.showpauseplay && (startnode==nodes && !o.repeat)){
					stop();
				}
				// New slide callback function
				if(!resume_seconds && started){
					the_newslide_callback();
				}
				if(!started){
					started = true;
				}
			}

// PUBLIC FUNCTIONS

			// Pause/play toggle
			$.fn.timeliner.pauseplay = function(){
				$pauseplay.click();
			};
			// Play
			$.fn.timeliner.play = function(){
				if(!playing){
					$pauseplay.click();
				}
			};
			// Pause
			$.fn.timeliner.pause = function(){
				if(playing){
					$pauseplay.click();
				}
			};
			// Next slide
			$.fn.timeliner.next = function(){
				$next.click();
			};
			// Previous slide
			$.fn.timeliner.prev = function(){
				$prev.click();
			};

// CALLBACK FUNCTIONS

			// When presentation begins
			function the_start_callback(){
				if(typeof start_callback == 'function'){
					var id = $container.attr('id');
					if(id==undefined || !id){
						id = '[no id]';
					}
					start_callback(id);
				}
			};

			// When a new slide starts
			function the_newslide_callback(){
				if(typeof newslide_callback == 'function'){
					var id = $container.attr('id');
					if(id==undefined || !id){
						id = '[no id]';
					}
					newslide_callback(id, activenode);
				}
			};

			// When presentation ends
			function the_end_callback(){
				if(typeof end_callback == 'function'){
					var id = $container.attr('id');
					if(id==undefined || !id){
						id = '[no id]';
					}
					end_callback(id);
				}
			};

			// When paused
			function the_paused_callback(){
				if(typeof paused_callback == 'function'){
					var id = $container.attr('id');
					if(id==undefined || !id){
						id = '[no id]';
					}
					paused_callback(id, activenode);
				}
			};

			// When resumed
			function the_resumed_callback(){
				if(typeof resumed_callback == 'function'){
					var id = $container.attr('id');
					if(id==undefined || !id){
						id = '[no id]';
					}
					resumed_callback(id, activenode);
				}
			};

			// When a slide is clicked
			function the_click_callback(){
				if(typeof click_callback == 'function'){
					var id = $container.attr('id');
					if(id==undefined || !id){
						id = '[no id]';
					}
					click_callback(id, activenode);
				}
			};

// ACTIONS

			// Nodes behaviour
			$nodes
				.click(function(){
					stop();
					start( $(this).data('id') );
					if(!o.autoplay){
						$pauseplay.click();
					}
				})
				.hover(function(){
					if(o.showtooltip){
						$(this).find('.tooltip').show();
					}
				},function(){
					if(o.showtooltip){
						$(this).find('.tooltip').hide();
					}
				});

			// Pause/play button behaviour
			if(o.showpauseplay){
				if(o.controls_always_visible){
					$pauseplay.stop().animate({ opacity:0.5 },300);
					if(o.showprevnext){
						$prev.stop().animate({ opacity:0.5 },300);
						$next.stop().animate({ opacity:0.5 },300);
					}
				}else{
					$container.hover(function(){
						$pauseplay.stop().animate({ opacity:0.5 },300);
						if(o.showprevnext){
							$prev.stop().animate({ opacity:0.5 },300);
							$next.stop().animate({ opacity:0.5 },300);
						}
					},function(){
						$pauseplay.stop().animate({ opacity:0 },200);
						if(o.showprevnext){
							$prev.stop().animate({ opacity:0 },200);
							$next.stop().animate({ opacity:0 },200);
						}
					});
				}

				$pauseplay
					.click(function(){
						if(playing){
							// Pause
							stop();
							timeremaining = (nodeinterval[activenode]-seconds+nodesec[activenode]);
							the_paused_callback();
						}else{
							// Resume
							if(activenode==nodes && !o.repeat){
								start(1);
							}else{
								start(activenode,timeremaining);
							}
							the_resumed_callback();
						}
					})
					.hover(function(){
						$(this).stop().animate({ opacity:0.9 },200);
					},function(){
						$(this).stop().animate({ opacity:0.5 },400);
					});
				if(o.showprevnext){
					// Previous button
					$prev
						.click(function(){
							if(activenode==1){
								$container.find('.node'+nodes).click();
							}else{
								$container.find('.node'+(activenode-1)).click();
							}
						})
						.hover(function(){
							$(this).stop().animate({ opacity:0.9 },200);
						},function(){
							$(this).stop().animate({ opacity:0.5 },400);
						});
					// Next button
					$next
						.click(function(){
							if(activenode==nodes){
								$container.find('.node1').click();
							}else{
								$container.find('.node'+(activenode+1)).click();
							}
						})
						.hover(function(){
							$(this).stop().animate({ opacity:0.9 },200);
						},function(){
							$(this).stop().animate({ opacity:0.5 },400);
						});
				}
			}

			// Timeline clicking behaviour
			$timeline.click(function(e){
				var clickx = ((e.pageX-$(this).offset().left)+halfnodewidth);
				var target;
				x=1;
				for (x in nodepos){
					if(x>0 && x<nodes){
						if((nodepos[x] < clickx) && (nodepos[(+x+1)] > clickx)){
							target = x;
						}
					}
				}
				if(clickx > nodepos[nodes]){
					target = nodes;
				}
				if(clickx < 0){
					target = 1;
				}
				if(target!=activenode){
					$timeline.find('.node'+target).click();
				}
			});

			$slides.click(function(){
				the_click_callback();
			});

			// Keystrokes
			if(o.keyboard){
				$(document).keydown(function(e){
					// Space key = pause/play
					if( e.keyCode==32 ){ e.preventDefault(); $pauseplay.click(); }
				});
			}

			// Initiate first play
			$container.find('.slide1').animate({ opacity:1 }, 0).css({ 'z-index':1 });
			if(o.autoplay){
				start(1);
			}

		});
	};
})(jQuery);