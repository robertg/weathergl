// Vector Math with library-agnostic interface types.
// i.e. Any object with matching property names will work,
// whether three.js, cannon.js, etc.
//
// LICENSE: MIT
// Copyright (c) 2016 by Mike Linkovich

// /** 3D Vector type */
// interface Vec3 {
//   x: number;
//   y: number;
//   z: number;
// }

// export type IVec3 = Vec3;

// /**
//  * 3D Vector functions
//  */

let Vec3 = {};


Vec3.create = function(x?: number, y?: number, z?: number) {
  return {
    x: (typeof x === 'number') ? x : 0.0,
    y: (typeof y === 'number') ? y : 0.0,
    z: (typeof z === 'number') ? z : 0.0
  }
}

Vec3.clone = function(v: Vec3) {
  return Vec3.create(v.x, v.y, v.z)
}

Vec3.set = function(v: Vec3, x: number, y: number, z: number) {
  v.x = x; v.y = y; v.z = z
}

Vec3.copy = function(src: Vec3, out: Vec3) {
  out.x = src.x
  out.y = src.y
  out.z = src.z
}

Vec3.length = function(v: Vec3) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

Vec3.setLength = function(v: Vec3, l: number, out: Vec3) {
  let s = Vec3.length(v)
  if (s > 0.0) {
    s = l / s
    out.x = v.x * s
    out.y = v.y * s
    out.z = v.z * s
  } else {
    out.x = l
    out.y = 0.0
    out.z = 0.0
  }
}

Vec3.dist = function(v0: Vec3, v1: Vec3) {
  const dx = v1.x - v0.x
  const dy = v1.y - v0.y
  const dz = v1.z - v0.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

Vec3.normalize = function(v: Vec3, out: Vec3) {
  Vec3.setLength(v, 1.0, out)
}

Vec3.dot = function(a: Vec3, b: Vec3) {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

Vec3.cross = function(a: Vec3, b: Vec3, out: Vec3) {
  const ax = a.x, ay = a.y, az = a.z,
  bx = b.x, by = b.y, bz = b.z
  out.x = ay * bz - az * by
  out.y = az * bx - ax * bz
  out.z = ax * by - ay * bx
}

Vec3.toArray = function (v: Vec3) {
  return [v.x, v.y, v.z]
}

export { Vec3 };
