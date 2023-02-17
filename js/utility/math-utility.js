export function clamp(value, min, max)
{
    return Math.min(Math.max(value, min), max);
}

export function lerp(a, b, t)
{
	return (1.0 - t) * a + b * t;
}

export function inverseLerp(a, b, v)
{
	return (v - a) / (b - a);
}

export function remap(value, valueMin, valueMax, outMin, outMax)
{
    const t = inverseLerp(valueMin, valueMax, value);
	return lerp(outMin, outMax, t);
}