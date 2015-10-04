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

	// create custom command bindings for gsettings "bool", "string", "stringarray" and "int"
    	let set_boolean = Lang.bind(settings, settings.set_boolean);
    	let set_string = Lang.bind(settings, settings.set_string);
    	let set_strv = Lang.bind(settings, settings.set_strv);
    	let set_int = Lang.bind(settings, settings.set_int);
    	
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
    	
    	settings.set_int = function(key, value) {
        	set_int(key, value);
        	Gio.Settings.sync();
    	};

}



function buildPrefsWidget() {
// build the Gtk preferences widget
	let frame = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, border_width: 10, margin: 20});

	// add items to the widget frame
	frame.add( _createSwitchbox( _("Integrate into System Controls (Round Buttons)"), 
		_("Adds a round button instead of a separate entry in the Systemmenu"), _getIntegrate, _setIntegrate ));
	frame.add( _createSwitchbox( _("Disable Mouse when Screen is turned Off"), 
		_("Automatically disable all external mouse pointers to prevent the screen from turning on accidentally."), _getHandleMouse, _setHandleMouse ));
		
		
	frame.add( _createComboBox( _("Menu Width adjustment Mode"), _("Select the mode for handling the width of the Main Menu."),
			{'off': _("Off"), 'auto' : _("Automatic"), 'fixed' : _("Fixed")}, _getHandleMenuMode, _setHandleMenuMode ));
			
	frame.add( _createAdjustBox( "", _("Fixed menu size in px."),
			360.0, 1200.0, 1.0, _getFixMenuWidth, _setFixMenuWidth ));
	
					
	frame.add( _createKeybindbox( _("Custom Keybinding"), 
		_("Set a Keybinding to turn off the Display (Examples: F12, <Super>space, <Ctrl><Alt><Shift>w)"),
		"emblem-ok-symbolic", _("Keybinding is enabled"),
		"window-close-symbolic", _("Keybinding is disabled. Set a valid Shortcut to enable it"), _getKeybinding, _setKeybinding ));	
	frame.show_all();
	return frame;
}






//***// preferences functions

function _createSwitchbox(text, tooltip, getFunction, setFunction) {
// create box with toggle switch
	let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin: 5});
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
	let toggleswitch = new Gtk.Switch({ active: getFunction() });

	// connect to "toggled" emit signal
	toggleswitch.connect('notify::active', setFunction);

	//fill the box with content
	box.pack_start(label, true, true, 0);
	box.add(toggleswitch);

	return box;
}




function _createComboBox(text, tooltip, values, getFunction, setFunction) {
// create box with combo selection field
	let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin: 5});
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
	let widget = new Gtk.ComboBoxText();
	for (id in values) {
		widget.append(id, values[id]);
	}
	widget.set_active_id(getFunction());

	// connect to "changed" emit signal
	widget.connect('changed', function(combo_widget) {
		setFunction(combo_widget.get_active_id());
	});
	//fill the box with content
	box.pack_start(label, true, true, 0);
	box.add(widget);
	return box;
}




function _createAdjustBox(text, tooltip, LOWER, UPPER, INCREM, getFunction, setFunction) {
// create box with adjust selection field
	let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin: 5});
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
	let adjustbox = new Gtk.Adjustment({ lower: LOWER, step_increment: INCREM, upper: UPPER, value: 1.0 });
	let spinbutton = new Gtk.SpinButton({ adjustment: adjustbox, digits: 0, tooltip_text: tooltip});
	spinbutton.set_value(getFunction() );
	
	// toggle sensitive property
	if(_getHandleMenuMode() != "fixed") { box.sensitive = false; }
	let sensitive = settings.connect('changed::handlemenumode', function() { 
		if(_getHandleMenuMode() == "fixed") {
			box.sensitive = true;
		}
		else {
			box.sensitive = false;
		}
	});

	// connect to "value-changed" emit signal
    	spinbutton.connect('value_changed', function() { 
    		setFunction(spinbutton.value); 
    	});
	//fill the box with content
	box.pack_start(label, true, true, 0);
	box.add(spinbutton, true, true, 5);

	return box;
}




function _createKeybindbox(text, tooltip, secIconOK, secIcontooltipOK, secIconNOK, secIcontooltipNOK, getFunction, setFunction) {
// create box with keybinding entry
	let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin: 5});
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
	let textbox = new Gtk.Entry({ text : getFunction() });
	updateTextbox();
	// connect to "text-changed" emit signal and check for valid keybinding
    	textbox.connect('changed', function() { updateTextbox(); });

	function updateTextbox(){
            let [key, mods] = Gtk.accelerator_parse(textbox.get_text());
            
            if(Gtk.accelerator_valid(key, mods)) {
                textbox["secondary-icon-name"] = secIconOK;
                textbox["secondary-icon-tooltip-text"] = secIcontooltipOK;
                let shortcut = Gtk.accelerator_name(key, mods);
                _setKeybinding(shortcut);
            }
            
            else {
                textbox["secondary-icon-name"] = secIconNOK;
                textbox["secondary-icon-tooltip-text"] = secIcontooltipNOK;
                setFunction("");
            }
	}


	//fill the box with content
	box.pack_start(label, true, true, 0);
	box.add(textbox, true, true, 5);

	return box;
}







// functions to get/set gsettings entries
function _getIntegrate() {
	return settings.get_boolean('integrate');
}

function _setIntegrate() {
    	settings.set_boolean('integrate', !_getIntegrate());
}


function _getHandleMouse() {
	return settings.get_boolean('handlemouse');
}

function _setHandleMouse() {
    	settings.set_boolean('handlemouse', !_getHandleMouse());
}


function _getHandleMenuMode() {
	return settings.get_string('handlemenumode');
}

function _setHandleMenuMode(command) {
	settings.set_string('handlemenumode', command);
}


function _getFixMenuWidth() {
	return settings.get_int('fixmenuwidth');
}

function _setFixMenuWidth(command) {
	settings.set_int('fixmenuwidth', command);
}


function _getKeybinding() {
	return settings.get_strv('turnoffdisplay-keybinding')[0];
}

function _setKeybinding(command) {
	settings.set_strv('turnoffdisplay-keybinding', [command]);
}

