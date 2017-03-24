// @flow

import React, { Component } from 'react';
import DocumentTitle from 'react-document-title';
import { WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, BoxGeometry, MeshBasicMaterial, Mesh } from 'three';
import { Terrain } from './external/generator';
import './App.css';

class App extends Component {
  scene:Scene;
  camera:PerspectiveCamera;
  renderer:PerspectiveCamera;
  resize:Function;
  initScene:Function;
  renderFrame:Function;
  node:Object;
  foregroundSurface:Mesh;
  cube:Mesh;

  constructor() {
    super();

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.resize = this.resize.bind(this);
    this.initScene = this.initScene.bind(this);
    this.renderFrame = this.renderFrame.bind(this);
  }

  componentDidMount() {
    this.node.appendChild(this.renderer.domElement);
    window.addEventListener('resize', this.resize);

    this.initScene();
    this.renderFrame();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  initScene() {
    this.camera.position.z = 5;

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0xffffff });
    this.cube = new Mesh(geometry, material);
    this.scene.add(this.cube);

    const meshWidth = 2;
    const meshHeight = 2;
    const meshWidthSegments = meshWidth * 10;
    const meshHeightSegments = meshHeight * 10;

    this.foregroundSurface = new Mesh(
        new PlaneGeometry(meshWidth, meshHeight, meshWidthSegments, meshHeightSegments),
        new MeshBasicMaterial({ color: 0xffffff }),
    );

    const terrainOptions = { xSegments: meshWidthSegments,
      ySegments: meshHeightSegments,
      maxHeight: 0.5,
      easing: Terrain.EaseInOut,
      minHeight: -0.5 };

    this.foregroundSurface.rotation.x = -0.5 * Math.PI;
    Terrain.DiamondSquare(this.foregroundSurface.geometry.vertices, terrainOptions);
    Terrain.Normalize(this.foregroundSurface, terrainOptions);
    this.scene.add(this.foregroundSurface);
  }

  renderFrame() {
    requestAnimationFrame(this.renderFrame);

    this.renderer.render(this.scene, this.camera);

    this.cube.rotation.x += 0.005;
    this.cube.rotation.y += 0.005;
    this.foregroundSurface.rotation.x += 0.005;
    this.foregroundSurface.rotation.y += 0.005;
  }

  render() {
    return (
      <DocumentTitle title="WeatherGL">
        <div ref={(node) => { this.node = node; }} className="App" />
      </DocumentTitle>
    );
  }
}

export default App;
