// ==UserScript==
// @name         Naukri Auto "Share Interest" ≤ 5 Yrs Only (Greater than 5 Yrs exp)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Auto-clicks "Share Interest" on Naukri for jobs with experience ≤ 5 Yrs. Includes scroll, timer, and job tracking.
// @author       Mahesh
// @match        https://www.naukri.com/myapply/*
// @match        https://www.naukri.com/mnjuser/recommended-earjobs*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
'use strict';

    console.log("🚀 Naukri Auto Script loaded ✅");

const maxLoops = 5;
const MAX_EXPERIENCE = 5;
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

let loop = parseInt(localStorage.getItem("shareInterestLoop") || "0", 10);

    if (!localStorage.getItem("lastResetTime")) {
        localStorage.setItem("lastResetTime", Date.now().toString());
    }

    let pageHiddenAt = null;

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            pageHiddenAt = Date.now();
        } else {
            const now = Date.now();
        if (pageHiddenAt && now - pageHiddenAt > 180000) { // 3 mins
            console.log(`🔄 Tab was hidden for too long. Reloading...`);
            location.reload();
        } else {
            console.log(`✅ Tab resumed quickly. No reload needed.`);
        }
    }
});


    function maybeClearLocalStorageEveryTwoMinutes() {
        const now = Date.now();
        const lastResetTime = parseInt(localStorage.getItem("lastResetTime") || "0", 10);
        const twoMinutes = 120 * 1000;

        if (now - lastResetTime >= twoMinutes) {
            console.log("🧹 Clearing clickedJobs & shareInterestLoop");
            localStorage.removeItem("clickedJobs");
            localStorage.removeItem("shareInterestLoop");
            localStorage.setItem("lastResetTime", now.toString());
        }
    }

    function startAutoClearCountdown() {
        const label = document.createElement("div");
        label.style.position = "fixed";
        label.style.bottom = "10px";
        label.style.right = "10px";
        label.style.padding = "8px 12px";
        label.style.backgroundColor = "#000000cc";
        label.style.color = "white";
        label.style.fontSize = "14px";
        label.style.fontFamily = "monospace";
        label.style.zIndex = "9999";
        label.style.borderRadius = "8px";
        label.style.boxShadow = "0 0 5px rgba(0,0,0,0.4)";
        document.body.appendChild(label);

        setInterval(() => {
            const now = Date.now();
            const lastReset = parseInt(localStorage.getItem("lastResetTime") || "0", 10);
            const elapsed = now - lastReset;
            const secondsLeft = Math.max(0, 120 - Math.floor(elapsed / 1000));
            const mins = Math.floor(secondsLeft / 60);
            const secs = secondsLeft % 60;
            label.innerText = `⏳ Reset in: ${mins}:${secs.toString().padStart(2, '0')}s`;
        }, 1000);
    }

    async function waitForButtons(selector = 'button.share-interest', timeout = 10000) {
        const pollInterval = 500;
        let waited = 0;

        while (waited < timeout) {
            const buttons = document.querySelectorAll(selector);
            if (buttons.length > 0) {
                console.log(`✅ Detected ${buttons.length} 'Share Interest' buttons`);
                return buttons;
            }
            await wait(pollInterval);
            waited += pollInterval;
        }

        console.warn("⏳ Timed out waiting for 'Share Interest' buttons");
        return [];
    }

    async function scrollUntilAllJobsLoaded() {
        console.log("🌀 Starting smart scroll...");
        let lastHeight = 0;
        let sameCount = 0;
        const maxSameCount = 3;

        while (sameCount < maxSameCount) {
            window.scrollTo(0, document.body.scrollHeight);
            await wait(1500);
            const newHeight = document.body.scrollHeight;

            if (newHeight === lastHeight) {
                sameCount++;
            } else {
                sameCount = 0;
                lastHeight = newHeight;
            }
        }

        console.log("✅ All jobs seem loaded");
    }

    function getExperienceValue(expText) {
        const match = expText.match(/(\d+)\s*-\s*(\d+)\s*Yrs/i);
        if (match) {
            return parseInt(match[1], 10); // Return the minimum experience
        }
        return null;
    }

    async function clickShareInterestButtons() {
        const clickedJobIds = JSON.parse(localStorage.getItem("clickedJobs") || "[]");
        const buttons = [...document.querySelectorAll('button.share-interest')];
        console.log(`🎯 Found ${buttons.length} 'Share Interest' buttons`);

        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const article = btn.closest('article');
            const jobId = article?.getAttribute('data-job-id') || "unknown";

            if (clickedJobIds.includes(jobId)) {
                console.log(`⏭️ Already applied to Job ID: ${jobId}. Skipping.`);
                continue;
            }

            // ✅ Check Experience Requirement
            const expElem = article?.querySelector('[class*="exp"]') || article?.querySelector('li');
            const expText = expElem?.innerText || '';
            const minExp = getExperienceValue(expText);
//extracting experience check is commented out to allow all experience levels  5-6 years
// if (minExp === null) {
//     console.warn(`⚠️ Can't parse experience for Job ID: ${jobId}. Skipping.`);
//     continue;
// } else if (minExp < 5 || minExp > 6) {
//     console.log(
//         `🚫 Skipping Job ID: ${jobId} (Min Exp: ${minExp} Yrs, Allowed: 5-6 Yrs)`
//     );
//     continue;
// }


// added following block to enforce the 5 Yrs experience requirement
if (minExp === null) {
    console.warn(`⚠️ Can't parse experience for Job ID: ${jobId}. Skipping.`);
    continue;
} else if (minExp !== 5) {
    console.log(
        `🚫 Skipping Job ID: ${jobId} (Min Exp: ${minExp} Yrs, Required: 5 Yrs)`
    );
    continue;
}

            if (btn.innerText.includes("Share Interest")) {
                console.log(`🚀 Clicking 'Share Interest' for Job ID: ${jobId}`);
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

                btn.click();
                await wait(5000 + Math.random() * 1000);

                const confirmation = document.querySelector('span.apply-message.typ-14Medium');
                if (confirmation && confirmation.innerText.includes("Interest shared successfully!")) {
                    console.log(`✅ Interest shared for Job ID: ${jobId}`);
                    clickedJobIds.push(jobId);
                    localStorage.setItem("clickedJobs", JSON.stringify(clickedJobIds));
                } else {
                    console.warn(`⚠️ Might not have worked for Job ID: ${jobId}`);
                }

                await wait(1500 + Math.random() * 1000);
            }
        }

        return buttons.length;
    }

    async function main() {
        maybeClearLocalStorageEveryTwoMinutes();

        if (loop >= maxLoops) {
            console.log(`🔁 Max loop reached (${loop}/${maxLoops}). Resetting.`);
            loop = 0;
            localStorage.setItem("shareInterestLoop", "0");
        }

        console.log(`🔄 Loop ${loop + 1} of ${maxLoops}`);

        await scrollUntilAllJobsLoaded();
        await waitForButtons();
        await clickShareInterestButtons();

        loop++;
        localStorage.setItem("shareInterestLoop", loop.toString());

        if (loop >= maxLoops) {
            console.log("🏁 Loops done. Navigating...");
            await wait(10000);
            window.location.href = "https://www.naukri.com/mnjuser/recommended-earjobs";
            return;
        }

        console.log("⏳ Waiting before next loop...");
        await wait(300000);
        window.location.href = "https://www.naukri.com/mnjuser/recommended-earjobs";
    }

    window.addEventListener('load', () => {
        startAutoClearCountdown();
        setTimeout(main, 2000);
    });
})();
