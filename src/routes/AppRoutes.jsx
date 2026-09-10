import {
  HashRouter,
  Routes,
  Route,
} from "react-router-dom";

import App from "../App";
import GameDetails from "../pages/GameDetails";

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


function AppRoutes() {
  return (
    <HashRouter>

      <Routes>

        {/* =================================================
            MAIN GAME STATION
        ================================================== */}

        <Route
          path="/"
          element={<App />}
        />


        {/* =================================================
            GAME DETAILS
        ================================================== */}

        <Route
          path="/game/:id"
          element={<GameDetails />}
        />


        {/* =================================================
            GAME #1
            BATTLE ARENA
        ================================================== */}

        <Route
          path="/game/1/play"
          element={<BattleArena />}
        />


        {/* =================================================
            GAME #2
            INDIAN STREET RACING
        ================================================== */}

        <Route
          path="/game/2/play"
          element={<IndianStreetRacing />}
        />


        {/* =================================================
            GAME #3
            STREET FOOTBALL
        ================================================== */}

        <Route
          path="/game/3/play"
          element={<StreetFootball />}
        />


        {/* =================================================
            GAME #4
            CRICKET BATTLE
        ================================================== */}

        <Route
          path="/game/4/play"
          element={<CricketBattle />}
        />


        {/* =================================================
            GAME #5
            FIND THE ODD ONE
        ================================================== */}

        <Route
          path="/game/5/play"
          element={<FindTheOddOne />}
        />


        {/* =================================================
            GAME #6
            NINJA HILL RIDE
        ================================================== */}

        <Route
          path="/game/6/play"
          element={<NinjaHillRide />}
        />


        {/* =================================================
            GAME #7
            BLOCK SHIFT
        ================================================== */}

        <Route
          path="/game/7/play"
          element={<BlockShift />}
        />


        {/* =================================================
            GAME #8
            NEON RUSH
        ================================================== */}

        <Route
          path="/game/8/play"
          element={<NeonRush />}
        />


        {/* =================================================
            GAME #9
            MIND VAULT
        ================================================== */}

        <Route
          path="/game/9/play"
          element={<MindVault />}
        />

        <Route
          path="/game/10/play"
          element={<LastSignal />}
        />

        <Route
          path="/game/11/play"
          element={<ArrowVerse />}
        />

        <Route
          path="/game/12/play"
          element={<EchoWeaver />}
        />
       <Route 
       path="/game/13/play" 
       element={<QuickDuel />} 
       />
      <Route 
      path="/game/14/play"
       element={<TicTacToe />} 
       />

      </Routes>
    </HashRouter>
  );
}
export default AppRoutes;