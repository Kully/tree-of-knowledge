"use strict";

import {
    CANVAS_SCALE,
    BASE_CANVAS_WIDTH,
    BASE_CANVAS_HEIGHT,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    CANVAS_COLOR,
    NODE_RADIUS,
    TEXT_FONT_SIZE,
    HIGHLIGHT_COLOR,
    CLUSTER_LINE_DASH,
    NODE_COLORS,
    NUMBERS_STR,
    ALPHABET_STR,
    CONNECTION_STYLE,
    POTENTIAL_CONNECTION_STYLE,
    NODE_STYLE_LOOKUP,
    VALID_CONTROLLER_KEYS,
} from "./constants.js"


const CAMERA = {
    x: 0,
    y: 0,
    zoom: 0,
    minZoom: 0,
    maxZoom: 10,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
}

let CONTROLLER = {};
for(let key of VALID_CONTROLLER_KEYS)
    CONTROLLER[key] = 0;

const STATE = { 
    draggingNodeIndex: null,
    drawingMode: false,
    drawingStartCoords: null,
    drawingLineCoords: null,
    connectingMode: false,
    lastClickedNode: null,
    lastDblClickedNode: null,
    namingMode: false,
    keysDownSinceNamingMode: 0,
    cursorX: 0,
    cursorY: 0,
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
        x: CANVAS_WIDTH / 2 + 60 * CANVAS_SCALE,
        y: CANVAS_HEIGHT / 2 - 14 * CANVAS_SCALE,
        nodeConnections: [0],
        clusterConnections: [],
    },
];

function createNodeObject(id, x, y, nodeConnections, clusterConnections)
{
    return {
        id: id,
        label: "",
        type: "default",
        x: x,
        y: y,
        nodeConnections: nodeConnections,
        clusterConnections: clusterConnections,
    }
}

function addNode(x, y)
{
    let new_id = NODES.length;
    let new_node = createNodeObject(new_id, x, y, [], []);
    NODES.push(new_node);
}

function isInsideBox(x, y, box_x0, box_x1, box_y0, box_y1)
{
    if(x >= box_x0 && x <= box_x1 && y >= box_y0 && y <= box_y1)
        return true;
    return false;
}

function clear(canvas)
{
    ctx.fillStyle = CANVAS_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawLineBetweenNodes(node_a, node_b)
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


function drawNode(ctx, node)
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

function drawNodalConnections(NODES)
{
    let alreadyTraversed = [];
    for(let idx=0; idx<NODES.length; idx+=1)
    {
        for(let id of NODES[idx]["nodeConnections"])
        {
            let nodePair = [Math.min(id, idx), Math.max(id, idx)];
            console.log("nodePair is ", nodePair);
            if(!alreadyTraversed.includes(nodePair))
            {
                let node_a = NODES[idx]
                let node_b = NODES[id]
                drawLineBetweenNodes(node_a, node_b);
                alreadyTraversed.push(nodePair);
            }
        }
    }
}

function drawScene(NODES)
{
    clear(canvas);

    drawNodalConnections(NODES);

    for(let node of NODES)
        drawNode(ctx, node);

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

    // display line from last clicked node to cursor
    if(STATE["connectingMode"] === true)
    {
        ctx.beginPath();
        ctx.moveTo(
            NODES[STATE["lastClickedNode"]]["x"],
            NODES[STATE["lastClickedNode"]]["y"],
        )
        ctx.lineTo(
            STATE["cursorX"],
            STATE["cursorY"],
        )
        ctx.lineWidth = POTENTIAL_CONNECTION_STYLE["lineWidth"];
        ctx.strokeStyle = POTENTIAL_CONNECTION_STYLE["strokeStyle"];
        ctx.mozDash = POTENTIAL_CONNECTION_STYLE["lineDash"];
        ctx.setLineDash(POTENTIAL_CONNECTION_STYLE["lineDash"]);
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

drawScene(NODES);


// save keyboard input
window.addEventListener("keydown", (e) => {
    for(let key of VALID_CONTROLLER_KEYS)
    {
        if(e.key === key)
            CONTROLLER[key] = 1;
    }

    if(
        CONTROLLER["c"] === 1 &&
            STATE["lastClickedNode"] !== null &&
                NODES[STATE["lastClickedNode"]]["type"] === "selected"
    )
    {
        STATE["connectingMode"] = true;
    }
    else
    {
        STATE["connectingMode"] = false;
    }


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
            if(ALPHABET_STR.includes(e.key) || NUMBERS_STR.includes(e.key) || e.key === " ")
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

    drawScene(NODES);
})

window.addEventListener("keyup", (e) => {
    for(let key of VALID_CONTROLLER_KEYS)
    {
        if(e.key === key)
            CONTROLLER[key] = 0;
    }

    if(CONTROLLER["c"] === 0)
    {
        STATE["connectingMode"] = false;
    }
})

canvas.addEventListener("mousedown", (e) => {
    let cursorX = e.offsetX * CANVAS_SCALE;
    let cursorY = e.offsetY * CANVAS_SCALE;

    let clickedAnyNode = false;
    let hitboxPadding = 12 * CANVAS_SCALE;
    for(let idx=0; idx<NODES.length; idx+=1)
    {
        if(
            isInsideBox(
                cursorX,
                cursorY,
                NODES[idx]["x"] - NODE_RADIUS - hitboxPadding,
                NODES[idx]["x"] + NODE_RADIUS + hitboxPadding,
                NODES[idx]["y"] - NODE_RADIUS - hitboxPadding,
                NODES[idx]["y"] + NODE_RADIUS + hitboxPadding,
            )
        )
        {
            clickedAnyNode = true;
            if(STATE["connectingMode"] === true)
            {
                // connect two nodes if connection doesn't exist
                if(
                    !NODES[STATE["lastClickedNode"]]["nodeConnections"].includes(idx)
                )
                {
                    NODES[STATE["lastClickedNode"]]["nodeConnections"].push(idx);
                    NODES[idx]["nodeConnections"].push(STATE["lastClickedNode"]);
                }
                else
                {
                    NODES[idx]["type"] = "selected";
                    STATE["draggingNodeIndex"] = idx;
                    drawNode(ctx, NODES[idx]);
                }
                STATE["lastClickedNode"] = idx;
            }
            else
            {
                NODES[idx]["type"] = "selected";
                STATE["lastClickedNode"] = idx;
                STATE["draggingNodeIndex"] = idx;
                drawNode(ctx, NODES[idx]);
            }
        }
        else
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

        if(CONTROLLER["Meta"] !== 1)
        {
            for(let idx=0; idx<NODES.length; idx+=1)
            {
                NODES[idx]["type"] = "default";
            }
        }
    }

    if(CONTROLLER["a"] === 1 && STATE["connectingMode"] === false)
    {
        addNode(cursorX, cursorY);
    }

    drawScene(NODES);
})

canvas.addEventListener("mousemove", (e) => {
    let cursorX = e.offsetX * CANVAS_SCALE;
    let cursorY = e.offsetY * CANVAS_SCALE;

    // record mouse position relative to canvas
    STATE["cursorX"] = cursorX;
    STATE["cursorY"] = cursorY;

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

    for(let idx=0; idx<NODES.length; idx += 1)
    {
        console.log("node ", idx, ", ", NODES[idx]["label"], ", ", NODES[idx]["nodeConnections"]);
    }
    console.log("");

    drawScene(NODES);
})

canvas.addEventListener("mouseup", (e) => {
    if(STATE["draggingNodeIndex"] !== null)
        NODES[STATE["draggingNodeIndex"]]["color"] = NODE_COLORS["default"];

    STATE["drawingMode"] = 0;
    STATE["drawingLineCoords"] = null
    STATE["draggingNodeIndex"] = null;

    drawScene(NODES);
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
            isInsideBox(
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

    drawScene(NODES);
})
