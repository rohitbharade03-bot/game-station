import "../styles/game-filters.css";

function GameFilters({ activeCategory, setActiveCategory }) {
  const categories = [
    "All",
    "Action",
    "Racing",
    "Sports",
    "Adventure",
    "Strategy",
    "Survival",
    "Puzzle",
    "Casual",
  ];

  return (
    <div className="game-filters">
      {categories.map((category) => (
        <button
          key={category}
          className={`filter-btn ${
            activeCategory === category ? "active" : ""
          }`}
          onClick={() => setActiveCategory(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default GameFilters;