(function () {
  'use strict';

  var ctx = 'context_id';
  var experimentID = 'experimentID';
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
        owner: '300568',
        simulationID: 1
      }
    }]
  };

  var defaultPageOptions = {
    dev: false,
    slurm: {
      nodes: [20, 14, 0, 34]
    },
    me: {
      id: '300568',
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
    collabExperimentResponse: { contextID: ctx, experimentID: experimentID },
    server: {
      gzweb: {
        assets: 'http://localhost:8040',
        'nrp-services': 'http://localhost:8080'
      },
      rosbridge: { topics: {} }
    },
    startExperiment: {
      'simulationID': 1
    },
    userQuery: {
      _embedded: {
        users: [{
          id: '300358'
        }]
      }
    }
  };

  describe('Controller: esvExperimentsCtrl', function () {
    var $controller, $httpBackend, $rootScope, $templateCache, $compile, $stateParams, $interval,
      $location, bbpConfig, proxyUrl, roslib, oidcUrl, experimentsFactory, SERVER_POLL_INTERVAL, $window;

    var serverErrorMock = {
      display: jasmine.createSpy('display')
    };

    beforeEach(module('exdFrontendApp'));
    beforeEach(module('exd.templates'));
    beforeEach(module(function ($provide) {
      $provide.value('serverError', serverErrorMock);
    }));
    beforeEach(inject(function (
      _$controller_, _$rootScope_, _$httpBackend_, _$templateCache_, _$compile_, _$stateParams_, _$interval_,
      _$location_, _bbpConfig_, _roslib_, _experimentsFactory_, _SERVER_POLL_INTERVAL_, _$window_) {
      $controller = _$controller_;
      $httpBackend = _$httpBackend_;
      $templateCache = _$templateCache_;
      $rootScope = _$rootScope_;
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
        spyOn($location, 'search').andReturn({ dev: true });
      }

      $httpBackend.whenGET(oidcUrl + '/user?filter=id=' + defaultPageOptions.me.id).respond(200, pageOptions.userQuery);


      $httpBackend.whenGET('views/common/home.html').respond(200);
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
      expect(expTitle).toBe(defaultPageOptions.experiments.matureExperiment.configuration.name);
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

    it('should show experiments sorted by name', function () {
      var page = renderEsvWebPage({ dev: true });
      var experimentTitles = page.find('.experiment-box .title-line > .h4').toArray().map(function (elem) {
        return elem.textContent;
      });

      var sortedExperimentNames = _.map(defaultPageOptions.experiments, function (val) { return val.configuration.name; }).sort();
      expect(experimentTitles).toMatch(sortedExperimentNames);
    });

    function checkButtonVisibility(page, analyticsEvent, expected) {
      var buttonsElements = page.find('[analytics-event="' + analyticsEvent + '"]');
      expect(buttonsElements.length).toBe(expected);
    }
    function checkButtonsVisibility(page, options) {
      checkButtonVisibility(page, 'Launch', options.launch);
      checkButtonVisibility(page, 'Upload-environment', options.upload);
      checkButtonVisibility(page, 'Clone', options.clone);
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

      //get server config
      $httpBackend.whenGET(proxyUrl + '/server/' + hostName).respond(200, defaultPageOptions.server);
      //start experiment
      $httpBackend.whenPOST(defaultPageOptions.server.gzweb['nrp-services'] + '/simulation').respond(200, defaultPageOptions.startExperiment);
      //mock roslib
      spyOn(roslib, 'createStringTopic').andReturn({ subscribe: angular.noop });
      //start experiment
      $httpBackend.whenPOST(defaultPageOptions.server.gzweb['nrp-services'] + '/simulation').respond(200, defaultPageOptions.startExperiment);
      //update experiement state
      $httpBackend.whenPUT(defaultPageOptions.server.gzweb['nrp-services'] + '/simulation/' + defaultPageOptions.startExperiment.simulationID + '/state')
        .respond(200, {});

      spyOn($location, 'path');

      page.find('[analytics-event="Launch"]').click();

      $httpBackend.flush();

      //simulation url
      expect($location.path.mostRecentCall.args).toMatch(['esv-web/gz3d-view/' + hostName + '/' + defaultPageOptions.startExperiment.simulationID]);
    });

    it('should reset startingExperiment when failing to launch an experiment', function () {
      var page = renderEsvWebPage();
      page.find('.experiment-box').first().click();

      //get server config
      $httpBackend.whenGET(proxyUrl + '/server/' + hostName).respond(200, defaultPageOptions.server);
      //start experiment
      $httpBackend.whenPOST(defaultPageOptions.server.gzweb['nrp-services'] + '/simulation').respond(500, defaultPageOptions.startExperiment);

      page.find('[analytics-event="Launch"]').click();
      expect($rootScope.pageState.startingExperiment).toBe($rootScope.experiments[0].id);
      $httpBackend.flush();
      expect($rootScope.pageState.startingExperiment).toBe(null);
    });

    it('should trigger the right requests when stoping a simulation', function () {
      var page = renderEsvWebPage();
      page.find('.experiment-box').first().click();

      var simulationUrl = defaultPageOptions.server.gzweb['nrp-services'] + '/simulation/' + defaultPageOptions.startExperiment.simulationID + '/state';
      //get server config
      $httpBackend.whenGET(proxyUrl + '/server/' + hostName).respond(200, defaultPageOptions.server);
      //start experiment
      // $httpBackend.whenPOST(defaultPageOptions.server.gzweb['nrp-services'] + '/simulation').respond(500, defaultPageOptions.startExperiment);
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
      expect($location.path.mostRecentCall.args).toMatch(['esv-web/gz3d-view/' + hostName + '/' + defaultPageOptions.startExperiment.simulationID]);
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
      spyOn(experimentsFactory, 'createExperimentsService').andCallFake(function () {
        experimentsService = createExperimentsService.apply(experimentsFactory, arguments);
        return experimentsService;
      });
      renderEsvWebPage();
      spyOn(experimentsService, 'destroy').andCallThrough();

      $rootScope.$broadcast('$destroy');
      $rootScope.$digest();
      expect(experimentsService.destroy).toHaveBeenCalled();
    });

    describe('esvExperimentsCtrl without a context id', function () {

      it('should show the right buttons', function () {
        var page = renderEsvWebPage();
        page.find('.experiment-box').first().click();

        checkButtonsVisibility(page, { launch: 1, upload: 1, clone: 0 });
      });

      it('should show the right buttons when editing right', function () {
        var page = renderEsvWebPage();
        page.find('.experiment-box').first().click();
        var angularElement = angular.element;
        var uploadElement;
        spyOn(angular, 'element').andCallFake(function (e) {
          uploadElement = angularElement(e);
          return uploadElement;
        });

        page.find('[analytics-event="Upload-environment"]').click();
        expect(uploadElement).toBeDefined();
        uploadElement.trigger('change', []);
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
        renderEsvWebPage();
        expect($rootScope.experiments).toMatch([{ error: { name: 'Internal Error', description: 'Database unavailable' } }]);
        expect(serverErrorMock.display).toHaveBeenCalled();
      });

      describe('yet to clone', function () {

        beforeEach(function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, {});
        });

        it('should only show the clone button', function () {
          var page = renderEsvWebPage();
          page.find('.experiment-box').first().click();
          checkButtonsVisibility(page, { launch: 0, upload: 0, clone: 1 });
        });

        it('should trigger PUT request on clone click', function () {
          var page = renderEsvWebPage();
          page.find('.experiment-box').first().click();
          spyOn($window.location, 'reload');
          $httpBackend.whenPUT(collabContextlessUrl).respond(200, {});
          page.find('[analytics-event="Clone"]').click();
          $httpBackend.flush();
        });
      });


      describe('with cloned experiment', function () {

        beforeEach(function () {
          $httpBackend.whenGET(collabContextUrl).respond(200, defaultPageOptions.collabExperimentResponse);
        });

        it('should select first experiment if only one experiment is shown', function () {
          renderEsvWebPage({ experiments: { matureExperiment: matureExperiment } });
          expect($rootScope.pageState.selected).toBeDefined($rootScope.experiments[0].id);
        });

        it('should not select an experiment if multiple experiments are shown', function () {
          renderEsvWebPage();
          expect($rootScope.pageState.selected).toBeUndefined();
        });

        it('should only show the launch button when the experiment exists in collab', function () {
          var page = renderEsvWebPage();
          page.find('.experiment-box').first().click();

          checkButtonsVisibility(page, { launch: 1, upload: 0, clone: 0 });
        });

      });

    });

  });
})();
