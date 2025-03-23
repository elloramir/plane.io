precision mediump float;

#define PI (3.14159265359)

struct Material {
    vec3 baseColor;  // Albedo
    vec3 emissive;   // Luz emitida pelo material
    float metallic;  // (0 = dielétrico, 1 = metálico)
    float roughness; // (0 = liso, 1 = rugoso)
};

struct Light {
    vec3 direction;
    vec3 radiance;
};

// Definições fixas da luz
const Light sunLight = Light(
    normalize(vec3(1.0, 1.0, 0.5)),  // Direção fixa da luz
    vec3(1.0, 0.5, 0.5)             // Intensidade fixa com tom levemente quente
);

const vec3 ambientLight = vec3(0.4, 0.4, 0.1);  // Luz ambiente fixa (tom levemente amarelado)
const float darknessAdjustment = 0.8;           // Ajuste fixo da escuridão (0 = totalmente escuro, 1 = normal)
const float gamma = 2.2;                        // Valor padrão para correção de gama
const float contrast = 1.2;                     // Fator de contraste (1.0 = normal, >1.0 aumenta, <1.0 reduz)

// Uniforms
uniform sampler2D textureSampler;
uniform Material material;
uniform vec3 viewPos;

// Varyings
varying vec2 texCoords;
varying vec3 normal;
varying vec3 fragPos;

void main() {
    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(sunLight.direction);
    vec3 viewDir = normalize(viewPos - fragPos);

    // Iluminação difusa (Lambert)
    float diff = max(dot(norm, lightDir), 0.0);
    
    // Iluminação especular
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), mix(8.0, 32.0, 1.0 - material.roughness));

    // Amostragem da textura
    vec4 texColor = texture2D(textureSampler, texCoords);
    
    // Combinação das componentes de iluminação
    vec3 lighting = ambientLight + (sunLight.radiance * diff) + (sunLight.radiance * spec * material.metallic);
    
    // Ajuste fixo da intensidade da iluminação global
    lighting *= darknessAdjustment;
    
    // Cálculo da cor final com emissivo
    vec3 finalColor = texColor.rgb * material.baseColor * lighting + material.emissive;
    
    // Aplicando correção de gama
    finalColor = pow(finalColor, vec3(1.0 / gamma));

    // Ajuste de contraste (centro em 0.5)
    finalColor = (finalColor - 0.5) * contrast + 0.5;

    gl_FragColor = vec4(finalColor, texColor.a);
}
