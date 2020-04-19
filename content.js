////////////////////////////////////////////////////////////////////////
var g_img_marker = null;
var g_input_current = null;
var g_neighbors_below = 0;
var g_menu_items = null;
var g_menu_x = 0;
var g_menu_y = 0;
var g_menu_index_selected = -1;
var g_enabled = 0;
var g_marker_location = 0;
var g_marker_image = 1;
var g_last_password = "";
var g_shift_is_pressed = 0;
var g_ctrl_is_pressed = 0;
var g_marker_shifting = 0;
var g_marker_recreate = 0;
var g_license_type = 0;
var g_browser_supported = 1;
////////////////////////////////////////////////////////////////////////
function is_input(element) {
	var node_name = element.nodeName.toString().toUpperCase();
	var result = (node_name == "INPUT" || node_name == "TEXTAREA"); 
	return result;
}

function is_input_editable(input) {
	if(input.offsetWidth < 2) // hiddent input
		return false;

	var result = true;
	var type = input.getAttribute("type");
	if (type != null){
		type = type.toString().toLowerCase();
		if (type == "button" || type == "checkbox" || type == "file" || 
		    type == "hidden" || type == "image" || type == "radio" || 
		    type == "reset" || type == "submit" || type == "range")
			result = false;
	}

	if(result){
		if(typeof(input.disabled) !== 'undefined' && input.disabled)
			result = false;
		if(typeof(input.readOnly) !== 'undefined' && input.readOnly)
			result = false;
	}	

	return result;
}

function check_contenteditable_element(){
	element = document.activeElement;
	while(element && element.getAttribute){
		var contenteditable = element.getAttribute("contenteditable");
		if(contenteditable != null && contenteditable == "true"){
			g_input_current = element;
			break;
		}
		element = element.parentNode;
	}
}

function calc_neighbors_below(){
	g_neighbors_below = 0;
	var element_index = get_index_in_form();
	if(element_index == -1){
		return;
	}
	
	// calc_neighbors_below
	var form_items = g_input_current.form.elements; 
	for(var i=element_index+1; i<form_items.length; i++){
		var element = form_items.item(i);	
		if(is_input(element) && is_input_editable(element))
			g_neighbors_below++;
	}	
}

function get_clipboard_text(){
	var et = null;
	var text = null;
	var is_Firefox = navigator.userAgent.indexOf("Gecko/") != -1;
	
	if(is_Firefox){
		et = document.createElement("div");
		et.setAttribute("contenteditable", "true");
	}
	else
		et = document.createElement("textarea");
	
	et.setAttribute("style", "position: absolute; top: -3000px; left: -3000px;");
	document.body.appendChild(et); 
	et.focus();
	document.execCommand("paste");
	
	if(is_Firefox)
		text = et.innerText;
	else	
		text = et.value;
	
	document.body.removeChild(et); 
	return text;
}
////////////////////////////////////////////////////////////////////////
function on_input_select(event){
	var menu_wrap = document.getElementById("informenter-menu");
	if(menu_wrap)
		return;
	marker_show(event.currentTarget);
	calc_neighbors_below();
}

function on_document_click(event){ 
	var element = event.target;
	if(is_input(element) && is_input_editable(element)) 
		marker_show(element);
	else{
		if(!(event.button == 2 && element.classList.contains("informenter-marker-show"))) // not marker right click in Firefox
			marker_hide_anywhere();
	}
	menu_off();
}

function on_document_keydown(event){ 
	if(g_enabled){
		var menu_wrap = document.getElementById("informenter-menu");
		if(menu_wrap){		
			if(event.key == "Escape" || event.key == "Enter" || event.key == "ArrowUp" || event.key == "ArrowDown"){
				if(event.key == "Escape")		
					menu_off();
				
				if(event.key == "ArrowUp")
					menu_select_prev();
					
				if(event.key == "ArrowDown")
					menu_select_next();

				if(event.key == "Enter")		
					menu_select_current(event.shiftKey, event.ctrlKey);
				
				event.preventDefault();
			}
		}
		
		if(event.key == "Shift"){
			g_shift_is_pressed = 1;
			menu_item_neighbors_show();
		}
			
		if(event.key == "Control")
			g_ctrl_is_pressed = 1;
	}
}

function on_document_keyup(event){
	if(g_enabled){
		if(event.key == "Shift"){
			g_shift_is_pressed = 0;
			menu_item_neighbors_hide();
		}
			
		if(event.key == "Control")
			g_ctrl_is_pressed = 0;
	}	
}

function on_window_beforeprint(event){
	if(g_img_marker != null){
		marker_remove();
		g_marker_recreate = 1;
	}
}

function on_window_afterprint(event){
	if(g_marker_recreate == 1)
		marker_create();
}

function on_window_scroll(event){
	var menu_wrap = document.getElementById("informenter-menu");
	if(menu_wrap == null)
		marker_hide_anywhere();	
}

function on_window_resize(event){
	menu_off();
	marker_hide_anywhere();
}
////////////////////////////////////////////////////////////////////////
function marker_create(){
	g_img_marker = document.getElementById("informenter-marker-id");
	if(g_img_marker == null && g_marker_image > 0){
		g_img_marker = document.createElement("img");
		g_img_marker.setAttribute("src", chrome.extension.getURL("img/informenter-marker-"+g_marker_image+".png"));
		g_img_marker.setAttribute("class", "informenter-marker-hide");
		g_img_marker.setAttribute("style", "");
		g_img_marker.setAttribute("id", "informenter-marker-id");
		g_img_marker.setAttribute("title", chrome.i18n.getMessage("marker_right_click_hint"));
		var contenteditable = document.body.getAttribute("contenteditable");
		if(contenteditable != true && contenteditable != "true" && contenteditable != ""){
			document.body.appendChild(g_img_marker);
			g_img_marker.addEventListener("click", on_marker_click);
			g_img_marker.addEventListener("contextmenu", on_marker_contextmenu);
		}
		else
			g_img_marker = null;
	}
}

function marker_remove(){
	g_img_marker = document.getElementById("informenter-marker-id");
	if(g_img_marker != null){
		g_img_marker.parentNode.removeChild(g_img_marker);
		g_img_marker = null;
	}
}

function marker_show(input){
	g_input_current = input;
	g_neighbors_below = 0;
	
	if(g_img_marker == null)
		return;

	//var contenteditable = g_input_current.getAttribute("contenteditable");
	//if(contenteditable != null && contenteditable == "true")
	//	return;
	
	var rect_input = g_input_current.getBoundingClientRect();
	
	// location == 0
	var top = window.scrollY + rect_input.top;
	if(g_input_current.nodeName.toString().toUpperCase() == "INPUT")
		top += (rect_input.height - g_img_marker.naturalHeight) / 2;
	var left = window.scrollX + rect_input.left + rect_input.width - g_img_marker.naturalWidth;
	
	if(g_marker_location == 1)
		left = window.scrollX + rect_input.left + rect_input.width;	

	if(g_marker_location == 2)
		top = window.scrollY + rect_input.top - g_img_marker.naturalHeight;

	if(g_marker_location == 3)
		left = window.scrollX + rect_input.left - g_img_marker.naturalWidth;	
	
	// 
	var scrollbar_width = 20; // in pixels
	if(left > window.innerWidth - scrollbar_width - g_img_marker.naturalWidth)
		left = window.innerWidth - scrollbar_width - g_img_marker.naturalWidth;
	
	var style_str = "top: "+top+"px; left: "+left+"px;";
	if(g_enabled)
		g_img_marker.className = "informenter-marker-show";
	else
		g_img_marker.className = "informenter-marker-hide";
	g_img_marker.style = style_str;
}

function marker_hide_anywhere(){
	chrome.runtime.sendMessage({msg:"hide-marker-anywhere"});
}

function marker_hide_on_page(){
	if(g_img_marker)
		g_img_marker.className = "informenter-marker-hide";
	g_input_current = null;
	g_neighbors_below = 0;
}

// mouseover
var list = document.getElementsByTagName("input");
for(var i=0; i<list.length; i++)
{
	if(is_input_editable(list.item(i))){
		list.item(i).addEventListener("mouseover", on_input_select);
		list.item(i).addEventListener("focus", on_input_select);
	}
}

list = document.getElementsByTagName("textarea");
for(var i=0; i<list.length; i++)
{
	if(is_input_editable(list.item(i))){
		list.item(i).addEventListener("mouseover", on_input_select);
		list.item(i).addEventListener("focus", on_input_select);
	}
}
////////////////////////////////////////////////////////////////////////
function create_menu_wrap() {
	var menu_wrap = document.getElementById("informenter-menu");
	if(menu_wrap)
		menu_wrap.parentNode.removeChild(menu_wrap);
	menu_wrap = document.createElement("div");
	menu_wrap.setAttribute("id", "informenter-menu");
	var style_str = "";
	var browser_lang = chrome.i18n.getUILanguage();
	if(browser_lang.indexOf("ar") == 0 || browser_lang.indexOf("he") == 0)
		style_str = "direction: rtl; ";
	style_str += "top: "+g_menu_y+"px; left: "+g_menu_x+"px;";
	menu_wrap.setAttribute("style", style_str);
	document.body.appendChild(menu_wrap);
	return menu_wrap;
}

function create_menu_item(menu_wrap, name, index, menu_style) {
	var menu_item = null;
	if(name.indexOf("---") == 0){
		menu_item = document.createElement("hr");
	}
	else{
		menu_item = document.createElement("div");
		menu_item.setAttribute("class", "informenter-menu-item"+menu_style);
		menu_item.setAttribute("tabindex", "-1");
		if(index == 65536){
			if(g_input_current.value.length == 0){
				menu_item.setAttribute("class", "informenter-menu-item-to-add-disabled");
			}
			else{	
				menu_item.setAttribute("class", "informenter-menu-item-to-add");
				var menu_item_title = chrome.i18n.getMessage("marker_menu_add_to_profile_hint");	
				menu_item.setAttribute("title", menu_item_title);
			}
		}
		menu_item.setAttribute("data-menu-index", index);
		var id = "informenter-menu-item-" + index;
		menu_item.setAttribute("id", id);
		
		var hotkeys_limit = 9;
		var hotkeys_prefix = "Ctrl+";
		if(navigator.userAgent.indexOf("Gecko/") == -1){ // Chrome does not allow more 4 hotkeys
			hotkeys_limit = 3;
			hotkeys_prefix = "Ctrl+Shift+";
		}
		
		if(index < hotkeys_limit){
			var menu_num = index+1;
			menu_item.setAttribute("title", hotkeys_prefix+menu_num); 
		}
		
		var menu_name = name;
		if(menu_name.length > 70){ 
			menu_name = name.substr(0, 70);
			menu_name += "...";
		}
		menu_item.textContent = menu_name; 
		menu_item.addEventListener("click", on_menu_item_click);
		menu_item.addEventListener("mouseover", on_menu_item_over);
		menu_item.addEventListener("mouseout", on_menu_item_out);
	}
	menu_wrap.appendChild(menu_item); 
}

function create_menu_special_items(menu_wrap) {
	var menu_separator = document.createElement("hr");
	menu_wrap.appendChild(menu_separator); 
	var menu_special_name = chrome.i18n.getMessage("marker_menu_add_to_profile");
	create_menu_item(menu_wrap, menu_special_name, 65536, "");
}

function check_menu_position(menu_wrap){
	var scrollbar_width = 20; // in pixels

	var menu_width = menu_wrap.offsetWidth;
	if(g_menu_x + menu_width > window.innerWidth - scrollbar_width) {
		var left = window.innerWidth - menu_width - scrollbar_width;
		menu_wrap.style.left = left+"px";
	}

	if(menu_width > g_menu_x && menu_width > window.innerWidth/2 && g_menu_x > window.innerWidth/2) { // 0.849
		var left = 0;
		var width = g_menu_x;
		menu_wrap.style.left = left+"px";
		menu_wrap.style.width = width+"px";
	}
	
	var menu_height = menu_wrap.offsetHeight;
	if(g_menu_y - window.scrollY + menu_height > window.innerHeight) { 
		var top = window.scrollY + window.innerHeight - menu_height;
		menu_wrap.style.top = top+"px";
	}
	
	if(menu_height > window.innerHeight) {
		menu_wrap.style.top = window.scrollY+"px";	
		var menu_height_new = window.innerHeight-20;
		menu_wrap.style.height = menu_height_new+"px";	
		menu_wrap.style.overflow = "auto";
	}
}

function macro_convert(menu_value) {
	var new_value = menu_value;
		
	var macro = "$GeneratePassword";
	while(new_value.indexOf(macro) != -1){
		var password = "";
		var pos1 = new_value.indexOf(macro);
		var part_head = new_value.substr(0, pos1);
		pos1 += macro.length;
		var pos2 = new_value.indexOf("$", pos1);
		if(pos2 != -1){
			var option_str = new_value.substring(pos1, pos2);
			option_str = option_str.replace(/ /g, "");
			var option_arr = option_str.split(",");
			var option_data = {length:0, U:0, L:0, N:0, S:0, X:0, C:0, specials:""};
			for(var item_data of option_arr){
				if(item_data.length){
					var item_1 = item_data.substr(0,1);
					if(parseInt(item_1)){ // is number
						option_data.length = parseInt(item_data);
						if(option_data.length < 3)
							option_data.length = 3;
						if(option_data.length > 1024)
							option_data.length = 1024;
					}
					else {
						var item_2 = 1;
						if(item_data.length > 1){
							var item_2 = parseInt(item_data.substr(1));
							if(isNaN(item_2)){
								if(item_1 == "S")
									item_2 = 1;
								else
									continue;
							}
							if(item_2 < 1)
								item_2 = 1;
							if(item_2 > 128)
								item_2 = 128;
						}
						switch(item_1){
							case 'U': option_data.U = item_2; break;
							case 'L': option_data.L = item_2; break;
							case 'N': option_data.N = item_2; break;
							case 'S': option_data.S = item_2; break;
							case 'X': option_data.X = item_2; break;
							case 'C': option_data.C = item_2; break;
						}
						if(item_1 == "S"){
							var head = "S" + option_data.S;
							var tail = item_data.replace(head, ""); // case "S1#@"
							if(tail.length && tail[0] == "S")
								tail = tail.substr(1); // case "S#@"
							if(tail.length){
								tail = tail.replace("Comma", ",");
								tail = tail.replace("Dollar", "$");
								option_data.specials = tail;	
							}
						}
					}// else if(parseInt(item_1))
				}//if(item_data.length)
			}//for(var item_data of option_arr)
				
			password = generate_password(option_data);
			g_last_password = password;
			chrome.runtime.sendMessage({msg:"set-last-password", password:password});
			if(option_data.C)
				copy_to_clipboard(password);
		}
		else
			pos2 = pos1;
		var part_tail = new_value.substr(pos2+1);
		new_value = part_head + password + part_tail;
	}// while

	macro = "$LastPassword$";
	while(new_value.indexOf(macro) != -1)
		new_value = new_value.replace(macro, g_last_password);
	
	macro = "$OldText$";
	while(new_value.indexOf(macro) != -1){
		var old_value = "";
		if(g_input_current != null)
			old_value = g_input_current.value;
		new_value = new_value.replace(macro, old_value);
	}	
	
	var macro = "$RandomText,";
	while(new_value.indexOf(macro) != -1){
		var pos1 = new_value.indexOf(macro);
		var part_head = new_value.substr(0, pos1);
		var part_text = "";
		pos1 += macro.length;
		var pos2 = new_value.indexOf("$", pos1);
		if(pos2 != -1){
			var variants_str = new_value.substring(pos1, pos2);
			var variants_arr = variants_str.split(",");
			if(variants_arr.length){
				var index_random = Math.floor(Math.random() * variants_arr.length);
				part_text = variants_arr[index_random];	
				part_text = part_text.replace("Comma", ",");
				part_text = part_text.replace("Dollar", "$");
			}
		}
		var part_tail = new_value.substr(pos2+1);
		new_value = part_head + part_text + part_tail;			
	}	

	macro = "$ClipboardText$";
	if(new_value.indexOf(macro) != -1){
		var clipboard_text = get_clipboard_text();
		while(new_value.indexOf(macro) != -1)
			new_value = new_value.replace(macro, clipboard_text);
	}
	
	return new_value;
}

function generate_password(option_data) {
	var password = "";
	
	// validate option_data
	var length_wanted = option_data.length;
	var length_by_parts = option_data.U + option_data.L + option_data.N + option_data.S;
	var length_by_parts_is_strong = 0;
	if(option_data.U > 1 || option_data.L > 1 || option_data.N > 1 || option_data.S > 1)
		length_by_parts_is_strong = 1;
	if(length_by_parts == 0 && length_wanted == 0){ // $GeneratePassword$
		option_data.U = 4;
		option_data.L = 4;
		option_data.N = 4;
		length_wanted = 12;	length_by_parts = 12;
	}

	if(length_by_parts == 0 && length_wanted != 0){ // $GeneratePassword,10$
		option_data.U = 1;
		option_data.L = 1;
		option_data.N = 1;
		length_by_parts = 3;
	}

	if(length_by_parts != 0 && length_wanted == 0){ // $GeneratePassword,U,L,N$
		length_wanted = 12;
	}

	if(length_by_parts && length_wanted > length_by_parts && length_by_parts_is_strong == 0){
		while(1){
			if(option_data.U){
				option_data.U++;
				length_by_parts++;
				if(length_by_parts >= length_wanted)
					break;
			}
			if(option_data.L){
				option_data.L++;
				length_by_parts++;
				if(length_by_parts >= length_wanted)
					break;
			}
			if(option_data.N){
				option_data.N++;
				length_by_parts++;
				if(length_by_parts >= length_wanted)
					break;
			}
			if(option_data.S){
				option_data.S++;
				length_by_parts++;
				if(length_by_parts >= length_wanted)
					break;
			}
		}
	}
	
	// validate parts
	var set_U = "ABCDEFGHIJKLMNPQRSTUVWXYZ";
	if(option_data.X == 0) set_U += "O";
	
	var set_L = "abcdefghijklmnpqrstuvwxyz";
	if(option_data.X == 0) set_L += "o";

	var set_N = "123456789";
	if(option_data.X == 0) set_L += "0";

	var set_S = "~!?@#№$%^*()<>[]{}_-+=";
	if(option_data.specials.length)
		set_S = option_data.specials;
	
	// generate password
	if(option_data.U) password += select_random_elements(set_U, option_data.U);  
	if(option_data.L) password += select_random_elements(set_L, option_data.L);  
	if(option_data.N) password += select_random_elements(set_N, option_data.N);  
	if(option_data.S) password += select_random_elements(set_S, option_data.S);  
	
	// shuffle
	for(var i=0; i<16; i++){
		var head = "";
		var tail = password;
		if(option_data.U || option_data.L){
			head = password.substr(0, 1);
			tail = password.substr(1);
		}
		tail = tail.split('').sort(function(){return 0.5-Math.random()}).join('');
		password = head + tail;
	}
	
	return password;
}

function select_random_elements(str, count) {
	var result = "";
	var arr = str.split("");
	var allow_splice = arr.length > count;
	for(var i=0; i<count; i++){
		var index_random = Math.floor(Math.random() * arr.length);
		result += arr[index_random];
		if(allow_splice)
			arr.splice(index_random, 1);
	}
	return result;
}

function copy_to_clipboard(text) {
	if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed"; 
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

function menu_item_insert(menu_index, is_shift_key, is_ctrl_key){
	if(menu_index > -1 && menu_index < g_menu_items.length) {
		if(is_shift_key){
			insert_to_form_index(menu_index);
			return;
		}
		var line_str = g_menu_items[menu_index];
		line_str = clear_menu_style(line_str);
		var menu_value = extract_menu_value(line_str);
		if(menu_value_is_valid(menu_value))
			insert_to_input(menu_value, is_ctrl_key);
	}
}

function get_index_in_form(){
	var form_is_valid = 1;
	var name_curr = g_input_current.getAttribute("name");
	if(name_curr == null || typeof(name_curr) == 'undefined')
		name_curr = g_input_current.getAttribute("id");
	if(name_curr == null || typeof(name_curr) == 'undefined')
		form_is_valid = 0;
	if(g_input_current.form == null)
		form_is_valid = 0;
	
	if(form_is_valid == 0){
		return -1;
	}
	
	// search current	
	var index_curr = -1;
	var form_items = g_input_current.form.elements; 
	for(var i=0; i<form_items.length; i++){
		var element = form_items.item(i);	
		var element_name = element.getAttribute("name");
		var element_id = element.getAttribute("id");
		if(name_curr == element_name || name_curr == element_id){
			index_curr = i;
			break;		
		}
	}
	
	return index_curr;
}

function insert_to_form_value(menu_value){
	var element_index = get_index_in_form();
	if(element_index == -1){
		g_input_current.value = menu_value;
		return;
	}
	
	var value_arr = menu_value.split("~~");
	var value_arr_curr = 0;
	
	// fill form
	var form_items = g_input_current.form.elements; 
	for(var i=element_index; i<form_items.length && value_arr_curr<value_arr.length; i++){
		var element = form_items.item(i);	
		if(is_input(element) && is_input_editable(element)){
			element.value = validate_menu_value(value_arr[value_arr_curr]);	
			element.dispatchEvent(new Event("change"));
			value_arr_curr++;
		}
	}
}

function insert_to_form_index(menu_index){
	var element_index = get_index_in_form();
	if(element_index == -1){
		return;
	}
	
	// fill form
	var form_items = g_input_current.form.elements; 
	for(var i=element_index; i<form_items.length && menu_index < g_menu_items.length; i++){
		var element = form_items.item(i);	
		if(is_input(element) && is_input_editable(element)){
			var can_assign_value = 0;
			while(menu_index < g_menu_items.length){
				var line_str = g_menu_items[menu_index];
				line_str = clear_menu_style(line_str);
				var menu_value = extract_menu_value(line_str);
				menu_value = validate_menu_value(menu_value);
				menu_index++;
				if(menu_value_is_valid(menu_value)){
					can_assign_value = 1;
					break;
				}
			}
			
			if(can_assign_value){
				element.value = menu_value;	
				element.dispatchEvent(new Event("change"));
			}
		}
	}
}

function validate_menu_value(menu_value){
	if(g_license_type > 1)
		menu_value = chrome.i18n.getMessage("trial_license_absent");
	if(g_browser_supported == 0)
		menu_value = chrome.i18n.getMessage("unknown_browser");
	
	return menu_value;
}

function insert_to_input(menu_value, is_ctrl_key){
	menu_value = validate_menu_value(menu_value);
	
	if(g_input_current == null)
		return;
	
	if(menu_value.indexOf("~~") != -1){
		insert_to_form_value(menu_value);
		return;
	}

	var is_div = false;
	var contenteditable = g_input_current.getAttribute("contenteditable");
	if(contenteditable != null && contenteditable == "true")
		is_div = true;
	
	if(is_div){
		if(document.hasFocus()){ // many iframes in document with contenteditable elements
			document.execCommand("insertHTML", false, menu_value);
		}
	}
	else{
		var pos_to_select = 0;
		var s1 = "";
		var s2 = "";
		if(is_ctrl_key){
			s1 = g_input_current.value.substr(0, g_input_current.selectionStart);
			s2 = g_input_current.value.substr(g_input_current.selectionEnd);
			pos_to_select = s1.length + menu_value.length;
		}else{
			pos_to_select = menu_value.length;
		}
		g_input_current.value = s1 + menu_value + s2;
		g_input_current.setSelectionRange(pos_to_select,pos_to_select);
	}
	
	var event_change = new Event("change");
	g_input_current.dispatchEvent(event_change);
	g_input_current.focus();
}   

function on_menu_item_click(event){
	var menu_item = event.currentTarget;
	var index = menu_item.getAttribute("data-menu-index");
	menu_item_insert(index, event.shiftKey, event.ctrlKey);
	if(index == 65536) // add to profile
		add_to_profile(event.ctrlKey);
	menu_off();
	event.stopPropagation();
}

function menu_item_neighbors_show(){
	if(g_neighbors_below == 0 || g_shift_is_pressed == 0)	
		return;
		
	var menu_item_current = document.getElementById("informenter-menu-item-" + g_menu_index_selected);	
	if(menu_item_current == null)
		return;
		
	menu_item_current = menu_item_current.nextSibling;	
	for(var i=0; i<g_neighbors_below && menu_item_current; i++){
		while(menu_item_current && !menu_item_current.classList.contains("informenter-menu-item"))
			menu_item_current = menu_item_current.nextSibling;	
		menu_item_current.classList.add("informenter-menu-item-below");
		menu_item_current = menu_item_current.nextSibling;	
	}	
}

function menu_item_neighbors_hide(){
	var menu_wrap = document.getElementById("informenter-menu");
	if(menu_wrap == null)
		return;
		
	var menu_item = menu_wrap.firstChild;
	while(menu_item){
		if(menu_item.classList.contains("informenter-menu-item-below"))
			menu_item.classList.remove("informenter-menu-item-below");
		menu_item = menu_item.nextSibling;
	}
}

function on_menu_item_over(event){
	var menu_item = event.currentTarget;
	g_menu_index_selected = menu_item.getAttribute("data-menu-index");
	menu_item_neighbors_show();	
}

function on_menu_item_out(event){
	menu_item_neighbors_hide();
}

function add_to_profile(is_ctrl_key) {
	if(g_input_current != null){
		var is_div = false;
		var contenteditable = g_input_current.getAttribute("contenteditable");
		if(contenteditable != null && contenteditable == "true")
			is_div = true;
					
		var item_new = "";
		if(is_div)
			item_new = g_input_current.innerText;
		else
			item_new = g_input_current.value.trim();
		
		item_new = validate_menu_value(item_new);
		if(item_new.length > 0){
			item_new = item_new.replace(/\n/g, "@@");
			chrome.runtime.sendMessage({msg:"add-menu-item", item_raw:item_new, to_head:is_ctrl_key});
		}
	}
}

function on_hotkey_click(command_str) {
	check_contenteditable_element();
	var command_num = parseInt(command_str.substr(17));
	var command_index = command_num - 1;
	if(g_enabled && g_input_current && g_menu_items && command_index > -1 && command_index < g_menu_items.length) 
		menu_item_insert(command_index, false, false);
	if(g_enabled && g_input_current && g_menu_items && command_num == 0){ 
		var rect_input = g_input_current.getBoundingClientRect();
		g_menu_x = window.scrollX + rect_input.left + rect_input.width;
		g_menu_y = window.scrollY + rect_input.top;
		menu_show();
	}
}

function on_context_menu_click(command_str) {
	check_contenteditable_element();
	var command_index = parseInt(command_str.substr(18)); // length of "context-menu-item-"
	if(g_enabled && g_input_current && g_menu_items && command_index > -1 && command_index < g_menu_items.length) 
		menu_item_insert(command_index, g_shift_is_pressed, g_ctrl_is_pressed);
	if(g_enabled && g_input_current && command_index == 65536)
		add_to_profile(g_ctrl_is_pressed);		
}

function on_marker_click(event){
	if(g_input_current != null){
		g_menu_x = window.scrollX + event.clientX;
		g_menu_y = window.scrollY + event.clientY;
		menu_show();
		event.stopPropagation();
	}
}

function on_marker_contextmenu(event){
	g_marker_location++;
	if(g_marker_location > 3) 
		g_marker_location = 0;
	g_marker_shifting = 1;
	chrome.runtime.sendMessage({msg:"change-marker-location", marker_location:g_marker_location});
	event.preventDefault();
	event.stopPropagation();
}

function menu_show(){
	var menu_wrap = create_menu_wrap();
	for(var i=0; i<g_menu_items.length; i++) {
		var line_str = g_menu_items[i];
		var menu_style = extract_menu_style(line_str);
		line_str = clear_menu_style(line_str);
		var menu_item_name = extract_menu_name(line_str);
		create_menu_item(menu_wrap, menu_item_name, i, menu_style);
	}
	create_menu_special_items(menu_wrap);
	check_menu_position(menu_wrap);
	g_menu_index_selected = -1;
}

function menu_select_next(){
	var try_num = 0;
	while(try_num < g_menu_items.length){
		g_menu_index_selected++;
		if(g_menu_index_selected >= g_menu_items.length)
			g_menu_index_selected = 0;
		var id_to_select = "informenter-menu-item-"+g_menu_index_selected;
		var menu_item = document.getElementById(id_to_select);
		if(menu_item){
			menu_item.focus();	
			break;
		}
		try_num++;
	}
}

function menu_select_prev(){
	var try_num = 0;
	while(try_num < g_menu_items.length){
		g_menu_index_selected--;
		if(g_menu_index_selected < 0)
			g_menu_index_selected = g_menu_items.length-1;
		var id_to_select = "informenter-menu-item-"+g_menu_index_selected;
		var menu_item = document.getElementById(id_to_select);
		if(menu_item){
			menu_item.focus();	
			break;
		}
		try_num++;
	}
}

function menu_select_current(is_shift_key, is_ctrl_key){
	var id_to_select = "informenter-menu-item-"+g_menu_index_selected;
	var menu_item = document.getElementById(id_to_select);
	if(menu_item)
		menu_item_insert(g_menu_index_selected, is_shift_key, is_ctrl_key);
	menu_off();
}

function menu_off(){
	var menu_wrap = document.getElementById("informenter-menu");
	if(menu_wrap)
		menu_wrap.parentNode.removeChild(menu_wrap);
}

////////////////////////////////////////////////////////////////////////
function check_active_element(){
	var element = document.activeElement;
	if(element && is_input(element) && is_input_editable(element))
		marker_show(element);
}

function check_contenteditable(){
	var contenteditable = document.body.getAttribute("contenteditable");
	if(contenteditable == true || contenteditable == "true" || contenteditable == "")
		marker_remove();	
}
/////
window.setTimeout(check_active_element,  200);
window.setTimeout(check_contenteditable, 500);
////////////////////////////////////////////////////////////////////////
function on_messages_content(request, sender, sendResponse){
//console.log("=== on_messages_content::request.msg:"+request.msg);	
	if(sender.id != chrome.runtime.id)
		return;
	
	if(request.msg === "data-ready"){
		if(request.ready)
			chrome.runtime.sendMessage({msg:"get-page-data"});
		else
			window.setTimeout(chrome.runtime.sendMessage({msg:"is-data-ready"}), 1000);
	}	

	if(request.msg === "set-page-data"){
		g_menu_items = request.menu.split("\n");
		g_marker_location = request.marker_location;
		g_marker_image = request.marker_image;
		g_last_password = request.password;
		g_enabled = request.enabled;
		g_license_type = request.license;
		g_browser_supported = request.browser_supported;

		menu_off();
		marker_remove();
		if(g_enabled){
			marker_create();
			if(g_marker_shifting)
				marker_show(g_input_current);
		}
		g_marker_shifting = 0;
	}

	if(request.msg === "set-last-password")
		g_last_password = request.password;
		
	if(request.msg === "close-menu")
		menu_off();
		
	if(request.msg === "hide-marker")
		marker_hide_on_page();
		
	if(request.msg === "hotkey-click")
		on_hotkey_click(request.command);
	
	if(request.msg === "context-menu-click")
		on_context_menu_click(request.command);
}
/////
chrome.runtime.onMessage.addListener(on_messages_content);
////////////////////////////////////////////////////////////////////////
chrome.runtime.sendMessage({msg:"is-data-ready"});
////////////////////////////////////////////////////////////////////////
document.addEventListener("click", on_document_click); 
document.addEventListener("keydown", on_document_keydown); 
document.addEventListener("keyup", on_document_keyup); 
window.addEventListener("beforeprint", on_window_beforeprint); 
window.addEventListener("afterprint", on_window_afterprint); 
window.addEventListener("scroll", on_window_scroll);
window.addEventListener("resize", on_window_resize);
////////////////////////////////////////////////////////////////////////
