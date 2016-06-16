(function () {
  'use strict';

  // this controller is used in the /externalView/:externalView route
  // it aims at showing an external resource (url) within a webpage of ours
  // the business need is that we want to show in the collab external resources
  //      (ie the videos tutorial: http://neurorobotics.net/fileadmin/platform/videotutorial/index.html)
  // but we can't because that domain is not whitelisted in the platform.
  angular.module('exdFrontendApp')
    .controller('externalViewCtrl', ['$sce', '$scope','$stateParams', 'bbpConfig',
      function ($sce, $scope, $stateParams, bbpConfig) {
        //collab.externalViews is expected in the configuration file
        //example: of config
        //"collab":{
        //    "externalViews":{
        //        "videotutorial": "http://neurorobotics.net/fileadmin/platform/videotutorial/index.html"
        //    }
        //}
        var externalViews = bbpConfig.get('collab.externalViews');
        $scope.srcUrl = $sce.trustAsResourceUrl(externalViews[$stateParams.externalView]);
      }]);
} ());