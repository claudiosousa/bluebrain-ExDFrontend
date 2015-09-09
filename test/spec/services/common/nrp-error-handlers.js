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

});

describe('Services: nrp-error-handlers', function () {
  var serverError;
  var hbpDialogFactory, nrpErrorService;

  beforeEach(module('nrpErrorHandlers'));
  beforeEach(inject(function(_serverError_,_hbpDialogFactory_, _nrpErrorService_){
    serverError = _serverError_;
    hbpDialogFactory =  _hbpDialogFactory_;
    nrpErrorService = _nrpErrorService_;
    spyOn(hbpDialogFactory, 'alert');
    spyOn(nrpErrorService, 'httpError');
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
      status: 0 
    };
    serverError.display(response);
    expect(serverError.filter(response)).toBe(false);
  });

  it('should call once nrpErrorService.httpError and hbpDialogFactory.error', function() {
    var response = { data: { message: 'This is a serious error', type: 'serious'} };
    serverError.display(response);
    expect(hbpDialogFactory.alert.callCount).toBe(1);
    expect(nrpErrorService.httpError).toHaveBeenCalledWith(response);
    expect(nrpErrorService.httpError.callCount).toBe(1);
  });

  it('should call neither nrpErrorService.httpError nor hbpDialogFactory.error', function() {
    var response = { data: { code: 0, message: 'Server Unavailable', type: 'innocuous'}, status: 0 };
    serverError.display(response);
    expect(hbpDialogFactory.alert).not.toHaveBeenCalled();
    expect(nrpErrorService.httpError).not.toHaveBeenCalled();
  });
});
