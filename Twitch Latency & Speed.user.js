// ==UserScript==
// @name         Twitch Latency & Speed
// @author       themegaxandy
// @description  Enhance your Twitch experience with live speed control and latency overlay
// @version      1.0.2
// @updateURL    https://github.com/themegaxandy/twscripts/raw/main/Twitch%20Latency%20&%20Speed.user.js
// @downloadURL  https://github.com/themegaxandy/twscripts/raw/main/Twitch%20Latency%20&%20Speed.user.js
// @match        *://www.twitch.tv/*
// @exclude      *://www.twitch.tv/videos/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Latency Overlay
    setInterval(function() {
        // console.log('[Latency Overlay] Checking overlay...')

        // Check if the <p> element is still in the right control group
        let pBuffer = document.querySelector(".video-ref .player-controls__right-control-group > p[aria-label='Tamanho do buffer']");
        let isChannelLive = document.querySelector(".top-bar--pointer-enabled > div > div.tw-channel-status-text-indicator");

        // If pBuffer is not present and the channel is live, call the moveFramerate function, otherwise delete pBuffer if it exists
        !pBuffer && isChannelLive ? moveFramerate() : (pBuffer && !isChannelLive ? document.querySelector('.player-controls__right-control-group > p[aria-label="Tamanho do buffer"]').remove(): null);
    }, 10000);

    // Sets a function that moves the frame rate to the right control group
    function moveFramerate() {
        // Click on the settings button
        document.querySelector("button[data-a-target='player-settings-button']").click();

        // Wait 1 second before continuing
        setTimeout(function() {
            // Click on the 'Advanced' menu item
            document.querySelector("button[data-a-target='player-settings-menu-item-advanced']").click();

            // Wait 1 second before continuing
            setTimeout(function() {
                // Clique no primeiro elemento no submenu 'Advanced Video Stats'
                document.querySelector("div[data-a-target='player-settings-submenu-advanced-video-stats'] input").click();

                // Wait 1 second before continuing
                setTimeout(function() {
                    // Check if 'player-overlay-video-stats' element is present after first click
                    var overlayStats = document.querySelector("div[data-a-target='player-overlay-video-stats']");

                    if (!overlayStats) {
                        // Remove elements from the right control group
                        var elements = document.querySelectorAll(".player-controls__right-control-group > p");

                        elements.forEach(function(element) {
                            element.parentNode.removeChild(element);
                        });

                        // If the 'player-overlay-video-stats' element is not present after the first click, click the first element again
                        document.querySelector("div[data-a-target='player-settings-submenu-advanced-video-stats'] input").click();
                    }

                    // Wait 1 second before continuing
                    setTimeout(function() {
                        // Hide the 'player-overlay-video-stats' element if present
                        var overlayStats = document.querySelector("div[data-a-target='player-overlay-video-stats']");

                        if (overlayStats) {
                            overlayStats.style.display = "none";
                        }

                        // Move the element to the right control group
                        document.querySelector(".player-controls__right-control-group").prepend(document.querySelector("div[data-a-target='player-overlay-video-stats'] > table > tbody > tr:nth-child(5) > td:nth-child(2) > p"));

                        // Click the settings button again
                        document.querySelector("button[data-a-target='player-settings-button']").click();
                    }, 50); // Wait 50ms after the second click
                }, 50); // Wait 50ms after the first click
            }, 50); // Wait 50ms after the second click
        }, 50); // Wait 50ms before the first click
    }

    // Live Speed Control
    // Ratechange events are captured and stopped.
    // It is necessary to replace Twitch's stream speed control with this script.
    // This does cause a problem with changing video speeds when watching vods, though. A bug to be resolved. 
    // Refreshing the vod page works around the problem because of the specified @exclude userscript header.
    document.dispatchEvent(new Event('ratechange'));
    document.addEventListener('ratechange', function (e) {
        e.stopImmediatePropagation();
    }, true, true);

    // Function to check and adjust video speed
    function checkAndAdjustSpeed() {
        const bufferElement = document.querySelector('.player-controls__right-control-group > p[aria-roledescription="video player stat"]');
        if (bufferElement) {
            const seconds = (bufferElement.textContent.match(/(\d+\.\d+)\s*s/) ? parseFloat(bufferElement.textContent.match(/(\d+\.\d+)\s*s/)[1]) : 0);
            const videoElement = document.querySelector('video');

            // Configuration variable to enable/disable the 1 second if block
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
                console.log('[Twitch Live Speed] Speed adjusted to ' + targetPlaybackRate);
            }
        }
    }

    // Checks and adjusts speed every half second
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

    // Over time, the displayed buffer is larger than it actually is, causing lag in the stream.
    // Pausing and unpausing the stream works around the problem, done in the following code:
    setInterval(function() {
        reloadTwitchPlayer(false, true);
    }, 600000); // 600000ms is 10 minutes.
})();
