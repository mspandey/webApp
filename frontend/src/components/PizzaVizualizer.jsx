import React, { memo } from "react";

// Map each topping name to an emoji or SVG layer position
const TOPPING_VISUALS = {
  mushrooms:   { emoji: "🍄", positions: [{x:45,y:40},{x:65,y:55},{x:35,y:60}] },
  pepperoni:   { emoji: "🔴", positions: [{x:50,y:45},{x:70,y:60},{x:40,y:65},{x:60,y:35}] },
  olives:      { emoji: "⚫", positions: [{x:55,y:50},{x:40,y:42},{x:65,y:68}] },
  onions:      { emoji: "🟣", positions: [{x:48,y:55},{x:63,y:42},{x:38,y:68}] },
  peppers:     { emoji: "🟩", positions: [{x:60,y:48},{x:42,y:58},{x:58,y:65}] },
  corn:        { emoji: "🟡", positions: [{x:52,y:60},{x:44,y:45},{x:66,y:55}] },
  paneer:      { emoji: "⬜", positions: [{x:50,y:50},{x:65,y:42},{x:38,y:62}] },
  chicken:     { emoji: "🍗", positions: [{x:55,y:45},{x:42,y:60},{x:64,y:62}] },
};

const CRUST_COLORS = {
  thin:    "#c8860a",
  thick:   "#a0580a",
  stuffed: "#7a3b0a",
  default: "#b8720a",
};

const SIZE_SCALE = {
  small:  0.72,
  medium: 0.88,
  large:  1.0,
  default: 0.88,
};

const PizzaVisualizer = memo(({ toppings = [], size = "medium", crust = "thin", sauce = "tomato" }) => {
  const scale = SIZE_SCALE[size] || SIZE_SCALE.default;
  const crustColor = CRUST_COLORS[crust] || CRUST_COLORS.default;
  const sauceColor = sauce === "white" ? "#f5f0e0" : "#d63c1e";
  const r = 120 * scale;
  const cx = 160, cy = 160;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="320" height="320" viewBox="0 0 320 320" className="drop-shadow-xl">
        {/* Crust ring */}
        <circle cx={cx} cy={cy} r={r + 14 * scale} fill={crustColor} />
        {/* Sauce base */}
        <circle cx={cx} cy={cy} r={r} fill={sauceColor} />
        {/* Cheese layer */}
        <circle cx={cx} cy={cy} r={r * 0.93} fill="#f5d77a" opacity="0.85" />

        {/* Topping layers */}
        {toppings.map((topping) => {
          const visual = TOPPING_VISUALS[topping?.name?.toLowerCase()] || TOPPING_VISUALS[topping?.toLowerCase?.()];
          if (!visual) return null;
          return visual.positions.map((pos, i) => (
            <text
              key={`${topping}-${i}`}
              x={cx - r + (pos.x / 100) * r * 2}
              y={cy - r + (pos.y / 100) * r * 2}
              fontSize={18 * scale}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {visual.emoji}
            </text>
          ));
        })}
      </svg>
      <p className="text-sm text-gray-500 capitalize">
        {size} · {crust} crust · {sauce} sauce
        {toppings.length > 0 && ` · ${toppings.map(t => t?.name || t).join(", ")}`}
      </p>
    </div>
  );
});

export default PizzaVisualizer;