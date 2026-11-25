import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import App from "../App";
import GameDetails from "../pages/GameDetails";

import AuthPage from "../auth/AuthPage";
import { useAuth } from "../auth/AuthContext";

// =====================================================
// GAMES
// =====================================================

import BattleArena from "../games/BattleArena/BattleArena";
import IndianStreetRacing from "../games/IndianStreetRacing/IndianStreetRacing";
import StreetFootball from "../games/StreetFootball/StreetFootball";
import CricketBattle from "../games/CricketBattle/CricketBattle";
import FindTheOddOne from "../games/FindTheOddOne/FindTheOddOne";
import NinjaHillRide from "../games/NinjaHillRide/NinjaHillRide";
import BlockShift from "../games/BlockShift/BlockShift";
import NeonRush from "../games/NeonRush/NeonRush";
import MindVault from "../games/MindVault/MindVault";
import LastSignal from "../games/LastSignal/LastSignal";
import ArrowVerse from "../games/ArrowVerse/ArrowVerse";
import EchoWeaver from "../games/Echoweaver/EchoWeaver";
import QuickDuel from "../games/QuickDuel/QuickDuel";
import TicTacToe from "../games/TicTacToe/TicTacToe";
import MemoryMatchAI from "../games/MemoryMatchAI/MemoryMatchAI";
import CoffeeCatcher from "../games/CoffeeCatcher/CoffeeCatcher";
import TrustGame from "../games/TrustGame/TrustGame";
import CityRush from "../games/CityRush/CityRush";
import OneMoreRun from "../games/OneMoreRun/OneMoreRun";
// =====================================================
// PROTECTED ROUTE CityRush
// =====================================================

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Wait until saved session is checked
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070914",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
        }}
      >
        Loading Game Station...
      </div>
    );
  }

  // Not logged in → Login page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

// =====================================================
// AUTH ROUTE
// =====================================================

function AuthRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070914",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading Game Station...
      </div>
    );
  }

  // Already logged in → Dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <AuthPage />;
}

// =====================================================
// APP ROUTES
// =====================================================

function AppRoutes() {
  return (
    <HashRouter>
      <Routes>

        {/* =================================================
            CENTRAL LOGIN / SIGN UP
        ================================================== */}

        <Route
          path="/auth"
          element={<AuthRoute />}
        />

        {/* =================================================
            MAIN GAME STATION
        ================================================== */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME DETAILS
        ================================================== */}

        <Route
          path="/game/:id"
          element={
            <ProtectedRoute>
              <GameDetails />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #1
            BATTLE ARENA
        ================================================== */}

        <Route
          path="/game/1/play"
          element={
            <ProtectedRoute>
              <BattleArena />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #2
            INDIAN STREET RACING
        ================================================== */}

        <Route
          path="/game/2/play"
          element={
            <ProtectedRoute>
              <IndianStreetRacing />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #3
            STREET FOOTBALL
        ================================================== */}

        <Route
          path="/game/3/play"
          element={
            <ProtectedRoute>
              <StreetFootball />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #4
            CRICKET BATTLE
        ================================================== */}

        <Route
          path="/game/4/play"
          element={
            <ProtectedRoute>
              <CricketBattle />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #5
            FIND THE ODD ONE
        ================================================== */}

        <Route
          path="/game/5/play"
          element={
            <ProtectedRoute>
              <FindTheOddOne />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #6
            NINJA HILL RIDE
        ================================================== */}

        <Route
          path="/game/6/play"
          element={
            <ProtectedRoute>
              <NinjaHillRide />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #7
            BLOCK SHIFT
        ================================================== */}

        <Route
          path="/game/7/play"
          element={
            <ProtectedRoute>
              <BlockShift />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #8
            NEON RUSH
        ================================================== */}

        <Route
          path="/game/8/play"
          element={
            <ProtectedRoute>
              <NeonRush />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #9
            MIND VAULT
        ================================================== */}

        <Route
          path="/game/9/play"
          element={
            <ProtectedRoute>
              <MindVault />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #10
            LAST SIGNAL
        ================================================== */}

        <Route
          path="/game/10/play"
          element={
            <ProtectedRoute>
              <LastSignal />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #11
            ARROW VERSE
        ================================================== */}

        <Route
          path="/game/11/play"
          element={
            <ProtectedRoute>
              <ArrowVerse />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #12
            ECHO WEAVER
        ================================================== */}

        <Route
          path="/game/12/play"
          element={
            <ProtectedRoute>
              <EchoWeaver />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #13
            QUICK DUEL
        ================================================== */}

        <Route
          path="/game/13/play"
          element={
            <ProtectedRoute>
              <QuickDuel />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #14
            TIC TAC TOE
        ================================================== */}

        <Route
          path="/game/14/play"
          element={
            <ProtectedRoute>
              <TicTacToe />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #15
            MEMORY MATCH AI
        ================================================== */}

        <Route
          path="/game/15/play"
          element={
            <ProtectedRoute>
              <MemoryMatchAI />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #16
            COFFEE CATCHER
        ================================================== */}

        <Route
          path="/game/16/play"
          element={
            <ProtectedRoute>
              <CoffeeCatcher />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GAME #17
            TRUST?
        ================================================== */}

        <Route
          path="/game/17/play"
          element={
            <ProtectedRoute>
              <TrustGame />
            </ProtectedRoute>
          }
        />

        <Route
          path="/game/18/play"
          element={<CityRush />}
         />

        {/* =================================================
    GAME #19
    ONE MORE RUN
================================================= */}

<Route
  path="/game/19/play"
  element={
    <ProtectedRoute>
      <OneMoreRun />
    </ProtectedRoute>
  }
/>
        {/* =================================================
            UNKNOWN ROUTE
        ================================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </HashRouter>
  );
}

export default AppRoutes;