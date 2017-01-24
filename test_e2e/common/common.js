function waitForUrl(targetUrl) {
  return browser.wait(function() {
    return browser.getCurrentUrl().then(function(url) {
      return url === targetUrl;
    });
  })

}
function navigateToUrl(targetUrl) {
  browser.driver.get(targetUrl);
  return waitForUrl(targetUrl);

  /*.then(browser.driver.getCurrentUrl)
    .then((url) => expect(url).toEqual(targetUrl));*/
}

function waitForScriptResult(scriptFn, expected) {
  if (typeof expected != "function")
    validatorFn = function(val) {
      return val == expected
    };
  else
    validatorFn = expected;
  return browser.wait(() => browser.executeScript(scriptFn).then(validatorFn));
};


module.exports = {
  navigateToUrl,
  waitForScriptResult,
  waitForUrl
};