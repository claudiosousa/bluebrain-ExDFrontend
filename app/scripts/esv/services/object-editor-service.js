/* global THREE: false */
/* global console: false */
(function () {
    'use strict';

    angular.module('objectEditorModule', [])

      .constant('OBJECT_VIEW_MODE', {
        NORMAL: 'normal',
        TRANSPARENT: 'transparent',
        WIREFRAME: 'wireframe'
      })

      .factory('objectEditorService', [
        'EDIT_MODE',
        'STATE',
        'OBJECT_VIEW_MODE',
        'gz3d',
        'stateService',
        function (EDIT_MODE, STATE, OBJECT_VIEW_MODE, gz3d, stateService) {
          return {
            //whether the object editor should be displayed
            isShown: false,
            selectedObject: undefined,
            translation: new THREE.Vector3(),
            rotationEuler: new THREE.Euler(),
            floatPrecision: 5,

            toggleView: function (show) {
              var showing;
              if (!angular.isDefined(show)) {
                showing = !this.isShown;
              } else {
                showing = show;
              }

              if (showing) {
                this.update();
              } else {
                // switch back to view mode on close
                this.setManipulationMode(EDIT_MODE.VIEW);
              }

              this.isShown = showing;
            },

            roundToPrecision: function(number) {
              return parseFloat(number.toFixed(this.floatPrecision));
            },

            update: function () {
              // update selected object
              this.selectedObject = gz3d.scene.selectedEntity;

              if (!angular.isDefined(this.selectedObject)) {
                return;
              }

              // update translation, rotation
              this.translation.copy(this.selectedObject.position);
              this.rotationEuler.copy(this.selectedObject.rotation);
              // round for readability purposes
              this.translation.x = this.roundToPrecision(this.translation.x);
              this.translation.y = this.roundToPrecision(this.translation.y);
              this.translation.z = this.roundToPrecision(this.translation.z);
              this.rotationEuler.x = this.roundToPrecision(this.rotationEuler.x);
              this.rotationEuler.y = this.roundToPrecision(this.rotationEuler.y);
              this.rotationEuler.z = this.roundToPrecision(this.rotationEuler.z);

              // update view mode radio buttons
              document.getElementById('oe-viewmode-normal').checked = false;
              document.getElementById('oe-viewmode-transparent').checked = false;
              document.getElementById('oe-viewmode-wireframe').checked = false;
              if (angular.isDefined(this.selectedObject.viewAs)) {
                switch (this.selectedObject.viewAs) {
                  case OBJECT_VIEW_MODE.NORMAL :
                    document.getElementById('oe-viewmode-normal').checked = true;
                    break;
                  case OBJECT_VIEW_MODE.TRANSPARENT :
                    document.getElementById('oe-viewmode-transparent').checked = true;
                    break;
                  case OBJECT_VIEW_MODE.WIREFRAME :
                    document.getElementById('oe-viewmode-wireframe').checked = true;
                    break;
                }
              }
            },

            onObjectChange: function () {
              this.selectedObject.position.copy(this.translation);
              this.selectedObject.rotation.copy(this.rotationEuler);
              this.selectedObject.updateMatrixWorld();

              gz3d.scene.emitter.emit('entityChanged', this.selectedObject);
            },

            setViewMode: function (mode) {
              if (this.selectedObject.viewAs === mode) {
                return;
              }

              gz3d.scene.setViewAs(this.selectedObject, mode);
            },

            setManipulationMode: function (mode) {
              if (gz3d.scene.manipulationMode === mode) {
                return;
              } else {
                switch (mode) {
                  case EDIT_MODE.VIEW:
                    gz3d.scene.setManipulationMode(mode);
                    break;
                  case EDIT_MODE.TRANSLATE:
                  case EDIT_MODE.ROTATE:
                    stateService.ensureStateBeforeExecuting(
                      STATE.PAUSED,
                      function () {
                        gz3d.scene.setManipulationMode(mode);
                      }
                    );
                    // as view mode deselects any selected object, reselect here
                    gz3d.scene.selectEntity(this.selectedObject);
                    break;
                }
              }
            }
          };
        }
      ])
    ;
  }
  ()
)
;

