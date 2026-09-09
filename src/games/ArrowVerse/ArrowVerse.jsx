import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import GameHeader from "./components/GameHeader";
import PuzzleBoard from "./components/PuzzleBoard";
import HintPanel from "./components/HintPanel";
import GameOver from "./components/GameOver";
import LevelComplete from "./components/LevelComplete";

import { generatePuzzle } from "./arrowGenerator";
import { getHintCosts, getLevelConfig } from "./arrowLevels";
import { canArrowExit } from "./arrowEngine";

import {
  playBlockedSound,
  playCompleteSound,
  playFailSound,
  playHintSound,
  playMoveSound,
  playTapSound,
} from "./arrowSounds";

import "./ArrowVerse.css";

const START_COINS = 250;
const START_LIVES = 3;

export default function ArrowVerse() {
  const navigate = useNavigate();

  /* =========================================================
     LOAD SAVED LEVEL
     ========================================================= */

  const [level, setLevel] = useState(() => {
    const saved = Number(
      localStorage.getItem("arrowverse_level")
    );

    return Number.isFinite(saved) && saved >= 1
      ? saved
      : 1;
  });

  /* =========================================================
     COINS
     ========================================================= */

  const [coins, setCoins] = useState(() => {
    const saved = Number(
      localStorage.getItem("arrowverse_coins")
    );

    return Number.isFinite(saved) && saved >= 0
      ? saved
      : START_COINS;
  });

  /* =========================================================
     ARROWS
     ========================================================= */

  const [arrows, setArrows] = useState(() => {
    const saved = Number(
      localStorage.getItem("arrowverse_level")
    );

    const startLevel =
      Number.isFinite(saved) && saved >= 1
        ? saved
        : 1;

    return generatePuzzle(startLevel);
  });

  /* =========================================================
     GAME STATE
     ========================================================= */

  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);

  const [blockedArrow, setBlockedArrow] = useState(null);
  const [hintArrowId, setHintArrowId] = useState(null);

  /*
   * IMPORTANT
   * Actual moving arrow ID store karenge.
   */
  const [movingArrowId, setMovingArrowId] = useState(null);

  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);

  const [earnedCoins, setEarnedCoins] = useState(0);

  const [soundOn, setSoundOn] = useState(true);

  /*
   * HINT COUNT
   */
  const [hintsUsed, setHintsUsed] = useState(0);

  /* =========================================================
     LEVEL CONFIG
     ========================================================= */

  const config = useMemo(
    () => getLevelConfig(level),
    [level]
  );

  const hintCosts = useMemo(
    () => getHintCosts(level),
    [level]
  );

  /* =========================================================
     HINT DATA
     ========================================================= */

  const hintCostList = useMemo(
    () => [
      Number(hintCosts?.first) || 10,
      Number(hintCosts?.second) || 20,
    ],
    [hintCosts]
  );

  const maxHints = hintCostList.length;

  /* =========================================================
     SAVE PROGRESS
     ========================================================= */

  useEffect(() => {
    localStorage.setItem(
      "arrowverse_level",
      String(level)
    );

    localStorage.setItem(
      "arrowverse_coins",
      String(coins)
    );
  }, [level, coins]);

  /* =========================================================
     SOUND
     ========================================================= */

  function sound(fn) {
    if (
      soundOn &&
      typeof fn === "function"
    ) {
      fn();
    }
  }

  /* =========================================================
     RESET CURRENT LEVEL
     ========================================================= */

  function resetLevel(targetLevel = level) {
    setArrows(
      generatePuzzle(targetLevel)
    );

    setLives(START_LIVES);

    setBlockedArrow(null);
    setHintArrowId(null);
    setMovingArrowId(null);

    setGameOver(false);
    setLevelComplete(false);

    setEarnedCoins(0);

    /*
     * Hints current level ke liye reset.
     */
    setHintsUsed(0);
  }

  /* =========================================================
     RESTART GAME
     ========================================================= */

  function restartGame() {
    setScore(0);

    resetLevel(level);
  }

  /* =========================================================
     ARROW CLICK
     ========================================================= */

  function handleArrowClick(id) {
    /*
     * Ek arrow move ho raha hai to
     * doosra arrow click nahi hoga.
     */
    if (movingArrowId !== null) {
      return;
    }

    if (gameOver || levelComplete) {
      return;
    }

    /*
     * Previous blocked animation clear.
     */
    if (blockedArrow !== null) {
      return;
    }

    const arrow = arrows.find(
      (item) => item?.id === id
    );

    if (!arrow) {
      return;
    }

    sound(playTapSound);

    /*
     * Current arrow ko collision check se
     * remove kar rahe hain.
     */
    const otherArrows = arrows.filter(
      (item) => item?.id !== id
    );

    const movable = canArrowExit(
      arrow,
      otherArrows
    );

    /* =====================================================
       BLOCKED
       ===================================================== */

    if (!movable) {
      setBlockedArrow(id);

      sound(playBlockedSound);

      return;
    }

    /* =====================================================
       MOVING
       ===================================================== */

    setMovingArrowId(id);

    setHintArrowId(null);

    sound(playMoveSound);

    /*
     * IMPORTANT:
     *
     * Arrow ko instantly remove nahi karenge.
     *
     * 700ms tak moving state rahegi.
     *
     * ArrowPath/PuzzleBoard is ID ko receive karega.
     */
    setTimeout(() => {
      setArrows((current) =>
        current.filter(
          (item) => item?.id !== id
        )
      );

      setScore(
        (value) =>
          value + 100 + level * 10
      );

      setMovingArrowId(null);
    }, 700);
  }

  /* =========================================================
     BLOCKED ARROW
     ========================================================= */

  useEffect(() => {
    if (!blockedArrow) {
      return;
    }

    const timer = setTimeout(() => {
      setLives((currentLives) => {
        const nextLives =
          Math.max(0, currentLives - 1);

        sound(playFailSound);

        if (nextLives <= 0) {
          setGameOver(true);
        }

        return nextLives;
      });

      setBlockedArrow(null);
    }, 520);

    return () => {
      clearTimeout(timer);
    };
  }, [blockedArrow]);

  /* =========================================================
     LEVEL COMPLETE
     ========================================================= */

  useEffect(() => {
    /*
     * Board clear hona chahiye.
     */
    if (arrows.length !== 0) {
      return;
    }

    /*
     * Arrow movement complete hone do.
     */
    if (movingArrowId !== null) {
      return;
    }

    if (gameOver) {
      return;
    }

    if (levelComplete) {
      return;
    }

    const reward =
      Number(config?.reward) || 0;

    setEarnedCoins(reward);

    setCoins((value) =>
      value + reward
    );

    setLevelComplete(true);

    sound(playCompleteSound);

    /*
     * IMPORTANT:
     *
     * Current level complete.
     * Next incomplete level save.
     *
     * Example:
     *
     * Level 5 complete
     * localStorage = 6
     *
     * User browser close karega.
     * Next time Level 6 open hoga.
     */
    const nextLevel = level + 1;

    localStorage.setItem(
      "arrowverse_level",
      String(nextLevel)
    );
  }, [
    arrows.length,
    movingArrowId,
    gameOver,
    levelComplete,
    config?.reward,
    level,
  ]);

  /* =========================================================
     USE HINT
     ========================================================= */

  function buyHint({
    cost,
    hintNumber,
  }) {
    /*
     * Game running nahi hona chahiye.
     */
    if (movingArrowId !== null) {
      return;
    }

    if (gameOver || levelComplete) {
      return;
    }

    if (!arrows.length) {
      return;
    }

    /*
     * Maximum hints check.
     */
    if (hintsUsed >= maxHints) {
      return;
    }

    const numericCost =
      Number(cost) || 0;

    /*
     * Coins check.
     */
    if (coins < numericCost) {
      return;
    }

    /*
     * Remaining arrows.
     */
    const remaining =
      arrows.filter(
        (arrow) =>
          arrow &&
          !arrow.removed
      );

    if (!remaining.length) {
      return;
    }

    let target = null;

    /* =====================================================
       FIRST HINT
       Find movable arrow
       ===================================================== */

    if (hintNumber === 1) {
      target = remaining.find(
        (arrow) => {
          const others =
            remaining.filter(
              (item) =>
                item.id !== arrow.id
            );

          return canArrowExit(
            arrow,
            others
          );
        }
      );
    }

    /* =====================================================
       SECOND HINT
       Shortest path
       ===================================================== */

    if (hintNumber === 2) {
      target = [...remaining].sort(
        (a, b) =>
          (a.points?.length || 0) -
          (b.points?.length || 0)
      )[0];
    }

    /*
     * Fallback.
     */
    if (!target) {
      target = remaining[0];
    }

    /*
     * Coins subtract.
     */
    setCoins((value) =>
      Math.max(
        0,
        value - numericCost
      )
    );

    /*
     * Hint count increase.
     */
    setHintsUsed((value) =>
      Math.min(
        maxHints,
        value + 1
      )
    );

    /*
     * Highlight arrow.
     */
    setHintArrowId(target.id);

    sound(playHintSound);

    /*
     * Hint 2.2 sec visible.
     */
    setTimeout(() => {
      setHintArrowId(null);
    }, 2200);
  }

  /* =========================================================
     NEXT LEVEL
     ========================================================= */

  function nextLevel() {
    const next =
      level + 1;

    /*
     * Change level.
     */
    setLevel(next);

    /*
     * New puzzle.
     */
    setArrows(
      generatePuzzle(next)
    );

    /*
     * Reset lives.
     */
    setLives(START_LIVES);

    /*
     * Bonus score.
     */
    setScore(
      (value) =>
        value + 250
    );

    /*
     * Reset states.
     */
    setLevelComplete(false);
    setGameOver(false);

    setEarnedCoins(0);

    setBlockedArrow(null);
    setHintArrowId(null);
    setMovingArrowId(null);

    /*
     * Reset hints.
     */
    setHintsUsed(0);

    /*
     * Save immediately.
     */
    localStorage.setItem(
      "arrowverse_level",
      String(next)
    );
  }

  /* =========================================================
     REPLAY LEVEL
     ========================================================= */

  function replayLevel() {
    resetLevel(level);
  }

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="arrowverse-page">

      {/* =====================================================
          GAME HEADER
          ===================================================== */}

      <GameHeader
        level={level}
        lives={lives}
        score={score}
        coins={coins}
        onBack={() =>
          navigate("/")
        }
        onRestart={restartGame}
        soundEnabled={soundOn}
        onToggleSound={() =>
          setSoundOn(
            (value) => !value
          )
        }
      />

      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="arrowverse-main">

        {/* ===================================================
            INTRO
            =================================================== */}

        <section className="game-intro">

          <div>

            <p className="eyebrow">
              NEON PUZZLE LAB
            </p>

            <h1>
              Arrow Escape
            </h1>

            <p>
              Clear every colorful arrow
              by releasing it in the
              direction shown at its tip.
            </p>

          </div>

          <div className="difficulty-chip">

            <span
              className={`difficulty-dot ${String(
                config?.difficulty || "normal"
              ).toLowerCase()}`}
            />

            {config?.difficulty || "Normal"}

          </div>

        </section>

        {/* ===================================================
            GAME LAYOUT
            =================================================== */}

        <section className="game-layout">

          {/* =================================================
              BOARD
              ================================================= */}

          <div className="board-column">

            <PuzzleBoard
              arrows={arrows}
              onArrowClick={
                handleArrowClick
              }
              blockedArrow={
                blockedArrow
              }
              hintArrowId={
                hintArrowId
              }
              movingArrowId={
                movingArrowId
              }
            />

            {/* ===============================================
                BOTTOM INFO
                =============================================== */}

            <div className="bottom-info">

              <div className="info-card">

                <span>
                  ❤️
                </span>

                <div>

                  <b>
                    {lives} CHANCES LEFT
                  </b>

                  <small>
                    Third mistake ends the run.
                  </small>

                </div>

              </div>

              <div className="info-card">

                <span>
                  🎯
                </span>

                <div>

                  <b>
                    FIND THE WAY OUT
                  </b>

                  <small>
                    Free arrows first,
                    blocked arrows later.
                  </small>

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              SIDE COLUMN
              ================================================= */}

          <div className="side-column">

            {/* ===============================================
                HINT PANEL
                =============================================== */}

            <HintPanel
              coins={coins}
              hintsUsed={hintsUsed}
              maxHints={maxHints}
              hintCosts={hintCostList}
              onUseHint={
                buyHint
              }
              disabled={
                movingArrowId !== null ||
                gameOver ||
                levelComplete
              }
            />

            {/* ===============================================
                HOW TO PLAY
                =============================================== */}

            <div className="how-to-card">

              <h3>
                🎮 HOW TO PLAY
              </h3>

              <ol>

                <li>
                  Tap anywhere on an arrow.
                </li>

                <li>
                  The arrow follows its own path.
                </li>

                <li>
                  It exits from the direction
                  of its arrowhead.
                </li>

                <li>
                  If another path blocks it,
                  you lose a chance.
                </li>

                <li>
                  Clear the whole board to
                  unlock the next level.
                </li>

              </ol>

            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          GAME OVER
          ===================================================== */}

      {gameOver && (
        <GameOver
          score={score}
          coins={coins}
          level={level}
          onPlayAgain={
            restartGame
          }
          onBack={() =>
            navigate("/")
          }
        />
      )}

      {/* =====================================================
          LEVEL COMPLETE
          ===================================================== */}

      {levelComplete && (
        <LevelComplete
          level={level}
          score={score}
          coinsEarned={
            earnedCoins
          }
          totalCoins={coins}
          onNextLevel={
            nextLevel
          }
          onReplay={
            replayLevel
          }
          onBack={() =>
            navigate("/")
          }
        />
      )}

    </div>
  );
}