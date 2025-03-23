import Mesh from "./mesh.js";
import { mat4 } from "./math.js";
import Texture from "./texture.js";

export default class Skybox extends Mesh {
    constructor() {
        super();

        // Define os vértices do cubo (skybox)
        const size = 1; // Tamanho do skybox

        // Front face
        this.vertex(-size, -size,  size, 0, 0, 1, 0, 0);
        this.vertex( size, -size,  size, 0, 0, 1, 1, 0);
        this.vertex( size,  size,  size, 0, 0, 1, 1, 1);
        this.vertex(-size,  size,  size, 0, 0, 1, 0, 1);
        this.lastQuad(0, 3, 2, 2, 1, 0);

        // Back face
        this.vertex(-size, -size, -size, 0, 0, -1, 1, 0);
        this.vertex( size, -size, -size, 0, 0, -1, 0, 0);
        this.vertex( size,  size, -size, 0, 0, -1, 0, 1);
        this.vertex(-size,  size, -size, 0, 0, -1, 1, 1);
        this.lastQuad(0, 1, 2, 2, 3, 0);

        // Top face
        this.vertex(-size,  size, -size, 0, 1, 0, 0, 1);
        this.vertex( size,  size, -size, 0, 1, 0, 1, 1);
        this.vertex( size,  size,  size, 0, 1, 0, 1, 0);
        this.vertex(-size,  size,  size, 0, 1, 0, 0, 0);
        this.lastQuad(0, 1, 2, 2, 3, 0);

        // Bottom face
        this.vertex(-size, -size, -size, 0, -1, 0, 0, 0);
        this.vertex( size, -size, -size, 0, -1, 0, 1, 0);
        this.vertex( size, -size,  size, 0, -1, 0, 1, 1);
        this.vertex(-size, -size,  size, 0, -1, 0, 0, 1);
        this.lastQuad(0, 3, 2, 2, 1, 0);

        // Right face
        this.vertex( size, -size, -size, 1, 0, 0, 1, 0);
        this.vertex( size, -size,  size, 1, 0, 0, 0, 0);
        this.vertex( size,  size,  size, 1, 0, 0, 0, 1);
        this.vertex( size,  size, -size, 1, 0, 0, 1, 1);
        this.lastQuad(0, 1, 2, 2, 3, 0);

        // Left face
        this.vertex(-size, -size, -size, -1, 0, 0, 0, 0);
        this.vertex(-size, -size,  size, -1, 0, 0, 1, 0);
        this.vertex(-size,  size,  size, -1, 0, 0, 1, 1);
        this.vertex(-size,  size, -size, -1, 0, 0, 0, 1);
        this.lastQuad(0, 3, 2, 2, 1, 0);

        this.upload();
    }

    render(shader, camera) {
        // Move o skybox para a posição da câmera
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, camera.position);

        gl.useProgram(shader.id);
        gl.uniformMatrix4fv(shader.getUniform("modelMatrix"), false, modelMatrix);
        gl.depthFunc(gl.LEQUAL);
        super.render(shader);
        gl.depthFunc(gl.LESS);
    }
}
