import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./TicTacToe.css";

/* =========================================================
   LOGO TIC-TAC-TOE / ELEMENT DUEL
   ========================================================= */

const LOGOS = ["🔥", "⚡", "❄️", "🌑", "🌟", "💎", "🍀", "☄️"];
const AI_LOGO = "🤖";
const MAX_MARKS = 3;

const MODES = {
  FRIEND: "friend",
  COMPUTER: "computer",
};

const DIFFICULTIES = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
};

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const EMPTY_BOARD = Array(9).fill(null);

function getWinner(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (
      board[a] &&
      board[a] === board[b] &&
      board[b] === board[c]
    ) {
      return {
        winner: board[a],
        line,
      };
    }
  }

  return null;
}

function getAvailableCells(board) {
  return board
    .map((value, index) => (value === null ? index : null))
    .filter((value) => value !== null);
}

function getPositions(board, logo) {
  return board
    .map((value, index) => (value === logo ? index : null))
    .filter((value) => value !== null);
}

function randomItem(items) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function getWinningMove(board, logo) {
  for (const cell of getAvailableCells(board)) {
    const next = [...board];
    next[cell] = logo;

    if (getWinner(next)?.winner === logo) {
      return cell;
    }
  }

  return null;
}

function getForkMove(board, logo) {
  for (const cell of getAvailableCells(board)) {
    const test = [...board];
    test[cell] = logo;

    let winningChoices = 0;

    for (const nextCell of getAvailableCells(test)) {
      const next = [...test];
      next[nextCell] = logo;

      if (getWinner(next)?.winner === logo) {
        winningChoices++;
      }
    }

    if (winningChoices >= 2) {
      return cell;
    }
  }

  return null;
}

function getPlacementMove(board, aiLogo, userLogo, difficulty) {
  const empty = getAvailableCells(board);
  if (!empty.length) return null;

  // EASY: simple/random.
  if (difficulty === DIFFICULTIES.EASY) {
    return randomItem(empty);
  }

  // MEDIUM/HARD: win first.
  const winningMove = getWinningMove(board, aiLogo);
  if (winningMove !== null) return winningMove;

  // MEDIUM/HARD: block the player.
  const blockMove = getWinningMove(board, userLogo);
  if (blockMove !== null) return blockMove;

  // HARD: create/block forks.
  if (difficulty === DIFFICULTIES.HARD) {
    const fork = getForkMove(board, aiLogo);
    if (fork !== null) return fork;

    const blockFork = getForkMove(board, userLogo);
    if (blockFork !== null) return blockFork;
  }

  // Center.
  if (board[4] === null) return 4;

  // Corners.
  const corners = [0, 2, 6, 8].filter(
    (index) => board[index] === null
  );

  if (corners.length) {
    return randomItem(corners);
  }

  return randomItem(empty);
}

/*
  When a logo already has 3 marks:
  AI can move ANY one of its existing marks.

  HARD tries every AI mark + empty target and evaluates:
  1. Immediate AI win
  2. Immediate player threat block
  3. Strategic board value
*/
function getMovePhaseMove(
  board,
  aiLogo,
  userLogo,
  difficulty
) {
  const empty = getAvailableCells(board);
  const aiPositions = getPositions(board, aiLogo);

  if (!empty.length || !aiPositions.length) {
    return null;
  }

  const candidates = [];

  for (const from of aiPositions) {
    for (const to of empty) {
      const test = [...board];
      test[from] = null;
      test[to] = aiLogo;

      const winner = getWinner(test)?.winner;

      let score = 0;

      if (winner === aiLogo) score += 100000;
      if (winner === userLogo) score -= 100000;

      const aiWinNext = getWinningMove(test, aiLogo);
      if (aiWinNext !== null) score += 250;

      const userWinNext = getWinningMove(test, userLogo);
      if (userWinNext !== null) score -= 220;

      // Prefer center/corners in strategic modes.
      if (to === 4) score += 30;
      if ([0, 2, 6, 8].includes(to)) score += 14;

      // Prefer preserving strong lines.
      for (const line of WIN_LINES) {
        const values = line.map((index) => test[index]);
        const aiCount = values.filter((v) => v === aiLogo).length;
        const userCount = values.filter((v) => v === userLogo).length;

        if (aiCount === 2 && userCount === 0) score += 45;
        if (userCount === 2 && aiCount === 0) score -= 55;
      }

      candidates.push({
        from,
        to,
        score,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (difficulty === DIFFICULTIES.EASY) {
    return randomItem(candidates);
  }

  if (difficulty === DIFFICULTIES.MEDIUM) {
    const top = candidates.slice(0, Math.min(4, candidates.length));
    return randomItem(top);
  }

  return candidates[0];
}

function getWinningLineCoordinates(line) {
  const points = {
    0: [50, 50],
    1: [150, 50],
    2: [250, 50],
    3: [50, 150],
    4: [150, 150],
    5: [250, 150],
    6: [50, 250],
    7: [150, 250],
    8: [250, 250],
  };

  const [x1, y1] = points[line[0]];
  const [x2, y2] = points[line[2]];

  return {
    x1,
    y1,
    x2,
    y2,
  };
}

function TicTacToe() {
  const audioContextRef = useRef(null);
  const winSoundPlayedRef = useRef(false);

  // Screens:
  // mode -> logo-user -> logo-friend / difficulty -> game
  const [screen, setScreen] = useState("mode");

  const [mode, setMode] = useState(null);
  const [difficulty, setDifficulty] = useState(null);

  const [userLogo, setUserLogo] = useState(null);
  const [friendLogo, setFriendLogo] = useState(null);
  const [aiLogo] = useState(AI_LOGO);

  const [board, setBoard] = useState(EMPTY_BOARD);
  const [markOrder, setMarkOrder] = useState({
    user: [],
    opponent: [],
  });

  const [currentSide, setCurrentSide] = useState("user");
  const [selectedMark, setSelectedMark] = useState(null);

  const [status, setStatus] = useState("playing");
  const [winningLine, setWinningLine] = useState([]);

  const [message, setMessage] = useState("CHOOSE GAME MODE");

  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const [roundNumber, setRoundNumber] = useState(1);
  const [isComputerThinking, setIsComputerThinking] =
    useState(false);

  const [lastMove, setLastMove] = useState(null);

  const currentUserLogo =
    mode === MODES.FRIEND ? userLogo : userLogo;

  const currentOpponentLogo =
    mode === MODES.FRIEND ? friendLogo : aiLogo;

  const currentPlayerLogo =
    currentSide === "user"
      ? currentUserLogo
      : currentOpponentLogo;

  const currentPlayerName =
    currentSide === "user"
      ? "YOU"
      : mode === MODES.COMPUTER
        ? "AI"
        : "FRIEND";

  const currentPlayerPositions =
    currentSide === "user"
      ? markOrder.user
      : markOrder.opponent;

  const isGameOver = status !== "playing";

  const availableUserLogos = useMemo(
    () => LOGOS.filter((logo) => logo !== friendLogo),
    [friendLogo]
  );

  const availableFriendLogos = useMemo(
    () => LOGOS.filter((logo) => logo !== userLogo),
    [userLogo]
  );

  const playTone = useCallback(
    (frequency = 440, duration = 0.1, type = "sine") => {
      try {
        const AudioContext =
          window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) return;

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        const ctx = audioContextRef.current;

        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
          frequency,
          ctx.currentTime
        );

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.16,
          ctx.currentTime + 0.015
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          ctx.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + duration + 0.02);
      } catch {
        // Sound is optional.
      }
    },
    []
  );

  const playWinSound = useCallback(() => {
    playTone(523.25, 0.16, "sine");

    setTimeout(
      () => playTone(659.25, 0.16, "sine"),
      130
    );

    setTimeout(
      () => playTone(783.99, 0.34, "sine"),
      260
    );
  }, [playTone]);

  const finishGame = useCallback(
    (winner, line) => {
      setStatus(winner);
      setWinningLine(line || []);
      setSelectedMark(null);
      setIsComputerThinking(false);

      if (winner === userLogo) {
        setUserScore((value) => value + 1);
        setMessage(
          mode === MODES.COMPUTER
            ? `🏆 YOU WIN ${userLogo}`
            : `🏆 YOU WIN ${userLogo}`
        );
      } else if (winner === currentOpponentLogo) {
        setOpponentScore((value) => value + 1);
        setMessage(
          mode === MODES.COMPUTER
            ? `🤖 AI WINS ${aiLogo}`
            : `🏆 FRIEND WINS ${friendLogo}`
        );
      } else {
        setMessage("🤝 DRAW");
      }
    },
    [
      userLogo,
      currentOpponentLogo,
      mode,
      aiLogo,
      friendLogo,
    ]
  );

  const checkGameEnd = useCallback(
    (nextBoard) => {
      const result = getWinner(nextBoard);

      if (result) {
        finishGame(result.winner, result.line);
        return true;
      }

      return false;
    },
    [finishGame]
  );

  const getStarterForRound = useCallback(
    (round) => {
      if (mode === MODES.COMPUTER) {
        // Round 1 AI, Round 2 User, Round 3 AI...
        return round % 2 === 1 ? "opponent" : "user";
      }

      // Friend mode:
      // Round 1 user, Round 2 friend, Round 3 user...
      return round % 2 === 1 ? "user" : "opponent";
    },
    [mode]
  );

  const resetBoardForRound = useCallback(
    (round = roundNumber) => {
      const starter = getStarterForRound(round);

      winSoundPlayedRef.current = false;

      setBoard(EMPTY_BOARD);
      setMarkOrder({
        user: [],
        opponent: [],
      });
      setWinningLine([]);
      setSelectedMark(null);
      setLastMove(null);
      setStatus("playing");
      setIsComputerThinking(false);
      setCurrentSide(starter);

      if (starter === "opponent") {
        setMessage(
          mode === MODES.COMPUTER
            ? "🤖 AI STARTS THIS ROUND"
            : "FRIEND STARTS THIS ROUND"
        );
      } else {
        setMessage("YOUR TURN — PLACE YOUR LOGO");
      }
    },
    [getStarterForRound, mode, roundNumber]
  );

  const startRoundAfterLogoSelection = useCallback(
    (selectedMode, selectedDifficulty) => {
      setMode(selectedMode);
      setDifficulty(selectedDifficulty);

      setRoundNumber(1);
      setUserScore(0);
      setOpponentScore(0);

      const starter =
        selectedMode === MODES.COMPUTER
          ? "opponent"
          : "user";

      setCurrentSide(starter);
      setBoard(EMPTY_BOARD);
      setMarkOrder({
        user: [],
        opponent: [],
      });
      setWinningLine([]);
      setSelectedMark(null);
      setLastMove(null);
      setStatus("playing");
      setIsComputerThinking(false);
      setScreen("game");

      if (starter === "opponent") {
        setMessage(
          selectedMode === MODES.COMPUTER
            ? "🤖 AI STARTS THIS ROUND"
            : "FRIEND STARTS THIS ROUND"
        );
      } else {
        setMessage("YOUR TURN — PLACE YOUR LOGO");
      }
    },
    []
  );

  const selectMode = (selectedMode) => {
    setMode(selectedMode);
    setDifficulty(null);
    setUserLogo(null);
    setFriendLogo(null);

    if (selectedMode === MODES.COMPUTER) {
      setScreen("difficulty");
    } else {
      setScreen("user-logo");
    }
  };

  const selectDifficulty = (value) => {
    setDifficulty(value);
    setScreen("user-logo");
  };

  const chooseUserLogo = (logo) => {
    setUserLogo(logo);

    if (mode === MODES.COMPUTER) {
      startRoundAfterLogoSelection(
        MODES.COMPUTER,
        difficulty || DIFFICULTIES.MEDIUM
      );
    } else {
      setScreen("friend-logo");
    }
  };

  const chooseFriendLogo = (logo) => {
    if (logo === userLogo) return;

    setFriendLogo(logo);
    startRoundAfterLogoSelection(
      MODES.FRIEND,
      null
    );
  };

  const backToMenu = () => {
    setScreen("mode");
    setMode(null);
    setDifficulty(null);
    setUserLogo(null);
    setFriendLogo(null);

    setBoard(EMPTY_BOARD);
    setMarkOrder({
      user: [],
      opponent: [],
    });

    setCurrentSide("user");
    setSelectedMark(null);
    setStatus("playing");
    setWinningLine([]);
    setLastMove(null);
    setIsComputerThinking(false);
    setMessage("CHOOSE GAME MODE");
  };

  const placeNewMark = useCallback(
    (cellIndex, side) => {
      const logo =
        side === "user"
          ? userLogo
          : currentOpponentLogo;

      if (!logo || board[cellIndex] !== null) {
        return false;
      }

      const nextBoard = [...board];
      nextBoard[cellIndex] = logo;

      const nextOrder = {
        user: [...markOrder.user],
        opponent: [...markOrder.opponent],
      };

      nextOrder[side].push(cellIndex);

      setBoard(nextBoard);
      setMarkOrder(nextOrder);

      setLastMove({
        from: null,
        to: cellIndex,
        side,
        logo,
        type: "place",
      });

      playTone(
        side === "user" ? 520 : 390,
        0.08,
        "triangle"
      );

      if (checkGameEnd(nextBoard)) {
        return true;
      }

      setSelectedMark(null);

      const nextSide =
        side === "user" ? "opponent" : "user";

      setCurrentSide(nextSide);

      if (nextSide === "opponent") {
        setMessage(
          mode === MODES.COMPUTER
            ? "🤖 AI TURN..."
            : "FRIEND — YOUR TURN"
        );
      } else {
        setMessage("YOUR TURN — PLACE OR MOVE YOUR LOGO");
      }

      return true;
    },
    [
      userLogo,
      currentOpponentLogo,
      board,
      markOrder,
      playTone,
      checkGameEnd,
      mode,
    ]
  );

  const moveExistingMark = useCallback(
    (fromIndex, toIndex, side) => {
      const logo =
        side === "user"
          ? userLogo
          : currentOpponentLogo;

      if (
        !logo ||
        board[fromIndex] !== logo ||
        board[toIndex] !== null
      ) {
        return false;
      }

      const nextBoard = [...board];
      nextBoard[fromIndex] = null;
      nextBoard[toIndex] = logo;

      const nextOrder = {
        user: [...markOrder.user],
        opponent: [...markOrder.opponent],
      };

      const indexInOrder =
        nextOrder[side].indexOf(fromIndex);

      if (indexInOrder !== -1) {
        nextOrder[side].splice(indexInOrder, 1);
      }

      nextOrder[side].push(toIndex);

      setBoard(nextBoard);
      setMarkOrder(nextOrder);

      setLastMove({
        from: fromIndex,
        to: toIndex,
        side,
        logo,
        type: "move",
      });

      playTone(
        side === "user" ? 620 : 430,
        0.1,
        "triangle"
      );

      if (checkGameEnd(nextBoard)) {
        return true;
      }

      setSelectedMark(null);

      const nextSide =
        side === "user" ? "opponent" : "user";

      setCurrentSide(nextSide);

      if (nextSide === "opponent") {
        setMessage(
          mode === MODES.COMPUTER
            ? "🤖 AI TURN..."
            : "FRIEND — YOUR TURN"
        );
      } else {
        setMessage("YOUR TURN — PLACE OR MOVE YOUR LOGO");
      }

      return true;
    },
    [
      userLogo,
      currentOpponentLogo,
      board,
      markOrder,
      playTone,
      checkGameEnd,
      mode,
    ]
  );

  const handleCellClick = useCallback(
    (cellIndex) => {
      if (
        !mode ||
        status !== "playing" ||
        isComputerThinking
      ) {
        return;
      }

      if (
        mode === MODES.COMPUTER &&
        currentSide === "opponent"
      ) {
        return;
      }

      const sidePositions =
        currentSide === "user"
          ? markOrder.user
          : markOrder.opponent;

      // First 3 marks: place only.
      if (sidePositions.length < MAX_MARKS) {
        if (board[cellIndex] === null) {
          placeNewMark(cellIndex, currentSide);
        }
        return;
      }

      // After 3 marks: choose ANY own mark.
      if (selectedMark === null) {
        const ownLogo =
          currentSide === "user"
            ? userLogo
            : currentOpponentLogo;

        if (board[cellIndex] === ownLogo) {
          setSelectedMark(cellIndex);

          setMessage(
            `SELECT EMPTY BOX — MOVE ${ownLogo}`
          );

          playTone(760, 0.08, "sine");
        }

        return;
      }

      // Cancel by selecting same mark.
      if (selectedMark === cellIndex) {
        setSelectedMark(null);
        setMessage(
          `SELECT ANY ${currentPlayerLogo} TO MOVE`
        );
        return;
      }

      // User can switch to another one of own marks.
      const ownLogo =
        currentSide === "user"
          ? userLogo
          : currentOpponentLogo;

      if (board[cellIndex] === ownLogo) {
        setSelectedMark(cellIndex);
        setMessage(
          `SELECT EMPTY BOX — MOVE ${ownLogo}`
        );
        return;
      }

      // Destination must be empty.
      if (board[cellIndex] !== null) return;

      moveExistingMark(
        selectedMark,
        cellIndex,
        currentSide
      );
    },
    [
      mode,
      status,
      isComputerThinking,
      currentSide,
      markOrder,
      board,
      placeNewMark,
      selectedMark,
      userLogo,
      currentOpponentLogo,
      currentPlayerLogo,
      playTone,
      moveExistingMark,
    ]
  );

  // AI turn.
  useEffect(() => {
    if (
      mode !== MODES.COMPUTER ||
      currentSide !== "opponent" ||
      status !== "playing"
    ) {
      return;
    }

    setIsComputerThinking(true);
    setMessage("🤖 AI IS THINKING...");

    const timer = setTimeout(() => {
      const aiPositions = markOrder.opponent;

      if (aiPositions.length < MAX_MARKS) {
        const cell = getPlacementMove(
          board,
          aiLogo,
          userLogo,
          difficulty || DIFFICULTIES.MEDIUM
        );

        if (cell !== null) {
          placeNewMark(cell, "opponent");
        }
      } else {
        const move = getMovePhaseMove(
          board,
          aiLogo,
          userLogo,
          difficulty || DIFFICULTIES.MEDIUM
        );

        if (move) {
          moveExistingMark(
            move.from,
            move.to,
            "opponent"
          );
        }
      }

      setIsComputerThinking(false);
    }, difficulty === DIFFICULTIES.HARD ? 850 : 600);

    return () => clearTimeout(timer);
  }, [
    mode,
    currentSide,
    status,
    board,
    markOrder.opponent,
    difficulty,
    aiLogo,
    userLogo,
    placeNewMark,
    moveExistingMark,
  ]);

  // Keyboard controls.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (screen !== "game") return;

      const key = event.key.toLowerCase();

      if (key === "r") {
        resetBoardForRound(roundNumber);
        return;
      }

      if (key === "escape") {
        setSelectedMark(null);
        setMessage(
          currentSide === "user"
            ? "YOUR TURN — PLACE OR MOVE YOUR LOGO"
            : mode === MODES.COMPUTER
              ? "🤖 AI TURN..."
              : "FRIEND — YOUR TURN"
        );
        return;
      }

      if (status !== "playing") return;

      if (
        mode === MODES.COMPUTER &&
        currentSide === "opponent"
      ) {
        return;
      }

      const number = Number(event.key);

      if (number >= 1 && number <= 9) {
        handleCellClick(number - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    screen,
    status,
    currentSide,
    mode,
    roundNumber,
    handleCellClick,
    resetBoardForRound,
  ]);

  useEffect(() => {
    if (
      status !== "playing" &&
      winningLine.length === 3 &&
      !winSoundPlayedRef.current
    ) {
      winSoundPlayedRef.current = true;
      playWinSound();
    }

    if (status === "playing") {
      winSoundPlayedRef.current = false;
    }
  }, [
    status,
    winningLine,
    playWinSound,
  ]);

  const nextRound = () => {
    const next = roundNumber + 1;
    setRoundNumber(next);
    resetBoardForRound(next);
  };

  const winningCoords =
    winningLine.length === 3
      ? getWinningLineCoordinates(winningLine)
      : null;

  const renderLogoChoices = (
    choices,
    selected,
    onSelect
  ) => (
    <div className="logo-grid">
      {choices.map((logo) => (
        <button
          key={logo}
          className={`logo-choice ${
            selected === logo ? "logo-selected" : ""
          }`}
          onClick={() => onSelect(logo)}
        >
          <span>{logo}</span>
          {selected === logo && (
            <small>SELECTED</small>
          )}
        </button>
      ))}
    </div>
  );

  const renderMarkSlots = (side) => {
    const count =
      side === "user"
        ? markOrder.user.length
        : markOrder.opponent.length;

    const logo =
      side === "user"
        ? userLogo
        : currentOpponentLogo;

    return (
      <div className="mark-slots">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`mark-slot ${
              index < count ? "filled" : ""
            }`}
          >
            {index < count ? logo : ""}
          </span>
        ))}
      </div>
    );
  };

  // =========================================================
  // MODE SCREEN
  // =========================================================
  if (screen === "mode") {
    return (
      <div className="tic-page tic-menu-page">
        <div className="tic-background-grid" />

        <div className="tic-menu-card">
          <div className="hero-logos">
            <span>🔥</span>
            <span>⚡</span>
            <span>❄️</span>
            <span>💎</span>
          </div>

          <p className="tic-eyebrow">
            GAME STATION ORIGINAL
          </p>

          <h1>LOGO DUEL</h1>

          <p className="tic-subtitle">
            3 MARKS • MOVE • CONQUER
          </p>

          <div className="tic-mode-title">
            CHOOSE GAME MODE
          </div>

          <div className="tic-mode-buttons">
            <button
              className="mode-card"
              onClick={() =>
                selectMode(MODES.FRIEND)
              }
            >
              <span className="mode-icon">👥</span>
              <strong>USER VS FRIEND</strong>
              <small>
                Both players choose their own logo.
              </small>
            </button>

            <button
              className="mode-card"
              onClick={() =>
                selectMode(MODES.COMPUTER)
              }
            >
              <span className="mode-icon">🤖</span>
              <strong>USER VS AI</strong>
              <small>
                You choose your logo. AI uses 🤖.
              </small>
            </button>
          </div>

          <div className="tic-rule-preview">
            <span>3 MARKS MAX</span>
            <span>MOVE ANY MARK</span>
            <span>3 IN A ROW</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // DIFFICULTY SCREEN
  // =========================================================
  if (screen === "difficulty") {
    return (
      <div className="tic-page tic-menu-page">
        <div className="tic-background-grid" />

        <div className="tic-menu-card difficulty-card">
          <button
            className="back-menu-button"
            onClick={backToMenu}
          >
            ← BACK
          </button>

          <div className="big-screen-logo">🤖</div>

          <p className="tic-eyebrow">
            USER VS AI
          </p>

          <h1>SELECT AI LEVEL</h1>

          <p className="tic-subtitle">
            EASY → MEDIUM → FULL HARD
          </p>

          <div className="difficulty-buttons">
            <button
              className="difficulty easy"
              onClick={() =>
                selectDifficulty(
                  DIFFICULTIES.EASY
                )
              }
            >
              <span>🟢</span>
              <div>
                <strong>EASY</strong>
                <small>
                  Simple and mostly random moves
                </small>
              </div>
            </button>

            <button
              className="difficulty medium"
              onClick={() =>
                selectDifficulty(
                  DIFFICULTIES.MEDIUM
                )
              }
            >
              <span>🟡</span>
              <div>
                <strong>MEDIUM</strong>
                <small>
                  Wins, blocks and better positioning
                </small>
              </div>
            </button>

            <button
              className="difficulty hard"
              onClick={() =>
                selectDifficulty(
                  DIFFICULTIES.HARD
                )
              }
            >
              <span>🔴</span>
              <div>
                <strong>HARD</strong>
                <small>
                  Strong strategy + movement calculation
                </small>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // USER LOGO SCREEN
  // =========================================================
  if (screen === "user-logo") {
    return (
      <div className="tic-page tic-menu-page">
        <div className="tic-background-grid" />

        <div className="tic-menu-card logo-select-card">
          <button
            className="back-menu-button"
            onClick={() => {
              setScreen(
                mode === MODES.COMPUTER
                  ? "difficulty"
                  : "mode"
              );
            }}
          >
            ← BACK
          </button>

          <div className="big-screen-logo">
            🎮
          </div>

          <p className="tic-eyebrow">
            STEP 1
          </p>

          <h1>SELECT YOUR LOGO</h1>

          <p className="tic-subtitle">
            THIS LOGO WILL REPRESENT YOU
          </p>

          {renderLogoChoices(
            availableUserLogos,
            userLogo,
            chooseUserLogo
          )}

          {mode === MODES.COMPUTER && (
            <div className="ai-preview">
              <span>AI LOGO</span>
              <strong>🤖</strong>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // FRIEND LOGO SCREEN
  // =========================================================
  if (screen === "friend-logo") {
    return (
      <div className="tic-page tic-menu-page">
        <div className="tic-background-grid" />

        <div className="tic-menu-card logo-select-card">
          <button
            className="back-menu-button"
            onClick={() => setScreen("user-logo")}
          >
            ← BACK
          </button>

          <div className="selected-preview">
            <span>YOU</span>
            <strong>{userLogo}</strong>
          </div>

          <p className="tic-eyebrow">
            STEP 2
          </p>

          <h1>FRIEND SELECT LOGO</h1>

          <p className="tic-subtitle">
            CHOOSE A DIFFERENT LOGO
          </p>

          {renderLogoChoices(
            availableFriendLogos,
            friendLogo,
            chooseFriendLogo
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // GAME SCREEN
  // =========================================================

  return (
    <div className="tic-page">
      <div className="tic-background-grid" />

      <header className="tic-header">
        <div className="tic-brand">
          <div className="tic-brand-icon">
            🔥⚡
          </div>

          <div>
            <h1>LOGO DUEL</h1>

            <span>
              {mode === MODES.COMPUTER
                ? `YOU VS 🤖 • ${difficulty?.toUpperCase()}`
                : "YOU VS FRIEND"}
            </span>
          </div>
        </div>

        <div className="round-display">
          <small>ROUND</small>
          <strong>{roundNumber}</strong>
        </div>

        <button
          className="header-back"
          onClick={backToMenu}
        >
          MENU
        </button>
      </header>

      <main className="tic-main">
        <section className="scoreboard">
          <div className="score-player user-player">
            <div className="score-symbol">
              {userLogo}
            </div>

            <div className="score-info">
              <span>YOU</span>
              <strong>{userScore}</strong>
              {renderMarkSlots("user")}
            </div>
          </div>

          <div className="score-vs">
            VS
          </div>

          <div className="score-player opponent-player">
            <div className="score-info">
              <span>
                {mode === MODES.COMPUTER
                  ? "AI"
                  : "FRIEND"}
              </span>

              <strong>{opponentScore}</strong>

              {renderMarkSlots("opponent")}
            </div>

            <div className="score-symbol">
              {currentOpponentLogo}
            </div>
          </div>
        </section>

        <section className="game-layout">
          <aside className="game-info-panel">
            <div className="info-box">
              <span className="info-number">
                01
              </span>

              <h3>CHOOSE LOGO</h3>

              <p>
                Each player gets a unique logo.
              </p>
            </div>

            <div className="info-box">
              <span className="info-number">
                02
              </span>

              <h3>3 MARKS MAX</h3>

              <p>
                Place only three marks. No fourth mark.
              </p>
            </div>
          </aside>

          <div className="board-area">
            <div
              className={`turn-banner ${
                currentSide === "user"
                  ? "turn-user"
                  : "turn-opponent"
              }`}
            >
              <span className="turn-logo">
                {currentPlayerLogo}
              </span>

              <span>
                {isComputerThinking
                  ? "AI IS THINKING..."
                  : message}
              </span>
            </div>

            <div className="tic-board">
              {winningCoords && (
                <div className="winning-line-layer">
                  <svg
                    className="winning-line-svg"
                    viewBox="0 0 300 300"
                    preserveAspectRatio="none"
                  >
                    <line
                      className="winning-line-shadow"
                      x1={winningCoords.x1}
                      y1={winningCoords.y1}
                      x2={winningCoords.x2}
                      y2={winningCoords.y2}
                    />

                    <line
                      className="winning-line-core"
                      x1={winningCoords.x1}
                      y1={winningCoords.y1}
                      x2={winningCoords.x2}
                      y2={winningCoords.y2}
                    />
                  </svg>
                </div>
              )}

              {board.map((logo, index) => {
                const isWinning =
                  winningLine.includes(index);

                const isSelected =
                  selectedMark === index;

                const isLastFrom =
                  lastMove?.from === index;

                const isLastTo =
                  lastMove?.to === index;

                return (
                  <button
                    key={index}
                    className={[
                      "tic-cell",
                      logo ? "has-logo" : "",
                      isWinning
                        ? "winning-cell"
                        : "",
                      isSelected
                        ? "selected-cell"
                        : "",
                      isLastFrom
                        ? "last-from"
                        : "",
                      isLastTo
                        ? "last-to"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      handleCellClick(index)
                    }
                    disabled={
                      isComputerThinking ||
                      isGameOver
                    }
                  >
                    <span className="cell-number">
                      {index + 1}
                    </span>

                    {logo && (
                      <span className="tic-mark">
                        {logo}
                      </span>
                    )}

                    {isSelected && (
                      <span className="selection-ring" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="board-help">
              {currentPlayerPositions.length <
              MAX_MARKS ? (
                <span>
                  CLICK AN EMPTY BOX TO PLACE{" "}
                  {currentPlayerLogo}
                </span>
              ) : selectedMark === null ? (
                <span>
                  SELECT ANY ONE OF YOUR{" "}
                  {currentPlayerLogo} MARKS
                </span>
              ) : (
                <span>
                  NOW SELECT AN EMPTY BOX TO MOVE{" "}
                  {currentPlayerLogo}
                </span>
              )}
            </div>
          </div>

          <aside className="game-info-panel">
            <div className="info-box active-rule">
              <span className="info-number">
                03
              </span>

              <h3>MOVE ANY MARK</h3>

              <p>
                After three marks, choose any one of
                your marks and move it.
              </p>
            </div>

            <div className="info-box">
              <span className="info-number">
                04
              </span>

              <h3>3 IN A ROW</h3>

              <p>
                Make a line horizontally, vertically
                or diagonally to win.
              </p>
            </div>
          </aside>
        </section>

        <section className="rules-bar">
          <div className="rule-item">
            <span>🎯</span>
            <strong>3 MARKS</strong>
          </div>

          <div className="rule-divider" />

          <div className="rule-item">
            <span>🔄</span>
            <strong>MOVE ANY</strong>
          </div>

          <div className="rule-divider" />

          <div className="rule-item">
            <span>📏</span>
            <strong>3 IN LINE</strong>
          </div>

          <div className="rule-divider" />

          <div className="rule-item">
            <span>🏆</span>
            <strong>WIN</strong>
          </div>
        </section>

        <section className="controls-bar">
          <div className="keys">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
              (number) => (
                <kbd key={number}>
                  {number}
                </kbd>
              )
            )}

            <span>BOARD</span>
          </div>

          <div className="keys">
            <kbd>R</kbd>
            <span>NEW ROUND</span>

            <kbd>ESC</kbd>
            <span>CANCEL</span>
          </div>
        </section>
      </main>

      {/* WIN / DRAW SCREEN */}
      {isGameOver && (
        <div className="game-result-overlay">
          <div className="game-result-card">
            <div className="result-logo">
              {status === userLogo
                ? userLogo
                : status === currentOpponentLogo
                  ? currentOpponentLogo
                  : "🤝"}
            </div>

            <p className="result-label">
              ROUND {roundNumber} COMPLETE
            </p>

            <h2>
              {status === userLogo
                ? "YOU WIN!"
                : status === currentOpponentLogo
                  ? mode === MODES.COMPUTER
                    ? "AI WINS!"
                    : "FRIEND WINS!"
                  : "DRAW!"}
            </h2>

            <div className="result-score">
              <div>
                <span>
                  YOU {userLogo}
                </span>
                <strong>
                  {userScore}
                </strong>
              </div>

              <b>:</b>

              <div>
                <span>
                  {mode === MODES.COMPUTER
                    ? `AI ${aiLogo}`
                    : `FRIEND ${friendLogo}`}
                </span>

                <strong>
                  {opponentScore}
                </strong>
              </div>
            </div>

            <div className="result-actions">
              <button
                className="next-round-button"
                onClick={nextRound}
              >
                🔄 NEXT ROUND
              </button>

              <button
                className="result-menu-button"
                onClick={backToMenu}
              >
                MENU
              </button>
            </div>

            <p className="result-hint">
              Starter alternates every round • Press
              R for a new round
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicTacToe;
