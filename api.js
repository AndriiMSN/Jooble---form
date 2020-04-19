////////////////////////////////////////////////////////////////////////
var g_macro_style = ["$Bold$", "$Big$", "$Red$", "$Green$", "$Blue$"];
var g_macro_class = ["informenter-macro-bold", "informenter-macro-big", "informenter-macro-red", "informenter-macro-green", "informenter-macro-blue"];
////////////////////////////////////////////////////////////////////////
function extract_menu_name(line_str){
	var menu_name = line_str;
	var pos = line_str.lastIndexOf("##");
	if(pos != -1)
		menu_name = line_str.substr(pos+2);
	return menu_name;
}   

function extract_menu_value(line_str){
	var menu_value = line_str;
	var pos = line_str.lastIndexOf("##");
	if(pos != -1)
		menu_value = line_str.substr(0, pos);
	menu_value = menu_value.replace(/@@/g, "\n");
	menu_value = macro_convert(menu_value);
	
	return menu_value;
}   

function extract_menu_style(line_str){
	var menu_style = "";
	for(var i=0; i<g_macro_style.length; i++){
		var current_macro = g_macro_style[i];
		if(line_str.indexOf(current_macro) != -1){
			var current_class = g_macro_class[i];
			if(menu_style.indexOf(current_class) == -1)
				menu_style += " "+current_class;
		}
	}
	return menu_style;
}

function clear_menu_style(line_str){
	for(var i=0; i<g_macro_style.length; i++){
		var current_macro = g_macro_style[i];
		while(line_str.indexOf(current_macro) != -1)
			line_str = line_str.replace(current_macro, "");
	}
	return line_str;
}

function menu_value_is_valid(menu_value) {
	if(menu_value.indexOf("---") == 0) // it is separator
		return false;
	return true;
}
////////////////////////////////////////////////////////////////////////