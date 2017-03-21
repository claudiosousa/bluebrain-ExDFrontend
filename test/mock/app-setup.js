/**
 * Make sure that debugging information is availbakle in the unit testing
 */
(function() {
    'use strict';

    angular.module('exdFrontendApp')
     .config(['$compileProvider', '$logProvider', 'environmentServiceProvider',
      function($compileProvider, $logProvider) {
        $compileProvider.debugInfoEnabled(true);
        $logProvider.debugEnabled(true);
      }
    ]);

})();