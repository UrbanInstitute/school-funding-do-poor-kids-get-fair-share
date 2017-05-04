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

  var scatterPlotY = d3.scaleLinear()
            .range([width, 0]);
  var scatterPlotX = d3.scaleLinear()
            .range([0, width]);

  var mapColor = d3.scaleThreshold()
      .domain([.1, .15, .2, .25, .3, .35, .4])
      .range(["#cfe8f3","#a2d4ec","#73bfe2","#46abdb","#1696d2","#12719e","#0a4c6a"]);

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
      var dotChartData = getDotChartData(rawData[0]);
      dotChartData.sort(function(a, b){ return b.localRevenue - a.localRevenue})
      dotChartY.domain(dotChartData.map(function(d) { return d.state; }));
      dotChartX.domain([6000,-6000]);

      var scatterplotData = getScatterplotData(rawData[1])
      var floridaTractData = rawData[2]
      var floridaDistrictData = rawData[3]
      var newYorkTractData = rawData[4]
      var newYorkDistrictData = rawData[5]
      // scatterPlotY.domain(d3.extent(scatterplotData, function(d) { return d.ratio1995; }));
      // scatterPlotX.domain(d3.extent(scatterplotData, function(d) { return d.ratio2014; }));
      scatterPlotY.domain([.8,1.2]);
      scatterPlotX.domain([.8,1.2]);

      setupVis(dotChartData, scatterplotData);

      setupSections(dotChartData, scatterplotData);
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
  var setupVis = function (dotChartData, scatterplotData, floridaTractData, floridaDistrictData, newYorkTractData, newYorkDistrictData) {

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

    g.append("text")
      .attr("class", "largeScatterplotLabel")
      .attr("x",35)
      .attr("y", scatterPlotY(1.1))
      .text("BECAME PROGRESSIVE")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel")
      .attr("x",335)
      .attr("y", scatterPlotY(1.1))
      .text("STAYED PROGRESSIVE")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel")
      .attr("x",35)
      .attr("y", scatterPlotY(.9))
      .text("STAYED REGRESSIVE")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel")
      .attr("x",335)
      .attr("y", scatterPlotY(.9))
      .text("BECAME REGRESSIVE")
      .style("opacity",0)



      //florida maps

  var path = d3.geoPath()




  d3.json("data/topojson/fl_tract_map.json", function (error, floridaTractData){
  g.append("g")
    .attr("class", "floridaTracts")
    .selectAll("path")
    .data(topojson.feature(floridaTractData, floridaTractData.objects.fl_tract_map).features)
    .enter().append("path")
    .attr("fill", function(d) { return mapColor(d.properties.poverty) })
    .attr("d", path)
    .style("opacity",0);
  });

  d3.json("data/topojson/fl_dist_map.json", function (error, floridaDistrictData){
    g.append("g")
      .attr("class", "floridaDistricts")
      .selectAll("path")
      .data(topojson.feature(floridaDistrictData, floridaDistrictData.objects.fl_dist_map).features)
      .enter().append("path")
      .attr("fill", function(d) { return mapColor(d.properties.poverty) })
      .attr("stroke","none")
      .attr("d", path)
      .style("opacity",0);
    });

  d3.json("data/topojson/ny_tract_map.json", function (error, newYorkTractData){
  g.append("g")
    .attr("class", "newYorkTracts")
    .selectAll("path")
    .data(topojson.feature(newYorkTractData, newYorkTractData.objects.ny_tract_map).features)
    .enter().append("path")
    .attr("fill", function(d) { return mapColor(d.properties.poverty) })
    .attr("d", path)
    .style("opacity",0);
  });

  d3.json("data/topojson/ny_dist_map.json", function (error, newYorkDistrictData){  
  g.append("g")
    .attr("class", "newYorkDistricts")
    .selectAll("path")
    .data(topojson.feature(newYorkDistrictData, newYorkDistrictData.objects.ny_dist_map).features)
    .enter().append("path")
    .attr("fill", function(d) { return mapColor(d.properties.poverty) })
    .attr("stroke","none")
    .attr("d", path)
    .style("opacity",0);
  });



var  maxDistanceFromPoint = 50;

svg._tooltipped = svg._voronoi = null;
svg
  .on('mousemove', function() {
  if(SECTION_INDEX() == "7"){
    if (!svg._voronoi) {
      console.log('computing the voronoi…');
      svg._voronoi = d3.voronoi()
      .x(function(d) { return scatterPlotX(d.ratio1995); })
      .y(function(d) { return scatterPlotY(d.ratio2014); })
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
      // console.log(yCoord, state, band)
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
  var setupSections = function (dotChartData, scatterplotData) {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = function(){ localDots(dotChartData) };
    activateFunctions[1] = function(){ stateDots(dotChartData) };
    activateFunctions[2] = function(){ federalDots(dotChartData) };
    activateFunctions[3] = function(){ floridaTracts(dotChartData) };
    activateFunctions[4] = function(){ floridaDistricts(dotChartData) };
    activateFunctions[5] = function(){ newYorkTracts(dotChartData) };
    activateFunctions[6] = function(){ newYorkDistricts(dotChartData) };
    activateFunctions[7] = function(){ dotsOverTime(dotChartData) };

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

    d3.selectAll(".floridaTracts path")
      .transition()
      .duration(500)
      .style("opacity",0)
    d3.selectAll(".floridaDistricts path")
      .transition()
      .duration(500)
      .style("opacity",0)
  }

  function floridaTracts(){
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
    d3.selectAll(".floridaDistricts path")
      .transition()
      .duration(2000)
      .style("opacity",0)

    d3.selectAll(".floridaTracts path")
      .transition()
      .delay(1500)
      .duration(1000)
      .style("opacity",1)
  }

  function floridaDistricts(){
    d3.selectAll(".floridaTracts path")
      .transition()
      .duration(100)
      .style("opacity",1)
    d3.selectAll(".floridaDistricts path")
      .transition()
      .duration(2000)
      .style("opacity",1)
    d3.selectAll(".newYorkTracts path")
      .transition()
      .duration(500)
      .style("opacity",0)

  }
  function newYorkTracts(){
    d3.selectAll(".floridaDistricts path")
      .transition()
      .duration(500)
      .style("opacity",0)
    d3.selectAll(".floridaTracts path")
      .transition()
      .duration(500)
      .style("opacity",0)
    d3.selectAll(".newYorkTracts path")
      .transition()
      .duration(2000)
      .style("opacity",1)
    d3.selectAll(".newYorkDistricts path")
      .transition()
      .duration(1000)
      .style("opacity",0)

  }
  function newYorkDistricts(){
    d3.selectAll(".newYorkDistricts path")
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
    d3.selectAll(".newYorkDistricts path")
      .transition()
      .duration(500)
      .style("opacity",0)
    d3.selectAll(".newYorkTracts path")
      .transition()
      .duration(500)
      .style("opacity",0)

    g.selectAll(".scatterDot")
        .transition()
        .style("opacity",.5)
        .transition()
        .duration(1000)
        .ease(d3.easeElastic)
        .attr("cx", function(d){ return scatterPlotX(d.ratio1995) })
        .attr("cy", function(d){ return scatterPlotY(d.ratio2014) })

    // d3.selectAll(".scatterDot")
    //   .transition()
    //   .style("opacity",.5)
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
      d.stateRevenue = +d.adjrevdiff_st
      d.localRevenue  = +d.adjrevdiff_lo
      d.federalRevenue = +d.adjrevdiff_fe

      return d;
    });
  }
  function getScatterplotData(data){
    return data.map(function (d, i) {
      d.state = d.stabbr;
      d.ratio1995 = +d.adjrevratio_stlo1995
      d.ratio2014 = +d.adjrevratio_stlo2014
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
function display(dotChartData, scatterplotData) {
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
    .datum([dotChartData, scatterplotData])
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
d3.csv("data/data_ben_2014.csv", function(dotChartData){
  d3.csv("data/data_ben_19952014.csv", function(scatterplotData){
            display(dotChartData, scatterplotData)
  });
});

