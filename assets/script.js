const FPS = 60;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;

const STROKE_COLOR = "#ddd";
const CANVAS_COLOR = "#222";
const NODE_COLORS = {
	default: "#555",
	highlighted: "#FFE400",
	invalid: "#FA5560",
}

const STATE = {
	is_lasso: false,
	is_dragging: false,
	dragging_node_idx: -1,
	lasso_start: -1,
	lasso_end: -1,
}


const NODES = [
	{
		x: 230,
		y: 450,
		radius: 10,
		name: "",
	},
	{
		x: 110,
		y: 90,
		radius: 10,
		name: "",
	},
	{
		x: 20,
		y: 80,
		radius: 10,
		name: "",
	},
];


/*
	Functions
*/

function clear(canvas)
{
	ctx.fillStyle = CANVAS_COLOR;
	ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function draw_lines_between_nodes(NODES)
	{
		for(let i=0; i < NODES.length; i += 1)
		for(let k=0; k < NODES.length; k += 1)
		{
			if(i > k)
			{
				ctx.beginPath();
				ctx.moveTo(
					NODES[i]["x"] * CANVAS_WIDTH,
					NODES[i]["y"] * CANVAS_HEIGHT,
				);
				ctx.lineTo(
					NODES[k]["x"] * CANVAS_WIDTH,
					NODES[k]["y"] * CANVAS_HEIGHT,
				);
				ctx.strokeStyle = STROKE_COLOR;
				ctx.stroke();
			}
		}
	}


function draw_node(ctx, node)
{
	ctx.beginPath();
 	ctx.arc(
 		node["x"],
 		node["y"],
 		node["radius"],
 		0,
 		2 * Math.PI,
 		false,
 	);
 	

 	// select the node color based on the node's state
 	let node_color;
 	node_color = NODE_COLORS["default"];

 	if(STATE["dragging_node_idx"] > -1 && NODES[STATE["dragging_node_idx"]] === node)
 	{
 		node_color = NODE_COLORS["highlighted"];
 	}
 	else
 	{
 		node_color = NODE_COLORS["default"];
	}

	ctx.fillStyle = node_color;
	ctx.fill();
}


function is_inside_box(x, y, box_x0, box_x1, box_y0, box_y1)
{
	if(x >= box_x0 && x <= box_x1 && y >= box_y0 && y <= box_y1)
		return true;
	return false;
}

const lasso_button = document.getElementById("lasso-button");
const canvas = document.getElementById("app-canvas");
const ctx = canvas.getContext("2d");
canvas.height = CANVAS_HEIGHT;
canvas.width = CANVAS_WIDTH;

clear(canvas);
for(node of NODES)
	draw_node(ctx, node);



/*
	Event Handlers
*/

canvas.addEventListener("mousedown", function(e) {

	if(STATE["is_lasso"] === false)
	{
		for(let idx=0; idx<NODES.length; idx+=1)
		{
			let box_x0 = NODES[idx]["x"] - NODES[idx]["radius"];
			let box_x1 = NODES[idx]["x"] + NODES[idx]["radius"];
			let box_y0 = NODES[idx]["y"] - NODES[idx]["radius"];
			let box_y1 = NODES[idx]["y"] + NODES[idx]["radius"];

			if(
				is_inside_box(e.offsetX, e.offsetY, box_x0, box_x1, box_y0, box_y1)
			)
			{
				draw_node(ctx, NODES[idx]);
				STATE["dragging_node_idx"] = idx;
			}
		}
	}
	else
	{
		STATE["lasso_start"] = [e.offsetX, e.offsetY];
	}
})

canvas.addEventListener("mousemove", function(e) {
	// move node if we just clicked on one
	if(STATE["is_lasso"] === false && STATE["dragging_node_idx"] > -1)
	{
		clear(canvas);

		// update new location of moved node
		let node_idx = STATE["dragging_node_idx"];
		NODES[node_idx]["x"] = e.offsetX;
		NODES[node_idx]["y"] = e.offsetY;

		// redraw the nodes to screen
		for(node of NODES)
			draw_node(ctx, node);
	}
	else
	if(STATE["is_lasso"] === true && STATE["lasso_start"] !== -1)
	{
		clear(canvas);

		// update the lasso coordinates
		STATE["lasso_end"] = [e.offsetX, e.offsetY];

		// redraw the nodes as they were
		for(node of NODES)
			draw_node(ctx, node);

		ctx.fillStyle = NODE_COLORS["highlighted"] + "11";
		ctx.strokeStyle = "dotted";
		ctx.fillRect(
			STATE["lasso_start"][0],
			STATE["lasso_start"][1],
			STATE["lasso_end"][0] - STATE["lasso_start"][0],
			STATE["lasso_end"][1] - STATE["lasso_start"][1],
		);
	}
})

canvas.addEventListener("mouseup", function(e) {
	STATE["dragging_node_idx"] = -1;
	
	// disable lasso mode
	STATE["is_lasso"] = false;
	canvas.style.cursor = "default";
})


lasso_button.addEventListener("click", function(e) {
	canvas.style.cursor = "crosshair";
	STATE["is_lasso"] = true;
	STATE["lasso_start"] = -1;
	STATE["lasso_end"] = -1;
})
