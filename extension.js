/*
 * extension.js
 * Gnome3 Turn off Display Extension
 *
 * Adds a button to the status menu to turn off the screen. This extension is here to continue "Blank Screen" by l300lvl which is stuck at GS3.6 and seems dead despite active commits
 * on github. https://extensions.gnome.org/extension/242/blank-screen/  *** https://github.com/l300lvl/Blank-Screen-Extension
 *
 *
 * Author: Simon Junga (simonthechipmunk@gmx.de)
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

// menu items
const PopupMenu = imports.ui.popupMenu;

// utilities for external programs and command line
const Util = imports.misc.util;

// clutter and Gtk
const Clutter = imports.gi.Clutter;
const Gtk = imports.gi.Gtk;

// translations
const Gettext = imports.gettext.domain('turnoffdisplay');
const _ = Gettext.gettext;

// own imports
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Prefs = Me.imports.prefs;
const Utils = Me.imports.utils;
const Settings = Utils._getSettingsSchema();







// define global variables
let menuitem, button, systemMenu, menuSettings;




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

	// connect to signal "preference changed"
	menuSettings = Settings.connect('changed::buttonposition', function() { 
		_MenuEntry(false);
		_MenuEntry(true);
	});

}



function disable() {
        // disable the menu entry
	_MenuEntry(false);

	// disconnect from signal "preference changed"
	Settings.disconnect(menuSettings);

}






//***// extension functions

function _MenuEntry(set) {
// create/destry the menu entry

	// enable the entry
	if(set) {
	
		// create the menu entry according to preference settings 
		if(!Prefs._getButtonConfig()) {

			systemMenu = Main.panel.statusArea['aggregateMenu'];

			// create seperate menu button
	    		menuitem = new PopupMenu.PopupMenuItem("");
			let icon = new St.Icon({ icon_name: 'disable-display-symbolic', y_align: Clutter.ActorAlign.START, style_class: 'popup-menu-icon' });
			let text = new St.Label({ text: _("Turn off Display"), style_class: "sm-label" });
			menuitem.actor.add(icon);
			menuitem.actor.add(text);
			menuitem.connect('activate', _DisplayOff);
			// add the menuentry to the menu
	    		systemMenu.menu.addMenuItem(menuitem, 0);
		}

		else {

			systemMenu = Main.panel.statusArea['aggregateMenu']._system;

			// create round button in system control area
			button = systemMenu._createActionButton('disable-display-symbolic', _("Turn off Display"));
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
	systemMenu.menu.itemActivated();
	//use xset to disable the screen
        let command = Util.spawn(['xset','dpms','force','off']);
       	command.activate();

}

