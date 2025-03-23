precision highp  float;

// Attributes
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexturecoord;

// Varyings
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

// Varyings
varying vec2 texCoords;
varying vec3 normal;
varying vec3 fragPos;

void main() {
    vec4 worldPosition = modelMatrix * vec4(aPosition, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
    gl_Position = gl_Position.xyww;

    fragPos = worldPosition.xyz;
    texCoords = aTexturecoord;

    // @TODO(ellora): Transpose that matrix?
    normal = mat3(modelMatrix) * aNormal; 
}
