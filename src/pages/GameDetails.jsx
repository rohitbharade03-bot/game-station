import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Star } from "lucide-react";
import games from "../data/games";
import "../styles/game-details.css";

function GameDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const game = games.find(
    (item) => item.id === Number(id)
  );

  if (!game) {
    return (
      <div className="game-not-found">
        <h1>Game Not Found 😢</h1>

        <button onClick={() => navigate("/")}>
          Back Home
        </button>
      </div>
    );
  }

  return (
    <main className="game-details">

      <button
        className="back-button"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="game-details-card">

        <img
          src={game.image}
          alt={game.title}
        />

        <div className="game-details-info">

          <span className="game-category">
            {game.category}
          </span>

          <h1>{game.title}</h1>

          <div className="game-meta">
            <span>
              <Star size={17} fill="currentColor" />
              {game.rating}
            </span>

            <span>
              👥 {game.players}
            </span>
          </div>

          <p>
            Enter the world of {game.title}.
            Play, compete, improve your skills and
            become the ultimate champion.
          </p>

         <button
           className="start-game"
           onClick={() => navigate(`/game/${game.id}/play`)}
          >
           <Play size={20} fill="currentColor" />
             Play Game
          </button>

        </div>

      </div>

    </main>
  );
}

export default GameDetails;