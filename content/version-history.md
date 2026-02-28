## Version 6.4
- Added a new markdown-powered Help menu with setup expectations and a sectioned FAQ.
- `How to Use This App` now opens the Help menu, with dedicated Tutorials buttons for tours.
- Added keyboard shortcut `Ctrl + Shift + H` to open the Help menu.

## Version 6.3
- New `Center Map` flow is easier to use: opens aligned to map view, remembers your location, and recenters without forcing zoom.
- Faster, cleaner startup: a loading screen now appears while the app fully initializes, with local assets to reduce delays.
- Parallelized location results for faster rendering.

## Version 6.1
- Added Minimized Cards header controls for bulk actions: Minimize All and Maximize All.
- Bulk minimize/maximize now clears current selection and preserves card order.
- Minimized cards are now draggable, so you can reorder them directly from the minimized row.

## Version 6.0
- Complete refactor under the hood, plus other significant updates.
- Consolidated map controls into focused menus: Labels, Visibility, and Data Types.
- Added inactive label opacity control for non-active map labels.
- Added recency filtering (`Show all` / `Show most recent`) for location-tagged notes.

## Version 5.4
- Dragging a map point now works from its label reliably (not just the pin dot).

## Version 5.3
- Map pin dragging now works from the label as well as the pin itself.

## Version 5.2
- Card note order is now configurable in Dispatch settings (default: newest-first).
- Map labels default to semitransparent and become fully opaque on hover or click.

## Version 5.1
- Made it easier to enter new cars with keyboard only.
- Gussied up the homepage.

## Version 5.0
- Vehicle system split into Vehicle and Vehicle List, with dedicated workflows for each.
- Map-first location ops are now much faster: inline search previews, drag-pin assignment, and improved pin confirmation behavior.
- New power shortcuts: Ctrl + Shift + G (Go to location), plus expanded drop-pin/location keyboard actions.
- Vehicle List mapping upgraded: + New Vehicle creates/location-tags a new vehicle note, then opens vehicle info capture.
- Major UX polish pass: responsive shortcuts modal, stronger focus/keyboard flows, better pin visuals, and safer type-change warnings.

## Version 4.5
- Location tagging now runs directly on the main map (split-aware), with cleaner close/cancel behavior.
- Drop-pin flows were unified: modal Drop Pin now exits immediately into draggable pin mode; shortcut drop-pin now tags selected note/card correctly.
- Map tooltips now include quick actions for delete pin and “Add Newer Location,” plus tighter keyboard/focus polish for note creation.

## Version 4.4
- Map drop-pin now assigns location by chosen card type (mobile types create a note-level pin).
- Summary settings now include “Add space between notes” for clearer exported output.

## Version 4.3
- Vehicle map note labels now show plate + state (when available).
- Vehicle map detail cards now show make/model, color, and body style up top.
- added copy vehicle info button to vehicle notes

## Version 4.2
- Tours now save progress and can resume after reload.
- Dispatcher tour now includes map search/pin-drop card creation.
- Added Advanced Card Color Settings tour.

## Version 4.1
- Added linkbacks from Summary back to Notes.
- Renamed "Sanitize Names" option to "Change observer names to numbers".

## Version 4.0
- Create cards by dropping pin or looking up location from map!
- New Vehicle cards, with vehicle fields and validation for state, make, model, and color
- New settings for colorblind friendly card palettes and color schemes by card type (with manual options)
- Added Lat+Lon output for locations and improved Summary formatting

## Version 3.5
- Added a full YAML-driven tutorial system with tour picker, welcome/completion flows, completion checkmarks, and ordered `N_` tour conventions.
- Expanded the Dispatch tutorial and sample session so users can practice map/location, summary filtering/sorting, and export workflows in-place.
- Upgraded About + Summary/Output presentation with clearer legal/privacy messaging and refined visual emphasis in key output areas.

## Version 3.4
- Unified map label interactions so clicking a pin or label opens the same expanded details.
- Moved note actions into the expanded map tooltip and removed the separate map popup.
- Added a copy-address icon in map tooltips with clipboard toast feedback.
- Opening a note from map labels no longer shifts the map position in split view.
- Focused labels now auto-pan the map so the full tooltip details stay in view.
- Updated tooltip action buttons to calmer, neutral styling for readability.

## Version 3.3
- Made map location links reliably center on the correct target pin.
- Added a focused pin mode that keeps the selected pin label on top until you click away.
- Added a short attention pulse on focused pins, without shifting label layout.
- Made focus ring and pulse color follow each card's pin color.
- Improved Set Location keyboard flow: Enter now supports select-then-confirm.
- Double-clicking map labels now activates the related note (latest note for card pins) and scrolls to it.

## Version 3.2
- Made sure latest observations always stack on top for map pins.
- Made Global time format setting truly global across time displays.
- Clarified time format options with explicit 24-hour and 12-hour labels.

## Version 3.1
- Cleaned up navigation of location tagging modal.
- Added "Most Recent First" sort option for summary output.
- Bumped up font size in various places for better legibility.
- Fixed z-index issue on color dropdown.

## Version 3.0
- Added card color dropdown.
- Assigned CTRL+SHIFT+P to toggle through card color & associated pins.
- Added pins to location set dialog. Improved keyboard navigation of location tagging.

## Version 2.9
- Added ability to copy separate copyable fields when sorted by category or card.

## Version 2.8
- Added new Observer "car" and "bike" types.
- Removed observer word customization from summary.
- Made emojis on map labels larger.
- Swapped out emojis for consistent icons in map labels.
- Add warning if reportable data is being filtered out of Summary.
- Improved layout of Summary Output.

## Version 2.7
- Made dispatch summary preview monotype font so text lines up.
- Made sure all types of data tagged for reporting get selected in filter by default.
- Various fixes and clarification of Filters and controls of summary tab.
- Added new Global Settings controls for Default Summary Exclusion.
- Added new Global Setting for Default New Card Type.
- Improved maximize card behavior: scroll to and activate.

## Version 2.6
- Made persistent move button with consistent styling.
- Improved visibility, styling of location pin buttons.
- Fixed map header styling.

## Version 2.5
- Easier, draggable pins (without "move mode").
- Reverse geocoding--address resolution of dragged pins instead of static text "dragged pin."
- Center default map on Minneapolis.
- Improved tooltips and intuitive connections between note locations inherited from a card-wide location assignment.

## Version 2.4
- Made expanded labels cleaner.

## Version 2.3
- 2.3: CSP bug fix that blocked new maps.

## Version 2.2
- 2.2: Now labels (not just pins) clickable and hoverable for more options.

## Version 2.1
- 2.1: Added new default map and option to switch back.

## Version 2
- 2.0: Map UX overhaul: sticky split view, full-height map view, colored pins with rich tooltips.
- 2.0: Map filters: hide minimized, label times, and type-based pin visibility.
- 2.0: Notes can be dragged between cards with time-based auto-sorting.
- 2.0: Location tagging improvements: new pin icons, clear pin with confirmation, improved tooltips.
- 2.0: Timezone fixes: manual shift/note timestamps respect selected timezone.

## Version 1
- 1.6: Switched geocoder.
- 1.5: Beta implementation of maps.
- 1.4: Restored search functionality.
- 1.3: Auto-resort cards based on time if manual entries. Improved UI for draggable cards.
- 1.2: Added draggable cards without needing to trigger a mode.
- 1.1: Major changes to clean up UI. Added icons instead of emojis. Making way for map views.
- 1.0: Search added.

## Version 0
- 0.2: Added versioning.
- 0.1: Added ability to move tiles, add Reportability tag, and many aesthetic improvements.
