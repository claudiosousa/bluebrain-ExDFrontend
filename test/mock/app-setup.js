/**
 * Make sure that debugging information is availbakle in the unit testing
 */
(function() {
  'use strict';

  angular.module('exdFrontendApp')
    .config(['$compileProvider', '$logProvider',
      function($compileProvider, $logProvider) {
        $compileProvider.debugInfoEnabled(true);
        $logProvider.debugEnabled(true);
      }
    ])
    .run(['$httpBackend', function($httpBackend) {
      if (!$httpBackend.whenGET) {
        return;
      }

      $httpBackend.whenGET(/\/api\/user\/me$/)
        .respond({
          id: 'vonarnim',
          username: 'cmartins',
          displayName: 'Claudio Sousa'
        });

      $httpBackend.whenGET(/\/api\/user\/me\/groups$/).respond({ result: ['hbp-sp10-user-edit-rights'] });
    }]);

})();