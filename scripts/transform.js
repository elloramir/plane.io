// Copyright 2025 Elloramir.
// All rights over the code are reserved.

import { mat4, vec3 } from "./math.js";

export default
class Transform {
	constructor() {
		this.position = vec3.create();
		this.scale = vec3.fromValues(1, 1, 1);
		this.rotation = vec3.create(); // Rotation as a vec3
		this.matrix = mat4.create(); // Initialize as identity matrix
		this.dirty = true; // Flag to indicate when the transformation was changed
	}

	setPosition(x, y, z) {
		vec3.set(this.position, x, y, z);
		this.dirty = true;
	}

	setScale(sx, sy, sz) {
		vec3.set(this.scale, sx, sy, sz);
		this.dirty = true;
	}

	setRotation(x, y, z) {
		vec3.set(this.rotation, x, y, z);
		this.dirty = true;
	}

	right() {
		const pitch = this.rotation[0];
		const yaw = this.rotation[1];
	
		const cosYaw = Math.cos(yaw);
		const sinYaw = Math.sin(yaw);
	
		const rightX = cosYaw;
		const rightY = 0;
		const rightZ = sinYaw;
	
		return vec3.fromValues(-rightX, -rightY, rightZ);
	}

	up() {
		const pitch = this.rotation[0];
		const roll = this.rotation[2];
	
		const cosPitch = Math.cos(pitch);
		const sinPitch = Math.sin(pitch);
		const cosRoll = Math.cos(roll);
		const sinRoll = Math.sin(roll);
	
		const upX = sinRoll * cosPitch;
		const upY = cosRoll * cosPitch;
		const upZ = sinPitch;
	
		return vec3.fromValues(upX, upY, upZ);
	}

	forward() {
		const pitch = this.rotation[0];
		const yaw = this.rotation[1];
	
		const cosPitch = Math.cos(pitch);
		const sinPitch = Math.sin(pitch);
		const cosYaw = Math.cos(yaw);
		const sinYaw = Math.sin(yaw);
	
		const forwardX = sinYaw * cosPitch;
		const forwardY = -sinPitch;
		const forwardZ = cosYaw * cosPitch;
	
		return vec3.fromValues(forwardX, forwardY, forwardZ);
	}

	forceUpdate() {
		this.dirty = true;
	}

	getMatrix() {
		if (this.dirty) {
			// If dirty, recalculate the matrix
			mat4.identity(this.matrix); // Start with identity matrix
			mat4.fromTranslation(this.matrix, this.position); // Apply translation
			mat4.scale(this.matrix, this.matrix, this.scale); // Apply scaling

			// Apply rotation by converting the vec3 into a rotation matrix (using axis-angle)
			if (this.rotation[0] || this.rotation[1] || this.rotation[2]) {
				mat4.rotate(this.matrix, this.matrix, this.rotation[0], [1, 0, 0]); // Rotate around X
				mat4.rotate(this.matrix, this.matrix, this.rotation[1], [0, 1, 0]); // Rotate around Y
				mat4.rotate(this.matrix, this.matrix, this.rotation[2], [0, 0, 1]); // Rotate around Z
			}

			this.dirty = false; // Mark as not dirty after recalculation
		}

		return this.matrix; // Return the calculated matrix (or identity if not dirty)
	}
}