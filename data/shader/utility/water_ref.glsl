float cyanWaveNoise(vec2 uv, float time, float middle, float thickness)
{
  float value = 0.0;
  unitySimpleNoiseFloat(uv, 1.0, value);
  float wave = middle;
  float min = step(wave - thickness, value);
  float max = step(wave + thickness, value);
  return min - max;
}

float royDepthValue(vec3 fragCoord, vec2 screenSize, sampler2D texDepth, float cameraNear, float cameraFar, float depthMaxDist)
{
  vec4 screenPos = vec4(fragCoord.x / screenSize.x, fragCoord.y / screenSize.y, fragCoord.z, 1.0);
  float fragCoordZ = texture2D(texDepth, screenPos.xy).x;
  float depth = readDepth(fragCoordZ, cameraNear, cameraFar);
  float planeDepth = readDepth(fragCoord.z, cameraNear, cameraFar);
  float waterDepth = clamp((depth - planeDepth) * cameraFar / depthMaxDist, 0.0, 1.0);
  return waterDepth;
}

float royWaveNoise(vec2 uv, float time,float surfaceCutOff, float foamDepth)
{
  float surfaceNoiseCutoffProcess = foamDepth * surfaceCutOff;
  float value = 0.0;
  unitySimpleNoiseFloat(uv, 1.0, value);
  float surfaceNoise = value;
  return step(surfaceNoiseCutoffProcess, surfaceNoise);
}

vec2 waveUV(vec2 uv, float time, vec2 speed, vec2 amplitude, vec2 frequency)
{
  vec2 decal = vec2(0.0, 0.5);
  float d1 = mod((uv.x + uv.y+ decal.x) * frequency.x, M_2PI);
  float d2 = mod((uv.x + uv.y + decal.y) * frequency.y, M_2PI);
  d1 = time * speed.x + d1;
  d2 = time * speed.y + d2;
  vec2 dist = vec2(
      sin(d1) * amplitude.x + sin(d2) * amplitude.y,
      cos(d1) * amplitude.x + cos(d2) * amplitude.y);
  return dist;
}

vec2 waveUV(vec2 uv, float time, vec2 speed, vec2 amplitude, vec2 frequency, vec2 decal)
{
  float d1 = mod((uv.x + uv.y+ decal.x) * frequency.x, M_2PI);
  float d2 = mod((uv.x + uv.y + decal.y) * frequency.y, M_2PI);
  d1 = time * speed.x + d1;
  d2 = time * speed.y + d2;
  vec2 dist = vec2(
      sin(d1) * amplitude.x + sin(d2) * amplitude.y,
      cos(d1) * amplitude.x + cos(d2) * amplitude.y);
  return dist;
}
