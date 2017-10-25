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

  angular.module('exdFrontendApp').directive('cameraView', [
    '$http',
    '$log',
    'gz3d',
    'videoStreamService',
    'STREAM_URL',
    'STATE',
    'stateService',
    function(
      $http,
      $log,
      gz3d,
      videoStreamService,
      STREAM_URL,
      STATE,
      stateService
    ) {
      //if the video stream for the camera view topic is available, we use the full url to stream the video
      //if the video stream is not available, we'll hide the UI button that toggles the client/server view
      var videoStreamingUrls = videoStreamService
        .getStreamUrls()
        .then(function(topics) {
          return _.keyBy(topics, 'url');
        });

      return {
        templateUrl: 'views/esv/camera-view.html',
        restrict: 'E',
        scope: {
          topic: '@',
          cameraName: '@'
        },
        link: function(scope) {
          scope.STATE = STATE;
          scope.stateService = stateService;
          scope.showFrustum = false;
          scope.showServerStream = false;
          var reconnectTrials = 0;

          scope.getVideoUrlSource = function() {
            return scope.showServerStream
              ? scope.videoUrl +
                  '&t=' +
                  stateService.currentState +
                  reconnectTrials
              : '';
          };

          videoStreamingUrls.then(function(urls) {
            scope.videoUrl = urls[scope.topic] && urls[scope.topic].fullUrl;
          });

          scope.toggleServerStream = function() {
            scope.showServerStream = !scope.showServerStream;
            reconnectTrials++;
          };

          scope.onShowFrustumChanged = function() {
            scope.showFrustum = !scope.showFrustum;
            var cameraHelper = gz3d.scene.viewManager.getViewByName(
              scope.cameraName
            ).camera.cameraHelper;
            if (angular.isDefined(cameraHelper)) {
              cameraHelper.visible = scope.showFrustum;
            }
          };
        }
      };
    }
  ]);
})();
