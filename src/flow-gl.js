//flow-gl.js

//org_idx, dst_idx, rnd_idx, start_epoch, end_epoch
var flowVertexShader = '' +
'  attribute float a_org_idx;\n' +
'  attribute float a_dst_idx;\n' +
'  attribute float a_rnd_idx;\n' +
'  attribute float a_start_epoch;\n' +
'  attribute float a_end_epoch;\n' +
'  uniform float u_epoch;\n' +
'  uniform sampler2D u_image;\n' +
'  uniform mat4 u_map_matrix;\n' +
'  varying float v_t;\n' + 
'  vec2 bezier(float t, vec2 p0, vec2 p1, vec2 p2) {\n' +
'    return (1.0-t)*(1.0-t)*p0 + 2.0*(1.0-t)*t*p1 + t*t*p2;\n' +
'  }\n' +
'  void main() {\n' +
'    vec4 position = vec4(-1,-1,-1,-1);\n' +
'    if (a_start_epoch <= u_epoch && u_epoch <= a_end_epoch) {\n' +
'      float t = (u_epoch - a_start_epoch)/(a_end_epoch - a_start_epoch);\n' + 
'      vec4 org = texture2D(u_image, vec2(0,a_org_idx));\n' + 
'      vec2 org_pos = vec2(255.*(org.r + 255.*org.b), (255.*org.g + org.a));\n' +
'      vec4 dst = texture2D(u_image, vec2(0,a_dst_idx));\n' + 
'      vec2 dst_pos = vec2(255.*(dst.r + 255.*dst.b), (255.*dst.g + dst.a));\n' +
'      vec4 rnd_org = texture2D(u_image, vec2(a_rnd_idx,a_org_idx));\n' + 
'      vec2 rnd_org_pos = vec2(255.*(rnd_org.r + 255.*rnd_org.b), (255.*rnd_org.g + rnd_org.a));\n' +
'      vec4 rnd_dst = texture2D(u_image, vec2(a_rnd_idx,a_dst_idx));\n' + 
'      vec2 rnd_dst_pos = vec2(255.*(rnd_dst.r + 255.*rnd_dst.b), (255.*rnd_dst.g + rnd_dst.a));\n' +
'      vec2 pos = bezier(t, org_pos, (rnd_org_pos + rnd_dst_pos)* 0.5, dst_pos);\n' +
'      //vec2 pos = org_pos;\n' +
'      position = u_map_matrix * vec4(pos.x, pos.y, 0.0, 1.0);\n' +
'      v_t = t;\n' +
'    }\n' +
'    gl_Position = position;\n' +
'    gl_PointSize = 2.0;\n' +
'  }\n';

var flowFragmentShader = '' + 
'  precision mediump float;\n' +
'  varying float v_t;\n' + 
'  void main() {\n' +
'    vec4 colorStart = vec4(.94,.56,.21,1.0);\n' +
'    vec4 colorEnd = vec4(.71,0.09,0.05,1.0);\n' +
'    gl_FragColor = mix(colorStart, colorEnd, v_t);\n' +
'  }\n';


var Buffer = function Buffer(numAttributes) {
    this.numAttributes = numAttributes;
    this.count = 0;
    this.buffer = null;
    this.ready = false;
}

var FlowGl = function FlowGl(gl) {
    this.gl = gl;
    this.program = createProgram(gl, flowVertexShader, flowFragmentShader);
    this.buffers = {};
    /*
    this.buffer = {
        'numAttributes': 5,
        'count': 0,
        'buffer': null,
        'ready': false
    };
    */
}

FlowGl.prototype.setData = function(year, data) {
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
        var startDateMin = new Date((year - 1).toString() + '-9-1').getTime()/1000.;
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
    flowGl.setBuffer(year, new Float32Array(points));
    var t1 = performance.now();
    console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
}

FlowGl.prototype.getJson = function(year, callback) {
    var url = '../data/totals-' + year + '.json';    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
        var data = JSON.parse(this.responseText);
        callback(year, data);
    }
    xhr.send();

}


FlowGl.prototype.setBuffer = function(year, data) {
    this.buffers[year.toString()] = new Buffer(5);
    this.buffers[year.toString()].data = data;
    this.buffers[year.toString()].count = data.length / this.buffers[year.toString()].numAttributes;
    this.buffers[year.toString()].buffer = createBuffer(gl, data);   
    if (typeof this.image !== "undefined" && typeof this.texture == "undefined") {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Upload the image into the texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

        gl.bindTexture(gl.TEXTURE_2D, null);
    }    
    this.buffers[year.toString()].ready = true;
}

FlowGl.prototype.draw = function draw(year, transform, options) {
    var buffer = this.buffers[year.toString()];
    if (typeof buffer != "undefined" && buffer.ready) {
        var options = options || {};
        var epoch = options["epoch"] || new Date().getTime()/1000.;
        var gl = this.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
        var program = this.program;
        gl.useProgram(program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
        gl.uniformMatrix4fv(program.u_map_matrix, false, transform);
        bindAttribute(gl, program.program, 'a_org_idx', 1, gl.FLOAT, false, buffer.numAttributes*4, 0);    
        bindAttribute(gl, program.program, 'a_dst_idx', 1, gl.FLOAT, false, buffer.numAttributes*4, 4);    
        bindAttribute(gl, program.program, 'a_rnd_idx', 1, gl.FLOAT, false, buffer.numAttributes*4, 8);    
        bindAttribute(gl, program.program, 'a_start_epoch', 1, gl.FLOAT, false, buffer.numAttributes*4, 12);    
        bindAttribute(gl, program.program, 'a_end_epoch', 1, gl.FLOAT, false, buffer.numAttributes*4, 16);    

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(gl.getUniformLocation(program.program, "u_image"), 0);
        gl.uniform1f(program.u_epoch, epoch);
        gl.drawArrays(gl.POINTS, 0, buffer.count);

        gl.disable(gl.BLEND);
    }
};