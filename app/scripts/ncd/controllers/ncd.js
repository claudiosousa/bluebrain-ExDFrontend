(function(){
  'use strict';

  /**
   * @ngdoc function
   * @name exdFrontendApp.controller:NcdCtrl
   * @description
   * # NcdCtrl
   * Controller for the neural circuit designer
   */
  angular.module('exdFrontendApp')
    .controller('NcdCtrl', function ($scope, $state, hbpFileStore) {
      // save the state object for use in the navbar
      $scope.$state = $state;

      // the blueprint variable will save the data
      // which is used to create a neural network
      // basically all the manipulations will be done
      // on this, for example blueprints see:
      // test/data/ncd
      $scope.blueprint = null;
      $scope.input = {
        contentType: 'application/json',
        entity: null
      };

      $scope.updateBlueprint = function(data){
        if(data === ''){
          // file is empty but since it was loaded it is actually the right
          // type. So we just assign an empty object to data.
          // TODO(swen): maybe this is the right place to initialize the
          // blueprint with the obligatory entries.
          $scope.blueprint = {};
        }
        else{
          // TODO(swen): check if data is acutally a valid blueprint
          $scope.blueprint = data;
        }
      };

      $scope.onEntityIdChange = function(newUuid){
        // skip if its not a string (which is the case e.g. right after loading
        // the page)
        if(typeof newUuid === 'string'){
          hbpFileStore.getContent(newUuid).then($scope.updateBlueprint);
        }
      };

      // unfortunately we have to wrap our listener into another function
      // because otherwise we cannot spy on 'onEntityIdChange'. The reason for
      // this is that $watch saves the function before its overwritten by the
      // spy.
      $scope.$watch('input.entity._uuid', function(newId){
        $scope.onEntityIdChange(newId);
      });
    });
}());
