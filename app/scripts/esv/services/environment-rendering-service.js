/* global THREE: false */
/* global GZ3D: false */
/* global console: false */

(function () {
  'use strict';

  angular.module('environmentRenderingModule', [])

    .constant('FPS_LIMIT', {
      FPS_20: 20,
      FPS_30: 30,
      FPS_60: 60,
      FPS_INFINITE: Infinity
    })

    .factory('environmentRenderingService', [
      '$q',
      'STATE', 'FPS_LIMIT',
      'gz3d', 'userNavigationService', 'simulationInfo', 'stateService', 'isNotARobotPredicate', 'userContextService',
      'assetLoadingSplash', 'nrpAnalytics', 'collab3DSettingsService',
      function ($q,
                STATE, FPS_LIMIT,
                gz3d, userNavigationService, simulationInfo, stateService, isNotARobotPredicate, userContextService,
                assetLoadingSplash, nrpAnalytics, collab3DSettingsService) {

        function EnvironmentRenderingService() {

          var that = this;

          this.tLastFrame = 0;
          this.maxDropCycles = 10;
          this.skippedFramesForDropCycles = 5;

          this.init = function() {
            this.initAnimationFrameFunctions();

            // default to 30 fps cap
            this.setFPSLimit(FPS_LIMIT.FPS_30);

            this.sceneInitialized = $q.defer();

            stateService.getCurrentState().then(function () {
              if (stateService.currentState !== STATE.STOPPED) {
                gz3d.Initialize();
                gz3d.iface.addCanDeletePredicate(isNotARobotPredicate);
                gz3d.iface.addCanDeletePredicate(userContextService.hasEditRights);

                // Register for the status updates as well as the timing stats
                // Note that we have two different connections here, hence we only put one as a callback for
                // $rootScope.iface and the other one not!
                /* Listen for status informations */
                stateService.addStateCallback(that.onStateChanged);

                // Show the splash screen for the progress of the asset loading
                that.assetLoadingSplashScreen = that.assetLoadingSplashScreen || assetLoadingSplash.open(that.onSceneLoaded);
                gz3d.iface.setAssetProgressCallback(function (data) {
                  assetLoadingSplash.setProgress(data);
                });

                that.updateInitialCameraPose(simulationInfo.experimentDetails.cameraPose);

                that.animate();
              }
            });

            this.sceneInitialized.promise.then(function(){
              that.initComposerSettings();
            });
          };

          this.deinit = function () {
            if (angular.isDefined(this.cancelAnimationFrame)) {
              this.cancelAnimationFrame(this.requestID);
            }

            // Close the splash screens
            if (angular.isDefined(this.assetLoadingSplashScreen)) {
              if (angular.isDefined(assetLoadingSplash)) {
                assetLoadingSplash.close();
              }
              delete this.assetLoadingSplashScreen;
            }

            stateService.removeStateCallback(this.onStateChanged);
            userNavigationService.deinit();
            gz3d.deInitialize();
          };

          this.animate = function() {
            that.requestID = that.requestAnimationFrame(that.animate);

            if (!that.isElementVisible()) {
              // only update when actually needed
              return;
            } else if (!that.visible) {
              // rendering element was not visible, but is now
              that.needsImmediateUpdate = true;
            }
            that.visible = that.isElementVisible();

            var tNow = Date.now();
            var tElapsed = (that.tLastFrame === undefined) ? 0 : tNow - that.tLastFrame;

            if (that.needsImmediateUpdate) {
              that.tLastFrame = tNow - (tElapsed % that.frameInterval);
              that.update(tElapsed);
              that.needsImmediateUpdate = false;
            } else {
              // Drop cycles when the animation loop gets too slow to lower CPU usage
              if (that.dropCycles > 0) {
                that.dropCycles--;
                return;
              } else if (tElapsed >= that.skippedFramesForDropCycles * that.frameInterval) {
                that.dropCycles = Math.min(that.maxDropCycles, Math.floor(tElapsed / that.frameInterval));
              }

              if (tElapsed >= that.frameInterval) {
                that.tLastFrame = tNow - (tElapsed % that.frameInterval);
                that.update(tElapsed);
              }
            }
          };

          this.update = function(tElapsed) {
            if (!angular.isDefined(gz3d.scene)) {
              return;
            }

            userNavigationService.update(tElapsed);
            gz3d.scene.render();
          };

          this.initAnimationFrameFunctions = function() {
            /**
             * global requestAnimationFrame() and cancelAnimationFrame()
             *
             * these global functions serve as wrappers of a native $window method (see https://css-tricks.com/using-requestanimationframe/ for detailed explanation)
             * in order to cover different API conventions and browser versions (see vendors)
             *
             * both functions are needed within Initialize() / deInitialize()
             * taken from three.js r62, where it was exposed globally in this fashion
             */
            // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
            // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
            // requestAnimationFrame polyfill by Erik Möller
            // fixes from Paul Irish and Tino Zijdel
            // using 'self' instead of 'window' for compatibility with both NodeJS and IE10.

            this.requestAnimationFrame = window.requestAnimationFrame.bind(window);
            this.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

            var vendors = [ 'ms', 'moz', 'webkit', 'o' ];
            for ( var x = 0; x < vendors.length && !this.requestAnimationFrame; x = x+1 ) {
              this.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ].bind(window);
              this.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ].bind(window) || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ].bind(window);
            }

            if ( this.requestAnimationFrame === undefined && setTimeout !== undefined ) {
              this.requestAnimationFrame = function ( callback ) {
                var currTime = Date.now(), timeToCall = Math.max( 0, this.frameInterval - ( currTime - this.tLastFrame ) );
                var id = setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
                this.tLastFrame = currTime + timeToCall;
                return id;
              };
              console.info('requestAnimationFrame undefined, using self-defined');
            }

            if( this.cancelAnimationFrame === undefined && clearTimeout !== undefined ) {
              console.info('cancelAnimationFrame undefined, using self-defined');
              this.cancelAnimationFrame = function ( id ) { clearTimeout( id ); };
            }
          };

          this.setFPSLimit = function(fps) {
            this.frameInterval = 1000 / fps;
          };

          this.isElementVisible = function() {
            // Check page visibily
            var isPageVisible = true;
            if (typeof document.hidden !== 'undefined')
            {
              isPageVisible = !document.hidden;
            }
            else if (typeof document.msHidden !== 'undefined')
            {
              isPageVisible = !document.msHidden;
            }
            else if (typeof document.webkitHidden !== 'undefined')
            {
              isPageVisible = !document.webkitHidden;
            }

            return isPageVisible;
          };

          this.updateInitialCameraPose = function (pose) {
            if (pose !== null) {
              gz3d.scene.setDefaultCameraPose.apply(gz3d.scene, pose);
              userNavigationService.setDefaultPose.apply(userNavigationService, pose);
            }
          };

          this.onStateChanged = function (newState) {
            if (newState === STATE.STOPPED) {
              if (gz3d.iface && gz3d.iface.webSocket) {
                gz3d.iface.webSocket.disableRebirth();
              }
            }
          };

          this.onSceneLoaded = function () {
            delete this.assetLoadingSplashScreen;

            nrpAnalytics.durationEventTrack('Browser-initialization', {
              category: 'Simulation'
            });
            nrpAnalytics.tickDurationEvent('Simulate');

            // make light's helper geometry visible
            gz3d.scene.showLightHelpers = true;
            that.sceneInitialized.resolve();
            gz3d.setLightHelperVisibility();
            userNavigationService.init();
            this.sceneLoading = false;
          };

          // Init composer settings
          this.initComposerSettings = function ()
          {
            this.loadingEnvironmentSettingsPanel = true;
            collab3DSettingsService.loadSettings()
            .finally(function () {
              that.loadingEnvironmentSettingsPanel = false;
            });
          };

          this.hasCameraView = function () {
            return gz3d.scene && gz3d.scene.viewManager && gz3d.scene.viewManager.views.some(function(v){return v.type && v.type === 'camera';});
          };
        }

        var service = new EnvironmentRenderingService();

        return service;
      }
    ]);
}());
