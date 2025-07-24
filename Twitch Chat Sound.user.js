// ==UserScript==
// @name         Twitch Chat Sound
// @author       themegaxandy
// @description  Make a sound when there is a new chat message
// @version      1.0.4
// @updateURL    https://github.com/themegaxandy/twscripts/raw/main/Twitch%20Chat%20Sound.user.js
// @downloadURL  https://github.com/themegaxandy/twscripts/raw/main/Twitch%20Chat%20Sound.user.js
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
    if (MutationObserver) console.log('[Twitch Chat Sound] Observer started!');

    function playSound() {
        const audio = new Audio('https://freesound.org/data/previews/235/235911_2391840-lq.mp3');

        // Gets 20% of the player volume to be applied to the notification sound
        audio.volume = (20 * localStorage.getItem('volume')) / 100;

        // Listen for the "ended" event and remove the reference
        audio.addEventListener('ended', () => {
            audio.remove();
        });

        // Play the sound
        audio.play();
    }

    // Configures MutationObserver for the first run
    let observer = new MutationObserver(() => {
        // console.log('[Twitch Chat Sound] Mutation detected!');
        playSound();
    });

    // Attach the observer every 30 seconds.
    // For cases where the url is changed, and the observed element is deleted, causing the observer to be detached.
    // There are no problems noted in reattaching an already attached observer.
    setInterval(function() {
        observer.observe(document.querySelector(".chat-scrollable-area__message-container"), { childList: true, subtree: true, characterData: true });
        console.log('[Twitch Chat Sound] Observing .chat-scrollable-area__message-container');
    }, 30000);

})();
