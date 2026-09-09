let audioContext = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  try {
    if (!audioContext) {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) return null;

      audioContext = new AudioContext();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    return audioContext;
  } catch {
    return null;
  }
}

function tone(
  frequency,
  duration = 0.08,
  type = "sine",
  volume = 0.04
) {
  const ctx = getAudioContext();

  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      frequency,
      ctx.currentTime
    );

    gain.gain.setValueAtTime(
      volume,
      ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(
      ctx.currentTime + duration
    );
  } catch {
    // Audio should never crash the game.
  }
}

/* =========================
   TAP SOUND
========================= */

export function playTapSound() {
  tone(
    420,
    0.06,
    "triangle",
    0.035
  );
}

/* =========================
   MOVE SOUND
========================= */

export function playMoveSound(direction) {
  const frequencies = {
    left: 280,
    right: 440,
    up: 560,
    down: 220,
  };

  tone(
    frequencies[direction] || 350,
    0.10,
    "triangle",
    0.045
  );
}

/* =========================
   DIRECTION SOUND
========================= */

export function playDirectionSound(direction) {
  playMoveSound(direction);
}

export function directionSound(direction) {
  playMoveSound(direction);
}

/* =========================
   SUCCESS
========================= */

export function playSuccessSound() {
  tone(
    620,
    0.07,
    "sine",
    0.04
  );

  setTimeout(() => {
    tone(
      820,
      0.09,
      "sine",
      0.035
    );
  }, 70);
}

export function successSound() {
  playSuccessSound();
}

/* =========================
   LEVEL COMPLETE
========================= */

export function playCompleteSound() {
  tone(
    523,
    0.10,
    "sine",
    0.045
  );

  setTimeout(() => {
    tone(
      659,
      0.10,
      "sine",
      0.045
    );
  }, 90);

  setTimeout(() => {
    tone(
      784,
      0.14,
      "sine",
      0.05
    );
  }, 180);
}

export function completeSound() {
  playCompleteSound();
}

/* =========================
   PERFECT
========================= */

export function playPerfectSound() {
  tone(
    660,
    0.08,
    "sine",
    0.04
  );

  setTimeout(() => {
    tone(
      880,
      0.08,
      "sine",
      0.04
    );
  }, 80);

  setTimeout(() => {
    tone(
      1047,
      0.16,
      "sine",
      0.05
    );
  }, 160);
}

export function perfectSound() {
  playPerfectSound();
}

/* =========================
   BLOCKED
========================= */

export function playBlockedSound() {
  tone(
    150,
    0.12,
    "square",
    0.035
  );

  setTimeout(() => {
    tone(
      100,
      0.10,
      "square",
      0.025
    );
  }, 70);
}

export function blockedSound() {
  playBlockedSound();
}

/* =========================
   FAIL
========================= */

export function playFailSound() {
  tone(
    180,
    0.12,
    "sawtooth",
    0.045
  );

  setTimeout(() => {
    tone(
      110,
      0.18,
      "sawtooth",
      0.04
    );
  }, 100);
}

export function failSound() {
  playFailSound();
}

/* =========================
   HINT
========================= */

export function playHintSound() {
  tone(
    500,
    0.07,
    "sine",
    0.035
  );

  setTimeout(() => {
    tone(
      700,
      0.10,
      "sine",
      0.04
    );
  }, 90);
}

export function hintSound() {
  playHintSound();
}

/* =========================
   DEFAULT EXPORT
========================= */

const arrowSounds = {
  playTapSound,

  playMoveSound,

  playDirectionSound,
  directionSound,

  playSuccessSound,
  successSound,

  playCompleteSound,
  completeSound,

  playPerfectSound,
  perfectSound,

  playBlockedSound,
  blockedSound,

  playFailSound,
  failSound,

  playHintSound,
  hintSound,
};

export default arrowSounds;