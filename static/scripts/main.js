var _gaq = [
    ['_setAccount', 'UA-26535645-1'],
    ['_trackPageview']
], _gauges = window._gauges || [];

(function () {
    'use strict';
    var script;

    // Google Analytics
    script = document.createElement('script');
    script.async = true;
    script.src = (/^https/.test(window.location) ? '//ssl' : '//www') +
        '.google-analytics.com/ga.js';
    document.body.appendChild(script);

    // Gauges
    script = document.createElement('script');
    script.async = true;
    script.id = 'gauges-tracker';
    script.src = '//secure.gaug.es/track.js';
    script.setAttribute('data-site-id', '527149ff108d7b4f0b000055');
    document.body.appendChild(script);
}());
