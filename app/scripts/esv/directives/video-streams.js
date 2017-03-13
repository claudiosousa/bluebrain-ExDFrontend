(function() {
    'use strict';

    angular.module('exdFrontendApp')
        .directive('videoStreams', ['$timeout', 'videoStreamService', 'STATE', 'stateService',
            function($timeout, videoStreamService, STATE, stateService) {

                return {
                    templateUrl: 'views/esv/video-streams.html',
                    restrict: 'E',
                    replace: true,
                    scope: {
                        toggleVisibility: '&',
                        ngShow: '=?'
                    },
                    link: function(scope, element) {
                        scope.STATE = STATE;
                        scope.stateService = stateService;

                        scope.loadVideoStreams = function(){
                            videoStreamService.getStreamUrls()
                                .then(function(videoStreams) {
                                    scope.videoStreams = videoStreams;
                                });
                        };

                        var reconnectTrials = 0;
                        scope.showVideoStream = function(url) {
                            reconnectTrials++;
                            scope.videoUrl = url ? url + '&t=' + reconnectTrials : '';
                        };

                        //refresh if the directive becomes visible
                        scope.$watch('ngShow', function(){
                            if (scope.ngShow)
                                scope.loadVideoStreams();
                        });
                    }
                };
            }
        ]);
}());
