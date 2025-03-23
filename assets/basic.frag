precision mediump float;

#define PI (3.14159265359)

struct Material {
    vec3 baseColor;  // Albedo
    vec3 emissive;   // Light emitted by the material itself
    float metallic;  // (0 = dielectric, 1 = metal)
    float roughness; // (0 = flat, 1 = rough)
};

struct Light {
    vec3 direction;
    vec3 radiance;
};

// Uniforms
uniform sampler2D textureSampler;
uniform Material material;
uniform vec3 viewPos;

// Varyings
varying vec2 texCoords;
varying vec3 normal;
varying vec3 fragPos;

const Light sunLight = Light(
    vec3(1.0, 1.0, 0.0),
    vec3(1.0, 1.0, 1.0)
);

void main() {
    vec4 pixel = texture2D(textureSampler, texCoords);
    vec4 baseColor = vec4(pixel.rgb * material.baseColor + material.emissive, pixel.a);

    gl_FragColor = baseColor;
}