import { Play, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/game-card.css";



function GameCard({ game }) {
const navigate = useNavigate();

  return (
    <div
     className="game-card"
     onClick={() => navigate(`/game/${game.id}`)}
    >
      <div className="game-image">
        <img src={game.image} alt={game.title} />

        <div className="game-rating">
          <Star size={14} fill="currentColor" />
          {game.rating}
        </div>

        <button
          className="quick-play"
          onClick={(e) => {
          e.stopPropagation();
          navigate(`/game/${game.id}`);
        }}
       >
          <Play size={16} fill="currentColor" />
        </button>
      </div>

      <div className="game-info">
        <h3>{game.title}</h3>

        <p>
          {game.category} • {game.players}
        </p>
      </div>
    </div>
  );
}

export default GameCard;