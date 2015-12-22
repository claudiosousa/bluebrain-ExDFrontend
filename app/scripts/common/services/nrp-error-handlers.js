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

      getHtmlTitle: function(errorMessage) {
        var htmlRegExp = /^[\s\S]*(<html>[\s\S]*<\/html>)/gm;
        var matches = htmlRegExp.exec(errorMessage);
        if (matches) {
          var doc = document.createElement('div');
          doc.innerHTML = matches[1];
          var titleNode = doc.getElementsByTagName('title')[0];
          if (titleNode) {
            return titleNode.innerHTML;
          }
        }
        return null;
      },
      getNginxString: function(errorMessage) {
        var ngninxRegExp = /^[\s\S]*<center>(nginx[\s\S]*)<\/center>/gm;
        var matches = ngninxRegExp.exec(errorMessage);
        if (matches) {
          return matches[1];
        }
        return null;
      },
      httpError: function (response) {
        var error = new NrpError({ code: undefined });
        if (response) {
          error.code = response.status;
          var errorSource = response.data;
          if (errorSource) {
            // The error is, or contains, an HTML message that was not
            // necessarily written by our back-end
            // (e.g., 'Bad Gateway Error')
            var titleNodeContent = this.getHtmlTitle(errorSource.message);
            if (!_.isNull(titleNodeContent)) {
              error.template = titleNodeContent;
            }
            if (errorSource.type && errorSource.message) {
              // The error was formatted by our back-end python code
              error.title = errorSource.type;
              // If the error message is a default ngninx message,
              // it may contain HTML code with useful information
              if (!_.isNull(titleNodeContent)) {
                var nginxString = this.getNginxString(errorSource.message);
                if (!_.isNull(nginxString)) {
                  error.template = error.template + ' (' + nginxString + ').';
                }
              }
              else {
                error.template = errorSource.message;
              }
            }
            else if (errorSource.status === 400) {
              error.template = 'The request could not be understood by the server';
            }
            else {
              error.template = errorSource;
            }
          }
        }
        return error;
      }
    };
  });

  module.factory('serverError', [
    'nrpErrorService',
    'hbpDialogFactory',
    function(
      nrpErrorService,
      hbpDialogFactory
    ) {
      var filter = function(response) {
        if (response) {
          // we ignore errors due to GET requests on  unvailaible servers
          if (response.status === 0) {
            return false;
          }
          // we ignore errors due to transfer function updates as they are catched by a
          // dedicated ROS topic
          if (response.data && response.data.type === "Transfer function error") {
            return false;
          }
        }
        return true;
      };

      var display = function(response) {
        if (filter(response)) {
          hbpDialogFactory.alert(nrpErrorService.httpError(response));
        }
      };

      return {
        filter: filter,
        display: display
      };
    }]);
}());
