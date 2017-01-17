/* global THREE: false */
/* global GZ3D: false */
/* global console: false */

(function () {
  'use strict';

  angular.module('objectInspectorModule', [])

    .constant('OBJECT_VIEW_MODE', {
      NORMAL: 'normal',
      TRANSPARENT: 'transparent',
      WIREFRAME: 'wireframe'
    })

    .factory('objectInspectorService', [
      '$timeout', 'EDIT_MODE', 'STATE', 'OBJECT_VIEW_MODE', 'gz3d', 'stateService', 'colorableObjectService', 'simulationInfo',
      function ($timeout, EDIT_MODE, STATE, OBJECT_VIEW_MODE, gz3d, stateService, colorableObjectService, simulationInfo) {

        //var objectInspectorService = {
        function ObjectInspectorService() {

          var that = this;
          var TRANSFORM_TYPES = GZ3D.TRANSFORM_TYPE_NAME_PREFIX;

          //whether the object editor should be displayed
          this.isShown = false;
          this.selectedObject =  undefined;
          this.translation = new THREE.Vector3(0, 0, 0);
          this.scaling = new THREE.Vector3(1, 1, 1);
          this.rotationEuler = new THREE.Euler(0, 0, 0);
          this.floatPrecision = 5;
          this.showCollision = undefined;
          this.selectedStyle = [];
          this.inputErrorStyle = "background-color:red;";
          this.highlightingStyle = "background-color:yellow;";

          this.getSelectedObjectShape = function () {
            if(this.selectedObject) {
             return this.selectedObject.getShapeName();
            }
          };

          this.isSelectedObjectSimpleShape = function () {
            if(!!this.selectedObject && !!this.selectedObject.isSimpleShape) {
              return this.selectedObject.isSimpleShape();
            }
            else {
              return false;
            }
          };

          this.toggleView = function (show) {
            var showing;
            if (angular.isUndefined(show)) {
              showing = !this.isShown;
            } else {
              showing = show;
            }

            if (showing) {
              this.registerGuiEvents();
              this.update();
            } else {
              // switch back to view mode on close
              this.setManipulationMode(EDIT_MODE.VIEW);
            }

            this.isShown = showing;
          };

          this.updateScale = function (newValue, newValueAxis) {
            switch (this.getSelectedObjectShape()) {
              case 'cylinder': //X=Y Z
                if (newValueAxis === 'x' || newValueAxis === 'y') {
                  this.scaling.y = this.scaling.x = newValue;
                }
                break;
              case 'sphere': //X=Y=Z
                this.scaling.x = this.scaling.y = this.scaling.z = newValue;
                break;
              case undefined: // no selected object --> do nothing
                break;
              // box and complex --> do nothing
            }
          };

          this.roundToPrecision = function (number) {
            return parseFloat(number.toFixed(this.floatPrecision));
          };

          this.roundToPrecisionVector3 = function (vector3) {
            vector3.x = this.roundToPrecision(vector3.x);
            vector3.y = this.roundToPrecision(vector3.y);
            vector3.z = this.roundToPrecision(vector3.z);
            return vector3;
          };

          this.roundTransformationsValues = function () {
            this.roundToPrecisionVector3(this.translation);
            this.roundToPrecisionVector3(this.scaling);
            this.roundToPrecisionVector3(this.rotationEuler);
          };

          this.selectMaterial = function (material) {
            colorableObjectService.setEntityMaterial(simulationInfo, this.selectedObject, material);
          };

          this.onTranslationChange = function (newValueAxis) {
            var selectedStyle = that.inputErrorStyle;
            var idx = "T" + newValueAxis.toUpperCase();

            var newValue = this.translation[newValueAxis];

            if (newValue === 0 || !!newValue) {
              that.resetStyle(idx);
              this.onObjectChange(TRANSFORM_TYPES.TRANSLATE);
            } else {
              that.setStyle(selectedStyle, idx);
            }
          };

          this.onScaleChange = function (newValueAxis) {
            var selectedStyle = that.inputErrorStyle;
            var idx = "S" + newValueAxis.toUpperCase();

            var newValue = this.scaling[newValueAxis];

            if (!!newValue && newValue !== 0) { // scaling factor must be non-zero
              that.resetStyle(idx);
              this.updateScale(newValue, newValueAxis);
              this.onObjectChange(TRANSFORM_TYPES.SCALE);
            }
            else {
              that.setStyle(selectedStyle, idx);
            }
          };

          this.onRotationChange = function (newValueAxis) {
            var selectedStyle = that.inputErrorStyle;
            var idx = "R" + newValueAxis.toUpperCase();

            var newValue = this.rotationEuler[newValueAxis];

            if (newValue === 0 || !!newValue) {
              that.resetStyle(idx);
              this.onObjectChange(TRANSFORM_TYPES.ROTATE);
            } else {
              that.setStyle(selectedStyle, idx);
            }
          };

          this.onObjectChange = function (transformType) {
            this.updateSelectedObject(transformType);
            this.selectedObject.updateMatrixWorld();
            gz3d.scene.emitter.emit('entityChanged', this.selectedObject);
          };

          this.setViewMode = function (mode) {
            if (this.selectedObject.viewAs === mode) {
              return;
            }

            gz3d.scene.setViewAs(this.selectedObject, mode);
          };

          this.removeEventListeners = function () {
            document.removeEventListener('keydown', this.onXYZKeystroke);
            document.removeEventListener('mouseup', this.onUpdateNeeded);
            document.removeEventListener('mousemove', gz3d.scene.modelManipulator.onPointerMove);
            document.removeEventListener('mousemove', this.onMouseMove);
          };

          this.setManipulationMode = function (mode) {
            if (gz3d.scene.manipulationMode === mode) {
              return;
            } else {
              switch (mode) {
                case EDIT_MODE.VIEW:
                  this.removeEventListeners();
                  gz3d.scene.setManipulationMode(mode);
                  break;
                case EDIT_MODE.TRANSLATE:
                case EDIT_MODE.SCALE:
                case EDIT_MODE.ROTATE:
                  stateService.ensureStateBeforeExecuting(
                    STATE.PAUSED,
                    function () {
                      gz3d.scene.setManipulationMode(mode);
                    }
                  );
                  // as view mode deselects any selected object, reselect here
                  gz3d.scene.selectEntity(this.selectedObject);

                  document.addEventListener('keydown', this.onXYZKeystroke, false);
                  document.addEventListener('mouseup', this.onUpdateNeeded, false);
                  document.addEventListener('mousemove', gz3d.scene.modelManipulator.onPointerMove, false);
                  document.addEventListener('mousemove', this.onMouseMove, false);

                  break;
              }
            }
          };

          this.onShowCollisionChange = function () {
            this.selectedObject.showCollision = this.showCollision;

            var that = this;
            this.selectedObject.traverse(function (node) {
              if (node.name.indexOf('COLLISION_VISUAL') >= 0) {
                // found collision geometry node, get all meshes attached
                node.traverse(function (subnode) {
                  if (subnode instanceof THREE.Mesh) {
                    subnode.visible = that.showCollision;
                  }
                });
              }
            });
          };

          this.onXYZKeystroke = function (event) {
            if (gz3d.scene === null) {
              return;
            }

            if (gz3d.scene.modelManipulator.selected === 'null') {
              var prefix = '';
              if (gz3d.scene.manipulationMode === EDIT_MODE.TRANSLATE) {
                prefix = TRANSFORM_TYPES.TRANSLATE;
              } else if (gz3d.scene.manipulationMode === EDIT_MODE.SCALE) {
                prefix = TRANSFORM_TYPES.SCALE;
              } else if (gz3d.scene.manipulationMode === EDIT_MODE.ROTATE) {
                prefix = TRANSFORM_TYPES.ROTATE;
              }

              var ix = null;
              switch (event.code) {
                case 'KeyX':
                  ix = prefix + 'X';
                  break;
                case 'KeyY':
                  ix = prefix + 'Y';
                  break;
                case 'KeyZ':
                  ix = prefix + 'Z';
                  break;
              }

              if (ix === null) {
                return;
              }

              var selected = this.getMeshByName(ix);
              if (selected) {
                document.addEventListener('mouseup', this.onAxisMoveEnd, false);

                gz3d.scene.modelManipulator.highlightPicker(selected);
                if (this.getMouseEvent()) {
                  gz3d.scene.modelManipulator.selectPicker(this.getMouseEvent());
                }
                else {
                  this.setSelectPicker(true);
                }
              }
            }
            else {
              /// gracefully exit axis lock mode on any key press
              gz3d.scene.modelManipulator.handleAxisLockEnd();
            }
            this.update();
          };

          this.getMouseEvent = function () {
            return this.mouseEvent;
          };

          this.getMeshByName = function (ix) {
            return gz3d.scene.modelManipulator.pickerMeshes[ix];
          };

          this.setSelectPicker = function (value) {
            this.doSelectPicker = value;
          };

          /** captures mouse move events for gz3d.scene.modelManipulator.selectPicker invocation */
          this.onMouseMove = function (event) {
            that.mouseEvent = event;
            if (that.doSelectPicker) {
              gz3d.scene.modelManipulator.selectPicker(that.mouseEvent);
              that.setSelectPicker(false);
            }

            if (gz3d.scene.modelManipulator.selected !== 'null') {
              that.update();
            }
          };

          this.onAxisMoveEnd = function (event) {
            if (gz3d.scene === null) {
              return;
            }
            gz3d.scene.modelManipulator.handleAxisLockEnd();
            this.update();
            document.removeEventListener('mouseup', this.onAxisMoveEnd);
          };

          this.checkLightSelected = function() {
              var result = false;
              if (that.selectedObject) {
                  that.selectedObject.traverse(function(subnode) {
                      if (subnode instanceof THREE.Light) {
                          result = true;
                      }
                  });
              }
              return result;
          };

          this.isLightSelected = this.checkLightSelected;

          this.onUpdateNeeded = function (event) {
            if (gz3d.scene === null) {
              return;
            }
            that.update();
          };

          this.setStyle = function (style, idx) {
            that.selectedStyle[idx] = style;
          };

          this.setStyleList = function (idxList, style)
          {
            angular.forEach(
              idxList,
              that.setStyle.bind(null, style)
            );
          };

          this.resetStyle = function (idx) {
            that.selectedStyle[idx] = "";
          };

          this.updateStyle = function (transform, style, axis) {
            var idx = transform + axis;

            if (gz3d.scene.modelManipulator.isSelected(transform) &&
                gz3d.scene.modelManipulator.isSelected(axis)) {

                var fieldsList = (axis === 'E') ? ['RX','RY','RZ']: [idx];
                that.setStyleList(fieldsList, style);
            } else {
                if(axis !== 'E') {
                  that.resetStyle(idx);
                }
            }
          };

          this.updateStyles = function () {
             var selectedStyle = that.highlightingStyle;

             angular.forEach(
              ['T','S','R'],
              function(transform) {
                angular.forEach(
                  ['X','Y','Z'],
                  that.updateStyle.bind(null, transform, selectedStyle)
                );
              }
            );
            that.updateStyle('R', selectedStyle, 'E');
          };

          this.update = function () {
            // update selected object
            that.selectedObject = gz3d.scene.selectedEntity;
            if (angular.isUndefined(that.selectedObject) ||
              that.selectedObject === null) {
              return;
            }

            if (that.checkLightSelected()) {
              that.setViewMode(OBJECT_VIEW_MODE.WIREFRAME);
            }

            that.updateStyles();

            // update translation, scale, rotation
            that.updateInspector(TRANSFORM_TYPES.ALL);

            // round for readability purposes
            that.roundTransformationsValues();

            that.hasColorableVisual = colorableObjectService.isColorableEntity(that.selectedObject);

            // update view mode radio buttons
            document.getElementById('oi-viewmode-normal').checked = false;
            document.getElementById('oi-viewmode-transparent').checked = false;
            document.getElementById('oi-viewmode-wireframe').checked = false;
            if (angular.isDefined(that.selectedObject.viewAs)) {
              switch (that.selectedObject.viewAs) {
                case OBJECT_VIEW_MODE.NORMAL:
                  document.getElementById('oi-viewmode-normal').checked = true;
                  break;
                case OBJECT_VIEW_MODE.TRANSPARENT:
                  document.getElementById('oi-viewmode-transparent').checked = true;
                  break;
                case OBJECT_VIEW_MODE.WIREFRAME:
                  document.getElementById('oi-viewmode-wireframe').checked = true;
                  break;
              }
            }

            // update show collisions
            if (angular.isUndefined(that.selectedObject.showCollision)) {
              that.showCollision = that.selectedObject.showCollision = false;
            } else {
              that.showCollision = that.selectedObject.showCollision;
            }
          };

          this.guiEventsRegistered = false;
          this.registerGuiEvents = function () {
            if (this.guiEventsRegistered) {
              return;
            }

            this.guiEventsRegistered = true;

            gz3d.gui.guiEvents.on('setTreeSelected', function () {
              if (that.isShown) {
                $timeout(that.update, 0);//force scope.$apply
              }
            });

            gz3d.gui.guiEvents.on('delete_entity', function () {
              $timeout(that.update, 0);//force scope.$apply
            });
          };

          // update inspector from object
          this.updateInspector = function (transformType) {
            this.updateInspectorFunctions[transformType]();
          };

          this.updateInspectorFunctions = {};
          // - none
          this.updateInspectorFunctions[TRANSFORM_TYPES.NONE] = angular.noop;
          // - translation
          this.updateInspectorFunctions[TRANSFORM_TYPES.TRANSLATE] = function () {
            that.translation.copy(that.selectedObject.position);
            that.roundToPrecisionVector3(that.translation);
          };
          // - scale
          this.updateInspectorFunctions[TRANSFORM_TYPES.SCALE] = function () {
            that.scaling.copy(that.selectedObject.scale);
            that.roundToPrecisionVector3(that.scaling);
          };
          // - rotation
          this.updateInspectorFunctions[TRANSFORM_TYPES.ROTATE] = function () {
            that.rotationEuler.copy(that.selectedObject.rotation);
            that.roundToPrecisionVector3(that.rotationEuler);
          };
          // - all
          this.updateInspectorFunctions[TRANSFORM_TYPES.ALL] = function () {
            that.updateInspectorFunctions[TRANSFORM_TYPES.TRANSLATE]();
            that.updateInspectorFunctions[TRANSFORM_TYPES.ROTATE]();
            that.updateInspectorFunctions[TRANSFORM_TYPES.SCALE]();
          };

          // update inspector from object
          this.updateSelectedObject = function (transformType) {
            this.updateSelectedObjectFunctions[transformType]();
          };
          // update object from inspector
          this.updateSelectedObjectFunctions = {};
          // - none
          this.updateSelectedObjectFunctions[TRANSFORM_TYPES.NONE] = angular.noop;
          // - translation
          this.updateSelectedObjectFunctions[TRANSFORM_TYPES.TRANSLATE] = function () {
            that.selectedObject.position.copy(that.translation);
          };
          // - rotation
          this.updateSelectedObjectFunctions[TRANSFORM_TYPES.ROTATE] = function () {
            that.selectedObject.rotation.copy(that.rotationEuler);
          };
          // - scale
          this.updateSelectedObjectFunctions[TRANSFORM_TYPES.SCALE] = function () {
            that.selectedObject.scale.copy(that.scaling);
          };
          // - all
          this.updateSelectedObjectFunctions[TRANSFORM_TYPES.ALL] = function () {
            that.updateSelectedObjectFunctions[TRANSFORM_TYPES.TRANSLATE]();
            that.updateSelectedObjectFunctions[TRANSFORM_TYPES.ROTATE]();
            that.updateSelectedObjectFunctions[TRANSFORM_TYPES.SCALE]();
          };
        }

        return new ObjectInspectorService();
      }
    ]);
}());

