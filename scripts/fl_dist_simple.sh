 # Run from the `florida/districts` directory

rm -rf subset.*

rm -rf subset_simple.*

rm -rf subset_reproj.*

rm -rf *.json

rm -rf *.ndjson


# ogr2ogr -where "STATEFP = '12'" subset.shp us_sd_uni_2015.shp

# ogr2ogr subset_simple.shp subset.shp -simplify 10

# ogr2ogr -f "ESRI Shapefile" subset_reproj.shp tl_2014_12_unsd.shp -s_srs EPSG:102003 -t_srs EPSG:26960

shp2json tl_2014_12_unsd.shp -o fl_dist.json

# mv fl_dist.json fl_dist_albers.json

geoproject 'd3.geoTransverseMercator().rotate([81, -24 - 20 / 60]).fitSize([600, 720], d)' < fl_dist.json > fl_dist_albers.json

ndjson-split 'd.features' \
  < fl_dist_albers.json \
  > fl_dist_albers.ndjson

ndjson-map 'd.id = d.properties.GEOID.slice(2), d' \
  < fl_dist_albers.ndjson \
  > fl_dist_albers-id.ndjson

csv2json ../../../Poverty_schdist_fl.csv poverty_dist.json

ndjson-cat poverty_dist.json \
  | ndjson-split 'd.slice(0)' \
  | ndjson-map '{id: (d["GISJOIN"]).substring(4), poverty: +d["Percent_Pov_Fam5_17"]}' \
  > percent_poverty.ndjson

ndjson-join 'd.id' \
  fl_dist_albers-id.ndjson \
  percent_poverty.ndjson \
  > fl_dist-albers-join.ndjson

ndjson-map 'd[0].properties = {poverty: d[1].poverty}, d[0]' \
  < fl_dist-albers-join.ndjson \
  > fl_dist-albers-joined.ndjson


ndjson-reduce \
  < fl_dist-albers-joined.ndjson \
  | ndjson-map '{type: "FeatureCollection", features: d}' \
  > ../../../geojson/fl_dist_map.json

topojson -o ../../../topojson/fl_dist_map.json ../../../geojson/fl_dist_map.json -p


