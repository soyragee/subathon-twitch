/**
 * Widget Subathon Timer - Lógica Principal
 * Propiedad de: Eliana "Rage" Avila (@rxgeit)
 * © Todos los derechos reservados.
 */

const htmlContent = `
<div class="main-container">
    <svg id="svg-bg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470.02 230.48">
      <defs>
        <style>
          .font-style { font-family: 'Fredoka One', cursive; text-anchor: middle; dominant-baseline: middle; font-weight: bold; }
          .bordered-box { stroke-alignment: inner; vector-effect: non-scaling-stroke; }
        </style>
        <linearGradient id="grad-bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="{{bgGradStart}}" />
            <stop offset="100%" stop-color="{{bgGradEnd}}" />
        </linearGradient>
        <linearGradient id="grad-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="{{topGradStart}}" />
            <stop offset="100%" stop-color="{{topGradEnd}}" />
        </linearGradient>
        <linearGradient id="grad-btm" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="{{bottomGradStart}}" />
            <stop offset="100%" stop-color="{{bottomGradEnd}}" />
        </linearGradient>
        <clipPath id="bottom-clip">
            <rect x="0" y="172.35" width="470.02" height="58.13" rx="21.77" ry="21.77" />
        </clipPath>
      </defs>
      <g id="bg-group"><rect id="bg-rect" class="bordered-box" x="0" y="36.74" width="470.02" height="114.2" rx="21.77" ry="21.77" fill="url(#grad-bg)"/></g>
      <g id="top-group"><rect id="top-rect" class="bordered-box" x="0" y="46.56" width="470.02" height="114.2" rx="21.77" ry="21.77" fill="url(#grad-top)"/></g>
      <g id="bottom-group">
          <rect id="bottom-rect" class="bordered-box" x="0" y="172.35" width="470.02" height="58.13" rx="21.77" ry="21.77" fill="url(#grad-btm)"/>
          <rect id="fire-overlay" class="rect-fire-active" x="0" y="172.35" width="470.02" height="58.13" rx="21.77" ry="21.77" opacity="0"/>
      </g>
      <g id="text-top-group"><text x="235" y="25" class="font-style" font-size="26" fill="{{topTextColor}}">{{topText}}</text></g>
      <g id="text-btm-group" clip-path="url(#bottom-clip)">
        <g id="train-container"><text id="dynamic-bottom-text" x="235" y="201" class="font-style" font-size="29" fill="{{bottomTextColor}}"></text></g>
      </g>
    </svg>
    <div id="timer-container"><span id="timer">00:00:00</span></div>
</div>
`;

document.body.insertAdjacentHTML('afterbegin', htmlContent);

let time = 0;
let secondsPerSub = 300; let secondsPer100Bits = 240; let minBits = 100;
let secondsPerTip = 60; let secondsPerRaid = 10; let minRaidViewers = 10;
let globalMultiplier = 1; let rouletteAmount = 1000; let rouletteDuration = 15;
let finishMessage = "SE TERMINÓ"; let commandPrefix = "!"; 
let originalBottomColor = "#ffffff"; 
let timerInterval = null; let isPaused = false;
let textToType = ""; let typeSpeed = 100;
let isTyping = false; let isRouletteActive = false; 
let channelName = ""; let isDeactivationActive = false;

window.addEventListener('onWidgetLoad', function (obj) {
    const fd = obj.detail.fieldData;
    channelName = obj.detail.channel.username.toLowerCase();

    applyGroupPosition('bg-group', fd.bgBoxX, fd.bgBoxY);
    applyGroupPosition('top-group', fd.topBoxX, fd.topBoxY);
    applyGroupPosition('bottom-group', fd.bottomBoxX, fd.bottomBoxY);
    applyGroupPosition('text-top-group', 0, fd.topTextY);
    applyGroupPosition('text-btm-group', 0, fd.bottomTextY);
    applyBorders(fd.borderColor, fd.borderWidth, fd.borderOpacity);

    const timerC = document.getElementById('timer-container');
    if(timerC) timerC.style.transform = `translate(calc(-50% + ${fd.timerOffsetX}px), calc(-50% + ${fd.timerOffsetY}px))`;

    time = (fd.startHours * 3600) + (fd.startMinutes * 60);
    secondsPerSub = fd.secondsPerSub; secondsPer100Bits = fd.secondsPer100Bits; minBits = fd.minBits;
    rouletteAmount = fd.rouletteAmount; secondsPerTip = fd.secondsPerTip; secondsPerRaid = fd.secondsPerRaid; minRaidViewers = fd.minRaidViewers;
    globalMultiplier = parseInt(fd.globalMultiplier) || 1;
    rouletteDuration = fd.rouletteDuration;
    finishMessage = fd.finishMessage; commandPrefix = fd.commandPrefix || "!";
    textToType = fd.bottomText; originalBottomColor = fd.bottomTextColor; typeSpeed = fd.animationSpeed;

    if (fd.initialState === "paused") isPaused = true;

    updateDisplay(); updatePauseVisuals(); startTimer(); checkHappyHourState();
    console.log("%c ⚡ Subathon Widget by @rxgeit ⚡ ", "background: #a96bea; color: #fff; padding: 5px;");
});

function applyGroupPosition(id, x, y) {
    const el = document.getElementById(id);
    if(el) el.setAttribute('transform', `translate(${x}, ${y})`);
}

function applyBorders(color, width, opacityPercent) {
    const boxes = document.querySelectorAll('.bordered-box');
    let r = 0, g = 0, b = 0;
    if (color.length === 7) {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
    }
    const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacityPercent / 100})`;
    boxes.forEach(box => {
        box.setAttribute('stroke', rgbaColor);
        box.setAttribute('stroke-width', width);
        box.style.paintOrder = "stroke"; 
    });
}

window.addEventListener('onEventReceived', function (obj) {
    if (!obj.detail.listener) return;
    const event = obj.detail.event;
    const listener = obj.detail.listener;

    if (listener === 'subscriber-latest') addTime(secondsPerSub * ((event.bulkGifted) ? event.amount : 1));
    else if (listener === 'cheer-latest') {
        if (event.amount >= minBits) {
            let timeToAdd = (event.amount / 100) * secondsPer100Bits;
            addTime(timeToAdd);
            if (event.amount >= rouletteAmount) {
                let rCount = Math.floor(event.amount / rouletteAmount);
                triggerRouletteVisuals(event.name, rCount);
            }
        }
    } else if (listener === 'tip-latest') addTime(event.amount * secondsPerTip);
    else if (listener === 'raid-latest') {
        if (event.amount >= minRaidViewers) addTime(event.amount * secondsPerRaid);
    }
    
    if (listener === 'message') {
        let data = obj.detail.event.data;
        let isBroadcaster = (data.nick.toLowerCase() === channelName);
        let isMod = (data.tags && data.tags.mod === "1");

        if (isBroadcaster || isMod) {
            const msg = data.text.toLowerCase().trim();
            const p = commandPrefix.toLowerCase();

            if (msg.startsWith(p + "tiempo")) {
                const parts = data.text.split(" ");
                if (parts.length === 2 && !isNaN(parts[1])) manualAddTime(parseInt(parts[1]) * 60);
            }
            if (msg === p + "pause" || msg === p + "pausar") { isPaused = true; updatePauseVisuals(); }
            if (msg === p + "play" || msg === p + "resume") { isPaused = false; updatePauseVisuals(); }
            if (msg.startsWith(p + "multi")) {
                const parts = data.text.split(" ");
                if (parts.length === 2) {
                    const newMulti = parseFloat(parts[1]);
                    if (!isNaN(newMulti) && newMulti >= 1) {
                        let prevMulti = globalMultiplier;
                        globalMultiplier = newMulti;
                        if (prevMulti > 1 && newMulti === 1) triggerDeactivationMessage();
                        else checkHappyHourState();
                    }
                }
            }
        } 
    }
});

function checkHappyHourState() {
    if(isRouletteActive || isDeactivationActive) return;
    const fireOverlay = document.getElementById("fire-overlay"); 
    const mainSvg = document.getElementById("svg-bg"); 
    const txtElement = document.getElementById("dynamic-bottom-text");
    const trainContainer = document.getElementById("train-container");
    const textGroup = document.getElementById("text-btm-group");

    isTyping = false; trainContainer.classList.remove("train-active");
    txtElement.classList.remove("text-cooldown"); txtElement.classList.remove("text-zoom"); 
    txtElement.setAttribute("x", "235"); txtElement.style.textAnchor = "middle"; 

    if (globalMultiplier > 1) {
        const phrase = "🔥 HAPPY HOURS 🔥 ⚡ ACTIVO ⚡   "; 
        txtElement.textContent = phrase.repeat(30); txtElement.style.fill = "#FFFFFF";
        fireOverlay.setAttribute("opacity", "1"); mainSvg.classList.add("container-fire-border");
        trainContainer.classList.add("train-active"); textGroup.classList.add("mask-active"); 
    } else {
        fireOverlay.setAttribute("opacity", "0"); mainSvg.classList.remove("container-fire-border");
        textGroup.classList.remove("mask-active"); txtElement.style.fill = originalBottomColor;
        typeWriterEffect(textToType);
    }
}

function typeWriterEffect(txt) {
    if (globalMultiplier > 1) return; 
    isTyping = true;
    const element = document.getElementById("dynamic-bottom-text");
    if(!element) return;
    element.textContent = ""; let i = 0;
    function type() {
        if (globalMultiplier > 1 || isRouletteActive) { isTyping = false; return; }
        if (i < txt.length) { element.textContent += txt.charAt(i); i++; setTimeout(type, typeSpeed); } 
        else { isTyping = false; setTimeout(() => { if(globalMultiplier === 1 && !isRouletteActive) typeWriterEffect(txt); }, 5000); }
    }
    type();
}

function triggerDeactivationMessage() {
    const txt = document.getElementById("dynamic-bottom-text");
    const trainContainer = document.getElementById("train-container");
    const fireOverlay = document.getElementById("fire-overlay");
    const mainSvg = document.getElementById("svg-bg");
    const textGroup = document.getElementById("text-btm-group");
    
    isDeactivationActive = true; trainContainer.classList.remove("train-active");
    textGroup.classList.remove("mask-active"); fireOverlay.setAttribute("opacity", "0"); 
    mainSvg.classList.remove("container-fire-border"); txt.classList.remove("text-zoom");
    txt.setAttribute("x", "235"); txt.style.textAnchor = "middle";
    txt.textContent = "🚫 HAPPY HOUR APAGADA 🚫"; txt.style.fill = "#CCCCCC";
    txt.classList.add("text-cooldown");
    setTimeout(() => { isDeactivationActive = false; txt.classList.remove("text-cooldown"); checkHappyHourState(); }, 4000);
}

function triggerRouletteVisuals(username, count) {
    isRouletteActive = true;
    const txt = document.getElementById("dynamic-bottom-text");
    const trainContainer = document.getElementById("train-container");
    const textGroup = document.getElementById("text-btm-group");
    trainContainer.classList.remove("train-active"); textGroup.classList.remove("mask-active");
    txt.setAttribute("x", "235"); txt.style.textAnchor = "middle";
    
    const cleanName = username ? username.toUpperCase() : "ANÓNIMO";
    let msg = (count > 1) ? `¡${count} RULETAS DE ${cleanName}!` : `¡RULETA DE ${cleanName}!`;
    txt.textContent = msg; txt.style.fill = originalBottomColor; txt.classList.add("spinning-blur");
    
    const spinTexts = ["🎲 GIRANDO... 🎲", `👤 ${cleanName} 👤`, "🎰 🎰 🎰", "🍀 SUERTE 🍀", `👤 ${cleanName} 👤`, "🎡 ... 🎡", `🔥 x${count} 🔥`];
    let index = 0;
    const spinInterval = setInterval(() => {
        let currentText = spinTexts[index % spinTexts.length];
        txt.textContent = currentText;
        if (currentText.includes(cleanName)) txt.classList.add("text-zoom");
        else txt.classList.remove("text-zoom");
        index++;
    }, 400); 
    setTimeout(() => {
        clearInterval(spinInterval); txt.classList.remove("spinning-blur"); txt.classList.remove("text-zoom");
        isRouletteActive = false; checkHappyHourState(); 
    }, rouletteDuration * 1000);
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isPaused && time > 0) { time--; updateDisplay(); } 
        else if (time <= 0) {
            clearInterval(timerInterval);
            const t = document.getElementById("timer");
            if (t) { t.innerText = finishMessage; t.style.fontSize = "45px"; }
        }
    }, 1000);
}

function addTime(seconds) { time += (seconds * globalMultiplier); updateDisplay(); if (time > 0 && !isPaused) startTimer(); }
function manualAddTime(seconds) { time += seconds; updateDisplay(); if (time > 0 && !isPaused) startTimer(); }
function updateDisplay() {
    if (time > 0) {
        let h = Math.floor(time / 3600); let m = Math.floor((time % 3600) / 60); let s = time % 60;
        const t = document.getElementById("timer");
        if (t) { t.innerText = `${pad(h)}:${pad(m)}:${pad(s)}`; t.style.fontSize = "75px"; }
    }
}
function updatePauseVisuals() {
    const el = document.getElementById("timer-container");
    if (el) isPaused ? el.classList.add("paused") : el.classList.remove("paused");
}
function pad(n) { return n.toString().padStart(2, '0'); }
