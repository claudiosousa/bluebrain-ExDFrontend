(function() {
  'use strict';

  var module = angular.module('nrpErrorHandlers', ['hbpCommon']);

  module.factory('serverError', ['hbpErrorService', 'hbpDialogFactory', function(hbpErrorService, hbpDialogFactory) {
    return function(response) {
      hbpDialogFactory.error(hbpErrorService.httpError(response));
    };
  }]);
}());
