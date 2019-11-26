function canvas_arrow(ctx, x_a, y_a, x_b, y_b)
{
	var head_length = 10;   // length of arrow's head in pixels
	var angle = Math.atan2(y_b-y_a,x_b-x_a);
	ctx.moveTo(x_a, y_a);
	ctx.lineTo(x_b, y_b);
	ctx.moveTo(x_b, y_b);
	ctx.lineTo(x_b-head_length*Math.cos(angle-Math.PI/6),y_b-head_length*Math.sin(angle-Math.PI/6));
	ctx.moveTo(x_b, y_b);
	ctx.lineTo(x_b-head_length*Math.cos(angle+Math.PI/6),y_b-head_length*Math.sin(angle+Math.PI/6));
}