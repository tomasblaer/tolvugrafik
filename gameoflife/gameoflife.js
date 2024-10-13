var canvas;
var gl;

var NumVertices  = 36;

var pointsArray = [];
var normalsArray = [];

var movement = false;     // Do we rotate?
var spinX = -30.0;
var spinY = -30.0;
var origX;
var origY;

var zDist = -25.0;

var started = false;

var fovy = 50.0;
var near = 0.2;
var far = 100.0;

var lifeMatrix;
var neighborMatrix;
var timeoutFrames = 0;
var animating = false;
var scaleMatrix;
    
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 150.0;

var ctm;
var ambientColor, diffuseColor, specularColor;

var mv, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var normalMatrix, normalMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
    

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    normalCube();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

    projectionMatrix = perspective( fovy, 1.0, near, far );

    
    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"), materialShininess );

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.clientX;
        origY = e.clientY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (e.clientX - origX) ) % 360;
            spinX = ( spinX + (origY - e.clientY) ) % 360;
            origX = e.clientX;
            origY = e.clientY;
        }
    } );
    
    // Event listener for mousewheel
     window.addEventListener("wheel", function(e){
         if( e.deltaY < 0.0 ) {
             zDist += 1.0;
         } else {
             zDist -= 1.0;
         }
     }  );  

    // event listener for startButton
    var startButton = document.getElementById("startButton");
    startButton.addEventListener("click", function() {
      if (!started) {
        started = true;
        startButton.disabled = true;
        refreshButton.disabled = true;
      }
    });

    var refreshButton = document.getElementById("refreshButton");
    refreshButton.addEventListener("click", function() {
      initializeMatrices();
    });

    initializeMatrices();

    render();
}


function normalCube()
{
    quad( 1, 0, 3, 2, 0 );
    quad( 2, 3, 7, 6, 1 );
    quad( 3, 0, 4, 7, 2 );
    quad( 6, 5, 1, 2, 3 );
    quad( 4, 5, 6, 7, 4 );
    quad( 5, 4, 0, 1, 5 );
}

function quad(a, b, c, d, n) 
{
    var vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5, -0.5, -0.5, 1.0 )
    ];

    var faceNormals = [
        vec4( 0.0, 0.0,  1.0, 0.0 ),  // front
        vec4(  1.0, 0.0, 0.0, 0.0 ),  // right
        vec4( 0.0, -1.0, 0.0, 0.0 ),  // down
        vec4( 0.0,  1.0, 0.0, 0.0 ),  // up
        vec4( 0.0, 0.0, -1.0, 0.0 ),  // back
        vec4( -1.0, 0.0, 0.0, 0.0 )   // left
    ];

    // We need to partition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //fece normals assigned using the parameter n
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        pointsArray.push( vertices[indices[i]] );
        normalsArray.push(faceNormals[n]);
        
    }
}

function initializeMatrices() {
  lifeMatrix = new Array(10);
  for (let i = 0; i < 10; i++) {
      lifeMatrix[i] = new Array(10);
      for (let j = 0; j < 10; j++) {
          lifeMatrix[i][j] = new Array(10);
          for (let k = 0; k < 10; k++) {
              lifeMatrix[i][j][k] = Math.floor(Math.random() * 10) < 2;
          }
      }
  }

  scaleMatrix = new Array(10);
  for (let i = 0; i < 10; i++) {
      scaleMatrix[i] = new Array(10);
      for (let j = 0; j < 10; j++) {
          scaleMatrix[i][j] = new Array(10);
          for (let k = 0; k < 10; k++) {
              scaleMatrix[i][j][k] = {
                scale: lifeMatrix[i][j][k] ? 1.0 : 0.0,
                status: 'none' // none, spawning, dying
              }
          }
      }
  }
}

function calcNeighbors() {
  neighborMatrix = new Array(10);
  for (let i = 0; i < 10; i++) {
      neighborMatrix[i] = new Array(10);
      for (let j = 0; j < 10; j++) {
          neighborMatrix[i][j] = new Array(10);
          for (let k = 0; k < 10; k++) {
              neighborMatrix[i][j][k] = 0;
          }
      }
  }

  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      for (let k = 0; k < 10; k++) {
        if (lifeMatrix[i][j][k] === true) {
          for (let x = i - 1; x <= i + 1; x++) {
            for (let y = j - 1; y <= j + 1; y++) {
              for (let z = k - 1; z <= k + 1; z++) {
                if (x >= 0 && x < 10 && y >= 0 && y < 10 && z >= 0 && z < 10) {
                    neighborMatrix[x][y][z]++;
                }
              }
            }
          }
          neighborMatrix[i][j][k]--;
        }
      }
    }
  }
}

function calcLifeMatrix() {
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      for (let k = 0; k < 10; k++) {
        if (lifeMatrix[i][j][k] === true) {
          if (neighborMatrix[i][j][k] !== 5 && neighborMatrix[i][j][k] !== 6 && neighborMatrix[i][j][k] !== 7) {
            lifeMatrix[i][j][k] = false;
            scaleMatrix[i][j][k].status = 'dying';
            animating = true;

          }
        } else {
          if (neighborMatrix[i][j][k] === 6) {
            lifeMatrix[i][j][k] = true;
            scaleMatrix[i][j][k].status = 'spawning';
            animating = true;
          }
        }
      }
    }
  }
}

function calcScale() {
  animating = false;
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      for (let k = 0; k < 10; k++) {
        let scale = scaleMatrix[i][j][k].scale;
        let status = scaleMatrix[i][j][k].status;

        if (status === 'spawning') {
          scale += 0.005;
          if (scale >= 1.0) {
            scale = 1.0;
            scaleMatrix[i][j][k].status = 'none';
          } else {
            animating = true;
          }
        } else if (status === 'dying') {
          scale -= 0.005;
          if (scale <= 0.0) {
            scale = 0.0;
            scaleMatrix[i][j][k].status = 'none';
          } else {
            animating = true;
          }
        }
        scaleMatrix[i][j][k].scale = scale;
      }
    }
  }
  if (animating === false) {
    timeoutFrames = 250;
  }
}


function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let mv = lookAt(vec3(0.0, 0.0, zDist), at, up);

  mv = mult(mv, rotateX(spinX));
  mv = mult(mv, rotateY(spinY));

  let spacing = 1.2;
  let offset = 5.4;

  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      for (let k = 0; k < 10; k++) {
        let xPos = i * spacing - offset;
        let yPos = j * spacing - offset;
        let zPos = k * spacing - offset;  

        let modelMatrix = translate(xPos, yPos, zPos);

        let scale = scaleMatrix[i][j][k].scale;

        modelMatrix = mult(modelMatrix, scalem(scale, scale, scale));

        let mvFinal = mult(mv, modelMatrix);

        normalMatrix = [
            vec3(mvFinal[0][0], mvFinal[0][1], mvFinal[0][2]),
            vec3(mvFinal[1][0], mvFinal[1][1], mvFinal[1][2]),
            vec3(mvFinal[2][0], mvFinal[2][1], mvFinal[2][2])
        ];
        normalMatrix.matrix = true;

        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvFinal));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));

        gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
      }
    }
  }

  if (timeoutFrames !== 0) {
    timeoutFrames--;
  } else {
    if (started && animating === false) {
      calcNeighbors();
      calcLifeMatrix();
    } else if (started && animating === true) {
      calcScale();
    }
  }


  window.requestAnimFrame(render);
}
