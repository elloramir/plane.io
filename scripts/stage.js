// Copyright 2025 Elloramir.
// All rights over the code are reserved.

import Shader from "./shader.js";
import Camera from "./camera.js";
import Input from "./input.js";
import GLTFLoader from "./gltf.js";
import Texture from "./texture.js";
import Spaceship from "./entities/spaceship.js";
import Planet from "./entities/planet.js";
import Skybox from "./skybox.js";

export default
class State {
    constructor() {
        this.entities = new Array();
        this.camera = null;
        this.shader = null;
        this.plane = null;
        this.planet = null;
        this.skyboxShader = null;
        this.skyboxTex = null;
        this.skybox = null;

        this.debugMode = false;
        this.lastTime = 0;
        this.currentTime = 0;
        this.deltaTime = 0;
    }

    async load() {
        Input.init();

        // Setup camera
        this.camera = new Camera(0, 0, 0);
        this.camera.pitch = -0.254;
        this.camera.yaw = 1.3780000000000006;

        // Load the shaders
        this.shader = await Shader.loadFromFile(
            "assets/basic.vert",
            "assets/basic.frag"
            // "assets/normals.frag"
        );
        
        // Load models
        this.plane = await GLTFLoader.loadFromFile("assets/models/plane.glb");
        this.planet = await GLTFLoader.loadFromFile("assets/models/planet.glb");
        this.house = await GLTFLoader.loadFromFile("assets/models/house.glb");

        this.skyboxShader = await Shader.loadFromFile("assets/skybox.vert", "assets/skybox.frag");
        this.skybox = new Skybox();

        this.addEntity(Spaceship, 0, 0, 0);
        this.addEntity(Planet, 0, 0, -600);
        this.addEntity(Planet, 600, 0, -600);
    }

    addEntity(Entity, ...args) {
        const entity = new Entity();
        this.entities.push(entity);
        entity.stage = this;
        entity.wakeup(...args);
        return entity;
    }

    loop(time) {
        this.currentTime = time/1000.0;
        this.deltaTime = (this.currentTime - this.lastTime);
        this.lastTime = this.currentTime;

        for (const entity of this.entities) {
            entity.update(this.deltaTime);
        }

        if (this.debugMode) {
            this.camera.updateFreeView();
        }
        else {
            this.camera.update();
        }

        this.camera.bind(this.shader);
        this.camera.bind(this.skyboxShader);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.shader.id)
        gl.uniform1f(this.shader.getUniform("time"), this.currentTime);

        gl.useProgram(this.skyboxShader.id);
        gl.uniform1f(this.skyboxShader.getUniform("time"), this.currentTime);

        this.skybox.render(this.skyboxShader, this.camera);

        for (const entity of this.entities) {
            entity.render();
        }

        requestAnimationFrame(this.loop.bind(this));
    }
}