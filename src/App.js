// @flow

import React, { Component } from 'react';
import { WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, BoxGeometry, MeshBasicMaterial,
  MeshLambertMaterial, Mesh, BufferGeometry, RawShaderMaterial, TextureLoader, RepeatWrapping,
  BufferAttribute, PointLight, ShaderMaterial, UniformsUtils, UniformsLib, HemisphereLight,
  AmbientLight, DirectionalLight, VertexNormalsHelper, DirectionalLightHelper, Object3D, Color,
  CubeTextureLoader, Vector3, AxisHelper, CameraHelper, PCFSoftShadowMap } from 'three';
import { Terrain } from './external/generator';
import { Terra } from './external/terra';
import TrackballControls from 'three-trackballcontrols';
import { OrbitControls } from './external/orbitcontrols';
import * as heightfield from './external/heightfield';
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
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
    this.renderer = new WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    this.resize = this.resize.bind(this);
    this.initScene = this.initScene.bind(this);
    this.renderFrame = this.renderFrame.bind(this);
  }

  componentDidMount() {
    this.node.appendChild(this.renderer.domElement);
    window.addEventListener('resize', this.resize);

    const self = this;
    new TextureLoader().load('heightmap.png', (ground_hmap) => {
      // Skybox from https://reije081.home.xs4all.nl/skyboxes/
      new CubeTextureLoader().load([
        'skybox45/skyrender0002.bmp',
        'skybox45/skyrender0005.bmp',
        'skybox45/skyrender0004.bmp',
        'skybox45/skyrender0001.bmp',
        'skybox45/skyrender0003.bmp',
        'skybox45/skyrender0003.bmp',
        ], (skybox) => {
          self.initScene(ground_hmap, skybox);
          self.renderFrame();
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

  initScene(ground_hmap, skybox) {
    const fast_debug = false;
    this.camera.position.set(100, 100, 100);
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
    // Generated with http://cpetry.github.io/TextureGenerator-Online/
    ground_hmap.wrapS = RepeatWrapping;
    ground_hmap.wrapT = RepeatWrapping;

    const ground_geo = new BufferGeometry();
    const groundHmapSize = 500;

    const xCellCount = Math.floor(Math.sqrt(262144 / (3 * 2)));
    const yCellCount = xCellCount;
    const cellSize = groundHmapSize / xCellCount;

    if(!fast_debug) {
      const hf = heightfield.create(ground_hmap.image, cellSize, -1, 20);
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
          hmap_scale: { type: '3f', value: [1.0 / groundHmapSize, 1.0 / groundHmapSize, 30] },
        }]);
      uniforms.hmap.value = ground_hmap; // Assign hmap image (cause UniformsUtils.merge calls clone())


      const ground_mat = new ShaderMaterial({
        uniforms,
        vertexShader: ground_vert,
        fragmentShader: ground_frag,
        lights: true,
      });

      this.ground_mesh = new Mesh(ground_geo, ground_mat);
      this.ground_mesh.receiveShadow = true;

      this.ground_mesh.geometry.computeFaceNormals();
      this.ground_mesh.geometry.computeVertexNormals();
      console.log(this.ground_mesh.geometry);

      // TODO: Cache this, maybe load it from JSON? Or localstorage?
      this.ground_mesh.geometry.attributes.normal.array = hf.vtxNormals;

      console.log(this.ground_mesh.geometry);

      // this.ground_mesh.rotation.x = -0.5 * Math.PI;

      // this.ground_mesh.receiveShadow = true;
      // this.ground_mesh.castShadow = true;
      this.scene.add(this.ground_mesh);
    }

    // http://blog.cjgammon.com/threejs-lights-cameras
    // this.hemisphere_light = new HemisphereLight( 0xffffbb, 0x080820, 1 );
    // this.scene.add( this.hemisphere_light );

    this.ambientlight = new AmbientLight(0xffffbb, 0.15);
    this.scene.add(this.ambientlight);

    this.sunlight = new DirectionalLight(0xffffbb, 0.7);
    // this.sunlight.position.set(0,0, 10000);
    this.sunlight.position.set(100, 0, 1000);
    // this.sunlight.position.set(0, 0, 100);
    this.sunlight.target.position.set(0, 0, 50);
    this.sunlight.castShadow = true;
    this.sunlight.shadow.mapSize.width = 4096;
    this.sunlight.shadow.mapSize.height = 4096;
    this.sunlight.shadow.camera.near = 2;       // default 0.5
    this.sunlight.shadow.camera.far = 3000;      // default 500

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
    this.scene.add(new CameraHelper(this.sunlight.shadow.camera));
    this.scene.add(new AxisHelper(100));
  }

  renderFrame() {
    requestAnimationFrame(this.renderFrame);

    this.controls.update();

    this.renderer.render(this.scene, this.camera);

    this.cube.rotation.x += 0.005;
    this.cube.rotation.y += 0.005;
    // this.foregroundSurface.rotation.x += 0.005;
    // this.foregroundSurface.rotation.y += 0.005;
  }

  render() {
    return (
      <div ref={(node) => { this.node = node; }} className="App" />
    );
  }
}

export default App;
