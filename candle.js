/**
 * LOGIC THỔI NẾN VÀ CHUYỂN STAGE LIỀN MẠCH (SINGLE PAGE)
 * - Tự động xin quyền bật Micro khi vừa vào trang.
 * - Nhấn giữ màn hình 3 giây để thổi nến (hiệu ứng vòng tròn đếm ngược).
 * - Khi nến tắt: Đèn bừng sáng, pháo giấy nổ, nhạc cất lên.
 * - Chuyển sang màn Happy Birthday mượt mà NGAY TRÊN TRANG, nhạc KHÔNG HỀ BỊ GIÁN ĐOẠN.
 */

const state = {
    isCandleBlown: false,
    isMicActive: false,
    audioContext: null,
    analyser: null,
    mediaStream: null,
    animationFrameId: null,
    blowDurationCount: 0,
    holdTimer: null,
    holdStartTime: 0,
    audioElement: null
};

const AUDIO_CONFIG = {
    thresholdRMS: 0.12,
    consecutiveFramesNeeded: 7
};

const HOLD_DURATION_MS = 3000; // 3 giây nhấn giữ

let isAudioUnlocked = false;

function unlockAudio() {
    if (isAudioUnlocked) return;
    const audio = document.getElementById('bgMusic');
    if (!audio) return;

    let soundList = ['./sound/sound.mp3', './sound/sound1.mp3', './sound/sound2.mp3'];
    if (typeof CONFIG !== 'undefined' && CONFIG.sounds && CONFIG.sounds.length > 0) {
        soundList = CONFIG.sounds;
    }

    if (!audio.src || audio.src === window.location.href) {
        audio.src = soundList[0];
    }
    audio.volume = 0.65;

    // Kích hoạt play() đồng bộ trong sự kiện tương tác của người dùng để cấp quyền Autoplay
    const promise = audio.play();
    if (promise !== undefined) {
        promise.then(() => {
            isAudioUnlocked = true;
            // Nếu nến chưa tắt thì tạm dừng lại ngay, chờ nến tắt sẽ tự động phát
            if (!state.isCandleBlown) {
                audio.pause();
                audio.currentTime = 0;
            }
        }).catch(() => { });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo dữ liệu người nhận từ config.js
    applyConfigData();

    // 2. Mở khóa AudioContext/HTML5 Audio trên bất kỳ tương tác chạm nào
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('click', unlockAudio, { passive: true });

    // 3. Tự động xin quyền Microphone ngay khi vào trang
    initAutoMic();

    // 4. Khởi tạo sự kiện nhấn giữ 3s trên toàn màn hình
    initScreenHoldToBlow();

    // 5. Khởi tạo nút bật/tắt nhạc
    initMusicToggle();
});

/* =========================================================
   1. CẤU HÌNH DỮ LIỆU BAN ĐẦU
   ========================================================= */
function applyConfigData() {
    if (typeof CONFIG === 'undefined') return;

    const titleEl = document.getElementById('candleTitle');
    const subTitleEl = document.getElementById('candleSubtitle');
    const nameEl = document.getElementById('recipientNameText');
    const btnLetterEl = document.getElementById('btnLetterText');

    if (titleEl && CONFIG.candleTitle) titleEl.textContent = CONFIG.candleTitle;
    if (subTitleEl && CONFIG.candleSubtitle) subTitleEl.textContent = CONFIG.candleSubtitle;
    if (nameEl && CONFIG.recipientName) nameEl.textContent = CONFIG.recipientName;
    if (btnLetterEl && CONFIG.recipientName) btnLetterEl.textContent = `Ấn vào đây nè ku em🙋`;
}

/* =========================================================
   2. TỰ ĐỘNG BẬT MICROPHONE
   ========================================================= */
async function initAutoMic() {
    if (state.isCandleBlown) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('Trình duyệt không hỗ trợ getUserMedia.');
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });
        setupAudioStream(stream);
    } catch (err) {
        console.log('Chờ tương tác người dùng để cấp quyền mic:', err);

        // Fallback: Nếu trình duyệt chặn xin quyền khi chưa chạm,
        // thì chạm nhẹ đầu tiên vào màn hình sẽ kích hoạt xin quyền mic ngay!
        const requestOnFirstTouch = () => {
            if (!state.isMicActive && !state.isCandleBlown) {
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(setupAudioStream)
                    .catch(() => { });
            }
            window.removeEventListener('pointerdown', requestOnFirstTouch);
        };
        window.addEventListener('pointerdown', requestOnFirstTouch, { once: true });
    }
}

function setupAudioStream(stream) {
    if (state.isCandleBlown) {
        stream.getTracks().forEach(t => t.stop());
        return;
    }

    try {
        state.mediaStream = stream;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        state.audioContext = new AudioContextClass();

        if (state.audioContext.state === 'suspended') {
            state.audioContext.resume();
        }

        const source = state.audioContext.createMediaStreamSource(stream);
        state.analyser = state.audioContext.createAnalyser();
        state.analyser.fftSize = 512;
        source.connect(state.analyser);

        state.isMicActive = true;

        const hint = document.getElementById('candleHintText');
        if (hint) {
            hint.innerHTML = '<span class="mic-active-dot"></span><span>Micro đã sẵn sàng! Thổi vào mic hoặc giữ 3s để thổi ✨</span>';
        }

        listenAudioStream();
    } catch (e) {
        console.warn('Lỗi AudioContext:', e);
    }
}

function stopMicrophone() {
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }

    if (state.mediaStream) {
        state.mediaStream.getTracks().forEach(track => track.stop());
        state.mediaStream = null;
    }

    if (state.audioContext) {
        state.audioContext.close().catch(() => { });
        state.audioContext = null;
    }

    state.isMicActive = false;
}

function listenAudioStream() {
    if (!state.isMicActive || !state.analyser || state.isCandleBlown) return;

    const dataArray = new Uint8Array(state.analyser.frequencyBinCount);
    state.analyser.getByteTimeDomainData(dataArray);

    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);

    const flames = document.querySelectorAll('.flame');
    if (rms > 0.05) {
        flames.forEach(f => f.classList.add('blowing'));
    } else {
        flames.forEach(f => f.classList.remove('blowing'));
    }

    if (rms > AUDIO_CONFIG.thresholdRMS) {
        state.blowDurationCount++;
        if (state.blowDurationCount >= AUDIO_CONFIG.consecutiveFramesNeeded) {
            handleBlowSuccess();
            return;
        }
    } else {
        if (state.blowDurationCount > 0) state.blowDurationCount--;
    }

    state.animationFrameId = requestAnimationFrame(listenAudioStream);
}

/* =========================================================
   3. CHẠM GIỮ MÀN HÌNH 3 GIÂY ĐỂ THỔI NẾN (KHÔNG CẦN NÚT)
   ========================================================= */
function initScreenHoldToBlow() {
    const touchRing = document.getElementById('touchRing');
    const touchMeter = document.getElementById('touchMeter');
    const hintText = document.getElementById('candleHintText');
    const flames = document.querySelectorAll('.flame');
    const fullCircumference = 232.5; // Chu vi vòng tròn SVG (2 * PI * 37)

    function startHold(e) {
        if (state.isCandleBlown) return;

        // Bỏ qua nếu chạm vào nút điều khiển hoặc modal
        if (e.target.closest('#musicToggle') || e.target.closest('.box__letter') || e.target.closest('#btn__letter')) {
            return;
        }

        unlockAudio();
        state.holdStartTime = Date.now();
        flames.forEach(f => f.classList.add('blowing'));

        // Căn vị trí vòng tròn chỉ báo ngay tại ngón tay/chuột
        if (touchRing) {
            touchRing.style.left = `${e.clientX}px`;
            touchRing.style.top = `${e.clientY}px`;
            touchRing.classList.add('active');
        }

        if (touchMeter) {
            touchMeter.style.strokeDashoffset = `${fullCircumference}`;
        }

        if (state.holdTimer) clearInterval(state.holdTimer);

        state.holdTimer = setInterval(() => {
            const elapsed = Date.now() - state.holdStartTime;
            const progress = Math.min(1, elapsed / HOLD_DURATION_MS);
            const remainingOffset = fullCircumference * (1 - progress);

            if (touchMeter) {
                touchMeter.style.strokeDashoffset = `${remainingOffset}`;
            }

            const remainingSeconds = Math.max(1, Math.ceil((HOLD_DURATION_MS - elapsed) / 1000));
            if (hintText) {
                hintText.innerHTML = `<i class="fa-solid fa-wind"></i><span>Đang thổi nến... Giữ tiếp ${remainingSeconds}s nhé 💨</span>`;
            }

            if (elapsed >= HOLD_DURATION_MS) {
                clearInterval(state.holdTimer);
                state.holdTimer = null;
                handleBlowSuccess();
            }
        }, 25);
    }

    function cancelHold() {
        if (state.isCandleBlown) return;

        if (state.holdTimer) {
            clearInterval(state.holdTimer);
            state.holdTimer = null;
        }

        flames.forEach(f => f.classList.remove('blowing'));

        if (touchRing) {
            touchRing.classList.remove('active');
        }

        if (touchMeter) {
            touchMeter.style.strokeDashoffset = `${fullCircumference}`;
        }

        if (hintText) {
            hintText.innerHTML = '<i class="fa-solid fa-microphone-lines"></i><span>Thổi vào mic hoặc chạm giữ màn hình 3s để thổi nến ✨</span>';
        }
    }

    window.addEventListener('pointerdown', startHold);
    window.addEventListener('pointerup', cancelHold);
    window.addEventListener('pointercancel', cancelHold);
}

/* =========================================================
   4. KHOẢNH KHẮC NẾN TẮT: ĐÈN BỪNG SÁNG, PHÁO GIẤY & NHẠC
   ========================================================= */
function handleBlowSuccess() {
    if (state.isCandleBlown) return;
    state.isCandleBlown = true;

    // 1. Dừng thu âm micro & tắt chỉ báo chạm giữ
    stopMicrophone();
    const touchRing = document.getElementById('touchRing');
    if (touchRing) touchRing.classList.remove('active');

    // 2. Tắt lửa và bay khói
    const flames = document.querySelectorAll('.flame');
    const smokes = document.querySelectorAll('.smoke');
    const candleGlow = document.querySelector('.candle-glow');

    flames.forEach(f => {
        f.classList.remove('blowing');
        f.classList.add('out');
    });
    smokes.forEach(s => s.classList.add('active'));
    if (candleGlow) candleGlow.classList.add('out');

    // 3. HIỆU ỨNG ĐÈN BỪNG SÁNG (Flash -> Room Lit)
    const flash = document.getElementById('flashOverlay');
    if (flash) {
        flash.classList.add('active');
        setTimeout(() => {
            flash.classList.remove('active');
            flash.classList.add('fading');
            document.body.classList.add('room-lit');
        }, 150);
    } else {
        document.body.classList.add('room-lit');
    }

    // 4. BẮT ĐẦU PHÁT NHẠC SINH NHẬT NGAY TẠI ĐÂY (LIỀN MẠCH 100%)
    startContinuousMusic();

    // 5. BẮN PHÁO GIẤY CONFETTI RỰC RỠ
    fireConfetti();

    // 6. CHUYỂN TIẾP MƯỢT MÀ SANG STAGE 2 (KHÔNG HỀ RELOAD TRANG, NHẠC TIẾP TỤC CHẠY)
    setTimeout(() => {
        const stageCake = document.getElementById('stageCake');
        const stageBirthday = document.getElementById('stageBirthday');

        if (stageCake) {
            stageCake.classList.add('stage-fade-out');
        }

        setTimeout(() => {
            if (stageCake) stageCake.classList.add('stage-hidden');

            if (stageBirthday) {
                stageBirthday.classList.remove('stage-hidden');
                stageBirthday.classList.add('stage-fade-in');
            }

            // Kích hoạt animation của Stage 2 (gõ ngày sinh, tương tác thư)
            initStageBirthdayAnimations();
        }, 800);
    }, 2200);
}

/* =========================================================
   5. PHÁT NHẠC LIỀN MẠCH & BẮN PHÁO GIẤY
   ========================================================= */
function startContinuousMusic() {
    const audio = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('musicToggle');
    if (!audio) return;

    let soundList = ['./sound/sound.mp3', './sound/sound1.mp3', './sound/sound2.mp3'];
    if (typeof CONFIG !== 'undefined' && CONFIG.sounds && CONFIG.sounds.length > 0) {
        soundList = CONFIG.sounds;
    }

    if (!audio.src || audio.src === window.location.href) {
        audio.src = soundList[0];
    }
    audio.currentTime = 0;
    audio.volume = 0.7;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            if (musicToggle) musicToggle.classList.add('playing');
        }).catch(err => {
            console.warn('Autoplay bị trình duyệt hạn chế:', err);
            const playOnTouch = () => {
                audio.play().then(() => {
                    if (musicToggle) musicToggle.classList.add('playing');
                }).catch(() => { });
                window.removeEventListener('pointerdown', playOnTouch);
                window.removeEventListener('click', playOnTouch);
            };
            window.addEventListener('pointerdown', playOnTouch, { once: true });
            window.addEventListener('click', playOnTouch, { once: true });
        });
    }

    state.audioElement = audio;
}

function initMusicToggle() {
    const musicToggle = document.getElementById('musicToggle');
    const audio = document.getElementById('bgMusic');
    if (!musicToggle || !audio) return;

    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused) {
            audio.play();
            musicToggle.classList.add('playing');
        } else {
            audio.pause();
            musicToggle.classList.remove('playing');
        }
    });
}

function fireConfetti() {
    if (typeof confetti === 'function') {
        const count = 220;
        const defaults = { origin: { y: 0.7 } };

        function fire(particleRatio, opts) {
            confetti(Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio)
            }));
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }
}

/* =========================================================
   6. HOẠT ẢNH STAGE 2: GÕ NGÀY SINH & MODAL MỞ THƯ
   ========================================================= */
function initStageBirthdayAnimations() {
    const birthDate = (typeof CONFIG !== 'undefined' && CONFIG.birthDate) ? CONFIG.birthDate : "09-08-2004";
    const letterTitle = (typeof CONFIG !== 'undefined' && CONFIG.letterTitle) ? CONFIG.letterTitle : "Gửi người đặc biệt nha 🥳🎂";
    const letterContent = (typeof CONFIG !== 'undefined' && CONFIG.letterContent) ? CONFIG.letterContent : "Happy Birthday! Chúc bạn tuổi mới luôn ngập tràn niềm vui, mạnh khỏe và thành công rực rỡ!";

    // Hiệu ứng gõ ngày sinh
    let dateIdx = 0;
    const dateSpan = document.getElementById("dateText");
    if (dateSpan) {
        dateSpan.textContent = "";
        const dateInterval = setInterval(() => {
            if (dateIdx < birthDate.length) {
                dateSpan.textContent += birthDate[dateIdx];
                dateIdx++;
            } else {
                clearInterval(dateInterval);
            }
        }, 120);
    }

    // Xử lý mở hộp thư & gõ từng chữ
    let titleInterval, contentInterval;
    const btnLetter = document.getElementById("btn__letter");
    const boxLetter = document.querySelector(".box__letter");
    const titleLetterEl = document.querySelector(".title__letter");
    const textLetterEl = document.querySelector(".text__letter p");

    if (btnLetter && boxLetter) {
        btnLetter.onclick = function () {
            $(boxLetter).css('display', 'flex').hide().fadeIn(350);

            // Gõ tiêu đề thư
            if (titleLetterEl) {
                titleLetterEl.textContent = "";
                let tIdx = 0;
                clearInterval(titleInterval);
                titleInterval = setInterval(() => {
                    if (tIdx < letterTitle.length) {
                        titleLetterEl.textContent += letterTitle[tIdx];
                        tIdx++;
                    } else {
                        clearInterval(titleInterval);
                        startTypingContent();
                    }
                }, 80);
            }
        };
    }

    function startTypingContent() {
        if (!textLetterEl) return;
        textLetterEl.textContent = "";
        let cIdx = 0;
        clearInterval(contentInterval);
        contentInterval = setInterval(() => {
            if (cIdx < letterContent.length) {
                textLetterEl.textContent += letterContent[cIdx];
                cIdx++;
            } else {
                clearInterval(contentInterval);
            }
        }, 35);
    }

    // Đóng hộp thư
    $(".close").on("click", function () {
        clearInterval(titleInterval);
        clearInterval(contentInterval);
        $(boxLetter).fadeOut(300);
    });

    $(boxLetter).on("click", function (e) {
        if ($(e.target).hasClass("box__letter")) {
            clearInterval(titleInterval);
            clearInterval(contentInterval);
            $(boxLetter).fadeOut(300);
        }
    });
}
