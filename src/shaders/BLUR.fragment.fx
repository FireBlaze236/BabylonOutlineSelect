precision highp float;

varying vec2 vUV;

uniform sampler2D textureSampler;
uniform vec2 screenSize = vec2(1024, 1024);
uniform int k = 16;

void main(void) {
    int samples = 2 * k + 1;
    vec4 sum = vec4(0.0);
    vec2 texel = 1.0 / screenSize;

    for(float i = -k; i <= k; i++) {
        for(float j = -k; j <= k; j++) {
            vec2 offset = vec2(i, j) * texel;
            sum += texture(textureSampler, vUV + offset);
        }
    }
    sum /= samples;
    gl_FragColor = sum;
}