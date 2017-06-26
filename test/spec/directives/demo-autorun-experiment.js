'use strict';

describe('Directive: demo-autorun-experiment', function ()
{

    beforeEach(module('exdFrontendApp'));
    beforeEach(module('exd.templates'));

    var $rootScope,
        $compile,
        bbpConfig,
        element,childScope,  $httpBackend,stateServiceMock,STATE, $timeout,
        $window, location;


    var experiments = {
        developementExperiment: {
            configuration: {
                maturity: 'devel',
                name: 'Developement experiment name'
            },
            availableServers: [],
            joinableServers: []
        }
    };

    var userContextServiceMock = {
        isOwner: function () { return false; },
        demoModeLoadingNextPage: false,
        isJoiningStoppedSimulation:true
    };

    beforeEach(module(function ($provide)
    {
        $provide.value('userContextService', userContextServiceMock);

        stateServiceMock = {
            currentState: undefined,
            getCurrentState: jasmine.createSpy('getCurrentState').and.returnValue({
                then: jasmine.createSpy('then').and.callFake(function (fn) { fn(); })
            }),
        };
        $provide.value('stateService', stateServiceMock);



    }));

    beforeEach(inject(function (_$rootScope_, _$compile_, _bbpConfig_,_$httpBackend_,_STATE_, _$timeout_,_$window_,_$location_)
    {
        $rootScope = _$rootScope_;
        $compile = _$compile_;
        bbpConfig = _bbpConfig_;
        $httpBackend = _$httpBackend_;
        STATE = _STATE_;
        $timeout = _$timeout_;
        $window = _$window_;
        location = _$location_;

        var proxyUrl = bbpConfig.get('api.proxy.url');

        $httpBackend.whenGET(new RegExp(proxyUrl + '/experiments')).respond(200, experiments);
        $httpBackend.whenGET(new RegExp(proxyUrl + '/experimentImage/')).respond(200, {});

        stateServiceMock.currentState=STATE.PAUSED;

        window.bbpConfig.demomode = { demoCarousel: true };
        element = $compile('<demo-autorun-experiment></demo-autorun-experiment>')($rootScope);
        $rootScope.$digest();
        childScope = $rootScope.$$childHead;

    }));

    afterEach(inject(function ()
    {
        window.bbpConfig.demomode = { demoCarousel: false };
    }));


    it('should initialize simulationIsDone to false', function ()
    {
        $httpBackend.flush();
        expect(childScope.simulationIsDone).toBe(false);
    });

    it('should destroy experimentsService', function ()
    {
        childScope.simulationIsDone = true;
        $rootScope.$digest();
        $httpBackend.flush();
        $timeout.flush(1000);

        childScope.$destroy();

        expect(childScope.experimentsService).toBe(undefined);
    });

    it('should move to the next simulation ready', function ()
    {
        experiments.developementExperiment.joinableServers =[{server:'server', runningSimulation:{state:STATE.PAUSED}}];

        spyOn($window.location, 'reload');
        spyOn(location, 'path');

        stateServiceMock.currentState=STATE.STOPPED;
        childScope.simulationIsDone = true;
        $rootScope.$digest();
        $httpBackend.flush();
        $timeout.flush(1000);


        expect(location.path).toHaveBeenCalled();
        expect($window.location.reload).toHaveBeenCalled();
    });
});