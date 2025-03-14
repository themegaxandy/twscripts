// ==UserScript==
// @name         Twitch Latency & Speed
// @author       themegaxandy
// @description  Enhance your Twitch experience with live speed control and latency overlay
// @version      1.1.5
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
    function checkOverlay() {
        // console.log('[Latency Overlay] Checking overlay...')

        // Check if the <p> element is still in the right control group
        let pBuffer = document.querySelector('.video-ref .player-controls__right-control-group > p[aria-roledescription="video player stat"]');
        let isChannelLive = document.querySelector(".top-bar--pointer-enabled > div > div.tw-channel-status-text-indicator");

        // If pBuffer is not present and the channel is live, call the moveFramerate function, otherwise delete pBuffer if it exists
        !pBuffer && isChannelLive ? moveFramerate() : (pBuffer && !isChannelLive ? pBuffer.remove(): null);
    }

    // Run for the first time after 10 seconds after the page loads
    setTimeout(checkOverlay, 10000);

    // Run every one and a half minutes, in case the page is changed
    setInterval(checkOverlay, 90000);

    // Sets a function that moves the frame rate to the right control group
    function moveFramerate() {
        // Click on the settings button
        document.querySelector(".video-ref button[data-a-target='player-settings-button']").click();

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
                    var overlayStats = document.querySelector(".video-ref div[data-a-target='player-overlay-video-stats']");

                    if (!overlayStats) {
                        // Remove elements from the right control group
                        var elements = document.querySelectorAll(".video-ref .player-controls__right-control-group > p");

                        elements.forEach(function(element) {
                            element.parentNode.removeChild(element);
                        });

                        // If the 'player-overlay-video-stats' element is not present after the first click, click the first element again
                        document.querySelector("div[data-a-target='player-settings-submenu-advanced-video-stats'] input").click();
                    }

                    // Wait 1 second before continuing
                    setTimeout(function() {
                        // Hide the 'player-overlay-video-stats' element if present
                        var overlayStats = document.querySelector(".video-ref div[data-a-target='player-overlay-video-stats']");

                        if (overlayStats) {
                            overlayStats.style.display = "none";
                        }

                        // Move the element to the right control group
                        document.querySelector(".video-ref .player-controls__right-control-group").prepend(document.querySelector(".video-ref div[data-a-target='player-overlay-video-stats'] > table > tbody > tr:nth-child(8) > td:nth-child(2) > p"));

                        // Click the settings button again
                        document.querySelector(".video-ref button[data-a-target='player-settings-button']").click();
                    }, 500); // Wait 50ms after the second click
                }, 500); // Wait 50ms after the first click
            }, 500); // Wait 50ms after the second click
        }, 500); // Wait 50ms before the first click
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

    let intervalId500ms;

    function startInterval() {
        intervalId500ms = setInterval(checkCondition, 500);
    }

    function checkCondition() {
        // Replace this with your actual condition
        let result = checkAndAdjustSpeed();

        if (result === 1) {
            clearInterval(intervalId500ms);
            console.log('[Twitch Live Speed] Latency adjusted, waiting for 60 seconds...');

            setTimeout(() => {
                console.log('[Twitch Live Speed] 60 seconds passed, checking latency...');
                startInterval();
            }, 60000); // 60 seconds
        }
    }

    function checkAndAdjustSpeed() {
        const pBuffer = document.querySelector('.player-controls__right-control-group > p[aria-roledescription="video player stat"]');
        const videoElement = document.querySelector('video');
        let targetPlaybackRate;

        if (videoElement.readyState < 4) {return 1};

        if (pBuffer) {
            const seconds = parseFloat(pBuffer.textContent);

            if (seconds >= 3) {
                targetPlaybackRate = 2.0;
            } else if (seconds >= 1.5) {
                targetPlaybackRate = 1.25;
            } else if (seconds < 0) {
                pBuffer.remove()
                targetPlaybackRate = 1.0;
            } else {
                targetPlaybackRate = 1.0;
            }
        } else {
            targetPlaybackRate = 1.0;
        }

        if (videoElement.playbackRate !== targetPlaybackRate) {
            videoElement.playbackRate = targetPlaybackRate;
            console.log('[Twitch Live Speed] Speed adjusted to ' + targetPlaybackRate);
        }

        return targetPlaybackRate;

    }

    // Start the first interval
    startInterval();

})();
