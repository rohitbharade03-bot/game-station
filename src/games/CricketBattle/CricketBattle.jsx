import React, { useState, useEffect, useCallback, useRef } from "react";
import "./CricketBattle.css";

const TARGET = 36;
const MAX_BALLS = 18; // 3 overs
const MAX_WICKETS = 3;

const BASE_PROBS = {
  drive: [
    { runs: 0, weight: 12 },
    { runs: 1, weight: 22 },
    { runs: 2, weight: 22 },
    { runs: 4, weight: 28 },
    { runs: 6, weight: 8 },
    { runs: "out", weight: 8 },
  ],
  loft: [
    { runs: 0, weight: 8 },
    { runs: 1, weight: 10 },
    { runs: 2, weight: 12 },
    { runs: 4, weight: 25 },
    { runs: 6, weight: 28 },
    { runs: "out", weight: 17 },
  ],
  defend: [
    { runs: 0, weight: 38 },
    { runs: 1, weight: 32 },
    { runs: 2, weight: 22 },
    { runs: 4, weight: 5 },
    { runs: 6, weight: 0 },
    { runs: "out", weight: 3 },
  ],
};

function getOutcome(shot, timingQuality, isPowerPlay) {
  let list = BASE_PROBS[shot].map((item) => ({ ...item }));

  // Timing modifiers
  if (timingQuality === "perfect") {
    list = list.map((item) => {
      if (item.runs === 4 || item.runs === 6) return { ...item, weight: item.weight * 1.8 };
      if (item.runs === "out") return { ...item, weight: item.weight * 0.35 };
      return item;
    });
  } else if (timingQuality === "good") {
    list = list.map((item) => {
      if (item.runs === 4 || item.runs === 6) return { ...item, weight: item.weight * 1.25 };
      if (item.runs === "out") return { ...item, weight: item.weight * 0.7 };
      return item;
    });
  } else if (timingQuality === "poor") {
    list = list.map((item) => {
      if (item.runs === "out") return { ...item, weight: item.weight * 2.2 };
      if (item.runs === 4 || item.runs === 6) return { ...item, weight: item.weight * 0.4 };
      return item;
    });
  }

  // Power Play boost
  if (isPowerPlay) {
    list = list.map((item) => {
      if (item.runs === 6) return { ...item, weight: item.weight * 1.9 };
      if (item.runs === 4) return { ...item, weight: item.weight * 1.3 };
      if (item.runs === "out") return { ...item, weight: item.weight * 0.6 };
      return item;
    });
  }

  const total = list.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of list) {
    if (r < item.weight) return item.runs;
    r -= item.weight;
  }
  return 0;
}

const commentary = {
  four: ["FOUR! Beautifully timed!", "Crashed to the boundary!", "That raced away!", "CLASSY FOUR!"],
  six: ["SIX! Into the stands!", "MASSIVE HIT!", "Out of the ground!", "WHAT A STRIKE!"],
  out: ["OUT! Clean bowled!", "Caught in the deep!", "Edged and gone!", "Timberrr!"],
  dot: ["Solid defence", "No run", "Good length, dot ball"],
  single: ["Quick single", "Pushed for one", "Good running"],
  double: ["Two runs taken", "Excellent running between wickets"],
  perfect: ["PERFECT TIMING!", "Sweet spot!", "Textbook shot!"],
  power: ["POWER PLAY ACTIVATED!", "He's on fire!", "Unstoppable!"],
};

function randomMsg(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const CricketBattle = () => {
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(MAX_BALLS);
  const [ballsFaced, setBallsFaced] = useState(0);
  const [status, setStatus] = useState("ready"); // ready | bowling | timing | result | won | lost
  const [message, setMessage] = useState("GET READY!");
  const [subMessage, setSubMessage] = useState("");
  const [ballAnim, setBallAnim] = useState("");
  const [shotAnim, setShotAnim] = useState("");
  const [selectedShot, setSelectedShot] = useState(null);
  const [heat, setHeat] = useState(0); // 0-5
  const [isPowerPlay, setIsPowerPlay] = useState(false);
  const [timingPos, setTimingPos] = useState(0);
  const [timingQuality, setTimingQuality] = useState(null);
  const [showTiming, setShowTiming] = useState(false);

  const timingRef = useRef(null);
  const timeoutRef = useRef(null);
  const heatTimeout = useRef(null);

  const runsRequired = Math.max(0, TARGET - score);
  const overs = `${Math.floor(ballsFaced / 6)}.${ballsFaced % 6}`;

  const resetGame = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (timingRef.current) cancelAnimationFrame(timingRef.current);
    if (heatTimeout.current) clearTimeout(heatTimeout.current);
    setScore(0);
    setWickets(0);
    setBallsLeft(MAX_BALLS);
    setBallsFaced(0);
    setStatus("ready");
    setMessage("GET READY!");
    setSubMessage("");
    setBallAnim("");
    setShotAnim("");
    setSelectedShot(null);
    setHeat(0);
    setIsPowerPlay(false);
    setTimingPos(0);
    setTimingQuality(null);
    setShowTiming(false);
  }, []);

  const startBowl = useCallback(() => {
    if (status !== "ready" && status !== "result") return;
    setStatus("bowling");
    setMessage("BOWLED!");
    setSubMessage("");
    setBallAnim("ball-bowl");
    setShotAnim("");
    setSelectedShot(null);
    setTimingQuality(null);
    setShowTiming(false);

    timeoutRef.current = setTimeout(() => {
      setStatus("timing");
      setMessage("TIME YOUR SHOT!");
      setShowTiming(true);
      setTimingPos(0);

      // Start timing bar animation
      let start = null;
      const duration = 1400; // ms for full sweep
      const animate = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        // Ping-pong motion
        const pos = progress < 0.5 ? progress * 2 : 2 - progress * 2;
        setTimingPos(pos * 100);
        if (progress < 1) {
          timingRef.current = requestAnimationFrame(animate);
        } else {
          // Auto miss if player never clicked
          setStatus("result");
          setShowTiming(false);
          setMessage("TOO LATE!");
          setSubMessage("Missed the ball");
          setTimingQuality("poor");
          finishBall("defend", "poor");
        }
      };
      timingRef.current = requestAnimationFrame(animate);
    }, 850);
  }, [status]);

  const finishBall = useCallback(
    (shot, quality) => {
      const outcome = getOutcome(shot, quality, isPowerPlay);
      let newScore = score;
      let newWickets = wickets;
      let newBalls = ballsLeft - 1;
      let newFaced = ballsFaced + 1;
      let newHeat = heat;

      if (outcome === "out") {
        newWickets += 1;
        newHeat = 0;
        setIsPowerPlay(false);
        setMessage(randomMsg(commentary.out));
        setSubMessage("Wicket!");
        setBallAnim("ball-out");
      } else {
        newScore += outcome;
        if (outcome >= 4) {
          newHeat = Math.min(5, heat + 2);
        } else if (outcome > 0) {
          newHeat = Math.min(5, heat + 1);
        } else {
          newHeat = Math.max(0, heat - 1);
        }

        if (outcome === 0) {
          setMessage(randomMsg(commentary.dot));
          setBallAnim("ball-run");
        } else if (outcome === 1) {
          setMessage(randomMsg(commentary.single));
          setBallAnim("ball-run");
        } else if (outcome === 2) {
          setMessage(randomMsg(commentary.double));
          setBallAnim("ball-run");
        } else if (outcome === 4) {
          setMessage(randomMsg(commentary.four));
          setSubMessage(quality === "perfect" ? randomMsg(commentary.perfect) : "");
          setBallAnim("ball-four");
        } else if (outcome === 6) {
          setMessage(randomMsg(commentary.six));
          setSubMessage(quality === "perfect" ? "UNBELIEVABLE!" : "");
          setBallAnim("ball-six");
        }
      }

      // Activate Power Play
      if (newHeat >= 5 && !isPowerPlay) {
        setIsPowerPlay(true);
        setSubMessage(randomMsg(commentary.power));
        if (heatTimeout.current) clearTimeout(heatTimeout.current);
        heatTimeout.current = setTimeout(() => {
          setIsPowerPlay(false);
          setHeat(3);
        }, 12000); // 12 seconds of power
      }

      setScore(newScore);
      setWickets(newWickets);
      setBallsLeft(newBalls);
      setBallsFaced(newFaced);
      setHeat(newHeat);

      timeoutRef.current = setTimeout(() => {
        if (newScore >= TARGET) {
          setStatus("won");
          setMessage("YOU WON! 🏆");
          setSubMessage(`Chased ${TARGET} in ${newFaced} balls`);
        } else if (newWickets >= MAX_WICKETS || newBalls <= 0) {
          setStatus("lost");
          setMessage("GAME OVER");
          setSubMessage(newWickets >= MAX_WICKETS ? "All out!" : "Balls finished");
        } else {
          setStatus("ready");
          setMessage("GET READY!");
          setSubMessage("");
          setBallAnim("");
          setShotAnim("");
          setSelectedShot(null);
          setShowTiming(false);
        }
      }, 1700);
    },
    [score, wickets, ballsLeft, ballsFaced, heat, isPowerPlay]
  );

  const playShot = useCallback(
    (shot) => {
      if (status !== "timing") return;

      // Calculate quality from current timing position
      // Green zone: 42-58, Yellow: 28-42 & 58-72, Red: rest
      let quality = "poor";
      if (timingPos >= 42 && timingPos <= 58) quality = "perfect";
      else if ((timingPos >= 28 && timingPos < 42) || (timingPos > 58 && timingPos <= 72)) quality = "good";

      if (timingRef.current) cancelAnimationFrame(timingRef.current);

      setSelectedShot(shot);
      setTimingQuality(quality);
      setShowTiming(false);
      setStatus("result");
      setShotAnim(`shot-${shot}`);

      if (quality === "perfect") {
        setMessage("PERFECT TIMING!");
      }

      finishBall(shot, quality);
    },
    [status, timingPos, finishBall]
  );

  // Keyboard
  useEffect(() => {
    const handleKey = (e) => {
      if (status === "ready" || status === "result") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          startBowl();
        }
      }
      if (status === "timing") {
        if (e.key === "a" || e.key === "A" || e.key === "1") playShot("drive");
        if (e.key === "s" || e.key === "S" || e.key === "2") playShot("loft");
        if (e.key === "d" || e.key === "D" || e.key === "3") playShot("defend");
      }
      if ((status === "won" || status === "lost") && (e.key === "r" || e.key === "R")) {
        resetGame();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [status, startBowl, playShot, resetGame]);

  // Auto first ball
  useEffect(() => {
    if (status === "ready" && ballsLeft === MAX_BALLS && score === 0) {
      const t = setTimeout(startBowl, 900);
      return () => clearTimeout(t);
    }
  }, [status, ballsLeft, score, startBowl]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (timingRef.current) cancelAnimationFrame(timingRef.current);
      if (heatTimeout.current) clearTimeout(heatTimeout.current);
    };
  }, []);

  return (
    <div className={`cb-root ${isPowerPlay ? "power-play" : ""}`}>
      {/* HUD */}
      <header className="cb-hud">
        <div className="cb-title">CRICKET BATTLE</div>
        <div className="cb-stats">
          <div className="cb-stat">
            <span className="cb-label">Score</span>
            <span className="cb-value">{score}/{wickets}</span>
          </div>
          <div className="cb-stat">
            <span className="cb-label">Overs</span>
            <span className="cb-value">{overs}</span>
          </div>
          <div className="cb-stat highlight">
            <span className="cb-label">Target</span>
            <span className="cb-value">{TARGET}</span>
          </div>
          <div className="cb-stat">
            <span className="cb-label">Need</span>
            <span className="cb-value need">{runsRequired}</span>
          </div>
        </div>

        {/* Heat / Momentum Bar */}
        <div className="cb-heat-wrap">
          <div className="cb-heat-label">
            {isPowerPlay ? "🔥 POWER PLAY" : "MOMENTUM"}
          </div>
          <div className="cb-heat-bar">
            <div
              className="cb-heat-fill"
              style={{ width: `${(heat / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Stadium */}
      <div className="cb-stadium">
        <div className="cb-crowd top"></div>
        <div className="cb-crowd left"></div>
        <div className="cb-crowd right"></div>

        <div className={`cb-field ${ballAnim === "ball-six" || ballAnim === "ball-four" ? "cheer" : ""}`}>
          <div className="cb-boundary"></div>
          <div className="cb-pitch">
            <div className="cb-crease batsman-crease"></div>
            <div className="cb-crease bowler-crease"></div>
            <div className="cb-wickets batsman-end">
              <div className="stump"></div>
              <div className="stump"></div>
              <div className="stump"></div>
              <div className="bails"></div>
            </div>
            <div className="cb-wickets bowler-end">
              <div className="stump"></div>
              <div className="stump"></div>
              <div className="stump"></div>
            </div>
          </div>

          <div className={`cb-batsman ${shotAnim}`}>
            <div className="bat"></div>
            <div className="body">🏏</div>
          </div>
          <div className="cb-bowler">
            <div className="body">🤾</div>
          </div>

          <div className={`cb-ball ${ballAnim}`}></div>

          {/* Six / Four particles */}
          {(ballAnim === "ball-six" || ballAnim === "ball-four") && (
            <div className="cb-particles">
              {[...Array(8)].map((_, i) => (
                <span key={i} className="particle" style={{ "--i": i }}></span>
              ))}
            </div>
          )}
        </div>

        {/* Message */}
        <div className={`cb-message ${status === "result" || status === "timing" || status === "bowling" ? "show" : ""}`}>
          <div className="main-msg">{message}</div>
          {subMessage && <div className="sub-msg">{subMessage}</div>}
        </div>

        {/* Timing Bar */}
        {showTiming && (
          <div className="cb-timing">
            <div className="cb-timing-track">
              <div className="zone red left"></div>
              <div className="zone yellow left"></div>
              <div className="zone green"></div>
              <div className="zone yellow right"></div>
              <div className="zone red right"></div>
              <div
                className="cb-timing-marker"
                style={{ left: `${timingPos}%` }}
              ></div>
            </div>
            <div className="cb-timing-hint">Hit the GREEN zone!</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="cb-controls">
        {(status === "ready" || status === "result") && (
          <button className="cb-btn primary large" onClick={startBowl}>
            🏏 BOWL NEXT
          </button>
        )}

        {status === "timing" && (
          <div className="cb-shot-buttons">
            <button
              className={`cb-btn shot drive ${selectedShot === "drive" ? "active" : ""}`}
              onClick={() => playShot("drive")}
            >
              🏏 DRIVE
              <span className="hint">A / 1</span>
            </button>
            <button
              className={`cb-btn shot loft ${selectedShot === "loft" ? "active" : ""}`}
              onClick={() => playShot("loft")}
            >
              🚀 LOFT
              <span className="hint">S / 2</span>
            </button>
            <button
              className={`cb-btn shot defend ${selectedShot === "defend" ? "active" : ""}`}
              onClick={() => playShot("defend")}
            >
              🛡️ DEFEND
              <span className="hint">D / 3</span>
            </button>
          </div>
        )}
      </div>

      {/* Win Overlay */}
      {status === "won" && (
        <div className="cb-overlay win">
          <div className="cb-overlay-card">
            <div className="cb-trophy">🏆</div>
            <h1>YOU WON!</h1>
            <p>Target Chased Successfully</p>
            <div className="cb-final">Score: <strong>{score}/{wickets}</strong></div>
            <div className="cb-final">Balls: {ballsFaced}</div>
            <button className="cb-btn primary large" onClick={resetGame}>
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Lose Overlay */}
      {status === "lost" && (
        <div className="cb-overlay lose">
          <div className="cb-overlay-card">
            <div className="cb-sad">🏏</div>
            <h1>GAME OVER</h1>
            <div className="cb-final">Final: <strong>{score}/{wickets}</strong></div>
            <div className="cb-final">Needed {runsRequired} more</div>
            <button className="cb-btn primary large" onClick={resetGame}>
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CricketBattle;