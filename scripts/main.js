// Copyright 2025 Elloramir.
// All rights over the code are reserved.

import Stage from "./stage.js";

window.canvas = document.getElementById("screen");
window.canvas.width = window.innerWidth;
window.canvas.height = window.innerHeight;
window.gl = window.canvas.getContext("webgl");

let stage = new Stage();

stage.load().then(() => {
    requestAnimationFrame(stage.loop.bind(stage));
});