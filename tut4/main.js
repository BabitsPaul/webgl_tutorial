var gl,
	shaderProgram;

function launch()
{
	console.log("Launching");

	initGL();
	initShaders();

	initBuffers();

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

	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

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

var rotationPyramid = 0,
	rotationCube = 0;

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

	rotationPyramid += 90 * elapsed / 1000.;
	rotationCube += 125 * elapsed / 1000.;

	lastTime = timeNow;
}

var pyramidVertexPositionBuffer,
	pyramidVertexColorBuffer,
	cubeVertexPositionBuffer,
	cubeVertexColorBuffer,
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
	mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]);

	mvPushMatrix();
	mat4.rotate(mvMatrix, degToRad(rotationPyramid), [0, 1, 0]);

	//draw pyramid
	gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, pyramidVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pyramidVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();	//push transformation-matrix to GPU
	gl.drawArrays(gl.TRIANGLE_FAN, 0, pyramidVertexPositionBuffer.numItems);

	mvPopMatrix();

	//update model-view for cube
	mat4.translate(mvMatrix, [3., 0., 0.]);

	mvPushMatrix();

	mat4.rotate(mvMatrix, degToRad(rotationCube), [0.5, 1, 0.2]);

	//draw cube
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexElementBuffer);

	setMatrixUniforms();

	gl.drawElements(gl.TRIANGLES, cubeVertexElementBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	mvPopMatrix();
}

function initBuffers()
{
	var pyramidVertices = [
		0.0, 1.5, 0.0,
		1.0, 0.0, 1.0,
		1.0, 0.0, -1.0,
		-1.0, 0.0, -1.0,
		-1.0, 0.0, 1.0,
		1.0, 0.0, 1.0
	];

	var pyramidColors = [
		1, 0, 0, 1,
		0, 1, 0, 1,
		0, 0, 1, 1,
		1, 1, 0, 1,
		1, 0, 1, 1,
		0, 1, 0, 1
	];

	var cubeVertices = [
		1., 1., 1.,		//0		right top front
		1., 1., -1.,	//1		right top back
		1., -1., -1.,	//2		right bottom back
		1., -1., 1.,	//3		right bottom front
		-1., 1., 1.,	//4		left top front
		-1., 1., -1.,	//5		left top back
		-1., -1., -1.,	//6		left bottom back
		-1., -1., 1.	//7		left bottom front
	];

	var cubeColors = [
		1, 0, 0, 1,
		0, 1, 0, 1,
		0, 0, 1, 1,
		0, 0, 0, 1,
		1, 1, 1, 1,
		1, 0, 1, 1,
		1, 1, 0, 1.,
		0.5, 0.5, 0.5,1
	];

	var cubeIndices = [
		0, 1, 2,	0, 3, 2,	//right
		4, 5, 6,	4, 7, 6,	//left
		2, 3, 7,	2, 6, 7, 	//bottom
		0, 1, 5,	0, 4, 5,	//top
		0, 3, 7,	0, 7, 4,	//front
		1, 2, 6,	1, 5, 6		//back
	];

	//init buffer for pyramid
	pyramidVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pyramidVertices), gl.STATIC_DRAW);
	pyramidVertexPositionBuffer.itemSize = 3;
	pyramidVertexPositionBuffer.numItems = 6;

	pyramidVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pyramidColors), gl.STATIC_DRAW);
	pyramidVertexColorBuffer.itemSize = 4;
	pyramidVertexColorBuffer.numItems = 6;

	//init buffer for cube
	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = 8;

	cubeVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeColors), gl.STATIC_DRAW);
	cubeVertexColorBuffer.itemSize = 4;
	cubeVertexColorBuffer.numItems = 8;

	cubeVertexElementBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexElementBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
	cubeVertexElementBuffer.itemSize = 1;
	cubeVertexElementBuffer.numItems = 36;
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
