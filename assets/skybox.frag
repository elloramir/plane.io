precision highp  float;

// Uniforms
uniform vec3 viewPos; // Posição da câmera
uniform float time;  // Tempo para animação

// Varyings
varying vec3 fragPos;

// Função hash para geração de ruído
vec3 hash(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Função de ruído 3D
float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    
    return mix(mix(mix(dot(hash(i + vec3(0.0,0.0,0.0)), f - vec3(0.0,0.0,0.0)), 
                        dot(hash(i + vec3(1.0,0.0,0.0)), f - vec3(1.0,0.0,0.0)), u.x),
                   mix(dot(hash(i + vec3(0.0,1.0,0.0)), f - vec3(0.0,1.0,0.0)), 
                        dot(hash(i + vec3(1.0,1.0,0.0)), f - vec3(1.0,1.0,0.0)), u.x), u.y),
              mix(mix(dot(hash(i + vec3(0.0,0.0,1.0)), f - vec3(0.0,0.0,1.0)), 
                        dot(hash(i + vec3(1.0,0.0,1.0)), f - vec3(1.0,0.0,1.0)), u.x),
                   mix(dot(hash(i + vec3(0.0,1.0,1.0)), f - vec3(0.0,1.0,1.0)), 
                        dot(hash(i + vec3(1.0,1.0,1.0)), f - vec3(1.0,1.0,1.0)), u.x), u.y), u.z);
}

// Função para mapear temperatura de cor das estrelas
vec3 starColor(float temperature) {
    temperature = clamp(temperature, 2000.0, 10000.0) / 10000.0;
    
    // Mapeamento matemático sem IF
    vec3 red = vec3(1.0, 0.5, 0.3);
    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 blue = vec3(0.4, 0.6, 1.0);
    
    float t_red_white = smoothstep(0.0, 0.3, temperature);
    float t_white_blue = smoothstep(0.3, 1.0, temperature);
    
    return mix(mix(red, white, t_red_white), blue, t_white_blue);
}

void main() {
    // Direção das estrelas baseada na posição da câmera
    vec3 stars_direction = normalize(fragPos - viewPos);
    
    float stars_threshold = 8.0;
    float stars_exposure = 200.0;
    
    float stars = pow(clamp(noise(stars_direction * 200.0), 0.0, 1.0), stars_threshold) * stars_exposure;
    
    // Adicionando cintilação
    stars *= mix(0.1, 1.4, noise(stars_direction * 100.0 + vec3(time)));
    
    // Definindo temperatura estelar
    float temperature = mix(2000.0, 10000.0, noise(stars_direction * 50.0));
    vec3 star_color = starColor(temperature);
    
    // Saída final do shader
    gl_FragColor = vec4(star_color * stars, 1.0);
}