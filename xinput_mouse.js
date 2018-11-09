/*
 * xinput_mouse.js
 * Gnome3 Turn off Display Extension
 *
 * Helper for Xinput to detect and disable mouse input devices. Adapted from Touchpad Indicator by https://extensions.gnome.org/accounts/profile/orangeshirt
 *
 *
 * Author: Simon Junga (simonthechipmunk at gmx.de)
 * Original Author: Armin Köhler (orangeshirt at web.de>)
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option)
 * any later version.
 *
 */


//***// imports:

// utilities for external programs and command line
const GLib = imports.gi.GLib;




// define global variables
let xinput_is_installed = xinput_installed();

const exclude_devices = new Array('touchpad','glidepoint','fingersensingpad', 'bcm5974','trackpad','smartpad',
					'trackpoint','accu point','trackstick', 'touchstyk','pointing stick','dualpoint stick',
						'touchscreen', 'maxtouch', 'touch',
							'pen stylus', 'pen eraser');




//***// basic functions

function get_pointer_ids() {
	// get all IDs for devices that match the property "pointing device"
	var pointerIDs = new Array();
        let lines = execute_sync('xinput --list');
        if (lines) {
		lines = lines[1].toString().split('\n');
	    	let y = 0;
            	for (let line = 0; line < lines.length; line++) {
                	if ((lines[line].indexOf('slave  pointer') != -1) && (lines[line].indexOf('XTEST') == -1)) {
                     	pointerIDs[y] = lines[line].toString().split('=')[1].split('[')[0].split('\t')[0];
                     	y++;
            		}
        	}
        }
        return pointerIDs;
        
}





function get_mouse_ids() {
	// get all IDs for devices that match the property "pointing device" and are not listed in exclude_devices
	var mouseIDs = new Array();
        let lines = execute_sync('xinput --list');
        if (lines) {
		lines = lines[1].toString().split('\n');
	    	let y = 0;
            	for (let line = 0; line < lines.length; line++) {
                	if ((lines[line].indexOf('slave  pointer') !=- 1)  && (lines[line].indexOf('XTEST') == -1)) {
                		// check for devices on exclude list
                		let checkOK = 1;
				for (let check = 0; check < exclude_devices.length; check++) {
                			if ((lines[line].toLowerCase().indexOf(exclude_devices[check].toString().toLowerCase()) ) != -1) {
                    				checkOK = 0;	
               			 	}
				}
				
				if(checkOK) {
					mouseIDs[y] = lines[line].toString().split('=')[1].split('[')[0].split('\t')[0];
                     			y++;
                     		}
            		}
        	}
        }
        return mouseIDs;

}





function switch_devices(mode, deviceIDs) {
	// enable/disable devices by ID
	for (let device of deviceIDs) {
		if(mode == "on") {
			execute_sync('xinput --enable ' + device);
		}
		
		else if(mode == "off") {
			execute_sync('xinput --disable ' + device);
		}
	}
	
}




function execute_sync(command) {
	//run a command on the command line
	try {
		return GLib.spawn_command_line_sync(command);
	}
	catch (err) {
		return false;
	}
}




function xinput_installed(){
	//check if xinput is present
	if(execute_sync('xinput --list')){
		return true;
	}
	return false;
}

