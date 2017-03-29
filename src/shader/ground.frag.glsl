// This ground shader is inspired by:
// - https://csantosbh.wordpress.com/2014/01/09/custom-shaders-with-three-js-uniforms-textures-and-lighting/
// - spacejack/terra
// - https://github.com/mrdoob/three.js/blob/dev/examples/js/ShaderTerrain.js
// - https://github.com/mrdoob/three.js/blob/dev/examples/js/ShaderSkin.js

precision highp float;

///////
/// START three.js shadow utils IMPORT
///////

uniform vec3 ambientLightColor;

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

// Imported from https://github.com/mrdoob/three.js/blob/e7dc951e829bad80c244001e6c63023e58ad8260/src/renderers/shaders/ShaderChunk.js
// https://github.com/mrdoob/three.js/blob/acdda10d5896aa10abdf33e971951dbf7bd8f074/src/renderers/shaders/ShaderChunk/shadowmask_pars_fragment.glsl
#ifdef USE_SHADOWMAP
#if NUM_DIR_LIGHTS > 0
uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHTS ];
varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];
#endif
#endif

const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

float unpackRGBAToDepth( const in vec4 v ) {
  return dot( v, UnpackFactors );
}

float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
  return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
}

float texture2DShadowLerp( sampler2D depths, vec2 size, vec2 uv, float compare ) {
  const vec2 offset = vec2( 0.0, 1.0 );
  vec2 texelSize = vec2( 1.0 ) / size;
  vec2 centroidUV = floor( uv * size + 0.5 ) / size;
  float lb = texture2DCompare( depths, centroidUV + texelSize * offset.xx, compare );
  float lt = texture2DCompare( depths, centroidUV + texelSize * offset.xy, compare );
  float rb = texture2DCompare( depths, centroidUV + texelSize * offset.yx, compare );
  float rt = texture2DCompare( depths, centroidUV + texelSize * offset.yy, compare );
  vec2 f = fract( uv * size + 0.5 );
  float a = mix( lb, lt, f.y );
  float b = mix( rb, rt, f.y );
  float c = mix( a, b, f.x );
  return c;
}

float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
  shadowCoord.xyz /= shadowCoord.w;
  shadowCoord.z += shadowBias;

    bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
    bool inFrustum = all( inFrustumVec );

    bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );

    bool frustumTest = all( frustumTestVec );

    if ( frustumTest ) {

      #if defined( SHADOWMAP_TYPE_PCF )

      vec2 texelSize = vec2( 1.0 ) / shadowMapSize;

      float dx0 = - texelSize.x * shadowRadius;
      float dy0 = - texelSize.y * shadowRadius;
      float dx1 = + texelSize.x * shadowRadius;
      float dy1 = + texelSize.y * shadowRadius;

      return (
        texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
        texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
        texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
        texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
        texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
        texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
        texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
        texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
        texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
        ) * ( 1.0 / 9.0 );

      #elif defined( SHADOWMAP_TYPE_PCF_SOFT )

      vec2 texelSize = vec2( 1.0 ) / shadowMapSize;

      float dx0 = - texelSize.x * shadowRadius;
      float dy0 = - texelSize.y * shadowRadius;
      float dx1 = + texelSize.x * shadowRadius;
      float dy1 = + texelSize.y * shadowRadius;

      return (
        texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
        texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
        texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
        texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
        texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy, shadowCoord.z ) +
        texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
        texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
        texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
        texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
        ) * ( 1.0 / 9.0 );
    #else // no percentage-closer filtering:
    return texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
    #endif
  }
  return 1.0;
}

float getShadowMask() {
  float shadow = 1.0;
  #ifdef USE_SHADOWMAP
  #if NUM_DIR_LIGHTS > 0
  DirectionalLight directionalLight;
  for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
    directionalLight = directionalLights[ i ];
    shadow *= bool( directionalLight.shadow ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
  }
  #endif
  #endif
  return shadow;
}

// perturbNormalArb derived from: https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/bumpmap_pars_fragment.glsl
// - http://mmikkelsen3d.blogspot.ca/2011/07/derivative-maps.html
vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {
  vec3 vSigmaX = dFdx( surf_pos );
  vec3 vSigmaY = dFdy( surf_pos );
  vec3 vN = surf_norm;    // normalized
  vec3 R1 = cross( vSigmaY, vN );
  vec3 R2 = cross( vN, vSigmaX );
  float fDet = dot( vSigmaX, R1 );
  vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
  return normalize( abs( fDet ) * surf_norm - vGrad );
}

///////
/// END three.js shadow utils IMPORT
///////

uniform sampler2D hmap;
uniform vec3 hmap_scale;
uniform float max_height;
uniform sampler2D grass_texture;
uniform sampler2D grass_bumpmap;
uniform sampler2D rock_texture;
uniform sampler2D rock_bumpmap;
uniform vec3 gameCameraPosition;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  // Compute height just like the vertex shader.
  vec2 sample = vPos.xy * hmap_scale.xy + vec2(0.5, 0.5);
  vec4 ch = texture2D(hmap, sample);
  float mixer = min(ch.r * 2.0, 1.0);

  // Apply the rock and grass texture
  vec3 color = mix(
    texture2D(grass_texture, vUv).rgb,
    texture2D(rock_texture, vUv).rgb,
    mixer
  );

  // Apply mixed bump map using inspiration from the dHdxy_fwd found in three.js's bumpmap_pars_fragment.glsl:
  // http://mmikkelsen3d.blogspot.sk/2011/07/derivative-maps.html

  vec2 dSTdx = dFdx(vUv);
  vec2 dSTdy = dFdy(vUv);

  float bumpmap_Hll = mix(
    texture2D(grass_bumpmap, vUv).r,
    texture2D(rock_bumpmap, vUv).r,
    mixer
  );

  float bumpmap_dBx = mix(
    texture2D(grass_bumpmap, vUv + dSTdx).r,
    texture2D(rock_bumpmap, vUv + dSTdx).r,
    mixer
  );

  float bumpmap_dBy = mix(
    texture2D(grass_bumpmap, vUv + dSTdy).r,
    texture2D(rock_bumpmap, vUv + dSTdy).r,
    mixer
  );

  float Hll = 1.0 * bumpmap_Hll;
  float dBx = 1.0 * bumpmap_dBx - Hll;
  float dBy = 1.0 * bumpmap_dBy - Hll;


  // https://github.com/mrdoob/three.js/blob/dev/examples/js/ShaderSkin.js
  if(distance(gameCameraPosition, vPos) < 25.0) {
    normal = perturbNormalArb(-vViewPosition, normal, vec2(dBx, dBy));
  }

  // Apply lighting
  vec4 addedLights = vec4(0.0, 0.0, 0.0, 1.0);

  #if NUM_DIR_LIGHTS > 0
  for(int l = 0; l < NUM_DIR_LIGHTS; l++) {
    // gl_FragColor = vec4(abs(directionalLights[l].direction), 1);
    vec3 dirHalfVector = normalize(directionalLights[l].direction + normalize(vViewPosition));
    addedLights.rgb += clamp(dot(normalize(normal), dirHalfVector), 0.0, 1.0) * directionalLights[l].color;
  }

  addedLights.rgb *= max(getShadowMask(), 0.25);

  addedLights.rgb += ambientLightColor;
  #endif

  gl_FragColor = vec4(color, 1) * addedLights;

  // gl_FragColor = vec4(124.0 / 255.0, 252.0 / 255.0, 0.0 / 255.0, 1); // return redish-purple
}
