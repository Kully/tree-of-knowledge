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
    NODE_STYLE_LOOKUP
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

const CONTROLLER = {
    Meta: 0,
    a: 0,
}

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

const NODES = [
    {
        id: 0,
        label: "Apple",
        type: "default",
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        nodeConnections: [],
        clusterConnections: [],
    },
    {
        id: 1,
        label: "Orange",
        type: "default",
        x: CANVAS_WIDTH / 2 + 60 * CANVAS_SCALE,
        y: CANVAS_HEIGHT / 2 - 14 * CANVAS_SCALE,
        nodeConnections: [],
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

function isInsideBox(x, y, box_x0, box_x1, box_y0, box_y1)
{
    if(x >= box_x0 && x <= box_x1 && y >= box_y0 && y <= box_y1)
        return true;
    return false;
}

function addNode(x, y)
{
    let new_id = NODES.length;
    let new_node = createNodeObject(new_id, x, y, [], []);
    NODES.push(new_node);
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
            if(!alreadyTraversed.includes(id))
            {
                let node_a = NODES[idx]
                let node_b = NODES[id]
                drawLineBetweenNodes(node_a, node_b);
                alreadyTraversed.push(id);
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
    if(e.key === "Meta")
        CONTROLLER["Meta"] = 1;
    if(e.key === "a")
        CONTROLLER["a"] = 1;

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
    if(e.key === "Meta")
        CONTROLLER["Meta"] = 0;
    if(e.key === "a")
        CONTROLLER["a"] = 0;
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
                NODES[idx]["x"] - NODE_RADIUS - hitboxMargin,
                NODES[idx]["x"] + NODE_RADIUS + hitboxMargin,
                NODES[idx]["y"] - NODE_RADIUS - hitboxMargin,
                NODES[idx]["y"] + NODE_RADIUS + hitboxMargin,
            )
        )
        {
            clickedAnyNode = true;
            NODES[idx]["type"] = "selected";
            STATE["lastClickedNode"] = idx;
            STATE["draggingNodeIndex"] = idx;
            drawNode(ctx, NODES[idx]);
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

    if(CONTROLLER["a"] === 1)
    {
        addNode(cursorX, cursorY);
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
