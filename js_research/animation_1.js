console.log("Script 1 OK")

// This 3D animation got you curious? Good ! I would be excited too if I was you. We have that in common.

// CONSTANTS -----------------------------------------------------

let glob = {LX:1.3, LY: 0.6, H:0.4,
			plate_config: 1, // 0 : initial ; 1 : deformed
			showFibers: true,
			showEnvelop: true,
			envelop_alpha: 0.7,
			theta:-0.28,
			phi:0.83};
glob.fiberLength = glob.H/2;

let mouse = {px: 0, py: 0, sensitivity:1/80}; // mouse info (px: previous x, py: previous y, sensitivity)


function init1()
{
	// CANVAS -----------------------------------------------------

	let cv1 = document.getElementById("cv1");

	cv1.addEventListener("mousemove",function(evt){
		if( evt.buttons == 1 )
		{
			glob.phi += mouse.sensitivity*evt.movementX;
			glob.theta += mouse.sensitivity*evt.movementY;
		}
	})
	cv1.addEventListener("touchstart",function(evt){
		// Store position before the movement begins, otherwise the deltaX and deltaY are wrong
		mouse.px = evt.touches[0].clientX;
		mouse.py = evt.touches[0].clientY;
	})
	cv1.addEventListener("touchmove",function(evt){
		glob.phi += mouse.sensitivity*(evt.touches[0].clientX-mouse.px);
		glob.theta += mouse.sensitivity*(evt.touches[0].clientY-mouse.py);
		mouse.px = evt.touches[0].clientX;
		mouse.py = evt.touches[0].clientY;
	})

	// Sometimes in panick the user will double click and that would reset the view. Incompatible with the way I handle "touch" on mobiles.
	// cv1.addEventListener("dblclick",function(){
	// 	glob.theta = -0.28;
	// 	glob.phi = 0.83;
	// 	// glob.plate_config = 1-glob.plate_config;
	// })

	let W = cv1.width;
	let H = cv1.height;

	// SCENE SETUP -----------------------------------------------------

	let scene1 = new THREE.Scene();

	// let camera1 = new THREE.PerspectiveCamera( 85, W/H, 0.1, 1000 ); // fov ratio near far
	let camera1 = new THREE.OrthographicCamera(W/-2,W/2,H/2,H/-2,1,10); camera1.zoom = 160; camera1.updateProjectionMatrix();
	camera1.position.set(0,-2,2);
	camera1.lookAt(0,0,0);

	let renderer1 = new THREE.WebGLRenderer( { alpha: true, antialias: true, canvas: cv1 } );
	renderer1.setSize( W, H );
	renderer1.gammaInput = true;
	renderer1.gammaOutput = true;
	renderer1.shadowMap.enabled = true;

	let t = 0; // time variable
	const dt = 0.05; // time step

	const A1 = 0.7; // amplitude of shear
	const A2 = 0.2; // amplitude of bending
	const A3 = 0.3; // frequency

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

	let SceneObjects = new THREE.Group();
	scene1.add(SceneObjects);
	SceneObjects.rotation.z = 0.5;
	SceneObjects.position.set(0.1,0.2,-0.2);

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
	SceneObjects.add( plate );

	// Plane (mid-surface)

	let S = new THREE.PlaneGeometry( 2*glob.LX, 2*glob.LY, plane_resolution, plane_resolution );
	let midsurface = new THREE.Mesh( S , m_midsurface );
	midsurface.castShadow = true;
	midsurface.receiveShadow = true;
	SceneObjects.add( midsurface );

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
	SceneObjects.add(fibers)

	// Frame of reference

	let origin = new THREE.Vector3( 0.2*glob.LX, 2.5*glob.LY, -0.5*glob.H );
	let arrow_X = new THREE.ArrowHelper( new THREE.Vector3(-1, 0,0), origin, 0.5, "#000" );
	let arrow_Y = new THREE.ArrowHelper( new THREE.Vector3( 0,-1,0), origin, 0.5, "#000" );
	let arrow_Z = new THREE.ArrowHelper( new THREE.Vector3( 0, 0,1), origin, 0.5, "#000" );
	SceneObjects.add( arrow_X );
	SceneObjects.add( arrow_Y );
	SceneObjects.add( arrow_Z );


	// FUNCTIONS -----------------------------------------------------

	function transformation(X,Y,Z,t)
	{
		// The transformation applied to the plate.

		// Simple bending (Reissner-Mindlin)
		theta = A1*Math.cos(A3*t)*Y/glob.LY;
		let x = X;
		let y = Y - Z*Math.sin(theta);
		let z = Z + A2*Math.cos(A3*t)*((X/glob.LX)*(X/glob.LX)-1) + Z*( Math.cos(theta)-1 );

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

		// Update rotation
		SceneObjects.rotation.z = glob.phi;
		SceneObjects.rotation.x = glob.theta;

		t += dt;
		renderer1.render( scene1, camera1 );
		requestAnimationFrame( animate1 );
	}
	animate1();


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

}
init1();