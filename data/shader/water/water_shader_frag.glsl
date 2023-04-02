// Depth calculation
uniform sampler2D uTexDiffuse;
uniform sampler2D uTexDepth;
uniform float uCameraNear;
uniform float uCameraFar;
uniform float uWidth;
uniform float uHeight;

// Faded Depth
uniform float uDepthMaxDistance;

// UV Displacement
uniform float uTime;
uniform vec2 uScale;
uniform vec2 uSpeed;
uniform vec2 uWaveSpeed;
uniform vec2 uWaveAmplitude;
uniform vec2 uWaveFrequency;

// Deep general
uniform float uDeepThickness;
uniform float uDeepMiddle;
uniform float uDeepWaveSpeed;
uniform float uDeepRange;
uniform float uDeepFadeOut;

// Foam general
uniform float uFoamThickness;
uniform float uFoamMiddle;
uniform float uFoamWaveSpeed;
uniform float uFoamRange;

// Coast Foam
uniform float uFoamDistance;
uniform float uSurfaceNoiseCutoff;
uniform float uCoastWaveSpeed;
uniform float uCoastWaveRange;
uniform float uCoastFoamPow;
uniform vec2 uCoastFoamScale;

// Colors
uniform vec3 uWaterColor;
uniform vec3 uWaterDeepColor;
uniform vec3 uFoamColor;
uniform vec3 uDepthGradientShallow;

varying vec2 vUv;
varying vec4 vScreenPos;
varying vec3 vPosition;

void main()
{
// Faded Depth
  float waterDepth = royDepthValue(gl_FragCoord.xyz, vec2(uWidth, uHeight), uTexDepth, uCameraNear, uCameraFar, uDepthMaxDistance);
  //gl_FragColor.rgb = vec3(waterDepth);
  vec3 color = mix(uDepthGradientShallow, uWaterColor, waterDepth);
  
// UV Displacement
  vec2 uv = vPosition.xz / uScale + uSpeed * uTime;
  // vec2 dist = waveUV(uv, uTime, vec2(0.05, 0.1), vec2(1.0,1.0), vec2(0.0, 0.1));
  vec2 dist = waveUV(uv, uTime, uWaveSpeed, uWaveAmplitude, uWaveFrequency);
  uv += dist.yx;

// Deep general
float deepThickness = uDeepThickness * (1.0+sin(uTime * uDeepWaveSpeed)*uDeepRange);
  float waterDeep = cyanWaveNoise(uv, uTime, uDeepMiddle, deepThickness);
  waterDeep -= pow(1.0 - waterDepth, uDeepFadeOut);
  color = mix(color, uWaterDeepColor,clamp(waterDeep, 0.0, 1.0));
  
// Foam general
float foamThickness = uFoamThickness * (1.0+sin(uTime * uFoamWaveSpeed)*uFoamRange);
  float foam = cyanWaveNoise(vec2(2.0) - uv, uTime, uFoamMiddle, foamThickness);
  color = mix(color, uFoamColor,foam);
  
// Coast Foam
  float foamDepth = royDepthValue(gl_FragCoord.xyz, vec2(uWidth, uHeight), uTexDepth, uCameraNear, uCameraFar, uFoamDistance);
  foamDepth = pow(foamDepth, uCoastFoamPow);
  //gl_FragColor.rgb = vec3(foamDepth);
  float surfaceNoiseCutoff = uSurfaceNoiseCutoff * (1.0 + sin(uTime * uCoastWaveSpeed) * uCoastWaveRange);
  foamDepth = royWaveNoise(uv * uCoastFoamScale + vec2(50.0, 50.0), uTime, surfaceNoiseCutoff, foamDepth);
  color = mix(color, uFoamColor, foamDepth);

  gl_FragColor.rgb = color;
  gl_FragColor.a = 1.0;
}