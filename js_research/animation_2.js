console.log("Script 2 OK")

// I gotta say, this one isn't as impressive as the 3D one. But it is still very informative.
// It took me 2 hours of tinkering though.

function init2()
{

	// Rendering options

	const shear_angle_amp = 5;
	const bending_amp = 80;
	const normals_length = 50;

	let t = 0;
	const dt = 0.01;

	// Plate geometry

	const N = 13;
	const L = 380;
	const H = 70;

	let plate = {x: new Array(N), y: new Array(N)};
	for(let i = 0; i < N; i++) {
		plate.x[i] = i*L/(N-1);
		plate.y[i] = H/2;
	}

	let midsurface = plate.x.slice(); // trick found on StackOverflow to copy by value
	let x_copy = plate.x.slice();
	let y_copy = plate.y.slice();
	plate.x = plate.x.concat( x_copy.reverse() );
	plate.y = plate.y.concat( y_copy.map(x => -x) );

	// Current point

	let current_point = {X:0.33*L, Y:0};

	// Canvas

	let cv = document.getElementById("cv2");
	let ctx = cv.getContext('2d');
	const Ox = 10, Oy = 0.6*cv.height; // origine
	ctx.translate(Ox,Oy);
	ctx.lineCap = "round";

	cv.addEventListener("mousemove",function(evt){
		let rect = this.getBoundingClientRect();
		current_point.X = (evt.clientX - rect.left - Ox).clamp(0,L);
		current_point.Y = evt.clientY - rect.top - Oy;
	})

	// cv.addEventListener("mouseout",function(evt){ current_point.X = 0.33*L;  })

	// Mechanical transformation

	function transformation(X,Y,t)
	{
		let theta = shear_angle_amp*Math.cos(t)*(X/L)*(1-X/L);
		let x = X - Y*Math.sin(theta);
		let y = Y - bending_amp*(X/L)**2 + Y*(Math.cos(theta)-1); // we may remove the bending term later
		
		return {x:x, y:y};
	}

	// Differential

	function differential(X,Y,D,t)
	{
		// Compute the derivative of the current position when moving by a step D,
		// then normalize.
		let Q = transformation(X, Y, t);
		let Q_prime = transformation(X+D.x, Y+D.y, t);
		let dl = Math.sqrt(D.x**2 + D.y**2); // norm of the finite step
		let g_x = (Q_prime.x - Q.x)/dl;
		let g_y = (Q_prime.y - Q.y)/dl;
		let norme = Math.sqrt(g_x**2 + g_y**2);
		
		return {x: g_x/norme, y: g_y/norme};
	}

	// Rendering

	function render2()
	{
		ctx.clearRect(-Ox,-Oy,cv.width,cv.height);

		ctx.lineWidth = 1;

		// Plate side view

		ctx.fillStyle = 'rgb(97,223,250)'; //rgb(94,210,236)
		ctx.beginPath();
		ctx.moveTo(plate.x[0], plate.y[0]);
		for(let i = 1, l = plate.x.length; i <= l; i++)
		{
			let Q = transformation(plate.x[i], plate.y[i], t)
			ctx.lineTo(Q.x, Q.y);
		}
		ctx.closePath();
		ctx.fill();

		// Midsurface

		ctx.strokeStyle = '#555';
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.moveTo(midsurface[0], 0);
		for(let i = 1, l = midsurface.length; i <= l; i++)
		{
			let Q = transformation(midsurface[i], 0, t)
			ctx.lineTo(Q.x, Q.y);
		}
		ctx.stroke();

		// Fibers

		ctx.strokeStyle = 'rgba(0,102,255,0.9)';
		ctx.lineWidth = 0.7;
		for(let i = 0, l = plate.x.length; i <= l; i++)
		{
			let Qsup = transformation(plate.x[i], plate.y[i], t)
			let Qinf = transformation(plate.x[2*N-i-1], plate.y[2*N-i-1], t)
			ctx.beginPath();
			ctx.moveTo(Qsup.x, Qsup.y);
			ctx.lineTo(Qinf.x, Qinf.y);
			ctx.closePath();
			ctx.stroke();
		}

		// Current fiber

		ctx.strokeStyle = '#06f';
		ctx.lineWidth = 3;
		ctx.beginPath();
		let Qsup = transformation(current_point.X, -H/2, t);
		let Qinf = transformation(current_point.X, H/2, t);
		ctx.moveTo(Qsup.x, Qsup.y);
		ctx.lineTo(Qinf.x, Qinf.y);
		ctx.closePath();
		ctx.stroke();

		// Current point

		// ctx.fillStyle = '#fff';
		let current_point_image = transformation(current_point.X,0,t);
		// ctx.beginPath();
		// ctx.arc(current_point_image.x, current_point_image.y, 3, 0, 2*Math.PI);
		// ctx.closePath();
		// ctx.fill();


		// Normal vectors to the upper and lower surfaces
		// Find out how I wrote the expression of the normal vector (in the case
		// a 3D plate) in the papers published during my PhD.

		ctx.strokeStyle = '#f80';
		let Q = transformation(current_point.X, -H/2, t);
		let Q_prime = transformation(current_point.X+0.01, -H/2, t);
		let g_1x = (Q_prime.x - Q.x)/0.01;
		let g_1y = (Q_prime.y - Q.y)/0.01;
		let norme = Math.sqrt(g_1x**2 + g_1y**2);
		ctx.beginPath();
		canvas_arrow(ctx, Q.x, Q.y, Q.x+normals_length*g_1y/norme, Q.y-normals_length*g_1x/norme) // cross product g1 x e_3
		ctx.closePath();
		ctx.stroke();

		Q = transformation(current_point.X, H/2, t);
		Q_prime = transformation(current_point.X+0.01, H/2, t);
		g_1x = (Q_prime.x - Q.x)/0.01;
		g_1y = (Q_prime.y - Q.y)/0.01;
		norme = Math.sqrt(g_1x**2 + g_1y**2);
		ctx.beginPath();
		canvas_arrow(ctx, Q.x, Q.y, Q.x-normals_length*g_1y/norme, Q.y+normals_length*g_1x/norme) // cross product g1 x e_3
		ctx.closePath();
		ctx.stroke();

		// \vec a^3

		ctx.strokeStyle = '#000';
		ctx.lineWidth = 2;
		let a3 = differential(current_point.X,0, {x:0.01,y:0}, t);
		ctx.save();
		ctx.translate(current_point_image.x, current_point_image.y);
		ctx.beginPath();
		canvas_arrow(ctx, 0, 0, normals_length*a3.y, -normals_length*a3.x); // cross product
		ctx.closePath();
		ctx.stroke();
		ctx.restore();

		// Frame of reference

		ctx.strokeStyle = '#000';
		ctx.lineWidth = 2;
		ctx.save();
		ctx.translate(0, 100);
		ctx.beginPath();
		canvas_arrow(ctx, 0, 0, 25, 0);
		ctx.closePath();
		ctx.stroke();
		ctx.beginPath();
		canvas_arrow(ctx, 0, 0, 0, -25);
		ctx.closePath();
		ctx.stroke();
		ctx.restore();

		t += dt;
		requestAnimationFrame(render2);
	}
	render2();
}
init2();

// Utility functions
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};