(function(){
  'use strict';

  angular.module('hbpDocumentClient')

    /*
     * This directive represents a small file browser with the capacity to register a callback for file selection
     */
    .directive('hbpMiniBrowser', ['hbpEntityStore', 'hbpProjectStore', function(hbpEntityStore, hbpProjectStore) {
      return {
        restrict: 'E',
        templateUrl: 'templates/mini-browser.html',
        link: function ($scope) {

          // loads the entity child
          $scope.getChildren = function(root) {
            $scope.currentEntity.children = {
              list: undefined,
            };
            if(root) {
              //bbpBrowserRest.getProjectsAndReleases(entities).then( function() {
              hbpProjectStore.getAll().then( function(res) {
                // add current users permissions to entities
                _.forEach(res.result, function(project) {
                  hbpEntityStore.getUserAccess(project).then(function(access) {
                    project.canRead = access.canRead;
                    project.canWrite = access.canWrite;
                    project.canManage = access.canManage;
                    // TODO: rewrite to entities.list[i].access = access
                  });
                });

                $scope.currentEntity.children = {
                  list: res.result,
                  hasNext: res.hasMore
                };
              });

            } else {
              // there is a parent, we display it's children
              hbpEntityStore.getChildren($scope.currentEntity.entity).then(function(res){
                $scope.currentEntity.children = {
                  list: res.result,
                  hasNext: res.hasMore
                };
              });
            }
          };

          // initialize current entity with provided entity if any
          if ($scope.entity && $scope.entity._parent) {
            $scope.currentEntity = {
              root: false,
              entity: {
                _uuid: $scope.entity._parent
              }
            };
            hbpEntityStore.get($scope.currentEntity.entity._uuid).then(function(entity) {
              $scope.currentEntity.entity = entity;
              $scope.getChildren(false);
            });
          } else {
            $scope.currentEntity = {
              root: true,
              entity: null
            };
            $scope.getChildren(true);
          }

          // Loads the current entity parent's children
          $scope.back = function (event) {
            event.preventDefault();

            if(!$scope.currentEntity.root) {
              if($scope.currentEntity.entity._parent) {

                // there is a parent, we display it's children
                hbpEntityStore.get($scope.currentEntity.entity._parent).then(function(entity) {
                  $scope.currentEntity.entity = entity;
                  $scope.getChildren(false);
                });

                $scope.currentEntity.entity = {};
                $scope.currentEntity.root = false;

              } else {
                // otherwise we display the list of root entities
                $scope.currentEntity.root = true;
                $scope.getChildren(true);
              }
            }
          };

          // Loads current entity's children
          $scope.browseTo = function (child, event) {
            event.preventDefault();

            $scope.currentEntity.root = false;
            $scope.currentEntity.entity = child;

            $scope.getChildren(false);
          };

          $scope.loadMore = function () {
            var lastId = $scope.currentEntity.children.list[$scope.currentEntity.children.list.length - 1]._uuid;
            var addToCurrentEntity = function(res) {
              // remove the first element of the new page to avoid duplicate
              res.result.shift();
              // add new page to previous children list
              Array.prototype.push.apply($scope.currentEntity.children.list, res.result);

              $scope.currentEntity.children.hasNext = res.hasMore;
            };

            if($scope.currentEntity.root) {
              hbpProjectStore.getAll({from: lastId}).then(addToCurrentEntity);
            } else {
              hbpEntityStore.getChildren($scope.currentEntity.entity, {from: lastId}).then(addToCurrentEntity);
            }
          };

          // Calls the selection callback if defined
          $scope.select = function (entity, event) {
            event.preventDefault();
            if($scope.selection) {
              $scope.selection()(entity);
            }
          };
        
          // Calls the mouse-over callback if defined
          $scope.mouseOver = function (entity) {
            if(typeof $scope.hovered() === 'function') {
              $scope.hovered()(entity);
            }
          };

          $scope.isBrowsable = function (entity) {
            return $scope.browsable() ? $scope.browsable()(entity): (
              entity._entityType !== 'file' &&
              entity._entityType !== 'link:file'
            );
          };

          $scope.isSelectable = function(entity) {
            if($scope.selectable && $scope.selectable()) {
              return $scope.selectable()(entity);
            }
            return false;
          };
        },
        scope: {
          selection: '&hbpSelection',
          selectable: '&hbpSelectable',
          browsable: '&hbpBrowsable',
          hovered: '&hbpHovered',
          entity: '=hbpCurrentEntity'
        }

      };
    }]);
}());
