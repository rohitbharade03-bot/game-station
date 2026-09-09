
import { useMemo, useState } from "react";
import {
  Search,
  Bell,
  User,
  Play,
  Star,
  Users,
  Flame,
  Trophy,
  Gamepad2,
  ChevronRight,
  Zap,
  Clock3,
  Menu,
  X,
} from "lucide-react";

import games from "./data/games";
import "./App.css";

function App() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [mobileMenu, setMobileMenu] = useState(false);

  const categories = [
    "All",
    "Action",
    "Racing",
    "Sports",
    "Survival",
    "Adventure",
    "Strategy",
    "Puzzle",
    "Casual",
  ];

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesCategory =
        category === "All" || game.category === category;

      const matchesSearch =
        game.title.toLowerCase().includes(search.toLowerCase()) ||
        game.category.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const featuredGames = games.slice(0, 4);

  const openGame = (id) => {
    window.location.href = `/game/${id}`;
  };

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="logo">
          <div className="logo-icon">
            <Gamepad2 size={25} />
          </div>

          <div>
            <h2>GAME<span>STATION</span></h2>
            <small>PLAY • COMPETE • WIN</small>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="side-nav">
          <a className="active" href="/">
            <Gamepad2 size={19} />
            Dashboard
          </a>

          <a href="#games">
            <Trophy size={19} />
            All Games
          </a>

          <a href="#popular">
            <Flame size={19} />
            Popular
          </a>

          <a href="#categories">
            <Zap size={19} />
            Categories
          </a>
        </nav>

        <div className="sidebar-card">
          <div className="mini-controller">🎮</div>
          <h3>Ready to play?</h3>
          <p>Choose your game and start your next adventure.</p>

          <button
            onClick={() =>
              document
                .getElementById("games")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore Games
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="user-avatar">R</div>

            <div>
              <strong>Player</strong>
              <span>Online</span>
            </div>

            <User size={17} />
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileMenu && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* MAIN */}
      <main className="main-content">

        {/* HEADER */}
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={23} />
          </button>

          <div className="topbar-title">
            <span>WELCOME BACK 👋</span>
            <h1>Gaming Dashboard</h1>
          </div>

          <div className="topbar-actions">

            <div className="header-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search games..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="icon-button">
              <Bell size={19} />
              <span className="notification-dot" />
            </button>

            <div className="profile">
              <div className="profile-avatar">R</div>
              <div className="profile-info">
                <strong>Player</strong>
                <span>Level 12</span>
              </div>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="hero-section">

          <div className="hero-content">
            <div className="hero-badge">
              <span className="pulse-dot" />
              LIVE GAMING
            </div>

            <h2>
              Your Game.
              <br />
              <span>Your Arena.</span>
            </h2>

            <p>
              Discover exciting games, challenge your skills,
              and become the ultimate champion.
            </p>

            <div className="hero-buttons">
              <button
                className="primary-button"
                onClick={() => openGame(featuredGames[0]?.id)}
              >
                <Play size={18} fill="currentColor" />
                Play Now
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  document
                    .getElementById("games")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore Games
                <ChevronRight size={17} />
              </button>
            </div>

            <div className="hero-stats">
              <div>
                <strong>20+</strong>
                <span>Games</span>
              </div>

              <div>
                <strong>50K+</strong>
                <span>Players</span>
              </div>

              <div>
                <strong>4.8</strong>
                <span>Rating</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-glow" />

            <div className="floating-card card-one">
              <Trophy size={17} />
              <span>TOP PLAYER</span>
            </div>

            <div className="controller">
              <Gamepad2 size={120} strokeWidth={1.3} />
            </div>

            <div className="floating-card card-two">
              <Flame size={17} />
              <span>ON FIRE!</span>
            </div>
          </div>
        </section>

        {/* QUICK STATS */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon purple">
              <Gamepad2 size={22} />
            </div>

            <div>
              <span>Total Games</span>
              <strong>{games.length}</strong>
            </div>

            <small>Available</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <Flame size={22} />
            </div>

            <div>
              <span>Trending</span>
              <strong>08</strong>
            </div>

            <small>Hot games</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <Users size={22} />
            </div>

            <div>
              <span>Players Online</span>
              <strong>12.8K</strong>
            </div>

            <small>Live now</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <Trophy size={22} />
            </div>

            <div>
              <span>Your Rank</span>
              <strong>#128</strong>
            </div>

            <small>Top 5%</small>
          </div>

        </section>

        {/* FEATURED */}
        <section className="content-section">

          <div className="section-heading">
            <div>
              <span className="section-label">
                <Zap size={15} />
                FEATURED
              </span>

              <h2>Featured Games</h2>
            </div>

            <button
              className="view-all"
              onClick={() =>
                document
                  .getElementById("games")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View All
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="featured-grid">
            {featuredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                featured
                onClick={() => openGame(game.id)}
              />
            ))}
          </div>
        </section>

        {/* CATEGORIES */}
        <section
          className="content-section"
          id="categories"
        >
          <div className="section-heading">
            <div>
              <span className="section-label">
                <Gamepad2 size={15} />
                BROWSE
              </span>

              <h2>Game Categories</h2>
            </div>
          </div>

          <div className="category-list">
            {categories.map((item) => (
              <button
                key={item}
                className={
                  category === item
                    ? "category-button active"
                    : "category-button"
                }
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* ALL GAMES */}
        <section
          className="content-section"
          id="games"
        >
          <div className="section-heading">
            <div>
              <span className="section-label">
                <Gamepad2 size={15} />
                GAME LIBRARY
              </span>

              <h2>
                {search
                  ? `Results for "${search}"`
                  : category === "All"
                  ? "All Games"
                  : `${category} Games`}
              </h2>
            </div>

            <span className="game-count">
              {filteredGames.length} Games
            </span>
          </div>

          {filteredGames.length > 0 ? (
            <div className="games-grid">
              {filteredGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onClick={() => openGame(game.id)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Gamepad2 size={45} />
              <h3>No games found</h3>
              <p>Try another game name or category.</p>

              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
              >
                Show All Games
              </button>
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div>
            <strong>GAMESTATION</strong>
            <span>PLAY • COMPETE • WIN</span>
          </div>

          <p>© 2026 GameStation. All rights reserved.</p>

          <div className="footer-status">
            <span className="online-dot" />
            All systems operational
          </div>
        </footer>

      </main>
    </div>
  );
}

function GameCard({ game, featured = false, onClick }) {
  return (
    <article
      className={featured ? "game-card featured" : "game-card"}
      onClick={onClick}
    >
      <div className="game-image">

        <img
          src={game.image}
          alt={game.title}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        <div className="image-fallback">
          <Gamepad2 size={50} />
        </div>

        <div className="game-category-badge">
          {game.category}
        </div>

        <div className="game-play-overlay">
          <div>
            <Play size={23} fill="currentColor" />
          </div>
        </div>

        {featured && (
          <div className="featured-badge">
            <Flame size={13} />
            FEATURED
          </div>
        )}
      </div>

      <div className="game-card-body">
        <div className="game-title-row">
          <h3>{game.title}</h3>

          <span className="rating">
            <Star size={14} fill="currentColor" />
            {game.rating}
          </span>
        </div>

        <div className="game-info">
          <span>
            <Users size={14} />
            {game.players}
          </span>

          <span>
            <Clock3 size={14} />
            Online
          </span>
        </div>

        <button className="card-play">
          Play Game
          <Play size={14} fill="currentColor" />
        </button>
      </div>
    </article>
  );
}

export default App;
