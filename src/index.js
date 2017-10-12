var centroidGl;
var flowGl;
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
  //centroidGl.draw(mapMatrix, {'t': t});
  flowGl.draw(mapMatrix, {'epoch': currentTime/1000.0});
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

  flowGl = new FlowGl(gl);
  flowGl.image = new Image();
  flowGl.image.src = '../data/points.png';
  flowGl.image.onload = function() {
    flowGl.getJson('../data/totals-1984.json', function(data) {
      function shuffle (array) {
        var i = 0
          , j = 0
          , temp = null

        for (i = array.length - 1; i > 0; i -= 1) {
          j = Math.floor(Math.random() * (i + 1))
          temp = array[i]
          array[i] = array[j]
          array[j] = temp
        }
      }

      function getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
      }

      function doSomething(data) {
        var points = [];
        var startDateMin = new Date('1983-9-1').getTime()/1000.;
        var startDateMax = new Date('1984-11-1').getTime()/1000.;
        var endDateMin = new Date('1984-1-31').getTime()/1000.;
        var endDateMax = new Date('1984-12-31').getTime()/1000.;

        for (var i = 0; i < data.length; i++) {
          for (var j = 0; j < data[i]['delta']; j++) {
            var start_epoch = getRandomIntInclusive(startDateMin, startDateMax);
            var end_epoch = getRandomIntInclusive(endDateMin, endDateMax);
            if (start_epoch > end_epoch) {
              var temp = end_epoch;
              end_epoch = start_epoch;
              start_epoch = temp;
            }
/*            var point = {
              'org_idx': data[i]['org_idx'],
              'dst_idx': data[i]['dst_idx'],
              'rnd_idx': getRandomIntInclusive(1,219),
              'start_epoch': start_epoch,
              'end_epoch': end_epoch

            };
            points.push(point);
            */
            points.push(data[i]['org_idx']/219);
            points.push(data[i]['dst_idx']/219);
            points.push(getRandomIntInclusive(1,219)/219);
            points.push(start_epoch);
            points.push(end_epoch);
          }
        }
        return points;
      }

      var t0 = performance.now();
      var points = doSomething(data);
      flowGl.setBuffer(new Float32Array(points));
      var t1 = performance.now();
      console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
      /*
      var t0 = performance.now();
      shuffle(data);
      var t1 = performance.now();
      console.log("Call to shuffle " + (t1 - t0) + " milliseconds.");
      console.log(points.length);

      console.log(points.length);
      */

    });
  }

  //gui = new dat.GUI();
  //gui.add(gtdGl, 'show0Casualties');

 }

document.addEventListener('DOMContentLoaded', init, false);
