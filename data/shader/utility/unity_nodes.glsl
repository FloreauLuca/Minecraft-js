#define M_PI 3.141592653
#define M_2PI 6.283185307

vec2 unityVoronoiNoiseRandomVector (vec2 uv, float offset)
{
    mat2 m = mat2(15.27, 47.63, 99.41, 89.98);
    uv = fract(sin(uv*m) * 46839.32);
    return vec2(sin(uv.y*+offset)*0.5+0.5, cos(uv.x*offset)*0.5+0.5);
}

void unityVoronoiFloat(vec2 uv, float angleOffset, float cellDensity, out float dist, out float cells)
{
    vec2 g = floor(uv * cellDensity);
    vec2 f = fract(uv * cellDensity);
    float t = 8.0;
    vec3 res = vec3(8.0, 0.0, 0.0);

    for(int y=-1; y<=1; y++)
    {
        for(int x=-1; x<=1; x++)
        {
            vec2 lattice = vec2(x,y);
            vec2 offset = unityVoronoiNoiseRandomVector(lattice + g, angleOffset);
            float d = distance(lattice + offset, f);
            if(d < res.x)
            {
                res = vec3(d, offset.x, offset.y);
                dist = res.x;
                cells = res.y;
            }
        }
    }
}

float unityNoiseRandomValue (vec2 uv)
{
    return fract(sin(dot(uv, vec2(12.9898, 78.233)))*43758.5453);
}

float unityNoiseInterpolate (float a, float b, float t)
{
    return (1.0-t)*a + (t*b);
}

float unityValueNoise (vec2 uv)
{
    vec2 i = floor(uv);
    vec2 f = fract(uv);
    f = f * f * (3.0 - 2.0 * f);

    uv = abs(fract(uv) - 0.5);
    vec2 c0 = i + vec2(0.0, 0.0);
    vec2 c1 = i + vec2(1.0, 0.0);
    vec2 c2 = i + vec2(0.0, 1.0);
    vec2 c3 = i + vec2(1.0, 1.0);
    float r0 = unityNoiseRandomValue(c0);
    float r1 = unityNoiseRandomValue(c1);
    float r2 = unityNoiseRandomValue(c2);
    float r3 = unityNoiseRandomValue(c3);

    float bottomOfGrid = unityNoiseInterpolate(r0, r1, f.x);
    float topOfGrid = unityNoiseInterpolate(r2, r3, f.x);
    float t = unityNoiseInterpolate(bottomOfGrid, topOfGrid, f.y);
    return t;
}

void unitySimpleNoiseFloat(vec2 uv, float scale, out float value)
{
    float t = 0.0;

    float freq = pow(2.0, float(0));
    float amp = pow(0.5, float(3-0));
    t += unityValueNoise(vec2(uv.x*scale/freq, uv.y*scale/freq))*amp;

    freq = pow(2.0, float(1));
    amp = pow(0.5, float(3-1));
    t += unityValueNoise(vec2(uv.x*scale/freq, uv.y*scale/freq))*amp;

    freq = pow(2.0, float(2));
    amp = pow(0.5, float(3-2));
    t += unityValueNoise(vec2(uv.x*scale/freq, uv.y*scale/freq))*amp;

    value = t;
}

#include <packing>

float readDepth(float fragCoordZ, float cameraNear, float cameraFar)
{
  float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
  return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}
