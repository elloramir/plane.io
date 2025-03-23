precision mediump float;

// Entrada do vertex shader
varying vec3 normal;

void main() {
    // Normalizar a normal interpolada
    vec3 N = normalize(normal);
    
    // Converter a normal de [-1,1] para [0,1] para visualização como cor
    // (x,y,z) -> (r,g,b)
    vec3 normalColor = N * 0.5 + 0.5;
    
    // Saída: as componentes RGB representam as componentes XYZ das normais
    gl_FragColor = vec4(normalColor, 1.0);
}