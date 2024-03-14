// ==UserScript==
// @name         Twitch Latency & Speed
// @author       themegaxandy
// @description  Enhance your Twitch experience with live speed control and latency overlay
// @version      1.0.0
// @updateURL    https://github.com/themegaxandy/twscripts/raw/main/Twitch%20Latency%20&%20Speed-1.0.0.user.js
// @downloadURL  https://github.com/themegaxandy/twscripts/raw/main/Twitch%20Latency%20&%20Speed-1.0.0.user.js
// @match        *://www.twitch.tv/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Latency Overlay
    setInterval(function() {
        // console.log('[Latency Overlay] Verificando overlay...')

        // Verifique se o elemento <p> ainda está no grupo de controle à direita
        let pBuffer = document.querySelector(".video-ref .player-controls__right-control-group > p[aria-label='Tamanho do buffer']");
        let isChannelLive = document.querySelector(".top-bar--pointer-enabled > div > div.tw-channel-status-text-indicator");

        // Se o pBuffer não estiver presente e o canal estiver em live, chame a função moveFramerate, caso contrário apague pBuffer se existir.
        !pBuffer && isChannelLive ? moveFramerate() : (pBuffer && !isChannelLive ? document.querySelector('.player-controls__right-control-group > p[aria-label="Tamanho do buffer"]').remove(): null);
    }, 10000);

    // Define uma função que move a taxa de quadros para o grupo de controle à direita
    function moveFramerate() {
        // Clique no botão de configurações
        document.querySelector("button[data-a-target='player-settings-button']").click();

        // Espere 1 segundo antes de continuar
        setTimeout(function() {
            // Clique no item de menu 'Advanced'
            document.querySelector("button[data-a-target='player-settings-menu-item-advanced']").click();

            // Espere 1 segundo antes de continuar
            setTimeout(function() {
                // Clique no primeiro elemento no submenu 'Advanced Video Stats'
                document.querySelector("div[data-a-target='player-settings-submenu-advanced-video-stats'] input").click();

                // Espere 1 segundo antes de continuar
                setTimeout(function() {
                    // Verifique se o elemento 'player-overlay-video-stats' está presente após o primeiro clique
                    var overlayStats = document.querySelector("div[data-a-target='player-overlay-video-stats']");

                    if (!overlayStats) {
                        // Remova elementos do grupo de controle à direita
                        var elements = document.querySelectorAll(".player-controls__right-control-group > p");

                        elements.forEach(function(element) {
                            element.parentNode.removeChild(element);
                        });

                        // Se o elemento 'player-overlay-video-stats' não estiver presente após o primeiro clique, clique novamente no primeiro elemento
                        document.querySelector("div[data-a-target='player-settings-submenu-advanced-video-stats'] input").click();
                    }

                    // Espere 1 segundo antes de continuar
                    setTimeout(function() {
                        // Esconda o elemento 'player-overlay-video-stats' se estiver presente
                        var overlayStats = document.querySelector("div[data-a-target='player-overlay-video-stats']");

                        if (overlayStats) {
                            overlayStats.style.display = "none";
                        }

                        // Mova o elemento para o grupo de controle à direita
                        document.querySelector(".player-controls__right-control-group").prepend(document.querySelector("div[data-a-target='player-overlay-video-stats'] > table > tbody > tr:nth-child(5) > td:nth-child(2) > p"));

                        // Clique novamente no botão de configurações
                        document.querySelector("button[data-a-target='player-settings-button']").click();
                    }, 50); // Espere 50ms após o segundo clique
                }, 50); // Espere 50ms após o primeiro clique
            }, 50); // Espere 50ms após o terceiro clique
        }, 50); // Espere 50ms antes do primeiro clique
    }

    // Live Speed Control
    // Eventos de ratechange são capturados e interrompidos
    document.dispatchEvent(new Event('ratechange'));
    document.addEventListener('ratechange', function (e) {
        e.stopImmediatePropagation();
    }, true, true);

    // Função para verificar e ajustar a velocidade do vídeo
    function checkAndAdjustSpeed() {
        const bufferElement = document.querySelector('.player-controls__right-control-group > p[aria-roledescription="video player stat"]');
        if (bufferElement) {
            const seconds = (bufferElement.textContent.match(/(\d+\.\d+)\s*s/) ? parseFloat(bufferElement.textContent.match(/(\d+\.\d+)\s*s/)[1]) : 0);
            const videoElement = document.querySelector('video');

            // Variável de configuração para habilitar/desabilitar o bloco if de 1 segundo
            let enableBlock1Second = false;

            // console.log(`[Twitch Live Speed] videoElement.playbackRate`, videoElement.playbackRate, 'seconds', seconds);
            let targetPlaybackRate;
            if (seconds >= 3) {
                targetPlaybackRate = 2.0;
            } else if (seconds >= 1.5) {
                targetPlaybackRate = enableBlock1Second ? 1.5 : 1.25;
            } else if (enableBlock1Second && seconds >= 1.1) {
                targetPlaybackRate = 1.25;
            } else {
                targetPlaybackRate = 1.0;
            }

            if (videoElement.playbackRate !== targetPlaybackRate) {
                videoElement.playbackRate = targetPlaybackRate;
                console.log('[Twitch Live Speed] Velocidade ajustada para ' + targetPlaybackRate);
            }
        }
    }

    // Verifica e ajusta a velocidade a cada meio segundo
    setInterval(function() {
        checkAndAdjustSpeed();
    }, 500);

    function reloadTwitchPlayer(isSeek, isPausePlay) {
        // Taken from ttv-tools / ffz
        // https://github.com/Nerixyz/ttv-tools/blob/master/src/context/twitch-player.ts
        // https://github.com/FrankerFaceZ/FrankerFaceZ/blob/master/src/sites/twitch-twilight/modules/player.jsx
        function findReactNode(root, constraint) {
            if (root.stateNode && constraint(root.stateNode)) {
                return root.stateNode;
            }
            let node = root.child;
            while (node) {
                const result = findReactNode(node, constraint);
                if (result) {
                    return result;
                }
                node = node.sibling;
            }
            return null;
        }
        var reactRootNode = null;
        var rootNode = document.querySelector('#root');
        if (rootNode && rootNode._reactRootContainer && rootNode._reactRootContainer._internalRoot && rootNode._reactRootContainer._internalRoot.current) {
            reactRootNode = rootNode._reactRootContainer._internalRoot.current;
        }
        if (!reactRootNode) {
            console.log('Could not find react root');
            return;
        }
        var player = findReactNode(reactRootNode, node => node.setPlayerActive && node.props && node.props.mediaPlayerInstance);
        player = player && player.props && player.props.mediaPlayerInstance ? player.props.mediaPlayerInstance : null;
        var playerState = findReactNode(reactRootNode, node => node.setSrc && node.setInitialPlaybackSettings);
        if (!player) {
            console.log('Could not find player');
            return;
        }
        if (!playerState) {
            console.log('Could not find player state');
            return;
        }
        if (player.paused) {
            return;
        }
        if (isSeek) {
            console.log('Force seek to reset player (hopefully fixing any audio desync) pos:' + player.getPosition() + ' range:' + JSON.stringify(player.getBuffered()));
            var pos = player.getPosition();
            player.seekTo(0);
            player.seekTo(pos);
            return;
        }
        if (isPausePlay) {
            player.pause();
            player.play();
            return;
        }
        const lsKeyQuality = 'video-quality';
        const lsKeyMuted = 'video-muted';
        const lsKeyVolume = 'volume';
        var currentQualityLS = localStorage.getItem(lsKeyQuality);
        var currentMutedLS = localStorage.getItem(lsKeyMuted);
        var currentVolumeLS = localStorage.getItem(lsKeyVolume);
        if (player?.core?.state) {
            localStorage.setItem(lsKeyMuted, JSON.stringify({default:player.core.state.muted}));
            localStorage.setItem(lsKeyVolume, player.core.state.volume);
        }
        if (player?.core?.state?.quality?.group) {
            localStorage.setItem(lsKeyQuality, JSON.stringify({default:player.core.state.quality.group}));
        }
        playerState.setSrc({ isNewMediaPlayerInstance: true, refreshAccessToken: true });
        setTimeout(() => {
            localStorage.setItem(lsKeyQuality, currentQualityLS);
            localStorage.setItem(lsKeyMuted, currentMutedLS);
            localStorage.setItem(lsKeyVolume, currentVolumeLS);
        }, 3000);
    }

    setInterval(function() {
        reloadTwitchPlayer(false, true);
    }, 300000);
})();
