// Copyright 2025 Elloramir.
// All rights over the code are reserved.

export default
class Entity {
    constructor() {
        this.isAlive = true;
        this.stage = null;
    }

    wakeup() {}
    update(dt) {}
    render() {}
}