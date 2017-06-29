(function () {
  'use strict';

  // Define test data which we want to share across the tests
  var exampleMessage = {
    headline: 'fake_headline',
    subHeadline: 'fake_subHeadline',
    progressInformation: 'fake_progressInformation'
  };

  describe('Services: splash', function () {

    var splash,
      modal;

    var modalMock = {};
    var modalInstance = {};

    // Load the service and the (mocked) service it depends upon
    beforeEach(module('exdFrontendApp'));
    beforeEach(module(function ($provide) {
      $provide.value('$uibModal', modalMock);
    }));
    beforeEach(inject(function (_splash_, _$uibModal_) {
      splash = _splash_;
      modal = _$uibModal_;

      modalInstance.close = jasmine.createSpy('close');
      modal.open = jasmine.createSpy('open').and.returnValue(modalInstance);
    }));

    it('should set spin to true', function () {
      expect(splash.spin).toBe(true);
    });

    it('should call modal open', function () {
      splash.open();
      expect(modal.open).toHaveBeenCalled();
      expect(modalInstance.close).not.toHaveBeenCalled();

      modal.open.calls.reset();
      modalInstance.close.calls.reset();

      splash.open();
      expect(modal.open).toHaveBeenCalled();
      expect(modalInstance.close).toHaveBeenCalled();
    });

    it('should call the observer when setting a message', function () {
      var callbackOnMessage = jasmine.createSpy('callbackOnMessage');
      splash.open();
      splash.setObserver(callbackOnMessage);
      splash.setMessage(exampleMessage);
      expect(callbackOnMessage).toHaveBeenCalled();
    });

    it('should do nothing without an observer when setting a message', function () {
      // we expect that no exception will be thrown here
      splash.setMessage(exampleMessage);
    });

    it('should test that close is not throwing an exception when open was called', function() {
      var callbackOnClose = jasmine.createSpy('callbackOnClose');
      spyOn(console, 'error');
      splash.open(false, callbackOnClose);
      splash.close();
      expect(callbackOnClose).toHaveBeenCalled();

      splash.open(true, callbackOnClose);
      splash.close();
      expect(callbackOnClose.calls.count()).toBe(2);

      splash.open(true, undefined);
      splash.close();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should support multiple calls of splash.close()', function() {
      splash.open(false, function() {});
      splash.close();
      splash.close();
    });


  });

  describe('Controller: ModalInstanceCtrl', function () {

    var $timeout,
      scope,
      log,
      splash,
      Ctrl;

    beforeEach(module('exd.templates'));
    beforeEach(module('exdFrontendApp'));
    beforeEach(inject(function ($rootScope, _$log_, _splash_, $controller, _$timeout_) {
      scope = $rootScope.$new();
      log = _$log_;
      splash = _splash_;
      $timeout = _$timeout_;
      spyOn(splash, 'setObserver');
      spyOn(log, 'error');
      spyOn(scope, '$apply');

      Ctrl = $controller('ModalInstanceCtrl', {
        $scope: scope
      });
    }));

    it('should initialize the object properly', function () {
      expect(scope.headline).toBe('');
      expect(scope.subHeadline).toBe('');
      expect(splash.setObserver).toHaveBeenCalled();
    });

    it('should log if the message format in the callback is wrong', function () {
      // call the registered callback function
      splash.setObserver.calls.mostRecent().args[0]('wrong format');
      expect(log.error).toHaveBeenCalled();
    });

    it('should update the scope when receiving a well-defined message', function () {

      var prepareSpiesAndSetUpTest = function(messageToTestWith) {
        // call the registered callback function
        splash.setObserver.calls.mostRecent().args[0](messageToTestWith);
        $timeout.flush();
      };

      prepareSpiesAndSetUpTest(exampleMessage);

      expect(scope.headline).toEqual(exampleMessage.headline);
      expect(scope.subHeadline).toEqual(exampleMessage.subHeadline);
      expect(scope.progressInformation).toEqual(exampleMessage.progressInformation);
      expect(scope.spin).toBe(true);

      var shortButWellDefinedMessageWithHeadline = { headline: 'some_fake_headline'};
      splash.spin = false;
      prepareSpiesAndSetUpTest(shortButWellDefinedMessageWithHeadline);

      expect(scope.headline).toEqual(shortButWellDefinedMessageWithHeadline.headline);
      expect(scope.subHeadline).toEqual('');
      expect(scope.progressInformation).toEqual('');
      expect(scope.spin).toBe(false);

      var shortButWellDefinedMessageWithSubHeadline = { subHeadline: 'some_fake_sub_headline'};
      prepareSpiesAndSetUpTest(shortButWellDefinedMessageWithSubHeadline);
      expect(scope.headline).toEqual('');
      expect(scope.subHeadline).toEqual(shortButWellDefinedMessageWithSubHeadline.subHeadline);
      expect(scope.progressInformation).toEqual('');

    });

    it('should call the splash close function on close', function () {
      spyOn(splash, 'close');
      scope.close();
      expect(splash.close).toHaveBeenCalled();
    });


  });
}());
