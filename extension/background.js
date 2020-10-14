var userAgent = navigator.userAgent;
// Chính
var default_useragent = "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:54.0) Gecko/20100101 Firefox/54.0"; // Firefox
var useragent;
// Vẫn chạy nếu fb bắt user qua mobile site
useragent = "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:54.0) Gecko/20100101 Firefox/54.0";

var enabled = true;
var api = typeof chrome!="undefined" ? chrome : browser;

// Mở trang web của tui ra khi user cài xong
api.runtime.onInstalled.addListener(function(details){
  var version = "unknown";
  var previousVersion = "1.0";
  try {
    version = api.runtime.getManifest().version;
    previousVersion = details.previousVersion;
  }
  catch (e) { }
  if ("install"===details.reason) {
    api.tabs.create({url: "https://fb.com/ngaduc.byduc"});
  }
  else if ("update"===details.reason) {
    var show_update = true;
    /*
    if (show_update) {
      api.tabs.create({url: ""});
    }
    */
  }
});

// Intercept requests and force them to use our custom user agent
function rewriteUserAgentHeader(o) {
  for (var header of o.requestHeaders) {
    if (enabled && header.name.toLowerCase() === "user-agent") {
      header.value = useragent;
    }
  }
  return {
    "requestHeaders": o.requestHeaders
  };
}

// This is the API hook to intercept requests
let sendHeadersOptions = ["blocking", "requestHeaders"];
try {
  if (api.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty("EXTRA_HEADERS")) {
    sendHeadersOptions.push("extraHeaders");
  }
} catch (e) { }

api.webRequest.onBeforeSendHeaders.addListener(
  rewriteUserAgentHeader,
  {urls: ["*://*.facebook.com/*"]},
  sendHeadersOptions
);

// A wrapper around async API calls for Chrome/Firefox compatibility
function async_api(f, arg, cb, err) {
  err = err || function(e){ console.log(e); };
  var callback = function(a,b,c,d) {
    var e = api.runtime.lastError;
    if (e) {
      err(e);
    }
    else {
      cb(a,b,c,d);
    }
  };
  try {
    var promise = f.call(null, arg, callback);
    if (promise && promise.then) {
      promise.then(callback);
    }
  } catch(e) {
    err(e);
  }
}
function reloadFacebookTabs() {
  api.tabs.query({"url": "https://*.facebook.com/*"}, function(tabs) {
    if (!tabs || !tabs.length) {
      return;
    }
    tabs.forEach((t) => {
      try {
        api.tabs.reload(t.id);
      } catch (e) {
      }
    });
  });
}

function getStatus() {
  return enabled;
}
function enable() {
  enabled = true;
}
function disable() {
  enabled = false;
}
