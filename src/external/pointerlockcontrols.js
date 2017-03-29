/* eslint-disable */

 // source: https://github.com/JamesMilnerUK/threejs-fps-controls/blob/master/js/FPSControls.js

 import * as THREE from 'three';

/**
 * @author mrdoob / http://mrdoob.com/
 */

const PointerLockControls = PointerLockControls = function ( camera ) {
  var scope = this;

  camera.position.set(0,0,0);
  camera.rotation.set( Math.PI/2, 0, 0 );

  var pitchObject = new THREE.Object3D();
  pitchObject.add( camera );

  var yawObject = new THREE.Object3D();
  yawObject.position.z = 10;
  yawObject.rotation.z += Math.PI - Math.PI/6;
  yawObject.add( pitchObject );

  var PI_2 = Math.PI / 2;

  var onMouseMove = function ( event ) {

    if ( scope.enabled === false ) return;

    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    yawObject.rotation.z -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;

    // pitchObject.rotation.x = Math.min( PI_2, Math.max( -PI_2, pitchObject.rotation.x ) );

  };

  this.dispose = function() {

    document.removeEventListener( 'mousemove', onMouseMove, false );

  };

  document.addEventListener( 'mousemove', onMouseMove, false );

  this.enabled = false;

  this.getObject = function () {

    return yawObject;

  };

  this.getDirection = function() {

    // assumes the camera itself is not rotated

    var direction = new THREE.Vector3( 0, 0, 1 );
    var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

    return function( v ) {

      rotation.set( pitchObject.rotation.x, yawObject.rotation.z, 0 );

      v.copy( direction ).applyEuler( rotation );

      return v;

    };

  }();


};

export { PointerLockControls };
