import * as MathUtils from './math-utility.js';

// created by Chat-GPT
export function hsbToRgb(hue, saturation, brightness) {
    // Convert hue to a value between 0 and 360 degrees
    hue = hue % 360;
  
    // Convert saturation and brightness to values between 0 and 1
    saturation = MathUtils.clamp(saturation, 0, 100.0) / 100;
    brightness = MathUtils.clamp(brightness, 0, 100.0) / 100;
  
    // If the saturation is 0, the color is a shade of gray
    if (saturation === 0) {
      const gray = Math.round(brightness * 255);
      return [gray, gray, gray];
    }
  
    // Calculate the chroma
    const chroma = brightness * saturation;
  
    // Calculate the secondary color value
    const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  
    // Calculate the lightness adjustment factor
    const m = brightness - chroma;
  
    // Calculate the RGB values based on the hue value
    let red = 0;
    let green = 0;
    let blue = 0;
  
    if (hue < 60) {
      red = chroma;
      green = x;
    } else if (hue < 120) {
      red = x;
      green = chroma;
    } else if (hue < 180) {
      green = chroma;
      blue = x;
    } else if (hue < 240) {
      green = x;
      blue = chroma;
    } else if (hue < 300) {
      red = x;
      blue = chroma;
    } else {
      red = chroma;
      blue = x;
    }
  
    // Add the lightness adjustment factor to the RGB values
    red = Math.round((red + m) * 255);
    green = Math.round((green + m) * 255);
    blue = Math.round((blue + m) * 255);
    return [red, green, blue];
  }