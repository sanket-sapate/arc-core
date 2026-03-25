(function () {
    // 1. Get Configuration from Global Object
    var config = window.ArcCMP;
    if (!config || !config.id) {
        console.error("ArcCMP: Configuration missing. Please define window.ArcCMP with an 'id'.");
        return;
    }

    var baseUrl = config.cdn || window.location.origin;
    // Remove trailing slash if present
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    // 2. Helper to load scripts
    function loadScript(src, callback) {
        var script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = callback;
        script.onerror = function () { console.error("ArcCMP: Failed to load script " + src); };
        document.head.appendChild(script);
    }

    // 3. Load Core SDK and Initialize
    var coreUrl = baseUrl + '/sdk/cmp-core.js';

    loadScript(coreUrl, function () {
        if (window.CC) {
            window.CC.init({
                apiKey: config.id, // The Consent Form ID
                apiUrl: baseUrl,   // The backend URL (e.g. https://app.archawk.com)
                uiUrl: baseUrl + '/sdk/cmp-ui.js',
                cssUrl: baseUrl + '/sdk/cmp-ui.css',
                containerId: 'arc-cmp-container',
                autoMount: true
            });
            console.log("ArcCMP: Initialized");
        } else {
            console.error("ArcCMP: Core SDK loaded but window.CC is not defined.");
        }
    });

})();
