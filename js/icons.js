/* =====================================================================
   ICONS — original line drawings, one per clip.
   Each drawing is SVG shapes on a 48 x 48 grid, drawn as strokes
   (no fill). The key is the clip's id, or whatever you put in a clip's
   "icon" field in data.js.

   To add a drawing:  mydrawing: '<circle cx="24" cy="24" r="16"/>',
   Useful shapes: <path d="..."/>, <circle/>, <rect/>, <ellipse/>, <line/>.
   Keep everything inside 0..48. Stroke color and width are set by CSS.
   ===================================================================== */

window.EDIT_ICONS = {
  generic:   '<rect x="5" y="10" width="38" height="28" rx="3"/><path d="M5 17h38M5 31h38"/><path d="M10 10v7M18 10v7M26 10v7M34 10v7M10 31v7M18 31v7M26 31v7M34 31v7"/><path d="M21 21v6l5-3z"/>',

  soviet:    '<rect x="4" y="9" width="18" height="26" rx="1.5"/><rect x="26" y="14" width="18" height="26" rx="1.5"/><path d="M7 13h2M7 19h2M7 25h2M7 31h2M17 13h2M17 19h2M17 25h2M17 31h2"/><path d="M24 4v40"/>',
  found:     '<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="3"/><circle cx="24" cy="13" r="4"/><circle cx="24" cy="35" r="4"/><circle cx="13" cy="24" r="4"/><circle cx="35" cy="24" r="4"/><path d="M41 24h5"/>',
  nflfilms:  '<ellipse cx="29" cy="22" rx="14" ry="8.5" transform="rotate(-25 29 22)"/><path d="M24 22.5l10-4.6"/><path d="M26 19l1.6 3.4M29.2 17.6l1.6 3.4M32.2 16.2l1.6 3.4"/><path d="M3 31h10M6 37h11M4 25h7"/>',
  vidding:   '<rect x="6" y="8" width="36" height="13" rx="2"/><rect x="6" y="27" width="36" height="13" rx="2"/><path d="M11 14.5h16M11 33.5h16"/><circle cx="35" cy="14.5" r="2"/><circle cx="35" cy="33.5" r="2"/><path d="M24 21v6"/>',
  mtv:       '<rect x="6" y="15" width="36" height="26" rx="5"/><rect x="10" y="19" width="23" height="18" rx="3"/><path d="M24 15L16 6M24 15l8-9"/><circle cx="37.5" cy="23" r="1.5"/><circle cx="37.5" cy="30" r="1.5"/>',
  amv:       '<rect x="3" y="14" width="36" height="24" rx="2"/><circle cx="14" cy="26" r="4"/><circle cx="28" cy="26" r="4"/><path d="M18 26h6M9 33h24"/><path d="M42 3v9M37.5 7.5h9"/>',
  rocky:     '<path d="M13 32V19a9 9 0 0 1 9-9h8a8 8 0 0 1 8 8v6a8 8 0 0 1-8 8H13z"/><path d="M22 18h8a4 4 0 0 1 0 8h-6"/><rect x="12" y="32" width="20" height="7" rx="1.5"/>',
  wwe:       '<path d="M2 20h11M35 20h11M2 30h11M35 30h11"/><path d="M13 15l11-5 11 5v20l-11 5-11-5z"/><circle cx="24" cy="25" r="5.5"/>',
  mixtape:   '<circle cx="24" cy="24" r="16"/><path d="M8 24h32M24 8v32"/><path d="M13 12.5c5 5 5 18 0 23M35 12.5c-5 5-5 18 0 23"/>',
  platforms: '<rect x="5" y="9" width="38" height="30" rx="3"/><path d="M5 16h38"/><circle cx="10" cy="12.5" r="1"/><circle cx="14.5" cy="12.5" r="1"/><path d="M20.5 21.5v12l10-6z"/>',
  vine:      '<path d="M37 17a14 14 0 1 0 2 12"/><path d="M38 8v9h-9"/><text x="23" y="30" text-anchor="middle" font-size="13" font-family="VT323, monospace">6s</text>',
  fancam:    '<rect x="14" y="5" width="20" height="38" rx="3"/><path d="M18 14v-3h3M30 14v-3h-3M18 30v3h3M30 30v3h-3"/><circle cx="24" cy="18.5" r="3"/><path d="M19 28c1-4.5 9-4.5 10 0"/>',
  videoessay:'<rect x="4" y="8" width="26" height="19" rx="2"/><path d="M9 14h9M9 19h14"/><circle cx="29" cy="28" r="9"/><path d="M35.5 34.5L44 43"/>',
  leagues:   '<rect x="5" y="14" width="26" height="17" rx="2"/><path d="M31 19l10-5v17l-10-5"/><circle cx="11" cy="19.5" r="1.8"/><path d="M18 31l-7 12M18 31l7 12M18 31v12"/>',
  tiktok:    '<rect x="5" y="11" width="20" height="6" rx="1.5"/><rect x="13" y="21" width="28" height="6" rx="1.5"/><rect x="5" y="31" width="15" height="6" rx="1.5"/><path d="M31 6v37"/><path d="M27 5h8l-4 4.5z"/>',
  aura:      '<path d="M4 29c6-9 14-12 20-12s14 3 20 12c-6 9-14 12-20 12S10 38 4 29z"/><circle cx="24" cy="29" r="5.5"/><path d="M24 3v7M12 7l3.5 5.5M36 7l-3.5 5.5M4 14l6 3M44 14l-6 3"/>',
  stan:      '<circle cx="24" cy="16" r="10"/><circle cx="24" cy="16" r="4"/><path d="M20 26h8l-1 17h-6z"/><path d="M41 5v7M37.5 8.5h7M7 29v6M4 32h6"/>',
  uma:       'horsegirl-front',
  // the earlier front-facing horse girl, with a flowing tail
  'horsegirl-front': '<path d="M17.4 15.6C14.4 12.6 12 8.8 11 4.2c3.8.6 7.4 3.6 9.6 8.2"/><path d="M14.4 9.2l2.4 3.4"/><path d="M30.6 15.6c3-3 5.4-6.8 6.4-11.4-3.8.6-7.4 3.6-9.6 8.2"/><path d="M33.6 9.2l-2.4 3.4"/><circle cx="24" cy="24.5" r="10.2"/><path d="M14.2 22c3.6-.2 6.6-2.6 7.8-6.6M25 14.6c.8 3.8 4.4 6.8 8.8 7.2"/><path d="M23.4 14.3c-.6 2.8-.2 5.4 1.2 7.6"/><path d="M19.6 26.2v1.9M28.4 26.2v1.9"/><path d="M22.6 31.2c.9.6 1.9.6 2.8 0"/><path d="M14.4 29c-.8 5.2-2 9.2-4.6 12.4M33.6 29c.8 5.2 2 9.2 4.6 12.4"/><path d="M16.6 42.4c2.2-3.4 4.6-4.6 7.4-4.6s5.2 1.2 7.4 4.6"/><path d="M36.2 36.8c5.2-.4 8.4-4.8 8.2-11.4M37.4 39.6c5.6-.8 8.8-5.6 8.4-12.4M38.4 42.6c4.8-1.4 7.4-5.2 7.6-9.6"/>',
  // the proposed modification of the horse girl from the side profile
  'horsegirl-side' : '<path d="M20.6 11.8c-2-2.2-3.8-4.6-4.8-7.6 3.6.2 6.6 2.2 8.4 5.6"/><path d="M18.2 6.4l3.2 3.4"/><path d="M24.8 9.8c-.8-2.8-.8-5.2-.2-7.6 2.6 1.4 4.2 4.2 4.2 7.7"/><path d="M25.6 4.8l.6 4"/><path d="M27.5 9.8c4.5.2 7.9 3.2 8.5 7.4l2.8 5-2.4 1.2c.5 1 .3 1.9-.5 2.4.6 1.1.3 2.4-.9 3.1-1.6 1.1-4 1.5-6.2 1.3"/><path d="M30.2 30.2c-.2 3.4.4 6.4 1.8 9.4"/><path d="M27.5 9.8c-7.9-.6-13.5 4.8-13.5 12.8 0 7.6-2.2 13.8-6.4 19 6.4 1.2 12.8.2 17.8-3"/><path d="M25.2 14.6c-3 4.4-2.8 10.8 1 15.6"/><path d="M19 17c-1.4 8-1.8 15-5.4 21.6"/><path d="M27.5 9.8c3.5 1.8 5.5 4.4 5.7 7.6"/><path d="M31.4 19.8c1-.5 2.1-.5 2.9.3"/>'
};
// Aliases: extra names that reuse an existing drawing.
window.EDIT_ICONS.uma = window.EDIT_ICONS["horsegirl-front"];
window.EDIT_ICONS.horsegirl = window.EDIT_ICONS.uma;

