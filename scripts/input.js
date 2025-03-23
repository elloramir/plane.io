// Copyright 2025 Elloramir.
// All rights over the code are reserved.

export default
class Input {
    static keyStates = new Map();
    static buttonStates = new Map();
    static mouse = { x: 0, y: 0, wheelDelta: 0 };

    static init() {
        window.addEventListener("keydown", (e) => this.keyStates.set(e.key.toLowerCase(), true));
        window.addEventListener("keyup", (e) => this.keyStates.set(e.key.toLowerCase(), false));

        window.canvas.addEventListener("mousemove", (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.canvas.addEventListener("mousedown", (e) => this.buttonStates.set(e.button, true));
        window.addEventListener("mouseup", (e) => this.buttonStates.set(e.button, false));

        // Mouse wheel event listener
        window.addEventListener("wheel", (e) => {
            // Normalizing the wheel delta based on the event's deltaY or deltaX (vertical or horizontal scroll)
            // Here, we'll focus on vertical scroll (deltaY)
            this.mouse.wheelDelta = e.deltaY;
        });
    }

    static isKeyDown(key) {
        return this.keyStates.get(key) || false;
    }

    static keyDelta(k1, k2) {
        return (this.isKeyDown(k1) ? 1 : 0) - (this.isKeyDown(k2) ? 1 : 0);
    }

    static isButtonDown(button) {
        return this.buttonStates.get(button) || false;
    }

    // Method to get the current wheel scroll delta
    static getWheelDelta() {
        return this.mouse.wheelDelta;
    }
}
