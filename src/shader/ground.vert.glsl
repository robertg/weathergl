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

// attribute vec3 position;
// attribute vec3 normal;
// attribute vec2 uv;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vViewPosition;

// all shaders have a main function
void main() {
  vec3 pos = position; // + offset
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  vec2 sample = pos.xy * hmap_scale.xy + vec2(0.5, 0.5);
  vec4 ch = texture2D(hmap, sample);
  float height = ch.r * hmap_scale.z; // rand(pos.xy);

  vUv = uv;
  vPos = pos;
  vNormal = normal;

  // https://github.com/mrdoob/three.js/blob/e7dc951e829bad80c244001e6c63023e58ad8260/examples/js/ShaderTerrain.js
  vViewPosition = -(modelViewMatrix * vec4(position, 1.0)).xyz;


  gl_Position = projectionMatrix * modelViewMatrix * vec4(vec3(pos.xy, height), 1.0);
}


