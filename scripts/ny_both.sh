curl 'https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_36_tract_500k.zip' -o cb_2015_36_tract_500k.zip

unzip -o cb_2015_36_tract_500k.zip


rm -rf subset.*

rm -rf subset_simple.*

rm -rf new.*

# ogr2ogr -where "STATEFP = '36'" subset.shp us_sd_uni_2015.shp
# ogr2ogr subset_simple.shp subset.shp -simplify 1


ogr2ogr -f 'ESRI Shapefile' new.shp cb_2015_36_tract_500k.shp
ogr2ogr -f 'ESRI Shapefile' new.shp -update -append tl_2014_36_unsd.shp

shp2json new.shp -o ny_1.json

geoproject 'd3.geoTransverseMercator().rotate([74 + 30 / 60, -38 - 50 / 60]).fitSize([600, 720], d)' < ny_1.json > ny_2.json

ndjson-split 'd.features' \
  < ny_2.json \
  > ny_2.ndjson

ndjson-map 'd.id = d.properties.GEOID.slice(2), d' \
  < ny_2.ndjson \
  > ny_3.ndjson

csv2json ../../../Poverty_tract_ny.csv poverty_tract.json

ndjson-cat poverty_tract.json \
  | ndjson-split 'd.slice(0)' \
  | ndjson-map '{id: ("000"+d["COUNTYFP"]).slice(-3) + ("000000"+d["TRACTCE"]).slice(-6), poverty: +d["Percent_Pov_Fam5_17"]}' \
  > percent_poverty_tract.ndjson

csv2json ../../../Poverty_schdist_ny.csv poverty_dist.json

ndjson-cat poverty_dist.json \
  | ndjson-split 'd.slice(0)' \
  | ndjson-map '{id: (d["GISJOIN"]).substring(4), poverty: +d["Percent_Pov_Fam5_17"]}' \
  > percent_poverty_dist.ndjson

ndjson-join 'd.id' \
  ny_3.ndjson \
  percent_poverty_dist.ndjson \
  > ny_4-d.ndjson

ndjson-join 'd.id' \
  ny_3.ndjson \
  percent_poverty_tract.ndjson \
  > ny_4-t.ndjson  

ndjson-map 'd[0].properties = {poverty: d[1].poverty}, d[0]' \
  < ny_4-d.ndjson \
  > ny_5-d.ndjson

ndjson-reduce \
  < ny_5-d.ndjson \
  | ndjson-map '{type: "FeatureCollection", features: d}' \
  > ny_dist_map.json

ndjson-map 'd[0].properties = {poverty: d[1].poverty}, d[0]' \
  < ny_4-t.ndjson \
  > ny_5-t.ndjson

ndjson-reduce \
  < ny_5-t.ndjson \
  | ndjson-map '{type: "FeatureCollection", features: d}' \
  > ny_tract_map.json


topojson -o ../../../topojson/ny_tract_map.json ny_tract_map.json -p
topojson -o ../../../topojson/ny_dist_map.json ny_dist_map.json -p
