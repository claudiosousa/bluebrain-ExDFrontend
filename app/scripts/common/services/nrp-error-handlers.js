(function() {
  'use strict';

  var module = angular.module('nrpErrorHandlers', ['hbpCommon']);

  module.factory('serverError', ['hbpErrorService', 'hbpDialogFactory', function(hbpErrorService, hbpDialogFactory) {
    return function(response) {
      if (response.status === 0) {
        return; // no notification in case of unavailable servers
      }
      hbpDialogFactory.error(hbpErrorService.httpError(response));
    };
  }]);
}());
