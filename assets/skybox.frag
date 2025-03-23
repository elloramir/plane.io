precision mediump float;

// Uniforms
uniform sampler2D textureSampler;
uniform vec3 viewPos;

// Varyings
varying vec2 texCoords;

void main() {
    vec4 pixel = texture2D(textureSampler, texCoords);
    gl_FragColor = pixel;
}