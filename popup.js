////////////////////////////////////////////////////////////////////////
var g_current_profile_set = null;
////////////////////////////////////////////////////////////////////////
function on_document_click(e){
	if(e.target.classList.contains("profile")){
		var button = e.target;
		if(!button.classList.contains("button"))
			button = button.parentNode;
		var i = button.getAttribute("data-profile-index");
		chrome.runtime.sendMessage({msg:"change-profile-current", index: i});
	}  
	
	if(e.target.classList.contains("license"))
		chrome.runtime.sendMessage({msg:"check-license"});
	
	if(e.target.classList.contains("options"))
		chrome.runtime.openOptionsPage();
		
	if(e.target.classList.contains("enabled"))
		chrome.runtime.sendMessage({msg:"change-enabled"});

	if(e.target.classList.contains("marker-0"))
		chrome.runtime.sendMessage({msg:"change-marker-image", marker_image:0});
		
	if(e.target.classList.contains("marker-1"))
		chrome.runtime.sendMessage({msg:"change-marker-image", marker_image:1});
		
	if(e.target.classList.contains("marker-2"))
		chrome.runtime.sendMessage({msg:"change-marker-image", marker_image:2});
	
	window.close();
}
//
function on_document_keyup(e){
//	if(event.key == "Control")
//	document.title = "Control";	
}
////////////////////////////////////////////////////////////////////////
function create_license_button(license){
	var button = document.createElement("div");
	var class_list = "button license";
	button.setAttribute("class", class_list);
	var license_text = "<span class=\"license-check\">";
	license_text += chrome.i18n.getMessage("trial_license_check");
	license_text += "</span><br>";
	if(license == 1)
		license_text += chrome.i18n.getMessage("trial_license_1");
	if(license == 2)
		license_text += chrome.i18n.getMessage("trial_license_2");
	if(license == 3)
		license_text += chrome.i18n.getMessage("trial_license_3");
	button.innerHTML = license_text; 
	var root = document.getElementById("root");
	root.appendChild(button); 
}

function create_unknown_browser_button(){
	var button = document.createElement("div");
	var class_list = "button unknown";
	button.setAttribute("class", class_list);
	button.innerText = chrome.i18n.getMessage("unknown_browser");
	var root = document.getElementById("root");
	root.appendChild(button); 
}

function create_profile_button(name, index, is_current) {	
	var button = document.createElement("div");
	var class_list = "button profile";
	if(is_current)
		class_list += " current";
	button.setAttribute("class", class_list);
	button.setAttribute("data-profile-index", index);

	var spacer = document.createElement("div");
	spacer.setAttribute("class", "spacer profile");
	if(is_current)
		spacer.innerHTML = "<img src=\"img/jooble.png\">";
	button.appendChild(spacer); 

	var span = document.createElement("span");
	span.setAttribute("class", "label profile");
	span.innerText = name; 
	button.appendChild(span); 
	
	var tail = document.createElement("span");
	tail.setAttribute("class", "tail profile");
	button.appendChild(tail); 
	
	var root = document.getElementById("root");
	root.appendChild(button); 
}

function show_as_enabled() {
	var spacer = document.getElementById("button_enabled").firstChild;		
	spacer.innerHTML = "<img src=\"img/tick.png\" class=\"enabled\">";
}

function set_marker_image(marker_image) {
	var marker_wrapper = document.getElementById("marker_wrapper_"+marker_image);
	if(marker_wrapper)
		marker_wrapper.classList += " marker-current";
}

function on_messages_popup(request, sender, sendResponse) {
	if(sender.id != chrome.runtime.id)
		return;
	
	if(request.msg === "set-profile-set"){	
		g_current_profile_set = request.profile_set;

		// license
		if(request.license)
			create_license_button(request.license);
			
		if(request.browser_supported == 0)
			create_unknown_browser_button();
		
		// profile list
		for(var i=0; i<g_current_profile_set.name.length; i++) {
			var menu_name = g_current_profile_set.name[i];
			create_profile_button(menu_name, i, i == g_current_profile_set.curr);
		}
		
		// enabled
		if(g_current_profile_set.enabled)	
			show_as_enabled();
		
		// image
		set_marker_image(g_current_profile_set.marker_image);
	}	
}
//
chrome.runtime.onMessage.addListener(on_messages_popup); 
////////////////////////////////////////////////////////////////////////
chrome.runtime.sendMessage({msg:"get-profile-set"});
//
chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
	chrome.tabs.sendMessage(tabs[0].id, {msg:"close-menu"});
});
//
document.addEventListener("click", on_document_click); 
document.addEventListener("keyup", on_document_keyup); 
//
document.getElementById("label_options").innerText = chrome.i18n.getMessage("popup_menu_options");
document.getElementById("label_enabled").innerText = chrome.i18n.getMessage("popup_menu_enabled");
////////////////////////////////////////////////////////////////////////
var browser_lang = chrome.i18n.getUILanguage();
if(browser_lang.indexOf("ar") == 0 || 
   browser_lang.indexOf("fa") == 0 || 
   browser_lang.indexOf("he") == 0 || 
   browser_lang.indexOf("ur") == 0 )
	document.body.style.direction = "rtl";
////////////////////////////////////////////////////////////////////////
