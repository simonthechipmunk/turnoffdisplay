/*
 * Preferences for the extension which will be available in the 
 * "gnome-shell-extension-prefs" tool.
 *
 *
 * see: https://live.gnome.org/GnomeShell/Extensions#Extension_Preferences
 *
 */

//***// imports:

// main
const Gio  = imports.gi.Gio;
const Gtk  = imports.gi.Gtk;
const Lang = imports.lang;

// translations
const Gettext = imports.gettext.domain('turnoffdisplay');
const _ = Gettext.gettext;

// own imports
const Me   = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils; 






// define global variables
let settings = {};





//***// basic preferences functions

function init() {

	// init translations
	Utils._initTranslations();

	// load the settings schema
    	settings = Utils._getSettingsSchema();

	// create custom command bindings for gsettings "bool", "string" and "stringarray"
    	let set_boolean = Lang.bind(settings, settings.set_boolean);
    	let set_string = Lang.bind(settings, settings.set_string);
    	let set_strv = Lang.bind(settings, settings.set_strv);
    	
    	settings.set_boolean = function(key, value) {
        	set_boolean(key, value);
        	Gio.Settings.sync();
    	};

    	settings.set_string = function(key, value) {
        	set_string(key, value);
        	Gio.Settings.sync();
    	};
    	
    	settings.set_strv = function(key, value) {
        	set_strv(key, value);
        	Gio.Settings.sync();
    	};

}



function buildPrefsWidget() {
// build the Gtk preferences widget
	let frame = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, border_width: 10, margin: 20});

	// add items to the widget frame
	frame.add( _createSwitchbox( _("Integrate into System Controls (Round Buttons)"), 
		_("Adds a round button instead of a seperate entry in the Systemmenu") ));
	frame.add( _createKeybindbox( _("Custom Keybinding"), 
		_("Set a Keybinding to turn off the Display (Examples: F12, <Super>space, <Ctrl><Alt><Shift>w)") ));	
	frame.show_all();
	return frame;
}






//***// preferences functions

function _createSwitchbox(text, tooltip) {
// create box with text entry for button preferences
	let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin: 5});
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
	let toggleswitch = new Gtk.Switch({ active: _getButtonConfig() });

	// connect to "toggled" emit signal
	toggleswitch.connect('notify::active', _setButtonConfig);

	//fill the box with content
	box.pack_start(label, true, true, 0);
	box.add(toggleswitch);

	return box;
}




function _createKeybindbox(text, tooltip) {
// create box with keybinding entry
	let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin: 5});
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
	let textbox = new Gtk.Entry({ text : _getKeybinding() });
	updateTextbox();
	// connect to "text-changed" emit signal and check for valid keybinding
    	textbox.connect('changed', function() { updateTextbox(); });

	function updateTextbox(){
            let [key, mods] = Gtk.accelerator_parse(textbox.get_text());
            
            if(Gtk.accelerator_valid(key, mods)) {
                textbox["secondary-icon-name"] = "emblem-ok-symbolic";
                textbox["secondary-icon-tooltip-text"] = _("Keybinding is enabled");
                let shortcut = Gtk.accelerator_name(key, mods);
                _setKeybinding(shortcut);
            }
            
            else {
                textbox["secondary-icon-name"] = "window-close-symbolic";
                textbox["secondary-icon-tooltip-text"] = _("Keybinding is disabled. Set a valid Shortcut to enable it");
                _setKeybinding("");
            }
	}


	//fill the box with content
	box.pack_start(label, true, true, 0);
	box.add(textbox, true, true, 5);

	return box;
}







// functions to get/set gsettings entries
function _getButtonConfig() {
	return settings.get_boolean('buttonposition');
}

function _setButtonConfig() {
    	settings.set_boolean('buttonposition', !_getButtonConfig());
}


function _getKeybinding() {
	return settings.get_strv('turnoffdisplay-keybinding')[0];
}

function _setKeybinding(command) {
	settings.set_strv('turnoffdisplay-keybinding', [command]);
}
