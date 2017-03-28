// Inspired by: https://github.com/mrdoob/three.js/blob/dev/examples/webgl_nearestneighbour.html
uniform sampler2D tex;

void main() {
  gl_FragColor = texture2D(tex, gl_PointCoord);
}
