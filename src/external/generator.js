/* eslint-disable */

// From https://github.com/IceCreamYou/THREE.Terrain/blob/gh-pages/src/generators.js
// Copyright (C) 2010-2014 Isaac Sukin under the The MIT License

import { Math as ThreeMath } from 'three';

const Terrain = {};

Terrain.DiamondSquare = function (g, options) {
    // Set the segment length to the smallest power of 2 that is greater than
    // the number of vertices in either dimension of the plane
  const segments = ThreeMath.nextPowerOfTwo(Math.max(options.xSegments, options.ySegments) + 1);

    // Initialize heightmap
  let size = segments + 1,
    heightmap = [],
    smoothing = (options.maxHeight - options.minHeight),
    i,
    j,
    xl = options.xSegments + 1,
    yl = options.ySegments + 1;
  for (i = 0; i <= segments; i++) {
    heightmap[i] = new Float64Array(segments + 1);
  }

    // Generate heightmap
  for (let l = segments; l >= 2; l /= 2) {
    var half = Math.round(l * 0.5),
      whole = Math.round(l),
      x,
      y,
      avg,
      d,
      e;
    smoothing /= 2;
      // square
    for (x = 0; x < segments; x += whole) {
      for (y = 0; y < segments; y += whole) {
        d = Math.random() * smoothing * 2 - smoothing;
        avg = heightmap[x][y] +            // top left
                heightmap[x + whole][y] +      // top right
                heightmap[x][y + whole] +      // bottom left
                heightmap[x + whole][y + whole]; // bottom right
        avg *= 0.25;
        heightmap[x + half][y + half] = avg + d;
      }
    }
      // diamond
    for (x = 0; x < segments; x += half) {
      for (y = (x + half) % l; y < segments; y += l) {
        d = Math.random() * smoothing * 2 - smoothing;
        avg = heightmap[(x - half + size) % size][y] + // middle left
                heightmap[(x + half) % size][y] +      // middle right
                heightmap[x][(y + half) % size] +      // middle top
                heightmap[x][(y - half + size) % size];  // middle bottom
        avg *= 0.25;
        avg += d;
        heightmap[x][y] = avg;
          // top and right edges
        if (x === 0) heightmap[segments][y] = avg;
        if (y === 0) heightmap[x][segments] = avg;
      }
    }
  }

    // Apply heightmap
  for (i = 0; i < xl; i++) {
    for (j = 0; j < yl; j++) {
      g[j * xl + i].z += heightmap[i][j];
    }
  }
};

Terrain.EaseInOut = function(x) {
    return x*x*(3-2*x);
};

Terrain.Linear = function(x) {
    return x;
};

Terrain.Clamp = function(g, options) {
    var min = Infinity,
        max = -Infinity,
        l = g.length,
        i;
    options.easing = options.easing || Terrain.Linear;
    for (i = 0; i < l; i++) {
        if (g[i].z < min) min = g[i].z;
        if (g[i].z > max) max = g[i].z;
    }
    var actualRange = max - min,
        optMax = typeof options.maxHeight !== 'number' ? max : options.maxHeight,
        optMin = typeof options.minHeight !== 'number' ? min : options.minHeight,
        targetMax = options.stretch ? optMax : (max < optMax ? max : optMax),
        targetMin = options.stretch ? optMin : (min > optMin ? min : optMin),
        range = targetMax - targetMin;
    if (targetMax < targetMin) {
        targetMax = optMax;
        range = targetMax - targetMin;
    }
    for (i = 0; i < l; i++) {
        g[i].z = options.easing((g[i].z - min) / actualRange) * range + optMin;
    }
};

Terrain.Normalize = function(mesh, options) {
    var v = mesh.geometry.vertices;
    // Keep the terrain within the allotted height range if necessary, and do easing.
    Terrain.Clamp(v, options);
    // Call the "after" callback
    if (typeof options.after === 'function') {
        options.after(v, options);
    }
    // Mark the geometry as having changed and needing updates.
    mesh.geometry.verticesNeedUpdate = true;
    mesh.geometry.normalsNeedUpdate = true;
    mesh.geometry.computeBoundingSphere();
    mesh.geometry.computeFaceNormals();
    mesh.geometry.computeVertexNormals();
};

export { Terrain };
