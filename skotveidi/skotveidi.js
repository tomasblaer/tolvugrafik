
var canvas;
var gl;
var program;


var mouseX;             
var movement = false;   

var gun = [
  vec2( -0.1, -0.9 ),
  vec2( 0.1, -0.9 ),
  vec2( 0.0, -0.8 ),
];

var colorMap = {
  shot: vec4(255.0, 0.0, 0.0, 1.0),
  gun: vec4(0.0, 0.0, 0.0, 1.0)
};

var vertices = [];
var colors = [];

var shots = [];

var lTargets = [];

var rTargets = [];

var targetSpeeds = {
  l: [],
  r: []
};

var points = 0;

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        mouseX = e.offsetX;
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
            var xmove = 2*(e.offsetX - mouseX)/canvas.width;
            mouseX = e.offsetX;
            for(i=0; i<gun.length; i++) {
                gun[i][0] += xmove;
            }

            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));
        }
    } );

    document.addEventListener("keydown", function(e){
        if(e.key === ' ' && shots.length < 5) {
          shots.push(vec2(gun[2][0], gun[2][1]));
        }
    });

    render();
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}


function newFrame() {
  
  // move or delete shots

  for ( i=0; i<shots.length; i++) {
    shots[i][1] += 0.01;
  }

  for ( i=0; i<shots.length; i++) {
    if(shots[i][1] > 1.0) {
      shots.splice(i, 1);
    }
  }

  // move or delte targets

  if (lTargets.length < 2 && getRandom(0, 1) > 0.99) {
    lTargets.push(vec2(-1.025, getRandom(-0.5, 0.5)));
    targetSpeeds.l.push(getRandom(0.004, 0.002));
  }

  for ( i=0; i<lTargets.length; i++) {
    lTargets[i][0] += targetSpeeds.l[i];
  }

  for ( i=0; i<lTargets.length; i++) {
    if(lTargets[i][0] > 1.0) {
      lTargets.splice(i, 1);
      targetSpeeds.l.splice(i, 1);
    }
  }

  if (rTargets.length < 2 && getRandom(0, 1) > 0.99) {
    rTargets.push(vec2(1.00, getRandom(-0.5, 0.5)));
    targetSpeeds.r.push(getRandom(-0.004, -0.002));
  }

  for ( i=0; i<rTargets.length; i++) {
    rTargets[i][0] += targetSpeeds.r[i];
}

  for ( i=0; i<rTargets.length; i++) {
    if(rTargets[i][0] < -1.0) {
      rTargets.splice(i, 1);
      targetSpeeds.r.splice(i, 1);
    }
  }

  // collision checks
  for (i = 0; i < shots.length; i++) {
    for (j = 0; j < lTargets.length; j++) {
      if (shots[i][0] > lTargets[j][0] - 0.05 / 2 && shots[i][0] < lTargets[j][0] + 0.05 / 2 && shots[i][1] > lTargets[j][1] - 0.05 && shots[i][1] < lTargets[j][1]) {
        lTargets.splice(j, 1);
        targetSpeeds.l.splice(j, 1);
        shots.splice(i, 1);
        points++;
      }
    }
  }

  for (i = 0; i < shots.length; i++) {
    for (j = 0; j < rTargets.length; j++) {
      if (shots[i][0] > rTargets[j][0] - 0.05 / 2 && shots[i][0] < rTargets[j][0] + 0.05 / 2 && shots[i][1] > rTargets[j][1] - 0.05 && shots[i][1] < rTargets[j][1]) {
        rTargets.splice(j, 1);
        targetSpeeds.r.splice(j, 1);
        shots.splice(i, 1);
        points++;
      }
    }
  }

  
}

function draw() {

  vertices = [];
  
  for (i = 0; i < gun.length; i++) {
      vertices.push(gun[i]);
      colors.push(colorMap.gun);
  }

  for (i = 0; i < shots.length; i++) {
    vertices.push(vec2(shots[i][0], shots[i][1]));                    
    vertices.push(vec2(shots[i][0] - 0.02 / 2, shots[i][1] - 0.02));   
    vertices.push(vec2(shots[i][0] + 0.02 / 2, shots[i][1] - 0.02));   

    colors.push(colorMap.shot);
  }

  for (i = 0; i < lTargets.length; i++) {
    vertices.push(vec2(lTargets[i][0], lTargets[i][1]));                    
    vertices.push(vec2(lTargets[i][0] - 0.05 / 2, lTargets[i][1] - 0.05));   
    vertices.push(vec2(lTargets[i][0] + 0.05 / 2, lTargets[i][1] - 0.05));   

    colors.push(colorMap.shot);
  }

  for (i = 0; i < rTargets.length; i++) {
    vertices.push(vec2(rTargets[i][0], rTargets[i][1]));                    
    vertices.push(vec2(rTargets[i][0] - 0.05 / 2, rTargets[i][1] - 0.05));   
    vertices.push(vec2(rTargets[i][0] + 0.05 / 2, rTargets[i][1] - 0.05));   

    colors.push(colorMap.shot);
  }

  // for each point, add a line to the top left of the screen

  for (i = 0; i < points; i++) {
    vertices.push(vec2(-1.0 + i * 0.05, 1.0));             
    vertices.push(vec2(-1.0 + i * 0.05 + 0.01, 1.0));      
    vertices.push(vec2(-1.0 + i * 0.05, 0.95));            

    vertices.push(vec2(-1.0 + i * 0.05, 0.95));            
    vertices.push(vec2(-1.0 + i * 0.05 + 0.01, 1.0));      
    vertices.push(vec2(-1.0 + i * 0.05 + 0.01, 0.95));     

    colors.push(colorMap.shot);
    colors.push(colorMap.shot);
    colors.push(colorMap.shot);

    colors.push(colorMap.shot);
    colors.push(colorMap.shot);
    colors.push(colorMap.shot);
  }

  var positionBufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferId);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

}

function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );

    if (points < 5) {
      newFrame();
      draw();

      gl.drawArrays( gl.TRIANGLES, 0, vertices.length );

    }
    window.requestAnimFrame(render);

}