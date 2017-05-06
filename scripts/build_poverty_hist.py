import csv

cr_tract_fl = csv.reader(open("../data/Poverty_tract_fl.csv", "rU"))
cr_dist_fl = csv.reader(open("../data/Poverty_schdist_fl.csv", "rU"))
cr_tract_ny = csv.reader(open("../data/Poverty_tract_ny.csv", "rU"))
cr_dist_ny = csv.reader(open("../data/Poverty_schdist_ny.csv", "rU"))

data = {"tract_fl": {} , "dist_fl": {}, "tract_ny": {}, "dist_ny": {}}
binWidth = .05


for dataKey in data:
	for i in range(0, int(1/binWidth)):
		data[dataKey][str(i*binWidth)] = 0
# print data

def buildHist(cr, dataKey, colNum):
	head = cr.next()
	for row in cr:
		if row[colNum] == -99:
			poverty = -1.0
		else:
			poverty = float(row[colNum])
		for i in range(0, int(1/binWidth)):
			leftBin = i*binWidth
			if(poverty >= leftBin and poverty < leftBin + binWidth):
				binKey = str(leftBin)
				data[dataKey][binKey] += 1
				break

buildHist(cr_tract_fl, "tract_fl",7)
buildHist(cr_tract_ny, "tract_ny",7)
buildHist(cr_dist_fl, "dist_fl",5)
buildHist(cr_dist_ny, "dist_ny",5)
print data

cw = csv.writer(open("../data/poverty_histogram_data.csv", "wb"))

cw.writerow(["bin", "tract_fl_count", "dist_fl_count", "tract_ny_count", "dist_ny_count"])

for i in range(0, int(1/binWidth)):
	row = []
	leftBin = str(i*binWidth)
	row.append(int(i*binWidth*100))
	row.append(data["tract_fl"][leftBin])
	row.append(data["dist_fl"][leftBin])
	row.append(data["tract_ny"][leftBin])
	row.append(data["dist_ny"][leftBin])
	cw.writerow(row)