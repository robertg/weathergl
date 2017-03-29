// @flow

import React, { Component } from 'react';
import { WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, BoxGeometry, MeshBasicMaterial,
  MeshLambertMaterial, Mesh, BufferGeometry, RawShaderMaterial, TextureLoader, RepeatWrapping,
  BufferAttribute, PointLight, ShaderMaterial, UniformsUtils, UniformsLib, HemisphereLight,
  AmbientLight, DirectionalLight, VertexNormalsHelper, DirectionalLightHelper, Object3D, Color,
  CubeTextureLoader, Vector3, AxisHelper, CameraHelper, PCFSoftShadowMap, Vector4,
  Fog, LensFlare, AdditiveBlending, Points, ObjectLoader, Clock } from 'three';
import Toggle from 'react-toggle';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import Stats from 'stats.js';
import TrackballControls from 'three-trackballcontrols';
import { scaleRotate as Menu } from 'react-burger-menu';
import { Howl } from 'howler';
import Slider, { Range } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import 'rc-slider/assets/index.css';
import { Terrain } from './external/generator';
import { Terra } from './external/terra';
import { OrbitControls } from './external/orbitcontrols';
import * as heightfield from './external/heightfield';
import { PointerLockControls } from './external/pointerlockcontrols';

import './App.css';

/* eslint-disable */
import ground_vert from '!!raw!./shader/ground.vert.glsl';
import ground_frag from '!!raw!./shader/ground.frag.glsl';
import particle_vert from '!!raw!./shader/particle.vert.glsl';
import particle_frag from '!!raw!./shader/particle.frag.glsl';
/* eslint-enable */

class App extends Component {
  scene:Scene;
  camera:PerspectiveCamera;
  renderer:WebGLRenderer;
  resize:Function;
  initScene:Function;
  renderFrame:Function;
  node:Object;
  foregroundSurface:Mesh;
  cube:Mesh;

  constructor() {
    super();

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, document.body.clientWidth / document.body.clientHeight, 0.1, 2000);
    this.camera.name = 'camera';
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(document.body.clientWidth, document.body.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.gammaInput = true;
    this.renderer.gammaOutput = true;


    this.resize = this.resize.bind(this);
    this.initScene = this.initScene.bind(this);
    this.renderFrame = this.renderFrame.bind(this);

    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.style.left = null;
    this.stats.dom.style.right = 0;
    this.stats.dom.style.visibility = 'hidden'; // or "visible"
    document.body.appendChild(this.stats.dom);

    this.state = {
      debug: false,
      weatherOptions: [
        { value: 1, label: 'Clear Weather', clearableValue: false },
        { value: 2, label: 'Rainy Weather', clearableValue: false },
        { value: 3, label: 'Snowy Weather', clearableValue: false },
      ],
      modeOptions: [
        { value: 4, label: 'Shadow Demo', clearableValue: false },
        { value: 5, label: 'House Demo', clearableValue: false },
      ],
    };

    this.state.selectedWeather = this.state.weatherOptions[0];
    this.state.selectedMode = this.state.modeOptions[1];
  }

  componentDidMount() {
    this.node.appendChild(this.renderer.domElement);
    window.addEventListener('resize', this.resize);

    const self = this;

    // Skybox from https://reije081.home.xs4all.nl/skyboxes/
    new CubeTextureLoader().load([
      'skybox45/skyrender0002.bmp',
      'skybox45/skyrender0005.bmp',
      'skybox45/skyrender0004.bmp',
      'skybox45/skyrender0001.bmp',
      'skybox45/skyrender0003.bmp',
      'skybox45/skyrender0003.bmp',
    ], (skybox) => {
      // House from: https://clara.io/view/d5ae6d8e-a942-4067-b966-8802a1b42a9c#
      new ObjectLoader().load('house/house.json', (house) => {
        // Loading inspired by: http://stackoverflow.com/a/39136667
        const assets = [
                // ground_hmap generated with http://cpetry.github.io/TextureGenerator-Online/
                { name: 'ground_hmap', url: 'heightmap2.png' },
                // Grass texture from http://trutextures.blogspot.ca/2013/01/free-seamless-tiling-dead-grass-terrain.html
                { name: 'grass_texture', url: 'grass/texture.jpg' },
                { name: 'grass_bumpmap', url: 'grass/normal.jpg' },
                // // Rock texture from http://www.virtual-lands-3d.com/textures.htm
                { name: 'rock_texture', url: 'rock2/texture.jpg' },
                { name: 'rock_bumpmap', url: 'rock2/normal.jpg' },
                { name: 'lensflare0', url: 'lensflare/lensflare0.png' },
                // Rain textures from: https://solusipse.net/varia/threejs-examples/realistic-rain/
                { name: 'rain1', url: 'rain/rain1.png' },
                { name: 'rain2', url: 'rain/rain2.png' },
                { name: 'rain3', url: 'rain/rain3.png' },
                { name: 'rain4', url: 'rain/rain4.png' },
                { name: 'rain5', url: 'rain/rain5.png' },
                // Snow textures from: http://oos.moxiecode.com/js_webgl/snowfall/
                { name: 'snow1', url: 'snow/snowflake1.png' },
        ];

        const textures = {};

        for (const img of assets) {
          new TextureLoader().load(img.url, (texture) => {
            textures[img.name] = texture;
            assets.splice(assets.indexOf(img), 1);
            console.log('[TextureLoader] Loaded %o', img.name);
            if (!assets.length) {
              self.initScene(
                    textures.ground_hmap, skybox, textures.grass_texture,
                    textures.grass_bumpmap, textures.rock_texture, textures.rock_bumpmap,
                    textures.lensflare0,
                    [textures.rain1, textures.rain2, textures.rain3, textures.rain4, textures.rain5],
                    [textures.snow1],
                    house,
                  );
              self.renderFrame();
            }
          });
        }
      });
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
  }

  resize() {
    this.camera.aspect = document.body.clientWidth / document.body.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(document.body.clientWidth, document.body.clientHeight);

    if (this.state.selectedMode.value === 4) { // Check if shadow demo is enabled.
      this.controls.handleResize();
    }

    if (this.houseControls) {
      // this.houseControls.handleResize();
    }
  }

  initScene(ground_hmap, skybox, grass_texture, grass_bumpmap,
    rock_texture, rock_bumpmap, lensflare0, rain_textures, snow_textures, house) {
    const fast_debug = false;

    this.scene.add(this.camera);


    // Setup ground:
    // Only works on power of 2 heightmaps!
    // ground_hmap generated with http://cpetry.github.io/TextureGenerator-Online/
    ground_hmap.wrapS = RepeatWrapping;
    ground_hmap.wrapT = RepeatWrapping;
    grass_texture.wrapS = RepeatWrapping;
    grass_texture.wrapT = RepeatWrapping;
    grass_bumpmap.wrapS = RepeatWrapping;
    grass_bumpmap.wrapT = RepeatWrapping;
    rock_texture.wrapS = RepeatWrapping;
    rock_texture.wrapT = RepeatWrapping;
    rock_bumpmap.wrapS = RepeatWrapping;
    rock_bumpmap.wrapT = RepeatWrapping;

    // grass_texture.anisotropy = 16;
    // rock_texture.anisotropy = 16;
    // grass_bumpmap.anisotropy = 16;
    // rock_bumpmap.anisotropy = 16;

    const ground_geo = new BufferGeometry();
    // Bump Map GPU tearing occurs as a function of groundHmapSize and xCellCount.
    const groundHmapSize = 1000;

    // const xCellCount = 2048; // Math.floor(Math.sqrt(262144 / (3 * 2)))
    // const yCellCount = 2048;
    const cellSize = groundHmapSize / ground_hmap.image.width;

    if (!fast_debug) {
      const maxHeight = 40;
      const hf = heightfield.create(ground_hmap.image, cellSize, 0, maxHeight);
      console.log(hf);

      // Construct a terrain mesh just like spacejack/terra:
      const vtxBufs = Terra.createVtxBuffers(cellSize, hf.xCount + 1, hf.yCount + 1);
      const idBuf = Terra.createIdBuffer(hf.xCount + 1, hf.yCount + 1);
      ground_geo.addAttribute('position', new BufferAttribute(vtxBufs.position, 3));
      ground_geo.addAttribute('uv', new BufferAttribute(vtxBufs.uv, 2));
      ground_geo.setIndex(new BufferAttribute(idBuf, 1));

      // https://github.com/mrdoob/three.js/wiki/Uniforms-types
      // Add constants required for shaders
      const uniforms = UniformsUtils.merge([
        UniformsLib.lights, {
          hmap: { type: 't', value: null },
          grass_texture: { type: 't', value: null },
          grass_bumpmap: { type: 't', value: null },
          rock_texture: { type: 't', value: null },
          rock_bumpmap: { type: 't', value: null },
          offsetRepeat: { value: new Vector4(0, 0, 1, 1) },
          gameCameraPosition: { value: new Vector3(0, 0, 1) },
          max_height: { type: 'f', value: maxHeight },
          hmap_scale: { type: '3f', value: [1.0 / groundHmapSize, 1.0 / groundHmapSize, maxHeight] },
        }]);

      // Assign textures here (cause UniformsUtils.merge calls clone())
      uniforms.hmap.value = ground_hmap;
      uniforms.grass_texture.value = grass_texture;
      uniforms.grass_bumpmap.value = grass_bumpmap;
      uniforms.rock_texture.value = rock_texture;
      uniforms.rock_bumpmap.value = rock_bumpmap;

      const ground_mat = new ShaderMaterial({
        uniforms,
        vertexShader: ground_vert,
        fragmentShader: ground_frag,
        lights: true,
      });

      ground_mat.extensions.derivatives = true;

      this.ground_mesh = new Mesh(ground_geo, ground_mat);
      this.ground_mesh.receiveShadow = true;
      this.ground_mesh.castShadow = true;

      this.ground_mesh.geometry.computeFaceNormals();
      this.ground_mesh.geometry.computeVertexNormals();
      console.log(this.ground_mesh.geometry);

      // TODO: If this is slow then cache this, maybe load it from JSON? Or localstorage?
      this.ground_mesh.geometry.attributes.normal.array = hf.vtxNormals;

      this.ground_mesh.uvsNeedUpdate = true;

      console.log(this.ground_mesh.geometry);

      // this.ground_mesh.rotation.x = -0.5 * Math.PI;

      // this.ground_mesh.receiveShadow = true;
      // this.ground_mesh.castShadow = true;
      this.scene.add(this.ground_mesh);
    }

    // http://blog.cjgammon.com/threejs-lights-cameras
    // this.hemisphere_light = new HemisphereLight( 0xffffbb, 0x080820, 1 );
    // this.scene.add( this.hemisphere_light );

    this.ambientlight = new AmbientLight(0xffffbb, 0.20);
    this.scene.add(this.ambientlight);

    this.sunlight = new DirectionalLight(0xffffbb, 0.85);
    // this.sunlight.position.set(0,0, 10000);
    this.sunlight.position.set(-100, -100, 1000);
    // this.sunlight.position.set(0, 0, 100);
    this.sunlight.target.position.set(0, 0, 50);
    this.sunlight.castShadow = true;
    this.sunlight.shadow.mapSize.width = 4096;
    this.sunlight.shadow.mapSize.height = 4096;
    this.sunlight.shadow.camera.near = 2;       // default 0.5
    this.sunlight.shadow.camera.far = 2000;      // default 500

    // this.sunlight.shadowCameraVisible = true;
    // this.sunlight.shadowMap.dispose();
    // this.sunlight.shadowMap = null;

    const target = new Object3D();
    target.position.set(0, 0, 0);
    // this.sunlight.target = target;
    // this.sunlight.target = this.camera;
    this.scene.add(this.sunlight);
    // this.scene.add(this.sunlight.target);

    // Load Cube Map (source: https://reije081.home.xs4all.nl/skyboxes/ )
    this.scene.background = skybox;


    // Add fog
    this.scene.fog = new Fog(0xffffff, 50, 1000);

    // Add lens flare: (Inspired by https://github.com/timoxley/threejs/blob/master/examples/webgl_lensflares.html)
    // TODO: If world position is always (0,0,0), this solution is okay. Otherwise position needs to be computed for a 45 deg angle.
    this.lensflare = new LensFlare(lensflare0, 300, 0.0, AdditiveBlending, new Color(0xffffbb));
    this.lensflare.position.copy(new Vector3(-600, -600, 1000));

    this.scene.add(this.lensflare);

    // Set up weather
    this.rain_textures = rain_textures;
    this.snow_textures = snow_textures;

    this.initClear();
    this.initRain(this.rain_textures);
    this.initSnow(this.snow_textures);

    // Set up sound

    // https://www.freesound.org/people/rhodesmas/sounds/321723/
    // Ambient background sound should always play
    this.backgroundSound = new Howl({
      src: ['sound/background.wav'],
      loop: true,
      volume: 0,
    });
    this.backgroundSoundId = this.backgroundSound.play();
    // Start playing it
    this.backgroundSound.fade(0, 1, 1000);

    this.rainSound = new Howl({
      src: ['sound/rain.wav'],
      loop: true,
      volume: 0,
    });
    this.rainSound.play();

    this.snowSound = new Howl({
      src: ['sound/snow.wav'],
      loop: true,
      volume: 0,
    });
    this.snowSound.play();

    // Add house to the scene.
    this.house = house;
    this.house.scale.set(10, 10, 10);
    this.house.rotateY(Math.PI / 2.0);
    this.house.rotateZ(Math.PI / 2.0);
    this.house.rotateY(Math.PI / 2.0 + Math.PI / 4.0);
    this.house.position.set(400, 400, 18.5);

    this.scene.add(this.house);

    this.initShadowDemo();
    this.initHouseDemo();

    // DEBUG:
    // this.scene.add(new VertexNormalsHelper(this.ground_mesh, 2, 0x00ff00, 1));
    // this.scene.add(new DirectionalLightHelper(this.sunlight, 5));
    // this.scene.add(new CameraHelper(this.sunlight.shadow.camera));
    this.scene.add(new AxisHelper(100));

    // Tell React that we loaded weathergl
    this.setState(this.state);
  }

  removeShadowDemo() {
    if (this.cube) {
      this.scene.remove(this.cube);
      this.cube = null;
      this.controls.dispose();
      this.controls = null;
    }
  }

  initShadowDemo() {
    if (this.state.selectedMode.value !== 4) { // Check if shadow demo is enabled.
      return;
    }

    this.camera.position.set(100, 0, 100);
    this.camera.up.set(0, 0, 1);
    this.controls = new OrbitControls(this.camera);
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
    this.controls.keys = [65, 83, 68];
    this.controls.target = new Vector3(0, 0, 0);
    this.controls.update();


    const geometry = new BoxGeometry(10, 10, 10);
    const material = new MeshLambertMaterial({ color: 0xffffff });
    this.cube = new Mesh(geometry, material);
    this.cube.receiveShadow = true;
    this.cube.castShadow = true;
    this.cube.position.z += 25;
    this.cube.name = 'shadow_cube';
    this.scene.add(this.cube);
  }

  updateShadowDemo() {
    if (this.state.selectedMode.value !== 4) { // Check if shadow demo is enabled.
      return;
    }

    if (!this.cube) {
      return;
    }

    this.cube.rotation.x += 0.005;
    this.cube.rotation.y += 0.005;

    this.controls.update();

    this.ground_mesh.material.uniforms.gameCameraPosition.value = this.camera.position;
    this.ground_mesh.material.uniforms.gameCameraPosition.needsUpdate = true;
  }

  removeHouseDemo() {
    if (this.houseControls) {
      this.scene.remove(this.houseControls.getObject());
      this.houseControls.dispose();
      this.houseControls = null;
      this.clock = null;

      document.removeEventListener('keydown', this.onKeyDown);
      document.removeEventListener('keyup', this.onKeyUp);
      document.removeEventListener('pointerlockchange', this.pointerLockChange);
      document.removeEventListener('mozpointerlockchange', this.pointerLockChange);
      document.removeEventListener('webkitpointerlockchange', this.pointerLockChange);

      document.exitPointerLock = document.exitPointerLock ||
         document.mozExitPointerLock ||
         document.webkitExitPointerLock;
      document.exitPointerLock();
    }
  }

  // //
  // First Person controls for initHouseDemo and updateHouseDemo
  // are influenced by https://github.com/mrdoob/three.js/blob/dev/examples/misc_controls_pointerlock.html
  // //
  initHouseDemo() {
    if (this.state.selectedMode.value !== 5) { // Check if house demo is enabled.
      return;
    }

    this.clock = new Clock();


    // this.camera.up.set(0, 0, 1);

    this.houseControls = new PointerLockControls(this.camera);
    this.houseControls.getObject().name = 'house_controls_object';
    this.scene.add(this.houseControls.getObject());

    this.houseControls.getObject().position.set(400, 400, 20);

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.prevTime = performance.now();
    this.velocity = new Vector3();

    this.controlsEnabled = false;
    this.pointerLockChange = (event) => {
      const element = document.body;
      if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
        this.controlsEnabled = true;
        this.houseControls.enabled = true;
        this.velocity = new Vector3();
      } else {
        this.controlsEnabled = false;
        this.houseControls.enabled = false;
        this.velocity = new Vector3();
      }
    };

    document.addEventListener('pointerlockchange', this.pointerLockChange, false);
    document.addEventListener('mozpointerlockchange', this.pointerLockChange, false);
    document.addEventListener('webkitpointerlockchange', this.pointerLockChange, false);

    document.body.requestPointerLock = document.body.requestPointerLock ||
           document.body.mozRequestPointerLock ||
           document.body.webkitRequestPointerLock;
    // Ask the browser to lock the pointer


    this.onKeyDown = (event) => {
      switch (event.keyCode) {
        case 38: // up
        case 87: // w
          this.moveForward = true;
          break;
        case 37: // left
        case 65: // a
          this.moveLeft = true;
          break;
        case 40: // down
        case 83: // s
          this.moveBackward = true;
          break;
        case 39: // right
        case 68: // d
          this.moveRight = true;
          break;
      }
    };

    this.onKeyUp = (event) => {
      switch (event.keyCode) {
        case 38: // up
        case 87: // w
          this.moveForward = false;
          break;
        case 37: // left
        case 65: // a
          this.moveLeft = false;
          break;
        case 40: // down
        case 83: // s
          this.moveBackward = false;
          break;
        case 39: // right
        case 68: // d
          this.moveRight = false;
          break;
      }
    };

    this.pointerLockChange = (event) => {

    };

    document.addEventListener('keydown', this.onKeyDown, false);
    document.addEventListener('keyup', this.onKeyUp, false);


    // this.houseControls.update(this.clock.getDelta());
    // this.houseControls.activeLook = false;
    // this.houseControls.movementSpeed = 1;
    // this.houseControls.lookSpeed = 0.1;
    // this.houseControls.activeLook = true;
    // this.houseControls.lookVertical = true;
  }

  updateHouseDemo() {
    if (this.state.selectedMode.value !== 5) { // Check if house demo is enabled.
      return;
    }

    if (!this.houseControls) {
      return;
    }

    if (this.controlsEnabled) {
      // raycaster.ray.origin.copy( controls.getObject().position );
      // raycaster.ray.origin.y -= 10;
      // var intersections = raycaster.intersectObjects( objects );
      // var isOnObject = intersections.length > 0;
      const time = performance.now();
      const delta = (time - this.prevTime) / 1000;
      this.velocity.x -= this.velocity.x * 10.0 * delta;
      this.velocity.y -= this.velocity.y * 10.0 * delta;
      if (this.moveForward) {
        this.velocity.y += 20.0 * delta;
      }
      if (this.moveBackward) {
        this.velocity.y -= 20.0 * delta;
      }
      if (this.moveLeft) {
        this.velocity.x -= 20.0 * delta;
      }
      if (this.moveRight) {
        this.velocity.x += 20.0 * delta;
      }
      this.houseControls.getObject().translateX(this.velocity.x * delta);
      this.houseControls.getObject().translateY(this.velocity.y * delta);
      this.prevTime = time;
    }

    this.ground_mesh.material.uniforms.gameCameraPosition.value = this.houseControls.getObject().position;
    this.ground_mesh.material.uniforms.gameCameraPosition.needsUpdate = true;
  }

  initClear() {
    if (this.state.selectedWeather.value !== 1) { // Check if clear weather is enabled.

    }
  }

  initRain(rain_textures) {
    if (this.state.selectedWeather.value !== 2) { // Check if rainy weather is enabled.
      return;
    }

    // Inspired by: https://github.com/mrdoob/three.js/blob/dev/examples/webgl_nearestneighbour.html
    for (const tex of rain_textures) {
      tex.flipY = false;
    }

    const pointShaderMaterial = new ShaderMaterial({
      uniforms: {
        tex: { value: rain_textures[0] },
        size: { value: 4.0 },
        rain: { value: true },
      },
      vertexShader: particle_vert,
      fragmentShader: particle_frag,
      transparent: true,
      blending: AdditiveBlending,
    });

    this.amountOfParticles = 250000;
    this.rainParticlePositions = new Float32Array(this.amountOfParticles * 3);
    const alphas = new Float32Array(this.amountOfParticles);
    const particleGeom = new BufferGeometry();
    particleGeom.addAttribute('position', new BufferAttribute(this.rainParticlePositions, 3));

    this.rainParticles = new Points(particleGeom, pointShaderMaterial);
    this.rainParticles.name = 'rainParticles';
    for (let x = 0; x < this.amountOfParticles; x++) {
      this.rainParticlePositions[x * 3 + 0] = Math.random() * 1000 - Math.random() * 1000;
      this.rainParticlePositions[x * 3 + 1] = Math.random() * 1000 - Math.random() * 1000;
      this.rainParticlePositions[x * 3 + 2] = Math.random() * 1000;
    }

    this.scene.add(this.rainParticles);

    // Add rain background sound
    this.rainSound.fade(0, 1, 1000);
  }

  removeRain() {
    if (this.rainParticles) {
      this.scene.remove(this.rainParticles);
      this.rainParticles = null;

      // Fade out rain background sound
      this.rainSound.fade(1, 0, 1000);
    }
  }

  initSnow(snow_textures) {
    if (this.state.selectedWeather.value !== 3) { // Check if snowy weather is enabled.
      return;
    }

    // Inspired by: https://github.com/mrdoob/three.js/blob/dev/examples/webgl_nearestneighbour.html
    for (const tex of snow_textures) {
      tex.flipY = false;
    }

    const pointShaderMaterial = new ShaderMaterial({
      uniforms: {
        tex: { value: snow_textures[0] },
        size: { value: 2.0 },
        rain: { value: false },
      },
      vertexShader: particle_vert,
      fragmentShader: particle_frag,
      transparent: true,
      blending: AdditiveBlending,
    });

    this.amountOfParticles = 50000;
    this.snowParticlePositions = new Float32Array(this.amountOfParticles * 3);
    const alphas = new Float32Array(this.amountOfParticles);
    const particleGeom = new BufferGeometry();
    particleGeom.addAttribute('position', new BufferAttribute(this.snowParticlePositions, 3));

    this.snowParticles = new Points(particleGeom, pointShaderMaterial);
    this.snowParticles.name = 'snowParticles';
    for (let x = 0; x < this.amountOfParticles; x++) {
      this.snowParticlePositions[x * 3 + 0] = Math.random() * 1000 - Math.random() * 1000;
      this.snowParticlePositions[x * 3 + 1] = Math.random() * 1000 - Math.random() * 1000;
      this.snowParticlePositions[x * 3 + 2] = Math.random() * 1000;
    }

    this.scene.add(this.snowParticles);

    // Add snow background sound
    this.snowSound.fade(0, 1, 1000);
  }

  removeSnow() {
    if (this.snowParticles) {
      this.scene.remove(this.snowParticles);
      this.snowParticles = null;

      // Fade out snow background sound
      this.snowSound.fade(1, 0, 1000);
    }
  }

  animateRain() {
    if (this.state.selectedWeather.value !== 2) { // Check if rainy weather is enabled.
      return;
    }

    if (!this.rainParticles) {
      return;
    }

    for (let x = 0; x < this.amountOfParticles; x++) {
      this.rainParticlePositions[x * 3 + 0] = Math.random() * 1000 - Math.random() * 1000;
      this.rainParticlePositions[x * 3 + 1] = Math.random() * 1000 - Math.random() * 1000;
      this.rainParticlePositions[x * 3 + 2] = Math.random() * 1000;
    }

    this.rainParticles.geometry.attributes.position.needsUpdate = true;
  }

  animateSnow() {
    if (this.state.selectedWeather.value !== 3) { // Check if snowy weather is enabled.
      return;
    }

    if (!this.snowParticles) {
      return;
    }

    for (let x = 0; x < this.amountOfParticles; x++) {
      this.snowParticlePositions[x * 3 + 0] += Math.sin(this.snowParticlePositions[x * 3 + 2]) / 20.0;
      this.snowParticlePositions[x * 3 + 1] += Math.sin(this.snowParticlePositions[x * 3 + 2]) / 20.0;
      this.snowParticlePositions[x * 3 + 2] -= (Math.abs(Math.sin(this.snowParticlePositions[x * 3 + 2]))
                                             + Math.abs(Math.cos(this.snowParticlePositions[x * 3 + 2]))) / 2.0;

      if (this.snowParticlePositions[x * 3 + 2] < 0) {
        // Reset position
        this.snowParticlePositions[x * 3 + 2] = 1000 + Math.random() * 50;
      }
    }

    this.snowParticles.geometry.attributes.position.needsUpdate = true;
  }

  renderFrame() {
    requestAnimationFrame(this.renderFrame);

    if (this.state.debug) {
      this.stats.begin();
    }

    this.updateShadowDemo();
    this.updateHouseDemo();

    this.animateRain();
    this.animateSnow();


    this.renderer.render(this.scene, this.camera);


    if (this.state.debug) {
      this.stats.end();
    }
  }

  handleDebugChange(e) {
    this.state.debug = e.target.checked;
    if (this.state.debug) {
      this.stats.dom.style.visibility = 'visible';
    } else {
      this.stats.dom.style.visibility = 'hidden';
    }
  }

  handleWeatherOptionsChange(selected) {
    this.setState({ selectedWeather: selected });
    this.state.selectedWeather = selected; // We need to use it right now

    this.removeRain();
    this.removeSnow();
    this.initClear();
    this.initRain(this.rain_textures);
    this.initSnow(this.snow_textures);
  }

  handleModeOptionsChange(selected) {
    this.setState({ selectedMode: selected });
    this.state.selectedMode = selected; // We need to use it right now

    this.scene.remove(this.camera);
    this.camera = new PerspectiveCamera(75, document.body.clientWidth / document.body.clientHeight, 0.1, 2000);
    this.camera.name = 'camera';

    this.removeShadowDemo();
    this.removeHouseDemo();
    this.initShadowDemo();
    this.initHouseDemo();
  }

  handleSunlightChange(light) {
    this.sunlight.intensity = light / 100.0;
    // Since sunlight is a property on DirectionalLight:
    this.setState(this.state);
  }

  handleCanvasClick() {
    if (this.state.selectedMode.value !== 5) { // Check if house demo is enabled.
      return;
    }

    if (!this.controlsEnabled) {
      document.body.requestPointerLock();
    }
  }

  render() {
    // handle: http://react-component.github.io/slider/examples/handle.html
    const createSliderWithTooltip = Slider.createSliderWithTooltip;
    const Range = createSliderWithTooltip(Slider.Range);
    const Handle = Slider.Handle;
    const handle = (props) => {
      const { value, dragging, index, ...restProps } = props;
      return (
        <Tooltip
          prefixCls="rc-slider-tooltip"
          overlay={value}
          visible={dragging}
          placement="top"
          key={index}
        >
          <Handle {...restProps} />
        </Tooltip>
      );
    };

    const sunlightValue = this.sunlight ? this.sunlight.intensity * 100 : 0;

    return (
      <div id="outer-container">
        <Menu pageWrapId={'page-wrap'} outerContainerId={'outer-container'}>
          <h1>WeatherGL</h1>
          <div>
            <p className="wgl-author">By: Robert Gawdzik</p>
          </div>
          <div className="menu-item">
            <Select
              clearable={false}
              value={this.state.selectedMode}
              options={this.state.modeOptions}
              onChange={this.handleModeOptionsChange.bind(this)}
            />
          </div>
          <div className="menu-item">
            <Select
              clearable={false}
              value={this.state.selectedWeather}
              options={this.state.weatherOptions}
              onChange={this.handleWeatherOptionsChange.bind(this)}
            />
          </div>
          <div className="menu-item">
            <div>
              <p>Sunlight</p>
              <Slider
                min={0} max={100}
                defaultValue={sunlightValue}
                value={sunlightValue}
                handle={handle}
                onChange={this.handleSunlightChange.bind(this)}
              />
            </div>
          </div>
          <div className="menu-item">
            <label>
              <Toggle
                defaultChecked={this.state.debug}
                onChange={this.handleDebugChange.bind(this)}
              />
              <span className="label-text">Debug Mode</span>
            </label>
          </div>
        </Menu>

        <div id="page-wrap" ref={(node) => { this.node = node; }} onClick={this.handleCanvasClick.bind(this)} className="App" />
      </div>
    );
  }
}

export default App;
