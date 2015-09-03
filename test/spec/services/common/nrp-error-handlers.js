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

  it('should call once nrpErrorService.httpError and hbpDialogFactory.error', function() {
    var response = { data: { message: 'This is a serious error', type: 'serious'} };
    serverError(response);
    expect(hbpDialogFactory.alert.callCount).toBe(1);
    expect(nrpErrorService.httpError).toHaveBeenCalledWith(response);
    expect(nrpErrorService.httpError.callCount).toBe(1);
  });

  it('should call neither nrpErrorService.httpError nor hbpDialogFactory.error', function() {
    var response = { data: { code: 0, message: 'Server Unavailable', type: 'innocuous'}, status: 0 };
    serverError(response);
    expect(hbpDialogFactory.alert).not.toHaveBeenCalled();
    expect(nrpErrorService.httpError).not.toHaveBeenCalled();
  });
});
