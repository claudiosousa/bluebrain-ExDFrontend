'use strict';

describe('Services: documentation-urls', function () {

  var documentationURLs, backendInterfaceService;

  var backendInterfaceServiceMock = {
    getTransferFunctions: jasmine.createSpy('getTransferFunctions'),
    setTransferFunction: jasmine.createSpy('setTransferFunction'),
    deleteTransferFunction: jasmine.createSpy('deleteTransferFunction'),
    getServerBaseUrl: jasmine.createSpy('getServerBaseUrl')
  };

  var nrpVersionMock = {
    hbp_nrp_cle_components: { // jshint ignore:line
      major: 0,
      minor: 0,
      patch: 0,
      dev: 'dev0'
    }
  };

  var nrpBackendVersionsGetMock = jasmine.createSpy('get').andReturn({'$promise': {then: function(callback){return callback(nrpVersionMock);}}});
  var nrpBackendVersionsMock = jasmine.createSpy('nrpBackendVersions').andReturn({get: nrpBackendVersionsGetMock});

  beforeEach(module('exdFrontendApp'));

  beforeEach(module(function ($provide) {
    $provide.value('backendInterfaceService', backendInterfaceServiceMock);
    $provide.value('nrpBackendVersions', nrpBackendVersionsMock);
  }));

  beforeEach(inject(function(_documentationURLs_, _backendInterfaceService_){
    documentationURLs = _documentationURLs_;
    backendInterfaceService = _backendInterfaceService_;
  }));

  it('should provide the correct help urls with a dev version', function () {

    nrpVersionMock = {
      hbp_nrp_cle_components: { // jshint ignore:line
        major: 1,
        minor: 2,
        patch: 4,
        dev: 'dev3'
      },
      hbp_nrp_backend_components: { // jshint ignore:line
        major: 1,
        minor: 3,
        patch: 4,
        dev: 'dev3'
      }
    };

    expect(documentationURLs.getDocumentationURLs()).toEqual(
      { cleDocumentationURL : 'https://developer.humanbrainproject.eu/docs/projects/hbp-nrp-cle/1.2.3',
        backendDocumentationURL : 'https://developer.humanbrainproject.eu/docs/projects/hbp_nrp_backend/1.3.3',
        platformDocumentationURL : 'https://developer.humanbrainproject.eu/docs/projects/HBP%20Neurorobotics%20Platform/1.3'
      }
    );

  });

  it('should provide the correct help urls with a released version', function () {

    nrpVersionMock = {
      hbp_nrp_cle_components: { // jshint ignore:line
        major: 1,
        minor: 2,
        patch: 4,
      },
      hbp_nrp_backend_components: { // jshint ignore:line
        major: 1,
        minor: 3,
        patch: 4,
      }
    };

    expect(documentationURLs.getDocumentationURLs()).toEqual(
      { cleDocumentationURL : 'https://developer.humanbrainproject.eu/docs/projects/hbp-nrp-cle/1.2.4',
        backendDocumentationURL : 'https://developer.humanbrainproject.eu/docs/projects/hbp_nrp_backend/1.3.4',
        platformDocumentationURL : 'https://developer.humanbrainproject.eu/docs/projects/HBP%20Neurorobotics%20Platform/1.3'
      }
    );

  });

  it('should deal with uncorrect version for the HELP url', function () {

    nrpVersionMock = {
      hbp_nrp_cle_components: { // jshint ignore:line
        major: 1,
        minor: 2,
        patch: 0,
        dev: 'dev3'
      },
      hbp_nrp_backend_components: { // jshint ignore:line
        major: 1,
        minor: 3,
        patch: 0,
        dev: 'dev3'
      }
    };

    expect(documentationURLs.getDocumentationURLs()).toEqual(
      { cleDocumentationURL : 'https://developer.humanbrainproject.eu/docs/projects/hbp-nrp-cle/1.2.0',
        backendDocumentationURL : 'https://developer.humanbrainproject.eu/docs/projects/hbp_nrp_backend/1.3.0',
        platformDocumentationURL : 'https://developer.humanbrainproject.eu/docs/projects/HBP%20Neurorobotics%20Platform/1.3'
      }
    );

  });
});
