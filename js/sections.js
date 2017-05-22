/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function () {
  // constants to define the size
  // and margins of the vis area.
  var width;
  var height;
  

  if ( IS_PHONE() ){ width = PHONE_VIS_WIDTH }
  else if ( IS_SHORT() ){ width = SHORT_VIS_WIDTH }
  else{ width = VIS_WIDTH} 

  if ( IS_PHONE() ){ height = PHONE_VIS_HEIGHT }
  else if ( IS_SHORT() ){ height = SHORT_VIS_HEIGHT }
  else{ height = VIS_HEIGHT} 

  margin = ( IS_PHONE() ) ? PHONE_MARGIN : MARGIN;
  DOT_RADIUS = (IS_PHONE()) ? 4 : 5;
  SMALL_DOT_RADIUS = (IS_PHONE()) ? 2 : 3;
  histMargin = (IS_PHONE()) ? phoneHistMargin : desktopHistMargin;
  histWidth = (IS_PHONE()) ? phoneHistWidth : desktopHistWidth;
  histHeight = (IS_PHONE()) ? phoneHistHeight : desktopHistHeight;

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

  var outliers = null;

  // d3 selection that will be used
  // for displaying visualizations
  var g = null;

  var histG = null;

  var newYorkMorphData = null;
  var floridaMorphData = null;

  var dotChartY = d3.scaleBand()
            .range([0, height])
            .padding(0.95);
  var dotChartX = d3.scaleLinear()
            .range([width, 0]);

  if(IS_PHONE()){
    scatterWidth = PHONE_SCATTER_WIDTH;
  }
  else if(IS_SHORT()){    
    scatterWidth = SHORT_SCATTER_WIDTH;
  }else{
    scatterWidth = width;
  }

  var scatterPlotY = d3.scaleLinear()
            .range([scatterWidth, 0]);
  var scatterPlotX = d3.scaleLinear()
            .range([0, scatterWidth]);


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

      var histAdjust = (IS_SHORT() || IS_PHONE()) ? 50 : 0;
      histG = svg.append("g")
        .attr("class", "mapElements")
        .attr("transform", "translate(" + histMargin.left + "," + (height - histHeight + histAdjust) + ")")
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
      var coords = (IS_SHORT()) ? "translate(169,20)" : "translate(80,0)"
      var morphG = svg.append("g").attr("id","morphG").attr("transform",coords)
      var morphPath = morphG.append("path").attr("id","morphPath");
      var morphCircles = morphG.append("g").attr("id","morphCircles");
  
      var defs = svg.append("defs");
      var filterLeft = defs.append("filter")
        .attr("id", "drop-shadow-left")
        .attr("height", "130%");
      filterLeft.append("feGaussianBlur")
          .attr("in", "SourceAlpha")
          .attr("stdDeviation", 5)
      filterLeft.append("feOffset")
          .attr("dx", -5)
          .attr("dy", 5)
      filterLeft.append("feComponentTransfer")
          .append("feFuncA")
          .attr("type", "linear")
          .attr("slope",.2)

      var feMergeLeft = filterLeft.append("feMerge");

      feMergeLeft.append("feMergeNode")
      feMergeLeft.append("feMergeNode")
          .attr("in", "SourceGraphic");

      var filterRight = defs.append("filter")
        .attr("id", "drop-shadow-right")
        .attr("height", "130%");
      filterRight.append("feGaussianBlur")
          .attr("in", "SourceAlpha")
          .attr("stdDeviation", 5)
      filterRight.append("feOffset")
          .attr("dx", 5)
          .attr("dy", 5)
      filterRight.append("feComponentTransfer")
          .append("feFuncA")
          .attr("type", "linear")
          .attr("slope",.2)

      var feMergeRight = filterRight.append("feMerge");

      feMergeRight.append("feMergeNode")
      feMergeRight.append("feMergeNode")
          .attr("in", "SourceGraphic");

      
      function draw() {

        var a = (IS_SHORT()) ? floridaShortShape : floridaShape,
            b = (IS_SHORT()) ? newYorkShortShape : newYorkShape

        // Same number of points on each ring
        if (a.length < b.length) {
          addPoints(a, b.length - a.length);
        } else if (b.length < a.length) {
          addPoints(b, a.length - b.length);
        }

        // Pick optimal winding
        a = wind(a, b);
        newYorkMorphData = b;
        floridaMorphData = a;

        morphPath.attr("d", join(a))
        .style("fill","#12719e")
        .style("opacity",0);

        // Redraw points
        morphCircles.datum(a)
          .call(updateCircles);


      }
      if( ! IS_PHONE()){
        draw();
      }
    var highlightBar = g.selectAll(".highlightBar")
        .data(dotChartData)
        .enter().append("g")
        .attr("class", function(d){ return "includeHighlight highlightBar " + d.state })
        .attr("transform",function(d){ return "translate(0," + dotChartY(d.state) + ")" })

    var stateG = g.selectAll(".stateG")
        .data(dotChartData)
        .enter().append("g")
        .attr("class", function(d){
          var stateClass = (d.state == "NY" || d.state == "FL") ? d.state + " specialState" : d.state
          return "includeHighlight stateG " + stateClass
        })
        .attr("transform",function(d){ return "translate(0," + dotChartY(d.state) + ")" })
    var shortStateG = g.selectAll(".shortStateG")
        .data(dotChartData)
        .enter().append("g")
        .attr("class", function(d){ return "noHighlight shortStateG " + d.state })
        .attr("transform",function(d){ return "translate(0," + (height-75) + ")" })


    highlightBar.append("rect")
      .attr("width",width+100)
      .attr("height",14)
      .attr("x",-100)
      .attr("y",-7)
      .attr("class", "dotHoverRect")

    // stateG.append("rect")
    //   .attr("width",width+100)
    //   .attr("height",14)
    //   .attr("x",-100)
    //   .attr("y",-7)
    //   .attr("class", "dotHoverRect")


    g.append("text")
      .attr("class", "largeChartLabel dotChartComponents")
      .attr("x",function(){
        if(IS_PHONE()){
          return dotChartX(-5500)  
        }else{
          return dotChartX(-4500)  
        }
      })
      .attr("y", function(){
        if(IS_PHONE()){
          return 145
        }else{
          return 200
        }
      })
      .text("REGRESSIVE")
    g.append("text")
      .attr("class", "largeChartLabel dotChartComponents")
      .attr("x",function(){
        if(IS_PHONE()){
          return dotChartX(1200)  
        }else{
          return dotChartX(2200)  
        }
      })
      .attr("y", function(){
        if(IS_PHONE()){
          return 145
        }else{
          return 200
        }
      })
      .text("PROGRESSIVE")

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


    var legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform",function(d){
        if(IS_PHONE()){
          return "translate(10,55)"  
        }else{
          return "translate(150,50)"
        }
      })


    legend.append("circle")
      .attr("class", "dotChartLegend legendLocalDot dotChartComponents")
      .attr("r", DOT_RADIUS)
      .attr("cx", 0)
      .attr("cy", 0)

    legend.append("text")
      .attr("class", "dotChartLegend legendLocalText dotChartComponents")
      .attr("x",10)
      .attr("y",4)
      .text("Local funding")

    legend.append("circle")
      .attr("class", "dotChartLegend legendTotalDot dotChartComponents")
      .attr("r", SMALL_DOT_RADIUS)
      .attr("cx", 0)
      .attr("cy", 0)

    legend.append("text")
      .attr("class", "dotChartLegend legendTotalTextState dotChartComponents")
      .attr("x",10)
      .attr("y",4)
      .text("Local + state funding")
      .style("opacity",0)
    legend.append("text")
      .attr("class", "dotChartLegend legendTotalTextFederal dotChartComponents")
      .attr("x",10)
      .attr("y",4)
      .text("Local + state + federal funding")
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
      .text("State funding")
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
      .text("Federal funding")
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

    function appendTooltip(group, direction){
      group.append("rect")
        .attr("width",160)
        .attr("height",44)
        .attr("x",width-160)
        .attr("y",7)
        .attr("class", "dotHoverRect dotTooltip dotTooltipBg")
        .style("filter", "url(#drop-shadow-" + direction + ")")


      group.append("text")
        .attr("x",width-70)
        .attr("y",34)
        .text("(local)")
        .attr("class", "dotHoverText text dotTooltip")

      group.append("text")
        .attr("x",width-70)
        .attr("y",54)
        .text("(state)")
        .attr("class", "dotHoverText text dotTooltip hidden show1")

      group.append("text")
        .attr("x",width-70)
        .attr("y",74)
        .text("(federal)")
        .attr("class", "dotHoverText text dotTooltip hidden show2")

      group.append("text")
        .attr("x",width-70)
        .attr("y",104)
        .text("(total)")
        .attr("class", "dotHoverText text dotTooltip totalLabel hidden show1")

      group.append("text")
        .attr("x",width-80)
        .attr("y",34)
        .attr("text-anchor","end")
        .text(function(d){ return DOLLARS(d.localRevenue)})
        .attr("class", "dotHoverText dotTooltip localValue")
      group.append("text")
        .attr("x",width-80)
        .attr("y",54)
        .attr("text-anchor","end")
        .text(function(d){ return DOLLARS(d.stateRevenue)})
        .attr("class", "dotHoverText dotTooltip stateValue hidden show1")
      group.append("text")
        .attr("x",width-80)
        .attr("y",74)
        .attr("text-anchor","end")
        .text(function(d){ return DOLLARS(d.federalRevenue)})
        .attr("class", "dotHoverText dotTooltip federalValue hidden show2")

      group.append("line")
        .attr("x1",width - 140)
        .attr("x2",width - 80)
        .attr("y1", 84)
        .attr("y2", 84)
        .attr("class", "dotSumLine hidden show1")
        .style("stroke","#333")
      group.append("text")
        .attr("x",width-140 )
        .attr("y",74)
        .text("+")
        .attr("class", "dotHoverText dotSumPlus dotTooltip hidden show1")


      group.append("text")
        .attr("x",width-80)
        .attr("y",104)
        .attr("text-anchor","end")
        .text(function(d){ return DOLLARS(d.federalRevenue + d.stateRevenue + d.localRevenue)})
        .attr("class", "dotHoverText dotTooltip totalValue hidden show1")
    }
    appendTooltip(stateG, "left")
    appendTooltip(shortStateG, "right")




    // add the x Axis
    var tickCount = (IS_PHONE()) ? 7 : 13
    g.append("g")
        .attr("id", "dotChartXAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(dotChartX)
          .tickFormat(function(d){
            if(IS_PHONE()){
              return d3.format("$.0s")(d)
            }else{
              return d3.format("$,")(d)
            }
          })
          .ticks(tickCount)
        ) 
    var dotAxisX, dotAxisY;
    if(IS_PHONE()) dotAxisX = 0;
    else if(IS_SHORT()) dotAxisX = 100;
    else dotAxisX = 100;

    if(IS_PHONE()) dotAxisY = 10;
    else if(IS_SHORT()) dotAxisY = 45;
    else dotAxisY = 45;

    var dotAxisXText = (IS_PHONE()) ? "" : "Difference in funding of districts attended by poor vs. nonpoor students";
    g.append("text")
      .html(dotAxisXText)
      .attr("x",dotAxisX)
      .attr("y",height + dotAxisY)
      .attr("class", "axisLabel dotAxisXLabel")
    g.append("text")
    .html("<tspan>Note:</tspan> We exclude Hawaii and Washington, DC, because they are both single districts.")
    .attr("x",0)
    .attr("y",height + dotAxisY + 24)
    .attr("class", "note dotNote")


    // add the y Axis
    g.append("g")
      .attr("id", "dotChartYAxis")
      .call(d3.axisLeft(dotChartY).tickFormat(function(t){
        if(IS_PHONE()){
          return t
        }else{
          return fullNames[t]
        }
      }));  




    // scatter plot
    g.append("g")
        .attr("id", "scatterPlotXAxis")
        .attr("transform", "translate(0," + (scatterWidth)  + ")")
        .call(d3.axisBottom(scatterPlotX))
        .style("opacity",0)

    // add the y Axis
    g.append("g")
      .attr("id", "scatterPlotYAxis")
      .call(d3.axisLeft(scatterPlotY))
      .style("opacity",0)

    d3.selectAll("#scatterPlotYAxis .tick line")
      .attr("x1", 0)
      .attr("x2", scatterWidth)
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

    var x1, x2a, x2b, x3a, x3b, x4, y1, y2a, y2b, y3a, y3b, y4, extraClass, xAxisX, xAxisY, yAxisX, yAxisY;
    if(IS_SHORT()){ extraClass = " shortGraphLargeLabel"}
    else{ extraClass = ""}

    if(IS_SHORT()){ x1 = 265}
    else{ x1 = 335}  
    if(IS_SHORT()){ x2a = 16}
    else{ x2a = 35}
    if(IS_SHORT()){ x2b = 99}
    else{ x2b = 124}  
    if(IS_SHORT()){ x3a = 16}
    else{ x3a = 35}  
    if(IS_SHORT()){ x3b = 91}
    else{ x3b = 118}  
    if(IS_SHORT()){ x4 = 265}
    else{ x4 = 335}  

    if(IS_SHORT()){ y1 = 120}
    else{ y1 = 150}  
    if(IS_SHORT()){ y2a = 120}
    else{ y2a = 150}
    if(IS_SHORT()){ y2b = 120}
    else{ y2b = 150}  
    if(IS_SHORT()){ y3a = 360}
    else{ y3a = 450}  
    if(IS_SHORT()){ y3b = 360}
    else{ y3b = 450}  
    if(IS_SHORT()){ y4 = 360}
    else{ y4 = 450}  

    if(IS_PHONE()){ xAxisX = 20 }
    else if(IS_SHORT()){ xAxisX = 143}
    else{ xAxisX = 205}
    if(IS_PHONE()){ xAxisY = 40 }  
    else if(IS_SHORT()){ xAxisY = 40}
    else{ xAxisY = 50}
    if(IS_PHONE()){ yAxisX = -40 }  
    else if(IS_SHORT()){ yAxisX = -50}
    else{ yAxisX = -60}
    if(IS_PHONE()){ yAxisY = 213 }  
    else if(IS_SHORT()){ yAxisY = 330}
    else{ yAxisY = 395}  

    g.append("text")
      .attr("class", "largeScatterplotLabel q1" + extraClass)
      .attr("x",x1)
      .attr("y", y1)
      .text("STAYED PROGRESSIVE")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel q2a" + extraClass)
      .attr("x",x2a)
      .attr("y", y2a)
      .text("BECAME")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel q2b" + extraClass)
      .attr("x",x2b)
      .attr("y", y2b)
      .text("PROGRESSIVE")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel q3a" + extraClass)
      .attr("x",x3a)
      .attr("y", y3a)
      .text("STAYED")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel q3b" + extraClass)
      .attr("x",x3b)
      .attr("y", y3b)
      .text("REGRESSIVE")
      .style("opacity",0)
    g.append("text")
      .attr("class", "largeScatterplotLabel q4" + extraClass)
      .attr("x",x4)
      .attr("y", y4)
      .text("BECAME REGRESSIVE")
      .style("opacity",0)


    g.append("text")
      .attr("class", "scatterAxisLabel")
      .text("Funding progressivity ratio, 1995")
      .attr("y", scatterWidth + xAxisY)
      .attr("x", xAxisX)
      .style("opacity",0)
    g.append("text")
      .attr("class", "scatterAxisLabel")
      .text("Funding progressivity ratio, 2014")
      .attr("transform", "translate(" + yAxisX + "," + yAxisY + ")rotate(270)")
      .style("opacity",0)
      


    var scatterTooltipContainer = g.append("g")
      .attr("id","scatterTooltipContainer")
      .style("opacity",0)

    scatterTooltipContainer.append("rect")
      .attr("width",158)
      .attr("height",130)
      .attr("fill","#fff")
      .style("opacity",.85)
      .style("filter", "url(#drop-shadow-right)")
    scatterTooltipContainer.append("text")
      .attr("x",20)
      .attr("y", 30)
      .attr("class", "stateName")
      .text("North Carolina")
    scatterTooltipContainer.append("text")
      .attr("x",20)
      .attr("y", 50)
      .attr("class", "subtitle")
      .text("Funding progressivity")
    scatterTooltipContainer.append("text")
      .attr("x",20)
      .attr("y", 63)
      .attr("class", "subtitle")
      .text("ratios:")
 
    scatterTooltipContainer.append("text")
      .attr("x",20)
      .attr("y", 90)
      .attr("class", "yearName")
      .text("1995:")
    scatterTooltipContainer.append("text")
      .attr("x",60)
      .attr("y", 90)
      .attr("class", "ratioText y1995")
      .text("1.2")
    scatterTooltipContainer.append("text")
      .attr("x",20)
      .attr("y", 110)
      .attr("class", "yearName")
      .text("2014:")
    scatterTooltipContainer.append("text")
      .attr("x",60)
      .attr("y", 110)
      .attr("class", "ratioText y2014")
      .text("1.2")

    outliers = {
        "St": [{"state": "CT", "position": "SE"}, {"state": "NJ", "position": "SE"}, {"state": "NV", "position": "SW"}, {"state": "NY", "position": "NW"},{"state": "FL", "position": "SE"}],
        "Lo": [{"state": "NJ", "position": "S"},{"state": "CT", "position": "SW"},{"state": "LA", "position": "NW"},{"state": "UT", "position": "SE"},{"state": "NY", "position": "NW"},{"state": "FL", "position": "W"}],
        "Fe": [{"state": "NV", "position": "SE"},{"state": "FL", "position": "SE"},{"state": "NY", "position": "NW"},{"state": "WY", "position": "SE"},{"state": "CT", "position": "SW"},{"state": "SD", "position": "SE"}],
        "StLo": [{"state": "AK", "position": "NE"}, {"state": "MO", "position": "SE"}, {"state": "IL", "position": "SW"}, {"state": "NY", "position": "SW"}, {"state": "FL", "position": "N"}],
        "StFe": [{"state": "FL", "position": "SE"},{"state": "CT", "position": "SE"},{"state": "NJ", "position": "SE"},{"state": "NV", "position": "SW"}, {"state": "NY", "position": "N"}],
        "LoFe": [{"state": "NY", "position": "NW"},{"state": "FL", "position": "NW"},{"state": "NJ", "position": "SW"}, {"state": "CT", "position": "SW"}, {"state": "AK", "position": "N"}, {"state": "MI", "position": "NW"}],
        "StLoFe": [{"state": "NY", "position": "N"},{"state": "FL", "position": "S"},{"state": "AK", "position": "SW"},{"state": "MO", "position": "SE"},{"state": "IL", "position": "SE"}],
        "": []
      }

    function moveScatterLabels(cat){
      if(IS_SHORT()){
        if(cat == "StLo" || cat == "StLoFe" || cat == ""){
          d3.select(".largeScatterplotLabel.q1").transition().attr("x", 265).attr("y", 120).style("letter-spacing","3px").style("font-size","14px")
          d3.select(".largeScatterplotLabel.q2a").transition().attr("x", 16).attr("y", 120).style("letter-spacing","3px").style("font-size","14px")
          d3.select(".largeScatterplotLabel.q2b").transition().attr("x", 99).attr("y", 120).style("letter-spacing","3px").style("font-size","14px")
          d3.select(".largeScatterplotLabel.q3a").transition().attr("x", 16).attr("y", 360).style("letter-spacing","3px").style("font-size","14px")
          d3.select(".largeScatterplotLabel.q3b").transition().attr("x", 91).attr("y", 360).style("letter-spacing","3px").style("font-size","14px")
          d3.select(".largeScatterplotLabel.q4").transition().attr("x", 265).attr("y", 360).style("letter-spacing","3px").style("font-size","14px")
        }
        else if(cat == "Lo" || cat == "LoFe"){
          //.6 1.2
          d3.select(".largeScatterplotLabel.q1").transition().attr("x", 325).attr("y", 120).style("letter-spacing","1px").style("font-size","13px")
          d3.select(".largeScatterplotLabel.q2a").transition().attr("x", 16).attr("y", 120).style("letter-spacing","3px").style("font-size","14px")
          d3.select(".largeScatterplotLabel.q2b").transition().attr("x", 99).attr("y", 120).style("letter-spacing","3px").style("font-size","14px")
          d3.select(".largeScatterplotLabel.q3a").transition().attr("x", 16).attr("y", 360).style("letter-spacing","3px").style("font-size","14px")
          d3.select(".largeScatterplotLabel.q3b").transition().attr("x", 91).attr("y", 360).style("letter-spacing","3px").style("font-size","14px")
          d3.select(".largeScatterplotLabel.q4").transition().attr("x", 325).attr("y", 360).style("letter-spacing","1px").style("font-size","13px")
        }
        else if(cat == "St" || cat == "StFe"){
          //.8 1.8
          d3.select(".largeScatterplotLabel.q1").transition().attr("x", 265).attr("y", 120).style("letter-spacing","3px").style("font-size","14px")
          d3.select(".largeScatterplotLabel.q2a").transition().attr("x", 21).attr("y", 120).style("letter-spacing","1px").style("font-size","12px")
          d3.select(".largeScatterplotLabel.q2b").transition().attr("x", 4).attr("y", 136).style("letter-spacing","1px").style("font-size","12px")
          d3.select(".largeScatterplotLabel.q3a").transition().attr("x", 26).attr("y", 431).style("letter-spacing","1px").style("font-size","12px")
          d3.select(".largeScatterplotLabel.q3b").transition().attr("x", 8).attr("y", 447).style("letter-spacing","1px").style("font-size","12px")
          d3.select(".largeScatterplotLabel.q4").transition().attr("x", 265).attr("y", 431).style("letter-spacing","3px").style("font-size","14px")
        }
        else if(cat == "Fe"){
          //.8 2.3
          d3.select(".largeScatterplotLabel.q1").transition().attr("x", 265).attr("y", 120).style("letter-spacing","3px").style("font-size","14px")
          d3.select(".largeScatterplotLabel.q2a").transition().attr("x", 13).attr("y", 120).style("letter-spacing","1px").style("font-size","8px")
          d3.select(".largeScatterplotLabel.q2b").transition().attr("x", 1).attr("y", 130).style("letter-spacing","1px").style("font-size","8px")
          d3.select(".largeScatterplotLabel.q3a").transition().attr("x", 15).attr("y", 448).style("letter-spacing","1px").style("font-size","8px")
          d3.select(".largeScatterplotLabel.q3b").transition().attr("x", 4).attr("y", 458).style("letter-spacing","1px").style("font-size","8px")
          d3.select(".largeScatterplotLabel.q4").transition().attr("x", 265).attr("y", 448).style("letter-spacing","3px").style("font-size","14px")
        }

      }
      else if(IS_PHONE()){

      }else{
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
        "St": function(d,i){ if (i%2 == 0){ return tf(d)} else{ return ""}},
        "Lo": tf,
        "Fe": function(d,i){ if (i%2 == 0){ return tf(d)} else{ return ""}},
        "StLo": tf,
        "StFe": function(d,i){ if (i%2 == 0){ return tf(d)} else{ return ""}},
        "LoFe": tf,
        "StLoFe": tf,
        "": tf,
      }
      if(d3.select(button).classed("active")){
        d3.select(button).classed("active", false)
      }else{
        d3.select(button).classed("active", true)
      }

      d3.selectAll(".scatterOutlierLabel")
        .transition()
        .style("opacity", 0)
        .on("end", function(){
          d3.select(this).remove()
        })

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
      .attr("x2", scatterWidth)
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
      .attr("y1", -scatterWidth)
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
        .attr("cx", function(d){ return scatterPlotX(getScatterValue(d, "1995")) })
        .attr("cy", function(d){ return scatterPlotY(getScatterValue(d, "2014")) })
        .on("end", function(d, i){
          if(i == 48){
            drawOutlierLabels(cat, outliers)
          }
        })
    }


    var buttonContainer = d3.select("#vis")
      .append("div")
      .attr("id", "buttonContainer")
      .style("opacity",0)
      .style("z-index",-1)

    buttonContainer.append("div")
      .attr("class", "scatterButton stateButton active nonInteractive switch on")
      .on("click", function(){
        if(d3.select(this).classed("on")){
          d3.select(this).classed("on", false)
          d3.select(this).classed("off", true)
        }else{
          d3.select(this).classed("on", true)
          d3.select(this).classed("off", false)
        }
        updateScatter(this)
      })
      .style("opacity",0)

    buttonContainer.append("div")
      .attr("class","scatterButtonLabel state")
      .text("State")
    buttonContainer.append("div")
      .attr("class","scatterButtonLabel local")
      .text("Local")
    buttonContainer.append("div")
      .attr("class","scatterButtonLabel federal")
      .text("Federal")
    buttonContainer.append("div")
      .attr("class","scatterButtonLabel title")
      .text("Revenue sources")
    buttonContainer.append("div")
      .attr("class", "scatterButton localButton active nonInteractive switch on")
      .on("click", function(){
        updateScatter(this)
      })
      .style("opacity",0)
      .on("click", function(){
        if(d3.select(this).classed("on")){
          d3.select(this).classed("on", false)
          d3.select(this).classed("off", true)
        }else{
          d3.select(this).classed("on", true)
          d3.select(this).classed("off", false)
        }
        updateScatter(this)
      })
      .style("opacity",0)

    buttonContainer.append("div")
      .attr("class", "scatterButton federalButton nonInteractive switch off")
      .on("click", function(){
        updateScatter(this)
      })
      .style("opacity",0)
      .on("click", function(){
        if(d3.select(this).classed("on")){
          d3.select(this).classed("on", false)
          d3.select(this).classed("off", true)
        }else{
          d3.select(this).classed("on", true)
          d3.select(this).classed("off", false)
        }
        updateScatter(this)
      })
      .style("opacity",0)



      //florida maps

  d3.select("#vis")
    .append("img")
    .attr("class","floridaTractsImg mapImg mapFL")
    .attr("src","images/fl_tract.png")
    .style("opacity",0)
    .style("z-index",-1)
    
  d3.select("#vis")
    .append("img")
    .attr("class","floridaDistrictsImg mapImg mapFL")
    .attr("src","images/fl_dist.png")
    .style("opacity",0)
    .style("z-index",-1)

  d3.select("#vis")
    .append("img")
    .attr("class","newYorkTractsImg mapImg mapNY")
    .attr("src","images/ny_tract.png")
    .style("opacity",0)
    .style("z-index",-1)
  d3.select("#vis")
    .append("img")
    .attr("class","newYorkDistrictsImg mapImg mapNY")
    .attr("src","images/ny_dist.png")
    .style("opacity",0)
    .style("z-index",-1)

  var mapLegend =  null;
  var percent = d3.format(".0%")
  var breaks = mapColor.domain()
  breaks.push(1)

  if(IS_PHONE()){
    mapLegend = g.append("g")
      .attr("transform", "translate(-20,-30)")
      .attr("id","mapLegend")
      .attr("class", "mapElements")
      .style("opacity",0)


    mapLegend.append("text")
        .attr("x",-2)
        .attr("y",-5)
        .text(percent(0))
        .attr("class","keyLabel")
    for(var i=1; i < mapColor.range().length; i++){
      mapLegend.append("rect")
        .attr("width",25)
        .attr("height",20)
        .attr("x",(i-1)*25)
        .attr("y",0)
        .style("fill", mapColor.range()[i])

      mapLegend.append("text")
        .attr("x",(i)*25-7)
        .attr("y",-5)
        .text(function(){
          if(i%2 != 0){ return "" }
          else{ return percent(breaks[i])}
        })
        .attr("class","keyLabel")
    }

    mapLegend.append("rect")
      .attr("width",25)
      .attr("height",20)
      .attr("x",0)
      .attr("y", 30)
      .style("fill", mapColor.range()[0])

    mapLegend.append("text")
      .attr("x",30)
      .attr("y", 45)
      .text("No data")
      .attr("class","keyLabel")
    mapLegend.append("text")
      .attr("x",-2)
      .attr("y",-20)
      .text("Poverty rate")
      .attr("class","axisLabel")
  }else{
    mapLegend = g.append("g")
      .attr("transform", "translate(" + (width - 55) + ",0)")
      .attr("id","mapLegend")
      .attr("class", "mapElements")
      .style("opacity",0)


    mapLegend.append("text")
        .attr("x",24)
        .attr("y", 5)
        .text(percent(0))
        .attr("class","keyLabel")
    for(var i=1; i < mapColor.range().length; i++){
      mapLegend.append("rect")
        .attr("width",15)
        .attr("height",20)
        .attr("x",0)
        .attr("y",(i-1)*20)
        .style("fill", mapColor.range()[i])

      mapLegend.append("text")
        .attr("x",24)
        .attr("y", (i)*20+5)
        .text(percent(breaks[i]))
        .attr("class","keyLabel")
    }

    mapLegend.append("rect")
      .attr("width",15)
      .attr("height",20)
      .attr("x",0)
      .attr("y",(mapColor.range().length)*20)
      .style("fill", mapColor.range()[0])

    mapLegend.append("text")
      .attr("x",24)
      .attr("y",(mapColor.range().length)*20 + 15)
      .text("No data")
      .attr("class","keyLabel")
    mapLegend.append("text")
      .attr("transform","translate(0,-13)")
      .text("Poverty rate")
      .attr("class","axisLabel")
  }

    //histograms
  histG.append("g")
      .attr("id", "histXAxis")
      .attr("transform", "translate(0," + histHeight + ")")
      .call(d3.axisBottom(histX));

  histG.append("g")
      .attr("id", "histYAxis")
      .call(d3.axisLeft(histY).ticks(10, "s"))

  histG.append("text")
    .attr("id","histYLabel")
    .text("Number of neighborhoods")
    .attr("x",-30)
    .attr("y",-13)
    .attr("class", "axisLabel")

  var histLabelX = (IS_PHONE()) ? 60 : 240,
      histLabelY = (IS_PHONE()) ? 192 : 277,
      histLabelText = "Poverty rate (percent)",
      noteX = (IS_PHONE()) ? -30 : -30;
  histG.append("text")
    .html(histLabelText)
    .attr("x",histLabelX)
    .attr("y",histLabelY)
    .attr("class", "axisLabel histXAxisLabel")
  histG.append("text")
    .html("<tspan>Note:</tspan> Poverty rates among families with children ages 5&ndash;17.")
    .attr("x",noteX)
    .attr("y",histLabelY + 14)
    .attr("class", "note histNote")

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
    if(IS_PHONE()) return false;
    if((SECTION_INDEX() == "7" || SECTION_INDEX() == 8) && getScatterCat() != ""){
      if (!svg._voronoi) {
        svg._voronoi = d3.voronoi()
        .x(function(d) { return scatterPlotX(getScatterValue(d, "1995")); })
        .y(function(d) { return scatterPlotY(getScatterValue(d, "2014")); })
        (scatterplotData);
      }
      var p = d3.mouse(this), site;
      p[0] -= margin.left;
      p[1] -= margin.top+70;
      // don't react if the mouse is close to one of the axis
      if (p[0] < 5 || p[1] < 5) {
        site = null;
      } else {
        site = svg._voronoi.find(p[0], p[1], maxDistanceFromPoint);
      }
      if (site !== svg._tooltipped) {
        if (svg._tooltipped) removeScatterTooltip(svg._tooltipped.data)
        if (site) showScatterTooltip(site.data);
        svg._tooltipped = site;
      }
    }
    else if(SECTION_INDEX() < 4){
      var m = d3.mouse(this)
      showDotTooltip(m, SECTION_INDEX())
    }

  })
  .on("mouseout", function(){
    if(IS_PHONE()) return false;
    removeDotTooltip();
  })
  .on("click", function(){
    if(IS_PHONE()) return false;
    d3.event.stopPropagation();
    var groupSelector = (IS_PHONE() || IS_SHORT()) ? ".shortStateG" : ".stateG"
    if(SECTION_INDEX() < 4){
      var m = d3.mouse(this)
      var yCoord = m[1] - margin.top
      var states = dotChartY.domain()
      var band = dotChartY.step()
      for(var i = 0; i < states.length; i++){
        var state = dotChartY(states[i]);
        if(yCoord < (state + band/2) && yCoord > (state - band/2)){
          var selectedG = d3.selectAll(".highlightBar" + "." + states[i])
          selectedG.classed("dotChartClicked", ! selectedG.classed("dotChartClicked"))
          d3.select(".scatterDot." + states[i]).classed("scatterClicked",  selectedG.classed("dotChartClicked")).style("display","none")
          break;
        }          
      }
    }
    else if((SECTION_INDEX() == "7" || SECTION_INDEX() == 8) && getScatterCat() != ""){
      if (!svg._voronoi) {
        svg._voronoi = d3.voronoi()
        .x(function(d) { return scatterPlotX(getScatterValue(d, "1995")); })
        .y(function(d) { return scatterPlotY(getScatterValue(d, "2014")); })
        (scatterplotData);
      }
      var p = d3.mouse(this), site;
      p[0] -= margin.left;
      p[1] -= margin.top + 70;
      // don't react if the mouse is close to one of the axis
      if (p[0] < 5 || p[1] < 5) {
        site = null;
      } else {
        site = svg._voronoi.find(p[0], p[1], maxDistanceFromPoint);
      }
      d3.select(".scatterDot." + site.data.state).classed("scatterClicked",  ! d3.select(".scatterDot." + site.data.state).classed("scatterClicked"))
      d3.select(".highlightBar." + site.data.state).classed("dotChartClicked", ! ! d3.select(".scatterDot." + site.data.state).classed("scatterClicked"))
    }
    var clearColor = (d3.selectAll(".dotChartClicked").nodes().length == 0) ? "#9d9d9d" : "#1696d2";
    d3.select("#clearSelected").transition().style("color", clearColor)
  })

  d3.select("#clearSelected").on("click", function(){
    clearClicked();
  })
  $(document).keyup(function(e) {
       if (e.keyCode == 27) { // escape key maps to keycode `27`
          clearClicked();
      }
  });


function showScatterTooltip (d, i) {
  d3.select(".scatterDot." + d.state)
    .classed("scatterSelected", true)
  var ttX = scatterPlotX(getScatterValue(d, "1995")),
      ttY = scatterPlotY(getScatterValue(d, "2014")),
      newX = 0,
      newY = 0
  if( (ttX + 158) >= scatterPlotX.range()[1]){
    newX = ttX - (158+6)
    d3.select("#scatterTooltipContainer rect")
      .style("filter", "url(#drop-shadow-left)")
  }
  else{
    newX = ttX + 6
    d3.select("#scatterTooltipContainer rect")
      .style("filter", "url(#drop-shadow-right)")

  }
  d3.select("#scatterTooltipContainer").node().parentNode.appendChild(d3.select("#scatterTooltipContainer").node());
  d3.select("#scatterTooltipContainer")
    .style("opacity",1)
    .attr("transform", "translate(" + (newX) + "," + (ttY + 6) + ")")
  d3.select(".ratioText.y1995")
    .text(RATIOS(getScatterValue(d, "1995")))
  d3.select(".ratioText.y2014")
    .text(RATIOS(getScatterValue(d, "2014")))
  d3.select("#scatterTooltipContainer .stateName")
    .text(fullNames[d.state])

}
function removeScatterTooltip(d, i){
  d3.selectAll(".scatterClicked")
    .classed("scatterSelected", false)
  d3.select("#scatterTooltipContainer")
    .style("opacity",0)
  d3.selectAll(".scatterDot." + d.state)
    .classed("scatterSelected", false)
}
function showDotTooltip(m, sectionIndex){
    var groupSelector = (IS_PHONE() || IS_SHORT()) ? ".shortStateG" : ".stateG"
    var yCoord = m[1] - margin.top
    var states = dotChartY.domain()
    var band = dotChartY.step()
    
    
    for(var i = 0; i < states.length; i++){
      var state = dotChartY(states[i]);
      if(yCoord < (state + band/2) && yCoord > (state - band/2)){
        d3.selectAll(".dotChartSelected")
          .classed("dotChartSelected", false)
        if(sectionIndex == 3 && (states[i] != "NY" && states[i] != "FL") ){
          d3.selectAll(".highlightBar.FL.dotChartClicked")
            .classed("dotChartSelected", true)
          d3.selectAll(".highlightBar.NY.dotChartClicked")
            .classed("dotChartSelected", true)
          break
        }
        else{
          var selectedG = d3.selectAll(groupSelector + "." + states[i])
            .classed("dotChartSelected", true)
          selectedG.node().parentNode.appendChild(selectedG.node())
          d3.selectAll(".highlightBar." + states[i])
            .classed("dotChartSelected", true)
          if(sectionIndex != 3){
            d3.selectAll(".highlightBar.dotChartClicked")
              .classed("dotChartSelected", true)
          }else{
            d3.selectAll(".highlightBar.FL.dotChartClicked")
              .classed("dotChartSelected", true)
            d3.selectAll(".highlightBar.NY.dotChartClicked")
              .classed("dotChartSelected", true)
          }
        }
        // selectedG.select(".dotTooltip.stateValue")

        break;
      }
      // d3.selectAll(".dotTooltip")
    }
}
function clearClicked(){
  d3.select("#clearSelected").transition().style("color", "#9d9d9d")
  d3.selectAll(".dotChartClicked")
    .classed("dotChartClicked", false)
  d3.selectAll(".dotChartSelected")
    .classed("dotChartSelected", false)

  d3.selectAll(".scatterClicked")
    .classed("scatterClicked", false)
  d3.selectAll(".scatterSelected")
    .classed("scatterSelected", false)

}
function removeDotTooltip(){
  d3.selectAll(".dotChartSelected")
      .classed("dotChartSelected", false)
  if(SECTION_INDEX() < 4){
      if(SECTION_INDEX() == 3){
        d3.selectAll(".highlightBar.FL.dotChartClicked")
          .classed("dotChartSelected", true)
        d3.selectAll(".highlightBar.NY.dotChartClicked")
          .classed("dotChartSelected", true)
      }else{
        d3.selectAll(".dotChartClicked.highlightBar")
          .classed("dotChartSelected", true)
      }
  }
}

  };

var  drawOutlierLabels = function(cat, outliers){
  d3.selectAll(".scatterOutlierLabel").transition().style("opacity",0).on("end", function(){ d3.select(this).remove()}) 

  for(var j =0; j < outliers[cat].length; j++){
    var dot = d3.select(".scatterDot." +  outliers[cat][j]["state"])
    var lx = parseFloat(dot.attr("cx")) - 8
    var ly = parseFloat(dot.attr("cy")) + 6
    var position =  outliers[cat][j]["position"]
    if(position.search("N") != -1){ ly -= 11}
    if(position.search("S") != -1){ ly += 11}
    if(position.search("E") != -1){ lx += 11}
    if(position.search("W") != -1){ lx -= 11}
    var label = g.append("text")
      .attr("x",lx)
      .attr("y",ly)
      .attr("class","scatterOutlierLabel")
      .text(outliers[cat][j]["state"])
      .style("opacity",0)
    label.transition()
      .duration(1000)
      .style("opacity",1)
  }
}
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
    activateFunctions[3] = function(){ floridaNewYorkDots(dotChartData) };
    activateFunctions[4] = function(){ floridaTracts(histData) };
    activateFunctions[5] = function(){ floridaDistricts(histData) };
    activateFunctions[6] = function(){ newYorkTracts(histData) };
    activateFunctions[7] = function(){ newYorkDistricts(histData) };
    activateFunctions[8] = function(){ dotsOverTime(dotChartData) };

    d3.select("#floridaButton").on("click", function(){
      if(d3.select(this).classed("tracts")){
        d3.select(this)
          .classed("tracts",false)
          .classed("districts",true)
          .text("(click for district map)")
        floridaTracts(histData)  
      }else{
        floridaDistricts(histData)
      }
    })
    d3.select("#newYorkButton").on("click", function(){
      if(d3.select(this).classed("tracts")){
      d3.select("#newYorkButton")
        .classed("tracts",false)
        .classed("districts",true)
        .text("(click for district map)")
        newYorkTracts(histData)  
      }else{
        newYorkDistricts(histData)
      }
    })
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
    d3.selectAll(".shortStateG.noHighlight").transition().attr("transform",function(d){ return "translate(0," + (height-75) + ")" })

    d3.selectAll(".show2").classed("hidden", true)
    d3.selectAll(".show1").classed("hidden", true)
    d3.selectAll(".dotTooltipBg").transition().attr("height",44)

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
            d3.selectAll(".includeHighlight")
              .transition()
              .duration(1000)
              .attr("transform",function(d){ return "translate(0," + dotChartY(d.state) + ")" })
            g.select("#dotChartYAxis")
              .transition()
              .duration(1000)
              .call(d3.axisLeft(dotChartY).tickFormat(function(t){
                if(IS_PHONE()){
                  return t
                }else{
                  return fullNames[t]
                }
              }));
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
    d3.selectAll(".shortStateG.noHighlight").transition().attr("transform",function(d){ return "translate(0," + (height-125) + ")" })

    d3.selectAll(".show2").classed("hidden", true)
    d3.selectAll(".show1").classed("hidden", false)
    d3.selectAll(".dotTooltipBg").transition().attr("height",94)
    d3.selectAll(".totalValue").text(function(d){ return DOLLARS(d.stateRevenue + d.localRevenue)}).transition().attr("y", 84)
    d3.selectAll(".totalLabel").transition().attr("y", 84)
    d3.selectAll(".dotSumLine").transition().attr("y1", 64).attr("y2", 64)
    d3.selectAll(".dotSumPlus").transition().attr("y", 54)



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
    if(IS_PHONE()){
      d3.select(".legendStateText")
        .transition()
        .style("opacity",1)
        .attr("x",10)
        .attr("y",24)
      d3.select(".legendStateDot")
        .transition()
        .style("opacity",1)
        .attr("cx",0)
        .attr("cy",20)
    }else{
      d3.select(".legendStateText")
        .transition()
        .style("opacity",1)
        .attr("x",270)
        .attr("y",4)
      d3.select(".legendStateDot")
        .transition()
        .style("opacity",1)
        .attr("cx",260)
        .attr("cy",0)
    }
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
            d3.selectAll(".includeHighlight")
              .transition()
              .duration(1000)
              .attr("transform",function(d){ return "translate(0," + dotChartY(d.state) + ")" })
            g.select("#dotChartYAxis")
              .transition()
              .duration(1000)
              .call(d3.axisLeft(dotChartY).tickFormat(function(t){
                if(IS_PHONE()){
                  return t
                }else{
                  return fullNames[t]
                }
              }));
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
    d3.select("#vis svg").classed("nonInteractive", false)

    d3.select(".newYorkDistrictsImg").style("z-index",-1)
    d3.select(".newYorkTractsImg").style("z-index",-1)

    d3.selectAll(".dotChartClicked")
      .classed("dotChartSelected", true)

    d3.selectAll(".shortStateG.noHighlight").transition().attr("transform",function(d){ return "translate(0," + (height-145) + ")" })
    d3.selectAll(".show2").classed("hidden", false)
    d3.selectAll(".show1").classed("hidden", false)
    d3.selectAll(".dotTooltipBg").transition().attr("height",114)
    d3.selectAll(".totalValue").text(function(d){ return DOLLARS(d.federalRevenue + d.stateRevenue + d.localRevenue)}).transition().attr("y", 104)
    d3.selectAll(".totalLabel").transition().attr("y", 104)
    d3.selectAll(".dotSumLine").transition().attr("y1", 84).attr("y2", 84)
    d3.selectAll(".dotSumPlus").transition().attr("y", 74)


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
    if(IS_PHONE()){
      d3.select(".legendStateText")
        .transition()
        .style("opacity",1)
        .attr("x",10)
        .attr("y",24)
      d3.select(".legendStateDot")
        .transition()
        .style("opacity",1)
        .attr("cx",0)
        .attr("cy",20)
      d3.select(".legendFederalText")
        .transition()
        .style("opacity",1)
        .attr("x",195)
        .attr("y",24)
      d3.select(".legendFederalDot")
        .transition()
        .style("opacity",1)
        .attr("cx", 185)
        .attr("cy", 20)
    }else{
      d3.select(".legendStateText")
        .transition()
        .style("opacity",1)
        .attr("x",295)
        .attr("y",4)
      d3.select(".legendStateDot")
        .transition()
        .style("opacity",1)
        .attr("cx",285)
        .attr("cy",0)
      d3.select(".legendFederalText")
        .transition()
        .style("opacity",1)
        .attr("x",395)
        .attr("y",4)
      d3.select(".legendFederalDot")
        .transition()
        .style("opacity",1)
        .attr("cx", 385)
        .attr("cy", 0)
    }




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
            d3.selectAll(".includeHighlight")
              .transition()
              .duration(1000)
              .attr("transform",function(d){ return "translate(0," + dotChartY(d.state) + ")" })
            g.select("#dotChartYAxis")
              .transition()
              .duration(1000)
              .call(d3.axisLeft(dotChartY).tickFormat(function(t){
                if(IS_PHONE()){
                  return t
                }else{
                  return fullNames[t]
                }
              }));
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
    d3.select(".dotNote")
      .transition()
      .style("opacity",1)
    d3.select(".dotAxisXLabel")
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
      .style("z-index",-1)
    d3.select(".floridaDistrictsImg")
      .transition()
      .duration(500)
      .style("opacity",0)
      .style("z-index",-1)
    d3.selectAll(".mapElements")
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
  function floridaNewYorkDots(dotChartData){
    dotChartData.sort(function(a, b){ return (b.localRevenue + b.stateRevenue + b.federalRevenue) - (a.localRevenue + a.stateRevenue + a.federalRevenue)})
    dotChartY.domain(dotChartData.map(function(d) { return d.state; }));


    g.selectAll(".specialState .federalDot")
        .transition()
        .style("opacity",1)
        .attr("r",DOT_RADIUS)
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.federalRevenue/6000) })
        .attr("cx", function(d) { return dotChartX(d.federalRevenue); })

    g.selectAll(".specialState .federalLine")
        .transition()
        .style("opacity",1)
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.federalRevenue/6000) })
        .attr("x1", function(d) { return getDotChartLineX1(d.federalRevenue); })
        .attr("x2", function(d) { return getDotChartLineX2(d.federalRevenue); })

    g.selectAll(".specialState .totalDot")
        .transition()
        .style("opacity",1)
        .attr("r",SMALL_DOT_RADIUS)
        .transition()
        .ease(d3.easeLinear)
        .duration(function(d){ return 1000*Math.abs(d.federalRevenue/6000) })
        .attr("cx", function(d) { return dotChartX(d.stateRevenue + d.localRevenue + d.federalRevenue); })

    g.selectAll(".specialState .stateLine")
        .transition()
        .style("opacity",1)
        .attr("x1", function(d) { return getDotChartLineX1(d.stateRevenue); })
        .attr("x2", function(d) { return getDotChartLineX2(d.stateRevenue); })
    g.selectAll(".specialState .localLine")
        .transition()
        .style("opacity",1)
        .attr("x1", function(d) { return getDotChartLineX1(d.localRevenue); })
        .attr("x2", function(d) { return getDotChartLineX2(d.localRevenue); })
    g.selectAll(".specialState .stateDot")
        .transition()
        .style("opacity",1)
        .attr("r",DOT_RADIUS)
        .attr("cx", function(d) { return dotChartX(d.stateRevenue); })
    g.selectAll(".specialState .localDot")
        .transition()
        .style("opacity",1)
        .attr("r",DOT_RADIUS)
        .attr("cx", function(d) { return dotChartX(d.localRevenue); })

    d3.selectAll(".dotChartSelected:not(.FL):not(.NY)")
      .classed("dotChartSelected", false)
    d3.selectAll(".stateG:not(.FL):not(.NY) .dotChartDot")
      .transition()
      .duration(1000)
      .attr("cx", dotChartX(0))
      .transition()
      .style("opacity",0)
        .on("end", function(d, i){
          if(d.state == "AK"){
            d3.selectAll(".includeHighlight")
              .transition()
              .duration(1000)
              .attr("transform",function(d){ return "translate(0," + dotChartY(d.state) + ")" })
            g.select("#dotChartYAxis")
              .transition()
              .duration(1000)
              .call(d3.axisLeft(dotChartY).tickFormat(function(t){
                if(IS_PHONE()){
                  return t
                }else{
                  return fullNames[t]
                }
              }));
          }

        })

    d3.selectAll(".stateG:not(.FL):not(.NY) .dotChartLine")
      .transition()
      .duration(1000)
      .attr("x1", dotChartX(0))
      .attr("x2", dotChartX(0))
      .transition()
      .style("opacity",0)
    d3.selectAll("#dotChartYAxis .tick text")
      .transition()
      .style("opacity", function(d){
        if(d == "FL" || d == "NY"){ return 1; }
        else{ return 0; }
      }) 
    d3.select(".floridaTractsImg")
      .transition()
      .duration(500)
      .style("opacity",0)
      .style("z-index",-1)
    d3.select(".floridaDistrictsImg")
      .transition()
      .duration(500)
      .style("opacity",0)
      .style("z-index",-1)
    d3.selectAll(".mapElements")
      .transition()
      .duration(500)
      .style("opacity",0)

    d3.select(".zeroLine")
      .transition()
      .duration(1000)
      .style("opacity",1)
    d3.select(".dotNote")
      .transition()
      .duration(1000)
      .style("opacity",1)
    d3.select(".dotAxisXLabel")
      .transition()
      .duration(1000)
      .style("opacity",1)
    d3.select(".legend")
      .transition()
      .duration(1000)
      .style("opacity",1)
    d3.selectAll(".largeChartLabel")
      .transition()
      .duration(1000)
      .style("opacity",1)
    d3.select("#dotChartXAxis")
      .transition()
      .duration(1000)
      .style("opacity",1)

  }
  function floridaTracts(histData){

    d3.selectAll(".dotChartSelected")
      .classed("dotChartSelected", false)

    d3.select("#vis svg").classed("nonInteractive", true)

    d3.select(".newYorkDistrictsImg").style("z-index",2)
    d3.select(".newYorkTractsImg").style("z-index",2)

    d3.select("#histYLabel")
      .text("Number of neighborhoods")
      .transition()
      .attr("x",-30)
    d3.select(".histNote")
      .transition()
      .attr("x",-30)


    d3.select("#morphPath")
      .transition()
      .style("opacity",0)

    d3.selectAll(".stateG .dotChartDot")
      .transition()
      .duration(1000)
      .style("opacity",0)
    d3.selectAll(".stateG .dotChartLine")
      .transition()
      .duration(1000)
      .style("opacity",0)
    d3.selectAll("#dotChartYAxis .tick text")
      .transition()
      .duration(1000)
      .style("opacity",0)
    d3.select(".zeroLine")
      .transition()
      .duration(1000)
      .style("opacity",0)
    d3.select(".dotNote")
      .transition()
      .duration(1000)
      .style("opacity",0)
    d3.select(".dotAxisXLabel")
      .transition()
      .duration(1000)
      .style("opacity",0)

    d3.select(".legend")
      .transition()
      .duration(1000)
      .style("opacity",0)
    d3.selectAll(".largeChartLabel")
      .transition()
      .duration(1000)
      .style("opacity",0)
    d3.select("#dotChartXAxis")
      .transition()
      .duration(1000)
      .style("opacity",0)


    histY.domain([0, d3.max(histData, function(d) { return d.tractFlCount; })]);
    d3.selectAll(".mapElements")
      .transition()
      // .delay(1500)
      .duration(1000)
      .style("opacity",1)
    d3.select("#histYAxis")
      .transition()
      // .delay(1500)
      .duration(1000)
      .call(d3.axisLeft(histY).ticks(10, "s"))

    gridlines()

    d3.selectAll(".histBar")
      .transition()
      // .delay(1500)
      .duration(1000)
      .attr("y", function(d) { return histY(d.tractFlCount); })
      .attr("height", function(d) { return histHeight - histY(d.tractFlCount); })


    //draw map
    d3.select(".floridaDistrictsImg")
      .transition()
      .duration(500)
      .style("opacity",0)
      .style("z-index",2)

    d3.select(".floridaTractsImg")
      .transition()
      // .delay(1500)
      .duration(1000)
      .style("opacity",1)
      .style("z-index",2)
  }

  function floridaDistricts(histData){
    if(d3.select("#floridaButton").classed("districts")){
      d3.select("#floridaButton")
        .classed("tracts",true)
        .classed("districts",false)
        .text("(click for neighborhood map)")
      }

    var noteX = (IS_PHONE()) ? -30: -20
    d3.select("#histYLabel")
      .text("Number of districts")
      .transition()
      .attr("x",-20)
    d3.select(".histNote")
      .transition()
      .attr("x",noteX)

    d3.selectAll("#dotChartYAxis .tick text")
      .transition()
      .style("opacity", 0) 
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

    if (parseFloat(d3.select("#morphPath").style("opacity")) != 0 && ! IS_PHONE()){
      var coords = (IS_SHORT()) ? "translate(169,20)" : "translate(80,0)"
      d3.select("#morphG")
        .transition()
        .duration(1000)
        .attr("transform", coords)
      d3.select("#morphPath")
        .transition()
        .duration(1000)
        .attr("d", join(floridaMorphData))
        .style("fill","#12719e")
        .transition()
        .delay(1000)
        .duration(100)
        .style("opacity",0)

      d3.select("#morphCircles").selectAll("circle").data(floridaMorphData)
        .transition()
        .delay(100)
        .duration(1000)
        .attr("cx",function(d){
          return d[0];
        })
        .attr("cy",function(d){
          return d[1];
        });
        d3.select(".floridaTractsImg")
          .style("z-index",2)
          .transition()
          .delay(2100)
          .duration(100)
          .style("opacity",1)
        d3.select(".floridaDistrictsImg")
          .style("z-index",2)
          .transition()
          .delay(1100)
          .duration(1000)
          .style("opacity",1)
        d3.select(".newYorkTractsImg")
          .style("z-index",2)
          .transition()
          // .delay(1100)
          .duration(500)
          .style("opacity",0)
    }else{
      d3.select(".floridaTractsImg")
        .style("z-index",2)
        .transition()
        .duration(100)
        .style("opacity",1)
      d3.select(".floridaDistrictsImg")
        .style("z-index",2)
        .transition()
        .duration(2000)
        .style("opacity",1)
      d3.select(".newYorkTractsImg")
        .transition()
        .duration(500)
        .style("opacity",0)
    }




  }
  function newYorkTracts(histData){


    d3.select("#histYLabel")
      .text("Number of neighborhoods")
      .transition()
      .attr("x",-30)
    d3.select(".histNote")
      .transition()
      .attr("x",-30)

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

    if(! IS_PHONE()){
    var coords = (IS_SHORT()) ? "translate(170,-43)" : "translate(90,-73)"
      d3.select("#morphG")
        .transition()
        .duration(1000)
        .attr("transform", coords)

      d3.select("#morphPath")
        .transition()
        .duration(100)
        .style("opacity",1)
        .transition()
        .duration(1000)
        .attr("d", join(newYorkMorphData))
        .style("fill","#73bfe2");

      d3.select("#morphCircles").selectAll("circle").data(newYorkMorphData)
        .transition()
        .delay(100)
        .duration(1000)
        .attr("cx",function(d){
          return d[0];
        })
        .attr("cy",function(d){
          return d[1];
        });
    }

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
      .delay(800)
      .duration(1500)
      .style("opacity",1)
    d3.select(".newYorkDistrictsImg")
      .transition()
      .delay(800)
      .duration(1000)
      .style("opacity",0)

  }
  function newYorkDistricts(histData){
    if(d3.select("#newYorkButton").classed("districts")){
      d3.select("#newYorkButton")
        .classed("tracts",true)
        .classed("districts",false)
        .text("(click for neighborhood map)")
      }

    d3.select("#histYLabel")
      .text("Number of districts")

    // if(IS_PHONE()){
      g
        .transition()
        .attr('transform', 'translate(' + (margin.left+0) + ',' + margin.top + ')');
    // }else{
    //    g
    //     .transition()
    //     .attr('transform', 'translate(120,120)');
    // }
    d3.selectAll(".scatterOutlierLabel").transition().style("opacity",0)

    d3.selectAll(".scatterClicked").style("display", "none")

    d3.select(".floridaTractsImg").style("z-index",2)
    d3.select(".floridaDistrictsImg").style("z-index",2)
    d3.select(".newYorkTractsImg").style("z-index",2)

    d3.select("#scatterTooltipContainer")
      .style("opacity",0)

    d3.selectAll(".mapElements")
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
      .style("z-index",2)
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
    d3.selectAll(".scatterAxisLabel")
      .transition()
      .style("opacity",0)

    d3.selectAll(".scatterButton")
      .transition()
      .style("opacity",0)
      .on("end", function(){
        d3.select(this).classed("nonInteractive", true)
      })
    d3.select("#buttonContainer").transition().style("opacity",0).style("z-index",-1)

  }
  function dotsOverTime(){
    d3.selectAll(".scatterClicked").style("display", "block")

    d3.select("#morphPath")
      .transition()
      .style("opacity",0)

    if(IS_PHONE()){
      g
        .transition()
        .attr('transform', 'translate(' + (margin.left+20) + ',' + margin.top + ')');
    }else{
      g
        .transition()
        .attr('transform', 'translate(' + (margin.left) + ',' + (margin.top+70) + ')');
    }
    d3.select("#vis svg").classed("nonInteractive", false)

    d3.select(".floridaTractsImg").style("z-index",-1)
    d3.select(".floridaDistrictsImg").style("z-index",-1)

    d3.selectAll(".mapElements")
      .transition()
      .duration(500)
      .style("opacity",0)
    d3.select(".newYorkDistrictsImg")
      .transition()
      .duration(500)
      .style("opacity",0)
      .style("z-index",-1)
    d3.select(".newYorkTractsImg")
      .transition()
      .duration(500)
      .style("opacity",0)
      .style("z-index",-1)

    g.selectAll(".scatterDot")
        .transition()
        .style("opacity",.5)
        .transition()
        .duration(1000)
        .ease(d3.easeElastic)
        .attr("cx", function(d){ return scatterPlotX(getScatterValue(d, "1995")) })
        .attr("cy", function(d){ return scatterPlotY(getScatterValue(d, "2014")) })
        .on("end", function(d, i){
          if(i == 48){
            drawOutlierLabels(cat, outliers)
          }
        })

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
    d3.selectAll(".scatterAxisLabel")
      .transition()
      .style("opacity",1)

    var cat = getScatterCat();

    d3.selectAll(".scatterButton")
      .classed("nonInteractive", false)
      .transition()
      .duration(1000)
      .style("opacity",1)
    d3.select("#buttonContainer")
      .transition()
      .duration(1000)
      .style("opacity",1)
      .style("z-index",2)
    
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
      // .style("top", function(){
      //   if(IS_PHONE()){
      //     return ( (window.innerHeight - PHONE_VIS_HEIGHT - margin.top - margin.bottom)*.5 ) + "px"
      //   }
      //   if(IS_MOBILE()){
      //     return ( (window.innerHeight - VIS_HEIGHT - margin.top - margin.bottom)*.5 ) + "px"
      //   }else{
      //     return "20px"
      //   }
      // })
    .datum([dotChartData, scatterplotData, histData])
    .call(plot);

  // setup scroll functionality
  var scroll = scroller()
    .container(d3.select('#graphic'));

  // pass in .step selection as the steps
  scroll(d3.selectAll('.step'));

  scroll.on('resized', function(){
    d3.select("#vis svg").remove()
    d3.selectAll(".scatterButton").remove()
    d3.select("#buttonContainer").remove()
    d3.selectAll(".mapImg").remove()
    display(dotChartData, scatterplotData, histData)
  })

  // setup event handling
  scroll.on('active', function (index) {
    // highlight current step text
    var offOpacity = (IS_MOBILE()) ? 1 : .1
    d3.selectAll('.step')
      .style('opacity', function (d, i) { return i === index ? 1 : offOpacity; });
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
