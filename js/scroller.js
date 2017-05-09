
/**
 * scroller - handles the details
 * of figuring out which section
 * the user is currently scrolled
 * to.
 *
 */
function scroller() {

  var container = d3.select('body');
  // event dispatcher
  var dispatch = d3.dispatch('active','resized');

  // d3 selection of all the
  // text sections that will
  // be scrolled through
  var sections = null;

  // array that will hold the
  // y coordinate of each section
  // that is scrolled through
  var sectionPositions = [];
  var currentIndex = -1;
  // y coordinate of
  var containerStart = 0;


  function visPosition(){
    d3.select("#vis")
    .style("left", function(){
      if(IS_PHONE()){
        return ( (window.innerWidth - PHONE_VIS_WIDTH - margin.left - margin.right)*.5 ) + "px"
      }
      if(IS_MOBILE()){
        return ( (window.innerWidth - VIS_WIDTH - margin.left - margin.right)*.5 ) + "px"
      }else{
        return "inherit"
      }
    })
    .style("top", function(){
      if(IS_PHONE()){
        return ( (window.innerHeight - PHONE_VIS_HEIGHT - margin.top - margin.bottom)*.5 ) + "px"
      }
      if(IS_MOBILE()){
        return ( (window.innerHeight - VIS_HEIGHT - margin.top - margin.bottom)*.5 ) + "px"
      }else{
        if(d3.select(this).classed("posFixed")){
          return "20px"  
        }else{
          if(d3.select(this).classed("posRel")){
            return "30px"  
          }else{
            return "730px"  
          }
        }
      }
    })
  }
  /**
   * scroll - constructor function.
   * Sets up scroller to monitor
   * scrolling of els selection.
   *
   * @param els - d3 selection of
   *  elements that will be scrolled
   *  through by user.
   */
  function scroll(els) {
    sections = els;

    // when window is scrolled call
    // position. When it is resized
    // call resize.
    d3.select(window)
      .on('scroll.scroller', position)
      .on('resize.scroller', resize);

    // manually call resize
    // initially to setup
    // scroller.
    resize();

    // hack to get position
    // to be called once for
    // the scroll position on
    // load.
    // @v4 timer no longer stops if you
    // return true at the end of the callback
    // function - so here we stop it explicitly.
    var timer = d3.timer(function () {
      position();
      timer.stop();
    });
  }

  /**
   * resize - called initially and
   * also when page is resized.
   * Resets the sectionPositions
   *
   */
  function resize() {
    // sectionPositions will be each sections
    // starting position relative to the top
    // of the first section.
    visPosition()
    sectionPositions = [];
    var startPos;
    sections.each(function (d, i) {
      var top = this.getBoundingClientRect().top;
      if (i === 0) {
        startPos = top;
      }
      sectionPositions.push(top - startPos);
    });
    containerStart = container.node().getBoundingClientRect().top + window.pageYOffset;
    dispatch.call('resized', this);
  }


  function fixVis(){
    if(d3.select(".step").node().getBoundingClientRect().top <= 0){
      if(d3.selectAll(".step").nodes()[d3.selectAll(".step").nodes().length-1].getBoundingClientRect().bottom <= VIS_WIDTH+margin.top+margin.bottom+20+50){
        d3.select("#vis").classed("posRel", true)
        d3.select("#vis").classed("posFixed", false)  
      }else{
        d3.select("#vis").classed("posRel", false)
        d3.select("#vis").classed("posFixed", true)  
      }
    }else{
      d3.select("#vis").classed("posRel", false)
      d3.select("#vis").classed("posFixed", false)
    }    
  }
  window.setInterval(function(){
    fixVis()
    visPosition()
  }, 200);
  /**
   * position - get current users position.
   * if user has scrolled to new section,
   * dispatch active event with new section
   * index.
   *
   */
  function position() {
    visPosition()
    var pos = window.pageYOffset - 100 - containerStart ;
    fixVis();
    var sectionIndex = d3.bisect(sectionPositions, pos) - 1;
    sectionIndex = Math.max(0,Math.min(sections.size() -1, sectionIndex));

    if (currentIndex !== sectionIndex) {
      // @v4 you now `.call` the dispatch callback
      dispatch.call('active', this, sectionIndex);
      currentIndex = sectionIndex;
      d3.select("#sectionIndex").attr("data-index",currentIndex)
    }

    var prevIndex = Math.max(sectionIndex - 1, 0);
    var prevTop = sectionPositions[prevIndex];
    // @v4 you now `.call` the dispatch callback
  }

  /**
   * container - get/set the parent element
   * of the sections. Useful for if the
   * scrolling doesn't start at the very top
   * of the page.
   *
   * @param value - the new container value
   */
  scroll.container = function (value) {
    if (arguments.length === 0) {
      return container;
    }
    container = value;
    return scroll;
  };

  // @v4 There is now no d3.rebind, so this implements
  // a .on method to pass in a callback to the dispatcher.
  scroll.on = function (action, callback) {
    dispatch.on(action, callback);
  };

  return scroll;
}
