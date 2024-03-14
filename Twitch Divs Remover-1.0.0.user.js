// ==UserScript==
// @name         Twitch Divs Remover
// @author       themegaxandy
// @description  Twitch Divs Remover
// @version      1.0.0
// @updateURL    https://github.com/themegaxandy/twscripts/raw/main/Twitch%20Divs%20Remover-1.0.0.user.js
// @downloadURL  https://github.com/themegaxandy/twscripts/raw/main/Twitch%20Divs%20Remover-1.0.0.user.js
// @match        *://www.twitch.tv/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // Verifica se MutationObserver está disponível
    let MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    if (MutationObserver) console.log('[Twitch Divs Remover] Observer iniciado!');

    let selectors = [
        "#live-page-chat > div > div > .chat-shell__expanded > div > div > section > div > div[class='Layout-sc-1xcs6mc-0']",
        "#live-page-chat > div > div > .chat-shell__expanded > div > div > section > div > .chat-input > div:nth-child(2) > div.InjectLayout-sc-1i43xsx-0 > .tray-highlight > div > div[class='Layout-sc-1xcs6mc-0']",
        "#live-page-chat > div > div > .chat-shell__expanded > div > div > div[class*='stream-chat-header']"
    ];

    // Função para remover as divs especificadas
    function removeDivs() {
        selectors.forEach((selector, index) => {
            if (document.querySelector(selector)) {
                document.querySelector(selector).remove();
                console.log(`[Twitch Divs Remover] Div${index + 1} removida: ${selector}`);
            }
        });
    }

    // Configura MutationObserver para a primeira execução
    let observer = new MutationObserver(() => {
        console.log('[Twitch Divs Remover] Mutação detectada!');
        removeDivs();
    });

    setTimeout(function() {
        removeDivs()
    }, 10000);

    setInterval(function() {
        removeDivs()
    }, 60000);

})();
