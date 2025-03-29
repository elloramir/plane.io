export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function randomSign() {
    return Math.random() > 0.5 ? -1 : 1;
}

export function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function clamp(v, min, max) {
    return Math.max(min, Math.min(v, max));
}