import React, { useEffect, useMemo, useState } from "react";
import "./LastSignal.css";

const INITIAL_EVIDENCE = [];

const CLUES = {
  clock: {
    id: "clock",
    title: "Frozen Clock",
    text: "The old wall clock is stopped at exactly 11:11.",
  },
  phone: {
    id: "phone",
    title: "Unknown Phone",
    text: "The phone contains one unread message: DON'T OPEN ROOM 07.",
  },
  photo: {
    id: "photo",
    title: "Old Photograph",
    text: "A photograph shows this same room... but the room looks abandoned.",
  },
  cctv: {
    id: "cctv",
    title: "CCTV Recording",
    text: "The recording is dated seven years ago. Someone is standing in Room 07.",
  },
  signal: {
    id: "signal",
    title: "Unknown Signal",
    text: "The signal repeats every 24 seconds.",
  },
};

const OBJECTS = [
  {
    id: "clock",
    name: "Wall Clock",
    icon: "🕐",
    x: 17,
    y: 20,
  },
  {
    id: "phone",
    name: "Old Phone",
    icon: "📱",
    x: 48,
    y: 69,
  },
  {
    id: "photo",
    name: "Photograph",
    icon: "🖼️",
    x: 70,
    y: 31,
  },
  {
    id: "cctv",
    name: "CCTV Monitor",
    icon: "📺",
    x: 83,
    y: 67,
  },
  {
    id: "door",
    name: "Room 07",
    icon: "🚪",
    x: 91,
    y: 29,
  },
];

function LastSignal() {
  const [phase, setPhase] = useState("intro");
  const [playerX, setPlayerX] = useState(50);

  const [evidence, setEvidence] = useState(INITIAL_EVIDENCE);
  const [inspected, setInspected] = useState([]);
  const [messages, setMessages] = useState([]);

  const [doorUnlocked, setDoorUnlocked] = useState(false);
  const [phoneSolved, setPhoneSolved] = useState(false);
  const [cctvSolved, setCctvSolved] = useState(false);

  const [puzzle, setPuzzle] = useState(null);
  const [codeInput, setCodeInput] = useState("");

  const [choice, setChoice] = useState(null);
  const [score, setScore] = useState(0);

  const [soundOn, setSoundOn] = useState(true);

  const [elapsed, setElapsed] = useState(0);

  /* -----------------------------------------
     TIMER
  ----------------------------------------- */

  useEffect(() => {
    if (phase !== "playing") return;

    const timer = setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  /* -----------------------------------------
     SAVE PROGRESS
  ----------------------------------------- */

  useEffect(() => {
    const saved = localStorage.getItem("last-signal-progress");

    if (!saved) return;

    try {
      const data = JSON.parse(saved);

      if (data.evidence) setEvidence(data.evidence);
      if (data.inspected) setInspected(data.inspected);
      if (data.score) setScore(data.score);
      if (data.doorUnlocked) setDoorUnlocked(data.doorUnlocked);
      if (data.phoneSolved) setPhoneSolved(data.phoneSolved);
      if (data.cctvSolved) setCctvSolved(data.cctvSolved);
    } catch {
      // Ignore invalid save data
    }
  }, []);

  useEffect(() => {
    if (phase !== "playing" && phase !== "ending") return;

    const saveData = {
      evidence,
      inspected,
      score,
      doorUnlocked,
      phoneSolved,
      cctvSolved,
    };

    localStorage.setItem(
      "last-signal-progress",
      JSON.stringify(saveData)
    );
  }, [
    evidence,
    inspected,
    score,
    doorUnlocked,
    phoneSolved,
    cctvSolved,
    phase,
  ]);

  /* -----------------------------------------
     AUDIO
  ----------------------------------------- */

  const playBeep = () => {
    if (!soundOn) return;

    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.frequency.value = 520;
      oscillator.type = "sine";

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.15
      );

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio unavailable
    }
  };

  /* -----------------------------------------
     START
  ----------------------------------------- */

  const startGame = () => {
    playBeep();
    setPhase("playing");
  };

  /* -----------------------------------------
     ADD EVIDENCE
  ----------------------------------------- */

  const addEvidence = (id) => {
    if (evidence.includes(id)) return;

    setEvidence((current) => [...current, id]);

    setScore((current) => current + 100);

    playBeep();
  };

  /* -----------------------------------------
     INSPECT OBJECT
  ----------------------------------------- */

  const inspectObject = (objectId) => {
    playBeep();

    if (objectId === "door") {
      if (!doorUnlocked) {
        setMessages((current) => [
          ...current,
          {
            type: "system",
            text: "ROOM 07 is locked. Find the access code.",
          },
        ]);

        return;
      }

      setPhase("room07");
      return;
    }

    const clue = CLUES[objectId];

    if (!clue) return;

    if (!inspected.includes(objectId)) {
      setInspected((current) => [...current, objectId]);
      addEvidence(objectId);
    }

    setMessages((current) => [
      ...current,
      {
        type: "clue",
        text: clue.text,
      },
    ]);
  };

  /* -----------------------------------------
     PHONE PUZZLE
  ----------------------------------------- */

  const openPhonePuzzle = () => {
    setPuzzle("phone");
    setCodeInput("");
  };

  const submitPhoneCode = () => {
    if (codeInput === "1111") {
      setPhoneSolved(true);
      setDoorUnlocked(true);
      setScore((current) => current + 300);
      setPuzzle(null);

      addEvidence("phone");

      setMessages((current) => [
        ...current,
        {
          type: "success",
          text: "ACCESS GRANTED — ROOM 07 UNLOCKED.",
        },
      ]);

      playBeep();
    } else {
      setMessages((current) => [
        ...current,
        {
          type: "error",
          text: "Wrong code. The clock may contain the answer.",
        },
      ]);
    }
  };

  /* -----------------------------------------
     CCTV PUZZLE
  ----------------------------------------- */

  const openCctvPuzzle = () => {
    if (!doorUnlocked) {
      setMessages((current) => [
        ...current,
        {
          type: "system",
          text: "The CCTV console requires Room 07 access.",
        },
      ]);

      return;
    }

    setPuzzle("cctv");
  };

  const solveCctv = (answer) => {
    if (answer === "7") {
      setCctvSolved(true);
      setScore((current) => current + 400);
      setPuzzle(null);

      addEvidence("cctv");

      setMessages((current) => [
        ...current,
        {
          type: "success",
          text: "CCTV ARCHIVE FOUND — RECORDING FROM 7 YEARS AGO.",
        },
      ]);

      playBeep();
    } else {
      setMessages((current) => [
        ...current,
        {
          type: "error",
          text: "Wrong archive number.",
        },
      ]);
    }
  };

  /* -----------------------------------------
     ROOM 07
  ----------------------------------------- */

  const enterRoom07 = () => {
    setPhase("room07");
    setScore((current) => current + 250);
  };

  const inspectSignal = () => {
    addEvidence("signal");

    setMessages((current) => [
      ...current,
      {
        type: "clue",
        text: "Signal pattern detected: 24... 24... 24...",
      },
    ]);

    setScore((current) => current + 150);
  };

  /* -----------------------------------------
     FINAL CHOICE
  ----------------------------------------- */

  const makeChoice = (selected) => {
    setChoice(selected);

    if (selected === "answer") {
      setScore((current) => current + 300);
    } else {
      setScore((current) => current + 150);
    }

    setTimeout(() => {
      setPhase("ending");
    }, 700);
  };

  /* -----------------------------------------
     RESTART
  ----------------------------------------- */

  const restartGame = () => {
    localStorage.removeItem("last-signal-progress");

    setPhase("intro");
    setPlayerX(50);
    setEvidence([]);
    setInspected([]);
    setMessages([]);
    setDoorUnlocked(false);
    setPhoneSolved(false);
    setCctvSolved(false);
    setPuzzle(null);
    setCodeInput("");
    setChoice(null);
    setScore(0);
    setElapsed(0);
  };

  /* -----------------------------------------
     KEYBOARD
  ----------------------------------------- */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (phase !== "playing") return;

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        setPlayerX((value) => Math.max(5, value - 4));
      }

      if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
      ) {
        setPlayerX((value) => Math.min(95, value + 4));
      }

      if (event.key === "e" || event.key === "Enter") {
        const closest = OBJECTS.reduce((best, object) => {
          const distance = Math.abs(object.x - playerX);

          if (!best || distance < best.distance) {
            return {
              object,
              distance,
            };
          }

          return best;
        }, null);

        if (closest && closest.distance < 12) {
          inspectObject(closest.object.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase, playerX]);

  /* -----------------------------------------
     PROGRESS
  ----------------------------------------- */

  const progress = useMemo(() => {
    let value = 0;

    if (inspected.length >= 1) value += 15;
    if (phoneSolved) value += 25;
    if (doorUnlocked) value += 15;
    if (cctvSolved) value += 25;
    if (evidence.includes("signal")) value += 20;

    return Math.min(100, value);
  }, [
    inspected,
    phoneSolved,
    doorUnlocked,
    cctvSolved,
    evidence,
  ]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${secs}`;
  };

  /* -----------------------------------------
     INTRO
  ----------------------------------------- */

  if (phase === "intro") {
    return (
      <div className="last-signal-game intro-screen">
        <div className="intro-noise" />

        <div className="intro-content">
          <div className="signal-label">
            UNKNOWN TRANSMISSION
          </div>

          <h1>
            LAST SIGNAL
            <span>: 24</span>
          </h1>

          <p className="intro-subtitle">
            Every answer creates another question.
          </p>

          <div className="intro-terminal">
            <p>&gt; SIGNAL DETECTED</p>
            <p>&gt; LOCATION UNKNOWN</p>
            <p>&gt; TIME: 23:47</p>
            <p>&gt; SUBJECT STATUS: UNKNOWN</p>
          </div>

          <button
            className="start-btn"
            onClick={startGame}
          >
            START EPISODE 01
          </button>

          <div className="episode-name">
            THE SIGNAL
          </div>
        </div>
      </div>
    );
  }

  /* -----------------------------------------
     ROOM 07
  ----------------------------------------- */

  if (phase === "room07") {
    return (
      <div className="last-signal-game room07-screen">
        <div className="top-hud">
          <div>
            <span>EPISODE 01</span>
            <strong>ROOM 07</strong>
          </div>

          <div className="hud-stat">
            SCORE
            <strong>{score}</strong>
          </div>

          <div className="hud-stat">
            EVIDENCE
            <strong>
              {evidence.length}/5
            </strong>
          </div>
        </div>

        <div className="room07-content">
          <div className="room07-light">
            <div className="mysterious-chair">
              <div className="chair-back" />
              <div className="chair-seat" />
            </div>

            <div className="signal-device">
              <div className="signal-screen">
                24
              </div>

              <div className="signal-wave">
                ~ ~ ~ ~
              </div>

              <button onClick={inspectSignal}>
                INVESTIGATE SIGNAL
              </button>
            </div>
          </div>

          <div className="room07-dialogue">
            <span>UNKNOWN SYSTEM</span>

            <p>
              “You shouldn't have opened this room.”
            </p>

            <small>
              The signal is getting stronger.
            </small>
          </div>

          {evidence.includes("signal") && (
            <button
              className="continue-btn"
              onClick={() => setPhase("choice")}
            >
              CONTINUE
            </button>
          )}
        </div>
      </div>
    );
  }

  /* -----------------------------------------
     CHOICE
  ----------------------------------------- */

  if (phase === "choice") {
    return (
      <div className="last-signal-game choice-screen">
        <div className="choice-card">
          <div className="choice-warning">
            ⚠ DECISION REQUIRED
          </div>

          <h2>
            The phone starts ringing.
          </h2>

          <p>
            You know you should leave.
            But someone on the other side already
            knows your name.
          </p>

          <div className="choice-buttons">
            <button
              onClick={() => makeChoice("answer")}
            >
              📱 ANSWER THE CALL
            </button>

            <button
              onClick={() => makeChoice("leave")}
            >
              🚪 LEAVE ROOM 07
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -----------------------------------------
     ENDING
  ----------------------------------------- */

  if (phase === "ending") {
    return (
      <div className="last-signal-game ending-screen">
        <div className="ending-content">
          <div className="ending-label">
            EPISODE 01 COMPLETE
          </div>

          <h1>
            THE SIGNAL
          </h1>

          <div className="ending-stats">
            <div>
              <span>SCORE</span>
              <strong>{score}</strong>
            </div>

            <div>
              <span>TIME</span>
              <strong>{formatTime(elapsed)}</strong>
            </div>

            <div>
              <span>PROGRESS</span>
              <strong>{progress}%</strong>
            </div>
          </div>

          <div className="cliffhanger">
            <p>
              “You found the person who sent the signal.”
            </p>

            <strong>
              But he died 7 years ago.
            </strong>
          </div>

          <div className="next-episode">
            <span>NEXT SIGNAL</span>
            <strong>24 HOURS</strong>
          </div>

          <button
            className="restart-btn"
            onClick={restartGame}
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    );
  }

  /* -----------------------------------------
     MAIN GAME
  ----------------------------------------- */

  return (
    <div className="last-signal-game">
      <header className="game-header">
        <div className="brand">
          <span className="brand-dot" />
          LAST SIGNAL
          <small>24</small>
        </div>

        <div className="episode">
          EPISODE 01
          <strong>THE SIGNAL</strong>
        </div>

        <button
          className="sound-btn"
          onClick={() => setSoundOn((value) => !value)}
        >
          {soundOn ? "🔊" : "🔇"}
        </button>
      </header>

      <div className="game-layout">
        {/* ----------------------------------
            GAME WORLD
        ---------------------------------- */}

        <main className="game-world">
          <div className="room-background">
            <div className="ceiling-light" />

            <div className="window">
              <div className="rain rain-one" />
              <div className="rain rain-two" />
              <div className="rain rain-three" />
              <div className="rain rain-four" />
            </div>

            <div className="wall-crack crack-one" />
            <div className="wall-crack crack-two" />

            <div className="floor-grid" />

            {/* OBJECTS */}

            {OBJECTS.map((object) => (
              <button
                key={object.id}
                className={[
                  "world-object",
                  inspected.includes(object.id)
                    ? "inspected"
                    : "",
                  object.id === "door" && doorUnlocked
                    ? "unlocked"
                    : "",
                ].join(" ")}
                style={{
                  left: `${object.x}%`,
                  top: `${object.y}%`,
                }}
                onClick={() => {
                  if (
                    object.id === "phone" &&
                    !phoneSolved
                  ) {
                    openPhonePuzzle();
                    return;
                  }

                  if (
                    object.id === "cctv" &&
                    !cctvSolved
                  ) {
                    openCctvPuzzle();
                    return;
                  }

                  inspectObject(object.id);
                }}
              >
                <span className="object-icon">
                  {object.icon}
                </span>

                <span className="object-name">
                  {object.name}
                </span>

                {inspected.includes(object.id) && (
                  <span className="checked">
                    ✓
                  </span>
                )}
              </button>
            ))}

            {/* PLAYER */}

            <div
              className="player-character"
              style={{
                left: `${playerX}%`,
              }}
            >
              <div className="player-shadow" />

              <div className="player-body">
                <div className="player-head" />
                <div className="player-torso" />
                <div className="player-leg left" />
                <div className="player-leg right" />
              </div>

              <div className="player-name">
                YOU
              </div>
            </div>

            <div className="interaction-hint">
              ← A &nbsp;&nbsp; MOVE &nbsp;&nbsp; D →
              <span>
                E / ENTER — INTERACT
              </span>
            </div>
          </div>

          {/* MOBILE CONTROLS */}

          <div className="mobile-controls">
            <button
              onClick={() =>
                setPlayerX((value) =>
                  Math.max(5, value - 5)
                )
              }
            >
              ←
            </button>

            <button
              className="mobile-interact"
              onClick={() => {
                const closest = OBJECTS.reduce(
                  (best, object) => {
                    const distance = Math.abs(
                      object.x - playerX
                    );

                    if (
                      !best ||
                      distance < best.distance
                    ) {
                      return {
                        object,
                        distance,
                      };
                    }

                    return best;
                  },
                  null
                );

                if (
                  closest &&
                  closest.distance < 14
                ) {
                  inspectObject(closest.object.id);
                }
              }}
            >
              E
            </button>

            <button
              onClick={() =>
                setPlayerX((value) =>
                  Math.min(95, value + 5)
                )
              }
            >
              →
            </button>
          </div>
        </main>

        {/* ----------------------------------
            SIDE PANEL
        ---------------------------------- */}

        <aside className="investigation-panel">
          <div className="panel-title">
            <span>INVESTIGATION</span>

            <strong>
              {progress}%
            </strong>
          </div>

          <div className="progress-bar">
            <div
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <section className="panel-section">
            <h3>OBJECTIVE</h3>

            <p>
              Investigate the room and discover
              why the unknown signal is being sent.
            </p>
          </section>

          <section className="panel-section">
            <h3>EVIDENCE</h3>

            <div className="evidence-list">
              {Object.values(CLUES).map((clue) => (
                <div
                  key={clue.id}
                  className={
                    evidence.includes(clue.id)
                      ? "evidence found"
                      : "evidence"
                  }
                >
                  <span>
                    {evidence.includes(clue.id)
                      ? "✓"
                      : "?"}
                  </span>

                  <div>
                    <strong>
                      {evidence.includes(clue.id)
                        ? clue.title
                        : "Unknown Evidence"}
                    </strong>

                    <small>
                      {evidence.includes(clue.id)
                        ? clue.text
                        : "Investigate the room."}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel-section">
            <h3>STATUS</h3>

            <div className="status-row">
              <span>Room Access</span>
              <strong>
                {doorUnlocked
                  ? "UNLOCKED"
                  : "LOCKED"}
              </strong>
            </div>

            <div className="status-row">
              <span>CCTV</span>
              <strong>
                {cctvSolved
                  ? "ANALYZED"
                  : "UNKNOWN"}
              </strong>
            </div>

            <div className="status-row">
              <span>Signal</span>
              <strong>
                {evidence.includes("signal")
                  ? "FOUND"
                  : "SEARCHING"}
              </strong>
            </div>
          </section>

          <section className="panel-section">
            <h3>MISSION</h3>

            <div className="mission-progress">
              <span>
                {formatTime(elapsed)}
              </span>

              <span>
                SCORE {score}
              </span>
            </div>
          </section>
        </aside>
      </div>

      {/* --------------------------------------
          MESSAGE LOG
      -------------------------------------- */}

      <div className="message-log">
        {messages.slice(-3).map((message, index) => (
          <div
            key={`${message.text}-${index}`}
            className={`message ${message.type}`}
          >
            {message.text}
          </div>
        ))}
      </div>

      {/* --------------------------------------
          PHONE PUZZLE
      -------------------------------------- */}

      {puzzle === "phone" && (
        <div className="puzzle-overlay">
          <div className="puzzle-card phone-card">
            <button
              className="close-puzzle"
              onClick={() => setPuzzle(null)}
            >
              ×
            </button>

            <div className="puzzle-icon">
              📱
            </div>

            <span>SECURITY LOCK</span>

            <h2>
              Enter the access code
            </h2>

            <p>
              The phone displays a strange
              clue:
            </p>

            <div className="puzzle-clue">
              “The frozen time knows the way.”
            </div>

            <input
              autoFocus
              value={codeInput}
              onChange={(event) =>
                setCodeInput(
                  event.target.value.replace(
                    /\D/g,
                    ""
                  ).slice(0, 4)
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitPhoneCode();
                }
              }}
              placeholder="____"
              maxLength={4}
            />

            <button
              className="puzzle-submit"
              onClick={submitPhoneCode}
            >
              UNLOCK
            </button>
          </div>
        </div>
      )}

      {/* --------------------------------------
          CCTV PUZZLE
      -------------------------------------- */}

      {puzzle === "cctv" && (
        <div className="puzzle-overlay">
          <div className="puzzle-card">
            <button
              className="close-puzzle"
              onClick={() => setPuzzle(null)}
            >
              ×
            </button>

            <div className="puzzle-icon">
              📺
            </div>

            <span>CCTV ARCHIVE</span>

            <h2>
              Which year?
            </h2>

            <p>
              The archive screen shows:
            </p>

            <div className="archive-screen">
              <strong>
                INCIDENT DATE
              </strong>

              <span>
                CURRENT YEAR - ?
              </span>
            </div>

            <div className="answer-grid">
              {["3", "5", "7", "9"].map(
                (answer) => (
                  <button
                    key={answer}
                    onClick={() =>
                      solveCctv(answer)
                    }
                  >
                    {answer} YEARS AGO
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LastSignal;