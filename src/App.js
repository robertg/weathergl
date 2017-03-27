// @flow

import React, { Component } from 'react';
import { WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, BoxGeometry, MeshBasicMaterial,
  MeshLambertMaterial, Mesh, BufferGeometry, RawShaderMaterial, TextureLoader, RepeatWrapping,
  BufferAttribute, PointLight, ShaderMaterial, UniformsUtils, UniformsLib, HemisphereLight,
  AmbientLight, DirectionalLight, VertexNormalsHelper, DirectionalLightHelper, Object3D, Color,
  CubeTextureLoader, Vector3, AxisHelper, CameraHelper, PCFSoftShadowMap, Vector4,
  Fog, LensFlare, AdditiveBlending } from 'three';
import { Terrain } from './external/generator';
import { Terra } from './external/terra';
import TrackballControls from 'three-trackballcontrols';
import { OrbitControls } from './external/orbitcontrols';
import * as heightfield from './external/heightfield';
import Stats from 'stats.js';
import './App.css';

/* eslint-disable */
import ground_vert from '!!raw!./shader/ground.vert.glsl';
import ground_frag from '!!raw!./shader/ground.frag.glsl';
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
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.renderer = new WebGLRenderer({antialias: true, alpha: true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    this.resize = this.resize.bind(this);
    this.initScene = this.initScene.bind(this);
    this.renderFrame = this.renderFrame.bind(this);

    this.debug = true;

    if(this.debug) {
      this.stats = new Stats();
      this.stats.showPanel(0);

      document.body.appendChild(this.stats.dom);
    }
  }

  componentDidMount() {
    this.node.appendChild(this.renderer.domElement);
    window.addEventListener('resize', this.resize);

    const self = this;
    // ground_hmap generated with http://cpetry.github.io/TextureGenerator-Online/
    new TextureLoader().load('heightmap2.png', (ground_hmap) => {
      // Skybox from https://reije081.home.xs4all.nl/skyboxes/
      new CubeTextureLoader().load([
        'skybox45/skyrender0002.bmp',
        'skybox45/skyrender0005.bmp',
        'skybox45/skyrender0004.bmp',
        'skybox45/skyrender0001.bmp',
        'skybox45/skyrender0003.bmp',
        'skybox45/skyrender0003.bmp',
        ], (skybox) => {
          // Grass texture from http://trutextures.blogspot.ca/2013/01/free-seamless-tiling-dead-grass-terrain.html
          new TextureLoader().load('grass/texture.jpg', (grass_texture) => {
            new TextureLoader().load('grass/bumpmap.jpg', (grass_bumpmap) => {
              // Rock texture from http://www.virtual-lands-3d.com/textures.html
              new TextureLoader().load('rock2/texture.jpg', (rock_texture) => {
                new TextureLoader().load('rock2/bumpmap.jpg', (rock_bumpmap) => {
                  new TextureLoader().load('lensflare/lensflare0.png', (lensflare0) => {
                    self.initScene(ground_hmap, skybox, grass_texture, grass_bumpmap, rock_texture, rock_bumpmap, lensflare0);
                    self.renderFrame();
                  });
                });
              });
            });
          });
        });
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  initScene(ground_hmap, skybox, grass_texture, grass_bumpmap, rock_texture, rock_bumpmap, lensflare0) {
    const fast_debug = false;
    this.camera.position.set(100, 0, 100);
    this.camera.lookAt(new Vector3(0, 0, 0));
    this.scene.add(this.camera);

    // debug
    this.controls = new OrbitControls(this.camera);
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
    this.controls.keys = [65, 83, 68];

    const geometry = new BoxGeometry(10, 10, 10);
    const material = new MeshLambertMaterial({ color: 0xffffff });
    this.cube = new Mesh(geometry, material);
    this.cube.receiveShadow = true;
    this.cube.castShadow = true;
    this.cube.position.z += 25;
    this.scene.add(this.cube);

    // const meshWidth = 100;
    // const meshHeight = 100;
    // const meshWidthSegments = meshWidth;
    // const meshHeightSegments = meshHeight;

    // this.foregroundSurface = new Mesh(
    //     new PlaneGeometry(meshWidth, meshHeight, meshWidthSegments, meshHeightSegments),
    //     new MeshBasicMaterial({ color: 0xffffff }),
    // // );

    // const terrainOptions = { xSegments: meshWidthSegments,
    //   ySegments: meshHeightSegments,
    //   maxHeight: 10,
    //   easing: Terrain.EaseInOut,
    //   minHeight: -1 };

    // this.foregroundSurface.rotation.x = -0.5 * Math.PI;
    // Terrain.DiamondSquare(this.foregroundSurface.geometry.vertices, terrainOptions);
    // Terrain.Normalize(this.foregroundSurface, terrainOptions);
    // this.scene.add(this.foregroundSurface);

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

    if(!fast_debug) {
      let maxHeight = 40;
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
          offsetRepeat: { value: new Vector4( 0, 0, 1, 1 ) },
          max_height: {type: 'f', value: maxHeight},
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

      // TODO: Cache this, maybe load it from JSON? Or localstorage?
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

    // DEBUG:
    // this.scene.add(new VertexNormalsHelper(this.ground_mesh, 2, 0x00ff00, 1));
    // this.scene.add(new DirectionalLightHelper(this.sunlight, 5));
    // this.scene.add(new CameraHelper(this.sunlight.shadow.camera));
    // this.scene.add(new AxisHelper(100));

    // Add fog
    this.scene.fog = new Fog(0xffffff, 50, 1000);

    // Add lens flare: (Inspired by https://github.com/timoxley/threejs/blob/master/examples/webgl_lensflares.html)
    // TODO: If world position is always (0,0,0), this solution is okay. Otherwise position needs to be computed for a 45 deg angle.
    this.lensflare = new LensFlare(lensflare0, 300, 0.0, AdditiveBlending, new Color(0xffffbb));
    this.lensflare.position.copy(new Vector3(-600, -600, 1000));

    this.scene.add(this.lensflare);
  }

  renderFrame() {
    requestAnimationFrame(this.renderFrame);

    if(this.debug) {
      this.stats.begin();
    }

    this.cube.rotation.x += 0.005;
    this.cube.rotation.y += 0.005;
    // this.foregroundSurface.rotation.x += 0.005;
    // this.foregroundSurface.rotation.y += 0.005;
    this.controls.update();

    this.renderer.render(this.scene, this.camera);

    if(this.debug) {
      this.stats.end();
    }
  }

  render() {
    return (
      <div ref={(node) => { this.node = node; }} className="App" />
    );
  }
}

export default App;
