// Copyright 2025 Elloramir.
// All rights over the code are reserved.

export default
class Texture {
	constructor(img, filter=gl.LINEAR) {
		this.id = gl.createTexture();
		this.width = img.width;
		this.height = img.height;

		const isBase2 = isPowerOf2(img.width * img.height);
		const wrapMode = isBase2 ? gl.REPEAT : gl.CLAMP_TO_EDGE;

		gl.bindTexture(gl.TEXTURE_2D, this.id);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

		if (isBase2) {
			gl.generateMipmap(gl.TEXTURE_2D);
		}

		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	setWrap(wrapS, wrapT) {
		gl.bindTexture(gl.TEXTURE_2D, this.id);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	static async loadFromFile(file, filter) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				resolve(new Texture(img, filter));
			};
			img.onerror = reject;
			img.src = file;
		});
	}

	static fromUint8Array(data, width, height) {
		const img = new ImageData(
			new Uint8ClampedArray(data),
			width,
			height);

		return new Texture(img);
	}

	static cachedWhiteTexture = null;

	static get whiteTexture() {
		if (!Texture.cachedWhiteTexture) {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			canvas.width = 1;
			canvas.height = 1;

			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, 1, 1);

			Texture.cachedWhiteTexture = new Texture(canvas);
		}

	    return Texture.cachedWhiteTexture;
	}
};

function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}