/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
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
 * ---LICENSE-END **/
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
