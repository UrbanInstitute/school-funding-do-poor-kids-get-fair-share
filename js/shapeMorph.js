  function updateCircles(sel) {

    var circles = sel.selectAll("circle.morph")
      .data(function(d){ return d; });

    var merged = circles.enter()
      .append("circle")
      .attr("class", "morph")
      .attr("r", 2)
      .merge(circles);

    merged.classed("added", function(d){
        return d.added;
      })
      .attr("cx",function(d){
        return d[0];
      })
      .attr("cy",function(d){
        return d[1];
      });

    circles.exit().remove();

  }

  function addPoints(ring, numPoints) {

    var desiredLength = ring.length + numPoints,
        step = d3.polygonLength(ring) / numPoints;

    var i = 0,
        cursor = 0,
        insertAt = step / 2;

    do {

      var a = ring[i],
          b = ring[(i + 1) % ring.length];

      var segment = distanceBetween(a, b);

      if (insertAt <= cursor + segment) {
        ring.splice(i + 1, 0, pointBetween(a, b, (insertAt - cursor) / segment));
        insertAt += step;
        continue;
      }

      cursor += segment;
      i++;

    } while (ring.length < desiredLength);

  }

  function pointBetween(a, b, pct) {

    var point = [
      a[0] + (b[0] - a[0]) * pct,
      a[1] + (b[1] - a[1]) * pct
    ];

    point.added = true;
    return point;

  }

  function distanceBetween(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  }

  function join(d) {
    return "M" + d.join("L") + "Z";
  }

  function wind(ring, vs) {

    var len = ring.length,
        min = Infinity,
        bestOffset,
        sum;

    for (var offset = 0, len = ring.length; offset < len; offset++) {

      var sum = d3.sum(vs.map(function(p, i){
        var distance = distanceBetween(ring[(offset + i) % len], p);
        return distance * distance;
      }));

      if (sum < min) {
        min = sum;
        bestOffset = offset;
      }

    }

    return ring.slice(bestOffset).concat(ring.slice(0, bestOffset));

  }