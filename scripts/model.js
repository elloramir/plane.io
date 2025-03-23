// Copyright 2025 Elloramir.
// All rights over the code are reserved.

import { vec3 } from "./math.js";
import Mesh from "./mesh.js";
import Transform from "./transform.js";

export default
class Model {
	constructor() {
		this.meshes = [];
		this.transform = new Transform();
	}

	createMesh() {
		const mesh = new Mesh();
		this.meshes.push(mesh);
		return mesh;
	}

	destroyMesh(mesh) {
		this.meshes = this.meshes.filter(m => m !== mesh);
	}

	render(shader, camera) {
		gl.useProgram(shader.id);
		gl.uniformMatrix4fv(shader.getUniform("modelMatrix"), false, this.transform.getMatrix());

		// if (camera.frustum.isAABBInside(...this.transformedAABB)) {
			for (const mesh of this.meshes) {
				mesh.render(shader);
			}
		// }
	}
}