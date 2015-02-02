(function () {
  'use strict';

  /* global THREE: true */

  var cameraModule = angular.module('gz3dCameraModule', []);

  cameraModule.factory('cameraManipulation', ['gzInitialization', '$rootScope', function (gzInitialization, $rootScope) {

    var camera = $rootScope.scene.camera;
    var initPosition = new THREE.Vector3().copy(camera.position);
    var initRotation = new THREE.Quaternion().copy(camera.quaternion);

    function fpTranslate(right, up, forward) {
      camera.translateOnAxis(new THREE.Vector3( 1, 0, 0 ), right);
      camera.translateOnAxis(new THREE.Vector3( 0, 1, 0 ), up);
      camera.translateOnAxis(new THREE.Vector3( 0, 0, -1 ), forward);
    }

    function fpRotate(degreeRight, degreeUp) {
      // rotate left/right
      // rotation happens around the world up axis so up remains up (no upside-down)
      var q = new THREE.Quaternion();
      q.setFromAxisAngle(new THREE.Vector3( 0, 0, 1), (degreeRight/180)*Math.PI );
      camera.quaternion.multiplyQuaternions( q, camera.quaternion);
      // rotate up/down
      camera.rotateOnAxis(new THREE.Vector3( 1, 0, 0), (degreeUp/180)*Math.PI);
    }

    function lookAtOrigin() {
      camera.lookAt(new THREE.Vector3(0,0,0));
    }

    function resetToInitPose() {
      camera.position.copy(initPosition);
      camera.quaternion.copy(initRotation);
    }

    // public functions
    return {

      /**
       * Translate the camera in first-person mode.
       * @param right move camera towards local right
       * @param up move camera towards local up
       * @param forward move camera towards local forward
       */
      firstPersonTranslate: function (right, up, forward) {
        fpTranslate(right, up, forward);
      },

      /**
       * Rotate the camera in first-person mode.
       * @param degreeRight turn camera right around world up axis (left for negative degrees)
       * @param degreeUp turn camera up (down for negative degrees)
       */
      firstPersonRotate: function (degreeRight, degreeUp) {
        fpRotate(degreeRight, degreeUp);
      },

      /**
       * Turn the camera to look at the world origin.
       */
      lookAtOrigin: function() {
        lookAtOrigin();
      },

      /**
       * Reset the camera to initial pose.
       */
      resetToInitialPose: function() {
        resetToInitPose();
      }
    };
  }]);
}());
