precision highp float;

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D outlineMask;


// Parameters
uniform vec2 screenSize;
uniform vec3 outlineColor;
uniform bool glow;

void main(void)
{
    vec4 colMask = texture(outlineMask, vUV);
    colMask.a = 0.0;
    colMask.xyz = colMask.xxx;
    vec4 col = texture(textureSampler, vUV);
    vec4 outlines = vec4(outlineColor.r,  outlineColor.g,  outlineColor.b, 1.0);
    // Remove the part of the color mask
    col -= colMask;
    col.x = max(0., col.x);
    col.y = max(0., col.y);
    col.z = max(0., col.z);

    // Add the missing part as new color
    gl_FragColor = col + colMask * outlines;
}