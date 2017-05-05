curl 'https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_12_tract_500k.zip' -o cb_2015_12_tract_500k.zip
curl 'https://www2.census.gov/geo/tiger/TIGER2014/UNSD/tl_2014_12_unsd.zip' -o tl_2014_12_unsd.zip

unzip -o cb_2015_12_tract_500k.zip
unzip -o tl_2014_12_unsd.zip

rm -rf subset.*

rm -rf subset_simple.*

rm -rf new.*

rm -rf *.json

rm -rf *.ndjson

ogr2ogr -f 'ESRI Shapefile' new.shp cb_2015_12_tract_500k.shp
ogr2ogr -f 'ESRI Shapefile' new.shp -update -append tl_2014_12_unsd.shp

shp2json new.shp -o fl_1.json

geoproject 'd3.geoTransverseMercator().rotate([74 + 30 / 60, -38 - 50 / 60]).fitSize([600, 720], d)' < fl_1.json > fl_2.json

ndjson-split 'd.features' \
  < fl_2.json \
  > fl_2.ndjson

ndjson-map 'd.id = d.properties.GEOID.slice(2), d' \
  < fl_2.ndjson \
  > fl_3.ndjson

csv2json ../../../Poverty_tract_fl.csv poverty_tract.json

ndjson-cat poverty_tract.json \
  | ndjson-split 'd.slice(0)' \
  | ndjson-map '{id: ("000"+d["COUNTYFP"]).slice(-3) + ("000000"+d["TRACTCE"]).slice(-6), poverty: +d["Percent_Pov_Fam5_17"]}' \
  > percent_poverty_tract.ndjson

csv2json ../../../Poverty_schdist_fl.csv poverty_dist.json

ndjson-cat poverty_dist.json \
  | ndjson-split 'd.slice(0)' \
  | ndjson-map '{id: (d["GISJOIN"]).substring(4), poverty: +d["Percent_Pov_Fam5_17"]}' \
  > percent_poverty_dist.ndjson

ndjson-join 'd.id' \
  fl_3.ndjson \
  percent_poverty_dist.ndjson \
  > fl_4-d.ndjson

ndjson-join 'd.id' \
  fl_3.ndjson \
  percent_poverty_tract.ndjson \
  > fl_4-t.ndjson  

ndjson-map 'd[0].properties = {poverty: d[1].poverty}, d[0]' \
  < fl_4-d.ndjson \
  > fl_5-d.ndjson

ndjson-reduce \
  < fl_5-d.ndjson \
  | ndjson-map '{type: "FeatureCollection", features: d}' \
  > fl_dist_map.json

ndjson-map 'd[0].properties = {poverty: d[1].poverty}, d[0]' \
  < fl_4-t.ndjson \
  > fl_5-t.ndjson

ndjson-reduce \
  < fl_5-t.ndjson \
  | ndjson-map '{type: "FeatureCollection", features: d}' \
  > fl_tract_map.json


topojson -o ../../../topojson/fl_tract_map.json fl_tract_map.json -p
topojson -o ../../../topojson/fl_dist_map.json fl_dist_map.json -p

#load in map.html
#svg crowbar
#open in illustrator
#export as png, use artboards, medium (150ppi) quality, transparent bg
