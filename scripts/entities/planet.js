// Copyright 2025 Elloramir.
// All rights over the code are reserved.

import { randomSign } from "../utils.js";
import { vec3, mat4 } from "../math.js";
import Entity from "../entity.js";
import Input from "../input.js";
import Transform from "../transform.js";

export default
class Planet extends Entity {

	ROTATION_SPEED = 0.05;

	wakeup(x, y, z) {
		this.model = this.stage.planet;
		this.transform = new Transform();
		this.transform.setPosition(x, y, z);
		this.transform.setScale(50, 50, 50);
		this.rotationX = 0;
		this.rotationY = 0;
		this.rotationDirX = randomSign();
		this.rotationDirY = randomSign();
	}

	update(dt) {
		this.rotationX += dt*this.ROTATION_SPEED*this.rotationDirX;
		this.rotationY += dt*this.ROTATION_SPEED*this.rotationDirY;
		this.transform.setRotation(this.rotationX, this.rotationY, 0);
	}

	render() {
		this.model.transform = this.transform;
		this.model.render(this.stage.shader, this.stage.camera);
	}
}