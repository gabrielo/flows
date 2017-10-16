//worker.js
self.addEventListener('message', function(e) {
    var year = e.data['year'];
    getJson(year, function(year, data) {
        var float32Array = setData(year, data);
        self.postMessage({'array': float32Array.buffer, 'year': year}, [float32Array.buffer]);        
    });

}, false);

var getJson = function(year, callback) {
    var url = '../data/totals-' + year + '.json';    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
        var data = JSON.parse(this.responseText);
        callback(year, data);
    }
    xhr.send();

}

var setData = function(year, data) {
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

    function doSomething(year, data) {
        var points = [];
        var startDateMin = new Date((year - 1).toString() + '-1-1').getTime()/1000.;
        //var startDateMin = new Date(year.toString() + '-1-1').getTime()/1000.;
        var startDateMax = new Date(year.toString() + '-11-1').getTime()/1000.;
        var endDateMin = new Date(year.toString() + '-1-31').getTime()/1000.;
        var endDateMax = new Date(year.toString() + '-12-31').getTime()/1000.;

        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i]['delta']; j++) {
                var start_epoch = getRandomIntInclusive(startDateMin, startDateMax);
                var end_epoch = getRandomIntInclusive(endDateMin, endDateMax);
                if (start_epoch > end_epoch) {
                    var temp = end_epoch;
                    end_epoch = start_epoch;
                    start_epoch = temp;
                }
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
    var points = doSomething(year, data);
    //flowGl.setBuffer(year, new Float32Array(points));
    var float32Array = new Float32Array(points);
    var t1 = performance.now();
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
    return float32Array;
}
