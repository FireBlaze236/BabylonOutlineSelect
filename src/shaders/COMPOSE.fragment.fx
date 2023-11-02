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
    vec4 outlines = vec4(outlineColor.r,  outlineColor.g,  outlineColor.b, 1.0);

    gl_FragColor = col + (outlines) * colMask;
}