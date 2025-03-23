// Copyright 2025 Elloramir.
// All rights over the code are reserved.

// Plane.js
import { vec3, mat4, common } from "../math.js";
import { lerp } from "../utils.js";
import Entity from "../entity.js";
import Input from "../input.js";
import Planet from "./planet.js";

export default
class Plane extends Entity {
    wakeup(x, y, z) {
        this.model = this.stage.plane;
        this.transform = this.model.transform;
        this.transform.setPosition(x, y, z);
        this.camera = this.stage.camera;
        this.initialFov = this.camera.fov;
        this.mass = 1;
        this.maxSpeed = 10;
        this.velocity = vec3.fromValues(0, 0, 0);
        this.dragging = vec3.fromValues(0.1, 0.1, 0.1);
        this.pitch = 0;
        this.yaw = 0;
        this.roll = 0;
        this.turnRate = 0.006; // Taxa de mudança de direção baseada no roll
        this.stabilityFactor = 0; // Fator de auto-estabilização do roll
    }
    
    applyForce(acceleration) {
        vec3.scaleAndAdd(this.velocity, this.velocity, acceleration, this.mass);
    }
    
    update(dt) {
        if (this.stage.debugMode) {
            return;
        }

        // Controles do avião
        const dx = Input.keyDelta("d", "a"); // Controle de roll
        const dy = Input.keyDelta("w", "s"); // Controle de pitch manual
        const accelerate = Input.isKeyDown(" "); // Aceleração com espaço
        
        // Atualiza roll com base no input
        this.roll -= dx * dt;
        
        // Auto-estabilização do roll quando não há input significativo
        if (Math.abs(dx) < 0.1) {
            this.roll = lerp(this.roll, 0, this.stabilityFactor * dt);
        }

        // Atualiza yaw com influência do roll e da velocidade
        const rollInfluence = -Math.sin(this.roll) * this.turnRate * dt;
        this.yaw -= rollInfluence * vec3.length(this.velocity);
        
        // Atualiza pitch com controle manual
        this.pitch -= dy * 0.5 * dt;
        
        // Atualiza a rotação do transform utilizando os ângulos atuais
        this.transform.setRotation(this.pitch, this.yaw, this.roll);
        
        // Obtém o vetor forward a partir da matriz de transformação que já incorpora pitch, yaw e roll
        const forward = this.transform.forward();
        
        // Aplica aceleração quando a tecla espaço é pressionada
        {
            const boost = accelerate ? 3 : 1;
            const fovTarget = (accelerate ? 1.2 : 1) * this.initialFov;
            this.camera.fov = lerp(this.camera.fov, fovTarget, 5 * dt);
            let force = vec3.create();
            vec3.scale(force, forward, this.maxSpeed * boost);
            this.applyForce(force);
        }
        
        // Aplica arrasto (resistência do ar)
        {
            const dragForce = vec3.create();
            vec3.multiply(dragForce, this.velocity, this.dragging);
            vec3.scale(dragForce, dragForce, -1);
            this.applyForce(dragForce);
        }
        
        // Atualiza a posição do avião com base na velocidade
        vec3.scaleAndAdd(this.transform.position, this.transform.position, this.velocity, dt);
        
        // Reduz a velocidade gradualmente
        vec3.scale(this.velocity, this.velocity, Math.exp(-this.dragging[0] * dt));
        
        // Força atualização da transformação
        this.transform.forceUpdate();

        // Atualização da câmera (mantém uma posição fixa relativa ao avião)
        {
            const distance = 20; // Distância fixa atrás do avião
            const baseHeight = 5;
            const heightCompensation = Math.cos(this.pitch) * -baseHeight + 10;

            let camX = Math.sin(this.yaw) * Math.cos(this.pitch) * distance;
            let camY = heightCompensation;
            let camZ = Math.cos(this.yaw) * Math.cos(this.pitch) * distance;

            this.camera.position[0] = this.transform.position[0] + camX;
            this.camera.position[1] = this.transform.position[1] + camY;
            this.camera.position[2] = this.transform.position[2] + camZ;

            this.camera.target[0] = this.transform.position[0];
            this.camera.target[1] = this.transform.position[1];
            this.camera.target[2] = this.transform.position[2];
        }
    }
    
    render() {
        this.model.render(this.stage.shader, this.camera);
    }
}
