varying vec2 vUv;
varying vec4 vScreenPos;
varying vec3 vPosition;

void main()
{
    vUv = uv;
    vec4 localPosition = vec4( position, 1.);
    vec4 worldPosition = modelMatrix * localPosition;
    vPosition = worldPosition.xyz;
    vec4 viewPosition = viewMatrix * worldPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition; //either orthographic or perspective
    vScreenPos = viewPosition;
    gl_Position = projectedPosition;
}