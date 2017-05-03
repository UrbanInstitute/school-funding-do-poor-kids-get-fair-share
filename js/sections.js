/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function () {
  // constants to define the size
  // and margins of the vis area.
  var width = IS_PHONE() ? PHONE_VIS_WIDTH : VIS_WIDTH;
  var height = IS_PHONE() ? PHONE_VIS_HEIGHT : VIS_HEIGHT;
  

  // Keep track of which visualization
  // we are on and which was the last
  // index activated. When user scrolls
  // quickly, we want to call all the
  // activate functions that they pass.
  var lastIndex = -1;
  var activeIndex = 0;

  // Sizing for the grid visualization
  var squareSize = 6;
  var squarePad = 2;
  var numPerRow = width / (squareSize + squarePad);

  // main svg used for visualization
  var svg = null;

  // d3 selection that will be used
  // for displaying visualizations
  var g = null;

  var dotChartY = d3.scaleBand()
            .range([0, height])
            .padding(0.95);
  var dotChartX = d3.scaleLinear()
            .range([width, 0]);



  // When scrolling to a new section
  // the activation function for that
  // section is called.
  var activateFunctions = [];
  // If a section has an update function
  // then it is called while scrolling
  // through the section with the current
  // progress through the section.
  var updateFunctions = [];

  /**
   * chart
   *
   * @param selection - the current d3 selection(s)
   *  to draw the visualization in. For this
   *  example, we will be drawing it in #vis
   */
  var chart = function (selection) {
    selection.each(function (rawData) {
      // create svg and give it a width and height
      svg = d3.select(this).selectAll('svg').data([dotChartData]);
      var svgE = svg.enter().append('svg');
      // @v4 use merge to combine enter and existing selection
      svg = svg.merge(svgE);

      svg.attr('width', width + margin.left + margin.right);
      svg.attr('height', height + margin.top + margin.bottom);

      svg.append('g');


      // this group element will be used to contain all
      // other elements.
      g = svg.select('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // perform some preprocessing on raw data
      var dotChartData = getDotChartData(rawData);

      dotChartData.sort(function(a, b){ return b.localRevenue - a.localRevenue})
  
      dotChartY.domain(dotChartData.map(function(d) { return d.state; }));
      dotChartX.domain([6000,-6000]);


      setupVis(dotChartData);

      setupSections(dotChartData);
    });
  };


  var getDotChartLineX1 = function(val){
    if(val < 0){ return dotChartX(val)}
    else{ return dotChartX(0)}
  }
  var getDotChartLineX2 = function(val){
    if(val > 0){ return dotChartX(val)}
    else{ return dotChartX(0)}
  }


  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   *
   * @param wordData - data object for each word.
   * @param fillerCounts - nested data that includes
   *  element for each filler word type.
   * @param histData - binned histogram data
   */
  var setupVis = function (dotChartData) {

  var stateG = g.selectAll(".stateG")
      .data(dotChartData)
      .enter().append("g")
      .attr("class", function(d){ return "stateG " + d.state })
      .attr("transform",function(d){ return "translate(0," + dotChartY(d.state) + ")" })

  stateG
      // .data(dotChartData)
    .append("line")
      .attr("class", "localLine dotChartLine")
      // .attr("y1", function(d) { return dotChartY(d.state); })
      // .attr("y2", function(d) { return dotChartY(d.state); })
      .attr("x1", function(d) { return getDotChartLineX1(d.localRevenue); })
      .attr("x2", function(d) { return getDotChartLineX2(d.localRevenue); })
  g.append("line")
    .attr("class", "zeroLine")
    .attr("y1", 0)  
    .attr("y2", height)
    .attr("x1", dotChartX(0))
    .attr("x2", dotChartX(0))
  stateG.append("line")
      .attr("class", "stateLine dotChartLine")
      .attr("x1", function(d) { return dotChartX(0) })
      .attr("x2", function(d) { return dotChartX(0) })
      .style("opacity",0)

  stateG.append("line")
      .attr("class", "federalLine dotChartLine")
      .attr("x1", function(d) { return dotChartX(0) })
      .attr("x2", function(d) { return dotChartX(0) })
      .style("opacity",0)


  stateG.append("circle")
      .attr("class", "localDot dotChartDot")
      .attr("cx", function(d) { return dotChartX(d.localRevenue); })
      .attr("r", DOT_RADIUS)

  stateG.append("circle")
      .attr("class", "stateDot dotChartDot")
      .attr("cx", function(d) { return dotChartX(0) })
      .attr("r", DOT_RADIUS)
      .style("opacity",0)

  stateG.append("circle")
      .attr("class", "federalDot dotChartDot")
      // .attr("cy", function(d) { return dotChartY(d.state); })
      .attr("cx", function(d) { return dotChartX(0) })
      .attr("r", DOT_RADIUS)
      .style("opacity",0)


  stateG.append("circle")
      .attr("class", "totalDot dotChartDot")
      // .attr("cy", function(d) { return dotChartY(d.state); })
      .attr("cx", function(d) { return dotChartX(d.localRevenue); })
      .attr("r", SMALL_DOT_RADIUS)


  // add the x Axis
  g.append("g")
      .attr("id", "dotChartXAxis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(dotChartX).tickFormat(d3.format("$,")));

  // add the y Axis
  g.append("g")
    .attr("id", "dotChartYAxis")
    // .attr("transform", "translate(" + width + ",0)")
    .call(d3.axisLeft(dotChartY).tickFormat(function(t){return fullNames[t]}));


  };

  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  var setupSections = function (dotChartData) {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = function(){ localDots(dotChartData) };
    activateFunctions[1] = function(){ stateDots(dotChartData) };
    activateFunctions[2] = function(){ federalDots(dotChartData) };
    activateFunctions[3] = function(){ floridaTracts(dotChartData) };
    // activateFunctions[4] = showBar;
    // activateFunctions[5] = showHistPart;
    // activateFunctions[6] = showHistAll;
    // activateFunctions[7] = showCough;
    // activateFunctions[8] = showHistAll;

    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    for (var i = 0; i < 10; i++) {
      updateFunctions[i] = function () {};
    }
    };

  /**
   * ACTIVATE FUNCTIONS
   *
   * These will be called their
   * section is scrolled to.
   *
   * General pattern is to ensure
   * all content for the current section
   * is transitioned in, while hiding
   * the content for the previous section
   * as well as the next section (as the
   * user may be scrolling up or down).
   *
   */

  /**
   * showTitle - initial title
   *
   * hides: count title
   * (no previous step to hide)
   * shows: intro title
   *
   */
  function localDots(dotChartData) {
    dotChartData.sort(function(a, b){ return (b.localRevenue) - (a.localRevenue)})
    dotChartY.domain(dotChartData.map(function(d) { return d.state; }));

    g.selectAll(".stateDot")
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.stateRevenue/6000) })
        .attr("cx", function(d) { return dotChartX(0); })
        .style("opacity",0)
        .attr("r", DOT_RADIUS)
        .transition()
        .duration(100)
        .style("opacity",0)
        .on("end", function(d, i){
          if(d.state == "NJ"){
            d3.selectAll(".stateG")
              .transition()
              .duration(1000)
              .attr("transform",function(d){ return "translate(0," + dotChartY(d.state) + ")" })
            g.select("#dotChartYAxis")
              .transition()
              .duration(1000)
              .call(d3.axisLeft(dotChartY).tickFormat(function(t){return fullNames[t]}));
          }

        })

    g.selectAll(".stateLine")
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.stateRevenue/6000) })
        .attr("x1", function(d) { return getDotChartLineX1(0); })
        .attr("x2", function(d) { return getDotChartLineX2(0); })
        .transition()
        .duration(100)
        .style("opacity",0)


    g.selectAll(".totalDot")
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.stateRevenue/6000) })
        .attr("cx", function(d) { return dotChartX(d.localRevenue); })
        .attr("r", SMALL_DOT_RADIUS)
        .style("opacity",1)
  }

  function stateDots(dotChartData){

    dotChartData.sort(function(a, b){ return (b.localRevenue + b.stateRevenue) - (a.localRevenue + a.stateRevenue)})
    dotChartY.domain(dotChartData.map(function(d) { return d.state; }));

    var direction = (d3.select(".federalDot").style("opacity") == 0) ? "down" : "up"

    g.selectAll(".stateDot")
        .transition()
        .style("opacity",1)
        .attr("r", DOT_RADIUS)
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.stateRevenue/6000) })
        .attr("cx", function(d) { return dotChartX(d.stateRevenue); })
        .on("end", function(d, i){
          if(d.state == "NJ"){
            d3.selectAll(".stateG")
              .transition()
              .duration(1000)
              .attr("transform",function(d){ return "translate(0," + dotChartY(d.state) + ")" })
            g.select("#dotChartYAxis")
              .transition()
              .duration(1000)
              .call(d3.axisLeft(dotChartY).tickFormat(function(t){return fullNames[t]}));
          }

        })


    d3.selectAll(".federalLine")
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.federalRevenue/6000) })
        .attr("x1", function(d) { return getDotChartLineX1(0); })
        .attr("x2", function(d) { return getDotChartLineX2(0); })
        .transition()
        .duration(100)
        .style("opacity",0)

    d3.selectAll(".federalDot")
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.federalRevenue/6000) })
        .attr("cx", function(d) { return dotChartX(0); })
        .transition()
        .attr("r", DOT_RADIUS)
        .duration(100)
        .style("opacity",0)

    g.selectAll(".stateLine")
        .transition()
        .style("opacity",1)
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.stateRevenue/6000) })
        .attr("x1", function(d) { return getDotChartLineX1(d.stateRevenue); })
        .attr("x2", function(d) { return getDotChartLineX2(d.stateRevenue); })


    var directionDuration = (direction == "down") ? "stateRevenue" : "federalRevenue"
    g.selectAll(".totalDot")
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d[directionDuration]/6000) })
        .attr("cx", function(d) { return dotChartX(d.stateRevenue + d.localRevenue); })
        .attr("r", SMALL_DOT_RADIUS)
        .style("opacity",1)


  }

  function federalDots(dotChartData){

    dotChartData.sort(function(a, b){ return (b.localRevenue + b.stateRevenue + b.federalRevenue) - (a.localRevenue + a.stateRevenue + a.federalRevenue)})
    dotChartY.domain(dotChartData.map(function(d) { console.log(d.state); return d.state; }));
    g.selectAll(".federalDot")
        .transition()
        .style("opacity",1)
        .attr("r",DOT_RADIUS)
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.federalRevenue/6000) })
        .attr("cx", function(d) { return dotChartX(d.federalRevenue); })
        .on("end", function(d, i){
          if(d.state == "AK"){
            d3.selectAll(".stateG")
              .transition()
              .duration(1000)
              .attr("transform",function(d){ return "translate(0," + dotChartY(d.state) + ")" })
            g.select("#dotChartYAxis")
              .transition()
              .duration(1000)
              .call(d3.axisLeft(dotChartY).tickFormat(function(t){return fullNames[t]}));
          }

        })


    g.selectAll(".federalLine")
        .transition()
        .style("opacity",1)
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.federalRevenue/6000) })
        .attr("x1", function(d) { return getDotChartLineX1(d.federalRevenue); })
        .attr("x2", function(d) { return getDotChartLineX2(d.federalRevenue); })


    g.selectAll(".totalDot")
        .transition()
        .style("opacity",1)
        .attr("r",SMALL_DOT_RADIUS)
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.federalRevenue/6000) })
        .attr("cx", function(d) { return dotChartX(d.stateRevenue + d.localRevenue + d.federalRevenue); })

    g.selectAll(".stateLine")
        .transition()
        .style("opacity",1)
        .attr("x1", function(d) { return getDotChartLineX1(d.stateRevenue); })
        .attr("x2", function(d) { return getDotChartLineX2(d.stateRevenue); })
    g.selectAll(".localLine")
        .transition()
        .style("opacity",1)
        .attr("x1", function(d) { return getDotChartLineX1(d.localRevenue); })
        .attr("x2", function(d) { return getDotChartLineX2(d.localRevenue); })
    g.selectAll(".stateDot")
        .transition()
        .style("opacity",1)
        .attr("r",DOT_RADIUS)
        .attr("cx", function(d) { return dotChartX(d.stateRevenue); })
    g.selectAll(".localDot")
        .transition()
        .style("opacity",1)
        .attr("r",DOT_RADIUS)
        .attr("cx", function(d) { return dotChartX(d.localRevenue); })


    // d3.selectAll(".stateG:not(.FL) .dotChartDot")
    //   .transition()
    //   .attr("cx", dotChartX(0))
    //   .transition()
    //   .style("opacity",0)
    // d3.selectAll(".stateG:not(.FL) .dotChartLine")
    //   .transition()
    //   .attr("x1", dotChartX(0))
    //   .attr("x2", dotChartX(0))
    //   .transition()
    //   .style("opacity",0)

    // d3.selectAll(".stateG.FL .dotChartDot")
    //   .transition()
    //   .delay(1500)
    //   .duration(1000)
    //   .attr("r",1000)
    //   .style("opacity",0)
    // d3.selectAll(".stateG.FL .dotChartLine")
    //   .transition()
    //   .delay(1500)
    //   .style("opacity",0)
    d3.selectAll("#dotChartYAxis .tick text")
      .transition()
      .style("opacity",1)
    d3.select(".zeroLine")
      .transition()
      .style("opacity",1)
    d3.select("#dotChartXAxis")
      .transition()
      .style("opacity",1)

  }

  function floridaTracts(){
    d3.selectAll(".stateG:not(.FL) .dotChartDot")
      .transition()
      .attr("cx", dotChartX(0))
      .transition()
      .style("opacity",0)
    d3.selectAll(".stateG:not(.FL) .dotChartLine")
      .transition()
      .attr("x1", dotChartX(0))
      .attr("x2", dotChartX(0))
      .transition()
      .style("opacity",0)
    d3.selectAll("#dotChartYAxis .tick text")
      .transition()
      .style("opacity", function(d){
        if(d == "FL"){ return 1; }
        else{ return 0; }
      })  
    d3.selectAll(".stateG.FL .dotChartDot")
      .transition()
      .delay(1500)
      .duration(1000)
      .attr("r",1000)
      .style("opacity",0)
    d3.selectAll(".stateG.FL .dotChartLine")
      .transition()
      .delay(1500)
      .style("opacity",0)
    d3.selectAll("#dotChartYAxis .tick text")
      .transition()
      .delay(1500)
      .style("opacity",0)
    d3.select(".zeroLine")
      .transition()
      .delay(1500)
      .style("opacity",0)
    d3.select("#dotChartXAxis")
      .transition()
      .delay(1500)
      .style("opacity",0)
    //draw map
  }

  /**
   * showFillerTitle - filler counts
   *
   * hides: intro title
   * hides: square grid
   * shows: filler count title
   *
   */

  /**
   * DATA FUNCTIONS
   *
   * Used to coerce the data into the
   * formats we need to visualize
   *
   */


  function getDotChartData(rawData) {
    return rawData.map(function (d, i) {
      d.state = d.stabbr;
      d.stateRevenue = +d.adjrevdiff_st
      d.localRevenue  = +d.adjrevdiff_lo
      d.federalRevenue = +d.adjrevdiff_fe

      return d;
    });
  }

  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function (index) {
    activeIndex = index;
    var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
    var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(function (i) {
      activateFunctions[i]();
    });
    lastIndex = activeIndex;
  };

  /**
   * update
   *
   * @param index
   * @param progress
   */
  chart.update = function (index, progress) {
    updateFunctions[index](progress);
  };

  // return chart function
  return chart;
};



/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(data) {
  // create a new plot and
  // display it
  var plot = scrollVis();
  d3.select('#vis')
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
          return "20px"
        }
      })
    .datum(data)
    .call(plot);

  // setup scroll functionality
  var scroll = scroller()
    .container(d3.select('#graphic'));

  // pass in .step selection as the steps
  scroll(d3.selectAll('.step'));

  // setup event handling
  scroll.on('active', function (index) {
    // highlight current step text
    d3.selectAll('.step')
      .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });
    // activate current section
    plot.activate(index);  
    
  });

  scroll.on('progress', function (index, progress) {
    plot.update(index, progress);
  });
}

// load data and display
d3.csv('data/data_ben_2014.csv', display);
