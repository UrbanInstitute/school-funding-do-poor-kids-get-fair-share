ogr2ogr -f 'ESRI Shapefile' new.shp ../tracts/cb_2015_12_tract_500k.shp
ogr2ogr -f 'ESRI Shapefile' new.shp -update -append ../districts/tl_2014_12_unsd.shp

