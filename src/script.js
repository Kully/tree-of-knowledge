"use strict";

const DEBUG = 1;
const FPS = 60;
const CANVAS_SCALE = 3;

const BASE_CANVAS_WIDTH = window.innerWidth;
const BASE_CANVAS_HEIGHT = window.innerHeight;
const CANVAS_WIDTH = BASE_CANVAS_WIDTH * CANVAS_SCALE;
const CANVAS_HEIGHT = BASE_CANVAS_HEIGHT * CANVAS_SCALE;
const CANVAS_COLOR = "#222";

const NODE_RADIUS = 24;
const TEXT_FONT_SIZE = 34;
const HIGHLIGHT_COLOR = "#FFE400";
const CLUSTER_LINE_DASH = [1, 1];
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
    Meta: 0,
}

const NUMBERS = "1234567890";
const ALPHABET_KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const STATE = { 
    draggingNodeIndex: null,
    drawingMode: false,
    drawingStartCoords: null,
    drawingLineCoords: null,
    lastClickedNode: null,
    lastDblClickedNode: null,
    namingMode: false,
    keysDownSinceNamingMode: 0,
}

const NODE_STYLE_LOOKUP = {
    default: {
        strokeStyle: "#00000000",
        lineWidth: 0,
        nodeColor: "#FA5560",
        labelColor: "#E4E4E4",
    },
    selected: {
        strokeStyle: "#FFE400",
        lineWidth: 8,
        nodeColor: "#FA5560",
        labelColor: "#FFE400",
    },
    rename: {
        strokeStyle: "#FFE400",
        lineWidth: 8,
        nodeColor: "#FA5560",
        labelColor: "#FA5560",
    }
}

const CONNECTION_STYLE = {
    strokeStyle: "#FFFFFF44",
    lineWidth: 1,
    lineDash: [0, 0],
}

const NODES = [
    {
        id: 0,
        label: "Apple",
        type: "default",
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        nodeConnections: [1],
        clusterConnections: [],
    },
    {
        id: 1,
        label: "Orange",
        type: "default",
        x: CANVAS_WIDTH / 2 + 80 * CANVAS_SCALE,
        y: CANVAS_HEIGHT / 2 - 14 * CANVAS_SCALE,
        nodeConnections: [0],
        clusterConnections: [],
    },
    {
        id: 2,
        label: "Pear",
        type: "default",
        x: CANVAS_WIDTH / 2 - 36 * CANVAS_SCALE,
        y: CANVAS_HEIGHT / 2 + 70 * CANVAS_SCALE,
        nodeConnections: [],
        clusterConnections: [],
    },
    {
        id: 3,
        label: "",
        type: "default",
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
        type: "default",
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
    ctx.moveTo(
        node_a["x"],
        node_a["y"],
    )
    ctx.lineTo(
        node_b["x"],
        node_b["y"],
    )
    ctx.lineWidth = CONNECTION_STYLE["lineWidth"];
    ctx.strokeStyle = CONNECTION_STYLE["strokeStyle"];
    ctx.mozDash = CONNECTION_STYLE["lineDash"];
    ctx.setLineDash(CONNECTION_STYLE["lineDash"]);
    ctx.stroke();
}


function draw_node(ctx, node)
{
    // outline and color in the node
    ctx.beginPath();
    ctx.arc(
        node["x"],
        node["y"],
        NODE_RADIUS,
        0,
        2 * Math.PI,
        false,
    );
    ctx.fillStyle = NODE_STYLE_LOOKUP[node["type"]]["nodeColor"];
    ctx.strokeStyle = NODE_STYLE_LOOKUP[node["type"]]["strokeStyle"];
    ctx.lineWidth = NODE_STYLE_LOOKUP[node["type"]]["lineWidth"];
    ctx.stroke();
    ctx.fill();

    // display the label
    let textDeltaY = 12;
    if(node["label"] !== null && node["label"] !== "")
    {
        ctx.fillStyle = NODE_STYLE_LOOKUP[node["type"]]["labelColor"];
        ctx.font = TEXT_FONT_SIZE + "px Bodoni";
        ctx.textAlign = "center";
        ctx.fillText(
            node["label"],
            node["x"],
            node["y"] - NODE_RADIUS - textDeltaY
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
        ctx.strokeStyle = HIGHLIGHT_COLOR;
        if(ctx.setLineDash !== undefined)
            ctx.setLineDash(CLUSTER_LINE_DASH);
        if(ctx.mozDash !== undefined)
            ctx.mozDash = CLUSTER_LINE_DASH;
        ctx.stroke();
    }

}

// setup canvas
const canvas = document.getElementById("app-canvas");
const ctx = canvas.getContext("2d");
canvas.style.height = BASE_CANVAS_HEIGHT + "px";
canvas.style.width = BASE_CANVAS_WIDTH + "px";
canvas.height = CANVAS_HEIGHT;
canvas.width = CANVAS_WIDTH;


draw_scene(NODES);

// ***************
// Event Listeners
// ***************

// save keyboard input
window.addEventListener("keydown", (e) => {
    if(e.key === "Meta")
        CONTROLLER["Meta"] = 1;

    if(STATE["namingMode"] === true)
    {
        if(e.key === "Escape" || e.key === "Enter")
        {
            STATE["namingMode"] = false;
            NODES[STATE["lastClickedNode"]]["type"] = "default";
            STATE["keysDownSinceNamingMode"] = 0;
        }
        else
        {
            // determine the new label for the selected object
            let newKey = "";
            let newLabel = NODES[STATE["lastDblClickedNode"]]["label"];
            if(ALPHABET_KEYS.includes(e.key) || NUMBERS.includes(e.key) || e.key === " ")
            {
                if(STATE["keysDownSinceNamingMode"] === 0)
                    newLabel = "";

                newKey = e.key;
                newLabel += newKey;
                STATE["keysDownSinceNamingMode"] += 1;
                NODES[STATE["lastDblClickedNode"]]["label"] = newLabel;
            }
            else
            if(e.key === "Backspace")
            {
                newLabel = newLabel.slice(0, newLabel.length - 1);
                STATE["keysDownSinceNamingMode"] += 1;
                NODES[STATE["lastDblClickedNode"]]["label"] = newLabel;
            }
            
        }
    }
    draw_scene(NODES);
})

window.addEventListener("keyup", (e) => {
    if(e.key === "Meta")
        CONTROLLER["Meta"] = 0;
})

canvas.addEventListener("mousedown", (e) => {
    let cursorX = e.offsetX * CANVAS_SCALE;
    let cursorY = e.offsetY * CANVAS_SCALE;

    let clickedAnyNode = false;
    for(let idx=0; idx<NODES.length; idx+=1)
    {
        if(
            is_inside_box(
                cursorX,
                cursorY,
                NODES[idx]["x"] - NODE_RADIUS,
                NODES[idx]["x"] + NODE_RADIUS,
                NODES[idx]["y"] - NODE_RADIUS,
                NODES[idx]["y"] + NODE_RADIUS,
            )
        )
        {
            clickedAnyNode = true;
            if(CONTROLLER["Meta"] === 1)
                NODES[idx]["type"] = "selected";
            else
                NODES[idx]["type"] = "default";
            STATE["lastClickedNode"] = idx;
            draw_node(ctx, NODES[idx]);
            STATE["draggingNodeIndex"] = idx;
        }
    }
    if(clickedAnyNode === false && CONTROLLER["Meta"] !== 1)
    {
        for(let idx=0; idx<NODES.length; idx+=1)
        {
            NODES[idx]["type"] = "default";
        }
    }
    if(clickedAnyNode === false)
    {
        STATE["namingMode"] = false;
        STATE["keysDownSinceNamingMode"] = 0;
        if(STATE["lastClickedNode"])
            NODES[STATE["lastClickedNode"]]["type"] = "default";
    }
})

canvas.addEventListener("mousemove", (e) => {
    let cursorX = e.offsetX * CANVAS_SCALE;
    let cursorY = e.offsetY * CANVAS_SCALE;

    if(STATE["drawingMode"] === 1)
    {
        // add current mouse location to drawing path
        STATE["drawingLineCoords"].push(
            [cursorX, cursorY]
        );
    }
    else
    if(STATE["draggingNodeIndex"] !== null)
    {
        let node_idx = STATE["draggingNodeIndex"];
        NODES[node_idx]["x"] = cursorX;
        NODES[node_idx]["y"] = cursorY;
    }

    draw_scene(NODES);
})

canvas.addEventListener("mouseup", (e) => {
    if(STATE["draggingNodeIndex"] !== null)
        NODES[STATE["draggingNodeIndex"]]["color"] = NODE_COLORS["default"];

    STATE["drawingMode"] = 0;
    STATE["drawingLineCoords"] = null
    STATE["draggingNodeIndex"] = null;

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

canvas.addEventListener("dblclick", (e) => {
    let cursorX = e.offsetX * CANVAS_SCALE;
    let cursorY = e.offsetY * CANVAS_SCALE;
    for(let idx=0; idx<NODES.length; idx+=1)
    {
        if(
            is_inside_box(
                cursorX,
                cursorY,
                NODES[idx]["x"] - NODE_RADIUS,
                NODES[idx]["x"] + NODE_RADIUS,
                NODES[idx]["y"] - NODE_RADIUS,
                NODES[idx]["y"] + NODE_RADIUS,
            )
        )
        {
            STATE["lastDblClickedNode"] = STATE["lastClickedNode"];
            STATE["namingMode"] = true;
            NODES[STATE["lastClickedNode"]]["type"] = "rename";
        }
    }

    draw_scene(NODES);
})
