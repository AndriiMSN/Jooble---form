////////////////////////////////////////////////////////////////////////
var g_current_profile_set = null;
var g_last_password = "";
var g_browser_supported = 1;
////////////////////////////////////////////////////////////////////////
function check_toolbar_icon(){
	if(g_current_profile_set.enabled)
		chrome.browserAction.setIcon({path: "img/informenter-16.png"});
	else	
		chrome.browserAction.setIcon({path: "img/informenter-16-gray.png"});
}
////////////////////////////////////////////////////////////////////////
function check_browser_support(){
	if(navigator.userAgent.indexOf("YaBrowser/") != -1)
		g_browser_supported = 0;
}
//
check_browser_support();
////////////////////////////////////////////////////////////////////////
function update_context_menu(){
	chrome.contextMenus.removeAll();
	if(g_current_profile_set == null || g_current_profile_set.enabled == 0)
		return;
	
	var context_list = ["editable"];
	if(navigator.userAgent.indexOf("Gecko/") != -1) // It is Firefox, Chrome does not support "password"
		context_list[1] = "password";
	
	var menu_str = g_current_profile_set.menu[g_current_profile_set.curr].split("\n");
	for(var i=0; i < menu_str.length+2; i++){
		var line_str;
		if(i < menu_str.length)
			line_str = menu_str[i];
		if(i == menu_str.length)
			line_str = "---";
		if(i > menu_str.length){
			line_str = chrome.i18n.getMessage("marker_menu_add_to_profile");
			i = 65536;
		}
		
		if(line_str.length){
			line_str = clear_menu_style(line_str);
			var menu_title = extract_menu_name(line_str);
			var menu_id = "context-menu-item-" + i;
			var menu_type = "normal";
			if(menu_title.indexOf("---") == 0)
				menu_type = "separator";
			var menu_item = {
					id: menu_id,
					title: menu_title,
					type: menu_type,
					contexts: context_list
				};
			chrome.contextMenus.create(menu_item);	
		}
	}	
}
/////
chrome.contextMenus.onClicked.addListener((info, tab) => {
	chrome.tabs.sendMessage(tab.id, { msg: "context-menu-click", command: info.menuItemId });
});
////////////////////////////////////////////////////////////////////////
function on_messages_background(request, sender) {
//console.log("=== on_messages_background::request.msg:"+request.msg);			
	if(sender.id != chrome.runtime.id)
		return;
		
	if(request.msg === "is-data-ready"){
		var ready = g_current_profile_set != null;
		chrome.tabs.sendMessage(sender.tab.id, {msg:"data-ready", ready:ready});
	}

	if(request.msg === "get-page-data"){
		chrome.tabs.sendMessage(sender.tab.id, {
			msg:"set-page-data", 
			menu: g_current_profile_set.menu[g_current_profile_set.curr],
			marker_location:g_current_profile_set.marker_location,
			marker_image:g_current_profile_set.marker_image,
			password:g_last_password,
			enabled:g_current_profile_set.enabled,
			license:g_license_type,
			browser_supported:g_browser_supported
		});
	}
	
	if(request.msg === "get-profile-set")
		chrome.runtime.sendMessage({msg:"set-profile-set", 
									profile_set:g_current_profile_set, 
									license:g_license_type,
									browser_supported:g_browser_supported});

	if(request.msg === "set-last-password"){
		g_last_password = request.password;
		chrome.tabs.query({}, result => {
			for(var tab of result)
				chrome.tabs.sendMessage(tab.id, {msg:"set-last-password", password:g_last_password});
		});	
	}	

	if(request.msg === "check-license")
		license_check();
	
	if(request.msg === "change-profile-current"){
		g_current_profile_set.curr = request.index;
		chrome.runtime.sendMessage({msg:"set-profile-set", profile_set:g_current_profile_set}); // to options page
		chrome.storage.sync.set({"profile_set": g_current_profile_set});
		update_context_menu();
	}
	
	if(request.msg === "change-enabled"){
		if(g_current_profile_set.enabled)
			g_current_profile_set.enabled = 0;
		else
			g_current_profile_set.enabled = 1;
		chrome.storage.sync.set({"profile_set": g_current_profile_set});
		update_context_menu();
		check_toolbar_icon();
	}	

	if(request.msg === "change-marker-image"){
		g_current_profile_set.marker_image = request.marker_image;
		chrome.storage.sync.set({"profile_set": g_current_profile_set});
	}	

	if(request.msg === "change-marker-location"){
		g_current_profile_set.marker_location = request.marker_location;
		chrome.storage.sync.set({"profile_set": g_current_profile_set});
	}	

	if(request.msg === "hide-marker-anywhere"){
		chrome.tabs.query({}, result => {
			for(var tab of result)
				chrome.tabs.sendMessage(tab.id, {msg:"hide-marker"});
		});	
	}	
	
	if(request.msg === "update-profile-set"){ // from options page
		g_current_profile_set = request.profile_set;
		chrome.storage.sync.set({"profile_set": g_current_profile_set});
		update_context_menu();
	}
		
	if(request.msg === "add-menu-item"){
		var menu_str_new = "";
		var menu_str_old = g_current_profile_set.menu[g_current_profile_set.curr];
		if(request.to_head){
			menu_str_new = request.item_raw;	
			if(menu_str_old.length){
				menu_str_new += "\n";
				menu_str_new += menu_str_old;
			}
		}
		else {	
			menu_str_new = menu_str_old;
			if(menu_str_old.length)
				menu_str_new += "\n";
			menu_str_new += request.item_raw;	
		}
		g_current_profile_set.menu[g_current_profile_set.curr] = menu_str_new;
		chrome.runtime.sendMessage({msg:"set-profile-set", profile_set:g_current_profile_set}); // to options page
		chrome.storage.sync.set({"profile_set": g_current_profile_set});
		update_context_menu();
	}
}
/////
chrome.runtime.onMessage.addListener(on_messages_background); 
////////////////////////////////////////////////////////////////////////
function on_hotkey(command) {
	chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {msg:"hotkey-click", command:command});
	});
}
/////
chrome.commands.onCommand.addListener(on_hotkey);
////////////////////////////////////////////////////////////////////////
function on_tab_activated(activeInfo) {
	chrome.tabs.query({}, result => {
		for(var tab of result)
			chrome.tabs.sendMessage(tab.id, {msg:"hide-marker"});
	});	
}
/////
chrome.tabs.onActivated.addListener(on_tab_activated)
////////////////////////////////////////////////////////////////////////
function update_profile(str){
	str = str.replace(/#SR#/g, "-----");
	str = str.replace(/#RLP#/g, "$LastPassword$");
	str = str.replace(/#GP#/g, "$GeneratePassword$");
	for(var i=2; i<65; i++){
		var macro_old = "#GP:"+i+"#";
		var macro_new = "$GeneratePassword,"+i+"$";
		str = str.replace(macro_old, macro_new);
	}
	return str;
}
function update_all_profiles(){
	for(var i=0; i<g_current_profile_set.menu.length; i++)
		g_current_profile_set.menu[i] = update_profile(g_current_profile_set.menu[i]);
}
////////////////////////////////////////////////////////////////////////
function on_profiles_exist(data){
	if(chrome.runtime.lastError == null &&         // Chrome?
	   typeof(data.profile_set)	!== 'undefined'){  // Firefox

		g_current_profile_set = data.profile_set;
		update_context_menu();
		check_toolbar_icon();
		
		var need_update = 0;
		if(typeof(g_current_profile_set.enabled) === 'undefined'){ // data from 0.771 version for Firefox
			g_current_profile_set.enabled = 1;
			need_update = 1;
		}
		if(typeof(g_current_profile_set.marker_location) === 'undefined'){ // new from 0.831
			g_current_profile_set.marker_location = 0;
			need_update = 1;
		}
		if(typeof(g_current_profile_set.marker_image) === 'undefined'){ // new from 0.832
			g_current_profile_set.marker_image = 1;
			need_update = 1;
		}
		// udate
		if(need_update){
			update_all_profiles();
			chrome.storage.sync.set({"profile_set": g_current_profile_set});
		}
	}
	else
		on_profiles_absent();
}

function on_profiles_absent(){
	var profile_name = chrome.i18n.getMessage("new_profile_prefix");
	profile_name = profile_name.replace("@@@", "1");
	var my_name  = chrome.i18n.getMessage("new_profile_example_line_1"); // "My Name" 
	var my_addr  = chrome.i18n.getMessage("new_profile_example_line_2"); // "My Address"
	var my_phone = chrome.i18n.getMessage("new_profile_example_line_3"); // "My Phone"
	var profile_menu = my_name + "\n" + my_addr + "\n" + my_phone;
	
	var profile_set = { curr: 0,
			name: [profile_name],
			menu: [profile_menu],
			enabled: 1,
			marker_location: 0,
			marker_image: 1
		};
	chrome.storage.sync.set({"profile_set": profile_set});	
	g_current_profile_set = profile_set;
	update_context_menu();
	check_toolbar_icon();
}

function on_profiles_changed(changes, namespace){
	g_current_profile_set = changes.profile_set.newValue;
	// to all tabs	
	chrome.tabs.query({}, result => {
		for(var tab of result)
			chrome.tabs.sendMessage(tab.id, {msg:"data-ready", ready:1});
	});	
}
/////
chrome.storage.onChanged.addListener(on_profiles_changed);
chrome.storage.sync.get("profile_set", on_profiles_exist);	
////////////////////////////////////////////////////////////////////////
