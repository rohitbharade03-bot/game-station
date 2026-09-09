import "../styles/sidebar.css";

import {
  Home,
  Gamepad2,
  Trophy,
  Users,
  Gift,
  User,
  Settings,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-menu">

        <button className="sidebar-item active">
          <Home size={21} />
          <span>Home</span>
        </button>

        <button className="sidebar-item">
          <Gamepad2 size={21} />
          <span>All Games</span>
        </button>

        <button className="sidebar-item">
          <Trophy size={21} />
          <span>Leaderboard</span>
        </button>

        <button className="sidebar-item">
          <Users size={21} />
          <span>Friends</span>
        </button>

        <button className="sidebar-item">
          <Gift size={21} />
          <span>Rewards</span>
        </button>

        <div className="sidebar-divider"></div>

        <button className="sidebar-item">
          <User size={21} />
          <span>Profile</span>
        </button>

        <button className="sidebar-item">
          <Settings size={21} />
          <span>Settings</span>
        </button>

      </nav>
    </aside>
  );
}

export default Sidebar;