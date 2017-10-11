var centroidGl;
var map;
var gl;
var canvasLayer;
var mapMatrix = new Float32Array(16);
var pixelsToWebGLMatrix = new Float32Array(16);
var gui;
var timeSlider;

var mapOptions = {
  zoom: 2,
  center: new google.maps.LatLng(0.0, 0.0),
  styles: mapStyles
};

var canvasLayerOptions = {
  resizeHandler: resize,
  animate: true,
  updateHandler: update
};

function resize() {
  var w = gl.canvas.width;
  var h = gl.canvas.height;
  gl.viewport(0, 0, w, h);
  pixelsToWebGLMatrix.set([2/w, 0,   0, 0,
    0,  -2/h, 0, 0,
    0,   0,   0, 0,
    -1,   1,   0, 1]);
}

function update() {
  var mapProjection = map.getProjection();
  mapMatrix.set(pixelsToWebGLMatrix);
  var scale = canvasLayer.getMapScale();
  scaleMatrix(mapMatrix, scale, scale);
  var translation = canvasLayer.getMapTranslation();
  translateMatrix(mapMatrix, translation.x, translation.y);  

  var currentTime = timeSlider.getCurrentTime();
  var currentYear = new Date(currentTime).getUTCFullYear();
  var start = new Date(currentYear + '-01-01');
  var end = new Date(currentYear + '-12-31');
  var t = 1.0 - (end.getTime() - currentTime) / (end.getTime() - start.getTime());
  centroidGl.draw(mapMatrix, {'t': t});
  timeSlider.animate();
}

function initTimeSlider(opts) {
  var startTime = new Date("1970-01-01").getTime();
  var endTime = new Date("2016-12-31").getTime();
  if (typeof(opts) != "undefined") {
    if (opts.startTime) {
      startTime = opts.startTime;
    }
    if (opts.endTime) {
      endTime = opts.endTime;
    }

  }
  var timeSlider = new TimeSlider({
    startTime: startTime,
    endTime: endTime,
    dwellAnimationTime: 2 * 1000,
    increment: 24*60*60*1000,
    formatCurrentTime: function(date) {
      return date.yyyymmdd();
    },
    animationRate: {
      fast: 10,
      medium: 20,
      slow: 40
    }
  });  
  return timeSlider;
}

function init() {
  var mapDiv = document.getElementById('map-div');

  map = new google.maps.Map(mapDiv, mapOptions);
  canvasLayerOptions.map = map;
  canvasLayer = new CanvasLayer(canvasLayerOptions);

  timeSlider = initTimeSlider();

  gl = canvasLayer.canvas.getContext('experimental-webgl');
  gl.getExtension("OES_standard_derivatives");

  centroidGl = new CentroidGl(gl);
  centroidGl.image = new Image();
  centroidGl.image.src = '../data/points.png';
  centroidGl.image.onload = function() {
    var points = [];
    for (var y = 0; y < 220; y++) {
      for (var x = 0; x < 220; x++) {
        points.push(x/219);        
        points.push(y/219);        
      }

    }
    centroidGl.setBuffer(new Float32Array(points));    
  }

/*  flowGl.getJson('../data/totals-1984.json', function(data) {
    function getRandomEpoch(year) {
      var month = getRandomIntInclusive(1,12);
      var day = getRandomIntInclusive(1,28);
      var date = new Date(year.toString() + '-' + month.toString() + '-' + day.toString());
      return date.getTime()/1000.0;
    } 
    function getRandomIntInclusive(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
    }

    function doSomething(data) {
      var points = [];
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i]['delta']; j++) {
          points.push(data[i]['org_idx']);
          points.push(data[i]['dst_idx']);
          points.push(getRandomIntInclusive(1,255));
          points.push(getRandomIntInclusive(1,255));        
          points.push(getRandomEpoch(1984));
          points.push(getRandomEpoch(1984));
         
        }

      }
      return points;
    }

    var t0 = performance.now();
    var points = doSomething(data);
    var t1 = performance.now();
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
    console.log(points.length);
  })
*/
  //gui = new dat.GUI();
  //gui.add(gtdGl, 'show0Casualties');

 }

document.addEventListener('DOMContentLoaded', init, false);
