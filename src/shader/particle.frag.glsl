// Inspired by: https://github.com/mrdoob/three.js/blob/dev/examples/webgl_nearestneighbour.html
uniform sampler2D tex;
uniform bool rain;

void main() {
  if(rain) {
    vec4 rain_blue = vec4(119.0/255.0, 136.0/255.0, 153.0/255.0, 1);
    gl_FragColor = texture2D(tex, gl_PointCoord) * rain_blue;
  } else {
    gl_FragColor = texture2D(tex, gl_PointCoord);
  }
}
