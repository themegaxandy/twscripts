// ==UserScript==
// @name         Twitch Chat Sound
// @author       themegaxandy
// @description  Make a sound when there is a new chat message
// @version      1.0.0
// @updateURL    https://github.com/themegaxandy/twscripts/raw/main/Twitch%20Chat%20Sound-1.0.0.user.js
// @downloadURL  https://github.com/themegaxandy/twscripts/raw/main/Twitch%20Chat%20Sound-1.0.0.user.js
// @match        *://www.twitch.tv/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // Verifica se MutationObserver está disponível
    let MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    if (MutationObserver) console.log('[Twitch Chat Sound] Observer iniciado!');

    function playSound() {
        const audio = new Audio('https://freesound.org/data/previews/235/235911_2391840-lq.mp3');
        audio.volume = localStorage.getItem('volume') / 2;

        // Listen for the "ended" event and remove the reference
        audio.addEventListener('ended', () => {
            audio.remove();
        });

        // Play the sound
        audio.play();
    }

    // Configura MutationObserver para a primeira execução
    let observer = new MutationObserver(() => {
        console.log('[Twitch Chat Sound] Mutação detectada!');
        playSound();
    });

    setInterval(function() {
        observer.observe(document.querySelector(".chat-scrollable-area__message-container"), { childList: true, subtree: true, characterData: true });
        console.log('[Twitch Chat Sound] Observando .chat-scrollable-area__message-container');
    }, 30000);

})();
