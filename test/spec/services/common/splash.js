(function () {
  'use strict';

  /* global _: false */

  // Define test data which we want to share across the tests
  var exampleMessage = {
    headline: 'fake_headline',
    subHeadline: 'fake_subHeadline',
    progressInformation: 'fake_progressInformation'
  };

  describe('Services: splash', function () {

    var splash,
      modal;

    // Load the service and the (mocked) service it depends upon
    beforeEach(module('exdFrontendApp'));
    beforeEach(inject(function (_splash_, _$modal_) {
      splash = _splash_;
      modal = _$modal_;
    }));

    it('should call modal open', function () {
      spyOn(modal, 'open');
      splash.open();
      expect(modal.open).toHaveBeenCalled();
    });

    it('should call the observer when setting a message', function () {
      var observerHasBeenCalled = false;
      splash.open();
      splash.setObserver(function () {
        observerHasBeenCalled = true;
      });
      splash.setMessage(exampleMessage);
      expect(observerHasBeenCalled).toBe(true);
    });

    it('should do nothing without an observer when setting a message', function () {
      // we expect that no exception will be thrown here
      splash.setMessage(exampleMessage);
    });

    it('should test that close is not throwing an exception when open was called', function() {
      splash.open();
      splash.close();
    });

  });

  describe('Controller: ModalInstanceCtrl', function () {

    var scope,
      log,
      splash,
      Ctrl;

    beforeEach(module('exdFrontendApp'));
    beforeEach(inject(function ($rootScope, _$log_, _splash_, $controller) {
      scope = $rootScope.$new();
      log = _$log_;
      splash = _splash_;

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
      splash.setObserver.mostRecentCall.args[0]('wrong format');
      expect(log.error).toHaveBeenCalled();
    });

    it('should update the scope when receiving a well-defined message', function () {
      spyOn(_, 'defer');
      scope.$apply = jasmine.createSpy('scope.$apply');

      var prepareSpiesAndSetUpTest = function(messageToTestWith) {
        _.defer.reset();
        scope.$apply.reset();

        // call the registered callback function
        splash.setObserver.mostRecentCall.args[0](messageToTestWith);
        expect(_.defer).toHaveBeenCalled();
        _.defer.mostRecentCall.args[0]();

        expect(scope.$apply).toHaveBeenCalled();
        scope.$apply.mostRecentCall.args[0]();
      };

      prepareSpiesAndSetUpTest(exampleMessage);

      expect(scope.headline).toEqual(exampleMessage.headline);
      expect(scope.subHeadline).toEqual(exampleMessage.subHeadline);
      expect(scope.progressInformation).toEqual(exampleMessage.progressInformation);

      var shortButWellDefinedMessageWithHeadline = { headline: 'some_fake_headline'};
      prepareSpiesAndSetUpTest(shortButWellDefinedMessageWithHeadline);

      expect(scope.headline).toEqual(shortButWellDefinedMessageWithHeadline.headline);
      expect(scope.subHeadline).toEqual('');
      expect(scope.progressInformation).toEqual('');

      var shortButWellDefinedMessageWithSubHeadline = { subHeadline: 'some_fake_sub_headline'};
      prepareSpiesAndSetUpTest(shortButWellDefinedMessageWithSubHeadline);
      expect(scope.headline).toEqual('');
      expect(scope.subHeadline).toEqual(shortButWellDefinedMessageWithSubHeadline.subHeadline);
      expect(scope.progressInformation).toEqual('');

    });

  });
}());
