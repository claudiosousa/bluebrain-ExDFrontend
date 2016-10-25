'use strict';

describe('Services: nrp-error-handlers', function () {
  var nrpErrorService;

  beforeEach(module('nrpErrorHandlers'));

  beforeEach(inject(function(_nrpErrorService_){
    nrpErrorService = _nrpErrorService_;
  }));

  it('should translate nrp errors properly', function() {
    var error = 'I am an error';
    var type = 'I am a type';
    var response = {data: {message : error, type: type}};
    var result = nrpErrorService.httpError(response);
    expect(result.title).toEqual(type);
    expect(result.label).toEqual('OK');
    expect(result.template).toEqual(error);
  });

  it('should translate ngninx nrp errors properly', function() {
    var htmlTitle = 'General Error';
    var nginxString = 'nginx/2.4.2';
    var error = 'I am an error';
    var type = 'I am a type';
    var response = {data: {message : error, type: type}};
    response.data.message = 'some text before' +
        '<html>' +
        '<head>' +
        '<title>' + htmlTitle + '</title>' +
        '<head>' +
        '<body>' +
        '<center>' + nginxString + '</center>' +
        '</body>' +
        '</html>' + 'some text after';
    var result = nrpErrorService.httpError(response);
    expect(result.template).toBe(htmlTitle + ' (' + nginxString + ').');

    response.data.message = 'some text before' + '<html></html>';
    result = nrpErrorService.httpError(response);
    expect(result.template).toBe(response.data.message);
  });

  it('should display non formatted nrp errors as is (default behaviour)', function() {
    var response = {data: {message : 'defined error', type: 'defined type'}};
    response.data.message = 'some text before' + '<html></html>' + 'some text after';
    var result = nrpErrorService.httpError(response);
    expect(result.template).toBe(response.data.message);
  });

  it('should translate non nrp errors properly', function() {
    var error = 'I am an error';
    var response = {data: error};
    var result = nrpErrorService.httpError(response);
    expect(result.title).toEqual('Error');
    expect(result.label).toEqual('OK');
    expect(result.template).toEqual(error);
  });

  it('should translate 400 errors properly', function() {
    var response = {data: {status: 400}};
    var result = nrpErrorService.httpError(response);
    expect(result.title).toEqual('Error');
    expect(result.label).toEqual('OK');
    expect(result.template).toEqual('The request could not be understood by the server');
  });

  it('should translate errors for which response.data is an HTML string properly (e.g., ngninx\'s 502 Bad Gateway Error)', function() {
    var htmlTitle = '502 Bad Gateway Error';
    var nginxString = 'nginx/2.4.2';
    var response = {};
    response.data = 'some text before' +
        '<html>' +
        '<head>' +
        '<title>' + htmlTitle + '</title>' +
        '<head>' +
        '<body>' +
        '<center>' + nginxString + '</center>' +
        '</body>' +
        '</html>' + 'some text after';
    var result = nrpErrorService.httpError(response);
    expect(result.title).toEqual('Error');
    expect(result.label).toEqual('OK');
    expect(result.template).toEqual(htmlTitle + ' (' +  'nginx/2.4.2' + ').');
  });

  it('should extract the title content correctly (getHtmlTitle)', function() {
    var errorTitle = 'Major Failure 666';
    var htmlString = 'some text' +
        '<html>' +
        '<head>' +
        '<title>' + errorTitle + '</title>' +
        '</head>' +
        '<body>' +
        '<h1>Some description</h1>' +
        '<p>Some comment</p>' +
        '</body>' +
        '</html>' + 'some text';
    expect(nrpErrorService.getHtmlTitle(htmlString)).toBe(errorTitle);

    htmlString = 'some text' +
        '<html>' +
        '<head>' +
        '</head>' +
        '<body>' +
        '</body>' +
        '</html>';

    expect(nrpErrorService.getHtmlTitle(htmlString)).toBe(null);

    htmlString = 'some text';
    expect(nrpErrorService.getHtmlTitle(htmlString)).toBe(null);
  });

  it('should extract the nginx string correctly (getNginxString)', function() {
    var htmlString = 'some text' +
        '<html>' +
        '<head>' +
        '<title>Very Bad Error</title>' +
        '<head>' +
        '<body>' +
        '<center>nginx/2.5.5</center>' +
        '<p>Some comment</p>' +
        '</body>' +
        '</html>' + 'some text';
    expect(nrpErrorService.getNginxString(htmlString)).toBe('nginx/2.5.5');

    htmlString = 'some text';
    expect(nrpErrorService.getNginxString(htmlString)).toBe(null);
  });
});

describe('Services: nrp-error-handlers', function () {
  var serverError;
  var hbpDialogFactory, nrpErrorService, NO_CLUSTER_AVAILABLE_ERR_MSG;

  beforeEach(module('nrpErrorHandlers'));
  beforeEach(inject(function(_serverError_,_hbpDialogFactory_, _nrpErrorService_, _NO_CLUSTER_AVAILABLE_ERR_MSG_){
    serverError = _serverError_;
    hbpDialogFactory =  _hbpDialogFactory_;
    nrpErrorService = _nrpErrorService_;
    NO_CLUSTER_AVAILABLE_ERR_MSG = _NO_CLUSTER_AVAILABLE_ERR_MSG_;
    spyOn(hbpDialogFactory, 'alert');
    spyOn(nrpErrorService, 'httpError').andReturn({'template': 'error template'});
  }));

  it('should filter in errors without response', function() {
    expect(serverError.filter(undefined)).toBe(true);
  });

  it('should filter out errors due to GET requests on unavailable servers', function() {
    var response = {
      data: { code: 0, message: 'Server Unavailable', type: 'innocuous'},
      status: 0
    };
    expect(serverError.filter(response)).toBe(false);
  });

  it('should filter out transfer function errors', function() {
    var response = {
      data: { code: 400, message: 'Syntax Error', type: 'Transfer function error'},
      status: 400
    };
    serverError.display(response);
    expect(serverError.filter(response)).toBe(false);
  });

  it('should call once nrpErrorService.httpError and hbpDialogFactory.alert', function() {
    var response = { data: { message: 'This is a serious error', type: 'serious'} };
    serverError.display(response);
    expect(hbpDialogFactory.alert.callCount).toBe(1);
    expect(nrpErrorService.httpError).toHaveBeenCalledWith(response);
    expect(nrpErrorService.httpError.callCount).toBe(1);
  });

  it('should call neither nrpErrorService.httpError nor hbpDialogFactory.alert', function() {
    var response = { data: { code: 0, message: 'Server Unavailable', type: 'innocuous'}, status: 0 };
    serverError.display(response);
    expect(hbpDialogFactory.alert).not.toHaveBeenCalled();
  });

  it('should show a user friendly error message to the user', function() {
    var response = { data: { message: 'This is a serious error', type: 'serious'} };
    serverError.display(response);
    expect(hbpDialogFactory.alert.callCount).toBe(1);
    expect(hbpDialogFactory.alert.mostRecentCall.args[0].template).toNotBe('error template');
    expect(nrpErrorService.httpError).toHaveBeenCalledWith(response);
    expect(nrpErrorService.httpError.callCount).toBe(1);
  });

  it('should show the actual error message to the user', function() {
    var response = { data: { message: 'This is a serious error', type: 'serious'} };
    serverError.display(response, true);
    expect(hbpDialogFactory.alert.callCount).toBe(1);
    expect(hbpDialogFactory.alert.mostRecentCall.args[0].template).toBe('error template');
    expect(nrpErrorService.httpError).toHaveBeenCalledWith(response);
    expect(nrpErrorService.httpError.callCount).toBe(1);
  });

  it('should show a specific error when cluster resources aren\'t available', function() {
    var response = { data: {message:'Internal server error: service [/ros_cle_simulation/create_new_simulation] responded with an error: error processing request: No resources available on the cluster. Try again later.',type:'General error'} };
    serverError.display(response, true);
    expect(hbpDialogFactory.alert.callCount).toBe(1);
    expect(hbpDialogFactory.alert.mostRecentCall.args[0].template).toBe(NO_CLUSTER_AVAILABLE_ERR_MSG);
  });
});
