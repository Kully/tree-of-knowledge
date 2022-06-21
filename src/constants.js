"use strict";

export const CANVAS_SCALE = 3;
export const BASE_CANVAS_WIDTH = window.innerWidth;
export const BASE_CANVAS_HEIGHT = window.innerHeight;
export const CANVAS_WIDTH = BASE_CANVAS_WIDTH * CANVAS_SCALE;
export const CANVAS_HEIGHT = BASE_CANVAS_HEIGHT * CANVAS_SCALE;

export const NODE_RADIUS = 24;
export const TEXT_FONT_SIZE = 34;
export const CANVAS_COLOR = "#222";
export const HIGHLIGHT_COLOR = "#FFE400";
export const CLUSTER_LINE_DASH = [1, 1];
export const NODE_COLORS = {
    default: "#FA5560",
    label: "#E4E4E4",
}
export const CONNECTION_STYLE = {
    strokeStyle: "#FFFFFF44",
    lineWidth: 1,
    lineDash: [0, 0],
}
export const NODE_STYLE_LOOKUP = {
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

export const NUMBERS_STR = "1234567890";
export const ALPHABET_STR = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const VALID_CONTROLLER_KEYS = ["Meta", "a", "c"];
