// Copyright 2025 Elloramir.
// All rights over the code are reserved.

import Texture from "./texture.js";

export default
class Mesh {
    constructor() {
        this.vbo = gl.createBuffer();
        this.ibo = gl.createBuffer();
        this.vertices = [];
        this.indices = [];
        this.numIndices = 0;
        this.numVertices = 0;
        this.texture = null;
        this.boundaries = null;

        this.baseColor = [1.0, 1.0, 1.0];
        this.emissive = [0.0, 0.0, 0.0];
        this.roughness = 1.0;
        this.metallic = 0.0;
    }

    setBoundaries(x0, y0, z0, x1, y1, z1) {
        this.boundaries = [ x0, y0, z0, x1, y1, z1 ];
    }

    vertex(x, y, z, n1, n2, n3, u, v) {
        this.vertices.push(x, y, z, n1, n2, n3, u, v);
        this.numVertices++;
    }

    // It will use the last 4 vertices added as reference to begin
    lastQuad(a, b, c, d, e, f) {
        const i = this.numVertices - 4;
        
        this.indices.push(i + a, i + b, i + c, i + d, i + e, i + f);
        this.numIndices += 6;
    }

    upload() {
        const data = new Float32Array(this.vertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        const indices = new Uint16Array(this.indices);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        this.numIndices = this.indices.length;
        this.numVertices = this.vertices.length;

        // Vanish the data from the CPU once it's now on the GPU
        this.vertices = [];
        this.indices = [];
    }

    render(shader) {
        const aPosition = shader.getAttrib("aPosition");
        const aNormal = shader.getAttrib("aNormal");
        const aTexture = shader.getAttrib("aTexturecoord");

        gl.useProgram(shader.id);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

        gl.enableVertexAttribArray(aPosition);
        gl.enableVertexAttribArray(aNormal);
        gl.enableVertexAttribArray(aTexture);

        const byte = Float32Array.BYTES_PER_ELEMENT;
        const stride = 8 * byte;

        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, stride, 0);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, stride, 3 * byte);
        gl.vertexAttribPointer(aTexture, 2, gl.FLOAT, false, stride, 6 * byte);

        const locBaseColor = shader.getUniform("material.baseColor");
        const locEmissive = shader.getUniform("material.emissive");
        const locRoughness = shader.getUniform("material.roughness");
        const locMetalic = shader.getUniform("material.metallic");

        if (locBaseColor && locEmissive && locRoughness && locMetalic) {
            gl.uniform3fv(locBaseColor, this.baseColor);
            gl.uniform3fv(locEmissive, this.emissive);
            gl.uniform1f(locRoughness, this.roughness);
            gl.uniform1f(locMetalic, this.metallic);
        }

        gl.bindTexture(gl.TEXTURE_2D, this.texture?.id || Texture.whiteTexture.id);
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
    }
}
