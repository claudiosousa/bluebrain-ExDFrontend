/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 * https://www.humanbrainproject.eu
 *
 * The Human Brain Project is a European Commission funded project
 * in the frame of the Horizon2020 FET Flagship plan.
 * http://ec.europa.eu/programmes/horizon2020/en/h2020-section/fet-flagships
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END**/
(function() {
  'use strict';

  var module = angular.module('nrpErrorHandlers', ['nrpAngulartics', 'ui.bootstrap.modal', 'clb-ui-error']);

  module.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push(['$q', function($q) {
      return {
        'responseError': function(error, a, b) {
          var server = error.config.url.match(/\/\/([^:/]*)/);
          error.server = server && server[1];
          return $q.reject(error);
        }
      };
    }]);
  }]);

  module.service('nrpErrorService', function() {
    var NrpError = function() {
      this.title = 'Error';
      this.label = 'OK';
      this.message = 'An error occured. Please try again later.';
    };
    return {
      getBasicError: function() {
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
      httpError: function(response) {
        var error = new NrpError();
        if (response) {
          error.code = response.status;
          var errorSource = response.data;
          if (errorSource) {
            // The error is, or contains, an HTML message that was not
            // necessarily written by our back-end
            // (e.g., 'Bad Gateway Error')
            error.message = errorSource; // default value of the displayed error message
            var message;
            if (typeof (errorSource) === 'string') {
              // It could be an nginx 'Bad Gateway Error'
              message = errorSource;
            } else {
              message = errorSource.message;
            }
            var titleNodeContent = this.getHtmlTitle(message);
            if (!_.isNull(titleNodeContent)) {
              error.message = titleNodeContent;
              // If the error message is a default ngninx message,
              // it may contain HTML code with useful information
              var nginxString = this.getNginxString(message);
              if (!_.isNull(nginxString)) {
                error.message = error.message + ' (' + nginxString + ').';
              }
            }
            else {
              error.message = message;
            }
            if (errorSource.type && errorSource.message) {
              // The error was formatted by our back-end python code
              error.title = errorSource.type;
              if (_.isNull(titleNodeContent)) {
                error.stack = errorSource.message;
              }
            }
            else if (errorSource.status === 400) {
              error.message = 'The request could not be understood by the server';
            }
          }
        }
        return error;
      }
    };
  });

  module.constant('NO_CLUSTER_AVAILABLE_ERR_MSG', 'No resources available on the cluster. Please try again later.');

  module.factory('serverError', [
    'nrpErrorService',
    'clbErrorDialog',
    'nrpAnalytics',
    '$log',
    '$q',
    'NO_CLUSTER_AVAILABLE_ERR_MSG',
    function(
      nrpErrorService,
      clbErrorDialog,
      nrpAnalytics,
      $log,
      $q,
      NO_CLUSTER_AVAILABLE_ERR_MSG
    ) {
      var filter = function(response) {
        if (response) {
          // we ignore errors due to GET requests on unavailable servers
          if (response.status === 0) {
            return false;
          }
          // we ignore errors due to transfer function and state machines updates as they are caught by a
          // dedicated ROS topic
          if (response.data) {
            if(response.data.type === "Transfer function error" || response.data.type === "State machine error" || response.data.type === "Duplicate name error") {
              return false;
            }
          }
        }
        return true;
      };

      var displayError = function(nrpError) {
        clbErrorDialog.open(nrpError);

        // record the error in the analytics
        var code = "No code", message = "No template";
        if (_.isObject(nrpError)) {
          code = nrpError.code || code;
          message = nrpError.message || message;
        }
        nrpAnalytics.eventTrack(code, {
          category: 'Error',
          label: message
        });
      };

      var displayHTTPError = function(response, keepErrorMessage) {
        response = angular.extend({
          human_readable: nrpErrorService.httpError(response).message
        },
          response
        );
        if (filter(response)) {
          $log.error(response);
          var nrpError = nrpErrorService.getBasicError();

          var errorSource = response.data;
          if (keepErrorMessage) {
            nrpError.message = response.human_readable;
          }
          if (errorSource){
            nrpError.type = errorSource.type;
            if (errorSource.data){
              nrpError.data = errorSource.data;
            }
            if (errorSource.message) {
              if (errorSource.message.toLowerCase().indexOf("recoverable") !== -1) {
                /// failure is presumably a Xvfb_Xvn_Error
                nrpError.message = "Job allocation failed. Please try again.";
              }
              if (errorSource.message.toLowerCase().indexOf('no resources available') !== -1) {
                /// failure is presumably a lack of available resources on the cluster
                nrpError.message = NO_CLUSTER_AVAILABLE_ERR_MSG;
              }
            }
          }

          response.server && (nrpError.message += ' (host: ' + response.server + ')');

          // display the parsed http error
          displayError(nrpError);
        }
        else {
          $log.debug(response);
        }
        return $q.reject(response);
      };

      return {
        filter: filter,
        displayHTTPError: displayHTTPError,
        displayError: displayError
      };
    }]);
}());
