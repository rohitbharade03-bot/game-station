import { Play, Star } from "lucide-react";
import "../styles/hero.css";
function HeroBanner() {
  return (
    <section className="hero-banner">
      <div className="hero-content">
        <span className="hero-badge">🔥 TRENDING NOW</span>

        <h1>
          Battle Arena
          <br />
          <span>Legends</span>
        </h1>

        <p>
          Enter the arena, build your squad and become
          the ultimate champion.
        </p>

        <div className="hero-info">
          <span>⭐ 4.8</span>
          <span>•</span>
          <span>Action</span>
          <span>•</span>
          <span>Multiplayer</span>
        </div>

        <button className="play-button">
          <Play size={20} fill="currentColor" />
          Play Now
        </button>
      </div>

      <div className="hero-character">
        🎮
      </div>

      <div className="hero-rating">
        <Star size={18} fill="currentColor" />
        <span>4.8</span>
      </div>
    </section>
  );
}

export default HeroBanner;