'use strict';

describe('Services: documentation-urls', function() {
  var documentationURLs;
  beforeEach(module('exdFrontendApp'));
  beforeEach(
    inject(function(_documentationURLs_) {
      documentationURLs = _documentationURLs_;
    })
  );

  it('should provide the correct help urls', function() {
    var docUrls = documentationURLs.getDocumentationURLs();
    expect(docUrls).toEqual({
      cleDocumentationURL:
        'https://developer.humanbrainproject.eu/docs/hbp-nrp-cle/latest/',
      backendDocumentationURL:
        'https://developer.humanbrainproject.eu/docs/hbp_nrp_backend/latest/',
      platformDocumentationURL:
        'https://developer.humanbrainproject.eu/docs/HBP Neurorobotics Platform/latest/'
    });
  });
});
