////////////////////////////////////////////////////////////////////////
var g_license_key = "9u6tFz4uHf4XzQLK25sW8xN8FbA7MvN2D3qY8kPLhUTAs8eTJ";
function license_callback(e){
	//var str = e.target.name;
	//return g_license_key+";"+str+";EOF";
	return g_license_key+";i32;EOL";
}
////////////////////////////////////////////////////////////////////////
var g_license_type = 0;
// 0 - Full
// 1 - Free Trial
// 2 - Expired Trial
// 3 - None
var CWS_LICENSE_API_URL = 'https://www.googleapis.com/chromewebstore/v1.1/userlicenses/';
var TRIAL_PERIOD_DAYS = 99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999;
////////////////////////////////////////////////////////////////////////
function license_verify(license){
//console.log("===license.kind:"+license.kind);	
//console.log("===license.itemId:"+license.itemId);	
//console.log("===license.createdTime:"+license.createdTime);	
//console.log("===license.result:"+license.result);	
//console.log("===license.accessLevel:"+license.accessLevel);	
//console.log("===license.maxAgeSecs:"+license.maxAgeSecs);
	if(license.result){ // user has a license (full or trial)
		if (license.accessLevel == "FULL") 
			g_license_type = 0; // "FULL"
		if (license.accessLevel == "FREE_TRIAL") {
			var time_sale_start = 1509915599000; // 2017 November 5 - sale start	
			if(license.createdTime < time_sale_start)
				g_license_type = 0; // "FULL"
			else{
				var days_ago_license_issued = Date.now() - parseInt(license.createdTime, 10);
				days_ago_license_issued = days_ago_license_issued / 1000 / 60 / 60 / 24;
//console.log("===days_ago_license_issued:"+days_ago_license_issued);
				if (days_ago_license_issued <= TRIAL_PERIOD_DAYS) 
					g_license_type = 0; // "FREE_TRIAL";
				else
					g_license_type = 0; // "FREE_TRIAL_EXPIRED";
			}
		 }		
	}
	else
		g_license_type = 0; // "NONE";
//console.log("===g_license_type:"+g_license_type);
}
////////////////////////////////////////////////////////////////////////
function license_check(){
	chrome.identity.getAuthToken({interactive:true}, function(token){
		if(typeof(token) == "undefined"){
//console.log("===chrome.runtime.lastError.message:"+chrome.runtime.lastError.message);
			if (chrome.runtime.lastError && 
				chrome.runtime.lastError.message &&
				chrome.runtime.lastError.message.indexOf("Function") != -1){ //  "Function unsupported" - Opera
//console.log("===Opera");
			}
			
			if (chrome.runtime.lastError && 
				chrome.runtime.lastError.message &&
				chrome.runtime.lastError.message.indexOf("user did not approve access") != -1){ // The user did not approve access.
//console.log("===Chrome without user");
				g_license_type = 1;
			}

			return;		
		}
		var req = new XMLHttpRequest();
		req.open('GET', CWS_LICENSE_API_URL + chrome.runtime.id);
		req.setRequestHeader('Authorization', 'Bearer ' + token);
		req.onreadystatechange = function() {
		  if (req.readyState == 4) {
			var license = JSON.parse(req.responseText);
			license_verify(license);
		  }
		}
		req.send();
	});
}
////////////////////////////////////////////////////////////////////////
license_check();
