"use strict";

const DEBUG = 1;
const FPS = 60;
const CANVAS_SCALE = 3;
const CANVAS_WIDTH = 600 * CANVAS_SCALE;
const CANVAS_HEIGHT = 600 * CANVAS_SCALE;

const CANVAS_COLOR = "#222";
const STROKE_COLOR = "#FFFFFF44";
const NODE_RADIUS = 24;
const TEXT_FONT_SIZE = 34;

const CLUSTER_COLOR = "#FFE400";
const CLUSTER_LINE_DASH = [1, 10];
const NODE_COLORS = {
    default: "#FA5560",
    label: "#E4E4E4",
}

const CAMERA = {
    x: 0,
    y: 0,
    zoom: 0,
    minZoom: 0,
    maxZoom: 10,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
}

const CONTROLLER = {
    MetaLeft: 0,
}

const STATE = { 
    draggingNodeIndex: null,
    drawingMode: false,
    drawingStartCoords: null,
    drawingLineCoords: null,
}

const NODES = [
    {
        id: 0,
        label: "Point A",
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        nodeConnections: [1],
        clusterConnections: [],
    },
    {
        id: 1,
        label: "Point B",
        x: CANVAS_WIDTH / 2 + 80 * CANVAS_SCALE,
        y: CANVAS_HEIGHT / 2 - 14 * CANVAS_SCALE,
        nodeConnections: [0],
        clusterConnections: [],
    },
    {
        id: 2,
        label: "Point C",
        x: CANVAS_WIDTH / 2 - 36 * CANVAS_SCALE,
        y: CANVAS_HEIGHT / 2 + 70 * CANVAS_SCALE,
        nodeConnections: [],
        clusterConnections: [],
    },
    {
        id: 3,
        label: null,
        x: CANVAS_WIDTH / 2 - 30 * CANVAS_SCALE,
        y: CANVAS_HEIGHT / 2 + 120 * CANVAS_SCALE,
        nodeConnections: [],
        clusterConnections: [],
    },
];

function init_node(id, x, y, nodeConnections, clusterConnections)
{
    return {
        id: id,
        label: null,
        x: x,
        y: y,
        nodeConnections: nodeConnections,
        clusterConnections: clusterConnections,
    }
}

function create_node(x, y)
{
    let new_id = NODES.length;
    let new_node = init_node(new_id, x, y, [], []);
    NODES.push(new_node);
}

function clear(canvas)
{
    ctx.fillStyle = CANVAS_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function is_inside_box(x, y, box_x0, box_x1, box_y0, box_y1)
{
    if(x >= box_x0 && x <= box_x1 && y >= box_y0 && y <= box_y1)
        return true;
    return false;
}

function draw_line_between_two_nodes(node_a, node_b)
{
    ctx.beginPath();
    ctx.setLineDash([0, 0]);
    ctx.mozDash = [0, 0];
    ctx.moveTo(
        node_a["x"],
        node_a["y"],
    )
    ctx.lineTo(
        node_b["x"],
        node_b["y"],
    )
    ctx.strokeStyle = STROKE_COLOR;
    ctx.stroke();
}


function draw_node(ctx, node)
{
    // outline the node
    ctx.beginPath();
    ctx.arc(
        node["x"],
        node["y"],
        NODE_RADIUS,
        0,
        2 * Math.PI,
        false,
    );
 
    // color the node
    ctx.fillStyle = NODE_COLORS["default"];
    ctx.fill();

    // type the node label
    let y_text_shift = 5;
    if(node["label"] !== null && node["label"] !== "")
    {
        ctx.font = TEXT_FONT_SIZE + "px Bodoni";
        ctx.textAlign = "center";
        ctx.fillStyle = NODE_COLORS["label"];
        ctx.fillText(
            node["label"],
            node["x"],
            node["y"] - NODE_RADIUS - y_text_shift
        );
    }
}

function draw_nodal_connections(NODES)
{
    let alreadyTraversed = [];
    for(let idx=0; idx<NODES.length; idx+=1)
    {
        for(let id of NODES[idx]["nodeConnections"])
        {
            if(!alreadyTraversed.includes(id))
            {
                let node_a = NODES[idx]
                let node_b = NODES[id]
                draw_line_between_two_nodes(node_a, node_b);
                alreadyTraversed.push(id);
            }
        }
    }
}

function draw_scene(NODES)
{
    clear(canvas);

    draw_nodal_connections(NODES);

    for(let node of NODES)
        draw_node(ctx, node);

    if(STATE["drawingLineCoords"] !== null)
    {
        // connect all points in drawn line
        ctx.beginPath();
        if(STATE["drawingLineCoords"].length <= 2)
        {
            ctx.moveTo(
                STATE["drawingLineCoords"][0][0],
                STATE["drawingLineCoords"][0][0],
            )
            ctx.lineTo(
                STATE["drawingLineCoords"][1][0],
                STATE["drawingLineCoords"][1][1],
            )
        }
        else
        {
            for(let idx=0; idx<STATE["drawingLineCoords"].length-1; idx+=1)
            {
                ctx.moveTo(
                    STATE["drawingLineCoords"][idx][0],
                    STATE["drawingLineCoords"][idx][1],
                )
                ctx.lineTo(
                    STATE["drawingLineCoords"][idx+1][0],
                    STATE["drawingLineCoords"][idx+1][1],
                )
            }
        }
        // set path style
        ctx.strokeStyle = CLUSTER_COLOR;
        if(ctx.setLineDash !== undefined)
            ctx.setLineDash(CLUSTER_LINE_DASH);
        if(ctx.mozDash !== undefined)
            ctx.mozDash = CLUSTER_LINE_DASH;
        ctx.stroke();
    }

}

// setup buttons
const squarePlus = document.getElementById("square-plus");

// setup canvas
const canvas = document.getElementById("app-canvas");
const ctx = canvas.getContext("2d");
canvas.height = CANVAS_HEIGHT;
canvas.width = CANVAS_WIDTH;

draw_scene(NODES);


// ***************
// Event Listeners
// ***************

// save keyboard input
window.addEventListener("keydown", (e) => {
    if(e.code === "MetaLeft")
        CONTROLLER["MetaLeft"] = 1;
})

window.addEventListener("keyup", (e) => {
    if(e.code === "MetaLeft")
        CONTROLLER["MetaLeft"] = 0;
})

canvas.addEventListener("mousedown", (e) => {
    console.log("e.offsetX is ", e.offsetX);

    if(CONTROLLER["MetaLeft"] === 1)
    {
        STATE["drawingMode"] = 1
        STATE["drawingLineCoords"] = [
            (e.offsetX * CANVAS_SCALE, e.offsetY * CANVAS_SCALE)
        ];
    }

    if(STATE["drawingMode"] !== 1)
    {
        for(let idx=0; idx<NODES.length; idx+=1)
        {
            let box_x0 = NODES[idx]["x"] - NODE_RADIUS;
            let box_x1 = NODES[idx]["x"] + NODE_RADIUS;
            let box_y0 = NODES[idx]["y"] - NODE_RADIUS;
            let box_y1 = NODES[idx]["y"] + NODE_RADIUS;

            if(
                is_inside_box(
                    e.offsetX * CANVAS_SCALE,
                    e.offsetY * CANVAS_SCALE,
                    box_x0,
                    box_x1,
                    box_y0, 
                    box_y1,
                )
            )
            {
                draw_node(ctx, NODES[idx]);
                STATE["draggingNodeIndex"] = idx;
            }
        }
    }
})

canvas.addEventListener("mousemove", (e) => {
    if(STATE["drawingMode"] === 1)
    {
        // add current mouse location to drawing path
        STATE["drawingLineCoords"].push(
            [
                e.offsetX * CANVAS_SCALE,
                e.offsetY * CANVAS_SCALE
            ]
        );
        console.log(STATE["drawingLineCoords"]);
    }
    else
    if(STATE["draggingNodeIndex"] !== null)
    {
        let node_idx = STATE["draggingNodeIndex"];
        NODES[node_idx]["x"] = e.offsetX * CANVAS_SCALE;
        NODES[node_idx]["y"] = e.offsetY * CANVAS_SCALE;
    }

    draw_scene(NODES);
})

canvas.addEventListener("mouseup", (e) => {
    STATE["drawingMode"] = 0;
    STATE["drawingLineCoords"] = null
    STATE["draggingNodeIndex"] = null;
})

canvas.addEventListener("contextmenu", (e) => {
    console.log("contextmenu ", e);
})

squarePlus.addEventListener("click", (e) => {
    // create node
    let x = Math.floor(Math.random() * CANVAS_WIDTH);
    let y = Math.floor(Math.random() * CANVAS_HEIGHT);
    create_node(x, y);
    draw_scene(NODES);
})

canvas.addEventListener("wheel", function(e) {
    e.preventDefault();
    if(e.deltaY > 0)
    {
        CAMERA["zoom"] = Math.min(CAMERA["zoom"]+1, CAMERA["maxZoom"]);
    }
    else
    {
        CAMERA["zoom"] = Math.max(CAMERA["zoom"]-1, CAMERA["minZoom"]);
    }
})
