// Copyright 2025 Elloramir.
// All rights over the code are reserved.

// Transform.js
import { mat4, vec3 } from "./math.js";

export default
class Transform {
	constructor() {
		this.position = vec3.create();
		this.scale = vec3.fromValues(1, 1, 1);
		// Os ângulos são armazenados em radians: [pitch, yaw, roll]
		this.rotation = vec3.create();
		this.matrix = mat4.create(); // Matriz de transformação
		this.dirty = true; // Indica quando a transformação foi alterada
	}

	setPosition(x, y, z) {
		vec3.set(this.position, x, y, z);
		this.dirty = true;
	}

	setScale(sx, sy, sz) {
		vec3.set(this.scale, sx, sy, sz);
		this.dirty = true;
	}

	setRotation(pitch, yaw, roll) {
		vec3.set(this.rotation, pitch, yaw, roll);
		this.dirty = true;
	}

	// Calcula a matriz de transformação aplicando: tradução, rotações na ordem yaw, pitch, roll e, por fim, escala.
	getMatrix() {
		if (this.dirty) {
			mat4.identity(this.matrix);
			
			// Aplicar tradução
			mat4.translate(this.matrix, this.matrix, this.position);
			
			// Aplicar rotações na ordem: yaw, pitch e roll
			mat4.rotate(this.matrix, this.matrix, this.rotation[1], [0, 1, 0]); // Yaw
			mat4.rotate(this.matrix, this.matrix, this.rotation[0], [1, 0, 0]); // Pitch
			mat4.rotate(this.matrix, this.matrix, this.rotation[2], [0, 0, 1]); // Roll
			
			// Aplicar escala
			mat4.scale(this.matrix, this.matrix, this.scale);
			
			this.dirty = false;
		}

		return this.matrix;
	}

	setRotationFromAxisAngle(axis, angle) {
	    const quat = mat4.create();
	    mat4.fromRotation(quat, angle, axis);
	    mat4.getRotation(this.rotation, quat);
	    this.dirty = true;
	}

	// Retorna o vetor "forward" a partir da matriz de transformação completa.
	// O vetor forward é extraído como o vetor negativo da terceira coluna da matriz (seguindo convenção column-major).
	forward() {
		const m = this.getMatrix();
		let forward = vec3.fromValues(-m[8], -m[9], -m[10]);
		vec3.normalize(forward, forward);
		return forward;
	}

	// Outros métodos para right() e up() podem ser ajustados de forma semelhante se necessário.
	right() {
		// Extração do vetor right (primeira coluna)
		const m = this.getMatrix();
		let right = vec3.fromValues(m[0], m[1], m[2]);
		vec3.normalize(right, right);
		return right;
	}

	up() {
		// Extração do vetor up (segunda coluna)
		const m = this.getMatrix();
		let up = vec3.fromValues(m[4], m[5], m[6]);
		vec3.normalize(up, up);
		return up;
	}

	forceUpdate() {
		this.dirty = true;
	}
}
