  var IS_PHONE = function(){
    return (d3.select("#isPhone").style("display") == "block")
  }
  var IS_MOBILE = function(){
    return (d3.select("#isMobile").style("display") == "block")
  }
  var SECTION_INDEX = function(){
    return d3.select("#sectionIndex").attr("data-index")
  }

  var PHONE_VIS_WIDTH = 330;
  var PHONE_VIS_HEIGHT = 460;
  var VIS_WIDTH = 600;
  var VIS_HEIGHT = 700;

  var DOT_RADIUS = 5;
  var SMALL_DOT_RADIUS = 3;

  var margin = { top: 60, left: 120, bottom: 40, right: 20 };

  var histMargin = {top: 20, right: 20, bottom: 120, left: 120},
    histWidth = 600 - histMargin.left - histMargin.right,
    histHeight = 380 - histMargin.top - histMargin.bottom,
    histBinWidth = 5;


  var fullNames = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "DC": "District of Columbia",
    "FL": "Florida",
    "GA": "Georgia",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PA": "Pennsylvania",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
  }

  var mapColor = d3.scaleThreshold()
      .domain([0,.05, .1, .15, .2, .25, .3,.35,.4])
      .range(["#9d9d9d","#cfe8f3","#a2d4ec","#73bfe2","#46abdb","#1696d2","#12719e","#0a4c6a","#062635","#000"]);
