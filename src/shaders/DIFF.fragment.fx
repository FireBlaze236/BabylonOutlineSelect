precision highp float;

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D prevTex;

// Parameters
uniform vec2 screenSize;

void main(void)
{
    vec4 col = texture(textureSampler, vUV) - texture(prevTex, vUV);
    col.a = 0.0;
    gl_FragColor = col;
}