(function() {
  'use strict';

  var module = angular.module('nrpErrorHandlers', ['hbpCommon']);

  module.service('nrpErrorService', function () {
    var NrpError = function (options) {
      options = angular.extend({
        title: 'Error',
        label: 'OK',
        template: 'An unknown error occured.'
      }, options);
      this.title = options.title;
      this.label = options.label;
      this.template = options.template;
    };
    return {
      httpError: function (response) {
        var error = new NrpError({ code: response.status });
        if (response.data) {
          var errorSource = response.data;
          // Error is coming from our backend python code
          if (errorSource.type  && errorSource.message) {
            error.title = errorSource.type;
            error.template = errorSource.message;
          }
          else if (errorSource.status === 400) {
            error.template = 'The request could not be understood by the server';
          }
          else {
            error.template = errorSource;
          }
        }
        return error;
      }
    };
  });

  module.factory('serverError', ['nrpErrorService', 'hbpDialogFactory', function(nrpErrorService, hbpDialogFactory) {
    return function(response) {
      if (response && response.status === 0) {
        return; // no notification in case of unavailable servers
      }
      hbpDialogFactory.alert(nrpErrorService.httpError(response));
    };
  }]);
}());
