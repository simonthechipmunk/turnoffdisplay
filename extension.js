/*
 * extension.js
 * Gnome3 Turn off Display Extension
 *
 * Adds a button to the status menu to turn off the screen. This extension is here to continue "Blank Screen" by l300lvl which is updated to GS3.6 
 * https://extensions.gnome.org/extension/242/blank-screen/  *** https://github.com/l300lvl/Blank-Screen-Extension
 *
 *
 * Author: Simon Junga (simonthechipmunk at gmx.de)
 * Original Author: l300lvl
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option)
 * any later version.
 *
 */


//***// imports:

// icons and labels
const St = imports.gi.St;

// main functionality
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Mainloop = imports.mainloop;

// menu items
const PopupMenu = imports.ui.popupMenu;

// utilities for external programs and command line
const Config = imports.misc.config;
const ShellVersion = Config.PACKAGE_VERSION.split('.');
const Util = imports.misc.util;
const GLib = imports.gi.GLib;

// clutter and Gtk
const Gtk = imports.gi.Gtk;

// translations
const Gettext = imports.gettext.domain('turnoffdisplay');
const _ = Gettext.gettext;

// own imports
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Prefs = Me.imports.prefs;
const Utils = Me.imports.utils;
const CSSadjust = Me.imports.css_adjust;
const Xinput = Me.imports.xinput_mouse;
const Settings = Utils._getSettingsSchema();




// define global variables
var mousepointerIDs = new Array();
let menuitem, button, systemMenu, menuSettings, keybindSettings, handlemenumodeSettings, fixmenuwidthSettings;
let eventKeybind=null;
let eventXsetwatch=null;



//***// basic extension functions

function init() {
 	// initialize preferences
	Prefs.init();

	// get extension icons
	Gtk.IconTheme.get_default().append_search_path(Me.dir.get_child('icons').get_path());
}




function enable() {

	// create the menu entry
	_MenuEntry(true);
	
	// set keybinding
	_SetKeybinding(true);
	
	// start menu width adjustment
	CSSadjust.handle_aggregate_menu(Prefs._getHandleMenuMode(), Prefs._getFixMenuWidth() );

	// connect to signals "preference changed"
	menuSettings = Settings.connect('changed::integrate', function() { 
		_MenuEntry(false);
		_MenuEntry(true);
	});
		
	keybindSettings = Settings.connect('changed::keybinding', function() { 
		_SetKeybinding(true);	
	});
	
	handlemenumodeSettings = Settings.connect('changed::handlemenumode', function() { 
		CSSadjust.handle_aggregate_menu(Prefs._getHandleMenuMode(), Prefs._getFixMenuWidth() );	
	});
	
	fixmenuwidthSettings = Settings.connect('changed::fixmenuwidth', function() { 		
		if(Prefs._getHandleMenuMode() == "fixed") {
			CSSadjust.handle_aggregate_menu("fixed", Prefs._getFixMenuWidth() );
		}
	});

}




function disable() {
        // disable the menu entry
	_MenuEntry(false);
	
	// remove keybinding
	_SetKeybinding(false);

	// disconnect from signals "preference changed"
	Settings.disconnect(menuSettings);
	Settings.disconnect(keybindSettings);
	Settings.disconnect(handlemenumodeSettings);
	Settings.disconnect(fixmenuwidthSettings);
	
	// remove timer event
	if(eventKeybind) {
		Mainloop.source_remove(eventKeybind);
	}
	
	if(eventXsetwatch) {
		Mainloop.source_remove(eventXsetwatch);
	}
	
	// disable menu width adjustment
	CSSadjust.handle_aggregate_menu("off");

}






//***// extension functions

function _MenuEntry(set) {
// create/destroy the menu entry

	// enable the entry
	if(set) {
	
		// create the menu entry according to preference settings 
		if(!Prefs._getIntegrate()) {

			systemMenu = Main.panel.statusArea['aggregateMenu'];

			// create separate menu button
	    		menuitem = new PopupMenu.PopupBaseMenuItem({ activate: true });
			let icon = new St.Icon({ icon_name: 'disable-display-symbolic', style_class: 'popup-menu-icon' });
			let text = new St.Label({ text: _("Display Off"), style_class: "sm-label" });
			menuitem.actor.add(icon);
			menuitem.actor.add(text);
			menuitem.connect('activate', _DisplayOff);
			// add the menuentry to the menu			
	    		systemMenu.menu.addMenuItem(menuitem, 0);

		}

		else {

			systemMenu = Main.panel.statusArea['aggregateMenu']._system;

			// create round button in system control area
			button = systemMenu._createActionButton('disable-display-symbolic', _("Display Off"));
			button.connect('clicked', _DisplayOff);
			// add the menuentry to the menu
			systemMenu._actionsItem.actor.insert_child_at_index(button, 4);
		}

	}


	// disable the entry
	else {

		if(menuitem) {
			// remove the menuitem
			menuitem.destroy();
		}

		else {

			// remove the button
			systemMenu._actionsItem.actor.remove_child(button);
		}

		// reset menuitem/button variable
		menuitem = null;
		button = null;

	}

}






function _DisplayOff() {
// turn off the display

	//close the menu
	systemMenu.menu.itemActivated();
	//use xset to disable the screen
	Util.spawn(['xset','dpms','force','off']);  
	 
	// disable external mice if set in the preferences
	if(Prefs._getHandleMouse() ) {
		disable_mouse();
	}
		
}






function _SetKeybinding(set) {
// enable keybinding to turn off the display
		
	if (Prefs._getKeybinding() != "" && set) {
	
		// Shell version management
		let mode;
		
		if (ShellVersion[1] <= 14 ) {
		mode = Shell.KeyBindingMode.NORMAL;
		}
		else if (ShellVersion[1] <= 18) {
		mode = Shell.ActionMode.NORMAL;
		}

		
		Main.wm.addKeybinding('turnoffdisplay-keybinding', Settings, Meta.KeyBindingFlags.NONE, mode, function() { 
				// turn off display after 500ms (workaround! - needs something like 'key-release-event')
				eventKeybind = GLib.timeout_add(0, 500, _DisplayOff);
			}, null, null);		
			
	}
		
	else {
		Main.wm.removeKeybinding('turnoffdisplay-keybinding');
	}
	
}





function disable_mouse() {
// disable mouse pointers and watch for display revoke	
	
	mousepointerIDs = Xinput.get_mouse_ids();
	Xinput.switch_devices("off", mousepointerIDs);
	
	// check monitor status periodically
	eventXsetwatch = GLib.timeout_add(0, 500, function() { 
	
        	let lines = GLib.spawn_command_line_sync('xset -q');
        	if (lines) {
        	
        		// check for "Monitor is On"
        		lines = lines.toString();
	               	if (lines.indexOf('Monitor is On') != -1) {
                     		Xinput.switch_devices("on", mousepointerIDs);
                     		return false;	
            		}
            		
            		else {
            			return true;
            		}
        	}
        			
	});
	
}

