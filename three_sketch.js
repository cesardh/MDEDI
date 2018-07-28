// var renderer = new THREE.WebGLRenderer();
// renderer.setSize( window.innerWidth, window.innerHeight );
// document.body.appendChild( renderer.domElement );

// var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 );
// camera.position.set( 0, 0, 100 );
// camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

// var scene = new THREE.Scene();

// var material = new THREE.LineBasicMaterial( { color: 0x0000ff } );

// var geometry = new THREE.Geometry();
// geometry.vertices.push(new THREE.Vector3( -10, 0, 0) );
// geometry.vertices.push(new THREE.Vector3( 0, 10, 0) );
// geometry.vertices.push(new THREE.Vector3( 10, 0, 0) );

// var line = new THREE.Line( geometry, material );

// scene.add( line );
// renderer.render( scene, camera );

// global variables
var renderer, labelRenderer;
var scene;
var camera;
var control;

var scale = chroma.scale(['aquamarine', 'cyan', 'teal']).domain([0, 70]);
function init() {
    // create a scene, that will hold all our elements such as objects, cameras and lights.
    scene = new THREE.Scene();
    // create a camera, which defines where we're looking at.
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    // create a render, sets the background color and the size
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x052222, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);

    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = 0;
    document.body.appendChild( labelRenderer.domElement );

    // add light
    var light = new THREE.DirectionalLight();
    light.position.set(1200, 1000, 1200);
    scene.add(light);

    var light = new THREE.AmbientLight(0x207070);
    scene.add(light);
    // position and point the camera to the center of the scene
    camera.position.x = 1200;
    camera.position.y = 700;
    camera.position.z = 1200;
    camera.lookAt(scene.position);
    // add the output of the renderer to the html element
    document.body.appendChild(renderer.domElement);
    control = new function () {
        this.rotationSpeed = 0.005;
        this.scale = 1;
    };
    addControls(control);
    createGeometryFromMap();
    createContentHTML();
    // call the render function
    render();
}

function createContentHTML(){
    var contentDiv = document.createElement( 'div' );
    contentDiv.className = 'info';
    var contentLayer = new THREE.CSS2DObject( contentDiv );
    contentLayer.position.set( 300, 0, 0 );
    scene.add(contentLayer)

    var contentDiv = document.getElementById( 'tooltip' );
    var contentLayer = new THREE.CSS2DObject( contentDiv );
    contentLayer.position.set( 500, 50, 600 );
    scene.add(contentLayer)
}

function createGeometryFromMap() {
    var depth = 512;
    var width = 512;
    var spacingX = 3;
    var spacingZ = 3;
    var heightOffset = 2;
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.src = "./DeathValley.heightmap.jpg";
    img.onload = function () {
        // draw on canvas
        ctx.drawImage(img, 0, 0, 512, 512);
        var pixel = ctx.getImageData(0, 0, width, depth);
        var geom = new THREE.Geometry;
        var output = [];
        for (var x = 0; x < depth; x++) {
            for (var z = 0; z < width; z++) {
                // get pixel
                // since we're grayscale, we only need one element
                var yValue = pixel.data[z * 4 + (depth * x * 4)] / heightOffset;
                var vertex = new THREE.Vector3(x * spacingX, yValue, z * spacingZ);
                geom.vertices.push(vertex);
            }
        }
        // we create a rectangle between four vertices, and we do
        // that as two triangles.
        for (var z = 0; z < depth - 1; z++) {
            for (var x = 0; x < width - 1; x++) {
                // we need to point to the position in the array
                // a - - b
                // |  x  |
                // c - - d
                var a = x + z * width;
                var b = (x + 1) + (z * width);
                var c = x + ((z + 1) * width);
                var d = (x + 1) + ((z + 1) * width);
                var face1 = new THREE.Face3(a, b, d);
                var face2 = new THREE.Face3(d, c, a);
                face1.color = new THREE.Color(scale(getHighPoint(geom, face1)).hex());
                face2.color = new THREE.Color(scale(getHighPoint(geom, face2)).hex())
                geom.faces.push(face1);
                geom.faces.push(face2);
            }
        }
        geom.computeVertexNormals(true);
        geom.computeFaceNormals();
        geom.computeBoundingBox();
        var zMax = geom.boundingBox.max.z;
        var xMax = geom.boundingBox.max.x;
        var mesh = new THREE.Mesh(geom, new THREE.MeshLambertMaterial({
            vertexColors: THREE.FaceColors,
            color: 0xff6600,
            shading: THREE.NoShading
        }));
        mesh.translateX(-xMax / 2);
        mesh.translateZ(-zMax / 2);
        scene.add(mesh);
        mesh.name = 'valley';
    };
}
function getHighPoint(geometry, face) {
    var v1 = geometry.vertices[face.a].y;
    var v2 = geometry.vertices[face.b].y;
    var v3 = geometry.vertices[face.c].y;
    return Math.max(v1, v2, v3);
}
function addControls(controlObject) {
}
function render() {
    renderer.render(scene, camera);
    labelRenderer.render( scene, camera );
    requestAnimationFrame(render);
    scene.rotation.y += 10 / 10000;
}

// calls the init function when the window is done loading.
window.onload = init;