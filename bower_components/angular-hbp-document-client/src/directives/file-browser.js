(function() {
  'use strict';

  angular.module('hbpDocumentClient.ui')
  .directive('hbpFileBrowser', hbpFileBrowser)
  .directive('hbpFileBrowserPath', hbpFileBrowserPath)
  .directive('hbpFileBrowserFolder', hbpFileBrowserFolder);

  ///////////////

  /**
   * @namespace hbpFileBrowser
   * @desc
   * hbpFileBrowser Directive
   *
   * This directive renders a file browser. It accepts the following
   * attributes:
   *
   * - root: the root entity for the current browser. If root is null,
   * it will load all the visible projects.
   * - [entity]: the current entity that should be displayed.
   *
   * @example
   * <hbp-file-browser root="someProjectEntity"
   *                   entity="someSubFolderEntity">
   * </hbp-file-browser>
   *
   * @memberof hbpDocumentClient.ui
   */
  function hbpFileBrowser() {
    return {
      restrict: 'E',
      scope: {
        entity: '=?',
        root: '='
      },
      templateUrl: 'templates/file-browser.html',
      link: hbpFileBrowserLink,
      controllerAs: 'browserView',
      controller: FileBrowserViewModel
    };
  }

  /**
   * @namespace hbpFileBrowserFolder
   * @desc
   * hbpFileBrowserFolder directive is a child directive of
   * hbpFileBrowser that render a folder item within the file browser view.
   *
   * Available attributes:
   * - hbp-file-browser-folder: the folder entity
   * - [hbp-file-browser-folder-icon]: a class name to display an icon
   * - [hbp-file-browser-folder-icon]: a label name (default to folder._name)
   *
   * @example
   * <!-- minimal -->
   * <div hbp-file-browser-folder="folderEntity"></div>
   * <!-- all wings out -->
   * <div hbp-file-browser-folder="folderEntity"
   *      hbp-file-browser-folder-icon="fa fa-level-up"
   *      hbp-file-browser-label="up"></div>
   *
   * @memberof hbpDocumentClient.ui.hbpFileBrowser
   */
  function hbpFileBrowserFolder() {
    return {
      restrict: 'A',
      require: '^hbpFileBrowser',
      templateUrl: 'templates/file-browser-folder.html',
      scope: {
        folder: '=hbpFileBrowserFolder',
        folderIcon: '@hbpFileBrowserFolderIcon',
        folderLabel: '@hbpFileBrowserFolderLabel'
      },
      link: function(scope, element, attrs, ctrl) {
        // make the parent directive controller available in the scope
        scope.browserView = ctrl;
      }
    };
  }

  /**
   * @namespace hbpFileBrowserPath
   * @desc
   * hbpFileBrowserPath directive is a child of hbpFileBrowser directive
   * that renders the breadcrumb according to the file browser setup.
   *
   * @example
   * <hbp-file-browser-path></hbp-file-browser-path>
   *
   * @memberof hbpDocumentClient.ui.hbpFileBrowser
   */
  function hbpFileBrowserPath(hbpEntityStore) {
    return {
      restrict: 'E',
      require: '^hbpFileBrowser',
      templateUrl: 'templates/file-browser-path.html',
      link: function(scope, element, attrs, ctrl) {
        var handleAncestors = function(ancestors) {
          scope.ancestors = ancestors;
        };

        var update = function() {
          hbpEntityStore.getAncestors(ctrl.currentEntity, ctrl.rootEntity)
          .then(handleAncestors, ctrl.setError);
        };

        scope.browserView = ctrl;

        scope.$watch('browserView.currentEntity', update);
      }
    };
  }

  /**
   * @private
   */
  function hbpFileBrowserLink(scope, elt, attrs, ctrl) {
    // run the init function once, when the root has been defined.
    // this ensure the main page is not loaded first with all projects,
    // then with the correct root.
    var delWaitForRootWatcher = scope.$watch('root', function(root) {
      if(angular.isUndefined(root)) {
        return;
      }
      ctrl.init(root, scope.entity);
      var delEntityWatcher = scope.$watch('entity', ctrl.handleNavigation);
      scope.$on('$destroy', delEntityWatcher);
      delWaitForRootWatcher();
    });
    scope.$on('$destroy', delWaitForRootWatcher);
    scope.$on('hbpFileBrowser:startCreateFolder', function(evt) {
      evt.preventDefault();
      elt.find('.new-folder-name').get(0).focus();
    });
  }

  /**
   * @namespace FileBrowserViewModel
   * @desc
   * ViewModel of the hbpFileBrowser directive. This instance is
   * accessible by all direct children of the file browser.
   *
   * It is responsible to handle all the interactions between the user
   * and the services. It does not update the views directly but sends
   * the relevant events when necessary.
   * @memberof hbpDocumentClient.ui.hbpFileBrowser
   */
  function FileBrowserViewModel($scope, $log, $q, $timeout, hbpProjectStore, hbpFileStore, hbpEntityStore, hbpLoadEntityChildren) {
    var vm = this;
    vm.currentEntity = null; // the (container) entity that this view currently describe
    vm.folders = []; // array of displayed folder
    vm.hasMoreFolders = false;
    vm.files = [];   // array of displayed files
    vm.uploads = []; // array of file currently uploading
    vm.hasMoreFiles = false;
    vm.selectedEntity = null; // currently focused entity
    vm.rootEntity = null; // the top level entity;
    vm.isRoot = true;
    vm.error = null;
    vm.isLoading = true;
    vm.canEdit = false;
    vm.thumbnailUrl = null; // current file thumbnail if any

    vm.init = init;
    vm.handleFocus = handleFocusEvent;
    vm.handleNavigation = handleNavigationEvent;
    vm.loadMoreFiles = loadMoreFiles;
    vm.loadMoreFolders = loadMoreFolders;
    vm.onFileChanged = onFileChanged;
    vm.startCreateFolder = startCreateFolder;
    vm.doCreateFolder = doCreateFolder;
    vm.cancelCreateFolder = cancelCreateFolder;
    vm.defineThumbnailUrl = defineThumbnailUrl;

    //////////////////

    var currentUpdate;
    var folderLoader;
    var fileLoader;

    function init(rootEntity, currentEntity) {
      vm.rootEntity = rootEntity;
      currentUpdate = update(currentEntity || rootEntity);
    }

    /**
     * @method handleFocus
     * @desc
     * When the user focus on a browser item,
     * emit a 'hbpFileBrowser:focusChanged' event.
     *
     * The event signature is (event, newEntity, previousEntity).
     *
     * @param  {Object} entity selected entity
     * @memberof hbpDocumentClient.ui.hbpFileBrowser.FileBrowserViewModel
     */
    function handleFocusEvent(entity) {
      if (entity === vm.selectedEntity) {
        return;
      }
      $scope.$emit('hbpFileBrowser:focusChanged', entity, vm.selectedEntity);
      vm.selectedEntity = entity;
    }

    /**
     * @method handleNavigation
     * @desc When the current context change, trigger a navigation update.
     *
     * This will render the view for the new current entity. All navigations
     * are chained to ensure that the future view will end in a consistant
     * state. As multiple requests are needed to render a view, request result
     * would sometimes finish after a new navigation event already occured.
     *
     * @param  {Object} entity the new current entity
     * @return {promise} resolve when the navigation is done.
     * @memberof hbpDocumentClient.ui.hbpFileBrowser.FileBrowserViewModel
     */
    function handleNavigationEvent(entity) {
      if (angular.isUndefined(entity) || entity === vm.currentEntity) {
        return;
      }
      currentUpdate = currentUpdate.finally(function() {
        return update(entity);
      });
    }

    /**
     * Handle error case
     * @private
     */
    function setError(err) {
      $log.error('error catched by file browser:', err);
      vm.error = err;
      vm.isLoading = false;
    }

    function startCreateFolder() {
      vm.showCreateFolder = true;
      $timeout(function() {
        // the event is captured by the directive scope in order to update
        // the DOM. I choose to not update the DOM in the ViewModel but
        // rather in the directive link function.
        $scope.$emit('hbpFileBrowser:startCreateFolder');
      });
    }

    function doCreateFolder($event) {
      $event.preventDefault();
      hbpEntityStore.create('folder', vm.currentEntity, vm.newFolderName)
      .then(function(entity) {
        vm.newFolderName = '';
        return update(entity);
      })
      .then(function() {
        vm.showFileUpload = true;
      })
      .catch(setError);
    }

    function cancelCreateFolder() {
      vm.newFolderName = '';
      vm.showCreateFolder = false;
    }

    function update(entity) {
      vm.isLoading = true;
      vm.currentEntity = entity;
      vm.selectedEntity = entity; // we set the main entity has selected by default
      vm.error = null;
      vm.parent = null;
      vm.files = null;
      vm.folders = null;
      vm.uploads = [];
      vm.showFileUpload = false;
      vm.showCreateFolder = false;

      assignIsRoot(entity);
      assignCanEdit(entity);

      // special exit case for the storage root
      if (!entity) {
        return hbpProjectStore.getAll()
          .then(function(rs) {
            vm.folders = rs.result;
          })
          .then(function() {
            vm.isLoading = false;
          })
          .catch(setError);
      }

      var promises = [];

      // define the new parent entity
      if (!vm.isRoot && entity._parent) {
        promises.push(
          hbpEntityStore.get(entity._parent).then(assignParentEntity)
        );
      }

      // define the view folders
      folderLoader = hbpLoadEntityChildren(entity, {
        accept: ['folder'],
        acceptLink: false
      });
      vm.folders = folderLoader.entities;
      promises.push(
        folderLoader.promise
        .then(afterLoadFolders)
      );

      fileLoader = hbpLoadEntityChildren(entity, {
        accept: ['file'],
        acceptLink: false
      });
      vm.files = fileLoader.entities;
      promises.push(
        fileLoader.promise
        .then(afterLoadFiles)
      );

      return $q.all(promises).then(function() {
        vm.isLoading = false;
      }, setError);
    }

    /**
     * Load the next page of file entities for the current entity.
     *
     * @return {Promise} resolve when the files are loaded
     * @memberof hbpDocumentClient.ui.hbpFileBrowser.FileBrowserViewModel
     */
    function loadMoreFiles() {
      return fileLoader.next()
      .then(afterLoadFiles)
      .catch(setError);
    }

    /**
     * Load the next page of folder entities for the current entity.
     *
     * @return {Promise} resolve when the folders are loaded
     * @memberof hbpDocumentClient.ui.hbpFileBrowser.FileBrowserViewModel
     */
    function loadMoreFolders() {
      return folderLoader.next()
      .then(afterLoadFolders)
      .catch(setError);
    }

    function afterLoadFiles() {
      vm.hasMoreFiles = fileLoader.hasNext;
    }

    function afterLoadFolders() {
      vm.hasMoreFolders = folderLoader.hasNext;
    }

    function assignIsRoot(entity) {
      if (!entity) {
        vm.isRoot = true;
      } else if (!vm.rootEntity) {
        vm.isRoot = false;
      } else {
        vm.isRoot = (entity._uuid === vm.rootEntity._uuid);
      }
    }

    function assignParentEntity(entity) {
      vm.parent = entity;
    }

    /**
     * Upload files that the user just added to the uploader widget.
     *
     * @param  {Array} files array of File
     */
    function onFileChanged(files) {
      _.each(files, function(f) {
        upload(f)
        .then(function(entity) {
          vm.files.push(entity);
        });
      });
      vm.showFileUpload = false;
    }

    /**
     * Create a file entity and upload its associated content.
     *
     * @param  {File} file the file to create and upload
     * @return {Promise} resolve when the file has been uploaded
     */
    function upload(file) {
      var uploadInfo = {
        content: file,
        state: null
      };
      vm.uploads.push(uploadInfo);
      return hbpFileStore.upload(file, {
          parent: vm.currentEntity
      })
      .then(function(entity) {
        // update file status
        file.state = 'success';
        _.remove(vm.uploads, function(info) {
          return info === uploadInfo;
        });
        return entity;
      }, function(err) {
        $log.error('upload error:', err);
        uploadInfo.state = 'error';
        setError(err);
        return $q.reject(err);
      }, function(progressEvent) {
        if(progressEvent && progressEvent.lengthComputable) {
          // update file status
          uploadInfo.state = 'progress';
          uploadInfo.progress = progressEvent;
          uploadInfo.progress.percentage = (progressEvent.loaded*100)/progressEvent.total;
        }
      });
    }

    /**
     * Return a valid thumbnail URL when available.
     *
     * At this point it returns the image file if the file is an image.
     *
     * @param  {Object} file a file entity
     * @return {String} the url to download the file
     */
    function defineThumbnailUrl(file) {
      vm.thumbnailUrl = null;
      if (file._contentType && file._contentType.match(/^image\//)) {
        hbpFileStore.downloadUrl(file).then(function(res) {
          vm.thumbnailUrl = res;
        });
      }
    }

    var lastAssignCanEditRequest = $q.when();
    function assignCanEdit(entity) {
      return lastAssignCanEditRequest = lastAssignCanEditRequest.then(function() {
        if (!entity) {
          vm.canEdit = false;
          return;
        }
        return hbpEntityStore.getUserAccess(entity).then(function(acl) {
          vm.canEdit = acl.canWrite;
        });
      });
    }
  }
}());
