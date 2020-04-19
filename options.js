////////////////////////////////////////////////////////////////////////
var g_current_profile_set = null;
var g_name_was_changed = 0;
var g_menu_was_changed = 0;
//
var element_profile_list = document.getElementById("profile_list");		
element_profile_list.addEventListener("change", new_current_profile)

var element_current_name = document.getElementById("current_name");		
element_current_name.addEventListener("change", new_current_name);
element_current_name.addEventListener("focus", on_focus_name);

var element_current_menu = document.getElementById("current_menu");		
element_current_menu.addEventListener("change", new_current_menu);
element_current_menu.addEventListener("focus", on_focus_menu);

var element_to_del_1 = document.getElementById("to_del_1");		
element_to_del_1.addEventListener("click", profile_to_del_1);

var element_to_del_2 = document.getElementById("to_del_2");		
element_to_del_2.addEventListener("click", profile_to_del_2);

var element_to_add = document.getElementById("to_add");		
element_to_add.addEventListener("click", profile_to_add);

var span_switch = document.getElementById("switch");		
span_switch.addEventListener("click", on_more);

var button_export = document.getElementById("button_export");		
button_export.addEventListener("click", on_export);

var file_import = document.getElementById("file_import");		
file_import.addEventListener("change", on_file_select);

var button_import = document.getElementById("button_import");		
button_import.addEventListener("click", on_import);

var button_buy = document.getElementById("buy_link");		
button_buy.addEventListener("click", on_buy);

document.getElementById("macro_gp").addEventListener("click", macro_to_profile_tail);
document.getElementById("macro_lp").addEventListener("click", macro_to_profile_tail);

document.getElementById("macro_big").addEventListener("click", macro_to_profile_body);
document.getElementById("macro_bold").addEventListener("click", macro_to_profile_body);
document.getElementById("macro_red").addEventListener("click", macro_to_profile_body);
document.getElementById("macro_green").addEventListener("click", macro_to_profile_body);
document.getElementById("macro_blue").addEventListener("click", macro_to_profile_body);
document.getElementById("macro_old_text").addEventListener("click", macro_to_profile_body);
document.getElementById("macro_random_text").addEventListener("click", macro_to_profile_body);
document.getElementById("macro_clipboard_text").addEventListener("click", macro_to_profile_body);

window.addEventListener("beforeunload", on_window_beforeunload);

////////////////////////////////////////////////////////////////////////
function on_focus_name(){
	g_name_was_changed = 1;	
}

function on_focus_menu(){
	g_menu_was_changed = 1;	
}

function on_window_beforeunload(event){
	if(g_name_was_changed)
		new_current_name();
	if(g_menu_was_changed)
		new_current_menu();
}

function on_more(event){
	if(span_switch.innerText == ">>"){
		span_switch.innerText = "<<";
		document.getElementById("button_export").className = "v";
		document.getElementById("spacer_1").className = "v";
		document.getElementById("label_import").className = "v";
		document.getElementById("file_import").className = "v";
		document.getElementById("button_import").className = "v";
	}else{
		span_switch.innerText = ">>";
		document.getElementById("button_export").className = "h";
		document.getElementById("spacer_1").className = "h";
		document.getElementById("label_import").className = "h";
		document.getElementById("file_import").className = "h";
		document.getElementById("button_import").className = "h";
	}
}

function on_export(event){
	export_profiles();
	event.preventDefault();
}

function check_lead_zero(value){
	var str = value.toString();
	if(str.length == 1)
		str = "0" + str;
	return str;
}

function export_profiles(){
	var profile_data = "";
	for(var i=0; i<g_current_profile_set.name.length; i++){
		if(profile_data.length)
			profile_data += "\n\n";
		profile_data += g_current_profile_set.name[i].trim();	
		profile_data += "\n";
		profile_data += g_current_profile_set.menu[i].trim();
	}
	
	var today = new Date();
	var file_name = "InFormEnter+" + today.getFullYear() + "-" + check_lead_zero(today.getMonth()+1) + "-" + check_lead_zero(today.getDate()) + ".txt";
    var blob_data = new Blob([profile_data], {type:"text/plain;charset=utf-8"});

    chrome.downloads.download({
		url: URL.createObjectURL(blob_data),
		filename: file_name,
		saveAs: true
	},
		function(downloadId){
			if(chrome.runtime.lastError != null)
				console.log("===InFormEnter:"+chrome.runtime.lastError.message);
	}
	);	
}

function on_file_select(event){
	if(file_import.files.length)
		button_import.disabled = false;
}

function on_import(event){
	if(file_import.files.length){
		var reader = new FileReader();
		reader.onload = function(){
			var text = reader.result;
			import_profiles(text);
			data_to_view();
			chrome.runtime.sendMessage({msg:"update-profile-set", profile_set:g_current_profile_set});

			element_profile_list.dispatchEvent(new MouseEvent("mousedown"));
			element_profile_list.dispatchEvent(new MouseEvent("click"));
			element_profile_list.dispatchEvent(new MouseEvent("mouseup"));
		};
		reader.readAsText(file_import.files[0]);
	}

	file_import.value = "";
	button_import.disabled = true;
	event.preventDefault();
}

function import_profiles(text){
	text = text.trim();
	while(text.indexOf("\n\n\n") != -1)
		text = text.replace("\n\n\n", "\n\n");
	
	var profiles = text.split("\n\n");
	for(var i=0; i<profiles.length; i++){
		var menu_arr = profiles[i].split("\n");
		if(menu_arr.length){
			var name_str = menu_arr[0].trim();
			var menu_str = "";
			if(name_str.length){
				for(var j=1; j<menu_arr.length; j++){
					var menu_item = menu_arr[j].trim();
					if(menu_item.length){
						if(menu_str.length)
							menu_str += "\n";
						menu_str += menu_item;	
					}
				}
				g_current_profile_set.name.push(name_str);
				g_current_profile_set.menu.push(menu_str);
			}
		}
	}
}

function macro_to_profile_tail(event){
	var macro_text = event.target.innerHTML;
	element_current_menu.value += "\n" + macro_text + "\n";	

	element_current_menu.focus();
	element_current_menu.setSelectionRange(element_current_menu.value.length, element_current_menu.value.length);
	new_current_menu();	
}

function macro_to_profile_body(event){
	var macro_text = event.target.innerHTML;
	var s1 = element_current_menu.value.substr(0, element_current_menu.selectionStart);
	var s2 = element_current_menu.value.substr(element_current_menu.selectionEnd);
	element_current_menu.value = s1 + macro_text + s2;
	var pos_to_select = s1.length + macro_text.length;

	element_current_menu.focus();
	element_current_menu.setSelectionRange(pos_to_select, pos_to_select);	
	new_current_menu();	
}

function profile_to_del_1(event){
	var profiles_count = g_current_profile_set.name.length;
	if(profiles_count < 2)
		return;

	var profile_name = element_current_name.value;	
	var question = chrome.i18n.getMessage("options_confirmation_of_delete"); // "Delete '@@@'?"
	question = question.replace("@@@", profile_name);
	
	element_to_del_2.innerText = question;
	element_to_del_1.className = "h";
	element_to_del_2.className = "";
	event.preventDefault();
}

function profile_to_del_2(event){
	g_current_profile_set.name.splice(g_current_profile_set.curr, 1);
	g_current_profile_set.menu.splice(g_current_profile_set.curr, 1);
	if(g_current_profile_set.curr >= g_current_profile_set.name.length)
		g_current_profile_set.curr = g_current_profile_set.name.length-1;
	
	data_to_view();
	chrome.runtime.sendMessage({msg:"update-profile-set", profile_set:g_current_profile_set});
	event.preventDefault();
}

function profile_to_add(event){
	var next_num = g_current_profile_set.name.length + 1;
	var name_new = chrome.i18n.getMessage("new_profile_prefix"); // "Profile #"
	name_new = name_new.replace("@@@", next_num);
	var menu_new = "";
	var index_new = g_current_profile_set.name.length;
	g_current_profile_set.name[index_new] = name_new;
	g_current_profile_set.menu[index_new] = menu_new;
	g_current_profile_set.curr = index_new;
	data_to_view();
	chrome.runtime.sendMessage({msg:"update-profile-set", profile_set:g_current_profile_set});
	event.preventDefault();
}

function new_current_profile(event){
	if(g_current_profile_set == null) return;
	var index_new = element_profile_list.value;
	if(index_new != g_current_profile_set.curr) {
		g_current_profile_set.curr = index_new;
		data_to_view();
		chrome.runtime.sendMessage({msg:"update-profile-set", profile_set:g_current_profile_set});
	}
}

function new_current_name(){
	if(g_current_profile_set == null) return;
	var name_new = element_current_name.value.trim();
	var name_old = g_current_profile_set.name[g_current_profile_set.curr];
	if(name_new !== name_old) {
		if(name_new.length == 0){
			var next_num = g_current_profile_set.name.length + 1;
			name_new = chrome.i18n.getMessage("new_profile_prefix");
			name_new = name_new.replace("@@@", next_num);
		}
		g_current_profile_set.name[g_current_profile_set.curr] = name_new;
		data_to_view();
		chrome.runtime.sendMessage({msg:"update-profile-set", profile_set:g_current_profile_set});
		g_name_was_changed = 0;	
	}
}

function new_current_menu(){
	if(g_current_profile_set == null) return;
	var menu_new_str = element_current_menu.value.trim();
	var menu_new_arr = menu_new_str.split("\n");
	menu_new_str = "";
	var items_count = 0;
	for(var i=0; i<menu_new_arr.length; i++) {
		var menu_item = menu_new_arr[i];
		if(menu_item.length) {
			if(items_count)
				menu_new_str += "\n";
			menu_new_str += menu_item;
			items_count++;	
		}
	}
	g_current_profile_set.menu[g_current_profile_set.curr] = menu_new_str;
	data_to_view();
	chrome.runtime.sendMessage({msg:"update-profile-set", profile_set:g_current_profile_set});
	g_menu_was_changed = 0;
}

function validate_buttons(){
	var profiles_count = g_current_profile_set.name.length;
	element_to_del_1.disabled = (profiles_count < 2);
	element_to_del_1.className = "";
	element_to_del_2.className = "h";
	element_to_add.disabled = (profiles_count > 63);
}

function check_data_limit(){
	var limit_max = 8181; // default Chrome
	if(navigator.userAgent.indexOf("Gecko/") != -1) // Firefox
		limit_max = 0; // 4Mb
	if(navigator.userAgent.indexOf("OPR/") != -1) // Opera
		limit_max = 0; // 4Mb
		
	var data_size = JSON.stringify(g_current_profile_set).length;
	if(limit_max && data_size > 0.75*limit_max){
		var percent_num = 100.0*data_size / limit_max;
		var percent_str = percent_num.toFixed(2);
		var warning_text = chrome.i18n.getMessage("options_warning_size").replace("@@@", percent_str); 
		//warning_text += "\nProfile JSON length = " + data_size;
		document.getElementById("warning").innerText = warning_text;
	}
}

function data_to_view(){
	if(g_current_profile_set == null) return;
	element_current_name.value = g_current_profile_set.name[g_current_profile_set.curr];
	element_current_menu.value = g_current_profile_set.menu[g_current_profile_set.curr];
	var profile = element_profile_list.firstChild;
	while(profile){
		var next = profile.nextSibling;
		element_profile_list.removeChild(profile);
		profile = next;
	}
	for(var i=0; i<g_current_profile_set.name.length; i++){
		var option = document.createElement("option");
		option.innerText = g_current_profile_set.name[i];
		option.setAttribute("value", i);
		if(i == g_current_profile_set.curr)
			option.setAttribute("selected", "selected");
		element_profile_list.appendChild(option);	
	}
	validate_buttons();
	check_data_limit();
}

function show_buy_button(){
	document.getElementById("buy_link").className = "";
}

function on_buy(){
	document.location.href = "";
}

function on_messages_options(request, sender, sendResponse) {
	if(sender.id != chrome.runtime.id)
		return;
	
	if(request.msg === "set-profile-set"){	
		g_current_profile_set = request.profile_set;
		data_to_view();
		
		// license
		if(request.license)
			show_buy_button();		
	}
}

chrome.runtime.onMessage.addListener(on_messages_options); 
chrome.runtime.sendMessage({msg:"get-profile-set"});
//
element_to_del_1.innerText = chrome.i18n.getMessage("options_button_delete_profile");
element_to_add.innerText = chrome.i18n.getMessage("options_button_new_profile");
//
button_export.innerText = chrome.i18n.getMessage("options_button_export_profiles");
document.getElementById("label_import").innerText = chrome.i18n.getMessage("options_label_select_file");
button_import.innerText = chrome.i18n.getMessage("options_button_import_profiles");
button_buy.innerText = chrome.i18n.getMessage("trial_buy");
//
document.getElementById("hint_1").innerText = chrome.i18n.getMessage("options_hint_1");
document.getElementById("hint_2").innerText = chrome.i18n.getMessage("options_hint_2");
document.getElementById("hint_3").innerText = chrome.i18n.getMessage("options_hint_3");
document.getElementById("hint_4").innerText = chrome.i18n.getMessage("options_hint_4");
document.getElementById("hint_5").innerText = chrome.i18n.getMessage("options_hint_5");
////////////////////////////////////////////////////////////////////////
var browser_lang = chrome.i18n.getUILanguage();
if(browser_lang.indexOf("ar") == 0 || browser_lang.indexOf("he") == 0)
	document.body.style.direction = "rtl";
////////////////////////////////////////////////////////////////////////
