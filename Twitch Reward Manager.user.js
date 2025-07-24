// ==UserScript==
// @name         Twitch Reward Manager
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Overlay to manage Twitch reward rejection by username and/or badges, triggered by a button, with smooth dragging and "minimize" functionality.
// @author       themegaxandy
// @match        https://www.twitch.tv/popout/*/reward-queue*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-idle
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitch.tv
// ==/UserScript==

(function() {
    'use strict';

    // --- IMPORTANT NOTICE ---
    // This script directly interacts with the Twitch interface.
    // Automation may violate Twitch's Terms of Service. Use at your own risk.
    // CSS selectors are critical and need to be verified and updated regularly.
    // --- END OF NOTICE ---

    // --- CSS Styles ---
    GM_addStyle(`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .twitch-overlay-container {
            font-family: 'Inter', sans-serif;
            position: fixed;
            width: 350px;
            background-color: #1a1a1c; /* Dark background color, similar to Twitch */
            border: 1px solid #333;
            border-radius: 12px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
            z-index: 99999;
            padding: 20px;
            color: #e0e0e0; /* Light text */
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: calc(100vh - 40px);
            overflow-y: auto;
        }

        .twitch-overlay-container.dragging {
            /* cursor: grabbing; Removed, applied only to the header */
        }

        .twitch-overlay-header-area { /* New class for the draggable area */
            font-size: 20px;
            font-weight: 700;
            color: #9147ff; /* Twitch purple color */
            margin: -20px -20px 10px -20px;
            padding: 20px;
            text-align: center;
            cursor: grab; /* The header will be the drag handle */
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
            background-color: #2a2a2c;
            user-select: none; /* Prevents text selection */
            -webkit-user-select: none; /* For WebKit browsers */
            -moz-user-select: none; /* For Firefox */
            -ms-user-select: none; /* For Internet Explorer/Edge */
        }

        .twitch-overlay-header-area.dragging {
            cursor: grabbing;
        }

        .twitch-section-title {
            font-size: 14px;
            font-weight: 600;
            color: #e0e0e0;
            margin-bottom: 5px;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
        }

        /* Specific adjustment for "Activity Log" title */
        .twitch-section-title.log-title {
            margin-top: 20px;
            margin-bottom: 5px;
        }

        .twitch-textarea {
            width: 100%;
            min-height: 100px;
            background-color: #2a2a2c;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 12px;
            color: #e0e0e0;
            font-size: 14px;
            resize: vertical;
            box-sizing: border-box;
        }

        .twitch-button {
            background-color: #9147ff;
            color: white;
            padding: 12px 18px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: background-color 0.2s ease, transform 0.1s ease;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .twitch-button svg {
            margin-left: 8px;
            width: 20px;
            height: 20px;
            fill: currentColor;
        }

        .twitch-button:hover {
            background-color: #772ce8;
            transform: translateY(-1px);
        }

        .twitch-button:active {
            transform: translateY(0);
        }

        .twitch-log-area {
            background-color: #0f0f11;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 10px;
            max-height: 150px;
            overflow-y: auto;
            font-size: 14px;
            color: #bbb;
            white-space: pre-wrap;
            word-break: normal;
            overflow-wrap: break-word;
        }

        .twitch-log-area p {
            margin: 0 0 5px 0;
            line-height: 1.3;
        }

        .twitch-log-area p:last-child {
            margin-bottom: 0;
        }
    `);

    // --- Global Variables ---
    let rejectedUsernames = [];
    let logMessages = [];

    // Variables for dragging the overlay
    let isDragging = false;
    let offsetX, offsetY;
    let overlayElement;
    let headerAreaElement;

    // Variables for smooth dragging animation
    let currentX, currentY;
    let targetX, targetY;
    let animationFrameId;
    const SMOOTHING_FACTOR = 0.15;
    const MIN_DISTANCE_TO_ANIMATE = 0.5;

    // --- Constants ---
    const MAX_LOG_MESSAGES = 50;
    const CLICK_DELAY_MS = 150; // Delay between clicks to prevent rate limiting
    const DEBOUNCE_DELAY_MS = 500; // Delay for auto-saving settings

    // --- CSS SELECTORS (UPDATE ACCORDING TO TWITCH) ---
    // You will need to inspect the Twitch page to find the correct selectors.
    const SELECTORS = {
        rewardItem: '.redemption-list-item__body',
        username: '.redemption-list-item__context > div > span > span > span',
        badge: '.redemption-list-item__context img.chat-badge',
        declineButton: 'button[data-test-selector="reject-button"]'
    };

    // --- Helper Functions ---
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // --- Storage Functions (Tampermonkey API) ---
    function saveSettings() {
        GM_setValue('rejectedUsernames', JSON.stringify(rejectedUsernames));
        if (overlayElement) {
            GM_setValue('overlayPosX', overlayElement.style.left);
            GM_setValue('overlayPosY', overlayElement.style.top);
        }
    }

    const debouncedSaveSettings = debounce(() => {
        saveSettings();
        addLog('Usernames and/or badges saved automatically.');
    }, DEBOUNCE_DELAY_MS);

    function loadSettings() {
        const savedUsernames = GM_getValue('rejectedUsernames', '[]');
        rejectedUsernames = JSON.parse(savedUsernames);

        const savedPosX = GM_getValue('overlayPosX', '20px');
        const savedPosY = GM_getValue('overlayPosY', '20px');

        if (overlayElement) {
            overlayElement.style.left = savedPosX;
            overlayElement.style.top = savedPosY;
            currentX = parseFloat(savedPosX);
            currentY = parseFloat(savedPosY);
        }

        const textarea = document.getElementById('twitch-usernames-textarea');
        if (textarea) {
            textarea.value = rejectedUsernames.join('\n');
        }
        addLog('Settings loaded.');
    }

    function addLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        logMessages.push(`[${timestamp}] ${message}`);
        if (logMessages.length > MAX_LOG_MESSAGES) {
            logMessages.shift();
        }
        renderLog();
    }

    function renderLog() {
        const logArea = document.getElementById('twitch-log-area');
        if (logArea) {
            logArea.innerHTML = logMessages.map(msg => `<p>${msg}</p>`).join('');
            logArea.scrollTop = logArea.scrollHeight;
        }
    }

    // --- Main Reward Check and Reject Function ---
    async function checkAndRejectRewards() {
        addLog('Starting new reward check in the queue.');
        let rejectedCount = 0;
        let foundAndClicked = true;

        while (foundAndClicked) {
            foundAndClicked = false;
            const rewardItems = document.querySelectorAll(SELECTORS.rewardItem);

            if (rewardItems.length === 0) {
                addLog('No rewards found in the queue.');
                break;
            }

            addLog(`Checking ${rewardItems.length} visible rewards...`);

            for (const item of rewardItems) {
                const usernameElement = item.querySelector(SELECTORS.username);
                const declineButton = item.querySelector(SELECTORS.declineButton);

                if (usernameElement && declineButton) {
                    const username = usernameElement.textContent.trim();
                    let shouldReject = false;
                    let rejectReason = '';

                    // 1. Check by username
                    if (rejectedUsernames.includes(username)) {
                        shouldReject = true;
                        rejectReason = `username: @${username}`;
                    }

                    // 2. If not rejected by username, check by badge
                    if (!shouldReject) {
                        const badgeElements = item.querySelectorAll(SELECTORS.badge);
                        for (const badgeImg of badgeElements) {
                            const badgeAlt = badgeImg.alt;
                            if (badgeAlt) {
                                const formattedBadge = `<${badgeAlt}>`;
                                if (rejectedUsernames.includes(formattedBadge)) {
                                    shouldReject = true;
                                    rejectReason = `badge: ${formattedBadge} (user: @${username})`;
                                    break;
                                }
                            }
                        }
                    }

                    if (shouldReject) {
                        try {
                            declineButton.click();
                            rejectedCount++;
                            addLog(`Reward successfully rejected for ${rejectReason}.`);
                            await delay(CLICK_DELAY_MS);
                            foundAndClicked = true;
                            break;
                        } catch (e) {
                            addLog(`Error clicking reject button for ${rejectReason}: ${e.message}`);
                            foundAndClicked = false;
                            break;
                        }
                    }
                }
            }
        }

        if (rejectedCount === 0) {
            addLog('No pending rewards to reject in this check.');
        } else {
            addLog(`Total of ${rejectedCount} rewards rejected in this session.`);
        }
    }

    // --- Overlay Dragging Functions ---
    function startDragging(e) {
        e.preventDefault();
        isDragging = true;
        overlayElement.classList.add('dragging');

        const rect = overlayElement.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        targetX = rect.left;
        targetY = rect.top;

        animateOverlay();

        document.addEventListener('mousemove', onDragging);
        document.addEventListener('mouseup', stopDragging);
    }

    function onDragging(e) {
        if (!isDragging) return;

        let newTargetX = e.clientX - offsetX;
        let newTargetY = e.clientY - offsetY;

        const maxX = window.innerWidth - overlayElement.offsetWidth;
        const dragAreaHeight = headerAreaElement.offsetHeight;
        const maxY = window.innerHeight - dragAreaHeight;

        targetX = Math.max(0, Math.min(newTargetX, maxX));
        targetY = Math.max(0, Math.min(newTargetY, maxY));
    }

    function animateOverlay() {
        if (!overlayElement) return;

        currentX += (targetX - currentX) * SMOOTHING_FACTOR;
        currentY += (targetY - currentY) * SMOOTHING_FACTOR;

        overlayElement.style.left = `${currentX}px`;
        overlayElement.style.top = `${currentY}px`;

        if (isDragging || Math.abs(targetX - currentX) > MIN_DISTANCE_TO_ANIMATE || Math.abs(targetY - currentY) > MIN_DISTANCE_TO_ANIMATE) {
            animationFrameId = requestAnimationFrame(animateOverlay);
        } else {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            overlayElement.style.left = `${targetX}px`;
            overlayElement.style.top = `${targetY}px`;
        }
    }

    function stopDragging() {
        isDragging = false;
        overlayElement.classList.remove('dragging');

        document.removeEventListener('mousemove', onDragging);
        document.removeEventListener('mouseup', stopDragging);

        saveSettings();
    }

    // --- Overlay HTML Injection ---
    function createOverlay() {
        overlayElement = document.createElement('div');
        overlayElement.id = 'twitch-reward-overlay';
        overlayElement.className = 'twitch-overlay-container';
        overlayElement.innerHTML = `
            <div class="twitch-overlay-header-area">
                Reward Manager
            </div>

            <div class="twitch-section-title">Usernames and/or Badges to Reject</div>
            <textarea id="twitch-usernames-textarea" class="twitch-textarea" placeholder="Enter one username per line (e.g., froppymaster1) or a badge like <Moderator>"></textarea>

            <button id="twitch-reject-now-button" class="twitch-button">
                Reject Rewards Now
                <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 17L15 12L10 7V17Z"/>
                </svg>
            </button>

            <div class="twitch-section-title log-title">Activity Log</div>
            <div id="twitch-log-area" class="twitch-log-area">
                <!-- Log messages will be injected here -->
            </div>
        `;
        document.body.appendChild(overlayElement);

        headerAreaElement = overlayElement.querySelector('.twitch-overlay-header-area');

        const usernamesTextarea = document.getElementById('twitch-usernames-textarea');
        usernamesTextarea.addEventListener('input', () => {
            rejectedUsernames = usernamesTextarea.value.split('\n')
                                                    .map(name => name.trim())
                                                    .filter(name => name !== '');
            debouncedSaveSettings();
        });

        document.getElementById('twitch-reject-now-button').addEventListener('click', () => {
            checkAndRejectRewards();
        });

        headerAreaElement.addEventListener('mousedown', startDragging);
    }

    // --- Script Initialization ---
    function init() {
        createOverlay();
        loadSettings();
        addLog('Reward rejection script loaded. Drag the overlay by its header.');
        addLog('Please verify and update CSS selectors if the script does not work.');
        addLog(`A delay of ${CLICK_DELAY_MS}ms is applied between clicks to prevent rate limiting.`);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
