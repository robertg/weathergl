// Inspired by: https://github.com/mrdoob/three.js/blob/dev/examples/webgl_nearestneighbour.html

attribute float alpha;
varying float vAlpha;

void main() {
  vAlpha = 1.0 - alpha;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_PointSize = 4.0 * ( 300.0 / -mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}
