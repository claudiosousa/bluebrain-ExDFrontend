(function() {
    'use strict';

    angular.module('exdFrontendApp')
        .constant('STREAM_URL', 'stream?topic=')
        .directive('cameraView', [
            '$http',
            '$log',
            'gz3d',
            'simulationInfo',
            'STREAM_URL',
            'STATE',
            'stateService',
            function($http, $log, gz3d, simulationInfo, STREAM_URL, STATE, stateService) {

                if (!simulationInfo.serverConfig.gzweb.videoStreaming) {
                    //usefull for 100% local migration only
                    $log.error('\'videoStreaming\' is missing in your proxy configuration');
                } else {

                    //here we want to get the list of available video streams, and transform them into valid urls
                    //if the video stream for the camera view topic is available, we use the full url to stream the video
                    //if the video stream is not available, we'll hide the UI button that toggles the client/server view
                    //Unfortunately, the closest we have to a list of available streams if the root html page for
                    //the web-video-server. Below we extract the urls from the page into an dictionary topic->url
                    var videoStreamingUrls = $http.get(simulationInfo.serverConfig.gzweb.videoStreaming)
                        .then(function(response) {
                            return _.reduce(
                                $(response.data)
                                    .find('li>a:first-child')
                                    .map(function(i, e) { return e.getAttribute('href').match(/\?topic=(.*)$/)[1]; })
                                    .toArray(),
                                function(obj, url) {
                                    obj[url] = simulationInfo.serverConfig.gzweb.videoStreaming + STREAM_URL + url;
                                    return obj;
                                },
                                {}
                            );
                        });
                }

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

                        videoStreamingUrls && videoStreamingUrls.then(function(urls) {
                            scope.videoUrl = urls[scope.topic];
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
} ());