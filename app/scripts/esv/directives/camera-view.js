(function() {
    'use strict';

    angular.module('exdFrontendApp')
        .directive('cameraView', [
            '$http',
            '$log',
            'gz3d',
            'videoStreamService',
            'STREAM_URL',
            'STATE',
            'stateService',
            function($http, $log, gz3d, videoStreamService, STREAM_URL, STATE, stateService) {

                //if the video stream for the camera view topic is available, we use the full url to stream the video
                //if the video stream is not available, we'll hide the UI button that toggles the client/server view
                var videoStreamingUrls = videoStreamService.getStreamUrls()
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
                            return scope.showServerStream ? scope.videoUrl + '&t=' + stateService.currentState + reconnectTrials : '';
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
                            var cameraHelper = gz3d.scene.viewManager.getViewByName(scope.cameraName).camera.cameraHelper;
                            if (angular.isDefined(cameraHelper)) {
                                cameraHelper.visible = scope.showFrustum;
                            }
                        };
                    }
                };
            }
        ]);
}());