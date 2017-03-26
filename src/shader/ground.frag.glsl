// inspired by:
// - https://csantosbh.wordpress.com/2014/01/09/custom-shaders-with-three-js-uniforms-textures-and-lighting/
// - spacejack/terra

precision highp float;

// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"

uniform sampler2D hmap;


#if NUM_DIR_LIGHTS > 0

struct DirectionalLight {
  vec3 direction; // this is relative to the camera!!!! fix
  vec3 color;

  int shadow;
  float shadowBias;
  float shadowRadius;
  vec2 shadowMapSize;
};

uniform DirectionalLight directionalLights[NUM_DIR_LIGHTS];
#endif

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  // gl_FragColor is a special variable a fragment shader
  // is responsible for setting
  // gl_FragColor = texture2D(heightMap, vec2(2,500));
  // vec4 addedLights = vec4(1.0, 1.0, 1.0, 1.0);
  vec4 addedLights = vec4(0.0, 0.0, 0.0, 1.0);

  #if NUM_DIR_LIGHTS > 0
  for(int l = 0; l < NUM_DIR_LIGHTS; l++) {
    // gl_FragColor = vec4(abs(directionalLights[l].direction), 1);
    vec3 dirHalfVector = normalize(directionalLights[l].direction + normalize(vViewPosition));
    addedLights.rgb += clamp(dot(normalize(vNormal), dirHalfVector), 0.0, 1.0) * directionalLights[l].color;
  }
  #endif

  gl_FragColor = vec4(124.0 / 255.0, 252.0 / 255.0, 0.0 / 255.0, 1) * addedLights;

  // gl_FragColor = vec4(124.0 / 255.0, 252.0 / 255.0, 0.0 / 255.0, 1); // return redish-purple
}
