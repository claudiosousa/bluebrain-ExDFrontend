angular.module('hbpCommon', [
  'ui.bootstrap',
  'ui.router',
  'bbpConfig',
  'bbpOidcClient',
  'hbp-common-templates'
]);
window.hbpCommonVersion = '0.5.0';
angular.module('hbpCommon').controller('hbpMetaNavigationCtrl', [
  '$rootScope',
  '$scope',
  '$state',
  'hbpUserDirectory',
  'bbpOidcSession',
  function ($rootScope, $scope, $state, hbpUserDirectory, bbpOidcSession) {
    'use strict';
    hbpUserDirectory.getCurrentUser().then(function (profile) {
      $scope.currentUser = profile;
    });
    $scope.logout = function () {
      bbpOidcSession.logout().then(function () {
        $rootScope.$broadcast('user:disconnected');
        $scope.currentUser = null;
      });
    };
  }
]);
angular.module('hbpCommon').directive('hbpBreadcrumb', [
  '$state',
  function ($state) {
    'use strict';
    return {
      restrict: 'E',
      templateUrl: 'templates/breadcrumb.html',
      scope: { items: '=' },
      link: function (scope) {
        var urlForState = function (state, params) {
          return $state.href(state, params);
        };
        var update = function () {
          scope.parentItems = scope.items && scope.items.slice(0, scope.items.length - 1);
          scope.currentItem = scope.items && scope.items[scope.items.length - 1];
        };
        var init = function () {
          scope.$watch('items', update);
          scope.urlForState = urlForState;
          update();
        };
        init();
      }
    };
  }
]);
angular.module('hbpCommon').directive('hbpContentDescription', function () {
  'use strict';
  return {
    templateUrl: 'templates/content-description.html',
    restrict: 'E',
    scope: { content: '=?' },
    link: function (scope) {
      if (scope.content) {
        var splited = scope.content.split('/');
        if (splited.length > 1) {
          scope.fallback = splited[1];
        } else {
          scope.fallback = splited[0];
        }
      }
    }
  };
});
angular.module('hbpCommon').directive('hbpContentIcon', function () {
  'use strict';
  return {
    templateUrl: 'templates/content-icon.html',
    restrict: 'E',
    scope: { content: '=?' }
  };
});
angular.module('hbpCommon').directive('hbpIcon', function () {
  'use strict';
  return {
    templateUrl: 'templates/icon.html',
    restrict: 'E',
    scope: {
      entity: '=?',
      type: '=?'
    },
    link: function (scope) {
      if (!scope.type && scope.entity) {
        scope.type = scope.entity._entityType;
      }
    }
  };
});
angular.module('hbpCommon').directive('hbpPerformAction', [function () {
    'use strict';
    return {
      restrict: 'A',
      scope: { action: '&hbpPerformAction' },
      link: function (scope, element, attrs) {
        var loading = false;
        var onComplete = function () {
          element.html(scope.text);
          element.attr('disabled', false);
          loading = false;
        };
        var run = function () {
          loading = true;
          if (scope.loadingMessage) {
            element.html(scope.loadingMessage);
          }
          element.attr('disabled', true);
          scope.action().then(onComplete, onComplete);
        };
        scope.loadingMessage = attrs.hbpLoadingMessage;
        scope.text = scope.text || element.html();
        element.on('click', run);
      }
    };
  }]);
angular.module('hbpCommon').directive('hbpUpNav', [
  '$rootScope',
  '$timeout',
  'hbpUserDirectory',
  'bbpOidcSession',
  function ($rootScope, $timeout, hbpUserDirectory, bbpOidcSession) {
    'use strict';
    return {
      restrict: 'A',
      scope: { data: '=hbpUpNav' },
      link: function (scope, element) {
        var logout = function () {
          bbpOidcSession.logout().then(function () {
            $rootScope.$broadcast('user:disconnected');
          });
        };
        // Remove the user info when logged out
        scope.$on('user:disconnected', function () {
          element[0].hbpUpNav({
            user: null,
            logout: null
          });
        });
        // Update nav configuration
        if (scope.data) {
          $timeout(function () {
            element[0].hbpUpNav(scope.data);
          }, 0);
        }
        // Once logged, display the user
        hbpUserDirectory.getCurrentUser().then(function (profile) {
          element[0].hbpUpNav({
            user: {
              displayName: profile.displayName,
              id: profile.id
            },
            logout: logout
          });
        });
      }
    };
  }
]);
angular.module('hbpCommon').factory('hbpDialogFactory', [
  '$modal',
  '$log',
  '$q',
  '$rootScope',
  '$compile',
  '$templateCache',
  'hbpErrorService',
  function ($modal, $log, $q, $rootScope, $compile, $templateCache, hbpErrorService) {
    'use strict';
    /**
     * @description
     * `confirm` function displays a confirmation dialog.
     *
     * @param {Object} options The options parameter accepts the following keys:
     * - scope: the scope to be used
     * - title: the title of the dialog
     * - confirmLabel: text for the confirmation label
     * - cancelLabel: text for the cancelation label
     * - template: a template string to be used as the dialog content
     * - templateUrl: URL of a template that should be used as the dialog
     *                content.
     *
     *
     * @return {promise} A promise that will be resolved if the dialog is
     *                   confirmed.
     */
    function confirm(options) {
      options = _.extend({
        scope: $rootScope,
        title: 'Confirm',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
        template: 'Are you sure?'
      }, options);
      var modalScope = options.scope.$new();
      modalScope.title = options.title;
      modalScope.confirmLabel = options.confirmLabel;
      modalScope.cancelLabel = options.cancelLabel;
      modalScope.confirmationContent = options.template;
      modalScope.confirmationContentUrl = options.templateUrl;
      var instance = $modal.open({
          templateUrl: 'templates/dialog-confirmation.html',
          show: true,
          backdrop: 'static',
          scope: modalScope
        });
      return instance.result;
    }
    /**
     * ### Method `hbpErrorService.notify({HbpError}error)`
     *
     * Notify the user from of the given error.
     *
     * @param  {HbpError} error the error to display
     */
    function error(err) {
      var scope = $rootScope.$new();
      scope.error = err;
      return alert({
        class: 'error',
        title: 'Error!',
        label: 'Close',
        scope: scope,
        templateUrl: 'templates/error-alert.html'
      });
    }
    function alert(options) {
      if (typeof options === 'string') {
        return deprecatedAlert.apply(window, arguments);
      }
      options = _.extend({
        scope: $rootScope,
        title: 'Message',
        label: 'Close',
        class: 'default'
      }, options);
      var modalScope = options.scope.$new();
      modalScope.title = options.title;
      modalScope.label = options.label;
      modalScope.alertContentUrl = options.templateUrl;
      modalScope.alertContent = options.template;
      modalScope.htmlClass = options.class;
      var instance = $modal.open({
          templateUrl: 'templates/dialog-alert.html',
          show: true,
          backdrop: 'static',
          scope: modalScope
        });
      return instance.result;
    }
    function deprecatedAlert(templateUrl, title, scope) {
      $log.warn('hbpDialogFactory.alert(templateUrl, title, scope) is deprecated.');
      $log.log('Use hbpDialogFactory.alert(options) instead');
      return alert({
        templateUrl: templateUrl,
        title: title,
        scope: scope
      });
    }
    return {
      alert: alert,
      error: error,
      confirm: confirm,
      confirmation: function (templateUrl, action, title, actionName, scope) {
        $log.warn('hbpDialogFactory.confirmation is deprecated.');
        $log.log('Use hbpDialogFactory.confirm instead');
        return confirm({
          scope: scope,
          title: title,
          confirmLabel: actionName,
          cancelLabel: 'cancel',
          templateUrl: templateUrl
        }).then(function () {
          if (!action) {
            return;
          }
          return action(scope).then(null, function (data) {
            var error;
            if (typeof data === 'string') {
              error = hbpErrorService.error({
                type: 'Error',
                message: data
              });
            } else if (data) {
              if (!data.status) {
                data = {
                  status: -1,
                  data: data
                };
              }
              error = hbpErrorService.httpError(data);
            } else {
              error = hbpErrorService.error();
            }
            alert({
              title: 'Error',
              class: 'alert-danger',
              template: error.message
            });
            return $q.reject(error);
          });
        });
      }
    };
  }
]);
angular.module('hbpCommon').service('hbpErrorService', function () {
  'use strict';
  var HbpError = function (options) {
    options = angular.extend({
      type: 'UnknownError',
      message: 'An unknown error occured.',
      code: -1
    }, options);
    this.type = options.type;
    this.message = options.message;
    this.data = options.data;
    this.code = options.code;
  };
  return {
    httpError: function (response) {
      if (response.status === undefined) {
        return new HbpError({ message: 'Cannot parse error, invalid format.' });
      }
      var error = new HbpError({ code: response.status });
      if (response.status === 0) {
        error.type = 'ClientError';
        error.message = 'The client cannot run the request.';
        return error;
      }
      if (response.status === 404) {
        error.type = 'NotFound';
        error.message = 'Resource not found';
        return error;
      }
      if (response.data) {
        var errorSource = response.data;
        if (errorSource.error) {
          errorSource = errorSource.error;
        }
        if (errorSource.type) {
          error.type = errorSource.type;
        }
        if (errorSource.data) {
          error.data = errorSource.data;
        }
        if (errorSource.message) {
          error.message = errorSource.message;
        } else if (errorSource.reason) {
          error.type = 'Error';
          error.message = errorSource.reason;
        }
      }
      return error;
    },
    error: function (options) {
      return new HbpError(options);
    }
  };
});
angular.module('hbpCommon').service('hbpUiUtil', [
  '$window',
  '$document',
  '$q',
  'hbpErrorService',
  function ($window, $document, $q, hbpErrorService) {
    'use strict';
    // Test wether the given element
    // is part of the viewport
    function isInViewport(selector) {
      if (selector.find) {
        selector = selector[0];
      }
      var rect = selector.getBoundingClientRect();
      return rect.top >= 0 && rect.left >= 0 && rect.bottom <= ($window.innerHeight || $document.documentElement.clientHeight) && rect.right <= ($window.innerWidth || $document.documentElement.clientWidth);
    }
    // Manages the display of error in a dialog after a rest call, typically used with
    // Angular UI's modal dialog.
    //
    // This function will generate a 'close' function that takes as first parameter the
    // modals 'native' close function followed by an arbitrary number of arguments.
    //
    // Once this function is called it will first try to call the 'submitCall' function with
    // all the optional argument provided above.
    // - If this succeeds then the close methode will be called.
    // - If this fails then the error field of the provided scope will be filed with the
    //   error message
    var dialogSubmissionRestCallErrorHandler = function (submitCall, scope) {
      return function (closeMethod) {
        var callArguments = Array.prototype.slice.call(arguments);
        callArguments.shift();
        return submitCall.apply(this, callArguments).then(function (response) {
          closeMethod(response);
        }, function (response) {
          scope.error = hbpErrorService.httpError(response);
          $q.reject(scope.error);
        });
      };
    };
    return {
      isInViewport: isInViewport,
      dialogSubmissionRestCallErrorHandler: dialogSubmissionRestCallErrorHandler
    };
  }
]).filter('hbpDatetime', [
  '$filter',
  function ($filter) {
    'use strict';
    return function (date) {
      return $filter('date')(date, 'yyyy-MM-dd HH:mm:ss');
    };
  }
]).filter('hbpCapitalize', [function () {
    'use strict';
    return function (string) {
      return string.charAt().toUpperCase() + string.substring(1);
    };
  }]).filter('hbpMarkdown', [
  '$sce',
  function ($sce) {
    'use strict';
    return function (string) {
      if (string !== undefined) {
        return $sce.trustAsHtml(marked(string, { sanitize: true }));
      }
    };
  }
]).run([
  '$rootScope',
  '$log',
  '$state',
  '$stateParams',
  '$location',
  '$window',
  function ($rootScope, $log, $state, $stateParams, $location, $window) {
    'use strict';
    var stateCount = 0;
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
      // We don't count replace navigation or empty state navigation.
      if (fromState && fromState.name && !$location.$$replace) {
        stateCount++;
      }
    });
    /**
         * Enable a back behaviours based on windows.history behaviors
         *
         * We don't use the states directly as this will break with the native
         * window.history behaviors.
         *
         * If a call to this method would result in a real navigation, it
         * is replaced by a call to `defaultState` instead. if defaultState
         * is not defined, it will do nothing.
         *
         * @param {String} defaultState first argument to pass to $state.go()
         * @param {Object} defaultParams second argument to pass to $state.go()
         */
    $rootScope.goToPrevious = function (defaultState, defaultParams) {
      if (stateCount > 0) {
        stateCount--;
        $window.history.go(-1);
      } else if (defaultState) {
        $state.go(defaultState, defaultParams);
      } else {
        $log.error('no previous state, cannot navigate back.');
      }
    };
  }
]);
angular.module('hbpCommon').factory('hbpUserDirectory', [
  '$rootScope',
  '$q',
  '$http',
  '$cacheFactory',
  'bbpConfig',
  'hbpErrorService',
  function ($rootScope, $q, $http, $cacheFactory, bbpConfig, errorService) {
    'use strict';
    var userCache = $cacheFactory('hbpUserCache');
    var userApiUrl = bbpConfig.get('api.user.v0');
    // key used to store the logged in user in the cache
    var currentUserKey = '_currentUser_';
    $rootScope.$on('user:disconnected', function () {
      userCache.removeAll();
    });
    // Create requests with a maximum length of 2000 chars
    var splitInURl = function (source, urlPrefix, destination) {
      if (source.length > 0) {
        var url = urlPrefix + source[0];
        for (var i = 1; i < source.length; i++) {
          if (url.length + source[i].length + 1 < 2000) {
            // If we still have enough room in the url we add the id to it
            url += '%2B' + source[i];  // %2B means +
          } else {
            // We flush the call and start a new one
            destination.push(url);
            url = urlPrefix + source[i];
          }
        }
        destination.push(url);
      }
    };
    var addToCache = function (addedUserList, response) {
      for (var i = 0; i < addedUserList.length; i++) {
        if (addedUserList[i].displayName === undefined) {
          addedUserList[i].displayName = addedUserList[i].name;
        }
        // add to response
        response[addedUserList[i].id] = addedUserList[i];
        // add to cache
        userCache.put(addedUserList[i].id, addedUserList[i]);
      }
    };
    var loadMore = function (url) {
      return function () {
        return $http.get(url).then(buildListResponse, function (response) {
          return $q.reject(errorService.httpError(response));
        });
      };
    };
    var buildListResponse = function (response) {
      var users = response.data.result;
      var result = { result: users };
      if (response.data.next) {
        result.next = loadMore(response.data.next);
      }
      if (response.data.prev) {
        result.prev = loadMore(response.data.prev);
      }
      return result;
    };
    // Return a promise with an map of id->userInfo based on the
    // provided list of IDs.
    var get = function (ids) {
      var deferred = $q.defer();
      var i;
      var uncachedUser = [];
      var uncachedGroup = [];
      var response = {};
      var urls = [];
      var rejectDeferred = function () {
        deferred.reject.apply(deferred, ids);
      };
      var processResponseAndCarryOn = function (data) {
        addToCache(data.data.result, response);
        if (urls && urls.length > 0) {
          return $http.get(urls.shift()).then(processResponseAndCarryOn, rejectDeferred);
        } else {
          deferred.resolve(response);
        }
      };
      for (i = 0; i < ids.length; i++) {
        var user = userCache.get(ids[i]);
        if (user) {
          // The id is already cached
          response[ids[i]] = user;
        } else {
          if (ids[i].indexOf('S') === 0) {
            // The id is from a group
            uncachedGroup.push(ids[i]);
          } else {
            // The id is from a user
            uncachedUser.push(ids[i]);
          }
        }
      }
      if (uncachedUser.length + uncachedGroup.length === 0) {
        // All ids are already available -> we resolve the promise
        deferred.resolve(response);
      } else {
        // Get the list of URLs to call
        splitInURl(uncachedUser, userApiUrl + '/user?filter=id=', urls);
        splitInURl(uncachedGroup, userApiUrl + '/group?filter=id=', urls);
        // Async calls and combination of result
        $http.get(urls.shift()).then(processResponseAndCarryOn, rejectDeferred);
      }
      return deferred.promise;
    };
    return {
      get: get,
      getCurrentUser: function () {
        var user = userCache.get(currentUserKey);
        if (user) {
          return $q.when(user);
        }
        // load it from user profile service
        return $q.all({
          'user': $http.get(userApiUrl + '/user/me'),
          'groups': $http.get(userApiUrl + '/user/me/groups')
        }).then(function (aggregatedData) {
          // merge groups into user profile
          var profile = aggregatedData.user.data;
          profile.groups = aggregatedData.groups.data.result;
          // add to cache
          userCache.put(currentUserKey, profile);
          return profile;
        }, function (response) {
          return $q.reject(errorService.httpError(response));
        });
      },
      create: function (user) {
        return $http.post(userApiUrl + '/user', user).then(function () {
          return user;
        }, function (response) {
          return $q.reject(errorService.httpError(response));
        });
      },
      update: function (user, data) {
        data = data || user;
        var id = typeof user === 'string' ? user : user.id;
        return $http.put(userApiUrl + '/user/' + id, data).then(function () {
          userCache.remove(id);
          if (userCache.get(currentUserKey) && userCache.get(currentUserKey).id === id) {
            userCache.remove(currentUserKey);
          }
          return get([id]).then(function (users) {
            return _.first(_.values(users));
          });
        }, function (response) {
          return $q.reject(errorService.httpError(response));
        });
      },
      list: function (options) {
        var defaultOptions = {
            page: 0,
            pageSize: 10,
            managedOnly: false
          };
        var opt = angular.extend(defaultOptions, options);
        var filterStr;
        if (opt.filter) {
          var filterArr = _.map(opt.filter, function (val, key) {
              if (_.isArray(val)) {
                val = val.join('+');
              }
              return key + '=' + val;
            });
          filterStr = filterArr.join();
        }
        var sortStr;
        if (opt.sort) {
          if (_.isArray(opt.sort)) {
            sortStr = opt.sort.join();
          } else {
            sortStr = _(opt.sort).toString();
          }
        }
        var endpoint = userApiUrl + '/user';
        if (opt.managedOnly) {
          endpoint += '/managed';
        }
        return $http.get(endpoint, {
          params: {
            page: opt.page,
            pageSize: opt.pageSize,
            filter: filterStr,
            sort: sortStr
          }
        }).then(buildListResponse, function (response) {
          return $q.reject(errorService.httpError(response));
        });
      }
    };
  }
]);
angular.module('hbpCommon').service('hbpUtil', function () {
  'use strict';
  return {
    format: function (input, args) {
      if (!angular.isArray(args)) {
        args = [args];
      }
      return input.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] !== 'undefined' ? args[number] : match;
      });
    }
  };
});
angular.module('hbpCommon').config([
  '$httpProvider',
  function ($httpProvider) {
    'use strict';
    // Override XMLHttpRequest to hack into setRequestHeader.
    // Header keys are the only things angular let us pass to requests
    // so intercepting a special key to modify xhr properties is
    // probably the best hack we can do to keep the rest of the code sane.
    window.XMLHttpRequest = function (OrigXMLHttpRequest) {
      return function () {
        var xhr = new OrigXMLHttpRequest();
        xhr.setRequestHeader = function (orig) {
          return function (name, value) {
            if (name === 'HBP-AngularProgressEventMixin') {
              value.call(xhr, xhr);
            } else {
              orig.apply(this, arguments);
            }
          };
        }(xhr.setRequestHeader);
        return xhr;
      };
    }(window.XMLHttpRequest);
    $httpProvider.interceptors.push('hbpXhrProgressEventInterceptor');
  }
]).factory('hbpXhrProgressEventInterceptor', function () {
  'use strict';
  return {
    request: function (config) {
      if (config.uploadProgress || config.progress) {
        config.headers['HBP-AngularProgressEventMixin'] = function (xhr) {
          if (config.uploadProgress) {
            xhr.upload.addEventListener('progress', config.uploadProgress, false);
          }
          if (config.progress) {
            xhr.addEventListener('progress', config.progress, false);
          }
        };
      }
      return config;
    }
  };
});
angular.module('hbp-common-templates', [
  'templates/breadcrumb.html',
  'templates/content-description.html',
  'templates/content-icon.html',
  'templates/dialog-alert.html',
  'templates/dialog-confirmation.html',
  'templates/error-alert.html',
  'templates/icon.html'
]);
angular.module('templates/breadcrumb.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('templates/breadcrumb.html', '<ol class="breadcrumb">\n' + '    <li ng-repeat="item in parentItems"\n' + '        ><a ng-href="{{urlForState(item.state, item.stateParams)}}"\n' + '            ><hbp-icon type="item.type"></hbp-icon>\n' + '            <span class="breadcrumb-item-name {{item.class}}">{{item.name}}</span\n' + '        ></a\n' + '    ></li\n' + '    ><li\n' + '        ><hbp-icon type="currentItem.type"></hbp-icon>\n' + '        <span class="breadcrumb-item-name {{currentItem.class}}">{{currentItem.name}}</span\n' + '    ></li>\n' + '</ol>\n' + '');
  }
]);
angular.module('templates/content-description.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('templates/content-description.html', '<span ng-switch="content">\n' + '    <span ng-switch-when="application/vnd.bbp.FeatureExtract.Dependency+txt">Text FeatureExtract</span>\n' + '    <span ng-switch-when="application/vnd.bbp.SimulationProtocol.StimulationConfig">Simulation Configuration</span>\n' + '    <span ng-switch-when="application/vnd.bbp.SimulationProtocol.ReportingConfig">Reporting Configuration</span>\n' + '    <span ng-switch-when="application/vnd.bbp.Circuit.Config+config">Circuit Configuration</span>\n' + '    <span ng-switch-when="application/vnd.bbp.Circuit.Config">Circuit Configuration</span>\n' + '    <span ng-switch-when="application/vnd.bbp.Circuit.Combination">Circuit Combination</span>\n' + '    <span ng-switch-when="application/vnd.bbp.Circuit.Combination+xml">XML Circuit Combination</span>\n' + '    <span ng-switch-when="application/vnd.bbp.Simulation.BlueConfig">BlueConfig File</span>\n' + '    <span ng-switch-when="application/vnd.bbp.Simulation.HOC">HOC Simulation</span>\n' + '    <span ng-switch-when="application/vnd.bbp.bundle.Image.png">Image Bundle</span>\n' + '    <span ng-switch-when="application/zip">Archive</span>\n' + '    <span ng-switch-when="application/rar">Archive</span>\n' + '    <span ng-switch-when="application/json">JSON</span>\n' + '    <span ng-switch-when="application/txt">Plain Text</span>\n' + '    <span ng-switch-when="text/plain">Plain Text</span>\n' + '    <span ng-switch-when="image/jpeg">JPEG Image</span>\n' + '    <span ng-switch-when="image/png">PNG Image</span>\n' + '    <span ng-switch-when="image/gif">GIF Image</span>\n' + '    <span ng-switch-when="video/avi">AVI Video</span>\n' + '    <span ng-switch-when="video/mpg">MPEG Video</span>\n' + '    <span ng-switch-when="model/vnd.bbp.Morphology.Morphology">Morphology</span>\n' + '    <span ng-switch-when="model/vnd.bbp.Morphology.Morphology+asc">ASCI Morphology</span>\n' + '    <span ng-switch-when="model/vnd.bbp.Morphology.Morphology+h5">H5 Morphology</span>\n' + '    <span ng-switch-when="model/vnd.bbp.Morphology.NeuronDB">DAT NeuronDB</span>\n' + '    <span ng-switch-when="model/vnd.bbp.Morphology.NeuronDB+dat">DAT NeuronDB</span>\n' + '    <span ng-switch-default>{{fallback}}</span>\n' + '</span>\n' + '');
  }
]);
angular.module('templates/content-icon.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('templates/content-icon.html', '<span class="bbp-browser-entity-icon" ng-switch="content">\n' + '    <i ng-switch-when="application/zip" class="fa fa-file-archive-o"></i>\n' + '    <i ng-switch-when="application/rar" class="fa fa-file-archive-o"></i>\n' + '    <i ng-switch-when="application/txt" class="fa fa-file-text-o"></i>\n' + '    <i ng-switch-when="text/plain" class="fa fa-file-text-o"></i>\n' + '    <i ng-switch-when="application/pdf" class="fa fa-file-pdf-o"></i>\n' + '    <i ng-switch-when="image/jpeg" class="fa fa-file-image-o"></i>\n' + '    <i ng-switch-when="image/png" class="fa fa-file-image-o"></i>\n' + '    <i ng-switch-when="image/gif" class="fa fa-file-image-o"></i>\n' + '    <i ng-switch-when="application/json" class="fa fa-file-code-o"></i>\n' + '    <i ng-switch-when="video/avi" class="fa fa-file-video-o"></i>\n' + '    <i ng-switch-when="video/mpeg" class="fa fa-file-video-o"></i>\n' + '    <i ng-switch-default class="fa fa-file-o"></i>\n' + '</span>\n' + '');
  }
]);
angular.module('templates/dialog-alert.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('templates/dialog-alert.html', '<div class="modal-header"  >\n' + '    <button type="button" class="close" ng-click="$close()" aria-hidden="true">&times;</button>\n' + '    <h4 class="modal-title">{{title}}</h4>\n' + '</div>\n' + '<div class="modal-body {{htmlClass}}">\n' + '    <ng-include src="alertContentUrl"></ng-include>\n' + '    {{alertContent}}\n' + '</div>\n' + '<div class="modal-footer">\n' + '    <button class="btn btn-default" ng-click="$close()">{{label}}</button>\n' + '</div>\n' + '');
  }
]);
angular.module('templates/dialog-confirmation.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('templates/dialog-confirmation.html', '<div class="modal-header"  >\n' + '    <button type="button" class="close" ng-click="$dismiss(\'cancel\')" aria-hidden="true">&times;</button>\n' + '    <h4 class="modal-title">{{title}}</h4>\n' + '</div>\n' + '<div class="modal-body">\n' + '    <alert ng-if="error" type="danger">{{error.reason}}</alert>\n' + '    <ng-include ng-if="confirmationContentUrl" src="confirmationContentUrl"></ng-include>\n' + '    {{confirmationContent}}\n' + '</div>\n' + '<div class="modal-footer">\n' + '    <button class="btn btn-default" ng-click="$dismiss(\'cancel\')">{{cancelLabel}}</button>\n' + '    <button class="btn btn-danger" ng-click="$close()">{{confirmLabel}}</button>\n' + '</div>\n' + '');
  }
]);
angular.module('templates/error-alert.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('templates/error-alert.html', '<div class="alert alert-danger">[{{error.type}}] {{error.message}}</div>\n' + '<pre><code>{{error | json}}</code></pre>\n' + '');
  }
]);
angular.module('templates/icon.html', []).run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('templates/icon.html', '<span class="bbp-browser-entity-icon" ng-switch="type">\n' + '    <i ng-switch-when="root" class="glyphicon glyphicon-home"></i>\n' + '    <i ng-switch-when="project" class="glyphicon glyphicon-hdd"></i>\n' + '    <i ng-switch-when="folder" class="glyphicon glyphicon-folder-open"></i>\n' + '    <i ng-switch-when="file" class="glyphicon glyphicon-file"></i>\n' + '    <i ng-switch-when="release" class="glyphicon glyphicon-lock"></i>\n' + '    <i ng-switch-when="link:folder" class="glyphicon glyphicon-link"></i>\n' + '    <i ng-switch-when="link:file" class="glyphicon glyphicon-link"></i>\n' + '    <i ng-switch-when="link:project" class="glyphicon glyphicon-link"></i>\n' + '    <i ng-switch-when="link:release" class="glyphicon glyphicon-link"></i>\n' + '</span>\n' + '');
  }
]);