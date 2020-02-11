/*
 * css_adjust.js
 * Gnome3 Turn off Display Extension
 *
 * Helper for handling automatic or manual adjustment of the aggregate menu to fit all added items in the system area.
 *
 *
 * Author: Simon Junga (simonthechipmunk at gmx.de)
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option)
 * any later version.
 *
 */


//***// imports:

// main functionality
const Main = imports.ui.main;




// define global variables
let menuChangedAdd, menuChangedRem;

let aggregateMenu = Main.panel.statusArea['aggregateMenu'];
let aggregateMenuWidth = aggregateMenu.menu.actor.get_width();



//***// basic functions

function handle_aggregate_menu(mode, width) {
// set mode

	if(mode == "auto" && !menuChangedAdd && !menuChangedRem) {
	
		
		// monitor changes in the system area
		menuChangedAdd = aggregateMenu._system.buttonGroup.connect('actor_added', function() {
				
			checkAggregatemenuwidth(); 
		});
		
		menuChangedRem = aggregateMenu._system.buttonGroup.connect('actor_removed', function() {
			
			checkAggregatemenuwidth();							
		});
		
		// initial menu adjustment
		checkAggregatemenuwidth();

	}

		
	else if(mode == "fixed" && width >= aggregateMenuWidth) {
		// set menu to fixed size
		disconnect_all();		
		aggregateMenu.menu.actor.set_width(width);
	}

	
	else if(mode == "off")  {
		// reset menu to original size
		disconnect_all();
		aggregateMenu.menu.actor.set_width(aggregateMenuWidth);
	}

	
}





function checkAggregatemenuwidth() {
// run menu width adjustment if necessary


	let actionChildren = aggregateMenu._system.buttonGroup.get_children();
	let allButtonWidth = actionChildren[1].get_width()*2;
	
	//calculate new width
	for (let button of actionChildren) {
		allButtonWidth += button.get_width();
	}

	// change the menu width
	if(aggregateMenuWidth < allButtonWidth){
		aggregateMenu.menu.actor.set_width(allButtonWidth);
	}
	else if (aggregateMenu.menu.actor.get_width() != aggregateMenuWidth){
		aggregateMenu.menu.actor.set_width(aggregateMenuWidth);
	}
		
}





function disconnect_all() {
// disconnect from active signals

	if(menuChangedAdd) {
			aggregateMenu.menu.actor.disconnect(menuChangedAdd);
			menuChangedAdd = null;
	}
	
	if(menuChangedRem) {
			aggregateMenu.menu.actor.disconnect(menuChangedRem);
			menuChangedRem = null;
	}
}

