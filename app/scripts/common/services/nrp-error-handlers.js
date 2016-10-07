(function() {
  'use strict';

  var module = angular.module('nrpErrorHandlers', ['hbpCommon', 'nrpAngulartics', 'ui.bootstrap.modal']);

  module.service('nrpErrorService', function () {
    var NrpError = function () {
      this.title = 'Error';
      this.label = 'OK';
      this.template = 'An error occured. Please try again later.';
    };
    return {
      getBasicError: function(){
        return new NrpError();
      },
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
        var error = new NrpError();
        if (response) {
          error.code = response.status;
          var errorSource = response.data;
          if (errorSource) {
            // The error is, or contains, an HTML message that was not
            // necessarily written by our back-end
            // (e.g., 'Bad Gateway Error')
            error.template = errorSource; // default value of the displayed error message
            var message;
            if (typeof(errorSource) === 'string') {
              // It could be an nginx 'Bad Gateway Error'
              message = errorSource;
            } else {
              message = errorSource.message;
            }
            var titleNodeContent = this.getHtmlTitle(message);
            if (!_.isNull(titleNodeContent)) {
              error.template = titleNodeContent;
              // If the error message is a default ngninx message,
              // it may contain HTML code with useful information
              var nginxString = this.getNginxString(message);
              if (!_.isNull(nginxString)) {
                 error.template = error.template + ' (' + nginxString + ').';
              }
            }
            if (errorSource.type && errorSource.message) {
              // The error was formatted by our back-end python code
              error.title = errorSource.type;
              if (_.isNull(titleNodeContent)) {
                error.template = errorSource.message;
              }
            }
            else if (errorSource.status === 400) {
              error.template = 'The request could not be understood by the server';
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
    'nrpAnalytics',
    '$log',
    function(
      nrpErrorService,
      hbpDialogFactory,
      nrpAnalytics,
      $log
    ) {
      var filter = function(response) {
        if (response) {
          // we ignore errors due to GET requests on  unvailaible servers
          if (response.status === 0) {
            return false;
          }
          // we ignore errors due to transfer function updates as they are caught by a
          // dedicated ROS topic
          if (response.data && response.data.type === "Transfer function error") {
            return false;
          }
        }
        return true;
      };

      var display = function(response, keepErrorMessage) {
        response = angular.extend({
            human_readable: nrpErrorService.httpError(response).template
          },
          response
        );
        if (filter(response)) {
          $log.error(response);
          var nrpError = nrpErrorService.getBasicError();

          var errorSource = response.data;
          if(keepErrorMessage){
            nrpError.template = response.human_readable;
          }
          if (errorSource) {
            if (errorSource.message.toLowerCase().indexOf("recoverable") !== -1) {
              /// failure is presumably a Xvfb_Xvn_Error
              nrpError.template = "Job allocation failed. Please try again.";
            }
          }

          hbpDialogFactory.alert(nrpError);
          var code = "No code", template = "No template";
          if (_.isObject(nrpError)) {
            code = nrpError.code || code;
            template = nrpError.template || template;
          }
          nrpAnalytics.eventTrack(code, {
            category: 'Error',
            label: template
          });
        }
        else {
          $log.debug(response);
        }
      };

      return {
        filter: filter,
        display: display
      };
    }]);
}());
