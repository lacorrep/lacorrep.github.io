console.log("Script OK")

let glob = {};

/* CANVAS */

let cv1 = document.getElementById("cv1");

const W = cv1.width;
const H = cv1.height;
/*
let scene1 = new THREE.Scene();

let camera1 = new THREE.PerspectiveCamera( 85, W/H, 0.1, 1000 ); // fov ratio near far
let renderer1 = new THREE.WebGLRenderer( { alpha: true, antialias: true, canvas: cv1 } );
renderer1.setSize( W, H ); //TODO make it responsive


let hlight1 = new THREE.AmbientLight( 0xffffff , 0.3 ); // soft white light
scene1.add( hlight1 );
*/


function animate1()
{
	requestAnimationFrame( animate1 );
	renderer1.render( scene1, camera1 );
}

function init1()
{
	animate1();
}