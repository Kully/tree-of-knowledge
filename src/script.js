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
    CLUSTER_LINE_DASH,
    NUMBERS_STR,
    ALPHABET_STR,
    CONNECTION_STYLE,
    POTENTIAL_CONNECTION_STYLE,
    LASSO_STYLE,
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
    lassoMode: false,
    namingMode: false,
    panningMode: false,
    connectingMode: false,
    draggingNodeIndex: null,
    lastClickedNode: null,
    lastDblClickedNode: null,
    keysDownSinceNamingMode: 0,
    drawingStartCoords: null,
    cursorX: 0,
    cursorY: 0,
    lastCursorX: 0,
    lastCursorY: 0,
}

const hitboxPadding = 12 * CANVAS_SCALE;
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

function isInsideBox(x, y, box_x, box_y, box_w, box_h, padding=0)
{
    if(
        x >= box_x - padding &&
        x <= (box_x + box_w) + padding &&
        y >= box_y - padding &&
        y <= (box_y + box_h) + padding
    )
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
    let labelShiftPixelsY = 14;
    if(node["label"] !== null && node["label"] !== "")
    {
        ctx.fillStyle = NODE_STYLE_LOOKUP[node["type"]]["labelColor"];
        ctx.font = TEXT_FONT_SIZE + "px Bodoni";
        ctx.textAlign = "center";
        ctx.fillText(
            node["label"],
            node["x"],
            node["y"] - NODE_RADIUS - labelShiftPixelsY
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

    // draw lasso selection
    if(STATE["lassoMode"] === true)
    {
        ctx.fillStyle = LASSO_STYLE["fillStyle"];
        ctx.strokeStyle = LASSO_STYLE["strokeStyle"];
        ctx.lineWidth = LASSO_STYLE["lineWidth"];

        let x = STATE["drawingStartCoords"][0];
        let y = STATE["drawingStartCoords"][1];
        let w = STATE["cursorX"] - STATE["drawingStartCoords"][0];
        let h = STATE["cursorY"] - STATE["drawingStartCoords"][1];
        ctx.strokeRect(x, y, w, h);
        ctx.fillRect(x, y, w, h);
    }

    // display dotted line from last clicked node to mouse position
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

    STATE["connectingMode"] = false;
    if(
        CONTROLLER["c"] === 1 &&
            STATE["lastClickedNode"] !== null &&
                NODES[STATE["lastClickedNode"]]["type"] === "selected"
    )
        STATE["connectingMode"] = true;


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

    if(e.button === 1)
    {
        document.body.style.cursor = "all-scroll";

        STATE["panningMode"] = true;
        STATE["drawingStartCoords"] = [cursorX, cursorY];
        drawScene(NODES);
        return 1;
    }
    if(e.button === 2)
        return;

    STATE["cursorX"] = cursorX;
    STATE["cursorY"] = cursorY;

    let clickedAnyNode = false;
    for(let idx=0; idx<NODES.length; idx+=1)
    {
        let nodeInsideBox = isInsideBox(
            cursorX,
            cursorY,
            NODES[idx]["x"] - NODE_RADIUS,
            NODES[idx]["y"] - NODE_RADIUS,
            2 * NODE_RADIUS,
            2 * NODE_RADIUS,
            hitboxPadding
        );

        if(nodeInsideBox)
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

        if(CONTROLLER["Meta"] === 0)
        {
            NODES[idx]["type"] = "default";
        }
    }

    if(clickedAnyNode === false)
    {
        STATE["namingMode"] = false;
        STATE["keysDownSinceNamingMode"] = 0;

        if(CONTROLLER["Meta"] !== 1)
        {
            for(let node of NODES)
            {
                node["type"] = "default";
            }
        }
        
        if(CONTROLLER["a"] === 1 && STATE["connectingMode"] === false)
        {
            addNode(cursorX, cursorY);
        }
        else
        {
            // initialize lasso mode
            STATE["lassoMode"] = true;
            STATE["drawingStartCoords"] = [cursorX, cursorY];
        }

    }

    STATE["lastCursorX"] = STATE["cursorX"];
    STATE["lastCursorY"] = STATE["cursorY"];

    drawScene(NODES);
})

canvas.addEventListener("mousemove", (e) => {
    let cursorX = e.offsetX * CANVAS_SCALE;
    let cursorY = e.offsetY * CANVAS_SCALE;

    STATE["cursorX"] = cursorX;
    STATE["cursorY"] = cursorY;

    if(STATE["panningMode"] === true)
    {
        // pan all the nodes in the direction
        for(let idx=0; idx<NODES.length; idx+=1)
        {
            NODES[idx]["x"] += STATE["cursorX"] - STATE["lastCursorX"];
            NODES[idx]["y"] += STATE["cursorY"] - STATE["lastCursorY"];
        }

        STATE["lastCursorX"] = STATE["cursorX"];
        STATE["lastCursorY"] = STATE["cursorY"];
        drawScene(NODES);
        return;
    }

    for(let idx=0; idx<NODES.length; idx+=1)
    {
        // determine if node is inside the lasso selection
        if(STATE["lassoMode"] === true)
        {
            let x0 = Math.min(STATE["drawingStartCoords"][0], cursorX);
            let x1 = Math.max(STATE["drawingStartCoords"][0], cursorX);
            let y0 = Math.min(STATE["drawingStartCoords"][1], cursorY);
            let y1 = Math.max(STATE["drawingStartCoords"][1], cursorY);

            let nodeInsideLassoSelection = isInsideBox(
                NODES[idx]["x"],
                NODES[idx]["y"],
                x0,
                y0,
                x1 - x0,
                y1 - y0,
                hitboxPadding,
            );

            if(nodeInsideLassoSelection)
                NODES[idx]["type"] = "selected";
            else
                NODES[idx]["type"] = "default";
        }

        if(
            STATE["draggingNodeIndex"] !== null &&
                (NODES[idx]["type"] === "selected" || idx === STATE["draggingNodeIndex"])
        )
        {
            NODES[idx]["x"] += (STATE["cursorX"] - STATE["lastCursorX"]);
            NODES[idx]["y"] += (STATE["cursorY"] - STATE["lastCursorY"]);
        }
    }

    STATE["lastCursorX"] = STATE["cursorX"];
    STATE["lastCursorY"] = STATE["cursorY"];

    drawScene(NODES);
})

canvas.addEventListener("mouseup", (e) => {
    if(e.button === 1)
    {
        document.body.style.cursor = "default";
        STATE["panningMode"] = false;
    }
    if(STATE["draggingNodeIndex"] !== null)
        NODES[STATE["draggingNodeIndex"]]["color"] = NODE_STYLE_LOOKUP["default"]["nodeColor"];
    STATE["lassoMode"] = false;
    STATE["drawingStartCoords"] = null;
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
                NODES[idx]["y"] - NODE_RADIUS,
                2 * NODE_RADIUS,
                2 * NODE_RADIUS,
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
