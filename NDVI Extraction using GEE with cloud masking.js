// To Extract NDVI for AOI using LANDSAT8 Tire1 level2 data



// Load Shapefile
var ch_aoi = ee.FeatureCollection('users/akashsatyukt/Chikbalapura_vilaage');

// filter area of interest (aoi) from shapefile
var filter = ee.Filter.inList('NAME_11',['Yerramaranahalli']);
var Yerramaranahalli = ch_aoi.filter(filter);

// Load aoi as map
Map.addLayer(Yerramaranahalli,{},'Yerramaranahalli');


//Load Landsat images for composite
var L8= ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
.filterBounds(Yerramaranahalli)
.filterDate('2013-01-01','2021-10-01').sort('CLOUD_COVER',false);

// Temporally composite the images with a maximum value function.
var visParams = {bands: ['SR_B5', 'SR_B4', 'SR_B3'], min:0,max: 1000};
Map.addLayer(L8, visParams, 'max value composite');

var getQABits = function(image, start, end, newName) {
    // Compute the bits we need to extract.
    var pattern = 0;
    for (var i = start; i <= end; i++) {
       pattern += Math.pow(2, i);
    }
    // Return a single band image of the extracted QA bits, giving the band
    // a new name.
    return image.select([0], [newName])
                  .bitwiseAnd(pattern)
                  .rightShift(start);
};

// A function to mask out cloudy pixels.
var cloud_shadows = function(image) {
  // Select the QA band.
  var QA = image.select(['QA_PIXEL']);
  // Get the internal_cloud_algorithm_flag bit.
  return getQABits(QA, 3,3, 'cloud_shadows').eq(0);
  // Return an image masking out cloudy areas.
};

// A function to mask out cloudy pixels.
var clouds = function(image) {
  // Select the QA band.
  var QA = image.select(['QA_PIXEL']);
  // Get the internal_cloud_algorithm_flag bit.
  return getQABits(QA, 5,5, 'Cloud').eq(0);
  // Return an image masking out cloudy areas.
};

var maskClouds = function(image) {
  var cs = cloud_shadows(image);
  var c = clouds(image);
  image = image.updateMask(cs);
  return image.updateMask(c);
};

var cloud_free_data = L8.map(maskClouds);

Map.addLayer(cloud_free_data,visParams, 'composite collection without clouds');


function addNDVI(image) {
  var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']);
  return image.addBands(ndvi);
}


var filtered = cloud_free_data.filterDate('2015-06-01', '2021-10-30');

var with_ndvi = filtered.map(addNDVI);

var greenest = with_ndvi.qualityMosaic('nd');

// To plot NDVI Time Series Graph

print(Chart.image.series(with_ndvi.select('nd'), Yerramaranahalli).setOptions(
  {title:'Chakavelu',
  hAxis: {
    title: 'Date',
    titleTextStyle: {italic: false, bold: true}
  },
  vAxis: {
    title: 'NDVI',
    titleTextStyle: {italic: false, bold: true}
  }
})
);

Map.centerObject(Yerramaranahalli,12);


