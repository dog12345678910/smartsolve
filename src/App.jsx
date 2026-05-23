import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ---------- storage helpers ---------- */

const GOAL_KEY = "ct_goal_v1";
const ENTRIES_KEY = "ct_entries_v1";

function loadGoal() {
  const raw = localStorage.getItem(GOAL_KEY);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 2000;
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ---------- date helpers ---------- */

function toKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d, n) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function prettyDate(d) {
  const today = toKey(new Date());
  const yesterday = toKey(addDays(new Date(), -1));
  const key = toKey(d);
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/* ---------- quick-add food library ---------- */

const QUICK_FOODS = [
  { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: "Apple", calories: 95, protein: 0, carbs: 25, fat: 0 },
  { name: "Egg (1 large)", calories: 78, protein: 6, carbs: 1, fat: 5 },
  { name: "Chicken breast (100g)", calories: 165, protein: 31, carbs: 0, fat: 4 },
  { name: "White rice (1 cup)", calories: 205, protein: 4, carbs: 45, fat: 0 },
  { name: "Greek yogurt (170g)", calories: 100, protein: 17, carbs: 6, fat: 0 },
  { name: "Almonds (28g)", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: "Coffee (black)", calories: 2, protein: 0, carbs: 0, fat: 0 },
  { name: "Slice of pizza", calories: 285, protein: 12, carbs: 36, fat: 10 },
  { name: "Avocado (half)", calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: "Oatmeal (1 cup)", calories: 154, protein: 6, carbs: 27, fat: 3 },
  { name: "Protein shake", calories: 120, protein: 24, carbs: 3, fat: 1 },
];

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];

/* ---------- main app ---------- */

export default function App() {
  const [goal, setGoal] = useState(loadGoal);
  const [entries, setEntries] = useState(loadEntries);
  const [viewDate, setViewDate] = useState(() => new Date());
  const dateKey = toKey(viewDate);

  useEffect(() => {
    localStorage.setItem(GOAL_KEY, String(goal));
  }, [goal]);

  useEffect(() => {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries]);

  const dayEntries = useMemo(
    () => entries.filter((e) => e.date === dateKey),
    [entries, dateKey]
  );

  const totals = useMemo(() => {
    return dayEntries.reduce(
      (acc, e) => {
        acc.calories += e.calories || 0;
        acc.protein += e.protein || 0;
        acc.carbs += e.carbs || 0;
        acc.fat += e.fat || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [dayEntries]);

  const addEntry = useCallback(
    (food, meal) => {
      setEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          date: dateKey,
          meal,
          name: food.name,
          calories: Math.round(food.calories) || 0,
          protein: Math.round(food.protein) || 0,
          carbs: Math.round(food.carbs) || 0,
          fat: Math.round(food.fat) || 0,
          ts: Date.now(),
        },
      ]);
    },
    [dateKey]
  );

  const removeEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const remaining = goal - totals.calories;
  const pct = goal > 0 ? Math.min(100, (totals.calories / goal) * 100) : 0;
  const over = totals.calories > goal;

  return (
    <div style={S.page}>
      <div style={S.container}>
        <Header
          viewDate={viewDate}
          onPrev={() => setViewDate((d) => addDays(d, -1))}
          onNext={() => setViewDate((d) => addDays(d, 1))}
          onToday={() => setViewDate(new Date())}
        />

        <Summary
          totals={totals}
          goal={goal}
          remaining={remaining}
          pct={pct}
          over={over}
          onGoalChange={setGoal}
        />

        <AddForm onAdd={addEntry} />

        <QuickAdd onAdd={addEntry} />

        <MealList entries={dayEntries} onRemove={removeEntry} />
      </div>
    </div>
  );
}

/* ---------- header ---------- */

function Header({ viewDate, onPrev, onNext, onToday }) {
  const isToday = toKey(viewDate) === toKey(new Date());
  return (
    <header style={S.header}>
      <div style={S.brand}>
        <span style={S.brandIcon}>🍎</span>
        <h1 style={S.brandText}>CalorieTrack</h1>
      </div>
      <div style={S.dateNav}>
        <button style={S.navBtn} onClick={onPrev} aria-label="Previous day">
          ‹
        </button>
        <button
          style={{ ...S.dateLabel, cursor: isToday ? "default" : "pointer" }}
          onClick={onToday}
          title="Jump to today"
        >
          {prettyDate(viewDate)}
        </button>
        <button style={S.navBtn} onClick={onNext} aria-label="Next day">
          ›
        </button>
      </div>
    </header>
  );
}

/* ---------- summary / progress ---------- */

function Summary({ totals, goal, remaining, pct, over, onGoalChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));

  useEffect(() => setDraft(String(goal)), [goal]);

  function commit() {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n > 0) onGoalChange(n);
    else setDraft(String(goal));
    setEditing(false);
  }

  const ringColor = over ? "#ff6b6b" : "#4ade80";
  const circ = 2 * Math.PI * 52;
  const dash = (pct / 100) * circ;

  return (
    <section style={S.summary}>
      <div style={S.ringWrap}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle
            cx="65"
            cy="65"
            r="52"
            fill="none"
            stroke="#1d1f2a"
            strokeWidth="12"
          />
          <circle
            cx="65"
            cy="65"
            r="52"
            fill="none"
            stroke={ringColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            transform="rotate(-90 65 65)"
            style={{ transition: "stroke-dasharray 0.4s ease, stroke 0.3s" }}
          />
          <text
            x="65"
            y="60"
            textAnchor="middle"
            fill="#fff"
            fontSize="26"
            fontWeight="700"
          >
            {totals.calories}
          </text>
          <text x="65" y="80" textAnchor="middle" fill="#7c8099" fontSize="12">
            kcal
          </text>
        </svg>
      </div>

      <div style={S.summaryInfo}>
        <div style={S.goalRow}>
          <span style={S.goalLabel}>Daily goal</span>
          {editing ? (
            <input
              style={S.goalInput}
              type="number"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === "Enter" && commit()}
            />
          ) : (
            <button style={S.goalValue} onClick={() => setEditing(true)}>
              {goal} kcal ✎
            </button>
          )}
        </div>

        <div style={S.remainRow}>
          <span style={{ ...S.remainNum, color: over ? "#ff6b6b" : "#4ade80" }}>
            {Math.abs(remaining)}
          </span>
          <span style={S.remainLabel}>
            kcal {over ? "over budget" : "remaining"}
          </span>
        </div>

        <div style={S.macros}>
          <Macro label="Protein" value={totals.protein} color="#60a5fa" />
          <Macro label="Carbs" value={totals.carbs} color="#fbbf24" />
          <Macro label="Fat" value={totals.fat} color="#f472b6" />
        </div>
      </div>
    </section>
  );
}

function Macro({ label, value, color }) {
  return (
    <div style={S.macro}>
      <span style={{ ...S.macroDot, background: color }} />
      <span style={S.macroValue}>{value}g</span>
      <span style={S.macroLabel}>{label}</span>
    </div>
  );
}

/* ---------- manual add form ---------- */

function AddForm({ onAdd }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [meal, setMeal] = useState("Breakfast");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [showMacros, setShowMacros] = useState(false);

  function submit(e) {
    e.preventDefault();
    const cal = parseInt(calories, 10);
    if (!name.trim() || !Number.isFinite(cal)) return;
    onAdd(
      {
        name: name.trim(),
        calories: cal,
        protein: parseInt(protein, 10) || 0,
        carbs: parseInt(carbs, 10) || 0,
        fat: parseInt(fat, 10) || 0,
      },
      meal
    );
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  }

  return (
    <form style={S.card} onSubmit={submit}>
      <h2 style={S.cardTitle}>Add food</h2>
      <div style={S.formRow}>
        <input
          style={{ ...S.input, flex: 2 }}
          placeholder="Food name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={{ ...S.input, flex: 1 }}
          type="number"
          placeholder="kcal"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
      </div>
      <div style={S.formRow}>
        <select
          style={{ ...S.input, flex: 1 }}
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
        >
          {MEALS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button
          type="button"
          style={S.macroToggle}
          onClick={() => setShowMacros((v) => !v)}
        >
          {showMacros ? "Hide macros" : "Add macros"}
        </button>
      </div>
      {showMacros && (
        <div style={S.formRow}>
          <input
            style={S.input}
            type="number"
            placeholder="Protein (g)"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
          />
          <input
            style={S.input}
            type="number"
            placeholder="Carbs (g)"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
          />
          <input
            style={S.input}
            type="number"
            placeholder="Fat (g)"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
          />
        </div>
      )}
      <button type="submit" style={S.addBtn}>
        + Add to {meal}
      </button>
    </form>
  );
}

/* ---------- quick add ---------- */

function QuickAdd({ onAdd }) {
  const [meal, setMeal] = useState("Snack");
  return (
    <section style={S.card}>
      <div style={S.quickHeader}>
        <h2 style={S.cardTitle}>Quick add</h2>
        <select
          style={S.quickMeal}
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
        >
          {MEALS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div style={S.chips}>
        {QUICK_FOODS.map((f) => (
          <button
            key={f.name}
            style={S.chip}
            onClick={() => onAdd(f, meal)}
            title={`${f.calories} kcal`}
          >
            {f.name}
            <span style={S.chipCal}>{f.calories}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- meal list ---------- */

function MealList({ entries, onRemove }) {
  if (entries.length === 0) {
    return (
      <section style={S.card}>
        <div style={S.empty}>
          <span style={{ fontSize: 32 }}>🍽️</span>
          <p style={S.emptyText}>No food logged yet for this day.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {MEALS.map((meal) => {
        const items = entries.filter((e) => e.meal === meal);
        if (items.length === 0) return null;
        const cal = items.reduce((s, e) => s + (e.calories || 0), 0);
        return (
          <section key={meal} style={S.card}>
            <div style={S.mealHeader}>
              <h2 style={S.cardTitle}>{meal}</h2>
              <span style={S.mealCal}>{cal} kcal</span>
            </div>
            <ul style={S.list}>
              {items.map((e) => (
                <li key={e.id} style={S.item}>
                  <div style={S.itemMain}>
                    <span style={S.itemName}>{e.name}</span>
                    <span style={S.itemMacros}>
                      P {e.protein} · C {e.carbs} · F {e.fat}
                    </span>
                  </div>
                  <span style={S.itemCal}>{e.calories}</span>
                  <button
                    style={S.removeBtn}
                    onClick={() => onRemove(e.id)}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

/* ---------- styles ---------- */

const S = {
  page: {
    minHeight: "100vh",
    background: "#0c0d12",
    color: "#e7e9f0",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "24px 16px 64px",
  },
  container: { maxWidth: 520, margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brand: { display: "flex", alignItems: "center", gap: 8 },
  brandIcon: { fontSize: 24 },
  brandText: { fontSize: 20, fontWeight: 700, letterSpacing: -0.3 },
  dateNav: { display: "flex", alignItems: "center", gap: 4 },
  navBtn: {
    background: "#181a24",
    border: "1px solid #262936",
    color: "#e7e9f0",
    width: 32,
    height: 32,
    borderRadius: 8,
    fontSize: 18,
    cursor: "pointer",
    lineHeight: 1,
  },
  dateLabel: {
    background: "transparent",
    border: "none",
    color: "#e7e9f0",
    fontSize: 14,
    fontWeight: 600,
    minWidth: 90,
    textAlign: "center",
  },
  summary: {
    display: "flex",
    gap: 20,
    alignItems: "center",
    background: "#12141c",
    border: "1px solid #1d1f2a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  ringWrap: { flexShrink: 0 },
  summaryInfo: { flex: 1, minWidth: 0 },
  goalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  goalLabel: { fontSize: 13, color: "#7c8099" },
  goalValue: {
    background: "transparent",
    border: "none",
    color: "#e7e9f0",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  goalInput: {
    width: 90,
    background: "#0c0d12",
    border: "1px solid #3b3f52",
    borderRadius: 6,
    color: "#fff",
    padding: "4px 8px",
    fontSize: 14,
  },
  remainRow: { display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 },
  remainNum: { fontSize: 28, fontWeight: 800 },
  remainLabel: { fontSize: 13, color: "#7c8099" },
  macros: { display: "flex", gap: 14 },
  macro: { display: "flex", alignItems: "center", gap: 5 },
  macroDot: { width: 8, height: 8, borderRadius: "50%" },
  macroValue: { fontSize: 13, fontWeight: 700 },
  macroLabel: { fontSize: 12, color: "#7c8099" },
  card: {
    background: "#12141c",
    border: "1px solid #1d1f2a",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12 },
  formRow: { display: "flex", gap: 8, marginBottom: 10 },
  input: {
    flex: 1,
    width: "100%",
    background: "#0c0d12",
    border: "1px solid #262936",
    borderRadius: 8,
    color: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
  },
  macroToggle: {
    background: "transparent",
    border: "1px dashed #3b3f52",
    color: "#9aa0b8",
    borderRadius: 8,
    padding: "0 14px",
    fontSize: 13,
    cursor: "pointer",
  },
  addBtn: {
    width: "100%",
    background: "#4ade80",
    color: "#06281a",
    border: "none",
    borderRadius: 10,
    padding: "12px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
  },
  quickHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quickMeal: {
    background: "#0c0d12",
    border: "1px solid #262936",
    borderRadius: 8,
    color: "#e7e9f0",
    padding: "6px 10px",
    fontSize: 13,
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#181a24",
    border: "1px solid #262936",
    borderRadius: 20,
    color: "#e7e9f0",
    padding: "7px 12px",
    fontSize: 13,
    cursor: "pointer",
  },
  chipCal: { color: "#7c8099", fontSize: 12 },
  mealHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mealCal: { fontSize: 13, color: "#9aa0b8", fontWeight: 600 },
  list: { listStyle: "none" },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderTop: "1px solid #1d1f2a",
  },
  itemMain: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 },
  itemName: { fontSize: 14, fontWeight: 500 },
  itemMacros: { fontSize: 11, color: "#7c8099" },
  itemCal: { fontSize: 14, fontWeight: 700, color: "#e7e9f0" },
  removeBtn: {
    background: "transparent",
    border: "none",
    color: "#7c8099",
    fontSize: 20,
    cursor: "pointer",
    lineHeight: 1,
    padding: "0 4px",
  },
  empty: { textAlign: "center", padding: "20px 0", color: "#7c8099" },
  emptyText: { marginTop: 8, fontSize: 14 },
};
