//tmp-gl.js

var tmpVertexShader = '';

var tmpFragmentShader = '';

var TmpGl = function PointFlowGl(gl) {
    this.gl = gl;
    this.program = createProgram(gl, tmpVertexShader, tmpFragmentShader);
    this.buffer = {
        'numAttributes': 6,
        'count': 0,
        'buffer': null,
        'ready': false
    };
}

TmpGl.prototype.getGeoJson = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
        if (this.status == 404) {
            data = "";
        } else {
            data = JSON.parse(this.responseText);
        }
        callback(data);
    }
    xhr.onerror = function() {
        callback('');
    }
    xhr.send();    
}

TmpGl.prototype.setBuffer = function(data) {
    this.data = data;
    this.buffer.count = data.length / this.buffer.numAttributes;
    this.buffer.buffer = createBuffer(gl, data);   
    this.buffer.ready = true;
}

TmpGl.prototype.draw = function draw(transform, options) {
    if (this.buffer.ready) {
        var options = options || {};
        var gl = this.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
        var program = this.program;
        var buffer = this.buffer;
        gl.useProgram(program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
        gl.uniformMatrix4fv(program.u_map_matrix, false, transform);
        gl.drawArrays(gl.POINTS, 0, buffer.count);
        gl.disable(gl.BLEND);
    }
};