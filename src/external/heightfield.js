/* eslint-disable */

// @flow
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich


import { Vec3 } from './vec';

// /////////////////////////////////////////////////////////
/**
 *  Heightfield
 *
 *  Cartesian layout of quads as 2 tris:
 *  ____
 *  |0/|
 *  |/_|1
 *
 */
interface Heightfield {
  cellSize: number;
  minHeight: number;
  maxHeight: number;
  xCount: number;
  yCount: number;
  xSize: number;
  ySize: number;
  heights: ArrayLike<number>;
  faceNormals: Float32Array;
  vtxNormals: Float32Array;
}

export type IHeightfield = Heightfield;

function pmod(n: number, m: number) {
  return ((n % m + m) % m);
}

/**
 * Create a Heightfield
 * Use either an image OR xCount, yCount and a heights array.
 */
export function create(image: HTMLImageElement, cellSize: number, minHeight: number, maxHeight: number): Heightfield {
  const hf: Heightfield = {
    cellSize,
    minHeight,
    maxHeight,
    xCount: 0, // remaining will be computed later
    yCount: 0,
    xSize: 0,
    ySize: 0,
    heights: new Float32Array(0),
    faceNormals: new Float32Array(0), // packed: [x0, y0, z0, x1, y1, z1]
    vtxNormals: new Float32Array(0),
  };

  genFromImg(image, hf);

  return hf;
}

/**
 * Generate heightfield from bitmap data. Lighter pixel colours are higher.
 */
function genFromImg(
  image: HTMLImageElement, hf: Heightfield,
) {
  let x: number,
    y: number,
    i: number,
    height: number,
    w = image.width,
    h = image.height,
    heightRange = hf.maxHeight - hf.minHeight;

  hf.xCount = w - 1;
  hf.yCount = h - 1;
  hf.xSize = hf.xCount * hf.cellSize;
  hf.ySize = hf.yCount * hf.cellSize;

  // Draw to a canvas so we can get the data
  let canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  let ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, w, h);
  // array of canvas pixel data [r,g,b,a, r,g,b,a, ...]
  let data = ctx.getImageData(0, 0, w, h).data;
  const heights = new Float32Array(w * h);
  for (y = 0; y < h; ++y) {
    for (x = 0; x < w; ++x) {
      // flip vertical because textures are Y+
      i = (x + (h - y - 1) * w) * 4;
      // i = (x + y * w) * 4

      // normalized altitude value (0-1)
      // assume image is grayscale, so we only need 1 color component
      height = data[i] / 255.0;
      // height = (data[i+0] + data[i+1] + data[i+2]) / (255+255+255)

      //  scale & store this altitude
      heights[x + y * w] = hf.minHeight + height * heightRange;
    }
  }
  // Free these resources soon as possible
  data = ctx = canvas = null;

  hf.heights = heights;

  // 2 normals per cell (quad)
  hf.faceNormals = new Float32Array(3 * 2 * hf.xCount * hf.yCount);
  hf.vtxNormals = new Float32Array(3 * (hf.xCount + 1) * (hf.yCount + 1));
  calcFaceNormals(hf);
  calcVertexNormals(hf);
}

/**
 *  Calculate normals.
 *  2 face normals per quad (1 per tri)
 */
function calcFaceNormals(hf: Heightfield) {
  const csz = hf.cellSize,
    xc = hf.xCount,        // tile X & Y counts
    yc = hf.yCount,
    hxc = hf.xCount + 1,     // height X count (1 larger than tile count)
    heights = hf.heights,  // 1 less indirection
    normals = hf.faceNormals,
    v0 = Vec3.create(),
    v1 = Vec3.create(),
    n = Vec3.create();  // used to compute normals
  let i = 0;

  const tStart = Date.now();
  for (let iy = 0; iy < yc; ++iy) {
    for (let ix = 0; ix < xc; ++ix) {
      i = 6 * (ix + iy * xc);
      const ih = ix + iy * hxc;
      const z = heights[ih];

      // 2 vectors of top-left tri
      v0.x = csz;
      v0.y = csz;
      v0.z = heights[ih + hxc + 1] - z;

      v1.x = 0.0;
      v1.y = csz;
      v1.z = heights[ih + hxc] - z;

      Vec3.cross(v0, v1, n);
      Vec3.normalize(n, n);
      normals[i + 0] = n.x;
      normals[i + 1] = n.y;
      normals[i + 2] = n.z;

      // 2 vectors of bottom-right tri
      v0.x = csz;
      v0.y = 0.0;
      v0.z = heights[ih + 1] - z;

      v1.x = csz;
      v1.y = csz;
      v1.z = heights[ih + hxc + 1] - z;

      Vec3.cross(v0, v1, n);
      Vec3.normalize(n, n);
      normals[i + 3] = n.x;
      normals[i + 4] = n.y;
      normals[i + 5] = n.z;
    }
  }
  const dt = Date.now() - tStart;
}

function calcVertexNormals(hf: Heightfield) {
  const vnorms = hf.vtxNormals;
  const w = hf.xCount + 1;
  const h = hf.yCount + 1;
  const n = Vec3.create();
  let i = 0;
  const tStart = Date.now();
  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      computeVertexNormal(hf, x, y, n);
      i = (y * w + x) * 3;
      vnorms[i++] = n.x;
      vnorms[i++] = n.y;
      vnorms[i++] = n.z;
    }
  }
  const dt = Date.now() - tStart;
  console.log(`computed ${w * h} vertex normals in ${dt}ms`);
}

/**
 * Compute a vertex normal by averaging the adjacent face normals.
 */
function computeVertexNormal(hf: Heightfield, vx: number, vy: number, n: Vec3) {
  const fnorms = hf.faceNormals;
  // This vertex is belongs to 4 quads
  // Do the faces this vertex is the 1st point of for this quad.
  // This is the quad up and to the right
  let qx = vx % hf.xCount;
  let qy = vy % hf.yCount;
  let ni = (qy * hf.xCount + qx) * 3 * 2;
  n.x = fnorms[ni + 0];
  n.y = fnorms[ni + 1];
  n.z = fnorms[ni + 2];
  ni += 3;
  n.x += fnorms[ni + 0];
  n.y += fnorms[ni + 1];
  n.z += fnorms[ni + 2];

  // 2nd tri of quad up and to the left
  qx = pmod(qx - 1, hf.xCount);
  ni = (qy * hf.xCount + qx) * 3 * 2 + 3;
  n.x += fnorms[ni + 0];
  n.y += fnorms[ni + 1];
  n.z += fnorms[ni + 2];

  // both tris of quad down and to the left
  qy = pmod(qy - 1, hf.yCount);
  ni = (qy * hf.xCount + qx) * 3 * 2;
  n.x += fnorms[ni + 0];
  n.y += fnorms[ni + 1];
  n.z += fnorms[ni + 2];
  ni += 3;
  n.x += fnorms[ni + 0];
  n.y += fnorms[ni + 1];
  n.z += fnorms[ni + 2];

  // 1st tri of quad down and to the right
  qx = (qx + 1) % hf.xCount;
  ni = (qy * hf.xCount + qx) * 3 * 2;
  n.x += fnorms[ni + 0];
  n.y += fnorms[ni + 1];
  n.z += fnorms[ni + 2];

  // Normalize to 'average' the result normal
  Vec3.normalize(n, n);
}

/**
 *  Given a plane with normal n and z=z0 at (x=0,y=0) find z at x,y.
 *  @param n Normal vector of the plane.
 *  @param z0 Height (z) coordinate of the plane at x=0,y=0.
 *  @param x X coordinate to find height (z) at.
 *  @param y Y coordinate to find height (z) at.
 */
export function getPlaneZ(n: Vec3, z0: number, x: number, y: number) {
  return z0 - (n.x * x + n.y * y) / n.z;
}


/* eslint-enable */
