// Copyright 2025 Elloramir.
// All rights over the code are reserved.

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
        const dx = Input.keyDelta("d", "a"); // Roll
        const dy = Input.keyDelta("w", "s"); // Pitch manual
        const dz = Input.keyDelta("q", "e"); // Yaw manual
        const accelerate = Input.isKeyDown(" "); // Aceleração com espaço
        
        // Roll é diretamente controlado pelo input
        this.roll += dx * 1 * dt;

        // Auto-estabilização do roll - retorno gradual à posição neutra
        if (Math.abs(dx) < 0.1) { // Se não houver input significativo
            this.roll = lerp(this.roll, 0, this.stabilityFactor*dt);
        }

        // O yaw é influenciado pelo roll e velocidade
        const rollInfluence = -Math.sin(this.roll) * this.turnRate * dt;
        this.yaw += rollInfluence * vec3.length(this.velocity);
        
        // Adicionar controle manual de pitch (w/s)
        this.pitch += dy * 0.5 * dt;
        
        // Adicionar controle manual de yaw (q/e)
        this.yaw += dz * 0.5 * dt;
        
        // Aplicar rotação ao transform
        this.transform.setRotation(this.pitch, this.yaw, this.roll);
        
        // Calculando vetor forward
        const forward = this.transform.forward();
        
        // Aplicar aceleração quando a tecla espaço é pressionada
        {
            const boost = accelerate ? 3 : 1;
            const fovTarget = (accelerate ? 1.2 : 1) * this.initialFov;
            this.camera.fov = lerp(this.camera.fov, fovTarget, 5*dt);
            vec3.scale(forward, forward, this.maxSpeed*boost);
            this.applyForce(forward);
        }
        
        // Aplicar arrasto (resistência do ar)
        {
            const dragForce = vec3.create();
            vec3.multiply(dragForce, this.velocity, this.dragging);
            vec3.scale(dragForce, dragForce, -1);
            this.applyForce(dragForce);
        }
        
        // Mover posição na direção da velocidade
        vec3.scaleAndAdd(this.transform.position, this.transform.position, this.velocity, dt);
        
        // Reduzir velocidade gradualmente
        vec3.scale(this.velocity, this.velocity, Math.exp(-this.dragging[0] * dt));
        
        // Forçar atualização da transformação
        this.transform.forceUpdate();

        {
            const distance = 20; // Distância fixa atrás do avião
            const baseHeight = 5;
            const heightCompensation = Math.cos(this.pitch) * -baseHeight + 10;

            let camX = Math.sin(this.yaw) * Math.cos(this.pitch) * -distance;
            let camY = heightCompensation;
            let camZ = Math.cos(this.yaw) * Math.cos(this.pitch) * -distance;

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
