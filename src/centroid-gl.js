//Centroid-gl.js

var CentroidVertexShader = '' +
'  attribute vec2 a_idx;\n' +
'  uniform sampler2D u_image;\n' +
'  uniform mat4 u_map_matrix;\n' +
'  void main() {\n' +
'    vec4 color = texture2D(u_image, a_idx);\n' + 
'    vec2 pos = vec2(255.*(color.r + 255.*color.b), (255.*color.g + color.a));\n' +
'    gl_Position = u_map_matrix * vec4(pos.x, pos.y, 0.0, 1.0);\n' +
'    if (a_idx.x == 0.0) {\n' +
'      gl_PointSize = 50.0;\n' +
'    } else {\n' +
'      gl_PointSize = 10.0;\n' +
'    }\n' + 
'  }\n';

var CentroidFragmentShader = '' + 
'  precision mediump float;\n' +
'  void main() {\n' +
'    vec3 color = vec3(1.0, 0.0, 0.0);\n' +
'    float dist = length(gl_PointCoord.xy - vec2(.5, .5));\n' +
'    dist = 1. - (dist * 2.);\n' +
'    dist = max(0., dist);\n' +
'    gl_FragColor = vec4(color, 1.) * dist;\n' +
'  }\n';

var CentroidGl = function CentroidGl(gl) {
    this.gl = gl;
    this.program = createProgram(gl, CentroidVertexShader, CentroidFragmentShader);
    this.buffer = {
        'numAttributes': 2,
        'count': 0,
        'buffer': null,
        'ready': false
    };
}

CentroidGl.prototype.getJson = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
        var data = JSON.parse(this.responseText);
        callback(data);
    }
    xhr.send();

}

CentroidGl.prototype.setBuffer = function(data) {
    this.data = data;
    this.buffer.count = data.length / this.buffer.numAttributes;
    this.buffer.buffer = createBuffer(gl, data);   
    if (typeof this.image !== "undefined") {
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
    this.buffer.ready = true;
}

CentroidGl.prototype.draw = function draw(transform, options) {
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
        bindAttribute(gl, program.program, 'a_idx', 2, gl.FLOAT, false, this.buffer.numAttributes*4, 0);    

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(gl.getUniformLocation(program.program, "u_image"), 0);
        gl.drawArrays(gl.POINTS, 0, buffer.count);

        gl.disable(gl.BLEND);
    }
};