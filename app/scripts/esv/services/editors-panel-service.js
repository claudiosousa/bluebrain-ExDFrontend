
/* global console: false */

(function () {
  'use strict';

  angular.module('editorsPanelModule', [])

    .factory('editorsPanelService', [
      '$window',
      'environmentService', 'simulationInfo', 'userContextService', 'nrpAnalytics',
      function ($window,
                environmentService, simulationInfo, userContextService, nrpAnalytics) {

        function EditorsPanelService() {

          var that = this;

          this.showEditorPanel = false;

          this.init = function () {
            if (environmentService.isPrivateExperiment()) {
              // only use locks if we are in a private collab
              this.cancelLockSubscription = userContextService.lockService.onLockChanged(that.onLockChanged);
            }
          };

          this.deinit = function () {
            if (environmentService.isPrivateExperiment()) {
              this.cancelLockSubscription();
            }
          };

          this.toggleEditors = function () {
            if (!environmentService.isPrivateExperiment()) {
              that.showEditorsPanel();
            } else {
              if (!that.showEditorPanel) {
                that.loadingEditPanel = true;
                // try and add a lock for editing
                userContextService.lockService.tryAddLock()
                .then(that.onTryAddLock)
                .catch(function () {
                  $window.alert("There was an error when opening the edit panel, please try again later.");
                })
                .finally(function () {
                  that.loadingEditPanel = false;
                });
              } else {
                that.showEditorsPanel();
                userContextService.removeEditLock();
              }
            }

          };

          this.showEditorsPanel = function () {
            this.showEditorPanel = !this.showEditorPanel;
            nrpAnalytics.eventTrack('Toggle-editor-panel', {
              category: 'Simulation-GUI',
              value: this.showEditorPanel
            });
          };

          this.onLockChanged = function (lockChange) {
            if (!lockChange.locked && userContextService.userEditingID === userContextService.userID) {
              if (that.showEditorPanel) {
                // we are the current user editing, but our lock has been released...
                // (this can happen if two users want to edit at the same time)
                $window.alert("You no longer have the lock to edit anymore. Please try again.");
                that.toggleEditors();
              }
            }
          };

          this.onTryAddLock = function (result) {
            if (!result.success && result.lock && result.lock.lockInfo.user.id !== userContextService.userID) {
              userContextService.setLockDateAndUser(result.lock.lockInfo);
              $window.alert("Sorry you cannot edit at this time. Only one user can edit at a time and " +
                userContextService.userEditing + " started editing " + userContextService.timeEditStarted +
                ". Please try again later.");
              userContextService.setEditDisabled(true);
            } else {
              userContextService.userEditingID = userContextService.userID;
              that.showEditorsPanel();
            }
          };
        }

        var service = new EditorsPanelService();
        service.init();

        return service;
      }
    ]);
}());

