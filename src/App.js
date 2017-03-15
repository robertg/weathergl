// @flow

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {WebGLRenderer, Scene, PerspectiveCamera} from 'three';
import {BoxGeometry, MeshBasicMaterial, Mesh} from 'three';
import './App.css';

class App extends Component {
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
    ReactDOM.findDOMNode(this).appendChild(this.renderer.domElement);
    window.addEventListener("resize", this.resize);

    this.initScene();
    this.renderFrame();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resize);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  initScene() {
    this.camera.position.z = 5;

    let geometry = new BoxGeometry( 1, 1, 1 );
    let material = new MeshBasicMaterial( { color: 0xffffff } );
    this.cube = new Mesh(geometry, material);
    this.scene.add(this.cube);
  }

  renderFrame() {
    requestAnimationFrame(this.renderFrame);

    this.renderer.render(this.scene, this.camera);

    this.cube.rotation.x += 0.005;
    this.cube.rotation.y += 0.005;
  }

  render() {
    return (
      <div className="App">
      </div>
    );
  }
}

export default App;
