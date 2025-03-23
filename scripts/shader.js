export default
class Shader {
	constructor(vsSource, fsSource) {
		const vs = Shader.compile(gl.VERTEX_SHADER, vsSource);
		const fs = Shader.compile(gl.FRAGMENT_SHADER, fsSource);
		
		if (this.vs !== null && this.fs !== null) {
			this.id = gl.createProgram();

			gl.attachShader(this.id, vs);
			gl.attachShader(this.id, fs);
			gl.linkProgram(this.id);

			if (!gl.getProgramParameter(this.id, gl.LINK_STATUS)) {
				console.error('Error linking program:', gl.getProgramInfoLog(this.id));
				gl.deleteProgram(this.id);
				this.id = null;
			}

			// Save these shaders are only necessary if
			// you want something like hot reload.
			gl.deleteShader(vs);
			gl.deleteShader(fs);

			this.uniforms = new Map();
			const numUniforms = gl.getProgramParameter(this.id, gl.ACTIVE_UNIFORMS);
			for (let i = 0; i < numUniforms; i++) {
				const info = gl.getActiveUniform(this.id, i);
				this.uniforms.set(info.name, gl.getUniformLocation(this.id, info.name));
			}

			this.attribs = new Map();
			const numAttribs = gl.getProgramParameter(this.id, gl.ACTIVE_ATTRIBUTES);
			for (let i = 0; i < numAttribs; i++) {
				const info = gl.getActiveAttrib(this.id, i);
				this.attribs.set(info.name, gl.getAttribLocation(this.id, info.name));
			}
		}
	}

	getUniform(name) {
		return this.uniforms.get(name);
	}

	getAttrib(name) {
		return this.attribs.get(name);
	}

	static compile(type, source) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	static async loadFromFile(vsFile, fsFile) {
		const a = fetch(vsFile).then(r => r.text());
		const b = fetch(fsFile).then(r => r.text());

		return Promise.all([a, b]).then(([vsSource, fsSource]) => {
			return new Shader(vsSource, fsSource);
		});
	}  
};