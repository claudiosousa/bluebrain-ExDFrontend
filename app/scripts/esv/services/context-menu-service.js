/* global THREE: false */
(function () {
  'use strict';

  angular.module('contextMenuStateService', ['nrpAngulartics'])
    .factory('contextMenuState', ['gz3d', 'nrpAnalytics', function (gz3d, nrpAnalytics) {

      return {
        //whether the context menu should be displayed
        isShown: false,

        // the position of the context menu
        contextMenuTop: 0,
        contextMenuLeft: 0,

        itemsGroups: [
          /* itemGroup sample
           {
           label: 'Sample',
           visible: true,
           items: [
           { text: 'sampleButton1',
           callback: function() {$event.stopPropagation();},
           visible : true
           },
           { text: 'sampleButton2',
           callback: function() {$event.stopPropagation();},
           visible : true
           }
           ]

           hide: function() {
           //hiding logic
           },

           show: function(model) {
           //showing logic
           return true; //ask for redraw, false otherwise
           }
           }
           */

          // first item just reflects model's name
          {
            label: 'Object name',
            visible: true,

            hide: function () {
              this.visible = false;
            },

            show: function (model) {
              this.visible = true;
              this.label = model.name;

              return true;
            }
          }
        ],

        pushItemGroup: function (itemGroup) {
          if (!this.itemsGroups.some(function (item) { return item.id === itemGroup.id; })){
            this.itemsGroups.push(itemGroup);
          }
        },

        hideMenu: function () {
          for (var i = 0, len = this.itemsGroups.length; i < len; i += 1) {
            this.itemsGroups[i].hide();
          }
        },

        toggleContextMenu: function (show, event) {
          nrpAnalytics.eventTrack('Toggle-context-menu', {
            category: 'Simulation-GUI'
          });

          if (show && !this.isShown) {
            var model = this._getModelUnderMouse(event);
            var animatedExt = "_animated";

            if (model && (model.name.indexOf(animatedExt) < 0 || model.name.indexOf(animatedExt) !== model.name.length - animatedExt.length))
            {
              var needsRefresh = false;

              //update visibility info
              for (var i = 0, len = this.itemsGroups.length; i < len; i += 1) {
                needsRefresh = this.itemsGroups[i].show(model, event) || needsRefresh;
              }

              // scene.radialMenu.showing is a property of GZ3D that was originally used to display a radial menu, We are
              // reusing it for our context menu. The reason is that this variables disables or enables the controls of
              // scene in the render loop.
              this.isShown =
                gz3d.scene.radialMenu.showing =
                  (
                    model.name !== '' &&
                    model.name !== 'plane' &&
                    needsRefresh
                  );

              this.contextMenuTop = event.clientY;
              this.contextMenuLeft = event.clientX;
              gz3d.scene.selectEntity(model);    
            }
          }
          else {

            this.hideMenu();
            this.isShown =
            gz3d.scene.radialMenu.showing = false;
          }
        },

        axisSelected: function (model) {
          return !model.name || (_.some(['TX', 'TY', 'TZ', 'RX', 'RY', 'RZ', 'plane', 'TXY', 'TXZ', 'TYZ'], function (parameter)
          { return parameter === model.name; }));
        },

        _getModelUnderMouse: function (event) {
          var pos = new THREE.Vector2(event.clientX, event.clientY);
          var intersect = new THREE.Vector3();
          var model = gz3d.scene.getRayCastModel(pos, intersect);
          if(this.axisSelected(model)){
            model = gz3d.scene.modelManipulator.object; 
          }
          return model;
        }
      };
    }]);
}());
