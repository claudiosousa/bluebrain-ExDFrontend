(function () {
  'use strict';

  angular.module('exdFrontendApp')
    .service('isNotARobotPredicate', function () {
      return function (entity) {
        return entity.name.indexOf('robot') === -1;
      };
    });
})();