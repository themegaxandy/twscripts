// ==UserScript==
// @name         Twitch Divs Remover
// @author       themegaxandy
// @description  Twitch Divs Remover
// @version      1.0.7
// @updateURL    https://github.com/themegaxandy/twscripts/raw/main/Twitch%20Divs%20Remover.user.js
// @downloadURL  https://github.com/themegaxandy/twscripts/raw/main/Twitch%20Divs%20Remover.user.js
// @match        *://www.twitch.tv/*
// @exclude      *://www.twitch.tv/popout/*/reward-queue
// @grant        none
// @run-at       document-end
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitch.tv
// ==/UserScript==

(function () {
    'use strict';

    // Checks if MutationObserver is available
    let MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    if (MutationObserver) console.log('[Twitch Divs Remover] Observer iniciado!');

    let selectors = [
        /* Remove subs and bits leaderboard div */
        "section[class*='chat-room'] > div > div:has(.marquee-animation)",
        "section[class*='chat-room'] > div > div:has(.channel-leaderboard-header-rotating__users)",
        /* Remove the "Shield Mode is On" div (moderators only) */
        "div[class*='tray-highlight']",
        /* Remove the stream chat header div */
        "div[class*='stream-chat-header']"
    ];

    // Function to remove the specified divs
    function removeDivs() {
        selectors.forEach((selector, index) => {
            if (document.querySelector(selector)) {
                document.querySelector(selector).remove();
                console.log(`[Twitch Divs Remover] Div${index + 1} removida: ${selector}`);
            }
        });
    }

    // Configures MutationObserver for the first run
    let observer = new MutationObserver(() => {
        console.log('[Twitch Divs Remover] Mutação detectada!');
        removeDivs();
    });

    // Wait 10 seconds to remove the divs, as not all elements were actually loaded after the page loaded status
    setTimeout(function() {
        removeDivs()
    }, 10000);

    // Searches and removes elements again every minute if they exist.
    // For cases where the url is changed, where elements are created again.
    setInterval(function() {
        removeDivs()
    }, 60000);

})();
