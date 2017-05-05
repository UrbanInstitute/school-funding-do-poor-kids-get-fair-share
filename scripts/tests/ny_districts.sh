 # Run from the `florida/districts` directory

# rm -rf subset.*

# rm -rf subset_simple.*

# ogr2ogr -where "STATEFP = '12'" subset.shp us_sd_uni_2015.shp

# ogr2ogr subset_simple.shp subset.shp -simplify 1

shp2json SchoolDistricts_2016_v2.shp.shp -o ny_dist.json

geoproject 'd3.geoTransverseMercator().rotate([74 + 30 / 60, -38 - 50 / 60]).fitSize([600, 720], d)' < ny_dist.json > ny_dist_albers.json

ndjson-split 'd.features' \
  < ny_dist_albers.json \
  > ny_dist_albers.ndjson

ndjson-map 'd.id = d.properties.GEOID.slice(2), d' \
  < ny_dist_albers.ndjson \
  > ny_dist_albers-id.ndjson

csv2json ../../../Poverty_schdist_ny.csv poverty_dist.json

ndjson-cat poverty_dist.json \
  | ndjson-split 'd.slice(1)' \
  | ndjson-map '{id: (d["GISJOIN"]).substring(4), poverty: +d["Percent_Pov_Fam5_17"]}' \
  > percent_poverty.ndjson

ndjson-join 'd.id' \
  ny_dist_albers-id.ndjson \
  percent_poverty.ndjson \
  > ny_dist-albers-join.ndjson

ndjson-map 'd[0].properties = {poverty: d[1].poverty}, d[0]' \
  < ny_dist-albers-join.ndjson \
  > ny_dist-albers-joined.ndjson


ndjson-reduce \
  < ny_dist-albers-joined.ndjson \
  | ndjson-map '{type: "FeatureCollection", features: d}' \
  > ../../../geojson/ny_dist_map.json

topojson -o ../../../topojson/ny_dist_map.json ../../../geojson/ny_dist_map.json -p


