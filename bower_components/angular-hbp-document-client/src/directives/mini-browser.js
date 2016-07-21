(function(){
  'use strict';

  angular.module('hbpDocumentClient.ui')

    /*
     * This directive represents a small file browser with the capacity to register a callback for file selection
     */
    .directive('hbpMiniBrowser', function(hbpEntityStore, hbpProjectStore) {
      return {
        restrict: 'E',
        templateUrl: 'templates/mini-browser.html',
        scope: {
          selection: '&hbpSelection',
          selectable: '&hbpSelectable',
          browsable: '&hbpBrowsable',
          hovered: '&hbpHovered',
          entity: '=hbpCurrentEntity'
        },
        controller: function ($scope, $q) {

          // loads the entity child
          function getChildren(entity, options) {
            var root = !entity;
            var opts = _.extend({}, options);
            var writeOpts = _.extend({}, options, { access: 'write', from: null, pageSize: 0 });

            if(root) {
              return $q.all({
                  all: hbpProjectStore.getAll(opts),
                  write: hbpProjectStore.getAll(writeOpts)
                }).then( function(res) {
                  var writeProjects = _.pluck(res.write.result, '_uuid');
                  // add current users permissions to entities
                  _.forEach(res.all.result, function(project) {
                      project.canRead = true;
                      project.canWrite = writeProjects.indexOf(project._uuid) !== -1;
                  });

                  return {
                    list: res.all.result,
                    hasNext: res.all.hasMore
                  };
                });

            } else {
              // there is a parent, we display it's children
              return hbpEntityStore.getChildren(entity).then(function(res){
                return {
                  list: res.result,
                  hasNext: res.hasMore
                };
              });
            }
          }

          function initCurrentEntity(root, entity, children) {
            return {
              root: root,
              entity: entity || null,
              children: children || {}
            };
          }

          // Loads the current entity parent's children
          $scope.back = function (event) {
            event.preventDefault();

            if(!$scope.currentEntity.root) {
              var parent = $scope.currentEntity.entity._parent;
              if(parent) {

                $scope.currentEntity = initCurrentEntity(false);

                // there is a parent, we display it's children
                hbpEntityStore.get(parent).then(function(entity) {
                  $scope.currentEntity.entity = entity;
                  getChildren(entity).then(function(result) {
                    $scope.currentEntity.children = result;
                  });
                });

              } else {
                // otherwise we display the list of root entities
                $scope.currentEntity = initCurrentEntity(true);
                getChildren().then(function(result) {
                  $scope.currentEntity.children = result;
                });
              }
            }
          };

          // Loads current entity's children
          $scope.browseTo = function (child, event) {
            event.preventDefault();

            $scope.currentEntity = initCurrentEntity(false, child);

            getChildren(child).then(function(result) {
              $scope.currentEntity.children = result;
            });
          };

          $scope.loadMore = function () {
            var lastId = $scope.currentEntity.children.list[$scope.currentEntity.children.list.length - 1]._uuid;
            var addToCurrentEntity = function(res) {
              // remove the first element of the new page to avoid duplicate
              res.list.shift();
              // add new page to previous children list
              Array.prototype.push.apply($scope.currentEntity.children.list, res.list);

              $scope.currentEntity.children.hasNext = res.hasNext;
            };

            getChildren($scope.currentEntity.entity, {from: lastId}).then(addToCurrentEntity);
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
            if(angular.isFunction($scope.hovered())) {
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

          // initialize current entity with provided entity if any
          if ($scope.entity && $scope.entity._parent) {
            $scope.currentEntity = initCurrentEntity(false, {
              _uuid: $scope.entity._parent
            });
            // load all info
            hbpEntityStore.get($scope.currentEntity.entity._uuid).then(function(entity) {
              $scope.currentEntity.entity = entity;
              //load entity children
              getChildren(entity).then(function(result) {
                $scope.currentEntity.children = result;
              });
            });
          } else {
            // init empty currentEntity
            $scope.currentEntity = initCurrentEntity(true);
            // load root children (== all projects)
            getChildren().then(function(result) {
              $scope.currentEntity.children = result;
            });
          }
        }
      };
    });
}());
