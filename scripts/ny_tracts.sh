# Run from the `florida/tracts` directory

curl 'https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_36_tract_500k.zip' -o cb_2015_36_tract_500k.zip

unzip -o cb_2015_36_tract_500k.zip

shp2json cb_2015_36_tract_500k.shp -o ny_tract.json

geoproject 'd3.geoTransverseMercator().rotate([74 + 30 / 60, -38 - 50 / 60]).fitSize([600, 720], d)' < ny_tract.json > ny_tract_albers.json

ndjson-split 'd.features' \
  < ny_tract_albers.json \
  > ny_tract_albers.ndjson

ndjson-map 'd.id = d.properties.GEOID.slice(2), d' \
  < ny_tract_albers.ndjson \
  > ny_tract_albers-id.ndjson

csv2json ../../../Poverty_tract_ny.csv poverty_tract.json

ndjson-cat poverty_tract.json \
  | ndjson-split 'd.slice(0)' \
  | ndjson-map '{id: ("000"+d["COUNTYFP"]).slice(-3) + ("000000"+d["TRACTCE"]).slice(-6), poverty: +d["Percent_Pov_Fam5_17"]}' \
  > percent_poverty.ndjson

ndjson-join 'd.id' \
  ny_tract_albers-id.ndjson \
  percent_poverty.ndjson \
  > ny_tract-albers-join.ndjson

ndjson-map 'd[0].properties = {poverty: d[1].poverty}, d[0]' \
  < ny_tract-albers-join.ndjson \
  > ny_tract-albers-joined.ndjson


ndjson-reduce \
  < ny_tract-albers-joined.ndjson \
  | ndjson-map '{type: "FeatureCollection", features: d}' \
  > ../../../geojson/ny_tract_map.json

topojson -o ../../../topojson/ny_tract_map.json ../../../geojson/ny_tract_map.json -p


