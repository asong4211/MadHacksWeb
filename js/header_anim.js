var camera, scene, renderer, lights, orbit;
var wireframe, wireframe_t;
var animInt;

var shapes;
var shapes_i;
var xrot = 0.01;
var yrot = 0.005;
var ss = (window.innerHeight - 54) * 0.007;
var spreadx = ss * 4;

var particles_sep = 60, particles_amountx = 40, particles_amounty = 30;
var particles, particle, particles_count = 0;
var particles_ztrans = 0, particles_xtrans = 100, particles_ytrans = -250;
var windowHalfX = window.innerWidth / 2, windowHalfY = (3*(window.innerHeight - 54)) / 4
var mouseX = 0, mouseY = 0;

function Basic(type) {
    this.type = type;
    if (type == 1) { this.geometry = new THREE.TetrahedronGeometry(ss, 0); }
    else if (type == 2) { this.geometry = new THREE.BoxBufferGeometry(ss, ss, ss); }
    else if (type == 3) { this.geometry = new THREE.OctahedronBufferGeometry(ss, 0); }
    else if (type == 4) { this.geometry = new THREE.DodecahedronGeometry(ss, 0); }
    else if (type == 0) { this.geometry = new THREE.IcosahedronGeometry(ss, 0); }
    else { this.geometry = null; }

    this.geo = new THREE.EdgesGeometry( this.geometry );
    this.material = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2, transparent: true, opacity: 1 } );
    this.wireframe = new THREE.LineSegments( this.geo, this.material );
    this.wireframe.position.y = 10;

    this.velocity = {x: 0, y: 0}
    this.acceleration = {x: 0, y: 0}
    this.fade = 0;
}
Basic.prototype.toMiddleMat = function() {
    this.wireframe = new THREE.Object3D();
    this.material = new THREE.MeshPhongMaterial({ color: 0xb5271e, 
                                                  emissive: 0x440d0b, 
                                                  side: THREE.DoubleSide, 
                                                  flatShading: true, 
                                                  transparent: true, 
                                                  opacity: 1.0 });
    this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    this.wireframe.add( new THREE.LineSegments(this.geo, this.lineMaterial) );
    this.wireframe.add( new THREE.Mesh( this.geometry, this.material ) );
    this.wireframe.position.y = 10;
}
Basic.prototype.addToScene = function() {
    scene.add(this.wireframe);
}
Basic.prototype.removeFromScene = function() {
    scene.remove(this.wireframe);
}

init();
animate();
function init() {
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / (window.innerHeight - 54), 1, 1000 );
    camera.position.z = 50;
    camera.position.y = 10;

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight - 54 );
  
    scene = new THREE.Scene();
    camera.lookAt(scene.position);

    lights = []
    lights[0] = new THREE.PointLight(0xffffff, 1, 0);
    lights[0].position.set(0, 40, 0);
    scene.add(lights[0]);
    lights[1] = new THREE.PointLight(0xffffff, 1, 0);
    lights[1].position.set(20, 40, 20);
    scene.add(lights[1]);
    lights[2] = new THREE.PointLight(0xffffff, 1, 0);
    lights[2].position.set(-20, -40, -20);
    scene.add(lights[2]);
    
    shapes = initAnimation();
    shapes.left.addToScene();
    shapes.right.addToScene();

    shapes.middle.toMiddleMat();
    shapes.middle.addToScene();

    particles = new Array();
    var PI2 = Math.PI * 2;
    var geometry = new THREE.CircleBufferGeometry( 1, 8 );
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    var i = 0;
    for ( var ix = 0; ix < particles_amountx; ix ++ ) {
        for ( var iy = 0; iy < particles_amounty; iy ++ ) {
            particle = particles[ i ++ ] = new THREE.Mesh( geometry, material );
            particle.position.x = (ix * particles_sep - ( ( particles_amountx * particles_sep ) / 2 )) + particles_xtrans;
            particle.position.z = (iy * particles_sep - ( ( particles_amounty * particles_sep ) / 2 )) + particles_ztrans;
            particle.lookAt( camera.position );
            scene.add( particle );
        }
    }

    animInt = window.setInterval(animStep, 6000);

    document.getElementById("headerAnim").appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    document.addEventListener( 'touchmove', onDocumentTouchMove, false );
}

function initAnimation() {
    seed = Math.floor(Math.random() * 5);
    shapes_i = [seed, (seed + 2) % 5, Math.abs((seed - 1) % 5)]
    var left = new Basic(shapes_i[0]);
    left.wireframe.position.x -= spreadx;
    var middle = new Basic(shapes_i[1]);
    var right = new Basic(shapes_i[2]);
    right.wireframe.position.x += spreadx;
    return { "left": left, "middle": middle, "right": right };
}

function getRandomI() {
    remaining = [1,1,1,1,1]
    for (var i = 0; i < 3; i++) {
        remaining[shapes_i[i]] = 0;
    }
    j = Math.floor(Math.random() * 5);
    while (remaining[j] == 0) {
        j = Math.floor(Math.random() * 5);
    }
    return j;
}

function animMorph(key) {
    old_i = shapes[key].type
    old_rot = shapes[key].wireframe.rotation;
    old_mid_rot = shapes.middle.wireframe.rotation

    if (key == "left") { shapes_i[1] = (shapes_i[0] + shapes_i[1]) % 5; }
    else { shapes_i[1] = (shapes_i[1] + shapes_i[2]) % 5; }
    next_shape = new Basic(getRandomI());

    
    shapes_i[key == "left" ? 0 : 2] = next_shape.type;
    shapes[key].removeFromScene();
    shapes[key] = next_shape;
    shapes[key].acceleration.x = 0;
    shapes[key].wireframe.position.x += (key == "left" ? (-1.0 * spreadx) : spreadx);
    shapes[key].wireframe.rotation = old_rot;
    shapes[key].material.opacity = 0;
    shapes[key].addToScene();
    window.setTimeout(function() {
        shapes[key].fade = 0.05;
    }, 1000);

    shapes.middle.removeFromScene();
    shapes.middle = new Basic((shapes.middle.type + old_i) % 5);
    shapes.middle.toMiddleMat();
    shapes.middle.wireframe.rotation = old_mid_rot;
    shapes.middle.fade = 0.04;
    shapes.middle.material.opacity = 0;
    shapes.middle.lineMaterial.opacity = 0;
    shapes.middle.addToScene();
}

function animStep() {
    direction = Math.floor(Math.random() * 2);
    if (direction == 0 && shapes.right.fade == 0.0 && shapes.left.fade == 0) {
        shapes.left.acceleration.x = 0.00035;
        shapes.left.fade = -0.003;
        //shapes.middle.fade = -0.05;
    }
    else if (shapes.left.fade == 0.0 && shapes.right.fade == 0) {
        shapes.right.acceleration.x = -0.00035;
        shapes.right.fade = -0.003;
        //shapes.middle.fade = -0.05;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / (window.innerHeight - 54);
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight - 54);
}

function onDocumentMouseMove( event ) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

function onDocumentTouchStart( event ) {
    if ( event.touches.length === 1 ) {
        event.preventDefault();
        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfY;
    }
}

function onDocumentTouchMove( event ) {
    if ( event.touches.length === 1 ) {
        event.preventDefault();
        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfY;
    }
}

function animate() {
    requestAnimationFrame( animate );

    camera.position.x += Math.sqrt(Math.abs( mouseX - camera.position.x )) * .01 * ((mouseX > 0) ? 1 : -1);
    camera.position.y -= Math.sqrt(Math.abs( - mouseY - camera.position.y )) * .01 * ((mouseY > 0) ? 1 : -1);
    camera.lookAt( scene.position );

    for (var key in shapes) {
        shapes[key].wireframe.rotation.x += xrot;
        shapes[key].wireframe.rotation.y += yrot;
        shapes[key].wireframe.position.x += shapes[key].velocity.x
        shapes[key].velocity.x += shapes[key].acceleration.x
        if (key != "middle" && Math.abs(shapes[key].wireframe.position.x) < 0.05) {
            shapes[key].fade = 0;
            animMorph(key);
        }
        if (Math.abs(shapes[key].wireframe.position.x) < 1.5 && key != "middle") {
            shapes.middle.fade = -0.05;
        }
        if (shapes[key].fade != 0.0) { 
            if (shapes[key].material.opacity > 1) { shapes[key].material.opacity = 1; shapes[key].fade = 0.0; }
            else if (shapes[key].material.opacity < 0) { shapes[key].material.opacity = 0; shapes[key].fade = 0.0; } 
            else { 
                shapes[key].material.opacity += shapes[key].fade;
                if (shapes[key].lineMaterial) { shapes[key].lineMaterial.opacity += (shapes[key].fade / 2); }
            }
        }
    }

    // particles
    var i = 0;
    for ( var ix = 0; ix < particles_amountx; ix ++ ) {
        for ( var iy = 0; iy < particles_amounty; iy ++ ) {
            particle = particles[ i++ ];
            particle.position.y = (( Math.sin( ( ix + particles_count ) * 0.3 ) * 50 ) +
                ( Math.sin( ( iy + particles_count ) * 0.5 ) * 50 )) + particles_ytrans;
            particle.scale.x = particle.scale.y = (( Math.sin( ( ix + particles_count ) * 0.3 ) + 1 ) * 0.5 +
                ( Math.sin( ( iy + particles_count ) * 0.5 ) + 1 ) * 0.5);
        }
    }

    renderer.render( scene, camera );

    particles_count += 0.025;
}
