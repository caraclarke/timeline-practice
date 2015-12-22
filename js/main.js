$(document).ready(function(){
$('#example1').timeliner({
      containerwidth: 940,
      containerheight: 530,
      showpauseplay: true,
      timelinewidth: 600,
      timelineheight: 8,
      timelinehorizontalmargin: 'auto',
      timelineverticalmargin: 30,
      timelineposition: 'bottom',
      showtimedisplay: false,
      timedisplayposition: 'above',
      showtotaltime: false,
      showtooltip: true,
      showtooltiptime: false,
      tooltipposition: 'above',
      interval: 10,
      repeat: true,
      autoplay: false,
      keyboard: true,
      transition: 'slide'
    });
});