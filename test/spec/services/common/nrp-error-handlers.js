'use strict';

describe('Services: nrp-error-handlers', function () {
  var serverError;
  var hbpDialogFactory, hbpErrorService;

  beforeEach(module('nrpErrorHandlers'));
  beforeEach(inject(function(_serverError_,_hbpDialogFactory_, _hbpErrorService_){
    serverError = _serverError_;
    hbpDialogFactory =  _hbpDialogFactory_;
    hbpErrorService = _hbpErrorService_;
    spyOn(hbpDialogFactory, 'error');
    spyOn(hbpErrorService, 'httpError');
  }));

  it('should call once hbpErrorService.httpError and hbpDialogFactory.error', function() {
    var response = { data: { message: 'This is a serious error', type: 'serious'} };
    serverError(response);
    expect(hbpDialogFactory.error.callCount).toBe(1);
    expect(hbpErrorService.httpError).toHaveBeenCalledWith(response);
    expect(hbpErrorService.httpError.callCount).toBe(1);
  });

  it('should call neither hbpErrorService.httpError nor hbpDialogFactory.error', function() {
    var response = { data: { code: 0, message: 'Server Unavailable', type: 'innocuous'}, status: 0 };
    serverError(response);
    expect(hbpDialogFactory.error).not.toHaveBeenCalled();
    expect(hbpErrorService.httpError).not.toHaveBeenCalled();
  });
});
