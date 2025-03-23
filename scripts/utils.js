export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function randomSign() {
    return Math.random() > 0.5 ? -1 : 1;
}