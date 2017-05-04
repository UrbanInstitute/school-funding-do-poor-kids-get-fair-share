# Run from the `florida/tracts` directory

curl 'https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_12_tract_500k.zip' -o cb_2015_12_tract_500k.zip

unzip -o cb_2015_12_tract_500k.zip

shp2json cb_2015_12_tract_500k.shp -o fl_tract.json

geoproject 'd3.geoConicConformal().parallels([29 + 35 / 60, 30 + 45 / 60]).rotate([84 + 30 / 60, -29]).fitSize([600, 720], d)' < fl_tract.json > fl_tract_albers.json

geo2svg -w 960 -h 960 < fl_tract_albers.json > fl_tract_albers.svg

ndjson-split 'd.features' \
  < fl_tract_albers.json \
  > fl_tract_albers.ndjson

ndjson-map 'd.id = d.properties.GEOID.slice(2), d' \
  < fl_tract_albers.ndjson \
  > fl_tract_albers-id.ndjson

csv2json ../../../Poverty_tract_fl.csv poverty_tract.json

ndjson-cat poverty_tract.json \
  | ndjson-split 'd.slice(0)' \
  | ndjson-map '{id: ("000"+d["COUNTYFP"]).slice(-3) + ("000000"+d["TRACTCE"]).slice(-6), poverty: +d["Percent_Pov_Fam5_17"]}' \
  > percent_poverty.ndjson

ndjson-join 'd.id' \
  fl_tract_albers-id.ndjson \
  percent_poverty.ndjson \
  > fl_tract-albers-join.ndjson

ndjson-map 'd[0].properties = {poverty: d[1].poverty}, d[0]' \
  < fl_tract-albers-join.ndjson \
  > fl_tract-albers-joined.ndjson


ndjson-reduce \
  < fl_tract-albers-joined.ndjson \
  | ndjson-map '{type: "FeatureCollection", features: d}' \
  > ../../../geojson/fl_tract_map.json

topojson -o ../../../topojson/fl_tract_map.json ../../../geojson/fl_tract_map.json -p


