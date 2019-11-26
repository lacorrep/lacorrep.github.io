console.log("Script OK")

// CONSTANTS -----------------------------------------------------

let t = 0; // time variable
const dt = 0.04; // time step

const A1 = 0.7; // amplitude of shear
const A2 = 0.2; // amplitude of bending
const A3 = 0.3; // frequency

let glob = {LX:1.3, LY: 0.6, H:0.4,
			plate_config: 1, // 0 : initial ; 1 : deformed
			showFibers: true,
			showEnvelop: true,
			envelop_alpha: 0.7};
glob.fiberLength = glob.H/2;

// CANVAS -----------------------------------------------------

let cv1 = document.getElementById("cv1");

let W = cv1.width;
let H = cv1.height;

// SCENE SETUP -----------------------------------------------------

let scene1 = new THREE.Scene();

// let camera1 = new THREE.PerspectiveCamera( 85, W/H, 0.1, 1000 ); // fov ratio near far
let camera1 = new THREE.OrthographicCamera(); camera1.zoom = 0.65; camera1.updateProjectionMatrix();
camera1.position.set(1,-2,2);

let renderer1 = new THREE.WebGLRenderer( { alpha: true, antialias: true, canvas: cv1 } );
renderer1.setSize( W, H );
renderer1.gammaInput = true;
renderer1.gammaOutput = true;
renderer1.shadowMap.enabled = true;

let controls1 = new THREE.TrackballControls( camera1, renderer1.domElement );
controls1.staticMoving = true;
// controls1.noZoom = true;
controls1.noPan = true;

let l_amb1 = new THREE.AmbientLight( 0xffffff , 0.3 ); // soft white light
scene1.add( l_amb1 );

const d = 50;
dlight1 = new THREE.DirectionalLight( 0xfff4e5, 1 );
dlight1.position.set( 0.5, -1, 0.7 );
dlight1.shadow.camera.left = -d;
dlight1.shadow.camera.right = d;
dlight1.shadow.camera.top = d;
dlight1.shadow.camera.bottom = -d;
dlight1.shadow.camera.far = 1000;
dlight1.shadow.bias = - 0.0001;
scene1.add( dlight1 );

// GEOMETRIES -----------------------------------------------------

let plane_resolution = 50; // # subdivisions of the plane
let fibers_resolution = 3; // # subdivisions of the plane for planting fibers

let m_midsurface = new THREE.MeshLambertMaterial( {color: "rgb(150,150,150)", side: THREE.DoubleSide} );
let c_fibers = "rgb(0,0,255)"; // color of the fibers

// Initial geometry

let S0 = new THREE.PlaneGeometry( 2*glob.LX, 2*glob.LY, plane_resolution, plane_resolution );

// Plate (3D)

let g_plate_0 = new THREE.BoxGeometry( 2*glob.LX, 2*glob.LY, glob.H, plane_resolution, plane_resolution, 1);
let g_plate = g_plate_0.clone();
let plate = new THREE.Mesh( g_plate, new THREE.MeshLambertMaterial( {color: 0x00aaFF, opacity: glob.envelop_alpha, transparent: true} ) );
plate.castShadow = true;
plate.receiveShadow = true;
scene1.add( plate );

// Plane (mid-surface)

let S = new THREE.PlaneGeometry( 2*glob.LX, 2*glob.LY, plane_resolution, plane_resolution );
let midsurface = new THREE.Mesh( S , m_midsurface );
midsurface.castShadow = true;
midsurface.receiveShadow = true;
scene1.add( midsurface );

// Fibers

let g_square_rough = new THREE.PlaneGeometry( 2*glob.LX, 2*glob.LY, 2*fibers_resolution, fibers_resolution );
let g_fibers = new THREE.Geometry();
for ( let i = 0, l = g_square_rough.vertices.length; i < l; i ++ ) {
	let ver = g_square_rough.vertices[i];
	g_fibers.vertices.push( // push new segment
		new THREE.Vector3( ver.x, ver.y, 0 ), 
		new THREE.Vector3( ver.x, ver.y, 1 )
	);
}
let m_fibers = new THREE.LineBasicMaterial( { color: c_fibers , linewidth: 2 } );
let fibers = new THREE.LineSegments(g_fibers, m_fibers);
scene1.add(fibers)


// FUNCTIONS -----------------------------------------------------

function transformation(X,Y,Z,t)
{
	// The transformation applied to the plate.
	let x, y, z;

	// Simple bending (Reissner-Mindlin)
	theta = A1*Math.cos(A3*t)*Y/glob.LY;
	x = X;
	y = Y - Z*Math.sin(theta);
	z = Z + A2*Math.cos(A3*t)*((X/glob.LX)*(X/glob.LX)) + Z*( Math.cos(theta)-1 );

	return {x:x, y:y, z:z}
}


function animate1()
{
	if( glob.plate_config == 0)
	{
		for( let i = 0, l = S0.vertices.length; i < l; i++ )
		{
			let ver0 = S0.vertices[i];
			S.vertices[i].x = ver0.x;
			S.vertices[i].y = ver0.y;
			S.vertices[i].z = ver0.z;
		}
	}
	else if( glob.plate_config == 1)
	{
		for( let i = 0, l = S0.vertices.length; i < l; i++ )
		{
			let ver0 = S0.vertices[i];
			let P = transformation(ver0.x, ver0.y, 0, t); // calcul à partir des coordonnées dans la position non déformée (X,Y,Z)
			S.vertices[i].x = P.x;
			S.vertices[i].y = P.y;
			S.vertices[i].z = P.z;
		}
	}
	// Update deformed mid-surface
	S.verticesNeedUpdate = true;
	S.computeVertexNormals();

	// Will not be necessary at every frame (for when the deformed shape isn't time dependent)
	plate.visible = glob.showEnvelop;
	if( plate.visible )
	{
		if( glob.plate_config == 0)
		{
			for( let i = 0, l = g_plate_0.vertices.length; i < l; i++ )
			{
				let ver0 = g_plate_0.vertices[i];
				g_plate.vertices[i].x = ver0.x;
				g_plate.vertices[i].y = ver0.y;
				g_plate.vertices[i].z = ver0.z;
			}
		}
		else if( glob.plate_config == 1)
		{
			for( let i = 0, l = g_plate_0.vertices.length; i < l; i++ )
			{
				let ver0 = g_plate_0.vertices[i];
				let Q = transformation(ver0.x, ver0.y, ver0.z, t); // calcul à partir des coordonnées dans la position non déformée (X,Y,Z)
				g_plate.vertices[i].x = Q.x;
				g_plate.vertices[i].y = Q.y;
				g_plate.vertices[i].z = Q.z;
			}
		}
		// Update deformation
		g_plate.verticesNeedUpdate = true;
		g_plate.computeVertexNormals(true); // true is optional
	}
	plate.material.opacity = glob.envelop_alpha;


	// Fibers
	fibers.visible = glob.showFibers;
	if( fibers.visible ) // seulement si fibres affichées
	{
		if( glob.plate_config == 0)
		{
			for ( let i = 0, l = g_square_rough.vertices.length; i < l; i++ )
			{
				let ver0 = g_square_rough.vertices[i];
				g_fibers.vertices[2*i  ].set( ver0.x, ver0.y, -glob.fiberLength );
				g_fibers.vertices[2*i+1].set( ver0.x, ver0.y,  glob.fiberLength );
			}
		}
		else if( glob.plate_config == 1)
		{
			for ( let i = 0, l = g_square_rough.vertices.length; i < l; i++ )
			{
				let ver0 = g_square_rough.vertices[i];
				let Qinf = transformation(ver0.x, ver0.y, glob.fiberLength, t); // calcul à partir des coordonnées dans la position non déformée (X,Y,Z)
				let Qsup = transformation(ver0.x, ver0.y, -glob.fiberLength, t); // calcul à partir des coordonnées dans la position non déformée (X,Y,Z)
				g_fibers.vertices[2*i  ].set( Qinf.x, Qinf.y, Qinf.z );
				g_fibers.vertices[2*i+1].set( Qsup.x, Qsup.y, Qsup.z );
			}
		}
		// Update fibers
		g_fibers.verticesNeedUpdate = true;
	}

	controls1.update();

	t += dt;
	renderer1.render( scene1, camera1 );
	requestAnimationFrame( animate1 );
}

function init1()
{
	animate1();
	cv1.addEventListener("dblclick",function(){ glob.plate_config = 1-glob.plate_config; })
}

function resize()
{
	let ratio = W/H;
	let Lmin = Math.min(500,cv1.parentElement.clientWidth-60);
	cv1.width = Lmin;
	cv1.height = Lmin/ratio;
	W = Lmin;
	H = Lmin/ratio;
	renderer1.setSize( W, H );
}
window.addEventListener("resize",resize);
resize();

init1();