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

var rotationTri = 0,
	rotationSqr = 0;

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

	rotationTri += 90 * elapsed / 1000.;
	rotationSqr += 125 * elapsed / 1000.;

	lastTime = timeNow;
}

var pyramidVertexPositionBuffer,
	pyramidVertexColorBuffer,
	cubeVertexPositionBuffer,
	cubeVertexColorBuffer;

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
	mat4.rotateY(mvMatrix, degToRad(rotationTri));

	//draw triangle
	gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, pyramidVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pyramidVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();	//push transformation-matrix to GPU
	gl.drawArrays(gl.TRIANGLES, 0, pyramidVertexPositionBuffer.numItems);

	mvPopMatrix();

	//update model-view for square
	mat4.translate(mvMatrix, [3., 0., 0.]);

	mvPushMatrix();

	mat4.rotateZ(mvMatrix, degToRad(rotationSqr));

	//draw square
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, cubeVertexPositionBuffer.numItems);

	mvPopMatrix();
}

function initBuffers()
{
	var triangleVertices = [
		0.0, 1.0, 0.0,
		-1.0, -1.0, 0.0,
		1.0, -1.0, 0.0
	];

	var triangleColors = [
		1, 0, 0, 1,
		0, 1, 0, 1,
		0, 0, 1, 1
	];

	var squareVertices = [
		1., 1., 0. ,
		1., -1., 0.,
		-1., 1., 0.,
		-1., -1., 0.
	];

	var squareColors = [
		1, 0.5, 0, 1,
		1, 0.5, 0, 1,
		1, 0.5, 0, 1,
		1, 0.5, 0, 1
	];

	//init buffer for triangle
	pyramidVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
	pyramidVertexPositionBuffer.itemSize = 3;
	pyramidVertexPositionBuffer.numItems = 3;

	pyramidVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleColors), gl.STATIC_DRAW);
	pyramidVertexColorBuffer.itemSize = 4;
	pyramidVertexColorBuffer.numItems = 3;

	//init buffer for square
	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareVertices), gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = 4;

	cubeVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareColors), gl.STATIC_DRAW);
	cubeVertexColorBuffer.itemSize = 4;
	cubeVertexColorBuffer.numItems = 4;
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
