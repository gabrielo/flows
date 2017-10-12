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
'    }\n' +
'    gl_Position = position;\n' +
'    gl_PointSize = 2.0;\n' +
'  }\n';

var flowFragmentShader = '' + 
'  precision mediump float;\n' +
'  void main() {\n' +
'    vec3 color = vec3(1.0, 0.0, 0.0);\n' +
'    gl_FragColor = vec4(color, 1.);\n' +
'  }\n';

var FlowGl = function FlowGl(gl) {
    this.gl = gl;
    this.program = createProgram(gl, flowVertexShader, flowFragmentShader);
    this.buffer = {
        'numAttributes': 5,
        'count': 0,
        'buffer': null,
        'ready': false
    };
}

FlowGl.prototype.getJson = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
        var data = JSON.parse(this.responseText);
        callback(data);
    }
    xhr.send();

}

FlowGl.prototype.setBuffer = function(data) {
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

FlowGl.prototype.draw = function draw(transform, options) {
    if (this.buffer.ready) {
        var options = options || {};
        var epoch = options["epoch"] || new Date().getTime()/1000.;
        var gl = this.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
        var program = this.program;
        var buffer = this.buffer;
        gl.useProgram(program.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
        gl.uniformMatrix4fv(program.u_map_matrix, false, transform);
        bindAttribute(gl, program.program, 'a_org_idx', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 0);    
        bindAttribute(gl, program.program, 'a_dst_idx', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 4);    
        bindAttribute(gl, program.program, 'a_rnd_idx', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 8);    
        bindAttribute(gl, program.program, 'a_start_epoch', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 12);    
        bindAttribute(gl, program.program, 'a_end_epoch', 1, gl.FLOAT, false, this.buffer.numAttributes*4, 16);    

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(gl.getUniformLocation(program.program, "u_image"), 0);
        gl.uniform1f(program.u_epoch, epoch);
        gl.drawArrays(gl.POINTS, 0, buffer.count);

        gl.disable(gl.BLEND);
    }
};