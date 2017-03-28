// Inspired by: https://github.com/mrdoob/three.js/blob/dev/examples/webgl_nearestneighbour.html

attribute float alpha;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_PointSize = 4.0 * ( 300.0 / -mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}
