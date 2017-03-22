(function() {
  'use strict';

  angular.module('exdFrontendApp')
    .constant('STREAM_URL', 'stream?topic=')
    .service('videoStreamService', ['$q', '$log', '$http', 'simulationInfo', 'STREAM_URL',
      function($q, $log, $http, simulationInfo, STREAM_URL) {

        return {
          getStreamUrls: getStreamUrls
        };

        function getStreamUrls() {
          if (!simulationInfo.serverConfig.gzweb || !simulationInfo.serverConfig.gzweb.videoStreaming) {
            //usefull for 100% local migration only
            $log.error('\'videoStreaming\' is missing in your proxy configuration');
            return $q.reject();
          }

          //here we want to get the list of available video streams, and transform them into valid urls
          //unfortunately, the closest we have to a list of available streams if the root html page for
          //the web-video-server. Below we extract the urls from the page into an dictionary topic->url
          return $http.get(simulationInfo.serverConfig.gzweb.videoStreaming)
            .then(function(response) {
              return $(response.data)
                .find('li>a:first-child')
                .map(function(i, e) {
                  var url = e.getAttribute('href').match(/\?topic=(.*)$/)[1];
                  return {
                    url: url,
                    fullUrl: simulationInfo.serverConfig.gzweb.videoStreaming + STREAM_URL + url
                  };
                })
                .toArray();
            });
        }

      }]
    );
}());
