(function () {
  'use strict';

  var ctx = 'context_id';
  var experimentID = 'experimentID';
  var experimentFolderUUID = 'experimentFolderUUID';
  var hostName = 'myBackend';

  var matureExperiment = {
    configuration: {
      maturity: 'production',
      name: 'Mature experiment name'
    },
    availableServers: [hostName],
    joinableServers: [{
      server: hostName,
      runningSimulation: {
        owner: 'vonarnim',
        simulationID: 1
      }
    }]
  };

  var defaultPageOptions = {
    dev: false,
    collab: false,
    slurm: {
      nodes: [20, 14, 0, 34]
    },
    me: {
      id: 'vonarnim',
      username: 'cmartins',
      displayName: 'Claudio Sousa'
    },
    groups: { result: ['hbp-sp10-user-edit-rights'] },
    experiments: {
      matureExperiment: matureExperiment,
      developementExperiment: {
        configuration: {
          maturity: 'devel',
          name: 'Developement experiment name'
        },
        availableServers: [],
        joinableServers: []
      }
    },
    collabExperimentResponse: { contextID: ctx, experimentID: experimentID, experimentFolderUUID: experimentFolderUUID},
    server: {
      gzweb: {
        assets: 'http://localhost:8040',
        'nrp-services': 'http://localhost:8080'
      },
      rosbridge: { topics: {} }
    },
    startExperiment: {
      'simulationID': 1,
      'state': 'paused'
    },
    userQuery: {
      _embedded: {
        users: [{
          id: 'vonarnim'
        }]
      }
    }
  };

  describe('Controller: esvExperimentsCtrl', function () {
    var $controller, $httpBackend, $rootScope,$timeout, $templateCache, $compile, $stateParams, $interval, environmentService,
      $location, bbpConfig, proxyUrl, roslib, oidcUrl, experimentsFactory, SERVER_POLL_INTERVAL, $window, collabFolderAPIService, $q, collabExperimentLockService, hbpDialogFactory, nrpBackendVersions, nrpFrontendVersion,collabConfigService;

    var serverErrorMock = {
      displayHTTPError: jasmine.createSpy('displayHTTPError').and.callFake(function() { return $q.reject(); })
    };
   var nrpBackendVersionsObject = {
     get: jasmine.createSpy('get')
   };
    beforeEach(module('exdFrontendApp'));
    beforeEach(module('exd.templates'));

    beforeEach(module(function ($provide) {
      $provide.value('nrpBackendVersions', jasmine.createSpy('nrpBackendVersions').and.returnValue(nrpBackendVersionsObject));
      $provide.value('nrpFrontendVersion', { get: jasmine.createSpy('get') });
      $provide.value('serverError', serverErrorMock);

      $provide.value('simulationConfigService',
        {
          initConfigFiles: jasmine.createSpy('initConfigFiles').and.returnValue(
            {
              then: function (f)
              {
                f();
                return { catch: jasmine.createSpy('catch') };
              }
            }
          )
        }
      );

    }));

    beforeEach(inject(function (
      _$controller_, _$rootScope_, _$timeout_, _$httpBackend_, _$templateCache_, _$compile_, _$stateParams_, _$interval_, _environmentService_,
      _$location_, _bbpConfig_, _roslib_, _experimentsFactory_, _SERVER_POLL_INTERVAL_, _$window_, _collabFolderAPIService_, _$q_, _collabExperimentLockService_, _hbpDialogFactory_,
       _nrpBackendVersions_, _nrpFrontendVersion_, _collabConfigService_){
      $controller = _$controller_;
      $httpBackend = _$httpBackend_;
      $templateCache = _$templateCache_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      $compile = _$compile_;
      $stateParams = _$stateParams_;
      $interval = _$interval_;
      $location = _$location_;
      bbpConfig = _bbpConfig_;
      roslib = _roslib_;
      experimentsFactory = _experimentsFactory_;
      SERVER_POLL_INTERVAL = _SERVER_POLL_INTERVAL_;
      proxyUrl = bbpConfig.get('api.proxy.url');
      oidcUrl = bbpConfig.get('api.user.v0');
      $window = _$window_;
      collabFolderAPIService = _collabFolderAPIService_;
      $q = _$q_;
      collabExperimentLockService = _collabExperimentLockService_;
      hbpDialogFactory = _hbpDialogFactory_;
      environmentService = _environmentService_;
      nrpBackendVersions = _nrpBackendVersions_;
      nrpFrontendVersion = _nrpFrontendVersion_;
      collabConfigService = _collabConfigService_;
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    function renderEsvWebPage(options) {
      var slurmUrl = bbpConfig.get('api.slurmmonitor.url');

      window.bbpConfig.localmode.forceuser = true;
      var pageOptions = _.defaults({}, options, defaultPageOptions);
      //var experimentIds = _.map(pageOptions.experiments, function (val, key) { return key; });

      if (pageOptions.dev) {
        spyOn($location, 'search').and.returnValue({ dev: true });
      }

      $httpBackend.whenGET(oidcUrl + '/user?filter=id=' + defaultPageOptions.me.id).respond(200, pageOptions.userQuery);

      environmentService.setPrivateExperiment(pageOptions.collab);

      $httpBackend.whenGET(new RegExp(proxyUrl + '/experiments')).respond(200, pageOptions.experiments);
      $httpBackend.whenGET(new RegExp(proxyUrl + '/experimentImage/')).respond(200, {});
      $httpBackend.whenGET(slurmUrl + '/api/v1/partitions/interactive').respond(200, pageOptions.slurm);
      $httpBackend.whenGET(oidcUrl + '/user/me').respond(200, pageOptions.me);
      $httpBackend.whenGET(oidcUrl + '/user/me/groups').respond(200, pageOptions.groups);

      $controller('esvExperimentsCtrl', {
        $rootScope: $rootScope,
        $scope: $rootScope
      });

      var template = $templateCache.get('views/esv/esv-experiments.html');
      var page = $compile(template)($rootScope);

      $httpBackend.flush();
      $rootScope.$apply();

      return page;
    }

    it('should show only mature experiments in normal mode', function () {
      var page = renderEsvWebPage();
      var experiments = page.find('.experiment-box');
      expect(experiments.length).toBe(1);
      var expTitle = $(experiments).find('.title-line:first > .h4').text();
      expect(expTitle.trim()).toBe(defaultPageOptions.experiments.matureExperiment.configuration.name);
    });

    it('should show all experiments in dev mode', function () {
      var page = renderEsvWebPage({ dev: true });
      var experiments = page.find('.experiment-box');
      expect(experiments.length).toBe(2);
    });

    it('should not allow to chose backend when in dev mode', function () {
      var page = renderEsvWebPage();
      //select first experiement
      page.find('.experiment-box').first().click();

      var selectServer = page.find('select[ng-model="exp.devServer"]');
      expect(selectServer.length).toBe(0);
    });

    it('should allow to chose backend when in dev mode', function () {
      var page = renderEsvWebPage({ dev: true });
      //select first experiment
      page.find('.experiment-box').first().click();

      var selectServer = page.find('select[ng-model="exp.devServer"]');
      expect(selectServer.length).toBe(1);
    });

   it('should show version numbers in dev mode', function () {
      var page = renderEsvWebPage({ dev: true });
      //select first experiment
      page.find('.experiment-box').first().click();

      var versionLink = page.find('a[name="versionLink"]');
      expect(versionLink.length).toBe(1);
    });

    it('should not show version numbers in dev mode', function () {
      var page = renderEsvWebPage();
      //select first experiment
      page.find('.experiment-box').first().click();

      var versionLink = page.find('a[name="versionLink"]');
      expect(versionLink.length).toBe(0);
    });
    it('setCollapsed should set the new state correctly', function() {
      renderEsvWebPage();
      //by default isCollapsed should be set to true
      expect($rootScope.isCollapsed).toBe(true);
      expect($rootScope.versionString).toBe('Show versions');

      $rootScope.setCollapsed(false);
      expect($rootScope.isCollapsed).toBe(false);
      expect($rootScope.versionString).toBe('Hide versions');

      $rootScope.setCollapsed(true);
      expect($rootScope.isCollapsed).toBe(true);
      expect($rootScope.versionString).toBe('Show versions');

    });

   it('should set scope.softwareVersions with Frontend version when backend returns error ', function() {
      renderEsvWebPage();
      $rootScope.setCollapsed(false);
      $httpBackend.whenGET(proxyUrl + '/server/normalServer').respond(500, 'Error');
      $rootScope.getSoftwareVersions('normalServer');
      $httpBackend.flush();
      var frontendData = {'toString': 'Frontend: 0.0.1\n' };
      nrpFrontendVersion.get.calls.mostRecent().args[0](frontendData);
      expect($rootScope.softwareVersions).toBe(frontendData.toString);
    });

    it('should set scope.softwareVersions when backend returns normally', function() {
      renderEsvWebPage();
      $rootScope.setCollapsed(false);
      $httpBackend.whenGET(proxyUrl + '/server/normalServer').respond(200, defaultPageOptions.server);
      $rootScope.getSoftwareVersions('normalServer');
      $httpBackend.flush();
      var frontendData = {'toString': 'Frontend: 0.0.1\n' };
      var backendObj = {};
      backendObj.toJSON = function(){return backendObj.data;};
      backendObj.toString = 'Backend:\nhbp_nrp_cle: 0.0.5.dev0\nhbp_nrp_backend: 0.0.4\n';
      nrpFrontendVersion.get.calls.mostRecent().args[0](frontendData);
      nrpBackendVersionsObject.get.calls.mostRecent().args[0](backendObj);
      expect($rootScope.softwareVersions).toBe(frontendData.toString+backendObj.toString);
    });

    it('should show experiments sorted by name', function () {
      var page = renderEsvWebPage({ dev: true });
      var experimentTitles = page.find('.experiment-box .title-line > .h4').toArray().map(function (elem) {
        return elem.textContent.trim();
      });

      var sortedExperimentNames = _.map(defaultPageOptions.experiments, function (val) { return val.configuration.name; }).sort();
      expect(experimentTitles).toEqual(sortedExperimentNames);
    });

    function checkButtonVisibility(page, analyticsEvent, expected) {
      var buttonsElements = page.find('[analytics-event="' + analyticsEvent + '"]');
      expect(buttonsElements.length).toBe(expected);
    }
    function checkButtonsVisibility(page, options) {
      checkButtonVisibility(page, 'Launch', options.launch);
      checkButtonVisibility(page, 'Clone', options.clone);
    }

    function checkNewExperimentButtonsVisibility(page, options) {
      checkButtonVisibility(page, 'uploadEnvironment', options.environment);
      checkButtonVisibility(page, 'uploadRobot', options.robot);
      checkButtonVisibility(page, 'uploadBrain', options.brain);
      checkButtonVisibility(page, 'CloneNewExperiment', options.cloneNew);
    }

    it('should allow launching when available servers', function () {
      var page = renderEsvWebPage({ dev: true });
      page.find('.experiment-box').last().click();
      checkButtonVisibility(page, 'Launch', 1);
    });

    it('should NOT allow launching when NO available server', function () {
      var page = renderEsvWebPage({ dev: true });
      page.find('.experiment-box').first().click();
      checkButtonVisibility(page, 'Launch', 0);
    });

    it('should trigger the right requests when launching an experiment', function () {
      var page = renderEsvWebPage();
      page.find('.experiment-box').first().click();

      spyOn(Math, 'random').and.returnValue(0);
      spyOn(Date, 'now').and.returnValue(0);

      //get server config
      $httpBackend.whenGET(proxyUrl + '/server/' + hostName).respond(200, defaultPageOptions.server);
      //start experiment
      var startUrl = defaultPageOptions.server.gzweb['nrp-services'] + '/simulation';
      $httpBackend.whenPOST(startUrl).respond(200, defaultPageOptions.startExperiment);
      $httpBackend.whenGET(startUrl).respond(200, [{ 'simulationID': 1, 'state': 'paused', 'creationUniqueID': '0' }]);

      //mock roslib
      spyOn(roslib, 'createStringTopic').and.returnValue({ subscribe: angular.noop });

      spyOn($location, 'path');

      page.find('[analytics-event="Launch"]').click();
      $httpBackend.flush();
      $timeout.flush();
      $httpBackend.flush();
      $rootScope.$digest();

      //simulation url
      var experimentID = Object.keys(defaultPageOptions.experiments)[0];
      var simulationID = defaultPageOptions.startExperiment.simulationID;
      var expectedLocation = ['esv-web/experiment-view/' + hostName + '/' + experimentID + '/false/' + simulationID];

      expect($location.path.calls.mostRecent().args).toEqual(expectedLocation);
    });

    it('should reset startingExperiment when failing to launch an experiment', function () {
       var page = renderEsvWebPage();
      page.find('.experiment-box').first().click();

      //get server config
      $httpBackend.whenGET(proxyUrl + '/server/' + hostName).respond(200, defaultPageOptions.server);
      //start experiment
      var startUrl = defaultPageOptions.server.gzweb['nrp-services'] + '/simulation';
      $httpBackend.whenPOST(startUrl).respond(500, defaultPageOptions.startExperiment);
      $httpBackend.whenGET(startUrl).respond(500, [defaultPageOptions.startExperiment]);

      //mock roslib
      spyOn(roslib, 'createStringTopic').and.returnValue({ subscribe: angular.noop });
      spyOn($location, 'path');


      page.find('[analytics-event="Launch"]').click();
      expect($rootScope.pageState.startingExperiment).toBe($rootScope.experiments[0].id);
      $httpBackend.flush();
      $timeout.flush();
      $httpBackend.flush();
      $rootScope.$digest();
      expect($rootScope.pageState.startingExperiment).toBe(null);

    });

    it('should trigger the right requests when stopping a simulation', function () {
      var page = renderEsvWebPage();
      page.find('.experiment-box').first().click();
      var simulationUrl = defaultPageOptions.server.gzweb['nrp-services'] + '/simulation/' + defaultPageOptions.startExperiment.simulationID + '/state';
      //get server config
      $httpBackend.whenGET(proxyUrl + '/server/' + hostName).respond(200, defaultPageOptions.server);
      //get simulation state
      $httpBackend.whenGET(simulationUrl).respond(200, { state: 'halted' });
      //get simulation state
      $httpBackend.whenPUT(simulationUrl).respond(200);

      page.find('[analytics-event="Stop"]').click();
      $httpBackend.flush();
    });

    it('should change path when joining a simulation', function () {
      var page = renderEsvWebPage();
      page.find('.experiment-box').first().click();

      spyOn($location, 'path');
      page.find('a[analytics-event="Join"]').click();
      var experimentID = Object.keys(defaultPageOptions.experiments)[0];
      var simulationID = defaultPageOptions.startExperiment.simulationID;
      var expectedLocation = ['esv-web/experiment-view/' + hostName + '/' + experimentID + '/false/' + simulationID];
      expect($location.path.calls.mostRecent().args).toEqual(expectedLocation);
    });

    it('should requery experiements after SERVER_POLL_INTERVAL', function () {
      renderEsvWebPage();
      $httpBackend.expectGET(proxyUrl + '/experiments').respond(200, defaultPageOptions.experiments);
      $interval.flush(SERVER_POLL_INTERVAL);
      $httpBackend.flush();
    });


    it('should destroy the experimentsService on scope destroy', function () {
      var experimentsService;
      var createExperimentsService = experimentsFactory.createExperimentsService;
      spyOn(experimentsFactory, 'createExperimentsService').and.callFake(function () {
        experimentsService = createExperimentsService.apply(experimentsFactory, arguments);
        return experimentsService;
      });
      renderEsvWebPage();
      spyOn(experimentsService, 'destroy').and.callThrough();

      $rootScope.$broadcast('$destroy');
      $rootScope.$digest();
      expect(experimentsService.destroy).toHaveBeenCalled();
    });

    describe('esvExperimentsCtrl without a context id', function () {

      it('should show the right buttons', function () {
        var page = renderEsvWebPage();
        page.find('.experiment-box').first().click();

        checkButtonsVisibility(page, { launch: 1, clone: 0 });
      });

      it('should show the right buttons when editing right', function () {
        var page = renderEsvWebPage();
        page.find('.experiment-box').first().click();
        var angularElement = angular.element;
        var uploadElement;
        spyOn(angular, 'element').and.callFake(function (e) {
          uploadElement = angularElement(e);
          return uploadElement;
        });
      });
    });


    describe('Collab experiments', function () {
      var collabContextlessUrl, collabContextUrl;

      beforeEach(function () {
        collabContextlessUrl = bbpConfig.get('api.collabContextManagement.url') + '/collab/configuration';
        collabContextUrl = collabContextlessUrl + '/' + ctx;
        $stateParams.ctx = ctx;
      });

      it('should set experiments to error when collab fails', function () {
        $httpBackend.whenGET(collabContextUrl).respond(502, {});
        renderEsvWebPage({collab:true});
        expect($rootScope.experiments).toEqual([{ error: { name: 'Internal Error', description: 'Database unavailable' } }]);
        expect(serverErrorMock.displayHTTPError).toHaveBeenCalled();
      });

      describe('yet to clone', function () {

        beforeEach(function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, {});
        });

        it('should only show the clone button', function () {
          var page = renderEsvWebPage({collab:true});
          page.find('.experiment-box').last().click();
          checkButtonsVisibility(page, { launch: 0, clone: 1 });
        });

        it('should only show the correct new experiment buttons', function () {
          var page = renderEsvWebPage({collab:true,dev:true});
          page.find('.experiment-box').first().click();
          checkNewExperimentButtonsVisibility(page, { environment: 1, robot: 1, brain: 1,cloneNew:1 });
        });

        it('should trigger PUT request on clone click', function () {
          var page = renderEsvWebPage();
          page.find('.experiment-box').last().click();
          spyOn($window.location, 'reload');
          $httpBackend.whenPUT(collabContextlessUrl).respond(200, {});
          page.find('[analytics-event="Clone"]').click();
        });

        it('should trigger reload after clone', function () {
          renderEsvWebPage();
          spyOn($window.location, 'reload');
          spyOn(collabConfigService, 'clone');
          $rootScope.cloneExperiment('experiment_id');
          collabConfigService.clone.calls.mostRecent().args[2]();
          expect($window.location.reload).toHaveBeenCalled();
        });
      });


      describe('with cloned experiment', function () {

        beforeEach(function () {
          $httpBackend.whenGET(new RegExp(proxyUrl + '/joinableServers/')).respond(200, []);
          $httpBackend.whenGET(new RegExp(proxyUrl + '/availableServers/')).respond(200, matureExperiment.availableServers);
          spyOn(collabFolderAPIService, 'getFolderFile').and.returnValue($q.when({_uuid: 'fakeUUID'}));
          spyOn(collabFolderAPIService, 'downloadFile').and.returnValue($q.when(''));
        });

        it('should select first experiment if only one experiment is shown', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          renderEsvWebPage({ experiments: { matureExperiment: matureExperiment } });
          expect($rootScope.pageState.selected).toBeDefined($rootScope.experiments[0].id);
        });

        it('should not select an experiment if multiple experiments are shown', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, {});
          renderEsvWebPage();
          expect($rootScope.pageState.selected).toBeUndefined();
        });

        it('should only show the launch button when the experiment exists in collab', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var page = renderEsvWebPage({collab:true});
          page.find('.experiment-box').first().click();
          checkButtonsVisibility(page, { launch: 1, clone: 0 });
        });

        it('should show edit button', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var page = renderEsvWebPage();
          var editButton = page.find('[name=edit-button]').first();
          expect(editButton.length).toBe(1);
        });

        it('test editExperiment when it is not a collab experiment', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var testUser = 'testUserID';
          var lockMock = jasmine.createSpyObj('lockMock', ['tryAddLock']);
          lockMock.tryAddLock.and.callFake(function(){return $q.when({success: true, lock: {lockInfo:{user:{id: testUser}}}});});
          spyOn(collabExperimentLockService, 'createLockServiceForContext').and.returnValue(lockMock);
          renderEsvWebPage();
          environmentService.setPrivateExperiment(false);
          $rootScope.editing.nameID = false;

          $rootScope.editExperiment('nameID');
          expect($rootScope.editing.nameID).toBe(false);
          expect(lockMock.tryAddLock).not.toHaveBeenCalled();
        });

        it('test editExperiment when everything goes normally', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var testUser = 'testUserID';
          var lockMock = jasmine.createSpyObj('lockMock', ['tryAddLock']);
          lockMock.tryAddLock.and.callFake(function(){return $q.when({success: true, lock: {lockInfo:{user:{id: testUser}}}});});
          spyOn(collabExperimentLockService, 'createLockServiceForContext').and.returnValue(lockMock);
          renderEsvWebPage({collab:true});
          $rootScope.userinfo.userID = testUser;
          environmentService.setPrivateExperiment(true);
          spyOn(hbpDialogFactory, 'alert');
          $rootScope.editing.nameID = false;

          $rootScope.editExperiment('nameID');
          $rootScope.$digest();
          expect($rootScope.editing.nameID).toBe(true);
          expect(lockMock.tryAddLock).toHaveBeenCalled();
          expect(hbpDialogFactory.alert).not.toHaveBeenCalled();
        });

        it('test editExperiment when someone else is the owner of the edit lock', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var testUser = 'testUserID';
          var lockMock = jasmine.createSpyObj('lockMock', ['tryAddLock']);
          lockMock.tryAddLock.and.callFake(function(){return $q.when({success: false, lock: {lockInfo:{user:{id: testUser}}}});});
          spyOn(collabExperimentLockService, 'createLockServiceForContext').and.returnValue(lockMock);
          renderEsvWebPage({collab:true});
          environmentService.setPrivateExperiment(true);
          spyOn(hbpDialogFactory, 'alert');
          $rootScope.userinfo.userID = 'a different user';
          $rootScope.editing.nameID = false;

          $rootScope.editExperiment('nameID');
          $rootScope.$digest();
          expect($rootScope.editing.nameID).toBe(false);
          expect(hbpDialogFactory.alert).toHaveBeenCalled();
        });

        it('test editExperiment when an error came from the lock service', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var lockMock = jasmine.createSpyObj('lockMock', ['tryAddLock']);
          lockMock.tryAddLock.and.callFake(function(){return $q.reject(new Error());});
          spyOn(collabExperimentLockService, 'createLockServiceForContext').and.returnValue(lockMock);
          renderEsvWebPage({collab:true});
          $rootScope.isPrivateExperiment = true;
          $rootScope.editing.nameID = false;
          spyOn(hbpDialogFactory, 'alert');
          $rootScope.userinfo.userID = 'a different user';

          $rootScope.editExperiment('nameID');
          $rootScope.$digest();
          expect($rootScope.editing.nameID).toBe(false);
          expect(hbpDialogFactory.alert).toHaveBeenCalled();
        });

        it('test stopEditingExperimentDetails', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var lockMock = jasmine.createSpyObj('lockMock', ['releaseLock']);
          lockMock.releaseLock.and.callFake(function(){return $q.when('');});
          spyOn(collabExperimentLockService, 'createLockServiceForContext').and.returnValue(lockMock);
          renderEsvWebPage({collab:true});
          $rootScope.editing.nameID = true;
          spyOn(hbpDialogFactory, 'alert');

          $rootScope.stopEditingExperimentDetails('nameID');
          expect($rootScope.editing.nameID).toBe(false);
          expect(lockMock.releaseLock).toHaveBeenCalled();
          expect(hbpDialogFactory.alert).not.toHaveBeenCalled();
        });

        it('test stopEditingExperimentDetails deal with lock exceptions', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var lockMock = jasmine.createSpyObj('lockMock', ['releaseLock']);
          lockMock.releaseLock.and.callFake(function(){ return $q.reject(new Error());});
          spyOn(collabExperimentLockService, 'createLockServiceForContext').and.returnValue(lockMock);
          renderEsvWebPage({collab:true});
          $rootScope.editing.nameID = true;
          spyOn(hbpDialogFactory, 'alert');

          $rootScope.stopEditingExperimentDetails('nameID');
          $rootScope.$digest();
          expect(hbpDialogFactory.alert).toHaveBeenCalled();
          expect($rootScope.editing.nameID).toBe(false);
        });

        it('test saveExperimentDetails when description is empty', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var lockMock = jasmine.createSpyObj('lockMock', ['releaseLock']);
          lockMock.releaseLock.and.callFake(function(){ return $q.reject(new Error());});
          spyOn(collabExperimentLockService, 'createLockServiceForContext').and.returnValue(lockMock);
          renderEsvWebPage({collab:true});
          spyOn(collabFolderAPIService, 'deleteFile');
          spyOn(collabFolderAPIService, 'createFolderFile');
          spyOn(hbpDialogFactory, 'alert');

          $rootScope.saveExperimentDetails('    ');
          expect(hbpDialogFactory.alert).toHaveBeenCalled();
          expect(collabFolderAPIService.deleteFile).not.toHaveBeenCalled();
        });

        it('test saveExperimentDetails gives error when tags are in the user input', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          renderEsvWebPage({collab:true});
          spyOn(collabFolderAPIService, 'deleteFile');
          spyOn(hbpDialogFactory, 'alert');

          $rootScope.saveExperimentDetails('<tag>dkhfdf</tag>');
          expect(hbpDialogFactory.alert).toHaveBeenCalled();
          expect(collabFolderAPIService.deleteFile).not.toHaveBeenCalled();
        });

        it('test saveExperimentDetails gives error when no xml is retrived from collab', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var experimentsService;
          var createExperimentsService = experimentsFactory.createExperimentsService;
          spyOn(experimentsFactory, 'createExperimentsService').and.callFake(function () {
            experimentsService = createExperimentsService.apply(experimentsFactory, arguments);
            return experimentsService;
          });
          renderEsvWebPage({collab:true});
          spyOn(experimentsService, 'getCollabExperimentXML').and.returnValue('');
          spyOn(hbpDialogFactory, 'alert');
          $rootScope.formInfo = {name:'NewName', desc:'newDesc'};

          $rootScope.saveExperimentDetails('newName', 'nameID');
          expect(hbpDialogFactory.alert).toHaveBeenCalled();
          expect(experimentsService.getCollabExperimentXML).toHaveBeenCalled();
        });

        it('test saveExperimentDetails doesnt bother to save if name hasnt changed', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var experimentsService;
          var createExperimentsService = experimentsFactory.createExperimentsService;
          spyOn(experimentsFactory, 'createExperimentsService').and.callFake(function () {
            experimentsService = createExperimentsService.apply(experimentsFactory, arguments);
            return experimentsService;
          });
          renderEsvWebPage({collab:true});
          $rootScope.experiments=[{'configuration':{'name':'newName'}}];
          spyOn(experimentsService, 'getCollabExperimentXML').and.returnValue('some xml');
          spyOn(collabFolderAPIService, 'deleteFile').and.returnValue($q.when(''));
          spyOn(collabFolderAPIService, 'createFolderFile').and.returnValue($q.when(''));
          spyOn($rootScope, 'stopEditingExperimentDetails');
          spyOn(hbpDialogFactory, 'alert');
          $rootScope.formInfo = {name:'newName', desc:'newDesc'};

          $rootScope.saveExperimentDetails('newName', 'nameID');
          expect(hbpDialogFactory.alert).not.toHaveBeenCalled();
          expect(collabFolderAPIService.deleteFile).not.toHaveBeenCalled();
          expect($rootScope.stopEditingExperimentDetails).toHaveBeenCalled();
          expect($rootScope.isSavingToCollab).toBe(false);
        });

        it('test saveExperimentDetails doesnt bother to save if description hasnt changed', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var experimentsService;
          var createExperimentsService = experimentsFactory.createExperimentsService;
          spyOn(experimentsFactory, 'createExperimentsService').and.callFake(function () {
            experimentsService = createExperimentsService.apply(experimentsFactory, arguments);
            return experimentsService;
          });
          renderEsvWebPage({collab:true});
          $rootScope.experiments=[{'configuration':{'description':'newDesc'}}];
          spyOn(experimentsService, 'getCollabExperimentXML').and.returnValue('some xml');
          spyOn(collabFolderAPIService, 'deleteFile').and.returnValue($q.when(''));
          spyOn(collabFolderAPIService, 'createFolderFile').and.returnValue($q.when(''));
          spyOn($rootScope, 'stopEditingExperimentDetails');
          spyOn(hbpDialogFactory, 'alert');
          $rootScope.formInfo = {name:'newName', desc:'newDesc'};

          $rootScope.saveExperimentDetails('newDesc', 'descID');
          expect(hbpDialogFactory.alert).not.toHaveBeenCalled();
          expect(collabFolderAPIService.deleteFile).not.toHaveBeenCalled();
          expect($rootScope.stopEditingExperimentDetails).toHaveBeenCalled();
          expect($rootScope.isSavingToCollab).toBe(false);
        });

        it('test saveExperimentDetails when everything goes well saving name', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var experimentsService;
          var createExperimentsService = experimentsFactory.createExperimentsService;
          spyOn(experimentsFactory, 'createExperimentsService').and.callFake(function () {
            experimentsService = createExperimentsService.apply(experimentsFactory, arguments);
            return experimentsService;
          });
          renderEsvWebPage({collab:true});
          spyOn(experimentsService, 'getCollabExperimentXML').and.returnValue('some xml');
          spyOn(collabFolderAPIService, 'deleteFile').and.returnValue($q.when(''));
          spyOn(collabFolderAPIService, 'createFolderFile').and.returnValue($q.when(''));
          spyOn($rootScope, 'stopEditingExperimentDetails');
          $rootScope.editing.nameID = true;
          spyOn(hbpDialogFactory, 'alert');
          $rootScope.formInfo = {name:'newName'};

          $rootScope.saveExperimentDetails('newName', 'nameID');
          $rootScope.$digest();
          expect(hbpDialogFactory.alert).not.toHaveBeenCalled();
          expect($rootScope.stopEditingExperimentDetails).toHaveBeenCalled();
          expect($rootScope.isSavingToCollab).toBe(false);
          expect($rootScope.experiments[0].configuration.name).toBe('newName');
        });

        it('test saveExperimentDetails when everything goes well saving description', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var experimentsService;
          var createExperimentsService = experimentsFactory.createExperimentsService;
          spyOn(experimentsFactory, 'createExperimentsService').and.callFake(function () {
            experimentsService = createExperimentsService.apply(experimentsFactory, arguments);
            return experimentsService;
          });
          renderEsvWebPage({collab:true});
          spyOn(experimentsService, 'getCollabExperimentXML').and.returnValue('some xml');
          spyOn(collabFolderAPIService, 'deleteFile').and.returnValue($q.when(''));
          spyOn(collabFolderAPIService, 'createFolderFile').and.returnValue($q.when(''));
          spyOn($rootScope, 'stopEditingExperimentDetails');
          spyOn(hbpDialogFactory, 'alert');
          $rootScope.formInfo = {desc:'newDesc'};

          $rootScope.saveExperimentDetails('newDesc', 'descID');
          $rootScope.$digest();
          expect(hbpDialogFactory.alert).not.toHaveBeenCalled();
          expect($rootScope.stopEditingExperimentDetails).toHaveBeenCalled();
          expect($rootScope.isSavingToCollab).toBe(false);
          expect($rootScope.experiments[0].configuration.description).toBe('newDesc');
        });
        it('test saveExperimentDetails when there is an error saving the new details to the collab', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          var experimentsService;
          var createExperimentsService = experimentsFactory.createExperimentsService;
          spyOn(experimentsFactory, 'createExperimentsService').and.callFake(function () {
            experimentsService = createExperimentsService.apply(experimentsFactory, arguments);
            return experimentsService;
          });
          renderEsvWebPage({collab:true});
          spyOn(experimentsService, 'getCollabExperimentXML').and.returnValue('some xml');
          spyOn(collabFolderAPIService, 'deleteFile').and.returnValue($q.when(''));
          spyOn(collabFolderAPIService, 'createFolderFile').and.returnValue($q.reject(''));
          spyOn($rootScope, 'stopEditingExperimentDetails');
          $rootScope.editing.nameID = true;
          spyOn(hbpDialogFactory, 'alert');
          $rootScope.formInfo = {name:'newName', desc:'newDesc'};

          $rootScope.saveExperimentDetails('newName', 'nameID');
          $rootScope.$digest();
          expect(hbpDialogFactory.alert).toHaveBeenCalled();
          expect($rootScope.stopEditingExperimentDetails).not.toHaveBeenCalled();
          expect($rootScope.isSavingToCollab).toBe(false);
          expect($rootScope.experiments[0].configuration.name).not.toBe('newName');
        });

        it('test containsTags', function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
          renderEsvWebPage();
          expect($rootScope.containsTags('some text')).toBe(false);
          expect($rootScope.containsTags(' 2 < 3')).toBe(false);
          expect($rootScope.containsTags('<hello')).toBe(true);
          expect($rootScope.containsTags('<hello>')).toBe(true);
        });
      });

    });

  });
})();
