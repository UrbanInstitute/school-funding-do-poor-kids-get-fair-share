var IS_SHORT = function(){
  return (d3.select("#isShort").style("display") == "block")
}
var IS_PHONE = function(){
  return (d3.select("#isPhone").style("display") == "block")
}
var IS_MOBILE = function(){
  return (d3.select("#isMobile").style("display") == "block")
}
var SECTION_INDEX = function(){
  return d3.select("#sectionIndex").attr("data-index")
}

var IS_IE = false;
function getInternetExplorerVersion()
{
  var rv = -1;
  if (navigator.appName == 'Microsoft Internet Explorer')
  {
    var ua = navigator.userAgent;
    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  else if (navigator.appName == 'Netscape')
  {
    var ua = navigator.userAgent;
    var re  = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}

var PHONE_VIS_WIDTH = 230;
var PHONE_VIS_HEIGHT = 400;
var SHORT_VIS_WIDTH = 600;
var SHORT_VIS_HEIGHT = 520;
var SHORT_SCATTER_WIDTH = 480;
var PHONE_SCATTER_WIDTH = 235
var VIS_WIDTH = 600;
var VIS_HEIGHT = 680;


var MARGIN = { top: 60, left: 120, bottom: 104, right: 20 };
var PHONE_MARGIN = { top: 100, left: 30, bottom: 30, right: 30 };



var desktopHistMargin = {top: 20, right: 20, bottom: 120, left: 120},
  desktopHistWidth = 600 - desktopHistMargin.left - desktopHistMargin.right,
  desktopHistHeight = 380 - desktopHistMargin.top - desktopHistMargin.bottom;
var phoneHistMargin = {top: 20, right: 20, bottom: 40, left: 35},
  phoneHistWidth = 300 - phoneHistMargin.left - phoneHistMargin.right,
  phoneHistHeight = 210 - phoneHistMargin.top - phoneHistMargin.bottom;
var histBinWidth = 5;


var margin = ( IS_PHONE() ) ? PHONE_MARGIN : MARGIN;
var DOT_RADIUS = (IS_PHONE()) ? 4 : 5;
var SMALL_DOT_RADIUS = (IS_PHONE()) ? 2 : 3;
var histMargin = (IS_PHONE()) ? phoneHistMargin : desktopHistMargin;
var histWidth = (IS_PHONE()) ? phoneHistWidth : desktopHistWidth;
var histHeight = (IS_PHONE()) ? phoneHistHeight : desktopHistHeight;

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

var DOLLARS = d3.format("$,.0f")
var RATIOS = d3.format(".2f")