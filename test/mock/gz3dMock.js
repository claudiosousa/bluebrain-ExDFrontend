(function () {
  'use strict';

  angular.module('gz3dMock', [])
  .service('gz3d', function () {

    this.Initialize = jasmine.createSpy('Initialize');
    this.deInitialize = jasmine.createSpy('deInitialize');
    this.setLightHelperVisibility = jasmine.createSpy('setLightHelperVisibility');
    this.isGlobalLightMinReached = jasmine.createSpy('isGlobalLightMinReached');
    this.isGlobalLightMaxReached = jasmine.createSpy('isGlobalLightMaxReached');

    this.scene = {
      render: jasmine.createSpy('render'),
      resetView: jasmine.createSpy('resetView'),
      setDefaultCameraPose: jasmine.createSpy('setDefaultCameraPose'),
      container: {
        addEventListener: jasmine.createSpy('addEventListener')
      },
      radialMenu: {
        showing: false
      },
      modelManipulator: {
        pickerNames: ''
      },
      emitter: {
        emit: jasmine.createSpy('emit')
      },
      setManipulationMode: jasmine.createSpy('setManipulationMode'),
      controls: {
        onMouseDownManipulator: jasmine.createSpy('onMouseDownManipulator'),
        onMouseUpManipulator: jasmine.createSpy('onMouseUpManipulator'),
        update: jasmine.createSpy('update')
      },
      gui: {
        emitter: {}
      },
      setShadowMaps: jasmine.createSpy('setShadowMaps'),
      renderer: {
        shadowMapEnabled: false
      },
      viewManager: {
        views: [
          {type: 'camera', active: true, container: {style: {visibility: 'visible'}}},
          {type: 'camera', active: false, container: {style: {visibility: 'hidden'}}}
        ]
      },
      scene: new THREE.Scene(),
      selectEntity: jasmine.createSpy('selectEntity'),
      applyComposerSettings: jasmine.createSpy('applyComposerSettings')
    };
    this.iface = {
      addCanDeletePredicate: angular.noop,
      setAssetProgressCallback: jasmine.createSpy('setAssetProgressCallback'),
      registerWebSocketConnectionCallback: jasmine.createSpy('registerWebSocketConnectionCallback'),
      webSocket: {
        close: jasmine.createSpy('close')
      }
    };
  });
}());
