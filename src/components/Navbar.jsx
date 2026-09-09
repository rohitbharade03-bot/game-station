import { Search, Bell, Menu, Coins, Gem } from "lucide-react";
import "../styles/navbar.css";
function Navbar({ searchTerm, setSearchTerm }) {  return (
    <header className="navbar">

      {/* Logo */}
      <div className="navbar-logo">
        <span className="logo-icon">🎮</span>
        <div>
          <h2>GAME</h2>
          <h2>STATION</h2>
        </div>
      </div>

      {/* Search */}
      <div className="search-box">
        <Search size={20} />
        <input
           type="text"
           placeholder="Search games..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Right Section */}
      <div className="navbar-actions">

        <div className="balance">
          <Coins size={20} />
          <span>5,320</span>
          <button>+</button>
        </div>

        <div className="balance">
          <Gem size={20} />
          <span>340</span>
          <button>+</button>
        </div>

        <button className="icon-button">
          <Bell size={22} />
          <span className="notification-dot"></span>
        </button>

        <button className="icon-button">
          <Menu size={25} />
        </button>

      </div>

    </header>
  );
}

export default Navbar;