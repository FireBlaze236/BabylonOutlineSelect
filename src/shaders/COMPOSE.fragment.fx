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
    vec4 col = texture(textureSampler, vUV);
    //if(!glow) col -= colMask;
    col.a = 0.0;
    vec4 outlines = vec4(colMask.r * outlineColor.r, colMask.g * outlineColor.g, colMask.b * outlineColor.b, 1.0);

    gl_FragColor = col + outlines;
}