var gl,
	shaderProgram;

function launch()
{
	console.log("Launching");

	initGL();
	initShaders();
	initBuffers();
	initTextures();

	console.log("Initialized");

	tick();
}

function initGL()
{
	try{
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	}catch(e){
		console.log(e);
	}

	if(!gl)
	{
		console.log("Could not instantiate WebGL");
	} else {
		console.log("Initialized WebGL");
	}

	gl.clearColor(0., 0., 0.03, 1.0);
	gl.enable(gl.DEPTH_TEST);
}

//////////////////////////////////////////////////////////////////////////////////////////
// user interface                                                                       //
//                                                                                      //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

var xRot = 0;
var xSpeed = 0;

var yRot = 0;
var ySpeed = 0;

var zRot = 0;
var zSpeed = 0;

var z = -5.0;

var filter = 0;

//////////////////////////////////////////////////////////////////////////////////////////
// textures                                                                             //
//                                                                                      //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

var neheTexture;

function initTextures()
{
	neheTexture = gl.createTexture();
	neheTexture.image = new Image();
	neheTexture.image.onload = function(){
		handleLoadedTexture(neheTexture);
	}

	neheTexture.image.src = "crate.gif";
}

function handleLoadedTexture(texture)
{
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
   	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

//////////////////////////////////////////////////////////////////////////////////////////
// shaders                                                                              //
//                                                                                      //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

function initShaders()
{
	var fragmentShader = getShader(gl, "shader-fs");
	var vertexShader = getShader(gl, "shader-vs");

	//create and link shader program
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
		console.log("Could not link shaders");
		return;
	}

	//register shader
	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoordinate");
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");

	console.log("Initialized shaders");
}

function getShader(gl, id)
{
	//attempt to load shader
	var shaderScript = document.getElementById(id);
	if(!shaderScript)
	{
		return null;
	}

	//load shader code
	var str = "";
	var k = shaderScript.firstChild;
	while(k) {
		if(k.nodeType == 3)
			str += k.textContent;
		k = k.nextSibling;
	}

	//create initial shader
	var shader;
	if(shaderScript.type == "x-shader/x-fragment")
	{
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	}else if(shaderScript.type == "x-shader/x-vertex"){
		shader = gl.createShader(gl.VERTEX_SHADER);
	}else{
		return null;
	}

	//compile shader
	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
		console.log(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

////////////////////////////////////////////////////////////////////////////////////////////////
// rendering                                                                                  //
//                                                                                            //
//                                                                                            //
////////77//////////////////////////////////////////////////////////////////////////////////////

var rotationCube = 0;

function tick()
{
	draw();
	animate();

	requestAnimationFrame(tick);
}

var lastTime = new Date().getTime();

function animate()
{
	var timeNow = new Date().getTime();

	var elapsed = timeNow - lastTime;

	rotationCube += 125 * elapsed / 1000.;

	lastTime = timeNow;
}

var cubeVertexPositionBuffer,
	cubeTextureCoordBuffer,
	cubeVertexElementBuffer;

function draw()
{
	//setup viewport and clear canvas
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//create perspective matrix
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100., pMatrix);

	//create model-view matrix
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0, 0, -7]);
	mat4.rotate(mvMatrix, degToRad(rotationCube), [0.5, 1, 0.2]);

	//draw cube
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, neheTexture);
	gl.uniform1i(shaderProgram.samplerUniform, 0);

	setMatrixUniforms();

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexElementBuffer);
	gl.drawElements(gl.TRIANGLES, cubeVertexElementBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function initBuffers()
{
	var cubeVertices = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,

            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,

            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0
        ];

	var cubeIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];

	var cubeTextureCoords = [
		// Front face
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,

		// Back face
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,

		// Top face
		0.0, 1.0,
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,

		// Bottom face
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,
		1.0, 0.0,

		// Right face
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,

		// Left face
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
	];

	//init buffer for cube
	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = 24;

	cubeVertexElementBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexElementBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
	cubeVertexElementBuffer.itemSize = 1;
	cubeVertexElementBuffer.numItems = 36;

	cubeTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeTextureCoords), gl.STATIC_DRAW);
	cubeTextureCoordBuffer.itemSize = 2;
	cubeTextureCoordBuffer.numItems = 24;
}

///////////////////////////////////////////////////////////////////////////////////////////
// view                                                                                  //
//                                                                                       //
//                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////

var pMatrix = mat4.create(),
	mvMatrix = mat4.create();

var mvMatrixStack = [];

function mvPushMatrix()
{
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

function mvPopMatrix()
{
	if(mvMatrix.length == 0)
		throw "no matrix to pop";

	mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms()
{
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

///////////////////////////////////////////////////////////////////////////////////////////
// utility                                                                               //
//                                                                                       //
//                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////

function degToRad(deg)
{
	return deg * Math.PI / 180;
}
