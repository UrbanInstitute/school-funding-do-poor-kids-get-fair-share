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

  var histG = null;

  var dotChartY = d3.scaleBand()
            .range([0, height])
            .padding(0.95);
  var dotChartX = d3.scaleLinear()
            .range([width, 0]);

  var scatterPlotY = d3.scaleLinear()
            .range([width, 0]);
  var scatterPlotX = d3.scaleLinear()
            .range([0, width]);

  var mapColor = d3.scaleThreshold()
      .domain([.1, .15, .2, .25, .3, .35, .4])
      .range(["#cfe8f3","#a2d4ec","#73bfe2","#46abdb","#1696d2","#12719e","#0a4c6a"]);

  var histX = d3.scaleLinear().rangeRound([0, histWidth + histMargin.right + histMargin.left]),
      histY = d3.scaleLinear().rangeRound([histHeight, 0]);

  // When scrolling to a new section
  // the activation function for that
  // section is called.
  var activateFunctions = [];


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

      histG = svg.append("g")
        .attr("transform", "translate(" + histMargin.left + "," + (height -histHeight) + ")")
        .style("opacity",0);

      // perform some preprocessing on raw data
      var dotChartData = getDotChartData(rawData[0]);
      dotChartData.sort(function(a, b){ return b.localRevenue - a.localRevenue})
      dotChartY.domain(dotChartData.map(function(d) { return d.state; }));
      dotChartX.domain([6000,-6000]);

      var scatterplotData = getScatterplotData(rawData[1])
      var histData = getHistData(rawData[2])
      scatterPlotY.domain([.8,1.2]);
      scatterPlotX.domain([.8,1.2]);

      histX.domain([0,100]);
      histY.domain([0, d3.max(histData, function(d) { return d.tractFlCount; })]);

      setupVis(dotChartData, scatterplotData, histData);

      setupSections(dotChartData, scatterplotData, histData);
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

  var getScatterValue  = function(d, year){
      var valueStr = "";
      if(d3.select(".stateButton").classed("active")){
        valueStr += "St"
      }
      if(d3.select(".localButton").classed("active")){
        valueStr += "Lo"
      }
      if(d3.select(".federalButton").classed("active")){
        valueStr += "Fe"
      }
      if(valueStr == ""){
        return 1
      }else{
        valueStr += year
        return d[valueStr];        
      }
  }
  var getScatterCat = function(){
      var valueStr = "";
      if(d3.select(".stateButton").classed("active")){
        valueStr += "St"
      }
      if(d3.select(".localButton").classed("active")){
        valueStr += "Lo"
      }
      if(d3.select(".federalButton").classed("active")){
        valueStr += "Fe"
      }
      return valueStr;
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
  var setupVis = function (dotChartData, scatterplotData, histData) {

    var stateG = g.selectAll(".stateG")
        .data(dotChartData)
        .enter().append("g")
        .attr("class", function(d){ return "stateG " + d.state })
        .attr("transform",function(d){ return "translate(0," + dotChartY(d.state) + ")" })

    stateG.append("rect")
      .attr("width",width+100)
      .attr("height",14)
      .attr("x",-100)
      .attr("y",-7)
      .attr("class", "dotHoverRect")
    stateG
      .append("line")
        .attr("class", "localLine dotChartLine")
        .attr("x1", function(d) { return getDotChartLineX1(d.localRevenue); })
        .attr("x2", function(d) { return getDotChartLineX2(d.localRevenue); })
    g.append("line")
      .attr("class", "zeroLine dotChartComponents")
      .attr("y1", 0)  
      .attr("y2", height)
      .attr("x1", dotChartX(0))
      .attr("x2", dotChartX(0))
    g.append("text")
      .attr("class", "largeChartLabel dotChartComponents")
      .attr("x",dotChartX(-4500))
      .attr("y", 200)
      .text("REGRESSIVE")
    g.append("text")
      .attr("class", "largeChartLabel dotChartComponents")
      .attr("x",dotChartX(2200))
      .attr("y", 200)
      .text("PROGRESSIVE")

    var legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform",function(d){ return "translate(150,10)" })


    legend.append("circle")
      .attr("class", "dotChartLegend legendLocalDot dotChartComponents")
      .attr("r", DOT_RADIUS)
      .attr("cx", 0)
      .attr("cy", 0)

    legend.append("text")
      .attr("class", "dotChartLegend legendLocalText dotChartComponents")
      .attr("x",10)
      .attr("y",4)
      .text("Local revenue")

    legend.append("circle")
      .attr("class", "dotChartLegend legendTotalDot dotChartComponents")
      .attr("r", SMALL_DOT_RADIUS)
      .attr("cx", 0)
      .attr("cy", 0)

    legend.append("text")
      .attr("class", "dotChartLegend legendTotalTextState dotChartComponents")
      .attr("x",10)
      .attr("y",4)
      .text("Local + state revenue")
      .style("opacity",0)
    legend.append("text")
      .attr("class", "dotChartLegend legendTotalTextFederal dotChartComponents")
      .attr("x",10)
      .attr("y",4)
      .text("Local + state + federal revenue")
      .style("opacity",0)

    legend.append("circle")
      .attr("class", "dotChartLegend legendStateDot dotChartComponents")
      .attr("r", DOT_RADIUS)
      .attr("cx", 260)
      .attr("cy", 0)
      .style("opacity",0)

    legend.append("text")
      .attr("class", "dotChartLegend legendStateText dotChartComponents")
      .attr("x",270)
      .attr("y",4)
      .text("State revenue")
      .style("opacity",0)

    legend.append("circle")
      .attr("class", "dotChartLegend legendFederalDot dotChartComponents")
      .attr("r", DOT_RADIUS)
      .attr("cx", 385)
      .attr("cy", 0)
      .style("opacity",0)

    legend.append("text")
      .attr("class", "dotChartLegend legendFederalText dotChartComponents")
      .attr("x",395)
      .attr("y",4)
      .text("Federal revenue")
      .style("opacity",0)



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
        .attr("cx", function(d) { return dotChartX(0) })
        .attr("r", DOT_RADIUS)
        .style("opacity",0)


    stateG.append("circle")
        .attr("class", "totalDot dotChartDot")
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
      .call(d3.axisLeft(dotChartY).tickFormat(function(t){return fullNames[t]}));




    // scatter plot
    g.append("g")
        .attr("id", "scatterPlotXAxis")
        .attr("transform", "translate(0," + (width)  + ")")
        .call(d3.axisBottom(scatterPlotX))
        .style("opacity",0)

    // add the y Axis
    g.append("g")
      .attr("id", "scatterPlotYAxis")
      .call(d3.axisLeft(scatterPlotY))
      .style("opacity",0)

    d3.selectAll("#scatterPlotYAxis .tick line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("class", function(d){
        if (d == 1){
          return "scatterAxis"
        }else{
          return "scatterGrid"
        }
      })
      .style("opacity",0)
    d3.selectAll("#scatterPlotXAxis .tick line")
      .attr("y2", scatterPlotY(scatterPlotY.domain()[1]))
      .attr("y1", -scatterPlotY(scatterPlotY.domain()[0]))
      .attr("class", function(d){
        if (d == 1){
          return "scatterAxis"
        }else{
          return "scatterGrid"
        }
      })
      .style("opacity",0)

    g.selectAll(".scatterDot")
        .data(scatterplotData)
        .enter().append("circle")
        .attr("class", function(d){ return "scatterDot " + d.state })
        .attr("cx", scatterPlotX(1) )
        .attr("cy", scatterPlotY(1) )
        .attr("r", DOT_RADIUS)
        .style("opacity",0)
    console.log(150, 450)
    g.append("text")
      .attr("class", "largeScatterplotLabel q1")
      .attr("x",335)
      .attr("y", 150)
      .text("STAYED PROGRESSIVE")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel q2a")
      .attr("x",35)
      .attr("y", 150)
      .text("BECAME")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel q2b")
      .attr("x",124)
      .attr("y", 150)
      .text("PROGRESSIVE")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel q3a")
      .attr("x",35)
      .attr("y", 450)
      .text("STAYED")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel q3b")
      .attr("x",118)
      .attr("y", 450)
      .text("REGRESSIVE")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel q4")
      .attr("x",335)
      .attr("y", 450)
      .text("BECAME REGRESSIVE")
      .style("opacity",0)


    function moveScatterLabels(cat){
      console.log(cat)
      if(cat == "StLo" || cat == "StLoFe" || cat == ""){
        d3.select(".largeScatterplotLabel.q1").transition().attr("x", 335).attr("y", 150).style("letter-spacing","4px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q2a").transition().attr("x", 35).attr("y", 150).style("letter-spacing","4px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q2b").transition().attr("x", 124).attr("y", 150).style("letter-spacing","4px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q3a").transition().attr("x", 35).attr("y", 450).style("letter-spacing","4px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q3b").transition().attr("x", 118).attr("y", 450).style("letter-spacing","4px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q4").transition().attr("x", 335).attr("y", 450).style("letter-spacing","4px").style("font-size","14px")
      }
      else if(cat == "Lo" || cat == "LoFe"){
        //.6 1.2
        d3.select(".largeScatterplotLabel.q1").transition().attr("x", 430).attr("y", 150).style("letter-spacing","1px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q2a").transition().attr("x", 35).attr("y", 150).style("letter-spacing","4px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q2b").transition().attr("x", 124).attr("y", 150).style("letter-spacing","4px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q3a").transition().attr("x", 35).attr("y", 450).style("letter-spacing","4px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q3b").transition().attr("x", 118).attr("y", 450).style("letter-spacing","4px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q4").transition().attr("x", 430).attr("y", 450).style("letter-spacing","1px").style("font-size","14px")
      }
      else if(cat == "St" || cat == "StFe"){
        //.8 1.8
        d3.select(".largeScatterplotLabel.q1").transition().attr("x", 335).attr("y", 150).style("letter-spacing","4px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q2a").transition().attr("x", 24).attr("y", 150).style("letter-spacing","1px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q2b").transition().attr("x", 6).attr("y", 170).style("letter-spacing","1px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q3a").transition().attr("x", 29).attr("y", 540).style("letter-spacing","1px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q3b").transition().attr("x", 11).attr("y", 560).style("letter-spacing","1px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q4").transition().attr("x", 335).attr("y", 540).style("letter-spacing","4px").style("font-size","14px")
      }
      else if(cat == "Fe"){
        //.8 2.3
        d3.select(".largeScatterplotLabel.q1").transition().attr("x", 335).attr("y", 150).style("letter-spacing","4px").style("font-size","14px")
        d3.select(".largeScatterplotLabel.q2a").transition().attr("x", 16).attr("y", 147).style("letter-spacing","1px").style("font-size","10px")
        d3.select(".largeScatterplotLabel.q2b").transition().attr("x", 2).attr("y", 162).style("letter-spacing","1px").style("font-size","10px")
        d3.select(".largeScatterplotLabel.q3a").transition().attr("x", 25).attr("y", 537).style("letter-spacing","1px").style("font-size","10px")
        d3.select(".largeScatterplotLabel.q3b").transition().attr("x", 7).attr("y", 552).style("letter-spacing","1px").style("font-size","10px")
        d3.select(".largeScatterplotLabel.q4").transition().attr("x", 335).attr("y", 540).style("letter-spacing","4px").style("font-size","14px")
      }
    }
    function updateScatter(button){
      svg._voronoi = null;

      var domains = {
        "St": [.8,1.8],
        "Lo": [.6,1.2],
        "Fe": [.8,2.3],
        "StLo": [.8,1.2],
        "StFe": [.8,1.8],
        "LoFe": [.6,1.2],
        "StLoFe": [.8,1.2],
        "": [.8,1.2]
      }
      var tickCounts = {
        "St": 21,
        "Lo": 12,
        "Fe": 31,
        "StLo": 8,
        "StFe": 21,
        "LoFe": 12,
        "StLoFe": 8,
        "": 8
      }
      var tf = d3.format(".2f")
      var tickFormats = {
        "St": tf,
        "Lo": tf,
        "Fe": function(d,i){ if (i%2 == 0){ return tf(d)} else{ return ""}},
        "StLo": tf,
        "StFe": tf,
        "LoFe": tf,
        "StLoFe": tf,
        "": tf,
      }
      if(d3.select(button).classed("active")){
        d3.select(button).classed("active", false)
      }else{
        d3.select(button).classed("active", true)
      }


      var cat = getScatterCat();
      scatterPlotY.domain(domains[cat])
      scatterPlotX.domain(domains[cat])

      moveScatterLabels(cat)

      d3.select("#scatterPlotYAxis")
        .transition()
        .call(d3.axisLeft(scatterPlotY).ticks(tickCounts[cat]).tickFormat(tickFormats[cat]))
      d3.select("#scatterPlotXAxis")
        .transition()
        .call(d3.axisBottom(scatterPlotX).ticks(tickCounts[cat]).tickFormat(tickFormats[cat]))

    d3.selectAll("#scatterPlotYAxis .tick line")
      .transition()
      .attr("x1", 0)
      .attr("x2", width)
      .attr("class", function(d){
        if (d == 1){
          return "scatterAxis"
        }else{
          return "scatterGrid"
        }
      })
    d3.selectAll("#scatterPlotXAxis .tick line")
      .transition()
      .attr("y2", 0)
      .attr("y1", -width)
      .attr("class", function(d){
        if (d == 1){
          return "scatterAxis"
        }else{
          return "scatterGrid"
        }
      })


      g.selectAll(".scatterDot")
        .transition()
        .duration(1000)
        // .ease(d3.easeElastic)
        .attr("cx", function(d){ return scatterPlotX(getScatterValue(d, "1995")) })
        .attr("cy", function(d){ return scatterPlotY(getScatterValue(d, "2014")) })
    }


    d3.select("#vis")
      .append("div")
      .attr("class", "scatterButton stateButton active")
      .text("State")
      .on("click", function(){ updateScatter(this)})
      .style("opacity",0)

    d3.select("#vis")
      .append("div")
      .attr("class", "scatterButton localButton active")
      .text("Local")
      .on("click", function(){ updateScatter(this)})
      .style("opacity",0)

    d3.select("#vis")
      .append("div")
      .attr("class", "scatterButton federalButton")
      .text("Federal")
      .on("click", function(){ updateScatter(this)})
      .style("opacity",0)



      //florida maps
  d3.select("#vis")
    .append("img")
    .attr("class","floridaTractsImg mapImg mapFL")
    .attr("src","images/fl_tract.png")
    .style("opacity",0)
  d3.select("#vis")
    .append("img")
    .attr("class","floridaDistrictsImg mapImg mapFL")
    .attr("src","images/fl_dist.png")
    .style("opacity",0)

  d3.select("#vis")
    .append("img")
    .attr("class","newYorkTractsImg mapImg mapNY")
    .attr("src","images/ny_tract.png")
    .style("opacity",0)
  d3.select("#vis")
    .append("img")
    .attr("class","newYorkDistrictsImg mapImg mapNY")
    .attr("src","images/ny_dist.png")
    .style("opacity",0)


    //histograms
  histG.append("g")
      .attr("id", "histXAxis")
      .attr("transform", "translate(0," + histHeight + ")")
      .call(d3.axisBottom(histX));

  histG.append("g")
      .attr("id", "histYAxis")
      .call(d3.axisLeft(histY).ticks(10, "s"))

  histG.append("text")
    .text("Frequency")
    .attr("x",-30)
    .attr("y",-9)
    .attr("class", "axisLabel")

  histG.append("text")
    .text("Percentage of families with children 5–17 in poverty")
    .attr("x",150)
    .attr("y",307)
    .attr("class", "axisLabel")

  histG.selectAll(".histBar")
    .data(histData)
    .enter().append("rect")
      .attr("class", "histBar")
      .attr("x", function(d) { return histX(d.bin + .2); })
      .attr("y", function(d) { return histY(d.tractFlCount); })
      .attr("width", histX(histBinWidth - .2))
      .attr("height", function(d) { return histHeight - histY(d.tract_fl_count); })
      .style("fill",function(d){ return mapColor(d.bin/100 + .01)})


var  maxDistanceFromPoint = 50;

svg._tooltipped = svg._voronoi = null;
svg
  .on('mousemove', function() {
  if(SECTION_INDEX() == "7" || SECTION_INDEX() == 8){
    if (!svg._voronoi) {
      console.log('computing the voronoi…');
      svg._voronoi = d3.voronoi()
      .x(function(d) { return scatterPlotX(getScatterValue(d, "1995")); })
      .y(function(d) { return scatterPlotY(getScatterValue(d, "2014")); })
      (scatterplotData);
      console.log('…done.');
    }
    var p = d3.mouse(this), site;
    p[0] -= margin.left;
    p[1] -= margin.top;
    // don't react if the mouse is close to one of the axis
    if (p[0] < 5 || p[1] < 5) {
      site = null;
    } else {
      site = svg._voronoi.find(p[0], p[1], maxDistanceFromPoint);
    }
    if (site !== svg._tooltipped) {
      if (svg._tooltipped) removeTooltip(svg._tooltipped.data)
      if (site) showTooltip(site.data);
      svg._tooltipped = site;
    }
  }
  else if(SECTION_INDEX() < 3){
    var m = d3.mouse(this)
    var yCoord = m[1] - margin.top
    var states = dotChartY.domain()
    var band = dotChartY.step()
    for(var i = 0; i < states.length; i++){
      var state = dotChartY(states[i]);
      if(yCoord < (state + band/2) && yCoord > (state - band/2)){
        d3.selectAll(".stateG")
          .classed("dotChartSelected", false)

        d3.select(".stateG." + states[i])
          .classed("dotChartSelected", true)
        break;
      }
    }
  }

  })
  .on("mouseout", function(){
    d3.selectAll(".stateG")
      .classed("dotChartSelected", false)
  })

function showTooltip (d, i) {
  d3.select(".scatterDot." + d.state)
    .classed("scatterSelected", true)
}
function removeTooltip(d, i){
  d3.select(".scatterDot." + d.state)
    .classed("scatterSelected", false)
}

  };


  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  var setupSections = function (dotChartData, scatterplotData, histData) {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = function(){ localDots(dotChartData) };
    activateFunctions[1] = function(){ stateDots(dotChartData) };
    activateFunctions[2] = function(){ federalDots(dotChartData) };
    activateFunctions[3] = function(){ floridaTracts(histData) };
    activateFunctions[4] = function(){ floridaDistricts(histData) };
    activateFunctions[5] = function(){ newYorkTracts(histData) };
    activateFunctions[6] = function(){ newYorkDistricts(histData) };
    activateFunctions[7] = function(){ dotsOverTime(dotChartData) };
    activateFunctions[8] = function(){ dotsOverTimeControls(dotChartData) };
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
    d3.select(".legendLocalDot")
      .transition()
      .attr("cx",0)
    d3.select(".legendLocalText")
      .transition()
      .attr("x",10)
    d3.select(".legendTotalTextState")
      .transition()
      .style("opacity",0)
    d3.select(".legendStateText")
      .transition()
      .style("opacity",0)
    d3.select(".legendStateDot")
      .transition()
      .style("opacity",0)

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


    d3.select(".legendLocalDot")
      .transition()
      .attr("cx",150)
    d3.select(".legendLocalText")
      .transition()
      .attr("x",160)
    d3.select(".legendTotalTextState")
      .transition()
      .style("opacity",1)
    d3.select(".legendTotalTextFederal")
      .transition()
      .style("opacity",0)
    d3.select(".legendStateText")
      .transition()
      .style("opacity",1)
      .attr("x",270)
    d3.select(".legendStateDot")
      .transition()
      .style("opacity",1)
      .attr("cx",260)
    d3.select(".legendFederalText")
      .transition()
      .style("opacity",0)
    d3.select(".legendFederalDot")
      .transition()
      .style("opacity",0)

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

    d3.select(".legendLocalDot")
      .transition()
      .attr("cx",185)
    d3.select(".legendLocalText")
      .transition()
      .attr("x",195)
    d3.select(".legendTotalTextState")
      .transition()
      .style("opacity",0)
    d3.select(".legendTotalTextFederal")
      .transition()
      .style("opacity",1)
    d3.select(".legendStateText")
      .transition()
      .style("opacity",1)
      .attr("x",295)
    d3.select(".legendStateDot")
      .transition()
      .style("opacity",1)
      .attr("cx",285)
    d3.select(".legendFederalText")
      .transition()
      .style("opacity",1)
    d3.select(".legendFederalDot")
      .transition()
      .style("opacity",1)


    dotChartData.sort(function(a, b){ return (b.localRevenue + b.stateRevenue + b.federalRevenue) - (a.localRevenue + a.stateRevenue + a.federalRevenue)})
    dotChartY.domain(dotChartData.map(function(d) { return d.state; }));
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

    d3.selectAll("#dotChartYAxis .tick text")
      .transition()
      .style("opacity",1)
    d3.select(".zeroLine")
      .transition()
      .style("opacity",1)
    d3.select(".legend")
      .transition()
      .delay(1500)
      .style("opacity",1)
    d3.selectAll(".largeChartLabel")
      .transition()
      .delay(1500)
      .style("opacity",1)
    d3.select("#dotChartXAxis")
      .transition()
      .style("opacity",1)

    d3.select(".floridaTractsImg")
      .transition()
      .duration(500)
      .style("opacity",0)
    d3.select(".floridaDistrictsImg")
      .transition()
      .duration(500)
      .style("opacity",0)
    histG
      .transition()
      .duration(500)
      .style("opacity",0)
  }

  function gridlines(){
    d3.selectAll("#histYAxis .tick line")
      .transition()
      .attr("x2", histX(0))
      .attr("x1", histX(100))
      .attr("class", function(d){
        if (d == 0){
          return "histAxis"
        }else{
          return "histGrid"
        }
      })
  }
  function floridaTracts(histData){
    histY.domain([0, d3.max(histData, function(d) { return d.tractFlCount; })]);
    histG
      .transition()
      .delay(1500)
      .duration(1000)
      .style("opacity",1)
    d3.select("#histYAxis")
      .transition()
      .delay(1500)
      .duration(1000)
      .call(d3.axisLeft(histY).ticks(10, "s"))

    gridlines()

    d3.selectAll(".histBar")
      .transition()
      .delay(1500)
      .duration(1000)
      .attr("y", function(d) { return histY(d.tractFlCount); })
      .attr("height", function(d) { return histHeight - histY(d.tractFlCount); })


    d3.selectAll(".stateG")
      .classed("dotChartSelected", false)
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
    d3.select(".legend")
      .transition()
      .delay(1500)
      .style("opacity",0)
    d3.selectAll(".largeChartLabel")
      .transition()
      .delay(1500)
      .style("opacity",0)
    d3.select("#dotChartXAxis")
      .transition()
      .delay(1500)
      .style("opacity",0)
    //draw map
    d3.select(".floridaDistrictsImg")
      .transition()
      .duration(2000)
      .style("opacity",0)

    d3.select(".floridaTractsImg")
      .transition()
      .delay(1500)
      .duration(1000)
      .style("opacity",1)
  }

  function floridaDistricts(histData){
    histY.domain([0, d3.max(histData, function(d) { return d.distFlCount; })]);
    d3.select("#histYAxis")
      .transition()
      .duration(2000)
      .call(d3.axisLeft(histY).ticks(10, "s"))
    d3.selectAll(".histBar")
      .transition()
      .duration(2000)
      .attr("y", function(d) { return histY(d.distFlCount); })
      .attr("height", function(d) { return histHeight - histY(d.distFlCount); })
      
      gridlines()

    d3.select(".floridaTractsImg")
      .transition()
      .duration(100)
      .style("opacity",1)
    d3.select(".floridaDistrictsImg")
      .transition()
      .duration(2000)
      .style("opacity",1)
    d3.select(".newYorkTractsImg")
      .transition()
      .duration(500)
      .style("opacity",0)

  }
  function newYorkTracts(histData){
    histY.domain([0, d3.max(histData, function(d) { return d.tractNyCount; })]);
    d3.select("#histYAxis")
      .transition()
      .duration(500)
      .call(d3.axisLeft(histY).ticks(10, "s"))
    d3.selectAll(".histBar")
      .transition()
      .duration(500)
      .attr("y", function(d) { return histY(d.tractNyCount); })
      .attr("height", function(d) { return histHeight - histY(d.tractNyCount); })

    gridlines()

    d3.select(".floridaDistrictsImg")
      .transition()
      .duration(500)
      .style("opacity",0)
    d3.select(".floridaTractsImg")
      .transition()
      .duration(500)
      .style("opacity",0)
    d3.select(".newYorkTractsImg")
      .transition()
      .duration(2000)
      .style("opacity",1)
    d3.select(".newYorkDistrictsImg")
      .transition()
      .duration(1000)
      .style("opacity",0)

  }
  function newYorkDistricts(histData){
    histG
      .transition()
      .duration(500)
      .style("opacity",1)

    histY.domain([0, d3.max(histData, function(d) { return d.distNyCount; })]);
    d3.select("#histYAxis")
      .transition()
      .duration(2000)
      .call(d3.axisLeft(histY).ticks(10, "s"))
    d3.selectAll(".histBar")
      .transition()
      .duration(2000)
      .attr("y", function(d) { return histY(d.distNyCount); })
      .attr("height", function(d) { return histHeight - histY(d.distNyCount); })

    gridlines()

    d3.select(".newYorkDistrictsImg")
      .transition()
      .duration(2000)
      .style("opacity",1)
    d3.selectAll(".scatterDot")
      .classed("scatterSelected", false)
      .transition()
      .attr("cx", scatterPlotX(1) )
      .attr("cy", scatterPlotY(1) )
      .transition()
      .style("opacity",0)
    d3.select("#scatterPlotXAxis")
      .transition()
      .style("opacity",0)
    d3.select("#scatterPlotYAxis")
      .transition()
      .style("opacity",0)
    d3.selectAll(".scatterAxis")
      .transition()
      .style("opacity",0)
    d3.selectAll(".scatterGrid")
      .transition()
      .style("opacity",0)
    d3.selectAll(".largeScatterplotLabel")
      .transition()
      .style("opacity",0)
  }
  function dotsOverTime(){
    histG
      .transition()
      .duration(500)
      .style("opacity",0)
    d3.selectAll(".scatterButton")
      .transition()
      .style("opacity",0)
    d3.select(".newYorkDistrictsImg")
      .transition()
      .duration(500)
      .style("opacity",0)
    d3.select(".newYorkTractsImg")
      .transition()
      .duration(500)
      .style("opacity",0)

    g.selectAll(".scatterDot")
        .transition()
        .style("opacity",.5)
        .transition()
        .duration(1000)
        .ease(d3.easeElastic)
        .attr("cx", function(d){ return scatterPlotX(getScatterValue(d, "1995")) })
        .attr("cy", function(d){ return scatterPlotY(getScatterValue(d, "2014")) })

    d3.select("#scatterPlotXAxis")
      .transition()
      .style("opacity",1)
    d3.select("#scatterPlotYAxis")
      .transition()
      .style("opacity",1)
    d3.selectAll(".scatterAxis")
      .transition()
      .style("opacity",1)
    d3.selectAll(".scatterGrid")
      .transition()
      .style("opacity",1)
    d3.selectAll(".largeScatterplotLabel")
      .transition()
      .style("opacity",1)
  }

  function dotsOverTimeControls(){
    d3.selectAll(".scatterButton")
      .transition()
      .duration(1000)
      .style("opacity",1)
  }


  /**
   * DATA FUNCTIONS
   *
   * Used to coerce the data into the
   * formats we need to visualize
   *
   */


  function getDotChartData(data) {
    return data.map(function (d, i) {
      d.state = d.stabbr;
      d.stateRevenue = +d.adjrevdiff_st;
      d.localRevenue  = +d.adjrevdiff_lo;
      d.federalRevenue = +d.adjrevdiff_fe;

      return d;
    });
  }
  function getScatterplotData(data){
    return data.map(function (d, i) {
      d.state = d.stabbr;
      d.St1995 = +d.adjrevratio_st1995
      d.Lo1995 = +d.adjrevratio_lo1995
      d.Fe1995 = +d.adjrevratio_fe1995
      d.StLo1995 = +d.adjrevratio_stlo1995;
      d.StFe1995 = +d.adjrevratio_stfe1995
      d.LoFe1995 = +d.adjrevratio_lofe1995
      d.StLoFe1995 = +d.adjrevratio_all1995
      d.St2014 = +d.adjrevratio_st2014
      d.Lo2014 = +d.adjrevratio_lo2014
      d.Fe2014 = +d.adjrevratio_fe2014
      d.StLo2014 = +d.adjrevratio_stlo2014;
      d.StFe2014 = +d.adjrevratio_stfe2014
      d.LoFe2014 = +d.adjrevratio_lofe2014
      d.StLoFe2014 = +d.adjrevratio_all2014
      return d;
    });
  }
  function getHistData(data){
    return data.map(function (d, i) {
      d.bin = +d.bin
      d.tractFlCount = +d.tract_fl_count;
      d.distFlCount = +d.dist_fl_count;
      d.tractNyCount = +d.tract_ny_count;
      d.distNyCount = +d.dist_ny_count;
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
function display(dotChartData, scatterplotData, histData) {
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
    .datum([dotChartData, scatterplotData, histData])
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

}

// load data and display
d3.csv("data/data_ben_2014.csv", function(dotChartData){
  d3.csv("data/data_ben_19952014.csv", function(scatterplotData){
    d3.csv("data/poverty_histogram_data.csv", function(histData){
      display(dotChartData, scatterplotData, histData)
    });
  });
});
// 
