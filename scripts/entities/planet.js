// Copyright 2025 Elloramir.
// All rights over the code are reserved.
import { vec3, mat4 } from "../math.js";
import Entity from "../entity.js";
import Input from "../input.js";
import Transform from "../transform.js";

export default
class Planet extends Entity {
	wakeup(x, y, z) {
		this.model = this.stage.planet;
		this.transform = new Transform();
		this.transform.setPosition(x, y, z);
		this.transform.setScale(50, 50, 50);
	}

	render() {
		this.model.transform = this.transform;
		this.model.render(this.stage.shader, this.stage.camera);
	}
}