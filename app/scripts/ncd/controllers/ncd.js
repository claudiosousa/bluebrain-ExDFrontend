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
      $scope.data = {
          blueprint: null,
          pynnscript: null
      };

      $scope.input = {
          blueprint: {
              contentType: 'application/json',
              // TODO(swen): change mime-type to the one below once it is
              //             registered.
              // contentType: 'application/vnd.bbp.ncdblueprint.json',
              entity: null
          },
          pynnscript: {
              contentType: 'text/x-python',
              entity: null
          }
      };

      $scope.updatePynnscript = function(data){
        if(data === ''){
          $scope.data.pynnscript = '';
        }
        else{
          // TODO(swen): check if data is acutally a valid python file
          $scope.data.pynnscript = data;
        }
      };

      $scope.updateBlueprint = function(data){
        if(data === ''){
          // file is empty but since it was loaded it is actually the right
          // type. So we just assign an empty object to data.
          // TODO(swen): maybe this is the right place to initialize the
          // blueprint with the obligatory entries.
          $scope.data.blueprint = {};
        }
        else{
          // TODO(swen): check if data is acutally a valid blueprint
          $scope.data.blueprint = data;
        }
      };

      $scope.onEntityIdChange = function(datafield, newUuid){
        // skip if its not a string (which is the case e.g. right after loading
        // the page)
        if(typeof newUuid === 'string'){
          if(datafield === 'blueprint'){
            hbpFileStore.getContent(newUuid).then($scope.updateBlueprint);
          }
          else {
            hbpFileStore.getContent(newUuid).then($scope.updatePynnscript);
          }
        }
      };
      // unfortunately we have to wrap our listener into another function
      // because otherwise we cannot spy on 'onEntityIdChange'. The reason for
      // this is that $watch saves the function before it is overwritten by the
      // spy.
      $scope.$watch('input.blueprint.entity._uuid', function(newId){
        $scope.onEntityIdChange('blueprint', newId);
      });
      $scope.$watch('input.pynnscript.entity._uuid', function(newId){
        $scope.onEntityIdChange('pynnscript', newId);
      });
    });
}());
