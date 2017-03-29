# WeatherGL

WeatherGL is a React project which requires a javascript development requirement.

Screenshots due tomorrow.

### Requirements:
 - https://nodejs.org/en/download/
   - Node.js 6.10 or higher.
   - npm 3.10.10 or higher.

### Attributions:
 - See ATTRIBUTIONS.md

### Objectives:

1. The WeatherGL scene is correctly modeled with no visual artifacts or distortion.
2. Models rendered in the WeatherGL scene are texture mapped.
3. Rough surfaces in the scene (e.g. dirt) are bump mapped.
4. An easy to use User Interface to change between the various weather options, and to interact with the environment.
5. Synced sound effects which provide immersion into WeatherGLs landscape.
6. A skybox with no visual artifacts or distortion.
7. Lens flare for weather parameters which contain the sun. The lens flare should have no artifacts or distortion.
8. Shadows using shadow mapping for weather parameters that contain the sun.
9. Static Collision Detection to enable an immersive environment (e.g. bumping into things when walking around).
10. Visual snow and rain effects using particle systems and/or other graphic techniques.


## Reading

### Conventions:
 - 1 unit == 1 meter
 - Sandbox view == 1.2km^2
 - Foreground == 1 km^2, height == 2m max
 - Background == 4 * 0.2km*1.2km, height == 100m
 - <!-- Fog outside Sandbox? -->

### Reading:
 - (Bump mapping) http://mmikkelsen3d.blogspot.ca/2011/07/derivative-maps.html
   - https://threejs.org/docs/?q=TextureLoader#Reference/Loaders/TextureLoader
 - http://vterrain.org/Water/
 - https://github.com/ashima/webgl-noise
 - http://vterrain.org/Elevation/global.html
 - http://srchea.com/terrain-generation-the-diamond-square-algorithm-and-three-js

### Lighting:
 - https://threejs.org/docs/api/lights/AmbientLight.html
 - https://threejs.org/docs/api/lights/DirectionalLight.html
 - http://learningthreejs.com/blog/2012/01/20/casting-shadows/
 - http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-16-shadow-mapping/
 - https://github.com/mrdoob/three.js/issues/6420

### Terrain:
 - Inspiration: https://github.com/spacejack/terra/
 - Terrain mesh moves with the camera, loaded from the heightmap
 - Use sampler2D to store terrain.
    - https://threejs.org/docs/api/core/BufferGeometry.html
    - https://threejs.org/docs/api/materials/RawShaderMaterial.html
    - Bump mapping: http://fabiensanglard.net/bumpMapping/index.php

### Misc:
- Car: http://www.blendswap.com/blends/view/76077
  - cc-by commons
  - https://github.com/mrdoob/three.js/issues/8677
- Generate terrain ()
  Ex:
   - https://github.com/IceCreamYou/THREE.Terrain
   - https://github.com/srchea/Terrain-Generation
   - https://github.com/maurizzzio/Three.js-City

## Skybox:
 - http://www.custommapmakers.org/skyboxes.php
 - Use CubeTextureLoader.
 - Source: https://reije081.home.xs4all.nl/skyboxes/

## Particle Systems (Inspiration)
 - https://stemkoski.github.io/Three.js/Particle-Engine.html
 - https://aerotwist.com/tutorials/creating-particles-with-three-js/
 - https://threejs.org/docs/?q=Point#Reference/Materials/PointsMaterial
  - Kinda related for starry night: https://threejs.org/docs/?q=Point#Reference/Lights/PointLight
 - https://solusipse.net/varia/threejs-examples/realistic-rain/
 - https://threejs.org/examples/webgl_nearestneighbour.html

## Lens Flare
 - https://github.com/timoxley/threejs/blob/master/examples/webgl_lensflares.html
 - https://threejs.org/docs/?q=LensFlare#Reference/Objects/LensFlare

- Foreground has detailed terrain generation (likely fixed heightmap)
- Mountainous Background is generated

## Sidebar:
 - http://balloob.github.io/react-sidebar/example/

## Sound
 - https://github.com/goldfire/howler.js
   - https://www.freesound.org/people/rhodesmas/sounds/321723/
