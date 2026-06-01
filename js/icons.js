// ============================================================
//  Rise and Shine - Inline Pixel SVG Icons
// ============================================================

window.PixelIcons = (() => {
  const paths = {
    heart: 'M2 5v5h2v2h2v2h2v2h2v2h4v-2h2v-2h2v-2h2v-2h2V5h-4v2h-2V5h-8v2H8V5H2zm2 2h2v2H4V7zm4 0h2v2H8V7zm6 2h-2V7h2v2zm4-2h2v2h-2V7z',
    sword: 'M19 3h2v2h-2V3zm-2 2h2v2h-2V5zm-2 2h2v2h-2V7zm-2 2h2v2h-2V9zm-2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2 2h2v2H7v-2zM5 17h2v2H5v-2zm-2 2h2v2H3v-2zm0-2h2v2H3v-2zm2-2h2v2H5v-2zm2-2h2v2H7v-2zm8 8h2v2h-2v-2zm-2-2h2v2h-2v-2zm-2-2h2v2h-2v-2zm-2-2h2v2h-2v-2z',
    gear: 'M10 2h4v2h-4V2zm-4 4h2v2H6V6zm12 0h-2v2h2V6zm-2 6h2v2h-2v-2zm-8 0H6v2h2v-2zm2 6h4v2h-4v-2zm-4-4v-4h2v4H6zm10 0v-4h-2v4h2z',
    lock: 'M8 4h8v4h2v12H6V8h2V4zm2 4h4V6h-4v2zm-2 4v6h8v-6H8zm2 2h4v2h-4v-2z',
    chevronLeft: 'M14 6h2v12h-2v-2h-2v-2h-2v-2h2V8h2V6z',
    chevronRight: 'M10 6h-2v12h2v-2h2v-2h2v-2h-2V8h-2V6z',
    warning: 'M12 2l10 18H2L12 2zm-1 5v6h2V7h-2zm0 8v2h2v-2h-2z',
    crate: 'M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8z',
    flag: 'M4 2h2v20H4V2zm2 2h14v10H6V4zm2 2v2h4V6H8zm6 0v2h4V6h-4zm-6 4v2h4v-2H8zm6 0v2h4v-2h-4z',
    lightning: 'M11 2h2v6h4v2h-2v-2h-2v-2h-2V2zm0 8h2v2h2v-2h-2v-2h-2v2zm0 4h2v6h-2v-6z',
    close: 'M5 5h2v2H5V5zm2 2h2v2H7V7zm2 2h2v2H9V9zm4 0h2v2h-2V9zm2-2h2v2h-2V7zm2-2h2v2h-2V5zm-2 6h-2v2h2v-2zm-4 2h2v2h-2v-2zm-2 2H7v2h2v-2zm-2 2H5v2h2v-2zm8 0h2v2h-2v-2zm2-2h2v2h-2v-2z',
    sliders: 'M4 5h10v2H4V5zm12 0h4v2h-4V5zM4 11h4v2H4v-2zm6 0h10v2H10v-2zM4 17h12v2H4v-2zm14 0h2v2h-2v-2zM14 3h2v6h-2V3zM8 9h2v6H8V9zm8 6h2v6h-2v-6z',
    page: 'M5 2h10v2h2v2h2v16H5V2zm2 2v16h10V8h-4V4H7zm2 8h6v2H9v-2zm0 4h6v2H9v-2z',
    screen: 'M3 4h18v12H3V4zm2 2v8h14V6H5zm4 12h6v2H9v-2z',
    antenna: 'M11 2h2v4h-2V2zm-5 6h12v2H6V8zm2 4h8v2H8v-2zm3 4h2v4h-2v-4zm-5 4h12v2H6v-2z',
    bug: 'M8 6h8v2H8V6zm-2 4h12v2H6v-2zm0 4h12v2H6v-2zm2 4h8v2H8v-2zm-4-8h2v10H4V10zm14 0h2v10h-2V10z',
    shield: 'M4 4h16v6h-2v4h-2v4h-2v2h-2v-2h-2v-4H6v-4H4V4zm2 2v4h2v4h2v2h4v-2h2v-4h2V6H6z',
    circle: 'M9 4h6v2H9V4zm-4 4h14v2H5V8zm-2 4h18v2H3v-2zm2 4h14v2H5v-2zm4 4h6v2H9v-2z',
    fire: 'M11 2h2v4h-2V2zm-3 6h6v2H8V8zm-2 4h10v2H6v-2zm-2 4h14v2H4v-2zm4 4h8v2H8v-2z',
    key: 'M10 4h4v6h-4V4zm-2 2h8v2H8V6zm6 6h2v6h-2v-6zm-2 2h2v2h-2v-2zm0 4h4v2h-4v-2zm-3-4h3v2h-3v-2zm0-4h3v2h-3v-2z',
    water: 'M11 4h2v2h-2V4zm-2 8h6v2H9V8zm-2 4h10v2H7v-2zm-2 4h14v2H5v-2zm2 4h10v2H7v-2z',
    moon: 'M9 4h6v2H9V4zm-4 4h14v2H5V8zm-2 4h18v2H3v-2zm2 4h14v2H5v-2zm4 4h6v2H9v-2z',
    dice: 'M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h2v2H8V8zm6 0h2v2h-2V8zm-3 3h2v2h-2v-2zm-3 3h2v2H8v-2zm6 0h2v2h-2v-2z',
    star: 'M11 2h2v3h-2V2zm-2 3h6v2H9V5zm-5 4h14v2H4V9zm-2 2h18v2H2v-1zm4 3h12v2H6v-2zm2 2h8v2H8v-2zm3 2h2v2h-2v-2z',
    bulb: 'M9 4h6v2H9V4zm-3 4h12v2H6V8zm-2 4h14v2H4v-2zm2 4h10v2H6v-2zm5 4h2v2h-2v-2z',
  };

  function icon(name, className = 'w-5 h-5 inline-block align-middle fill-current') {
    const path = paths[name];
    if (!path) return '';
    return `<svg class="${className}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${path}"/></svg>`;
  }

  return { icon };
})();
