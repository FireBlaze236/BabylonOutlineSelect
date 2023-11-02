precision highp float;

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D prevTex;

// Parameters
uniform vec2 screenSize;
uniform float k;

void main(void)
{
    vec2 texel = 1.0 / screenSize;
    vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
    for(float i = -k; i <= k; i++) {
        for(float j = -k; j <= k; j++) {
            vec2 idx = vec2(i, j) * texel;
            vec4 c = texture(textureSampler, vUV + idx);
            col += c;
        }
    }
    col /= k * k;

    gl_FragColor = col;
}