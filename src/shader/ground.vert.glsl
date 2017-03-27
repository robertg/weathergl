// inspired by:
// - https://csantosbh.wordpress.com/2014/01/09/custom-shaders-with-three-js-uniforms-textures-and-lighting/
// - spacejack/terra

precision highp float;

// an attribute will receive data from a buffer
// attribute vec4 a_position;

// required since this is a three.js Mesh
// uniform mat4 modelViewMatrix;
// uniform mat4 projectionMatrix;
uniform sampler2D hmap;
uniform vec3 hmap_scale;
uniform vec4 offsetRepeat;

// attribute vec3 position;
// attribute vec3 normal;
// attribute vec2 uv;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vViewPosition;

#ifdef USE_SHADOWMAP
#if NUM_DIR_LIGHTS > 0
uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHTS ];
varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];
#endif
#endif

// all shaders have a main function
void main() {
  vec3 pos = position; // + offset
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  vec2 sample = pos.xy * hmap_scale.xy + vec2(0.5, 0.5);
  vec4 ch = texture2D(hmap, sample);
  float height = ch.r * hmap_scale.z; // rand(pos.xy);

  vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
  vPos = pos;
  vNormal = normal;

  // https://github.com/mrdoob/three.js/blob/e7dc951e829bad80c244001e6c63023e58ad8260/examples/js/ShaderTerrain.js
  vViewPosition = -(modelViewMatrix * vec4(position, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(vec3(pos.xy, height), 1.0);

  #ifdef USE_SHADOWMAP
  #if NUM_DIR_LIGHTS > 0
  // From https://github.com/mrdoob/three.js/blob/acdda10d5896aa10abdf33e971951dbf7bd8f074/src/renderers/shaders/ShaderChunk/shadowmap_vertex.glsl
  vec4 worldPosition = modelMatrix * vec4(vec3(pos.xy, height), 1.0);
  for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
    vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * worldPosition;
  }
  #endif
  #endif


}


