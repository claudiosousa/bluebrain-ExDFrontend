'use strict';

describe('Services: contextMenuState', function (){
  var contextMenuState, gz3d;

  var gzInitializationMock = {};
  gzInitializationMock.Initialize = jasmine.createSpy('Initialize');
  gzInitializationMock.deInitialize = jasmine.createSpy('deInitialize');

  //mock gz3d
  beforeEach(module(function ($provide) {
    $provide.value('gz3d', gzInitializationMock);

    gzInitializationMock.Initialize.reset();
    gzInitializationMock.deInitialize.reset();
  }));

  // excuted before each "it" is run.
  beforeEach(function (){
    // load the module.
    module('contextMenuStateService');

    // inject service for testing.
    inject(function(_contextMenuState_, _gz3d_) {
      contextMenuState = _contextMenuState_;
      gz3d = _gz3d_;
    });

    gz3d.scene = {};
    gz3d.scene.radialMenu = {};
    gz3d.scene.radialMenu.showing = false;

  });


  // check to see if it has the expected function
  it('should have an toggleContextMenu function', function () {
    expect(angular.isFunction(contextMenuState.toggleContextMenu)).toBe(true);
  });

  it('should hide menu when calling toggleContextMenu(false)', function(){

    spyOn(contextMenuState, 'hideMenu');

    contextMenuState.toggleContextMenu(false);

    expect(contextMenuState.hideMenu).toHaveBeenCalled();
    expect(contextMenuState.isShown).toBe(false);
    expect(gz3d.scene.radialMenu.showing).toBe(false);

  });

  it('should show menu when calling toggleContextMenu(true)', function(){

    var dummyModel = {name : 'dummyModel'};

    var dummyItemGroup = {
      label: 'Sample',
      visible: false,
      items: [{ text: 'sampleButton1',
                callback: function() {return true;},
                visible : true
              }],
       show: function() {
        this.visible = true;
        return true;
       }
    };

    contextMenuState.pushItemGroup(dummyItemGroup);//add a menuItem

    var dummyEvent = {clientX: 0, clientY: 0};

    spyOn(contextMenuState, '_getModelUnderMouse').andReturn(dummyModel);

    gz3d.scene.selectEntity = jasmine.createSpy('selectEntity');

    //call the function under test
    contextMenuState.toggleContextMenu(true, dummyEvent);

    expect(gz3d.scene.selectEntity).toHaveBeenCalled();
    expect(contextMenuState.isShown).toBe(true);
    expect(gz3d.scene.radialMenu.showing).toBe(true);

    expect(contextMenuState.contextMenuTop).toBe(dummyEvent.clientY);
    expect(contextMenuState.contextMenuLeft).toBe(dummyEvent.clientX);

  });

  it('should get the model under the current mouse position', function () {
    gz3d.scene.getRayCastModel = jasmine.createSpy('getRayCastModel');
    contextMenuState._getModelUnderMouse({clientX: 10, clientY: 10});
    expect(gz3d.scene.getRayCastModel).toHaveBeenCalled();
  });

});
