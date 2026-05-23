import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { FOOD_DB, searchFoods } from "./foods";

/* ---------- storage helpers ---------- */

const GOAL_KEY = "ct_goal_v1";
const ENTRIES_KEY = "ct_entries_v1";
const CUSTOM_KEY = "ct_custom_v1";

function loadGoal() {
  const raw = localStorage.getItem(GOAL_KEY);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 2000;
}

function loadJSON(key) {
  try {
    const raw = localStorage.getItem(key);
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

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];

const PROFILE_KEY = "ct_profile_v1";

const ACTIVITY = [
  { label: "Sedentary — little or no exercise", factor: 1.2 },
  { label: "Light — exercise 1–3 days/week", factor: 1.375 },
  { label: "Moderate — exercise 3–5 days/week", factor: 1.55 },
  { label: "Active — exercise 6–7 days/week", factor: 1.725 },
];

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ---------- main app ---------- */

export default function App() {
  const [goal, setGoal] = useState(loadGoal);
  const [entries, setEntries] = useState(() => loadJSON(ENTRIES_KEY));
  const [customFoods, setCustomFoods] = useState(() => loadJSON(CUSTOM_KEY));
  const [viewDate, setViewDate] = useState(() => new Date());
  const dateKey = toKey(viewDate);

  useEffect(() => {
    localStorage.setItem(GOAL_KEY, String(goal));
  }, [goal]);

  useEffect(() => {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customFoods));
  }, [customFoods]);

  // Combined searchable database: built-in foods + user's saved custom foods.
  const foodDb = useMemo(() => [...customFoods, ...FOOD_DB], [customFoods]);

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
    (food, meal, servings = 1) => {
      const mult = servings > 0 ? servings : 1;
      setEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          date: dateKey,
          meal,
          name: food.name,
          serving: food.serving || "",
          servings: mult,
          calories: Math.round((food.calories || 0) * mult),
          protein: Math.round((food.protein || 0) * mult),
          carbs: Math.round((food.carbs || 0) * mult),
          fat: Math.round((food.fat || 0) * mult),
          ts: Date.now(),
        },
      ]);
    },
    [dateKey]
  );

  // Remember a food in the user's custom database so it autocompletes later.
  const rememberFood = useCallback((food) => {
    const exists = (list) =>
      list.some((f) => f.name.trim().toLowerCase() === food.name.trim().toLowerCase());
    if (FOOD_DB.some((f) => f.name.trim().toLowerCase() === food.name.trim().toLowerCase()))
      return;
    setCustomFoods((prev) =>
      exists(prev) ? prev : [{ ...food, custom: true }, ...prev].slice(0, 200)
    );
  }, []);

  const removeEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Recently logged foods (unique by name), most recent first.
  const recents = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (let i = entries.length - 1; i >= 0 && out.length < 8; i--) {
      const e = entries[i];
      const key = e.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(e);
    }
    return out;
  }, [entries]);

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

        <GoalSetup goal={goal} onGoalChange={setGoal} />

        <FoodPicker db={foodDb} onAdd={addEntry} onRemember={rememberFood} />

        {recents.length > 0 && (
          <Recents recents={recents} onAdd={addEntry} />
        )}

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
          <circle cx="65" cy="65" r="52" fill="none" stroke="#1d1f2a" strokeWidth="12" />
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
          <text x="65" y="60" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700">
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

/* ---------- weight-loss target calculator (Mifflin–St Jeor) ---------- */

function GoalSetup({ goal, onGoalChange }) {
  const saved = loadProfile();
  const [open, setOpen] = useState(false);
  const [sex, setSex] = useState(saved?.sex || "male");
  const [age, setAge] = useState(saved?.age || "");
  const [ft, setFt] = useState(saved?.ft || "");
  const [inch, setInch] = useState(saved?.inch ?? "");
  const [weight, setWeight] = useState(saved?.weight || ""); // lbs
  const [activity, setActivity] = useState(saved?.activity ?? 1.2);
  const [rate, setRate] = useState(saved?.rate ?? 1); // lbs/week
  const [result, setResult] = useState(null);

  function calc() {
    const a = parseInt(age, 10);
    const f = parseInt(ft, 10);
    const i = parseInt(inch, 10) || 0;
    const w = parseFloat(weight);
    if (!Number.isFinite(a) || !Number.isFinite(f) || !Number.isFinite(w)) {
      setResult({ error: "Fill in age, height, and weight." });
      return;
    }
    const kg = w * 0.453592;
    const cm = (f * 12 + i) * 2.54;
    const bmr = 10 * kg + 6.25 * cm - 5 * a + (sex === "male" ? 5 : -161);
    const tdee = bmr * activity;
    const deficit = rate * 500; // ~3500 kcal per pound, spread over the week
    const floor = sex === "male" ? 1500 : 1200; // common safe minimum
    const target = Math.max(floor, Math.round((tdee - deficit) / 10) * 10);
    const floored = tdee - deficit < floor;
    setResult({ tdee: Math.round(tdee), target, floored, rate });
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({ sex, age, ft, inch, weight, activity, rate })
    );
  }

  return (
    <section style={S.card}>
      <div style={S.quickHeader}>
        <h2 style={S.cardTitle}>Weight-loss target</h2>
        <button style={S.setupToggle} onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Calculate"}
        </button>
      </div>

      {!open && (
        <p style={S.subtle}>
          Current goal: <b>{goal} kcal/day</b>. Tap Calculate to get a science-based
          target for steady weight loss.
        </p>
      )}

      {open && (
        <>
          <div style={S.formRow}>
            <select style={S.input} value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <input
              style={S.input}
              type="number"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          <div style={S.formRow}>
            <input
              style={S.input}
              type="number"
              placeholder="Height ft"
              value={ft}
              onChange={(e) => setFt(e.target.value)}
            />
            <input
              style={S.input}
              type="number"
              placeholder="in"
              value={inch}
              onChange={(e) => setInch(e.target.value)}
            />
            <input
              style={{ ...S.input, flex: 1.4 }}
              type="number"
              placeholder="Weight (lbs)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <div style={S.formRow}>
            <select
              style={{ ...S.input, flex: 2 }}
              value={activity}
              onChange={(e) => setActivity(parseFloat(e.target.value))}
            >
              {ACTIVITY.map((a) => (
                <option key={a.factor} value={a.factor}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div style={S.formRow}>
            <select
              style={{ ...S.input, flex: 2 }}
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
            >
              <option value={0.5}>Lose 0.5 lb/week (gentle)</option>
              <option value={1}>Lose 1 lb/week (recommended)</option>
              <option value={1.5}>Lose 1.5 lb/week (aggressive)</option>
            </select>
            <button style={S.calcBtn} onClick={calc}>
              Calculate
            </button>
          </div>

          {result?.error && <p style={S.errorText}>{result.error}</p>}

          {result && !result.error && (
            <div style={S.resultBox}>
              <div style={S.resultRow}>
                <span style={S.subtle}>Maintenance (TDEE)</span>
                <span>{result.tdee} kcal</span>
              </div>
              <div style={S.resultRow}>
                <span style={S.subtle}>Target to lose {result.rate} lb/week</span>
                <span style={{ fontWeight: 800, color: "#4ade80" }}>
                  {result.target} kcal
                </span>
              </div>
              {result.floored && (
                <p style={S.subtle}>
                  Capped at a safe minimum — don’t eat below this without medical advice.
                </p>
              )}
              <button
                style={S.addBtn}
                onClick={() => {
                  onGoalChange(result.target);
                  setOpen(false);
                }}
              >
                Use {result.target} kcal as my daily goal
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ---------- food picker (search + autocomplete) ---------- */

const EMPTY_FORM = { name: "", serving: "", calories: "", protein: "", carbs: "", fat: "" };

function FoodPicker({ db, onAdd, onRemember }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM); // selected/typed food
  const [selected, setSelected] = useState(false); // a DB food was chosen
  const [meal, setMeal] = useState("Breakfast");
  const [servings, setServings] = useState(1);
  const boxRef = useRef(null);

  const results = useMemo(() => searchFoods(query, db), [query, db]);

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function choose(food) {
    setForm({
      name: food.name,
      serving: food.serving || "",
      calories: String(food.calories ?? ""),
      protein: String(food.protein ?? ""),
      carbs: String(food.carbs ?? ""),
      fat: String(food.fat ?? ""),
    });
    setSelected(true);
    setQuery(food.name);
    setServings(1);
    setOpen(false);
  }

  function onQueryChange(v) {
    setQuery(v);
    setSelected(false);
    setForm((f) => ({ ...f, name: v }));
    setOpen(true);
    setHighlight(0);
  }

  function onKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const calNum = parseInt(form.calories, 10);
  const canAdd = form.name.trim() && Number.isFinite(calNum);
  const preview = canAdd ? Math.round(calNum * (servings > 0 ? servings : 1)) : 0;

  function submit() {
    if (!canAdd) return;
    const food = {
      name: form.name.trim(),
      serving: form.serving.trim(),
      calories: calNum,
      protein: parseInt(form.protein, 10) || 0,
      carbs: parseInt(form.carbs, 10) || 0,
      fat: parseInt(form.fat, 10) || 0,
    };
    onAdd(food, meal, servings);
    onRemember(food); // persist new/custom foods for future autocomplete
    setForm(EMPTY_FORM);
    setQuery("");
    setSelected(false);
    setServings(1);
  }

  const showManual = query.trim().length > 0;

  return (
    <section style={S.card}>
      <h2 style={S.cardTitle}>Add food</h2>

      <div style={S.combo} ref={boxRef}>
        <input
          style={S.searchInput}
          placeholder="Search foods (e.g. steak, banana, latte)…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => query && setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {open && results.length > 0 && (
          <ul style={S.dropdown}>
            {results.map((f, i) => (
              <li
                key={f.name}
                style={{
                  ...S.option,
                  background: i === highlight ? "#1d2030" : "transparent",
                }}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(f);
                }}
              >
                <div style={S.optMain}>
                  <span style={S.optName}>
                    {f.name}
                    {f.custom && <span style={S.customTag}>saved</span>}
                  </span>
                  {f.serving && <span style={S.optServing}>{f.serving}</span>}
                </div>
                <span style={S.optCal}>{f.calories} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showManual && (
        <>
          {selected && form.serving && (
            <p style={S.servingNote}>
              Per serving: {form.serving} · {form.calories} kcal
            </p>
          )}
          <div style={S.formRow}>
            <input
              style={{ ...S.input, flex: 1 }}
              type="number"
              placeholder="Calories"
              value={form.calories}
              onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
            />
            <input
              style={S.input}
              type="number"
              placeholder="Protein g"
              value={form.protein}
              onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
            />
            <input
              style={S.input}
              type="number"
              placeholder="Carbs g"
              value={form.carbs}
              onChange={(e) => setForm((f) => ({ ...f, carbs: e.target.value }))}
            />
            <input
              style={S.input}
              type="number"
              placeholder="Fat g"
              value={form.fat}
              onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))}
            />
          </div>

          <div style={S.formRow}>
            <div style={S.stepper}>
              <button
                type="button"
                style={S.stepBtn}
                onClick={() => setServings((s) => Math.max(0.5, +(s - 0.5).toFixed(1)))}
              >
                −
              </button>
              <span style={S.stepVal}>{servings}×</span>
              <button
                type="button"
                style={S.stepBtn}
                onClick={() => setServings((s) => +(s + 0.5).toFixed(1))}
              >
                +
              </button>
            </div>
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
          </div>

          <button type="button" style={{ ...S.addBtn, opacity: canAdd ? 1 : 0.5 }} onClick={submit} disabled={!canAdd}>
            + Add {preview ? `${preview} kcal ` : ""}to {meal}
          </button>
        </>
      )}
    </section>
  );
}

/* ---------- recents ---------- */

function Recents({ recents, onAdd }) {
  const [meal, setMeal] = useState("Snack");
  return (
    <section style={S.card}>
      <div style={S.quickHeader}>
        <h2 style={S.cardTitle}>Recent foods</h2>
        <select style={S.quickMeal} value={meal} onChange={(e) => setMeal(e.target.value)}>
          {MEALS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div style={S.chips}>
        {recents.map((e) => (
          <button
            key={e.name}
            style={S.chip}
            title={`${e.calories} kcal`}
            onClick={() =>
              onAdd(
                {
                  name: e.name,
                  serving: e.serving,
                  calories: Math.round((e.calories || 0) / (e.servings || 1)),
                  protein: Math.round((e.protein || 0) / (e.servings || 1)),
                  carbs: Math.round((e.carbs || 0) / (e.servings || 1)),
                  fat: Math.round((e.fat || 0) / (e.servings || 1)),
                },
                meal,
                e.servings || 1
              )
            }
          >
            {e.name}
            <span style={S.chipCal}>{e.calories}</span>
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
                    <span style={S.itemName}>
                      {e.name}
                      {e.servings && e.servings !== 1 ? ` ×${e.servings}` : ""}
                    </span>
                    <span style={S.itemMacros}>
                      {e.serving ? `${e.serving} · ` : ""}P {e.protein} · C {e.carbs} · F {e.fat}
                    </span>
                  </div>
                  <span style={S.itemCal}>{e.calories}</span>
                  <button style={S.removeBtn} onClick={() => onRemove(e.id)} aria-label="Remove">
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
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "24px 16px 64px",
  },
  container: { maxWidth: 520, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
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
  goalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
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
  setupToggle: {
    background: "#181a24",
    border: "1px solid #262936",
    color: "#9aa0b8",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13,
    cursor: "pointer",
  },
  subtle: { fontSize: 13, color: "#7c8099", lineHeight: 1.5, margin: 0 },
  errorText: { fontSize: 13, color: "#ff6b6b", margin: "4px 0" },
  calcBtn: {
    background: "#262936",
    color: "#e7e9f0",
    border: "none",
    borderRadius: 8,
    padding: "0 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  resultBox: {
    background: "#0c0d12",
    border: "1px solid #1d1f2a",
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
  },
  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
    marginBottom: 8,
  },
  combo: { position: "relative", marginBottom: 10 },
  searchInput: {
    width: "100%",
    background: "#0c0d12",
    border: "1px solid #262936",
    borderRadius: 10,
    color: "#fff",
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#12141c",
    border: "1px solid #2a2e3e",
    borderRadius: 10,
    listStyle: "none",
    maxHeight: 300,
    overflowY: "auto",
    zIndex: 20,
    boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
  },
  option: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    cursor: "pointer",
    gap: 10,
  },
  optMain: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  optName: { fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 },
  optServing: { fontSize: 12, color: "#7c8099" },
  optCal: { fontSize: 13, color: "#9aa0b8", fontWeight: 600, whiteSpace: "nowrap" },
  customTag: {
    fontSize: 10,
    color: "#4ade80",
    border: "1px solid #2e6b46",
    borderRadius: 4,
    padding: "0 4px",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  servingNote: { fontSize: 12, color: "#7c8099", margin: "0 0 10px" },
  formRow: { display: "flex", gap: 8, marginBottom: 10 },
  input: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    background: "#0c0d12",
    border: "1px solid #262936",
    borderRadius: 8,
    color: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
  },
  stepper: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#0c0d12",
    border: "1px solid #262936",
    borderRadius: 8,
    padding: "0 6px",
  },
  stepBtn: {
    background: "transparent",
    border: "none",
    color: "#e7e9f0",
    fontSize: 20,
    width: 28,
    height: 38,
    cursor: "pointer",
    lineHeight: 1,
  },
  stepVal: { fontSize: 14, fontWeight: 700, minWidth: 34, textAlign: "center" },
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
  quickHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
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
  mealHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  mealCal: { fontSize: 13, color: "#9aa0b8", fontWeight: 600 },
  list: { listStyle: "none" },
  item: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid #1d1f2a" },
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
