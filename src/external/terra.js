// @flow

// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich
// https://github.com/spacejack/terra

const Terra = {};

/**
 * @param cellSize Size of each mesh cell (quad)
 * @param xcount X vertex count
 * @param ycount Y vertex count
 */
Terra.createVtxBuffers = function (cellSize: number, xcount: number, ycount: number) {
  const pos = new Float32Array(xcount * ycount * 3);
  const uv = new Float32Array(xcount * ycount * 2);
  const TEX_SCALE = 1.0 / 6.0; // texture scale per quad
  let ix: number, iy: number;
  let x: number, y: number;
  let u: number, v: number;
  let i = 0;
  let j = 0;
  for (iy = 0; iy < ycount; ++iy) {
    y = (iy - ycount / 2.0) * cellSize;
    u = iy;
    for (ix = 0; ix < xcount; ++ix) {
      x = (ix - xcount / 2.0) * cellSize;
      v = ix;
      pos[i++] = x;
      pos[i++] = y;
      pos[i++] = 4.0 * Math.cos(ix * 1.0) + 4.0 * Math.sin(iy * 1.0);
      uv[j++] = u * TEX_SCALE;
      uv[j++] = v * TEX_SCALE;
    }
  }
  return {position: pos, uv: uv};
}

/**
 * @param xcount X vertex count
 * @param ycount Y vertex count
 */
Terra.createIdBuffer = function(xcount: number, ycount: number) {
  const idSize = (xcount - 1) * (ycount - 1) * 3 * 2;
  let id = null;

  if (idSize <= 65536) {
    id = new Uint16Array(idSize);
  } else {
    id = new Uint32Array(idSize);
  }
  const xc = xcount - 1;
  const yc = ycount - 1;
  let x: number, y: number;
  for (y = 0; y < yc; ++y) {
    for (x = 0; x < xc; ++x) {
      const i = 6 * (y * xc + x)
      // tri 1
      id[i + 0] = (y + 0) * xcount + (x + 0);
      id[i + 1] = (y + 0) * xcount + (x + 1);
      id[i + 2] = (y + 1) * xcount + (x + 1);
      // tri 2
      id[i + 3] = (y + 1) * xcount + (x + 1);
      id[i + 4] = (y + 1) * xcount + (x + 0);
      id[i + 5] = (y + 0) * xcount + (x + 0);
    }
  }
  return id;
}

export { Terra };
