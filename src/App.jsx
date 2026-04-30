import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Analytics } from "@vercel/analytics/react";
import { supabase, supabaseConfigured } from "./supabase";

const C = {
  bg: "#0c0d12", bg1: "#131520", bg2: "#1a1c2a", bg3: "#22253a",
  border: "#2a2d42", borderH: "#3a3d55",
  gold: "#d4a72c", goldL: "#e8c34a",
  blue: "#5b8def", green: "#4caf7d", red: "#d45555", amber: "#d4a853",
  tx: "#9a97a0", txm: "#65626e", txb: "#eae6dd",
};

const RANKS = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];
const SD = {
  h: { s: "\u2665", c: "#d45555" },
  d: { s: "\u2666", c: "#5b8def" },
  c: { s: "\u2663", c: "#4caf7d" },
  s: { s: "\u2660", c: "#7a7888" },
};

function parseCards(str) {
  if (!str) return [];
  return str.trim().split(/\s+/).map(function(t) {
    var r = t.slice(0, -1).toUpperCase();
    var s = t.slice(-1).toLowerCase();
    var info = SD[s] || { s: "?", c: "#888" };
    return { r: r, s: s, sym: info.s, clr: info.c };
  });
}

const VERD = {
  Best: { i: "\u2713\u2713", c: C.green, l: "Best Play" },
  Good: { i: "\u2713", c: C.blue, l: "Good" },
  Inaccurate: { i: "?!", c: C.amber, l: "Inaccuracy" },
  Mistake: { i: "\u2717", c: "#e09040", l: "Mistake" },
  Blunder: { i: "\u2717\u2717", c: C.red, l: "Blunder" },
};

/* ── GTO Charts — ported from AHTOOOXA/poker-charts (MIT License) ── */
var ACTION_COLORS = { raise: "#4caf7d", call: "#e5c454", fold: "#d45555", allin: "#9b6dd1" };

var charts = 
{
  "BB-vs-4bet-BTN": {
    "54s": "fold", "65s": "fold", "76s": "fold", "77": "allin", "86s": "fold", "87s": "fold", "88": "allin",
    "97s": "fold", "98s": "call", "99": "allin", "A4s": "fold", "A5s": "fold", "AA": "allin", "AJo": "fold",
    "AJs": "call", "AKo": "allin", "AKs": "allin", "AQo": "fold", "AQs": "call", "ATs": "call", "J9s": "fold",
    "JJ": "allin", "JTs": "call", "KJs": "call", "KK": "allin", "KQs": "call", "KTs": "fold", "QJs": "fold",
    "QQ": "allin", "QTs": "fold", "T8s": "fold", "T9s": "call", "TT": "call",
  },

  "BB-vs-4bet-CO": {
    "65s": "fold", "76s": "call", "87s": "call", "88": "allin", "98s": "call", "99": "allin", "A4s": "fold",
    "A5s": "fold", "AA": "allin", "AJo": "fold", "AJs": "call", "AKo": "allin", "AKs": "allin", "AQo": "fold",
    "AQs": "call", "ATs": "fold", "JJ": "allin", "JTs": "fold", "KJs": "fold", "KK": "allin", "KQo": "fold",
    "KQs": "call", "KTs": "fold", "QJs": "fold", "QQ": "allin", "QTs": "fold", "TT": "call",
  },

  "BB-vs-4bet-MP": {
    "54s": "fold", "65s": "fold", "76s": "fold", "87s": "fold", "A4s": "fold", "A5s": "fold", "AA": "allin",
    "AJs": "fold", "AKo": "call", "AKs": "allin", "AQs": "fold", "ATs": "fold", "JJ": "call", "KJs": "fold",
    "KK": "allin", "KQs": "fold", "QJs": "fold", "QQ": "call", "TT": "call",
  },

  "BB-vs-4bet-SB": {
    "54s": "call", "64s": "fold", "65s": "call", "66": "allin", "75s": "fold", "76s": "call", "77": "allin",
    "85s": "fold", "86s": "fold", "87s": "call", "88": "allin", "96s": "fold", "97s": "fold", "98o": "fold",
    "98s": "fold", "99": "call", "A2o": "fold", "A2s": "fold", "A3o": "fold", "A3s": "fold", "A4o": "fold",
    "A4s": "fold", "A5o": "fold", "A5s": "fold", "AA": "call", "AJo": "fold", "AJs": "call", "AKo": "allin",
    "AKs": "allin", "AQo": "call", "AQs": "call", "ATs": "call", "JJ": "allin", "JTs": "call", "K4o": "fold",
    "KJs": "call", "KK": "allin", "KQo": "fold", "KQs": "call", "KTs": "fold", "QJs": "call", "QQ": "allin",
    "QTs": "fold", "T6s": "fold", "T7s": "fold", "T9s": "call", "TT": "call",
  },

  "BB-vs-4bet-UTG": {
    "54s": "fold", "65s": "fold", "76s": "fold", "87s": "fold", "A4s": "fold", "A5s": "fold", "AA": "allin",
    "AJs": "fold", "AKo": "call", "AKs": "allin", "AQs": "fold", "ATs": "fold", "JJ": "call", "KJs": "fold",
    "KK": "allin", "KQs": "fold", "QJs": "fold", "QQ": "call", "TT": "call",
  },

  "BB-vs-open-BTN": {
    "22": "call", "32s": "call", "33": "call", "42s": "call", "43s": "call", "44": "call", "52s": "call",
    "53s": "call", "54s": "raise", "55": "call", "63s": "call", "64s": "call", "65s": "raise", "66": "call",
    "74s": "call", "75s": "call", "76o": "call", "76s": "raise", "77": "allin", "85s": "call", "86s": "raise",
    "87o": "call", "87s": "raise", "88": "allin", "95s": "call", "96s": "call", "97s": "raise", "98o": "call",
    "98s": "raise", "99": "allin", "A2o": "call", "A2s": "call", "A3o": "call", "A3s": "call", "A4o": "call",
    "A4s": "raise", "A5o": "call", "A5s": "raise", "A6o": "call", "A6s": "call", "A7o": "call", "A7s": "call",
    "A8o": "call", "A8s": "call", "A9o": "call", "A9s": "call", "AA": "allin", "AJo": "raise", "AJs": "raise",
    "AKo": "allin", "AKs": "allin", "AQo": "raise", "AQs": "raise", "ATo": "call", "ATs": "raise", "J2s": "call",
    "J3s": "call", "J4s": "call", "J5s": "call", "J6s": "call", "J7s": "call", "J8o": "call", "J8s": "call",
    "J9o": "call", "J9s": "raise", "JJ": "allin", "JTo": "call", "JTs": "raise", "K2s": "call", "K3s": "call",
    "K4s": "call", "K5s": "call", "K6s": "call", "K7o": "call", "K7s": "call", "K8o": "call", "K8s": "call",
    "K9o": "call", "K9s": "call", "KJo": "call", "KJs": "raise", "KK": "allin", "KQo": "call", "KQs": "raise",
    "KTo": "call", "KTs": "raise", "Q2s": "call", "Q3s": "call", "Q4s": "call", "Q5s": "call", "Q6s": "call",
    "Q7s": "call", "Q8o": "call", "Q8s": "call", "Q9o": "call", "Q9s": "call", "QJo": "call", "QJs": "raise",
    "QQ": "allin", "QTo": "call", "QTs": "raise", "T4s": "call", "T5s": "call", "T6s": "call", "T7s": "call",
    "T8o": "call", "T8s": "raise", "T9o": "call", "T9s": "raise", "TT": "raise",
  },

  "BB-vs-open-CO": {
    "22": "call", "33": "call", "43s": "call", "44": "call", "53s": "call", "54s": "call", "55": "call", "63s": "call",
    "64s": "call", "65s": "raise", "66": "call", "74s": "call", "75s": "call", "76s": "raise", "77": "call",
    "84s": "call", "85s": "call", "86s": "call", "87s": "raise", "88": "allin", "95s": "call", "96s": "call",
    "97s": "call", "98s": "raise", "99": "allin", "A2s": "call", "A3s": "call", "A4s": "raise", "A5s": "raise",
    "A6s": "call", "A7s": "call", "A8o": "call", "A8s": "call", "A9o": "call", "A9s": "call", "AA": "allin",
    "AJo": "raise", "AJs": "raise", "AKo": "allin", "AKs": "allin", "AQo": "raise", "AQs": "raise", "ATo": "call",
    "ATs": "raise", "J2s": "call", "J3s": "call", "J4s": "call", "J5s": "call", "J6s": "call", "J7s": "call",
    "J8s": "call", "J9s": "call", "JJ": "allin", "JTs": "raise", "K2s": "call", "K3s": "call", "K4s": "call",
    "K5s": "call", "K6s": "call", "K7s": "call", "K8s": "call", "K9s": "call", "KJo": "call", "KJs": "raise",
    "KK": "allin", "KQo": "raise", "KQs": "raise", "KTo": "call", "KTs": "raise", "Q2s": "call", "Q3s": "call",
    "Q4s": "call", "Q5s": "call", "Q6s": "call", "Q7s": "call", "Q8s": "call", "Q9s": "call", "QJo": "call",
    "QJs": "raise", "QQ": "allin", "QTo": "call", "QTs": "raise", "T7s": "call", "T8s": "call", "T9s": "call",
    "TT": "raise",
  },

  "BB-vs-open-MP": {
    "22": "call", "33": "call", "43s": "call", "44": "call", "53s": "call", "54s": "raise", "55": "call",
    "64s": "call", "65s": "raise", "66": "call", "75s": "call", "76s": "raise", "77": "call", "86s": "call",
    "87s": "raise", "88": "call", "96s": "call", "97s": "call", "98s": "call", "99": "call", "A2s": "call",
    "A3s": "call", "A4s": "raise", "A5s": "raise", "A6s": "call", "A7s": "call", "A8s": "call", "A9s": "call",
    "AA": "allin", "AJo": "call", "AJs": "raise", "AKo": "raise", "AKs": "allin", "AQo": "call", "AQs": "raise",
    "ATo": "call", "ATs": "raise", "J8s": "call", "J9s": "call", "JJ": "raise", "JTs": "call", "K2s": "call",
    "K3s": "call", "K4s": "call", "K5s": "call", "K6s": "call", "K7s": "call", "K8s": "call", "K9s": "call",
    "KJo": "call", "KJs": "raise", "KK": "allin", "KQo": "call", "KQs": "raise", "KTs": "call", "Q7s": "call",
    "Q8s": "call", "Q9s": "call", "QJo": "call", "QJs": "raise", "QQ": "raise", "QTs": "call", "T7s": "call",
    "T8s": "call", "T9s": "call", "TT": "raise",
  },

  "BB-vs-open-SB": {
    "22": "call", "32s": "call", "33": "call", "42s": "call", "43s": "call", "44": "call", "52s": "call",
    "53s": "call", "54o": "call", "54s": "raise", "55": "call", "62s": "call", "63s": "call", "64s": "raise",
    "65o": "call", "65s": "raise", "66": "allin", "72s": "call", "73s": "call", "74s": "call", "75o": "call",
    "75s": "raise", "76o": "call", "76s": "raise", "77": "allin", "82s": "call", "83s": "call", "84s": "call",
    "85s": "raise", "86o": "call", "86s": "raise", "87o": "call", "87s": "raise", "88": "allin", "92s": "call",
    "93s": "call", "94s": "call", "95s": "call", "96s": "raise", "97o": "call", "97s": "raise", "98o": "raise",
    "98s": "raise", "99": "raise", "A2o": "raise", "A2s": "raise", "A3o": "raise", "A3s": "raise", "A4o": "raise",
    "A4s": "raise", "A5o": "raise", "A5s": "raise", "A6o": "call", "A6s": "call", "A7o": "call", "A7s": "call",
    "A8o": "call", "A8s": "call", "A9o": "call", "A9s": "call", "AA": "raise", "AJo": "raise", "AJs": "raise",
    "AKo": "allin", "AKs": "allin", "AQo": "raise", "AQs": "raise", "ATo": "call", "ATs": "raise", "J2s": "call",
    "J3s": "call", "J4s": "call", "J5s": "call", "J6s": "call", "J7o": "call", "J7s": "call", "J8o": "call",
    "J8s": "call", "J9o": "call", "J9s": "call", "JJ": "allin", "JTo": "call", "JTs": "raise", "K2s": "call",
    "K3s": "call", "K4o": "raise", "K4s": "call", "K5o": "call", "K5s": "call", "K6o": "call", "K6s": "call",
    "K7o": "call", "K7s": "call", "K8o": "call", "K8s": "call", "K9o": "call", "K9s": "call", "KJo": "call",
    "KJs": "raise", "KK": "allin", "KQo": "raise", "KQs": "raise", "KTo": "call", "KTs": "raise", "Q2s": "call",
    "Q3s": "call", "Q4s": "call", "Q5s": "call", "Q6o": "call", "Q6s": "call", "Q7o": "call", "Q7s": "call",
    "Q8o": "call", "Q8s": "call", "Q9o": "call", "Q9s": "call", "QJo": "call", "QJs": "raise", "QQ": "allin",
    "QTo": "call", "QTs": "raise", "T2s": "call", "T3s": "call", "T4s": "call", "T5s": "call", "T6s": "raise",
    "T7o": "call", "T7s": "raise", "T8o": "call", "T8s": "call", "T9o": "call", "T9s": "raise", "TT": "raise",
  },

  "BB-vs-open-UTG": {
    "22": "call", "33": "call", "43s": "call", "44": "call", "53s": "call", "54s": "raise", "55": "call",
    "64s": "call", "65s": "raise", "66": "call", "75s": "call", "76s": "raise", "77": "call", "86s": "call",
    "87s": "raise", "88": "call", "96s": "call", "97s": "call", "98s": "call", "99": "call", "A2s": "call",
    "A3s": "call", "A4s": "raise", "A5s": "raise", "A6s": "call", "A7s": "call", "A8s": "call", "A9s": "call",
    "AA": "allin", "AJo": "call", "AJs": "raise", "AKo": "raise", "AKs": "allin", "AQo": "call", "AQs": "raise",
    "ATo": "call", "ATs": "raise", "J8s": "call", "J9s": "call", "JJ": "raise", "JTo": "call", "JTs": "call",
    "K2s": "call", "K3s": "call", "K4s": "call", "K5s": "call", "K6s": "call", "K7s": "call", "K8s": "call",
    "K9s": "call", "KJo": "call", "KJs": "raise", "KK": "allin", "KQo": "call", "KQs": "raise", "KTs": "call",
    "Q8s": "call", "Q9s": "call", "QJo": "call", "QJs": "raise", "QQ": "raise", "QTo": "call", "QTs": "call",
    "T7s": "call", "T8s": "call", "T9s": "call", "TT": "raise",
  },

  "BTN-RFI": {
    "22": "raise", "33": "raise", "43s": ["raise", "fold"], "44": "raise", "53s": ["raise", "fold"], "54s": "raise",
    "55": "raise", "63s": ["raise", "fold"], "64s": "raise", "65s": "raise", "66": "raise", "74s": ["raise", "fold"],
    "75s": "raise", "76s": "raise", "77": "raise", "85s": ["raise", "fold"], "86s": "raise", "87s": "raise",
    "88": "raise", "96s": "raise", "97s": "raise", "98o": "raise", "98s": "raise", "99": "raise", "A2s": "raise",
    "A3s": "raise", "A4o": "raise", "A4s": "raise", "A5o": "raise", "A5s": "raise", "A6o": "raise", "A6s": "raise",
    "A7o": "raise", "A7s": "raise", "A8o": "raise", "A8s": "raise", "A9o": "raise", "A9s": "raise", "AA": "raise",
    "AJo": "raise", "AJs": "raise", "AKo": "raise", "AKs": "raise", "AQo": "raise", "AQs": "raise", "ATo": "raise",
    "ATs": "raise", "J5s": "raise", "J6s": "raise", "J7s": "raise", "J8o": "raise", "J8s": "raise", "J9o": "raise",
    "J9s": "raise", "JJ": "raise", "JTo": "raise", "JTs": "raise", "K2s": "raise", "K3s": "raise", "K4s": "raise",
    "K5s": "raise", "K6s": "raise", "K7s": "raise", "K8o": ["raise", "fold"], "K8s": "raise", "K9o": "raise",
    "K9s": "raise", "KJo": "raise", "KJs": "raise", "KK": "raise", "KQo": "raise", "KQs": "raise", "KTo": "raise",
    "KTs": "raise", "Q2s": "raise", "Q3s": "raise", "Q4s": "raise", "Q5s": "raise", "Q6s": "raise", "Q7s": "raise",
    "Q8o": "raise", "Q8s": "raise", "Q9o": "raise", "Q9s": "raise", "QJo": "raise", "QJs": "raise", "QQ": "raise",
    "QTo": "raise", "QTs": "raise", "T6s": "raise", "T7s": "raise", "T8o": "raise", "T8s": "raise", "T9o": "raise",
    "T9s": "raise", "TT": "raise",
  },

  "BTN-vs-3bet-BB": {
    "22": "call", "33": "call", "44": "call", "54s": "call", "55": "call", "65s": "call", "66": "call", "76s": "call",
    "77": "call", "87s": "call", "88": "call", "98s": "call", "99": "call", "A2s": ["raise", "fold"],
    "A3s": ["raise", "fold"], "A4s": "call", "A5s": "call", "A6s": "call", "A7s": "call", "A8s": "call", "A9s": "call",
    "AA": "allin", "AJo": ["raise", "fold"], "AJs": "call", "AKo": "allin", "AKs": "allin", "AQo": "call",
    "AQs": "call", "ATo": "call", "ATs": "call", "J8s": "call", "J9s": "call", "JJ": "allin", "JTs": "call",
    "K6s": ["raise", "fold"], "K7s": ["raise", "fold"], "K8s": "call", "K9s": "call", "KJs": "call", "KK": "allin",
    "KQo": ["raise", "fold"], "KQs": "call", "KTs": "call", "Q9s": "call", "QJs": "call", "QQ": "allin", "QTs": "call",
    "T8s": "call", "T9s": "call", "TT": "call",
  },

  "BTN-vs-3bet-SB": {
    "22": "call", "33": "call", "44": "call", "54s": "call", "55": "call", "65s": "call", "66": "call", "76s": "call",
    "77": "call", "87s": "call", "88": "call", "97s": "call", "98s": "call", "99": "call", "A2s": ["raise", "fold"],
    "A3s": ["raise", "fold"], "A4s": "call", "A5s": "call", "A6s": "call", "A7s": ["raise", "fold"], "A8s": "call",
    "A9s": "call", "AA": "allin", "AJo": ["raise", "fold"], "AJs": "call", "AKo": "allin", "AKs": "allin",
    "AQo": "call", "AQs": "call", "ATo": "call", "ATs": "call", "J8s": "call", "J9s": "call", "JJ": "allin",
    "JTs": "call", "K6s": ["raise", "fold"], "K7s": ["raise", "fold"], "K8s": "call", "K9s": "call", "KJs": "call",
    "KK": "allin", "KQo": ["raise", "fold"], "KQs": "call", "KTs": "call", "Q8s": "call", "Q9s": "call", "QJs": "call",
    "QQ": "allin", "QTs": "call", "T8s": "call", "T9s": "call", "TT": "call",
  },

  "BTN-vs-4bet-CO": {
    "66": ["call", "fold"], "76s": "call", "77": "allin", "87s": "call", "88": "allin", "98s": "call", "99": "allin",
    "A5s": "allin", "A7s": ["call", "fold"], "A8s": ["call", "fold"], "A9s": ["call", "fold"], "AA": "allin",
    "AJo": ["call", "fold"], "AJs": "call", "AKo": "allin", "AKs": "allin", "AQo": ["call", "fold"], "AQs": "call",
    "ATs": "call", "J9s": ["call", "fold"], "JJ": "call", "JTs": "call", "K9s": ["call", "fold"], "KJs": "call",
    "KK": "allin", "KQo": ["call", "fold"], "KQs": "call", "KTs": "call", "Q9s": ["call", "fold"], "QJs": "call",
    "QQ": "allin", "QTs": "call", "T8s": ["call", "fold"], "T9s": "call", "TT": "call",
  },

  "BTN-vs-4bet-UTG": {
    "76s": "call", "77": ["call", "fold"], "87s": "call", "88": ["call", "fold"], "98s": "call",
    "99": ["call", "fold"], "A2s": ["call", "fold"], "A3s": ["call", "fold"], "A4s": ["call", "fold"],
    "A5s": ["call", "fold"], "AA": "call", "AJs": "call", "AKo": "call", "AKs": "call", "AQo": ["call", "fold"],
    "AQs": "call", "ATs": ["call", "fold"], "JJ": "call", "JTs": ["call", "fold"], "KJs": ["call", "fold"],
    "KK": "call", "KQs": ["call", "fold"], "KTs": ["call", "fold"], "QJs": ["call", "fold"], "QQ": "call",
    "QTs": ["call", "fold"], "T9s": "call", "TT": "call",
  },

  "BTN-vs-open-CO": {
    "44": ["call", "fold"], "55": ["call", "fold"], "66": "raise", "76s": "raise", "77": "raise", "87s": "raise",
    "88": "raise", "98s": "raise", "99": "raise", "A5s": "raise", "A7s": "raise", "A8s": "raise", "A9s": "raise",
    "AA": "raise", "AJo": "raise", "AJs": "raise", "AKo": "raise", "AKs": "raise", "AQo": "raise", "AQs": "raise",
    "ATs": "raise", "J9s": "raise", "JJ": "raise", "JTs": "raise", "K9s": "raise", "KJs": "raise", "KK": "raise",
    "KQo": "raise", "KQs": "raise", "KTs": "raise", "Q9s": "raise", "QJs": "raise", "QQ": "raise", "QTs": "raise",
    "T8s": "raise", "T9s": "raise", "TT": "raise",
  },

  "BTN-vs-open-UTG": {
    "55": ["call", "fold"], "66": ["call", "fold"], "76s": "raise", "77": "raise", "87s": "raise", "88": "raise",
    "98s": "raise", "99": "raise", "A2s": "raise", "A3s": "raise", "A4s": "raise", "A5s": "raise", "AA": "raise",
    "AJs": "raise", "AKo": "raise", "AKs": "raise", "AQo": "raise", "AQs": "raise", "ATs": "raise", "JJ": "raise",
    "JTs": "raise", "KJs": "raise", "KK": "raise", "KQs": "raise", "KTs": "raise", "QJs": "raise", "QQ": "raise",
    "QTs": "raise", "T9s": "raise", "TT": "raise",
  },

  "CO-RFI": {
    "22": "raise", "33": "raise", "44": "raise", "54s": "raise", "55": "raise", "64s": "raise", "65s": "raise",
    "66": "raise", "75s": "raise", "76s": "raise", "77": "raise", "86s": "raise", "87s": "raise", "88": "raise",
    "97s": "raise", "98s": "raise", "99": "raise", "A2s": "raise", "A3s": "raise", "A4s": "raise", "A5s": "raise",
    "A6s": "raise", "A7s": "raise", "A8s": "raise", "A9o": ["raise", "fold"], "A9s": "raise", "AA": "raise",
    "AJo": "raise", "AJs": "raise", "AKo": "raise", "AKs": "raise", "AQo": "raise", "AQs": "raise", "ATo": "raise",
    "ATs": "raise", "J7s": "raise", "J8s": "raise", "J9s": "raise", "JJ": "raise", "JTo": "raise", "JTs": "raise",
    "K5s": ["raise", "fold"], "K6s": "raise", "K7s": "raise", "K8s": "raise", "K9s": "raise", "KJo": "raise",
    "KJs": "raise", "KK": "raise", "KQo": "raise", "KQs": "raise", "KTo": "raise", "KTs": "raise", "Q8s": "raise",
    "Q9s": "raise", "QJo": "raise", "QJs": "raise", "QQ": "raise", "QTo": "raise", "QTs": "raise", "T7s": "raise",
    "T8s": "raise", "T9o": ["raise", "fold"], "T9s": "raise", "TT": "raise",
  },

  "CO-vs-3bet-BB": {
    "54s": "call", "55": "call", "65s": "call", "66": "call", "76s": "call", "77": "call", "87s": "call", "88": "call",
    "99": "call", "A4s": ["raise", "fold"], "A5s": ["raise", "fold"], "A8s": ["raise", "fold"], "A9s": "call",
    "AA": "allin", "AJs": "call", "AKo": "allin", "AKs": "allin", "AQo": "call", "AQs": "call", "ATs": "call",
    "JJ": "call", "JTs": "call", "K8s": ["raise", "fold"], "K9s": "call", "KJs": "call", "KK": "allin", "KQs": "call",
    "KTs": "call", "QJs": "call", "QQ": "allin", "QTs": "call", "T9s": "call", "TT": "call",
  },

  "CO-vs-3bet-BTN": {
    "54s": "call", "55": "call", "65s": "call", "66": "call", "76s": "call", "77": "call", "87s": "call", "88": "call",
    "98s": "call", "99": "call", "A4s": ["raise", "fold"], "A5s": ["raise", "fold"], "A6s": "call", "A7s": "call",
    "A8s": ["raise", "fold"], "A9s": "call", "AA": "allin", "AJo": "call", "AJs": "call", "AKo": "allin",
    "AKs": "allin", "AQo": ["raise", "fold"], "AQs": "call", "ATs": "call", "J9s": "call", "JJ": "allin",
    "JTs": "call", "K9s": ["raise", "fold"], "KJs": "call", "KK": "allin", "KQo": "call", "KQs": "call", "KTs": "call",
    "QJs": "call", "QQ": "allin", "QTs": "call", "T9s": "call", "TT": "call",
  },

  "CO-vs-3bet-SB": {
    "54s": "call", "55": "call", "65s": "call", "66": "call", "76s": "call", "77": "call", "87s": "call", "88": "call",
    "98s": "call", "99": "call", "A4s": ["raise", "fold"], "A5s": ["raise", "fold"], "A8s": ["raise", "fold"],
    "A9s": "call", "AA": "allin", "AJs": "call", "AKo": "allin", "AKs": "allin", "AQo": "call", "AQs": "call",
    "ATs": "call", "JJ": "call", "JTs": "call", "KJs": "call", "KK": "allin", "KQo": ["raise", "fold"], "KQs": "call",
    "KTs": "call", "QJs": "call", "QQ": "allin", "QTs": "call", "T9s": "call", "TT": "call",
  },

  "CO-vs-4bet-UTG": {
    "77": ["call", "fold"], "88": ["call", "fold"], "99": ["call", "fold"], "A4s": ["call", "fold"],
    "A5s": ["call", "fold"], "AA": "call", "AJs": "call", "AKo": "call", "AKs": "call", "AQo": ["call", "fold"],
    "AQs": "call", "ATs": ["call", "fold"], "JJ": "call", "JTs": ["call", "fold"], "KJs": ["call", "fold"],
    "KK": "call", "KQs": ["call", "fold"], "KTs": ["call", "fold"], "QJs": ["call", "fold"], "QQ": "call",
    "QTs": ["call", "fold"], "TT": "call",
  },

  "CO-vs-open-UTG": {
    "66": ["call", "fold"], "77": "raise", "88": "raise", "99": "raise", "A4s": "raise", "A5s": "raise", "AA": "raise",
    "AJs": "raise", "AKo": "raise", "AKs": "raise", "AQo": "raise", "AQs": "raise", "ATs": "raise", "JJ": "raise",
    "JTs": "raise", "KJs": "raise", "KK": "raise", "KQs": "raise", "KTs": "raise", "QJs": "raise", "QQ": "raise",
    "QTs": "raise", "T9s": ["call", "fold"], "TT": "raise",
  },

  "MP-RFI": {
    "22": ["raise", "fold"], "33": "raise", "44": "raise", "55": "raise", "65s": "raise", "66": "raise",
    "76s": "raise", "77": "raise", "87s": "raise", "88": "raise", "98s": "raise", "99": "raise", "A2s": "raise",
    "A3s": "raise", "A4s": "raise", "A5s": "raise", "A6s": "raise", "A7s": "raise", "A8s": "raise", "A9s": "raise",
    "AA": "raise", "AJo": "raise", "AJs": "raise", "AKo": "raise", "AKs": "raise", "AQo": "raise", "AQs": "raise",
    "ATo": "raise", "ATs": "raise", "J9s": "raise", "JJ": "raise", "JTs": "raise", "K8s": "raise", "K9s": "raise",
    "KJo": "raise", "KJs": "raise", "KK": "raise", "KQo": "raise", "KQs": "raise", "KTs": "raise", "Q9s": "raise",
    "QJs": "raise", "QQ": "raise", "QTs": "raise", "T8s": ["raise", "fold"], "T9s": "raise", "TT": "raise",
  },

  "MP-vs-3bet-BB": {
    "65s": "call", "76s": "call", "77": "call", "87s": "call", "88": "call", "99": "call", "A4s": ["raise", "fold"],
    "A5s": ["raise", "fold"], "AA": "allin", "AJs": "call", "AKo": "allin", "AKs": "allin", "AQs": "call",
    "ATs": "call", "JJ": "call", "JTs": "call", "KJs": "call", "KK": "allin", "KQs": "call", "KTs": ["raise", "fold"],
    "QJs": "call", "QQ": "allin", "TT": "call",
  },

  "MP-vs-3bet-BTN": {
    "55": "call", "65s": "call", "66": "call", "76s": "call", "77": "call", "87s": "call", "88": "call", "99": "call",
    "A4s": ["raise", "fold"], "A5s": ["raise", "fold"], "A9s": "call", "AA": "allin", "AJs": "call", "AKo": "allin",
    "AKs": "allin", "AQo": ["raise", "fold"], "AQs": "call", "ATs": "call", "JJ": "call", "JTs": "call", "KJs": "call",
    "KK": "allin", "KQs": "call", "KTs": ["raise", "fold"], "QJs": "call", "QQ": "allin", "QTs": "call", "T9s": "call",
    "TT": "call",
  },

  "MP-vs-3bet-CO": {
    "77": "call", "88": "call", "99": "call", "A4s": ["raise", "fold"], "A5s": ["raise", "fold"], "AA": "allin",
    "AJs": "call", "AKo": "allin", "AKs": "allin", "AQo": ["raise", "fold"], "AQs": "call", "ATs": "call",
    "JJ": "call", "JTs": "call", "KJs": "call", "KK": "allin", "KQs": "call", "KTs": ["raise", "fold"], "QJs": "call",
    "QQ": "allin", "QTs": "call", "TT": "call",
  },

  "MP-vs-3bet-SB": {
    "55": "call", "65s": "call", "66": "call", "76s": "call", "77": "call", "87s": "call", "88": "call", "99": "call",
    "A4s": ["raise", "fold"], "A5s": ["raise", "fold"], "A9s": "call", "AA": "allin", "AJs": "call", "AKo": "call",
    "AKs": "allin", "AQs": "call", "ATs": "call", "JJ": "call", "JTs": "call", "KJs": "call", "KK": "allin",
    "KQs": "call", "KTs": ["raise", "fold"], "QJs": "call", "QQ": "allin", "QTs": ["raise", "fold"], "T9s": "call",
    "TT": "call",
  },

  "MP-vs-4bet-UTG": {
    "77": ["call", "fold"], "88": ["call", "fold"], "99": ["call", "fold"], "A4s": ["call", "fold"],
    "A5s": ["call", "fold"], "AA": "call", "AJs": ["call", "fold"], "AKo": "call", "AKs": "call",
    "AQo": ["call", "fold"], "AQs": "call", "ATs": ["call", "fold"], "JJ": "call", "JTs": ["call", "fold"],
    "KJs": ["call", "fold"], "KK": "call", "KQs": ["call", "fold"], "KTs": ["call", "fold"], "QJs": ["call", "fold"],
    "QQ": "call", "QTs": ["call", "fold"], "TT": ["call", "fold"],
  },

  "MP-vs-open-UTG": {
    "66": ["call", "fold"], "77": "raise", "88": "raise", "99": "raise", "A4s": "raise", "A5s": "raise", "AA": "raise",
    "AJs": "raise", "AKo": "raise", "AKs": "raise", "AQo": "raise", "AQs": "raise", "ATs": "raise", "JJ": "raise",
    "JTs": "raise", "KJs": "raise", "KK": "raise", "KQs": "raise", "KTs": "raise", "QJs": "raise", "QQ": "raise",
    "QTs": "raise", "TT": "raise",
  },

  "SB-RFI": {
    "22": "raise", "33": "raise", "43s": "raise", "44": "raise", "53s": "raise", "54s": "raise", "55": "raise",
    "64s": "raise", "65s": "raise", "66": "raise", "75s": "raise", "76s": "raise", "77": "raise", "86s": "raise",
    "87s": "raise", "88": "raise", "96s": "raise", "97s": "raise", "98o": "raise", "98s": "raise", "99": "raise",
    "A2s": "raise", "A3s": "raise", "A4o": "raise", "A4s": "raise", "A5o": "raise", "A5s": "raise", "A6o": "raise",
    "A6s": "raise", "A7o": "raise", "A7s": "raise", "A8o": "raise", "A8s": "raise", "A9o": "raise", "A9s": "raise",
    "AA": "raise", "AJo": "raise", "AJs": "raise", "AKo": "raise", "AKs": "raise", "AQo": "raise", "AQs": "raise",
    "ATo": "raise", "ATs": "raise", "J5s": "raise", "J6s": "raise", "J7s": "raise", "J8o": "raise", "J8s": "raise",
    "J9o": "raise", "J9s": "raise", "JJ": "raise", "JTo": "raise", "JTs": "raise", "K2s": "raise", "K3s": "raise",
    "K4s": "raise", "K5s": "raise", "K6s": "raise", "K7s": "raise", "K8o": ["raise", "fold"], "K8s": "raise",
    "K9o": "raise", "K9s": "raise", "KJo": "raise", "KJs": "raise", "KK": "raise", "KQo": "raise", "KQs": "raise",
    "KTo": "raise", "KTs": "raise", "Q3s": "raise", "Q4s": "raise", "Q5s": "raise", "Q6s": "raise", "Q7s": "raise",
    "Q8o": "raise", "Q8s": "raise", "Q9o": "raise", "Q9s": "raise", "QJo": "raise", "QJs": "raise", "QQ": "raise",
    "QTo": "raise", "QTs": "raise", "T6s": "raise", "T7s": "raise", "T8o": "raise", "T8s": "raise", "T9o": "raise",
    "T9s": "raise", "TT": "raise",
  },

  "SB-vs-3bet-BB": {
    "22": "call", "33": "call", "44": "call", "54s": "call", "55": "call", "65s": "call", "66": "call", "76s": "call",
    "77": "call", "87s": "call", "88": "call", "97s": "call", "98s": "call", "99": "call", "A2s": ["raise", "fold"],
    "A3s": "call", "A4s": "call", "A5s": "call", "A6s": ["raise", "fold"], "A7s": "call", "A8s": "call", "A9s": "call",
    "AA": "allin", "AJo": ["raise", "fold"], "AJs": "call", "AKo": "allin", "AKs": "allin", "AQo": ["raise", "fold"],
    "AQs": "call", "ATo": "call", "ATs": "call", "J8s": ["raise", "fold"], "J9s": "call", "JJ": "allin", "JTs": "call",
    "K6s": "call", "K7s": "call", "K8s": "call", "K9s": "call", "KJo": "call", "KJs": "call", "KK": "allin",
    "KQo": ["raise", "fold"], "KQs": "call", "KTs": "call", "Q8s": ["raise", "fold"], "Q9s": "call", "QJs": "call",
    "QQ": "allin", "QTs": "call", "T8s": "call", "T9s": "call", "TT": "allin",
  },

  "SB-vs-4bet-BTN": {
    "76s": "call", "77": ["call", "fold"], "87s": "call", "88": "allin", "98s": "call", "99": "allin",
    "A2s": ["call", "fold"], "A3s": ["call", "fold"], "A4s": ["call", "fold"], "A5s": ["call", "fold"],
    "A6s": ["call", "fold"], "A7s": ["call", "fold"], "A8s": ["call", "fold"], "A9s": ["call", "fold"], "AA": "call",
    "AJo": ["call", "fold"], "AJs": "call", "AKo": "allin", "AKs": "allin", "AQo": "call", "AQs": "call",
    "ATo": ["call", "fold"], "ATs": "call", "J9s": ["call", "fold"], "JJ": "allin", "JTs": ["call", "fold"],
    "K9s": ["call", "fold"], "KJs": ["call", "fold"], "KK": "allin", "KQo": ["call", "fold"], "KQs": "call",
    "KTs": ["call", "fold"], "Q9s": ["call", "fold"], "QJs": ["call", "fold"], "QQ": "allin", "QTs": ["call", "fold"],
    "T8s": ["call", "fold"], "T9s": "call", "TT": "call",
  },

  "SB-vs-4bet-CO": {
    "87s": "call", "88": "allin", "98s": "call", "99": "allin", "A4s": ["call", "fold"], "A5s": ["call", "fold"],
    "A9s": ["call", "fold"], "AA": "allin", "AJo": ["call", "fold"], "AJs": "call", "AKo": "allin", "AKs": "allin",
    "AQo": ["call", "fold"], "AQs": "call", "ATs": "call", "JJ": "allin", "JTs": ["call", "fold"],
    "KJs": ["call", "fold"], "KK": "allin", "KQo": ["call", "fold"], "KQs": "call", "KTs": ["call", "fold"],
    "QJs": ["call", "fold"], "QQ": "allin", "QTs": ["call", "fold"], "T8s": ["call", "fold"], "T9s": ["call", "fold"],
    "TT": "call",
  },

  "SB-vs-4bet-MP": {
    "76s": ["call", "fold"], "87s": ["call", "fold"], "88": ["call", "fold"], "99": ["call", "fold"],
    "A4s": ["call", "fold"], "A5s": ["call", "fold"], "AA": "allin", "AJs": ["call", "fold"], "AKo": "call",
    "AKs": "allin", "AQo": ["call", "fold"], "AQs": "call", "ATs": ["call", "fold"], "JJ": "call",
    "JTs": ["call", "fold"], "KJs": ["call", "fold"], "KK": "allin", "KQs": ["call", "fold"], "KTs": ["call", "fold"],
    "QJs": ["call", "fold"], "QQ": "call", "QTs": ["call", "fold"], "TT": "call",
  },

  "SB-vs-4bet-UTG": {
    "99": ["call", "fold"], "A5s": ["call", "fold"], "AA": "allin", "AJs": ["call", "fold"], "AKo": "call",
    "AKs": "allin", "AQo": ["call", "fold"], "AQs": "call", "ATs": ["call", "fold"], "JJ": "call",
    "JTs": ["call", "fold"], "KJs": ["call", "fold"], "KK": "allin", "KQs": ["call", "fold"], "QJs": ["call", "fold"],
    "QQ": "call", "TT": "call",
  },

  "SB-vs-open-BTN": {
    "44": ["call", "fold"], "55": ["call", "fold"], "66": ["call", "fold"], "76s": "raise", "77": "raise",
    "87s": "raise", "88": "raise", "98s": "raise", "99": "raise", "A2s": "raise", "A3s": "raise", "A4s": "raise",
    "A5s": "raise", "A6s": "raise", "A7s": "raise", "A8s": "raise", "A9s": "raise", "AA": "raise", "AJo": "raise",
    "AJs": "raise", "AKo": "raise", "AKs": "raise", "AQo": "raise", "AQs": "raise", "ATo": "raise", "ATs": "raise",
    "J8s": ["call", "fold"], "J9s": "raise", "JJ": "raise", "JTo": ["call", "fold"], "JTs": "raise",
    "K7s": ["call", "fold"], "K8s": ["call", "fold"], "K9s": "raise", "KJo": ["call", "fold"], "KJs": "raise",
    "KK": "raise", "KQo": "raise", "KQs": "raise", "KTs": "raise", "Q7s": ["call", "fold"], "Q8s": ["call", "fold"],
    "Q9s": "raise", "QJo": ["call", "fold"], "QJs": "raise", "QQ": "raise", "QTs": "raise", "T8s": "raise",
    "T9s": "raise", "TT": "raise",
  },

  "SB-vs-open-CO": {
    "66": ["call", "fold"], "76s": ["call", "fold"], "77": ["call", "fold"], "86s": ["call", "fold"], "87s": "raise",
    "88": "raise", "98s": "raise", "99": "raise", "A2s": ["call", "fold"], "A3s": ["call", "fold"], "A4s": "raise",
    "A5s": "raise", "A9s": "raise", "AA": "raise", "AJo": "raise", "AJs": "raise", "AKo": "raise", "AKs": "raise",
    "AQo": "raise", "AQs": "raise", "ATs": "raise", "J9s": ["call", "fold"], "JJ": "raise", "JTs": "raise",
    "K9s": ["call", "fold"], "KJs": "raise", "KK": "raise", "KQo": "raise", "KQs": "raise", "KTs": "raise",
    "Q9s": ["call", "fold"], "QJs": "raise", "QQ": "raise", "QTs": "raise", "T9s": "raise", "TT": "raise",
  },

  "SB-vs-open-MP": {
    "76s": "raise", "87s": "raise", "88": "raise", "98s": ["call", "fold"], "99": "raise", "A2s": ["call", "fold"],
    "A3s": ["call", "fold"], "A4s": "raise", "A5s": "raise", "A9s": ["call", "fold"], "AA": "raise", "AJs": "raise",
    "AKo": "raise", "AKs": "raise", "AQo": "raise", "AQs": "raise", "ATs": "raise", "JJ": "raise", "JTs": "raise",
    "KJs": "raise", "KK": "raise", "KQs": "raise", "KTs": "raise", "QJs": "raise", "QQ": "raise", "QTs": "raise",
    "T9s": ["call", "fold"], "TT": "raise",
  },

  "SB-vs-open-UTG": {
    "87s": ["call", "fold"], "88": ["call", "fold"], "98s": ["call", "fold"], "99": "raise", "A2s": ["call", "fold"],
    "A3s": ["call", "fold"], "A4s": ["call", "fold"], "A5s": "raise", "A9s": ["call", "fold"], "AA": "raise",
    "AJs": "raise", "AKo": "raise", "AKs": "raise", "AQo": "raise", "AQs": "raise", "ATs": "raise", "JJ": "raise",
    "JTs": "raise", "KJs": "raise", "KK": "raise", "KQs": "raise", "QJs": "raise", "QQ": "raise",
    "T9s": ["call", "fold"], "TT": "raise",
  },

  "UTG-RFI": {
    "22": ["raise", "fold"], "33": ["raise", "fold"], "44": ["raise", "fold"], "55": "raise", "66": "raise",
    "77": "raise", "87s": ["raise", "fold"], "88": "raise", "98s": "raise", "99": "raise", "A2s": "raise",
    "A3s": "raise", "A4s": "raise", "A5s": "raise", "A6s": "raise", "A7s": "raise", "A8s": "raise", "A9s": "raise",
    "AA": "raise", "AJo": "raise", "AJs": "raise", "AKo": "raise", "AKs": "raise", "AQo": "raise", "AQs": "raise",
    "ATo": ["raise", "fold"], "ATs": "raise", "JJ": "raise", "JTs": "raise", "KJs": "raise", "KK": "raise",
    "KQo": "raise", "KQs": "raise", "KTs": "raise", "QJs": "raise", "QQ": "raise", "QTs": "raise", "T9s": "raise",
    "TT": "raise",
  },

  "UTG-vs-3bet-BB": {
    "87s": "call", "88": "call", "99": "call", "A4s": ["raise", "fold"], "A5s": ["raise", "fold"], "AA": "allin",
    "AJs": "call", "AKo": "allin", "AKs": "allin", "AQs": "call", "ATs": "call", "JJ": "call", "JTs": "call",
    "KJs": "call", "KK": "allin", "KQs": "call", "KTs": ["raise", "fold"], "QJs": "call", "QQ": "allin", "T9s": "call",
    "TT": "call",
  },

  "UTG-vs-3bet-BTN": {
    "55": "call", "66": "call", "77": "call", "87s": "call", "88": "call", "99": "call", "A4s": ["raise", "fold"],
    "A5s": ["raise", "fold"], "AA": "allin", "AJs": "call", "AKo": "allin", "AKs": "allin", "AQo": ["raise", "fold"],
    "AQs": "call", "ATs": "call", "JJ": "call", "JTs": "call", "KJs": "call", "KK": "allin", "KQs": "call",
    "KTs": "call", "QJs": "call", "QQ": "allin", "QTs": "call", "T9s": "call", "TT": "call",
  },

  "UTG-vs-3bet-CO": {
    "88": "call", "99": "call", "A5s": ["raise", "fold"], "AA": "allin", "AJs": "call", "AKo": "allin", "AKs": "allin",
    "AQo": ["raise", "fold"], "AQs": "call", "ATs": "call", "JJ": "call", "KJs": "call", "KK": "allin", "KQs": "call",
    "KTs": "call", "QJs": "call", "QQ": "allin", "TT": "call",
  },

  "UTG-vs-3bet-MP": {
    "99": "call", "A5s": ["raise", "fold"], "AA": "allin", "AJs": "call", "AKo": "allin", "AKs": "allin",
    "AQo": ["raise", "fold"], "AQs": "call", "ATs": "call", "JJ": "call", "KJs": "call", "KK": "allin", "KQs": "call",
    "KTs": "call", "QQ": "allin", "TT": "call",
  },

  "UTG-vs-3bet-SB": {
    "66": "call", "77": "call", "87s": "call", "88": "call", "99": "call", "A4s": ["raise", "fold"],
    "A5s": ["raise", "fold"], "AA": "allin", "AJs": "call", "AKo": "call", "AKs": "allin", "AQs": "call",
    "ATs": "call", "JJ": "call", "JTs": "call", "KJs": "call", "KK": "allin", "KQs": "call", "KTs": ["raise", "fold"],
    "QJs": "call", "QQ": "allin", "T9s": "call", "TT": "call",
  },
}
;

/* Normalize chart cell to { actions: { raise: 50, fold: 50 } } */
function normalizeCell(cell) {
  if (!cell) return null;
  if (typeof cell === "string") return { raise: cell === "raise" ? 100 : 0, call: cell === "call" ? 100 : 0, fold: cell === "fold" ? 100 : 0, [cell]: 100 };
  if (Array.isArray(cell)) {
    var n = cell.length || 1, pct = 100 / n, actions = {};
    cell.forEach(function(a) { actions[a] = (actions[a] || 0) + pct; });
    return actions;
  }
  return null;
}

/* Chart key from spot + position */
function chartKey(spot, pos) {
  if (spot === "rfi") return pos + "-RFI";
  var parts = pos.split(" vs ");
  if (parts.length !== 2) return null;
  if (spot === "vs_open") return parts[0] + "-vs-open-" + parts[1];
  if (spot === "vs_3bet") return parts[0] + "-vs-3bet-" + parts[1];
  if (spot === "vs_4bet") return parts[0] + "-vs-4bet-" + parts[1];
  return null;
}

/* Build RFI string set for backward compat (trainer, getHandInfo, etc.) */
var RFI = {};
["UTG","MP","CO","BTN","SB"].forEach(function(p) {
  var chart = charts[p + "-RFI"];
  if (!chart) return;
  var hands = [];
  Object.keys(chart).forEach(function(h) {
    var cell = chart[h];
    var isRaise = cell === "raise" || (Array.isArray(cell) && cell.indexOf("raise") >= 0);
    if (isRaise) hands.push(h);
  });
  RFI[p] = hands.join(",");
});

var STUDY_SPOTS = [
  { id: "rfi", name: "RFI", desc: "Raise First In", positions: ["UTG","MP","CO","BTN","SB"] },
  { id: "vs_open", name: "vs Open", desc: "Facing an Open Raise", positions: [
    "MP vs UTG","CO vs UTG","BTN vs UTG","BTN vs CO",
    "SB vs UTG","SB vs MP","SB vs CO","SB vs BTN",
    "BB vs UTG","BB vs MP","BB vs CO","BB vs BTN","BB vs SB",
  ] },
  { id: "vs_3bet", name: "vs 3-Bet", desc: "Opener Facing a 3-Bet", positions: [
    "UTG vs MP","UTG vs CO","UTG vs BTN","UTG vs SB","UTG vs BB",
    "MP vs CO","MP vs BTN","MP vs SB","MP vs BB",
    "CO vs BTN","CO vs SB","CO vs BB",
    "BTN vs SB","BTN vs BB",
    "SB vs BB",
  ] },
  { id: "vs_4bet", name: "vs 4-Bet", desc: "3-Bettor Facing a 4-Bet", positions: [
    "MP vs UTG","CO vs UTG","BTN vs UTG","BTN vs CO",
    "SB vs UTG","SB vs MP","SB vs CO","SB vs BTN",
    "BB vs UTG","BB vs MP","BB vs CO","BB vs BTN","BB vs SB",
  ] },
];

/* Returns actions for a hand given spot + position */
function getStudyActions(hand, spot, pos) {
  var key = chartKey(spot, pos);
  var chart = key ? charts[key] : null;
  if (!chart) return [{ name: "Fold", pct: 100, color: "#d45555" }];

  var cell = chart[hand];
  if (!cell) return [{ name: "Fold", pct: 100, color: "#d45555" }];

  var nameFor = function(a) {
    if (a === "raise") {
      if (spot === "rfi") return "Raise";
      if (spot === "vs_open") return "3-Bet";
      if (spot === "vs_3bet") return "4-Bet";
      if (spot === "vs_4bet") return "5-Bet";
      return "Raise";
    }
    if (a === "call") return "Call";
    if (a === "allin") return "All-in";
    return "Fold";
  };

  if (typeof cell === "string") {
    var actions = [{ name: nameFor(cell), pct: 100, color: ACTION_COLORS[cell] || "#d45555" }];
    return actions;
  }

  if (Array.isArray(cell)) {
    var n = cell.length, counts = {};
    cell.forEach(function(a) { counts[a] = (counts[a] || 0) + 1; });
    var result = [];
    Object.keys(counts).forEach(function(a) {
      var pct = Math.round(counts[a] / n * 100);
      result.push({ name: nameFor(a), pct: pct, color: ACTION_COLORS[a] || "#d45555" });
    });
    result.sort(function(a, b) { return b.pct - a.pct; });
    return result;
  }

  return [{ name: "Fold", pct: 100, color: "#d45555" }];
}

function mkGrid(rs) {
  var h = new Set(rs.split(","));
  var g = [];
  for (var i = 0; i < 13; i++) {
    var row = [];
    for (var j = 0; j < 13; j++) {
      var hand, tp;
      if (i === j) { hand = RANKS[i] + RANKS[j]; tp = "p"; }
      else if (i < j) { hand = RANKS[i] + RANKS[j] + "s"; tp = "s"; }
      else { hand = RANKS[j] + RANKS[i] + "o"; tp = "o"; }
      row.push({ hand: hand, tp: tp, on: h.has(hand) });
    }
    g.push(row);
  }
  return g;
}

var SYS_PROMPT = "You are an expert Texas Hold'em poker analyst. You can read screenshots from ANY poker client including: ClubWPT Gold (web-based, sweepstakes, Chips currency — treat Chips as dollar amounts), PokerStars, GGPoker, WPN/ACR, 888, PartyPoker, ClubGG, Ignition, BetOnline, and any other poker site or app. For ClubWPT Gold specifically: chips are displayed as 'SC' (Sweeps Coins) or plain numbers, the hero seat is highlighted, cards are shown face-up for hero, and the table layout may be portrait-oriented. Read all visible information: hero cards, board cards, pot size, bet sizes, player positions, stack sizes, and action history. Respond ONLY in valid JSON (no markdown, no backticks). Structure: {\"hero_position\":\"BTN\",\"villain_position\":\"BB\",\"hero_cards\":\"Ah Kd\",\"villain_cards\":\"unknown\",\"community_cards\":\"8s 5s 2h Ts 8h\",\"final_pot\":\"860\",\"blinds\":\"5/10\",\"result\":\"Hero wins\",\"streets\":[{\"street\":\"Preflop\",\"board\":\"\",\"pot_at_start\":\"15\",\"action_summary\":\"Hero raises to 25, BB calls\",\"hero_actual_action\":\"Raise to 25\",\"gto_actions\":[{\"action\":\"Raise\",\"freq\":85,\"ev\":2.1,\"color\":\"#d4a72c\"},{\"action\":\"Call\",\"freq\":12,\"ev\":0.8,\"color\":\"#5b8def\"},{\"action\":\"Fold\",\"freq\":3,\"ev\":0,\"color\":\"#4a4a4a\"}],\"hero_chose\":\"Raise\",\"best_action\":\"Raise\",\"best_sizing\":\"2.5x\",\"reasoning\":\"Standard open\",\"verdict\":\"Best\",\"ev_loss\":0}],\"overall\":{\"grade\":\"A\",\"ev_lost\":0.5,\"summary\":\"Well played\",\"mistake\":\"None\",\"strength\":\"Good sizing\",\"takeaway\":\"Keep exploiting position\"}} Rules: gto_actions freq sum to 100. color: #d4a72c raise/bet, #4caf7d check, #5b8def call, #4a4a4a fold. verdict: Best/Good/Inaccurate/Mistake/Blunder.";

async function askAI(content) {
  var body = {
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYS_PROMPT,
    messages: [{ role: "user", content: content }],
  };

  var proxy = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  var pj = await proxy.json();
  if (proxy.status === 503) throw new Error("AI is temporarily unavailable. Please try again in a moment.");
  if (pj.error) throw new Error(pj.error.message);
  var pt = pj.content.filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text; }).join("");
  return JSON.parse(pt.replace(/```json|```/g, "").trim());
}

/* ICONS */
var Ic = {
  study: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill={C.gold}/><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" fill={C.gold} opacity="0.45"/></svg>,
  train: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="10" rx="2.5" fill={C.gold}/><circle cx="9" cy="13" r="1.5" fill={C.bg1}/><circle cx="15" cy="13" r="1.5" fill={C.bg1}/></svg>,
  upload: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 16V4m0 0l-4.5 4.5M12 4l4.5 4.5" stroke={C.amber} strokeWidth="2.2" strokeLinecap="round"/><path d="M4 14v5a2 2 0 002 2h12a2 2 0 002-2v-5" stroke={C.amber} strokeWidth="2.2" strokeLinecap="round"/></svg>,
  solve: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke={C.gold} strokeWidth="2"/><path d="M12 8v4l3 3" stroke={C.gold} strokeWidth="2" strokeLinecap="round"/></svg>,
  range: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="2" fill={C.blue}/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" fill={C.green} opacity="0.65"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" fill={C.red} opacity="0.65"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill={C.gold} opacity="0.35"/></svg>,
  hands: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2.5" stroke={C.amber} strokeWidth="1.8"/><path d="M8 7h8M8 11h6M8 15h7" stroke={C.amber} strokeWidth="1.8" strokeLinecap="round" opacity="0.55"/></svg>,
  report: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="13" width="5" height="8" rx="1.5" fill={C.gold} opacity="0.45"/><rect x="10" y="8" width="5" height="13" rx="1.5" fill={C.gold} opacity="0.65"/><rect x="17" y="3" width="5" height="18" rx="1.5" fill={C.gold}/></svg>,
  drill: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke={C.blue} strokeWidth="1.8"/><circle cx="12" cy="12" r="6" stroke={C.blue} strokeWidth="1.8" opacity="0.5"/><circle cx="12" cy="12" r="2.5" fill={C.blue}/></svg>,
  help: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke={C.amber} strokeWidth="1.8"/><path d="M9 9a3.5 3.5 0 015.74 1.75c0 2.25-3.25 2.75-3.25 4.75" stroke={C.amber} strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="19" r="1" fill={C.amber}/></svg>,
  bankroll: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  equity: <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M4 20h16" stroke={C.green} strokeWidth="2" strokeLinecap="round"/><path d="M4 20V10l4-3 4 5 4-8 4 6v10" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

/* CARD */
function Crd(props) {
  var sz = props.sz || 40;
  return (
    <div style={{
      width: sz, height: sz * 1.42, borderRadius: 6,
      background: "linear-gradient(170deg,#fdfcf5,#eee9de)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      flexShrink: 0, boxShadow: "0 3px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: sz * 0.06, left: sz * 0.1, lineHeight: 1 }}>
        <div style={{ fontSize: sz * 0.3, fontWeight: 800, color: props.clr, fontFamily: "var(--m)" }}>{props.r}</div>
        <div style={{ fontSize: sz * 0.24, color: props.clr, marginTop: -1 }}>{props.sym}</div>
      </div>
      <span style={{ fontSize: sz * 0.44, color: props.clr, marginTop: sz * 0.1 }}>{props.sym}</span>
    </div>
  );
}

function FaceDown(props) {
  var sz = props.sz || 40;
  return (
    <div style={{
      width: sz, height: sz * 1.42, borderRadius: 6,
      background: "linear-gradient(145deg,#181d30,#111525)",
      boxShadow: "0 3px 12px rgba(0,0,0,0.4)", border: "1px solid #252a42",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <div style={{ width: sz * 0.4, height: sz * 0.4, borderRadius: sz * 0.12, border: "1.5px solid rgba(212,167,44,0.15)" }} />
    </div>
  );
}

function Glass(props) {
  var hov = props.hover;
  var onClick = props.onClick;
  var _s = props.style || {};
  var _h = useState(false);
  var isH = _h[0];
  var setH = _h[1];
  return (
    <div
      onClick={onClick}
      onMouseEnter={function() { if (hov) setH(true); }}
      onMouseLeave={function() { setH(false); }}
      style={Object.assign({}, {
        background: isH ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.022)",
        border: "1px solid " + (isH ? C.borderH : C.border),
        borderRadius: 14, padding: 20, transition: "all 0.2s",
        cursor: onClick ? "pointer" : "default",
      }, _s)}
    >
      {props.children}
    </div>
  );
}

function GoldBtn(props) {
  var dis = props.disabled;
  var _s = props.style || {};
  return (
    <button
      onClick={props.onClick}
      disabled={dis}
      style={Object.assign({}, {
        fontFamily: "var(--f)", fontSize: 15, fontWeight: 700, color: "#000",
        background: "linear-gradient(135deg," + C.gold + "," + C.goldL + ")",
        border: "none", borderRadius: 10, padding: "12px 28px",
        cursor: dis ? "default" : "pointer",
        opacity: dis ? 0.5 : 1,
        boxShadow: "0 4px 20px " + C.gold + "30",
        transition: "all 0.15s",
      }, _s)}
    >
      {props.children}
    </button>
  );
}

function VoiceMic(props) {
  var onResult = props.onResult;
  var _listening = useState(false);
  var listening = _listening[0]; var setListening = _listening[1];
  var _supported = useState(true);
  var supported = _supported[0]; var setSupported = _supported[1];
  var _pulse = useState(false);
  var pulse = _pulse[0]; var setPulse = _pulse[1];
  var recRef = useRef(null);

  useEffect(function() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    var rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    var finalT = "";
    var interimT = "";
    rec.onresult = function(e) {
      finalT = "";
      interimT = "";
      for (var i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalT += e.results[i][0].transcript;
        } else {
          interimT += e.results[i][0].transcript;
        }
      }
      if (onResult) onResult(finalT, interimT, false);
      setPulse(true);
      setTimeout(function() { setPulse(false); }, 150);
    };
    rec.onend = function() {
      setListening(false);
      if (onResult && finalT) onResult(finalT, "", true);
    };
    rec.onerror = function() { setListening(false); };
    recRef.current = rec;
    return function() {
      try { rec.stop(); } catch(e) {}
    };
  }, []);

  var toggle = function() {
    if (!recRef.current) return;
    if (listening) {
      recRef.current.stop();
      setListening(false);
    } else {
      try {
        recRef.current.start();
        setListening(true);
      } catch(e) {
        setListening(false);
      }
    }
  };

  if (!supported) return null;

  return (
    <button onClick={toggle} title={listening ? "Stop recording" : "Voice input"} style={{
      width: 40, height: 40, borderRadius: 10,
      background: listening ? "rgba(212,85,85,0.15)" : "rgba(255,255,255,0.03)",
      border: "1px solid " + (listening ? "rgba(212,85,85,0.3)" : "rgba(255,255,255,0.06)"),
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.2s", flexShrink: 0, position: "relative",
      boxShadow: listening ? "0 0 20px rgba(212,85,85,0.15)" : "none",
      animation: pulse ? "micPulse 0.15s ease" : "none",
    }}>
      {listening && (
        <div style={{
          position: "absolute", inset: -4, borderRadius: 14,
          border: "2px solid rgba(212,85,85,0.3)",
          animation: "micRing 1.5s ease-out infinite",
        }} />
      )}
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <rect x="9" y="2" width="6" height="12" rx="3" fill={listening ? "#d45555" : C.txm} />
        <path d="M5 11a7 7 0 0014 0" stroke={listening ? "#d45555" : C.txm} strokeWidth="2" strokeLinecap="round" />
        <path d="M12 18v3m-3 0h6" stroke={listening ? "#d45555" : C.txm} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function FreqBar(props) {
  var actions = props.actions;
  var chose = props.chose;
  if (!actions || !actions.length) return null;
  var tot = actions.reduce(function(s, a) { return s + (a.freq || 0); }, 0) || 100;
  return (
    <div>
      <div style={{ display: "flex", height: 30, borderRadius: 8, overflow: "hidden", background: C.bg1 }}>
        {actions.map(function(a, i) {
          var w = (a.freq / tot) * 100;
          if (w < 0.5) return null;
          var isc = chose && a.action.toLowerCase() === chose.toLowerCase();
          return (
            <div key={i} style={{
              width: w + "%", background: a.color || C.txm,
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: isc ? 1 : 0.5, position: "relative", transition: "opacity 0.2s",
            }}>
              {w > 12 && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)", fontFamily: "var(--m)" }}>{Math.round(a.freq)}%</span>}
              {isc && <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 800, color: "#fff", background: a.color, borderRadius: 4, padding: "1px 6px", fontFamily: "var(--m)" }}>YOU</div>}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
        {actions.map(function(a, i) {
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 3, background: a.color || C.txm }} />
              <span style={{ fontSize: 12, fontFamily: "var(--m)", color: C.tx }}>{a.action} {a.freq}%</span>
              {a.ev != null && <span style={{ fontSize: 11, fontFamily: "var(--m)", color: a.ev > 0 ? C.green : C.txm }}>({a.ev > 0 ? "+" : ""}{a.ev}bb)</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Loader(props) {
  var steps = props.steps || ["Analyzing..."];
  var _s = useState(0);
  var s = _s[0];
  var setS = _s[1];
  useEffect(function() {
    var t = setInterval(function() { setS(function(n) { return Math.min(n + 1, steps.length - 1); }); }, 1400);
    return function() { clearInterval(t); };
  }, []);
  return (
    <div style={{ padding: "20px 0" }}>
      {steps.map(function(st, i) {
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0", opacity: i <= s ? 1 : 0.12, transition: "opacity 0.6s" }}>
            {i < s ? (
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
              </div>
            ) : i === s ? (
              <div className="sp" style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid " + C.border, borderTopColor: C.gold, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: "1.5px solid " + C.border, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 15, color: i <= s ? C.tx : C.txm, fontWeight: i === s ? 600 : 400 }}>{st}</span>
          </div>
        );
      })}
    </div>
  );
}

function Matrix(props) {
  var pos = props.pos;
  var interactive = props.interactive;
  var selected = props.selected || new Set();
  var onToggle = props.onToggle;
  var grid = useMemo(function() { return mkGrid(RFI[pos] || ""); }, [pos]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(13,1fr)", gap: 2.5 }}>
      {grid.flat().map(function(cell, i) {
        var on = interactive ? selected.has(cell.hand) : cell.on;
        return (
          <div key={i} onClick={function() { if (onToggle) onToggle(cell.hand); }} style={{
            aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4,
            fontSize: 8.5, fontWeight: 700, fontFamily: "var(--m)", cursor: interactive ? "pointer" : "default",
            color: on ? "#fff" : "rgba(255,255,255,0.2)",
            background: on ? "#4caf7d" : "rgba(215,85,85,0.18)",
            boxShadow: on ? "0 0 10px rgba(76,175,125,0.2), inset 0 1px 0 rgba(255,255,255,0.18)" : "none",
            border: "1px solid " + (on ? "rgba(76,175,125,0.35)" : "rgba(215,85,85,0.08)"),
            transition: "all 0.12s",
          }}>{cell.hand}</div>
        );
      })}
    </div>
  );
}

function PosBar(props) {
  var pos = props.pos;
  var setPos = props.setPos;
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Object.keys(RFI).map(function(p) {
        return (
          <button key={p} onClick={function() { setPos(p); }} style={{
            fontFamily: "var(--m)", fontSize: 12, fontWeight: 700,
            color: pos === p ? "#000" : C.txm,
            background: pos === p ? "linear-gradient(135deg," + C.gold + "," + C.goldL + ")" : "transparent",
            border: "1px solid " + (pos === p ? C.gold : C.border),
            borderRadius: 6, padding: "7px 14px", cursor: "pointer", transition: "all 0.15s",
            boxShadow: pos === p ? "0 2px 12px " + C.gold + "30" : "none",
          }}>{p}</button>
        );
      })}
    </div>
  );
}

/* --- PAGES --- */

function StudyPage() {
  var _spot = useState("rfi");
  var spot = _spot[0]; var setSpot = _spot[1];
  var _pos = useState("BTN");
  var pos = _pos[0]; var setPos = _pos[1];
  var _hover = useState(null);
  var hover = _hover[0]; var setHover = _hover[1];
  var _sel = useState(null);
  var sel = _sel[0]; var setSel = _sel[1];

  var activeSpot = STUDY_SPOTS.find(function(s) { return s.id === spot; }) || STUDY_SPOTS[0];
  var positions = activeSpot.positions;

  /* Ensure pos is valid for current spot */
  useEffect(function() {
    if (positions.indexOf(pos) === -1) setPos(positions[0] || "BTN");
  }, [spot]);

  /* Build full grid with action data */
  var gridData = useMemo(function() {
    var g = [];
    for (var i = 0; i < 13; i++) {
      var row = [];
      for (var j = 0; j < 13; j++) {
        var hand;
        if (i === j) hand = RANKS[i] + RANKS[j];
        else if (i < j) hand = RANKS[i] + RANKS[j] + "s";
        else hand = RANKS[j] + RANKS[i] + "o";
        var actions = getStudyActions(hand, spot, pos);
        row.push({ hand: hand, actions: actions });
      }
      g.push(row);
    }
    return g;
  }, [spot, pos]);

  /* Counts */
  var counts = useMemo(function() {
    var raise = 0, threebet = 0, call = 0, fold = 0, total = 0;
    gridData.flat().forEach(function(c) {
      var primary = c.actions[0].name;
      if (primary === "Raise") raise++;
      else if (primary === "3-Bet") threebet++;
      else if (primary === "Call") call++;
      else fold++;
      if (primary !== "Fold") total++;
    });
    return { raise: raise, threebet: threebet, call: call, fold: fold, total: total, pct: (total / 169 * 100).toFixed(1) };
  }, [gridData]);

  /* Detail */
  var detailHand = sel || hover;
  var detailActions = detailHand ? getStudyActions(detailHand, spot, pos) : null;

  /* Cell background: mixed cells render in orange (Pekarstas convention) */
  var MIXED_COLOR = "#e07b3b";
  function actionColor(name) {
    if (name === "Raise" || name === "3-Bet" || name === "4-Bet" || name === "5-Bet") return "#4caf7d";
    if (name === "Call") return "#e5c454";
    if (name === "All-in") return "#9b6dd1";
    return "rgba(215,85,85,0.18)";
  }
  function cellBg(actions) {
    if (actions.length > 1) return MIXED_COLOR;
    return actionColor(actions[0].name);
  }
  function cellBdr(actions) {
    if (actions.length > 1) return "rgba(224,123,59,0.3)";
    var p = actions[0].name;
    if (p === "Raise" || p === "3-Bet" || p === "4-Bet" || p === "5-Bet") return "rgba(76,175,125,0.3)";
    if (p === "Call") return "rgba(229,196,84,0.3)";
    if (p === "All-in") return "rgba(155,109,209,0.3)";
    return "rgba(215,85,85,0.08)";
  }
  function isFold(actions) { return actions[0].name === "Fold"; }

  /* Stats for current spot */
  var stats = [];
  if (spot === "rfi") {
    stats = [
      { label: "RAISE", value: counts.raise, color: "#4caf7d" },
      { label: "FOLD", value: counts.fold, color: "#d45555" },
      { label: "COMBOS", value: counts.total + "/169", color: C.gold },
      { label: "FREQUENCY", value: counts.pct + "%", color: C.gold },
    ];
  } else {
    var raiseLabel = spot === "vs_open" ? "3-BET" : spot === "vs_3bet" ? "4-BET" : spot === "vs_4bet" ? "5-BET" : "RAISE";
    stats = [
      { label: raiseLabel, value: counts.threebet, color: "#4caf7d" },
      { label: "CALL", value: counts.call, color: "#e5c454" },
      { label: "FOLD", value: counts.fold, color: "#d45555" },
      { label: "DEFEND", value: counts.pct + "%", color: C.gold },
    ];
  }

  /* Legend items */
  var legendItems;
  if (spot === "rfi") {
    legendItems = [["Raise", "#4caf7d"], ["Mixed", "#e07b3b"], ["Fold", "rgba(215,85,85,0.5)"]];
  } else if (spot === "vs_open") {
    legendItems = [["3-Bet", "#4caf7d"], ["Call", "#e5c454"], ["All-in", "#9b6dd1"], ["Mixed", "#e07b3b"], ["Fold", "rgba(215,85,85,0.5)"]];
  } else if (spot === "vs_3bet") {
    legendItems = [["4-Bet", "#4caf7d"], ["Call", "#e5c454"], ["All-in", "#9b6dd1"], ["Mixed", "#e07b3b"], ["Fold", "rgba(215,85,85,0.5)"]];
  } else {
    legendItems = [["5-Bet", "#4caf7d"], ["Call", "#e5c454"], ["All-in", "#9b6dd1"], ["Mixed", "#e07b3b"], ["Fold", "rgba(215,85,85,0.5)"]];
  }

  /* Position tip */
  function getTip() {
    if (spot === "rfi") {
      if (pos === "UTG") return "Tightest seat. All pairs, suited broadways, suited connectors, and strong offsuit broadways.";
      if (pos === "MP") return "Slightly wider than UTG. Add suited aces, more kings, and connectors like 97s, 86s.";
      if (pos === "CO") return "Open wider. Suited connectors, small pairs, suited aces.";
      if (pos === "BTN") return "Widest open. Use position aggressively, you act last postflop.";
      if (pos === "SB") return "Raise or fold. Limping from SB is a leak at every stake.";
    }
    if (spot === "vs_open") {
      if (pos === "BB vs UTG") return "Very tight defense. Only premium 3-bets, wide call range with suited hands that play well postflop.";
      if (pos === "BB vs MP") return "Slightly wider 3-bet range. Add JJ and AQs. Call range expands to include more suited connectors.";
      if (pos === "BB vs CO") return "Start 3-betting more suited aces and broadways. Call range includes suited one-gappers.";
      if (pos === "BB vs BTN") return "Wide defense. 3-bet premium hands and suited aces. Call almost any suited hand and many offsuit broadways.";
      if (pos === "BB vs SB") return "Widest defense. 3-bet aggressively with pairs, suited aces, broadways. Call very wide — you close the action.";
    }
    return "";
  }

  /* Hand detail tip */
  function getHandTip(hand) {
    var actions = getStudyActions(hand, spot, pos);
    var primary = actions[0].name;
    var type = hand.length === 2 ? "Pair" : hand.endsWith("s") ? "Suited" : "Offsuit";
    if (spot === "rfi") {
      if (primary === "Fold") {
        var opens = [];
        Object.keys(RFI).forEach(function(p) { if (new Set(RFI[p].split(",")).has(hand)) opens.push(p); });
        if (opens.length > 0) return type + ". Below " + pos + " threshold but opens from " + opens.join(", ") + ".";
        return type + ". Clear fold from all positions.";
      }
      return type + ". Standard " + pos + " open. Raise 2.5x.";
    }
    if (spot === "vs_open") {
      if (primary === "Fold") return type + ". Not profitable to defend here.";
      if (primary === "3-Bet") return type + ". Value 3-bet against this open.";
      if (primary === "Call") return type + ". Call and see a flop with position discount.";
    }
    return "";
  }

  /* Opens-from data for RFI detail */
  function opensFrom(hand) {
    return Object.keys(RFI).filter(function(p) { return new Set(RFI[p].split(",")).has(hand); });
  }

  return (
    <div>
      {/* Spot tabs + Position bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: C.gold, letterSpacing: "-0.03em" }}>{pos}</span>
          <span style={{ fontSize: 16, color: C.txm, fontWeight: 300 }}>{activeSpot.desc || activeSpot.name}</span>
        </div>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, padding: 3 }}>
          {STUDY_SPOTS.map(function(s) {
            return (
              <button key={s.id} onClick={function() { if (s.locked) return; setSpot(s.id); setSel(null); }} style={{
                fontFamily: "var(--m)", fontSize: 10, fontWeight: 600, letterSpacing: "0.03em",
                color: spot === s.id ? C.gold : s.locked ? "rgba(255,255,255,0.15)" : C.txm,
                background: spot === s.id ? "rgba(212,167,44,0.1)" : "transparent",
                border: "none", borderRadius: 6, padding: "6px 14px", cursor: s.locked ? "default" : "pointer",
                transition: "all 0.2s", opacity: s.locked ? 0.5 : 1,
              }}>{s.name}{s.locked ? " 🔒" : ""}</button>
            );
          })}
        </div>
      </div>

      {/* Position bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {positions.map(function(p) {
          return (
            <button key={p} onClick={function() { setPos(p); setSel(null); }} style={{
              fontFamily: "var(--m)", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
              color: pos === p ? "#000" : C.txm,
              background: pos === p ? "linear-gradient(135deg, " + C.gold + ", " + C.goldL + ")" : "rgba(255,255,255,0.02)",
              border: pos === p ? "none" : "1px solid rgba(255,255,255,0.04)",
              borderRadius: 8, padding: "8px 14px", cursor: "pointer",
              boxShadow: pos === p ? "0 2px 10px rgba(212,167,44,0.2)" : "none",
              transition: "all 0.2s",
            }}>{p}</button>
          );
        })}
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(" + stats.length + ", 1fr)", gap: 6, marginBottom: 14 }}>
        {stats.map(function(s) {
          return (
            <div key={s.label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "var(--m)" }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Grid + Detail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 12, marginBottom: 14 }}>
        <Glass style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "18px repeat(13,1fr)", gap: 2 }}>
            <div />
            {RANKS.map(function(r) {
              return <div key={r} style={{ textAlign: "center", fontSize: 9, fontWeight: 600, color: C.txm, fontFamily: "var(--m)", paddingBottom: 2 }}>{r}</div>;
            })}
            {gridData.map(function(row, ri) {
              return [
                <div key={"rh" + ri} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: C.txm, fontFamily: "var(--m)" }}>{RANKS[ri]}</div>
              ].concat(row.map(function(cell, ci) {
                var fold = isFold(cell.actions);
                var isHov = hover === cell.hand;
                var isSel = sel === cell.hand;
                var bg = cellBg(cell.actions);
                var bdr = cellBdr(cell.actions);
                return (
                  <div key={ri + "-" + ci}
                    onMouseEnter={function() { setHover(cell.hand); }}
                    onMouseLeave={function() { setHover(null); }}
                    onClick={function() { setSel(sel === cell.hand ? null : cell.hand); }}
                    style={{
                      aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 3,
                      fontSize: 8, fontWeight: 700, fontFamily: "var(--m)", cursor: "pointer",
                      color: fold ? "rgba(255,255,255,0.2)" : "#fff",
                      background: isSel ? C.gold : bg,
                      boxShadow: isSel ? "0 0 12px " + C.gold + "50" : isHov && !fold ? "0 0 12px " + bg + "60" : !fold ? "inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
                      border: isSel ? "1.5px solid " + C.goldL : isHov ? "1.5px solid rgba(255,255,255,0.2)" : "1px solid " + bdr,
                      transition: "all 0.1s",
                      transform: isHov ? "scale(1.15)" : "none",
                      zIndex: isHov ? 2 : 1,
                      position: "relative",
                    }}>{cell.hand}</div>
                );
              }));
            })}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
            {legendItems.map(function(item) {
              return (
                <div key={item[0]} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: item[1] }} />
                  <span style={{ fontSize: 11, color: C.txm, fontFamily: "var(--m)" }}>{item[0]}</span>
                </div>
              );
            })}
          </div>
        </Glass>

        {/* Detail panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Glass style={{ padding: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 8 }}>HAND INFO</div>
            {detailHand && detailActions ? (
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.txb, fontFamily: "var(--m)", marginBottom: 6 }}>{detailHand}</div>
                <div style={{ fontSize: 10, color: C.txm, marginBottom: 10 }}>
                  {detailHand.length === 2 ? "Pair" : detailHand.endsWith("s") ? "Suited" : "Offsuit"} · {detailHand.length === 2 ? 6 : detailHand.endsWith("s") ? 4 : 12} combos
                </div>
                {/* Action frequency bars */}
                {detailActions.map(function(a) {
                  return (
                    <div key={a.name} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: "var(--m)", fontSize: 10, color: C.txm }}>{a.name}</span>
                        <span style={{ fontFamily: "var(--m)", fontSize: 10, fontWeight: 700, color: a.color }}>{a.pct}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                        <div style={{ height: "100%", width: a.pct + "%", borderRadius: 3, background: a.color, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
                {/* Tip */}
                <div style={{ fontSize: 11, color: C.tx, lineHeight: 1.5, marginTop: 10, padding: 10, background: "rgba(212,167,44,0.03)", border: "1px solid rgba(212,167,44,0.08)", borderRadius: 8 }}>
                  {getHandTip(detailHand)}
                </div>
                {/* Opens from (RFI only) */}
                {spot === "rfi" && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 6 }}>OPENS FROM</div>
                    {Object.keys(RFI).map(function(p) {
                      var inR = new Set(RFI[p].split(",")).has(detailHand);
                      return (
                        <div key={p} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontFamily: "var(--m)", fontSize: 10, fontWeight: 700, color: C.txm, width: 28 }}>{p}</span>
                          <span style={{ fontFamily: "var(--m)", fontSize: 10, fontWeight: 700, color: inR ? C.green : "rgba(215,85,85,0.4)" }}>{inR ? "✓" : "✕"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: C.txm, opacity: 0.4, lineHeight: 1.5 }}>Hover or click any cell to see action frequencies</div>
            )}
          </Glass>

          {/* Tip */}
          <Glass style={{ padding: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 6 }}>TIP</div>
            <p style={{ fontSize: 11, color: C.tx, lineHeight: 1.55 }}>{getTip()}</p>
          </Glass>
        </div>
      </div>

      {/* Bottom row: Equity Tiers + Position Comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Equity Tiers */}
        <Glass style={{ padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.txb, marginBottom: 14 }}>Equity Tiers</div>
          {(function() {
            var t = { "Premium Pairs": 0, "Medium Pairs": 0, "Small Pairs": 0, "Suited Broadways": 0, "Suited Connectors": 0, "Suited Aces": 0, "Offsuit Broadways": 0, "Other": 0 };
            var tierColors = { "Premium Pairs": C.gold, "Medium Pairs": C.green, "Small Pairs": "rgba(76,175,125,0.6)", "Suited Broadways": C.blue, "Suited Connectors": "rgba(91,141,239,0.6)", "Suited Aces": "#d4a93c", "Offsuit Broadways": "rgba(212,169,60,0.6)", "Other": C.txm };
            gridData.flat().forEach(function(c) {
              if (c.actions[0].name === "Fold") return;
              var h = c.hand;
              var isPair = h.length === 2;
              var isSuited = h.endsWith("s");
              var r1 = RANKS.indexOf(h[0]);
              var r2 = RANKS.indexOf(h[isPair ? 0 : 1]);
              if (isPair && r1 <= 2) t["Premium Pairs"]++;
              else if (isPair && r1 <= 6) t["Medium Pairs"]++;
              else if (isPair) t["Small Pairs"]++;
              else if (isSuited && r1 === 0) t["Suited Aces"]++;
              else if (isSuited && r1 <= 4 && r2 <= 4) t["Suited Broadways"]++;
              else if (isSuited && Math.abs(r1 - r2) <= 2) t["Suited Connectors"]++;
              else if (!isSuited && r1 <= 4 && r2 <= 4) t["Offsuit Broadways"]++;
              else t["Other"]++;
            });
            var tiers = Object.keys(t).filter(function(k) { return t[k] > 0; }).map(function(k) { return { name: k, count: t[k], color: tierColors[k] || C.txm }; });
            var maxC = Math.max.apply(null, tiers.map(function(x) { return x.count; }).concat([1]));
            return tiers.map(function(tier) {
              return (
                <div key={tier.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: C.txm, width: 130, flexShrink: 0 }}>{tier.name}</span>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                    <div style={{ height: "100%", width: (tier.count / maxC * 100) + "%", borderRadius: 3, background: tier.color, transition: "width 0.4s" }} />
                  </div>
                  <span style={{ fontFamily: "var(--m)", fontSize: 10, fontWeight: 600, color: C.tx, width: 24, textAlign: "right" }}>{tier.count}</span>
                </div>
              );
            });
          })()}
        </Glass>

        {/* Position Comparison */}
        <Glass style={{ padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.txb, marginBottom: 14 }}>Position Comparison</div>
          {positions.map(function(p) {
            var n = 0;
            for (var i = 0; i < 13; i++) for (var j = 0; j < 13; j++) {
              var hand;
              if (i === j) hand = RANKS[i] + RANKS[j];
              else if (i < j) hand = RANKS[i] + RANKS[j] + "s";
              else hand = RANKS[j] + RANKS[i] + "o";
              var a = getStudyActions(hand, spot, p);
              if (a[0].name !== "Fold") n++;
            }
            var pct = (n / 169 * 100).toFixed(1);
            var isActive = p === pos;
            return (
              <div key={p} onClick={function() { setPos(p); setSel(null); }} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, cursor: "pointer" }}>
                <span style={{ fontFamily: "var(--m)", fontSize: 11, fontWeight: 700, color: isActive ? C.gold : C.txm, width: 60 }}>{p.replace("BB vs ", "v")}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                  <div style={{ height: "100%", width: (pct / 60 * 100) + "%", borderRadius: 3, background: isActive ? C.gold : C.green, transition: "width 0.4s" }} />
                </div>
                <span style={{ fontFamily: "var(--m)", fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? C.gold : C.tx, width: 48, textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
        </Glass>
      </div>
    </div>
  );
}

function getHandInfo(key, pos) {
  var rfiSet = new Set((RFI[pos] || "").split(","));
  var inRange = rfiSet.has(key);
  var isPair = key.length === 2;
  var isSuited = key.endsWith("s");
  var isOffsuit = key.endsWith("o");
  var ri1 = RANKS.indexOf(key[0]);
  var tier;
  if (isPair && ri1 <= 3) tier = "Premium pair";
  else if (isPair && ri1 <= 6) tier = "Medium pair";
  else if (isPair) tier = "Small pair";
  else if (ri1 === 0 && RANKS.indexOf(key[1]) <= 2) tier = "Premium broadway";
  else if (isSuited && ri1 <= 1) tier = "Suited ace/king";
  else if (isSuited && Math.abs(ri1 - RANKS.indexOf(key[1])) === 1 && ri1 >= 4) tier = "Suited connector";
  else if (isOffsuit && ri1 === 0) tier = "Ace-x offsuit";
  else tier = "Marginal";
  var borderline = false;
  var openPositions = [];
  Object.keys(RFI).forEach(function(p) {
    if (new Set((RFI[p] || "").split(",")).has(key)) openPositions.push(p);
  });
  if (openPositions.length >= 2 && openPositions.length <= 4) borderline = true;
  var tip;
  if (inRange && borderline) tip = "Borderline open from " + pos + ". Tighter positions fold this combo.";
  else if (inRange) tip = "Standard " + pos + " open. Equity and playability justify the raise.";
  else if (!inRange && borderline) tip = "Just outside the " + pos + " range. Opens from later positions.";
  else if (!inRange) tip = "Below the " + pos + " threshold. Clear fold.";
  var rangeStr = openPositions.length === 0 ? "Not in any RFI range" : openPositions.length === 5 ? "All positions" : openPositions.join(", ");
  return { type: isPair ? "Pair" : isSuited ? "Suited" : "Offsuit", tier: tier, borderline: borderline, tip: tip, rangeStr: rangeStr, inRange: inRange, openPositions: openPositions };
}

var SEATS = [
  { id: "CO", x: 50, y: 2 },
  { id: "BTN", x: 85, y: 16 },
  { id: "SB", x: 85, y: 58 },
  { id: "BB", x: 50, y: 74 },
  { id: "UTG", x: 15, y: 58 },
  { id: "MP", x: 15, y: 16 },
];

function TrainerPage() {
  var _mode = useState("rfi"); var mode = _mode[0]; var setMode = _mode[1];
  var _pos = useState("BTN"); var pos = _pos[0]; var setPos = _pos[1];
  var _hand = useState(null); var hand = _hand[0]; var setHand = _hand[1];
  var _ans = useState(null); var ans = _ans[0]; var setAns = _ans[1];
  var _stats = useState({ hands: 0, correct: 0 }); var stats = _stats[0]; var setStats = _stats[1];
  var _evLoss = useState(0); var evLoss = _evLoss[0]; var setEvLoss = _evLoss[1];
  var _log = useState([]); var log = _log[0]; var setLog = _log[1];
  var _showRange = useState(false); var showRange = _showRange[0]; var setShowRange = _showRange[1];
  var _timed = useState(false); var timed = _timed[0]; var setTimed = _timed[1];
  var _timer = useState(10); var timer = _timer[0]; var setTimer = _timer[1];
  var _streak = useState(0); var streak = _streak[0]; var setStreak = _streak[1];
  var _bestStreak = useState(0); var bestStreak = _bestStreak[0]; var setBestStreak = _bestStreak[1];
  var timerRef = useRef(null);

  var modePositions = mode === "rfi" ? Object.keys(RFI) : ["BB vs UTG","BB vs MP","BB vs CO","BB vs BTN","BB vs SB"];

  useEffect(function() {
    if (modePositions.indexOf(pos) === -1) setPos(modePositions[0]);
  }, [mode]);

  useEffect(function() {
    if (timed && !ans && hand) {
      setTimer(10);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(function() {
        setTimer(function(t) {
          if (t <= 1) { clearInterval(timerRef.current); check("Fold"); return 0; }
          return t - 1;
        });
      }, 1000);
      return function() { clearInterval(timerRef.current); };
    }
    return function() { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hand, timed, ans]);

  var deal = useCallback(function() {
    var suits = ["h","d","c","s"];
    var deck = [];
    RANKS.forEach(function(r) { suits.forEach(function(s) { deck.push(r + s); }); });
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
    }
    var r0 = deck[0].slice(0,-1), r1 = deck[1].slice(0,-1);
    var s0 = deck[0].slice(-1), s1 = deck[1].slice(-1);
    var isPair = r0 === r1, isSuited = s0 === s1;
    var key;
    if (isPair) key = r0 + r1;
    else {
      var ri0 = RANKS.indexOf(r0), ri1 = RANKS.indexOf(r1);
      key = ri0 < ri1 ? r0 + r1 + (isSuited ? "s" : "o") : r1 + r0 + (isSuited ? "s" : "o");
    }
    var actions = getStudyActions(key, mode === "rfi" ? "rfi" : "vs_open", pos);
    var correct = actions[0].name === "Fold" ? "Fold" : actions[0].name === "3-Bet" ? "3-Bet" : actions[0].name === "Call" ? "Call" : "Raise";
    setHand({ c1: deck[0], c2: deck[1], key: key, correct: correct, actions: actions });
    setAns(null); setShowRange(false);
  }, [pos, mode]);

  var check = function(a) {
    if (timerRef.current) clearInterval(timerRef.current);
    var right = a === hand.correct;
    var info = mode === "rfi" ? getHandInfo(hand.key, pos) : { borderline: false, tip: right ? "Correct." : "GTO: " + hand.correct, type: hand.key.length === 2 ? "Pair" : hand.key.endsWith("s") ? "Suited" : "Offsuit", tier: "", rangeStr: "" };
    var loss = right ? 0 : (info.borderline ? 0.8 : 2.5);
    setAns({ a: a, right: right, info: info, loss: loss });
    setStats(function(s) { return { hands: s.hands + 1, correct: s.correct + (right ? 1 : 0) }; });
    setEvLoss(function(e) { return +(e + loss).toFixed(1); });
    setLog(function(l) { return [{ key: hand.key, right: right, action: a, correct: hand.correct, pos: pos }].concat(l).slice(0, 100); });
    if (right) { setStreak(function(s) { var n = s + 1; if (n > bestStreak) setBestStreak(n); return n; }); }
    else setStreak(0);
  };

  var resetAll = function(p) {
    if (p) setPos(p);
    setStats({ hands: 0, correct: 0 });
    setEvLoss(0); setLog([]); setStreak(0); setBestStreak(0);
  };

  useEffect(function() { deal(); }, [deal]);

  var c1 = hand ? parseCards(hand.c1) : [];
  var c2 = hand ? parseCards(hand.c2) : [];
  var pct = stats.hands > 0 ? Math.round(stats.correct / stats.hands * 100) : 0;

  var rangeGrid = useMemo(function() {
    var g = [];
    for (var i = 0; i < 13; i++) for (var j = 0; j < 13; j++) {
      var h;
      if (i === j) h = RANKS[i] + RANKS[j];
      else if (i < j) h = RANKS[i] + RANKS[j] + "s";
      else h = RANKS[j] + RANKS[i] + "o";
      var a = getStudyActions(h, mode === "rfi" ? "rfi" : "vs_open", pos);
      g.push({ hand: h, action: a[0].name, color: a[0].color });
    }
    return g;
  }, [pos, mode]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: C.gold, letterSpacing: "-0.03em" }}>{pos.replace("BB vs ", "BB v ")}</span>
          <span style={{ fontSize: 16, color: C.txm, fontWeight: 300 }}>{mode === "rfi" ? "Raise First In" : "Facing Open"}</span>
        </div>
        <button onClick={function() { setTimed(!timed); }} style={{
          fontFamily: "var(--m)", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
          color: timed ? C.gold : C.txm,
          background: timed ? "rgba(212,167,44,0.06)" : "transparent",
          border: "1px solid " + (timed ? "rgba(212,167,44,0.15)" : "rgba(255,255,255,0.05)"),
          borderRadius: 6, padding: "5px 12px", cursor: "pointer",
        }}>TIMED {timed ? "ON" : "OFF"}</button>
      </div>

      {/* Mode + Position */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 3, background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 3, border: "1px solid rgba(255,255,255,0.04)" }}>
          {[{ id: "rfi", name: "RFI" }, { id: "vs_open", name: "vs Open" }].map(function(m) {
            return (
              <button key={m.id} onClick={function() { setMode(m.id); resetAll(); }} style={{
                fontFamily: "var(--m)", fontSize: 10, fontWeight: 600,
                color: mode === m.id ? C.gold : C.txm,
                background: mode === m.id ? "rgba(212,167,44,0.08)" : "transparent",
                border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer",
              }}>{m.name}</button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 3, background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 3, border: "1px solid rgba(255,255,255,0.04)" }}>
          {modePositions.map(function(p) {
            var active = pos === p;
            return (
              <button key={p} onClick={function() { resetAll(p); }} style={{
                fontFamily: "var(--m)", fontSize: 10, fontWeight: 700,
                color: active ? "#000" : C.txm,
                background: active ? "linear-gradient(135deg," + C.gold + "," + C.goldL + ")" : "transparent",
                border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                boxShadow: active ? "0 2px 8px rgba(212,167,44,0.2)" : "none",
              }}>{p.replace("BB vs ", "v")}</button>
            );
          })}
        </div>
      </div>

      {/* Poker table — pick position by tapping a seat */}
      <div style={{ position: "relative", width: "100%", maxWidth: 380, margin: "0 auto 16px", aspectRatio: "1.6 / 1" }}>
        <div style={{ position: "absolute", inset: "10% 6%", borderRadius: "50%", background: "radial-gradient(ellipse at 50% 40%, #1c5e3f 0%, #0e3d27 70%, #082416 100%)", border: "3px solid #5d3a16", boxShadow: "inset 0 4px 20px rgba(0,0,0,0.45), 0 6px 24px rgba(0,0,0,0.5)" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: C.gold, opacity: 0.7, fontFamily: "var(--m)" }}>{mode === "rfi" ? "OPEN" : "FACING OPEN"}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.txb, marginTop: 4, fontFamily: "var(--m)", letterSpacing: "-0.01em" }}>{pos.replace("BB vs ", "BB v ")}</div>
        </div>
        {SEATS.map(function(seat) {
          var isHero, isVillain, canClick;
          if (mode === "rfi") {
            isHero = seat.id === pos;
            isVillain = false;
            canClick = true;
          } else {
            var villainPos = pos.replace("BB vs ", "");
            isHero = seat.id === "BB";
            isVillain = seat.id === villainPos;
            canClick = seat.id !== "BB";
          }
          return (
            <button key={seat.id} disabled={!canClick} onClick={function() {
              var newPos = mode === "rfi" ? seat.id : "BB vs " + seat.id;
              resetAll(newPos);
            }} style={{
              position: "absolute",
              left: seat.x + "%", top: seat.y + "%",
              transform: "translate(-50%, -50%)",
              width: 50, height: 50, borderRadius: "50%",
              background: isHero ? "linear-gradient(135deg," + C.gold + "," + C.goldL + ")" : isVillain ? "rgba(212,168,83,0.20)" : "rgba(20,22,30,0.85)",
              border: "1.5px solid " + (isHero ? C.gold : isVillain ? C.amber : "rgba(255,255,255,0.12)"),
              color: isHero ? "#0a0a10" : isVillain ? C.amber : C.tx,
              fontFamily: "var(--m)", fontSize: 11, fontWeight: 800, letterSpacing: "0.02em",
              cursor: canClick ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isHero ? "0 4px 16px rgba(212,167,44,0.45)" : isVillain ? "0 0 0 1.5px rgba(212,168,83,0.10)" : "0 2px 6px rgba(0,0,0,0.4)",
              transition: "all 0.15s", padding: 0,
            }}>{seat.id}</button>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 16 }}>
        {[
          { label: "HANDS", value: stats.hands, color: C.txb },
          { label: "ACCURACY", value: stats.hands ? pct + "%" : "\u2014", color: pct >= 70 ? C.green : pct >= 40 ? C.amber : stats.hands ? C.red : C.txm },
          { label: "STREAK", value: streak, color: streak >= 5 ? C.gold : C.txb },
          { label: "BEST", value: bestStreak, color: bestStreak >= 5 ? C.gold : C.txb },
          { label: "EV LOSS", value: evLoss ? evLoss + "bb" : "0", color: evLoss > 0 ? C.red : C.txb },
        ].map(function(s) {
          return (
            <div key={s.label} style={{ padding: "10px 6px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: "var(--m)" }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Cards */}
      <Glass style={{ padding: 28, marginBottom: 14, textAlign: "center", position: "relative" }}>
        {timed && !ans && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "8px 8px 0 0", overflow: "hidden" }}>
            <div style={{ height: "100%", width: (timer / 10 * 100) + "%", background: timer <= 3 ? C.red : C.gold, transition: "width 1s linear, background 0.3s" }} />
          </div>
        )}
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: C.txm, fontFamily: "var(--m)", marginBottom: 16 }}>
          {pos.replace("BB vs ", "BB v ")} · {mode === "rfi" ? "RFI" : "vs RFI"} · 200bb
          {timed && !ans && <span style={{ color: timer <= 3 ? C.red : C.gold, marginLeft: 10 }}>{timer}s</span>}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
          {c1.map(function(c, i) { return <Crd key={i} r={c.r} sym={c.sym} clr={c.clr} sz={64} />; })}
          {c2.map(function(c, i) { return <Crd key={"b" + i} r={c.r} sym={c.sym} clr={c.clr} sz={64} />; })}
        </div>
        <div style={{ fontFamily: "var(--m)", fontSize: 14, fontWeight: 700, color: C.txb, letterSpacing: "0.06em" }}>{hand ? hand.key : ""}</div>
      </Glass>

      {/* Action buttons */}
      {!ans ? (
        <div style={{ display: "grid", gridTemplateColumns: mode === "rfi" ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          <button onClick={function() { check("Fold"); }} style={{
            fontFamily: "var(--m)", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
            color: "#fff", background: "rgba(215,85,85,0.18)",
            border: "1px solid rgba(215,85,85,0.12)", borderRadius: 8, padding: "16px 8px", cursor: "pointer",
          }}>FOLD</button>
          {mode === "vs_open" && <button onClick={function() { check("Call"); }} style={{
            fontFamily: "var(--m)", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
            color: "#fff", background: "rgba(91,141,239,0.18)",
            border: "1px solid rgba(91,141,239,0.12)", borderRadius: 8, padding: "16px 8px", cursor: "pointer",
          }}>CALL</button>}
          <button onClick={function() { check(mode === "rfi" ? "Raise" : "3-Bet"); }} style={{
            fontFamily: "var(--m)", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
            color: "#fff", background: mode === "rfi" ? "rgba(76,175,125,0.18)" : "rgba(212,169,60,0.18)",
            border: "1px solid " + (mode === "rfi" ? "rgba(76,175,125,0.12)" : "rgba(212,169,60,0.12)"),
            borderRadius: 8, padding: "16px 8px", cursor: "pointer",
          }}>{mode === "rfi" ? "RAISE 2.5x" : "3-BET"}</button>
        </div>
      ) : (
        <div style={{ animation: "fu 0.15s both" }}>
          <Glass style={{ padding: 18, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: ans.right ? "rgba(76,175,125,0.08)" : "rgba(215,85,85,0.08)",
                border: "1px solid " + (ans.right ? "rgba(76,175,125,0.15)" : "rgba(215,85,85,0.15)"),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--m)", fontSize: 16, fontWeight: 800,
                color: ans.right ? C.green : C.red,
              }}>{ans.right ? "\u2713" : "\u2717"}</div>
              <div>
                <div style={{ fontFamily: "var(--m)", fontSize: 15, fontWeight: 700, color: C.txb }}>{hand.key}</div>
                <div style={{ fontSize: 12, color: ans.right ? C.green : C.red, fontWeight: 600 }}>{ans.right ? "Correct" : "Incorrect"}</div>
              </div>
              {ans.loss > 0 && <div style={{ marginLeft: "auto", fontFamily: "var(--m)", fontSize: 11, color: C.red, fontWeight: 700 }}>-{ans.loss}bb</div>}
            </div>
            <div style={{ fontSize: 12, color: C.tx, lineHeight: 1.55, marginBottom: 10 }}>{ans.info.tip}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 10, fontFamily: "var(--m)", color: C.txm, background: "rgba(255,255,255,0.03)", padding: "4px 10px", borderRadius: 5 }}>
                You: <span style={{ color: ans.a === "Raise" || ans.a === "3-Bet" ? C.green : ans.a === "Call" ? C.blue : C.red, fontWeight: 700 }}>{ans.a}</span>
              </span>
              <span style={{ fontSize: 10, fontFamily: "var(--m)", color: C.txm, background: "rgba(255,255,255,0.03)", padding: "4px 10px", borderRadius: 5 }}>
                GTO: <span style={{ color: hand.correct === "Raise" || hand.correct === "3-Bet" ? C.green : hand.correct === "Call" ? C.blue : C.red, fontWeight: 700 }}>{hand.correct}</span>
              </span>
            </div>
            {hand.actions && (
              <div style={{ marginTop: 12 }}>
                {hand.actions.map(function(a) {
                  return (
                    <div key={a.name} style={{ marginBottom: 5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontFamily: "var(--m)", fontSize: 9, color: C.txm }}>{a.name}</span>
                        <span style={{ fontFamily: "var(--m)", fontSize: 9, fontWeight: 700, color: a.color }}>{a.pct}%</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.04)" }}>
                        <div style={{ height: "100%", width: a.pct + "%", borderRadius: 2, background: a.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Glass>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <button onClick={function() { setShowRange(!showRange); }} style={{
              fontFamily: "var(--m)", fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
              color: showRange ? C.gold : C.txm,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid " + (showRange ? "rgba(212,167,44,0.15)" : "rgba(255,255,255,0.05)"),
              borderRadius: 8, padding: "13px", cursor: "pointer",
            }}>{showRange ? "HIDE RANGE" : "SHOW RANGE"}</button>
            <button onClick={deal} style={{
              fontFamily: "var(--m)", fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
              color: "#000", background: "linear-gradient(135deg," + C.gold + "," + C.goldL + ")",
              border: "none", borderRadius: 8, padding: "13px", cursor: "pointer",
              boxShadow: "0 2px 12px rgba(212,167,44,0.15)",
            }}>NEXT HAND</button>
          </div>
        </div>
      )}

      {/* Range reveal */}
      {showRange && ans && (
        <Glass style={{ padding: 16, marginBottom: 14, animation: "fu 0.15s both" }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 10 }}>
            {pos.replace("BB vs ", "BB v ")} — {mode === "rfi" ? "RFI RANGE" : "DEFENSE RANGE"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(13, 1fr)", gap: 1.5 }}>
            {rangeGrid.map(function(cell, i) {
              var isCurrent = cell.hand === hand.key;
              var isFold = cell.action === "Fold";
              var bg = cell.action === "Raise" ? "#4caf7d" : cell.action === "3-Bet" ? "rgba(212,169,60,0.55)" : cell.action === "Call" ? "rgba(91,141,239,0.45)" : "rgba(215,85,85,0.14)";
              return (
                <div key={i} style={{
                  aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 2, fontSize: 6, fontWeight: 700, fontFamily: "var(--m)",
                  color: isFold ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.85)",
                  background: isCurrent ? C.gold : bg,
                  outline: isCurrent ? "2px solid " + C.goldL : "none",
                  zIndex: isCurrent ? 5 : 1, position: "relative",
                }}>{cell.hand}</div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 10, justifyContent: "center" }}>
            {(mode === "rfi" ? [["Raise","#4caf7d"],["Fold","rgba(215,85,85,0.4)"]] : [["3-Bet","rgba(212,169,60,0.55)"],["Call","rgba(91,141,239,0.45)"],["Fold","rgba(215,85,85,0.4)"]]).map(function(l) {
              return <div key={l[0]} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: 2, background: l[1] }} /><span style={{ fontFamily: "var(--m)", fontSize: 9, color: C.txm }}>{l[0]}</span></div>;
            })}
          </div>
        </Glass>
      )}

      {/* History strip */}
      {log.length > 0 && (
        <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>
          {log.slice(0, 30).map(function(e, i) {
            return (
              <div key={i} style={{
                flexShrink: 0, padding: "3px 7px", borderRadius: 4,
                background: e.right ? "rgba(255,255,255,0.02)" : "rgba(215,85,85,0.05)",
                border: "1px solid " + (e.right ? "rgba(255,255,255,0.03)" : "rgba(215,85,85,0.1)"),
                fontFamily: "var(--m)", fontSize: 9, fontWeight: 600,
                color: e.right ? C.txm : C.red,
              }}>{e.key}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UploadsPage(props) {
  var onResult = props.onResult;
  var viewHand = props.viewHand;
  var clearViewHand = props.clearViewHand;
  var _img = useState(null); var img = _img[0]; var setImg = _img[1];
  var _b64 = useState(null); var b64 = _b64[0]; var setB64 = _b64[1];
  var _mime = useState("image/png"); var mime = _mime[0]; var setMime = _mime[1];
  var _data = useState(viewHand || null); var data = _data[0]; var setData = _data[1];
  var _busy = useState(false); var busy = _busy[0]; var setBusy = _busy[1];
  var _err = useState(null); var err = _err[0]; var setErr = _err[1];
  var _st = useState(0); var st = _st[0]; var setSt = _st[1];
  var _drag = useState(false); var drag = _drag[0]; var setDrag = _drag[1];
  var _fromHistory = useState(!!viewHand); var fromHistory = _fromHistory[0]; var setFromHistory = _fromHistory[1];
  var ref = useRef(null);

  useEffect(function() {
    if (viewHand) { setData(viewHand); setFromHistory(true); if (clearViewHand) clearViewHand(); }
  }, [viewHand]);

  var load = useCallback(function(f) {
    if (!f || !f.type || !f.type.startsWith("image/")) return;
    setErr(null); setData(null);
    var rd = new FileReader();
    rd.onload = function(e) {
      var d = e.target.result;
      setImg(d); setB64(d.split(",")[1]);
      var m = d.match(/^data:(image\/[a-z0-9.+-]+);/i);
      setMime(m ? m[1] : "image/png");
    };
    rd.readAsDataURL(f);
  }, []);

  var drop = useCallback(function(e) { e.preventDefault(); setDrag(false); load(e.dataTransfer.files[0]); }, [load]);

  var run = async function() {
    if (!b64) return; setBusy(true); setErr(null); setData(null);
    try {
      var d = await askAI([
        { type: "image", source: { type: "base64", media_type: mime, data: b64 } },
        { type: "text", text: "Analyze this poker hand screenshot. Identify the poker client (ClubWPT Gold, PokerStars, GGPoker, etc). Read hero cards, board, pot, bets, positions, and all action. Give full GTO breakdown with frequencies and verdicts per street." },
      ]);
      setData(d); setSt(0); if (onResult) onResult(d);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  var reset = function() { setImg(null); setB64(null); setData(null); setErr(null); setFromHistory(false); };
  var street = data && data.streets ? data.streets[st] : null;

  return (
    <div>
      {!data && !busy && (
        <div>
          {!img ? (
            <div
              onDragOver={function(e) { e.preventDefault(); setDrag(true); }}
              onDragLeave={function() { setDrag(false); }}
              onDrop={drop}
              onClick={function() { if (ref.current) ref.current.click(); }}
              style={{
                border: "2px dashed " + (drag ? C.gold : C.border), borderRadius: 16,
                cursor: "pointer", background: drag ? C.gold + "06" : "transparent", transition: "all 0.25s",
              }}
            >
              <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={function(e) { load(e.target.files[0]); }} />
              <div style={{ padding: "64px 32px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
                  <Crd r="A" sym={SD.s.s} clr={SD.s.c} sz={60} />
                  <Crd r="K" sym={SD.h.s} clr={SD.h.c} sz={60} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 300, color: C.txb, letterSpacing: "-0.02em", marginBottom: 6 }}>Analyze a Hand</div>
                <p style={{ fontSize: 15, color: C.txm, marginBottom: 28, textAlign: "center" }}>Drop a screenshot from any poker client</p>
                <p style={{ fontSize: 11, color: C.txm, opacity: 0.5, marginBottom: 16, textAlign: "center" }}>Supports ClubWPT Gold, PokerStars, GGPoker, ACR, 888 & more</p>
                <GoldBtn>Choose File</GoldBtn>
                <p style={{ fontSize: 12, color: C.txm, opacity: 0.4, marginTop: 12 }}>or drag & drop</p>
              </div>
            </div>
          ) : (
            <Glass style={{ overflow: "hidden", padding: 0 }}>
              <div style={{ background: C.bg, display: "flex", justifyContent: "center", padding: 4 }}>
                <img src={img} alt="" style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain", display: "block", borderRadius: 10 }} />
              </div>
              <div style={{ display: "flex", borderTop: "1px solid " + C.border }}>
                <button onClick={reset} style={{ flex: 1, padding: 16, fontSize: 14, fontFamily: "var(--f)", color: C.txm, background: "transparent", border: "none", borderRight: "1px solid " + C.border, cursor: "pointer" }}>Clear</button>
                <button onClick={run} style={{ flex: 2, padding: 16, fontSize: 15, fontWeight: 700, fontFamily: "var(--f)", color: "#000", background: "linear-gradient(135deg," + C.gold + "," + C.goldL + ")", border: "none", cursor: "pointer" }}>{"Analyze \u2192"}</button>
              </div>
            </Glass>
          )}
        </div>
      )}
      {busy && <Loader steps={["Reading screenshot", "Identifying cards", "Tracing action", "Computing GTO", "Grading decisions"]} />}
      {err && <div style={{ padding: 14, borderRadius: 10, fontSize: 14, color: C.red, background: C.red + "10", border: "1px solid " + C.red + "20", marginTop: 16 }}>{err}</div>}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fu 0.35s both" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 6 }}>HERO {data.hero_position && <span style={{ color: C.gold }}>{"\u00B7"} {data.hero_position}</span>}</div>
              <div style={{ display: "flex", gap: 5 }}>{parseCards(data.hero_cards).map(function(c, i) { return <Crd key={i} r={c.r} sym={c.sym} clr={c.clr} sz={54} />; })}</div>
            </div>
            <span style={{ fontSize: 14, color: C.txm, opacity: 0.4, fontStyle: "italic", marginBottom: 10 }}>vs</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 6 }}>VILLAIN {data.villain_position && <span style={{ color: C.red }}>{"\u00B7"} {data.villain_position}</span>}</div>
              <div style={{ display: "flex", gap: 5 }}>
                {data.villain_cards !== "unknown"
                  ? parseCards(data.villain_cards).map(function(c, i) { return <Crd key={i} r={c.r} sym={c.sym} clr={c.clr} sz={46} />; })
                  : [<FaceDown key="a" sz={46} />, <FaceDown key="b" sz={46} />]
                }
              </div>
            </div>
          </div>

          <Glass style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
            {data.community_cards && <div style={{ display: "flex", gap: 4 }}>{parseCards(data.community_cards).map(function(c, i) { return <Crd key={i} r={c.r} sym={c.sym} clr={c.clr} sz={34} />; })}</div>}
            <div style={{ flex: 1 }} />
            {data.final_pot && <div><span style={{ fontSize: 10, color: C.txm, fontFamily: "var(--m)", letterSpacing: "0.1em" }}>POT </span><span style={{ fontSize: 20, fontWeight: 700, color: C.gold, fontFamily: "var(--m)" }}>{data.final_pot}</span></div>}
          </Glass>

          {data.overall && (
            <Glass style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 22px" }}>
              <div style={{ fontFamily: "var(--m)", fontWeight: 800, fontSize: 30, color: data.overall.grade && data.overall.grade[0] === "A" ? C.green : data.overall.grade && data.overall.grade[0] === "B" ? C.blue : C.amber }}>{data.overall.grade}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 16, color: C.txb, fontWeight: 500 }}>{data.overall.summary}</div></div>
              {data.overall.ev_lost != null && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "var(--m)", fontSize: 18, fontWeight: 700, color: data.overall.ev_lost <= 1 ? C.green : data.overall.ev_lost <= 3 ? C.amber : C.red }}>
                    {data.overall.ev_lost > 0 ? "-" : ""}{data.overall.ev_lost.toFixed(1)}bb
                  </div>
                  <div style={{ fontSize: 10, color: C.txm, fontFamily: "var(--m)", letterSpacing: "0.1em" }}>EV LOST</div>
                </div>
              )}
            </Glass>
          )}

          {data.streets && data.streets.length > 0 && (
            <div>
              <div style={{ display: "flex", gap: 2, borderBottom: "1px solid " + C.border, overflowX: "auto" }}>
                {data.streets.map(function(s, i) {
                  var v = VERD[s.verdict] || {};
                  return (
                    <button key={i} onClick={function() { setSt(i); }} style={{
                      fontFamily: "var(--f)", fontSize: 14, fontWeight: st === i ? 600 : 400,
                      color: st === i ? C.txb : C.txm, background: st === i ? "rgba(255,255,255,0.04)" : "transparent",
                      border: "none", borderBottom: st === i ? "2px solid " + (v.c || C.gold) : "2px solid transparent",
                      padding: "12px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      marginBottom: -1, whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: v.c || C.txm }} />{s.street}
                    </button>
                  );
                })}
              </div>
              {street && (
                <Glass key={st} style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: "none", padding: 22 }}>
                  {street.verdict && (function() {
                    var v = VERD[street.verdict] || {};
                    return (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: (v.c || C.txm) + "12", border: "1px solid " + (v.c || C.txm) + "20", borderRadius: 8, padding: "6px 14px", marginBottom: 14 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: v.c, fontFamily: "var(--m)" }}>{v.i}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: v.c }}>{v.l}</span>
                        {street.ev_loss > 0 && <span style={{ fontSize: 11, fontFamily: "var(--m)", color: v.c, opacity: 0.75 }}>-{street.ev_loss.toFixed(1)}bb</span>}
                      </div>
                    );
                  })()}
                  {street.action_summary && <p style={{ fontSize: 14, color: C.txm, lineHeight: 1.6, marginBottom: 14 }}>{street.action_summary}</p>}
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: C.txm, fontFamily: "var(--m)", marginBottom: 8 }}>GTO STRATEGY</div>
                  <div style={{ marginBottom: 16 }}><FreqBar actions={street.gto_actions} chose={street.hero_chose} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.025)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 4 }}>YOUR PLAY</div>
                      <div style={{ fontFamily: "var(--m)", fontSize: 15, color: C.txb, fontWeight: 600 }}>{street.hero_actual_action || "\u2014"}</div>
                    </div>
                    <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.025)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: C.gold, opacity: 0.5, fontFamily: "var(--m)", marginBottom: 4 }}>GTO PLAY</div>
                      <div style={{ fontFamily: "var(--m)", fontSize: 15, color: C.gold, fontWeight: 600 }}>{street.best_action}{street.best_sizing ? " \u2014 " + street.best_sizing : ""}</div>
                    </div>
                  </div>
                  {street.reasoning && (
                    <div style={{ padding: "12px 16px", borderRadius: 8, background: C.gold + "06", border: "1px solid " + C.gold + "10" }}>
                      <p style={{ fontSize: 14, color: C.tx, lineHeight: 1.6 }}>{street.reasoning}</p>
                    </div>
                  )}
                </Glass>
              )}
            </div>
          )}

          <button onClick={reset} style={{ fontFamily: "var(--f)", fontSize: 14, color: C.txm, background: "transparent", border: "1px solid " + C.border, borderRadius: 8, padding: "10px 20px", cursor: "pointer", alignSelf: "flex-start" }}>New Hand</button>
        </div>
      )}
    </div>
  );
}

function CustomPage() {
  var _q = useState(""); var q = _q[0]; var setQ = _q[1];
  var _interim = useState(""); var interim = _interim[0]; var setInterim = _interim[1];
  var _data = useState(null); var data = _data[0]; var setData = _data[1];
  var _busy = useState(false); var busy = _busy[0]; var setBusy = _busy[1];
  var _err = useState(null); var err = _err[0]; var setErr = _err[1];

  var handleVoice = useCallback(function(final, inter, done) {
    if (done) { setQ(function(prev) { return (prev + " " + final).trim(); }); setInterim(""); }
    else { setInterim(inter); }
  }, []);

  var run = async function() {
    if (!q.trim()) return; setBusy(true); setErr(null); setData(null);
    try { setData(await askAI([{ type: "text", text: "Solve this poker spot GTO:\n\n" + q }])); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <Glass style={{ marginBottom: 16, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: C.txm, fontFamily: "var(--m)" }}>DESCRIBE YOUR SPOT</div>
          <VoiceMic onResult={handleVoice} />
        </div>
        <div style={{ position: "relative" }}>
          <textarea value={q} onChange={function(e) { setQ(e.target.value); }} placeholder="6-max 100bb, BTN opens 2.5x, BB 3-bets to 10x. BTN has AJs. What should BTN do?" rows={4} style={{ width: "100%", background: C.bg1, border: "1.5px solid " + C.border, borderRadius: 10, padding: 16, color: C.txb, fontSize: 15, fontFamily: "var(--f)", resize: "vertical", outline: "none" }} />
          {interim && <div style={{ position: "absolute", bottom: 12, left: 16, right: 16, fontSize: 13, color: C.gold, opacity: 0.6, fontStyle: "italic", pointerEvents: "none" }}>{interim}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
          <GoldBtn onClick={run} disabled={busy || !q.trim()}>{busy ? "Solving..." : "Solve Spot"}</GoldBtn>
          {q && <button onClick={function() { setQ(""); }} style={{ fontFamily: "var(--f)", fontSize: 12, color: C.txm, background: "transparent", border: "none", cursor: "pointer", padding: "4px 8px" }}>Clear</button>}
        </div>
      </Glass>
      {busy && <Loader steps={["Parsing scenario", "Building game tree", "Computing equilibrium"]} />}
      {err && <div style={{ padding: 14, borderRadius: 10, fontSize: 14, color: C.red, background: C.red + "10" }}>{err}</div>}
      {data && (
        <Glass style={{ padding: 24 }}>
          <p style={{ fontSize: 15, color: C.txb, lineHeight: 1.6, marginBottom: 14 }}>{(data.overall && data.overall.summary) || (data.streets && data.streets[0] && data.streets[0].reasoning) || "Done."}</p>
          {data.streets && data.streets.map(function(s, i) {
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.txb, marginBottom: 8 }}>{s.street}</div>
                <FreqBar actions={s.gto_actions} />
                {s.reasoning && <p style={{ fontSize: 14, color: C.txm, lineHeight: 1.6, marginTop: 8 }}>{s.reasoning}</p>}
              </div>
            );
          })}
        </Glass>
      )}
    </div>
  );
}

function RangeBuilderPage() {
  var _sel = useState(new Set()); var sel = _sel[0]; var setSel = _sel[1];
  var _pos = useState("BTN"); var pos = _pos[0]; var setPos = _pos[1];
  var _hover = useState(null); var hover = _hover[0]; var setHover = _hover[1];
  var _mode = useState("click"); var mode = _mode[0]; var setMode = _mode[1];
  var _painting = useState(false); var painting = _painting[0]; var setPainting = _painting[1];
  var _paintAdd = useState(true); var paintAdd = _paintAdd[0]; var setPaintAdd = _paintAdd[1];

  var toggle = function(h) { setSel(function(s) { var n = new Set(s); if (n.has(h)) n.delete(h); else n.add(h); return n; }); };
  var paintCell = function(h) {
    if (mode !== "paint") return;
    setSel(function(s) { var n = new Set(s); if (paintAdd) n.add(h); else n.delete(h); return n; });
  };

  var gtoSet = new Set((RFI[pos] || "").split(","));
  var pct = (sel.size / 169 * 100).toFixed(1);
  var gtoPct = (gtoSet.size / 169 * 100).toFixed(1);

  /* Composition */
  var comp = useMemo(function() {
    var pairs = 0, suited = 0, offsuit = 0, matching = 0, extra = 0, missing = 0;
    sel.forEach(function(h) {
      if (h.length === 2) pairs++;
      else if (h.endsWith("s")) suited++;
      else offsuit++;
      if (gtoSet.has(h)) matching++;
      else extra++;
    });
    gtoSet.forEach(function(h) { if (!sel.has(h)) missing++; });
    var overlap = gtoSet.size > 0 ? Math.round(matching / gtoSet.size * 100) : 0;
    return { pairs: pairs, suited: suited, offsuit: offsuit, matching: matching, extra: extra, missing: missing, overlap: overlap };
  }, [sel, pos]);

  var grid = useMemo(function() { return mkGrid(RFI[pos] || ""); }, [pos]);
  var cc = { p: "#4caf7d", s: "#5b8def", o: "#d45555" };

  var hoverInfo = hover ? getHandInfo(hover, pos) : null;

  /* Presets */
  var loadPreset = function(type) {
    if (type === "gto") { setSel(new Set(gtoSet)); }
    else if (type === "tight") {
      var t = new Set();
      "AA,KK,QQ,JJ,TT,AKs,AQs,AKo".split(",").forEach(function(h) { t.add(h); });
      setSel(t);
    }
    else if (type === "wide") {
      var w = new Set();
      grid.flat().forEach(function(cell, i) { if (i < 85) w.add(cell.hand); });
      setSel(w);
    }
    else { setSel(new Set()); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 300, color: C.txb, letterSpacing: "-0.02em" }}>Range Builder</span>
        </div>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 3, border: "1px solid rgba(255,255,255,0.04)" }}>
          {Object.keys(RFI).map(function(p) {
            var active = pos === p;
            return (
              <button key={p} onClick={function() { setPos(p); }} style={{
                fontFamily: "var(--m)", fontSize: 11, fontWeight: 700,
                color: active ? "#000" : C.txm,
                background: active ? "linear-gradient(135deg, " + C.gold + ", " + C.goldL + ")" : "transparent",
                border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                boxShadow: active ? "0 2px 8px rgba(212,167,44,0.2)" : "none",
              }}>{p}</button>
            );
          })}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
        {[
          { label: "SELECTED", value: sel.size, color: C.gold },
          { label: "FREQUENCY", value: pct + "%", color: C.gold },
          { label: "GTO MATCH", value: comp.overlap + "%", color: comp.overlap >= 80 ? C.green : comp.overlap >= 50 ? C.amber : C.red },
          { label: "GTO RANGE", value: gtoPct + "%", color: C.txm },
        ].map(function(s) {
          return (
            <div key={s.label} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", color: C.txm, fontFamily: "var(--m)", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: "var(--m)" }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.02)", borderRadius: 6, padding: 2, border: "1px solid rgba(255,255,255,0.04)" }}>
          {[["click", "Click"], ["paint", "Paint"]].map(function(m) {
            var active = mode === m[0];
            return (
              <button key={m[0]} onClick={function() { setMode(m[0]); }} style={{
                fontFamily: "var(--m)", fontSize: 10, fontWeight: active ? 700 : 400,
                color: active ? C.txb : C.txm,
                background: active ? "rgba(255,255,255,0.06)" : "transparent",
                border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer",
              }}>{m[1]}</button>
            );
          })}
        </div>
        {/* Presets */}
        <div style={{ display: "flex", gap: 2, marginLeft: 4 }}>
          {[["gto", "Load GTO"], ["tight", "Tight"], ["wide", "Top 50%"], ["clear", "Clear"]].map(function(p) {
            return (
              <button key={p[0]} onClick={function() { loadPreset(p[0]); }} style={{
                fontFamily: "var(--m)", fontSize: 10, fontWeight: 500,
                color: p[0] === "clear" ? C.red : C.txm,
                background: "transparent",
                border: "1px solid " + (p[0] === "clear" ? C.red + "25" : "rgba(255,255,255,0.06)"),
                borderRadius: 5, padding: "4px 10px", cursor: "pointer",
              }}>{p[1]}</button>
            );
          })}
        </div>
        {/* Composition mini */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {[["P", comp.pairs, cc.p], ["S", comp.suited, cc.s], ["O", comp.offsuit, cc.o]].map(function(c) {
            return (
              <div key={c[0]} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: c[2] }} />
                <span style={{ fontSize: 10, fontFamily: "var(--m)", color: C.txm }}>{c[1]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main: Matrix + Detail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 170px", gap: 10 }}>
        {/* Interactive matrix */}
        <Glass style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "16px repeat(13,1fr)", gap: 2 }}
            onMouseLeave={function() { setPainting(false); }}
          >
            <div />
            {RANKS.map(function(r) { return <div key={r} style={{ textAlign: "center", fontSize: 8, fontWeight: 600, color: C.txm, fontFamily: "var(--m)", paddingBottom: 1 }}>{r}</div>; })}
            {grid.map(function(row, ri) {
              return [
                <div key={"rh" + ri} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: C.txm, fontFamily: "var(--m)" }}>{RANKS[ri]}</div>
              ].concat(row.map(function(cell, ci) {
                var on = sel.has(cell.hand);
                var gto = gtoSet.has(cell.hand);
                var isHov = hover === cell.hand;
                /* Color logic: selected+gto=green, selected+notgto=amber, notselected+gto=dim outline */
                var bg = on ? cc[cell.tp] : "rgba(255,255,255,0.012)";
                var bdr = on && !gto ? "1.5px solid " + C.amber : gto && !on ? "1.5px dashed rgba(255,255,255,0.12)" : on ? "1px solid " + cc[cell.tp] + "50" : "1px solid rgba(255,255,255,0.03)";

                return (
                  <div key={ri + "-" + ci}
                    onMouseEnter={function() { setHover(cell.hand); if (painting) paintCell(cell.hand); }}
                    onMouseLeave={function() { setHover(null); }}
                    onMouseDown={function(e) {
                      e.preventDefault();
                      if (mode === "paint") { setPainting(true); setPaintAdd(!sel.has(cell.hand)); paintCell(cell.hand); }
                      else { toggle(cell.hand); }
                    }}
                    onMouseUp={function() { setPainting(false); }}
                    style={{
                      aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 3,
                      fontSize: 7.5, fontWeight: 700, fontFamily: "var(--m)", cursor: "pointer",
                      color: on ? "#fff" : gto ? "rgba(255,255,255,0.2)" : "#1a1c2a",
                      background: bg,
                      border: isHov ? "1.5px solid rgba(255,255,255,0.25)" : bdr,
                      boxShadow: on ? "inset 0 1px 0 rgba(255,255,255,0.12)" : "none",
                      transition: "all 0.08s",
                      transform: isHov ? "scale(1.12)" : "none",
                      zIndex: isHov ? 2 : 1,
                      position: "relative",
                      userSelect: "none",
                    }}>{cell.hand}</div>
                );
              }));
            })}
          </div>
        </Glass>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Hover info */}
          <Glass style={{ padding: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 6 }}>HAND INFO</div>
            {hoverInfo ? (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.txb, fontFamily: "var(--m)", marginBottom: 3 }}>{hover}</div>
                <div style={{ display: "flex", gap: 3, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 8, fontFamily: "var(--m)", color: sel.has(hover) ? C.green : C.txm, background: sel.has(hover) ? C.green + "12" : "rgba(255,255,255,0.04)", padding: "2px 5px", borderRadius: 3 }}>{sel.has(hover) ? "SELECTED" : "NOT IN"}</span>
                  <span style={{ fontSize: 8, fontFamily: "var(--m)", color: gtoSet.has(hover) ? C.blue : C.txm, background: gtoSet.has(hover) ? C.blue + "12" : "rgba(255,255,255,0.04)", padding: "2px 5px", borderRadius: 3 }}>{gtoSet.has(hover) ? "GTO " + pos : "NOT GTO"}</span>
                </div>
                <div style={{ fontSize: 10, color: C.txm, marginBottom: 4 }}>{hoverInfo.tier}</div>
                <div style={{ fontSize: 10, color: C.tx, lineHeight: 1.5 }}>{hoverInfo.tip}</div>
                <div style={{ fontSize: 8, fontFamily: "var(--m)", color: C.txm, marginTop: 6, opacity: 0.5 }}>{hoverInfo.rangeStr}</div>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: C.txm, opacity: 0.3, lineHeight: 1.4 }}>Hover any hand</div>
            )}
          </Glass>

          {/* GTO comparison */}
          <Glass style={{ padding: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 8 }}>VS GTO ({pos})</div>
            {[
              { label: "Matching", value: comp.matching, color: C.green, desc: "In both ranges" },
              { label: "Extra", value: comp.extra, color: C.amber, desc: "You added" },
              { label: "Missing", value: comp.missing, color: C.red, desc: "GTO has, you dont" },
            ].map(function(r) {
              var w = gtoSet.size > 0 ? (r.value / Math.max(sel.size, gtoSet.size) * 100) : 0;
              return (
                <div key={r.label} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: C.txm }}>{r.label}</span>
                    <span style={{ fontSize: 10, fontFamily: "var(--m)", color: r.color, fontWeight: 700 }}>{r.value}</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: C.bg1 }}>
                    <div style={{ height: "100%", width: Math.min(w, 100) + "%", borderRadius: 2, background: r.color, opacity: 0.5, transition: "width 0.3s" }} />
                  </div>
                </div>
              );
            })}
          </Glass>

          {/* Legend */}
          <Glass style={{ padding: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 6 }}>LEGEND</div>
            {[
              { c: cc.p, t: "Selected pair" },
              { c: cc.s, t: "Selected suited" },
              { c: cc.o, t: "Selected offsuit" },
            ].map(function(l) {
              return (
                <div key={l.t} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.c, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: C.txm }}>{l.t}</span>
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, marginTop: 2 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, border: "1.5px dashed rgba(255,255,255,0.15)", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: C.txm }}>GTO (not selected)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: cc.s, border: "1.5px solid " + C.amber, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: C.txm }}>Selected (not GTO)</span>
            </div>
          </Glass>
        </div>
      </div>
    </div>
  );
}

function BankrollPage(props) {
  var user = props.user;
  var GAMES = ["NLH", "PLO", "PLO5", "Mixed"];
  var STAKES = [".25/.50", ".50/1", "1/2", "1/3", "2/5", "3/6", "5/10", "10/20", "10/25", "25/50"];

  var _sessions = useState([]);
  var sessions = _sessions[0]; var setSessions = _sessions[1];

  useEffect(function() {
    if (!user || !supabase) return;
    supabase.from("bankroll_sessions").select("*").eq("user_id", user.id).order("date", { ascending: false })
      .then(function(res) { if (res.data) setSessions(res.data); });
  }, [user && user.id]);

  /* Game/stakes - remember last used */
  var _game = useState("NLH"); var game = _game[0]; var setGame = _game[1];
  var _stakes = useState("1/2"); var stakes = _stakes[0]; var setStakes = _stakes[1];

  /* Session state machine: idle -> active -> logging */
  var _phase = useState("idle"); var phase = _phase[0]; var setPhase = _phase[1];
  var _buyin = useState(""); var buyin = _buyin[0]; var setBuyin = _buyin[1];
  var _cashout = useState(""); var cashout = _cashout[0]; var setCashout = _cashout[1];
  var _timerStart = useState(null); var timerStart = _timerStart[0]; var setTimerStart = _timerStart[1];
  var _elapsed = useState(0); var elapsed = _elapsed[0]; var setElapsed = _elapsed[1];
  var _notes = useState(""); var notes = _notes[0]; var setNotes = _notes[1];

  /* Filter */
  var _filter = useState("all"); var filter = _filter[0]; var setFilter = _filter[1];

  useEffect(function() {
    if (!timerStart) return;
    var iv = setInterval(function() { setElapsed(Date.now() - timerStart); }, 1000);
    return function() { clearInterval(iv); };
  }, [timerStart]);

  var fmtTime = function(ms) {
    var s = Math.floor(ms / 1000);
    var h = Math.floor(s / 3600); var m = Math.floor((s % 3600) / 60);
    return (h > 0 ? h + "h " : "") + m + "m";
  };

  var startSession = function() {
    if (!buyin || isNaN(parseFloat(buyin))) return;
    setTimerStart(Date.now()); setElapsed(0); setPhase("active");
  };

  var stopSession = function() {
    setPhase("logging");
  };

  var saveSession = function() {
    var bi = parseFloat(buyin); var co = parseFloat(cashout);
    if (isNaN(bi) || isNaN(co)) return;
    var hrs = +(elapsed / 3600000).toFixed(1);
    var row = {
      user_id: user && user.id, date: new Date().toISOString().slice(0, 10),
      game: game, stakes: stakes, buyin: bi, cashout: co, hours: hrs, notes: notes,
    };
    setBuyin(""); setCashout(""); setNotes(""); setTimerStart(null); setElapsed(0); setPhase("idle");
    if (supabase && user) {
      supabase.from("bankroll_sessions").insert(row).select().single()
        .then(function(res) { if (res.data) setSessions(function(prev) { return [res.data].concat(prev); }); });
    }
  };

  var cancelSession = function() {
    setBuyin(""); setCashout(""); setNotes(""); setTimerStart(null); setElapsed(0); setPhase("idle");
  };

  /* Quick log without timer */
  var quickSave = function() {
    var bi = parseFloat(buyin); var co = parseFloat(cashout);
    if (isNaN(bi) || isNaN(co)) return;
    var row = {
      user_id: user && user.id, date: new Date().toISOString().slice(0, 10),
      game: game, stakes: stakes, buyin: bi, cashout: co, hours: 0, notes: notes,
    };
    setBuyin(""); setCashout(""); setNotes(""); setPhase("idle");
    if (supabase && user) {
      supabase.from("bankroll_sessions").insert(row).select().single()
        .then(function(res) { if (res.data) setSessions(function(prev) { return [res.data].concat(prev); }); });
    }
  };

  var deleteSession = function(id) {
    setSessions(function(prev) { return prev.filter(function(s) { return s.id !== id; }); });
    if (supabase) supabase.from("bankroll_sessions").delete().eq("id", id).then(function() {});
  };

  var previewProfit = (parseFloat(cashout) || 0) - (parseFloat(buyin) || 0);

  /* Filtered sessions */
  var filtered = filter === "all" ? sessions : sessions.filter(function(s) {
    if (filter === "NLH" || filter === "PLO" || filter === "PLO5" || filter === "Mixed") return s.game === filter;
    return s.stakes === filter;
  });

  /* Stats on filtered */
  var totalProfit = filtered.reduce(function(a, s) { return a + (s.cashout - s.buyin); }, 0);
  var totalHours = filtered.reduce(function(a, s) { return a + s.hours; }, 0);
  var hourly = totalHours > 0 ? (totalProfit / totalHours).toFixed(2) : "0.00";
  var wins = filtered.filter(function(s) { return s.cashout > s.buyin; }).length;
  var winRate = filtered.length > 0 ? Math.round(wins / filtered.length * 100) : 0;
  var bigWin = filtered.length > 0 ? filtered.reduce(function(a, s) { return Math.max(a, s.cashout - s.buyin); }, -Infinity) : 0;
  var bigLoss = filtered.length > 0 ? filtered.reduce(function(a, s) { return Math.min(a, s.cashout - s.buyin); }, Infinity) : 0;

  var chartData = useMemo(function() {
    var reversed = filtered.slice().reverse();
    var running = 0;
    return reversed.map(function(s, i) {
      running += (s.cashout - s.buyin);
      return { i: i, date: s.date, total: running, profit: s.cashout - s.buyin };
    });
  }, [filtered]);

  var maxY = Math.max.apply(null, chartData.map(function(d) { return Math.abs(d.total); }).concat([100]));
  var chartH = 140;

  var selectStyle = { fontFamily: "var(--m)", fontSize: 12, fontWeight: 700, color: C.txb, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px", outline: "none", cursor: "pointer", appearance: "none", WebkitAppearance: "none" };
  var bigInputStyle = { width: "100%", fontFamily: "var(--m)", fontSize: 22, fontWeight: 700, color: C.txb, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px 14px 32px", outline: "none", textAlign: "center" };

  return (
    <div>
      {/* Header with live indicator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 300, color: C.txb, letterSpacing: "-0.02em" }}>Bankroll</span>
          {phase === "active" && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(76,175,125,0.1)", border: "1px solid rgba(76,175,125,0.2)", borderRadius: 16, padding: "4px 12px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: "0 0 6px " + C.green }} />
              <span style={{ fontFamily: "var(--m)", fontSize: 12, fontWeight: 700, color: C.green }}>{fmtTime(elapsed)}</span>
            </div>
          )}
        </div>
        {phase !== "idle" && (
          <button onClick={cancelSession} style={{ fontFamily: "var(--m)", fontSize: 10, color: C.red, background: "none", border: "1px solid " + C.red + "25", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>Cancel</button>
        )}
      </div>

      {/* === PHASE: IDLE — pick game/stakes, enter buy-in, start === */}
      {phase === "idle" && (
        <Glass style={{ padding: 18, marginBottom: 14 }}>
          {/* Game + Stakes dropdowns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 4 }}>GAME</div>
              <div style={{ position: "relative" }}>
                <select value={game} onChange={function(e) { setGame(e.target.value); }} style={Object.assign({}, selectStyle, { width: "100%" })}>
                  {GAMES.map(function(g) { return <option key={g} value={g}>{g}</option>; })}
                </select>
                <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: C.txm }}>&#9662;</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 4 }}>STAKES</div>
              <div style={{ position: "relative" }}>
                <select value={stakes} onChange={function(e) { setStakes(e.target.value); }} style={Object.assign({}, selectStyle, { width: "100%" })}>
                  {STAKES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                </select>
                <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: C.txm }}>&#9662;</div>
              </div>
            </div>
          </div>

          {/* Buy-in */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 4, textAlign: "center" }}>BUY-IN</div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 22, fontWeight: 700, color: C.txm, fontFamily: "var(--m)" }}>$</span>
              <input value={buyin} onChange={function(e) { setBuyin(e.target.value); }}
                type="number" placeholder="200"
                style={bigInputStyle} />
            </div>
          </div>

          {/* Two actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button onClick={startSession} style={{
              fontFamily: "var(--f)", fontSize: 14, fontWeight: 700, color: "#000",
              background: "linear-gradient(135deg, " + C.gold + ", " + C.goldL + ")",
              border: "none", borderRadius: 10, padding: "14px", cursor: "pointer",
              boxShadow: "0 2px 12px rgba(212,167,44,0.2)",
              opacity: buyin ? 1 : 0.4,
            }}>Start Session</button>
            <button onClick={function() { if (buyin) setPhase("logging"); }} style={{
              fontFamily: "var(--f)", fontSize: 14, fontWeight: 600, color: C.txm,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px", cursor: "pointer",
              opacity: buyin ? 1 : 0.4,
            }}>Quick Log</button>
          </div>
        </Glass>
      )}

      {/* === PHASE: ACTIVE — timer running, waiting to stop === */}
      {phase === "active" && (
        <Glass style={{ padding: 20, marginBottom: 14, borderColor: "rgba(76,175,125,0.15)" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontFamily: "var(--m)", color: C.txm, letterSpacing: "0.08em", marginBottom: 6 }}>{game} {stakes}</div>
            <div style={{ fontFamily: "var(--m)", fontSize: 48, fontWeight: 800, color: C.txb, letterSpacing: "-0.02em" }}>{fmtTime(elapsed)}</div>
            <div style={{ fontSize: 12, color: C.txm, marginTop: 4 }}>Buy-in: <span style={{ fontFamily: "var(--m)", color: C.txb, fontWeight: 700 }}>${buyin}</span></div>
          </div>
          <button onClick={stopSession} style={{
            width: "100%", fontFamily: "var(--f)", fontSize: 15, fontWeight: 700, color: "#fff",
            background: "linear-gradient(135deg, #c04040, #943030)",
            border: "none", borderRadius: 10, padding: "16px", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(192,64,64,0.2)",
          }}>End Session</button>
        </Glass>
      )}

      {/* === PHASE: LOGGING — enter cashout, save === */}
      {phase === "logging" && (
        <Glass style={{ padding: 18, marginBottom: 14, animation: "fu 0.15s both" }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontFamily: "var(--m)", color: C.txm, letterSpacing: "0.08em" }}>{game} {stakes}{elapsed > 0 ? " \u00B7 " + fmtTime(elapsed) : ""}</div>
            <div style={{ fontSize: 12, color: C.txm, marginTop: 2 }}>Buy-in: <span style={{ fontFamily: "var(--m)", color: C.txb, fontWeight: 700 }}>${buyin}</span></div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 4, textAlign: "center" }}>CASHOUT</div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 22, fontWeight: 700, color: C.txm, fontFamily: "var(--m)" }}>$</span>
              <input value={cashout} onChange={function(e) { setCashout(e.target.value); }}
                type="number" placeholder="487" autoFocus
                style={bigInputStyle} />
            </div>
          </div>

          {/* Live profit */}
          {cashout && (
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <span style={{
                fontFamily: "var(--m)", fontSize: 28, fontWeight: 800,
                color: previewProfit >= 0 ? C.green : C.red,
              }}>{previewProfit >= 0 ? "+" : ""}{previewProfit}</span>
            </div>
          )}

          {/* Optional notes — just a small text link */}
          <input value={notes} onChange={function(e) { setNotes(e.target.value); }}
            placeholder="Notes (optional)"
            style={{ width: "100%", fontFamily: "var(--m)", fontSize: 11, color: C.txb, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 6, padding: "8px 10px", outline: "none", marginBottom: 12 }} />

          <button onClick={timerStart ? saveSession : quickSave} style={{
            width: "100%", fontFamily: "var(--f)", fontSize: 14, fontWeight: 700, color: "#000",
            background: "linear-gradient(135deg, " + C.gold + ", " + C.goldL + ")",
            border: "none", borderRadius: 10, padding: "14px", cursor: "pointer",
            boxShadow: "0 2px 12px rgba(212,167,44,0.2)",
            opacity: cashout ? 1 : 0.4,
          }}>Save Session</button>
        </Glass>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
        {[
          { label: "TOTAL P/L", value: (totalProfit >= 0 ? "+$" : "-$") + Math.abs(totalProfit).toLocaleString(), color: totalProfit >= 0 ? C.green : C.red },
          { label: "$/HOUR", value: (hourly >= 0 ? "+$" : "-$") + Math.abs(hourly), color: hourly >= 0 ? C.green : C.red },
          { label: "WIN RATE", value: winRate + "%", color: winRate >= 60 ? C.green : winRate >= 40 ? C.amber : C.red },
        ].map(function(s) {
          return (
            <div key={s.label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", color: C.txm, fontFamily: "var(--m)", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "var(--m)" }}>{s.value}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
        {[
          { label: "SESSIONS", value: filtered.length, color: C.txb },
          { label: "HOURS", value: totalHours.toFixed(1), color: C.txb },
          { label: "BEST", value: "+$" + (bigWin > 0 ? bigWin : 0), color: C.green },
          { label: "WORST", value: (bigLoss < 0 ? "-$" : "+$") + Math.abs(bigLoss || 0), color: bigLoss < 0 ? C.red : C.txb },
        ].map(function(s) {
          return (
            <div key={s.label} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.12em", color: C.txm, fontFamily: "var(--m)", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: "var(--m)" }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 3, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
        {["all"].concat(GAMES).concat(STAKES).map(function(f) {
          var active = filter === f;
          var hasData = f === "all" || sessions.some(function(s) { return s.game === f || s.stakes === f; });
          if (!hasData && f !== "all") return null;
          return (
            <button key={f} onClick={function() { setFilter(f); }} style={{
              fontFamily: "var(--m)", fontSize: 9, fontWeight: active ? 700 : 400,
              color: active ? C.txb : C.txm,
              background: active ? "rgba(255,255,255,0.06)" : "transparent",
              border: "1px solid " + (active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)"),
              borderRadius: 5, padding: "4px 8px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}>{f === "all" ? "All" : f}</button>
          );
        })}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <Glass style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 10 }}>RUNNING PROFIT{filter !== "all" ? " (" + filter + ")" : ""}</div>
          <div style={{ position: "relative", height: chartH }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.06)" }} />
            <svg width="100%" height={chartH} viewBox={"0 0 " + (chartData.length * 50) + " " + chartH} preserveAspectRatio="none" style={{ overflow: "visible" }}>
              <path d={
                chartData.map(function(d, i) {
                  var x = chartData.length === 1 ? 25 : (i / (chartData.length - 1)) * (chartData.length * 50 - 10) + 5;
                  var y = chartH / 2 - (d.total / maxY) * (chartH / 2 - 8);
                  return (i === 0 ? "M" : "L") + x + " " + y;
                }).join(" ") + " L" + ((chartData.length - 1) / (chartData.length - 1) * (chartData.length * 50 - 10) + 5) + " " + chartH / 2 + " L5 " + chartH / 2 + " Z"
              } fill={totalProfit >= 0 ? "rgba(76,175,125,0.08)" : "rgba(212,85,85,0.08)"} />
              <path d={
                chartData.map(function(d, i) {
                  var x = chartData.length === 1 ? 25 : (i / (chartData.length - 1)) * (chartData.length * 50 - 10) + 5;
                  var y = chartH / 2 - (d.total / maxY) * (chartH / 2 - 8);
                  return (i === 0 ? "M" : "L") + x + " " + y;
                }).join(" ")
              } fill="none" stroke={totalProfit >= 0 ? C.green : C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {chartData.map(function(d, i) {
                var x = chartData.length === 1 ? 25 : (i / (chartData.length - 1)) * (chartData.length * 50 - 10) + 5;
                var y = chartH / 2 - (d.total / maxY) * (chartH / 2 - 8);
                return <circle key={i} cx={x} cy={y} r="3" fill={d.profit >= 0 ? C.green : C.red} stroke={C.bg} strokeWidth="1.5" />;
              })}
            </svg>
            <div style={{ position: "absolute", top: 2, right: 0, fontSize: 9, fontFamily: "var(--m)", color: C.green, opacity: 0.5 }}>+${maxY}</div>
            <div style={{ position: "absolute", bottom: 2, right: 0, fontSize: 9, fontFamily: "var(--m)", color: C.red, opacity: 0.5 }}>-${maxY}</div>
          </div>
        </Glass>
      )}

      {/* Sessions */}
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 8 }}>SESSIONS ({filtered.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.length === 0 && <Glass style={{ textAlign: "center", padding: 40 }}><p style={{ color: C.txm, fontSize: 14 }}>No sessions{filter !== "all" ? " for " + filter : ""}. Start one above.</p></Glass>}
        {filtered.map(function(s) {
          var profit = s.cashout - s.buyin;
          var isWin = profit >= 0;
          return (
            <Glass key={s.id} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                background: isWin ? "rgba(76,175,125,0.08)" : "rgba(212,85,85,0.08)",
                border: "1px solid " + (isWin ? "rgba(76,175,125,0.15)" : "rgba(212,85,85,0.15)"),
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: "var(--m)", fontSize: 13, fontWeight: 700, color: isWin ? C.green : C.red }}>
                  {isWin ? "+" : ""}{profit}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.txb }}>{s.game}</span>
                  <span style={{ fontSize: 10, fontFamily: "var(--m)", color: C.txm }}>{s.stakes}</span>
                  <span style={{ fontSize: 10, fontFamily: "var(--m)", color: C.txm, opacity: 0.5 }}>{s.date}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: "var(--m)", color: C.txm }}>In: ${s.buyin}</span>
                  <span style={{ fontSize: 10, fontFamily: "var(--m)", color: C.txm }}>Out: ${s.cashout}</span>
                  {s.hours > 0 && <span style={{ fontSize: 10, fontFamily: "var(--m)", color: C.txm }}>{s.hours}h</span>}
                </div>
                {s.notes && <div style={{ fontSize: 10, color: C.txm, marginTop: 3, opacity: 0.6, fontStyle: "italic" }}>{s.notes}</div>}
              </div>
              <button onClick={function() { deleteSession(s.id); }} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.2, padding: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.txm} strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

/* ── EQUITY CALCULATOR ── */
function EquityPage() {
  var ALL_RANKS = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];
  var ALL_SUITS = ["s","h","d","c"];
  var SUIT_SYM = { s: "\u2660", h: "\u2665", d: "\u2666", c: "\u2663" };
  var SUIT_CLR = { s: "#7a7888", h: "#d45555", d: "#5b8def", c: "#4caf7d" };

  var _hero = useState(["",""]); var hero = _hero[0]; var setHero = _hero[1];
  var _villain = useState(["",""]); var villain = _villain[0]; var setVillain = _villain[1];
  var _board = useState(["","","","",""]); var board = _board[0]; var setBoard = _board[1];
  var _picking = useState(null); var picking = _picking[0]; var setPicking = _picking[1]; // { target: "hero"|"villain"|"board", idx: 0 }
  var _result = useState(null); var result = _result[0]; var setResult = _result[1];
  var _running = useState(false); var running = _running[0]; var setRunning = _running[1];
  var _sims = useState(50000); var sims = _sims[0]; var setSims = _sims[1];

  /* All used cards */
  var usedCards = new Set();
  hero.forEach(function(c) { if (c) usedCards.add(c); });
  villain.forEach(function(c) { if (c) usedCards.add(c); });
  board.forEach(function(c) { if (c) usedCards.add(c); });

  /* Card picker */
  function pickCard(card) {
    if (!picking) return;
    if (picking.target === "hero") {
      setHero(function(h) { var n = h.slice(); n[picking.idx] = card; return n; });
    } else if (picking.target === "villain") {
      setVillain(function(v) { var n = v.slice(); n[picking.idx] = card; return n; });
    } else if (picking.target === "board") {
      setBoard(function(b) { var n = b.slice(); n[picking.idx] = card; return n; });
    }
    /* Auto-advance to next empty slot */
    if (picking.target === "hero" && picking.idx === 0 && !hero[1]) {
      setPicking({ target: "hero", idx: 1 });
    } else if (picking.target === "villain" && picking.idx === 0 && !villain[1]) {
      setPicking({ target: "villain", idx: 1 });
    } else if (picking.target === "board" && picking.idx < 4) {
      setPicking({ target: "board", idx: picking.idx + 1 });
    } else {
      setPicking(null);
    }
  }

  function clearSlot(target, idx) {
    if (target === "hero") setHero(function(h) { var n = h.slice(); n[idx] = ""; return n; });
    else if (target === "villain") setVillain(function(v) { var n = v.slice(); n[idx] = ""; return n; });
    else if (target === "board") setBoard(function(b) { var n = b.slice(); n[idx] = ""; return n; });
    setResult(null);
  }

  /* ── Hand evaluator (7-card best 5) ── */
  function rankVal(r) { return "23456789TJQKA".indexOf(r); }

  function evaluate5(cards) {
    /* cards: array of {r, s} where r is rank char, s is suit char */
    var rs = cards.map(function(c) { return rankVal(c.r); }).sort(function(a, b) { return b - a; });
    var flush = cards.every(function(c) { return c.s === cards[0].s; });
    var straight = false;
    var straightHigh = -1;
    for (var i = 0; i <= 0; i++) {
      if (rs[0] - rs[4] === 4 && new Set(rs).size === 5) { straight = true; straightHigh = rs[0]; }
    }
    /* Ace-low straight: A-2-3-4-5 */
    if (!straight && rs[0] === 12 && rs[1] === 3 && rs[2] === 2 && rs[3] === 1 && rs[4] === 0) {
      straight = true; straightHigh = 3;
    }
    /* Count ranks */
    var counts = {};
    rs.forEach(function(r) { counts[r] = (counts[r] || 0) + 1; });
    var groups = Object.keys(counts).map(function(k) { return { rank: parseInt(k), count: counts[k] }; });
    groups.sort(function(a, b) { return b.count - a.count || b.rank - a.rank; });

    var cat, kickers;
    if (flush && straight) { cat = 8; kickers = [straightHigh]; }
    else if (groups[0].count === 4) { cat = 7; kickers = [groups[0].rank, groups[1].rank]; }
    else if (groups[0].count === 3 && groups[1].count === 2) { cat = 6; kickers = [groups[0].rank, groups[1].rank]; }
    else if (flush) { cat = 5; kickers = rs; }
    else if (straight) { cat = 4; kickers = [straightHigh]; }
    else if (groups[0].count === 3) { cat = 3; kickers = [groups[0].rank].concat(groups.slice(1).map(function(g) { return g.rank; })); }
    else if (groups[0].count === 2 && groups[1].count === 2) { cat = 2; kickers = [Math.max(groups[0].rank, groups[1].rank), Math.min(groups[0].rank, groups[1].rank), groups[2].rank]; }
    else if (groups[0].count === 2) { cat = 1; kickers = [groups[0].rank].concat(groups.slice(1).map(function(g) { return g.rank; })); }
    else { cat = 0; kickers = rs; }

    /* Encode as comparable number */
    var score = cat * 1e10;
    for (var k = 0; k < kickers.length; k++) {
      score += kickers[k] * Math.pow(15, 4 - k);
    }
    return score;
  }

  function bestOf7(sevenCards) {
    var best = -1;
    /* Choose 5 from 7 = 21 combos */
    for (var i = 0; i < 7; i++) {
      for (var j = i + 1; j < 7; j++) {
        var five = sevenCards.filter(function(_, idx) { return idx !== i && idx !== j; });
        var score = evaluate5(five);
        if (score > best) best = score;
      }
    }
    return best;
  }

  function parseCard(str) {
    if (!str || str.length < 2) return null;
    return { r: str[0], s: str[1] };
  }

  /* ── Monte Carlo sim ── */
  function runSim() {
    if (!hero[0] || !hero[1] || !villain[0] || !villain[1]) return;
    setRunning(true);
    setResult(null);

    setTimeout(function() {
      var hCards = hero.map(parseCard);
      var vCards = villain.map(parseCard);
      var bCards = board.filter(function(c) { return c; }).map(parseCard);
      var known = new Set();
      hCards.concat(vCards).concat(bCards).forEach(function(c) { known.add(c.r + c.s); });

      /* Build remaining deck */
      var deck = [];
      ALL_RANKS.forEach(function(r) {
        ALL_SUITS.forEach(function(s) {
          if (!known.has(r + s)) deck.push({ r: r, s: s });
        });
      });

      var heroWins = 0, villainWins = 0, ties = 0;
      var boardNeeded = 5 - bCards.length;
      var n = sims;

      for (var sim = 0; sim < n; sim++) {
        /* Shuffle deck (Fisher-Yates partial) */
        var d = deck.slice();
        for (var i = d.length - 1; i > d.length - 1 - boardNeeded && i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = d[i]; d[i] = d[j]; d[j] = tmp;
        }
        var runout = bCards.concat(d.slice(d.length - boardNeeded));
        var hScore = bestOf7(hCards.concat(runout));
        var vScore = bestOf7(vCards.concat(runout));
        if (hScore > vScore) heroWins++;
        else if (vScore > hScore) villainWins++;
        else ties++;
      }

      setResult({
        hero: (heroWins / n * 100).toFixed(1),
        villain: (villainWins / n * 100).toFixed(1),
        tie: (ties / n * 100).toFixed(1),
        sims: n,
      });
      setRunning(false);
    }, 50);
  }

  function reset() {
    setHero(["",""]); setVillain(["",""]); setBoard(["","","","",""]); setResult(null); setPicking(null);
  }

  /* Card slot renderer */
  function renderSlot(card, target, idx) {
    var isActive = picking && picking.target === target && picking.idx === idx;
    if (card) {
      var r = card[0], s = card[1];
      return (
        <div onClick={function() { clearSlot(target, idx); }} style={{
          width: 56, height: 78, borderRadius: 10, background: "#1a1c2a",
          border: "2px solid " + SUIT_CLR[s] + "40", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative",
          transition: "all 0.15s", boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: SUIT_CLR[s], fontFamily: "var(--m)", lineHeight: 1 }}>{r}</span>
          <span style={{ fontSize: 18, color: SUIT_CLR[s], lineHeight: 1, marginTop: 2 }}>{SUIT_SYM[s]}</span>
          <div style={{ position: "absolute", top: 3, right: 5, fontSize: 9, color: "rgba(255,255,255,0.25)" }}>×</div>
        </div>
      );
    }
    return (
      <div onClick={function() { setPicking({ target: target, idx: idx }); }} style={{
        width: 56, height: 78, borderRadius: 10,
        border: isActive ? "2px solid " + C.gold : "2px dashed rgba(255,255,255,0.1)",
        background: isActive ? "rgba(212,167,44,0.06)" : "rgba(255,255,255,0.015)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.15s",
      }}>
        <span style={{ fontSize: 22, color: isActive ? C.gold : "rgba(255,255,255,0.12)" }}>+</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 18 }}>
        <span style={{ fontSize: 24, fontWeight: 300, color: C.txb, letterSpacing: "-0.03em" }}>Equity</span>
        <span style={{ fontSize: 14, color: C.txm }}>Calculator</span>
      </div>

      {/* Hero vs Villain slots */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, marginBottom: 18, alignItems: "center" }}>
        {/* Hero */}
        <Glass style={{ padding: 18 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.green, fontFamily: "var(--m)", marginBottom: 10 }}>HERO</div>
          <div style={{ display: "flex", gap: 6 }}>
            {hero.map(function(c, i) { return <div key={"h" + i}>{renderSlot(c, "hero", i)}</div>; })}
          </div>
          {result && <div style={{ fontFamily: "var(--m)", fontSize: 28, fontWeight: 800, color: C.green, marginTop: 12 }}>{result.hero}%</div>}
        </Glass>

        <div style={{ fontSize: 14, fontWeight: 700, color: C.txm, fontFamily: "var(--m)" }}>vs</div>

        {/* Villain */}
        <Glass style={{ padding: 18 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.red, fontFamily: "var(--m)", marginBottom: 10 }}>VILLAIN</div>
          <div style={{ display: "flex", gap: 6 }}>
            {villain.map(function(c, i) { return <div key={"v" + i}>{renderSlot(c, "villain", i)}</div>; })}
          </div>
          {result && <div style={{ fontFamily: "var(--m)", fontSize: 28, fontWeight: 800, color: C.red, marginTop: 12 }}>{result.villain}%</div>}
        </Glass>
      </div>

      {/* Equity bar */}
      {result && (
        <Glass style={{ padding: 14, marginBottom: 18 }}>
          <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: result.hero + "%", background: C.green, transition: "width 0.5s" }} />
            <div style={{ width: result.tie + "%", background: C.txm, transition: "width 0.5s" }} />
            <div style={{ width: result.villain + "%", background: C.red, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontFamily: "var(--m)", fontSize: 10, color: C.green }}>Win {result.hero}%</span>
            <span style={{ fontFamily: "var(--m)", fontSize: 10, color: C.txm }}>Tie {result.tie}%</span>
            <span style={{ fontFamily: "var(--m)", fontSize: 10, color: C.red }}>Lose {result.villain}%</span>
          </div>
          <div style={{ fontFamily: "var(--m)", fontSize: 9, color: C.txm, textAlign: "center", marginTop: 6, opacity: 0.5 }}>{result.sims.toLocaleString()} simulations</div>
        </Glass>
      )}

      {/* Board */}
      <Glass style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.txm, fontFamily: "var(--m)", marginBottom: 10 }}>BOARD</div>
        <div style={{ display: "flex", gap: 6 }}>
          {board.map(function(c, i) { return <div key={"b" + i}>{renderSlot(c, "board", i)}</div>; })}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <span style={{ fontSize: 10, color: C.txm, fontFamily: "var(--m)" }}>
            {board.filter(function(c) { return c; }).length === 0 ? "Preflop" :
             board.filter(function(c) { return c; }).length === 3 ? "Flop" :
             board.filter(function(c) { return c; }).length === 4 ? "Turn" :
             board.filter(function(c) { return c; }).length === 5 ? "River" : board.filter(function(c) { return c; }).length + " cards"}
          </span>
        </div>
      </Glass>

      {/* Card picker */}
      {picking && (
        <Glass style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.gold, fontFamily: "var(--m)", marginBottom: 14 }}>
            SELECT CARD — {picking.target.toUpperCase()} {picking.target === "board" ? ["Flop 1","Flop 2","Flop 3","Turn","River"][picking.idx] : picking.idx === 0 ? "Card 1" : "Card 2"}
          </div>
          {/* Rank headers */}
          <div style={{ display: "grid", gridTemplateColumns: "32px repeat(13, 1fr)", gap: 4, marginBottom: 4 }}>
            <div />
            {ALL_RANKS.map(function(r) {
              return <div key={r} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: C.txm, fontFamily: "var(--m)" }}>{r}</div>;
            })}
          </div>
          {/* Suit rows */}
          {ALL_SUITS.map(function(suit) {
            return (
              <div key={suit} style={{ display: "grid", gridTemplateColumns: "32px repeat(13, 1fr)", gap: 4, marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: SUIT_CLR[suit] }}>{SUIT_SYM[suit]}</div>
                {ALL_RANKS.map(function(rank) {
                  var card = rank + suit;
                  var used = usedCards.has(card);
                  return (
                    <div key={card} onClick={function() { if (!used) pickCard(card); }} style={{
                      height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 6, cursor: used ? "default" : "pointer",
                      background: used ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.04)",
                      border: used ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                      opacity: used ? 0.15 : 1,
                      transition: "all 0.12s",
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: SUIT_CLR[suit], fontFamily: "var(--m)" }}>{rank}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <button onClick={function() { setPicking(null); }} style={{
            fontFamily: "var(--m)", fontSize: 10, fontWeight: 600, color: C.txm,
            background: "transparent", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 6, padding: "6px 14px", cursor: "pointer", marginTop: 8,
          }}>Cancel</button>
        </Glass>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <GoldBtn onClick={runSim} disabled={running || !hero[0] || !hero[1] || !villain[0] || !villain[1]}>
          {running ? "Calculating..." : "Calculate Equity"}
        </GoldBtn>
        <button onClick={reset} style={{
          fontFamily: "var(--m)", fontSize: 12, fontWeight: 600, color: C.txm,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8, padding: "10px 18px", cursor: "pointer",
        }}>Reset</button>
      </div>
    </div>
  );
}

function HandsPage(props) {
  var history = props.history;
  var onView = props.onView;
  if (!history.length) return <Glass style={{ textAlign: "center", padding: 48 }}><p style={{ color: C.txm, fontSize: 16 }}>No hands analyzed yet. Upload a screenshot to start.</p></Glass>;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 22, fontWeight: 300, color: C.txb, letterSpacing: "-0.02em" }}>Hand History</span>
        <span style={{ fontSize: 12, fontFamily: "var(--m)", color: C.txm }}>{history.length} hand{history.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {history.map(function(h, i) {
          var grade = h.overall && h.overall.grade ? h.overall.grade : "?";
          var gradeColor = grade[0] === "A" ? C.green : grade[0] === "B" ? C.blue : C.amber;
          var cards = parseCards(h.hero_cards);
          return (
            <Glass key={i} onClick={function() { if (onView) onView(h); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer", transition: "all 0.15s", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", gap: 3 }}>{cards.map(function(c, j) { return <Crd key={j} r={c.r} sym={c.sym} clr={c.clr} sz={28} />; })}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.txb }}>{h.hero_position || "?"} vs {h.villain_position || "?"}</div>
                {h.streets && h.streets.length > 0 && (
                  <div style={{ fontSize: 10, fontFamily: "var(--m)", color: C.txm, marginTop: 2 }}>{h.streets.length} street{h.streets.length !== 1 ? "s" : ""} analyzed</div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontFamily: "var(--m)", fontWeight: 700, fontSize: 18, color: gradeColor }}>{grade}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.txm} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.3, flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

function ReportsPage() {
  var _q = useState(""); var q = _q[0]; var setQ = _q[1];
  var _interim = useState(""); var interim = _interim[0]; var setInterim = _interim[1];
  var _data = useState(null); var data = _data[0]; var setData = _data[1];
  var _busy = useState(false); var busy = _busy[0]; var setBusy = _busy[1];

  var handleVoice = useCallback(function(final, inter, done) {
    if (done) { setQ(function(prev) { return (prev + " " + final).trim(); }); setInterim(""); }
    else { setInterim(inter); }
  }, []);

  var run = async function() {
    if (!q.trim()) return; setBusy(true); setData(null);
    try { setData(await askAI([{ type: "text", text: "Analyze flop texture for GTO c-bet strategy:\n\n" + q }])); }
    catch (e) { /* ignore */ } finally { setBusy(false); }
  };

  return (
    <div>
      <Glass style={{ marginBottom: 16, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: C.txm, fontFamily: "var(--m)" }}>FLOP TEXTURE ANALYSIS</div>
          <VoiceMic onResult={handleVoice} />
        </div>
        <div style={{ position: "relative" }}>
          <textarea value={q} onChange={function(e) { setQ(e.target.value); }} placeholder="BTN vs BB SRP, flop Ks 7d 2c" rows={3} style={{ width: "100%", background: C.bg1, border: "1.5px solid " + C.border, borderRadius: 10, padding: 16, color: C.txb, fontSize: 15, fontFamily: "var(--f)", resize: "vertical", outline: "none" }} />
          {interim && <div style={{ position: "absolute", bottom: 12, left: 16, right: 16, fontSize: 13, color: C.gold, opacity: 0.6, fontStyle: "italic", pointerEvents: "none" }}>{interim}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
          <GoldBtn onClick={run} disabled={busy}>{busy ? "Analyzing..." : "Analyze"}</GoldBtn>
          {q && <button onClick={function() { setQ(""); }} style={{ fontFamily: "var(--f)", fontSize: 12, color: C.txm, background: "transparent", border: "none", cursor: "pointer", padding: "4px 8px" }}>Clear</button>}
        </div>
      </Glass>
      {busy && <Loader steps={["Parsing board", "Computing ranges", "Building report"]} />}
      {data && (
        <Glass style={{ padding: 24 }}>
          <p style={{ fontSize: 15, color: C.txb, lineHeight: 1.6 }}>{(data.overall && data.overall.summary) || (data.streets && data.streets[0] && data.streets[0].reasoning) || "Done."}</p>
          {data.streets && data.streets.map(function(s, i) { return <div key={i} style={{ marginTop: 14 }}><FreqBar actions={s.gto_actions} /></div>; })}
        </Glass>
      )}
    </div>
  );
}

function DrillsPage(props) {
  var onGo = props.onGo;
  var drills = [
    { n: "RFI All Positions", d: "Open-raise from every seat", t: ["UTG", "MP", "CO", "BTN", "SB"] },
    { n: "BTN vs BB", d: "Defend your big blind", t: ["BB"] },
    { n: "EP Grind", d: "Tighten up early position", t: ["UTG", "MP"] },
    { n: "Late Position", d: "CO & BTN steal practice", t: ["CO", "BTN"] },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {drills.map(function(d, i) {
        return (
          <Glass key={i} hover={true} onClick={function() { onGo("trainer"); }} style={{ padding: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: C.txb, marginBottom: 4 }}>{d.n}</div>
            <div style={{ fontSize: 14, color: C.txm, marginBottom: 12 }}>{d.d}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {d.t.map(function(tag) { return <span key={tag} style={{ fontSize: 11, fontWeight: 700, color: C.gold, background: C.gold + "15", borderRadius: 5, padding: "4px 9px", fontFamily: "var(--m)" }}>{tag}</span>; })}
            </div>
          </Glass>
        );
      })}
    </div>
  );
}

function HelpPage() {
  var items = [
    ["Study", "Browse GTO opening ranges by position. The 13\u00D713 matrix shows every hand combo color-coded."],
    ["Trainer", "Random hands dealt \u2014 decide raise or fold against GTO ranges with instant scoring."],
    ["Uploads", "Upload a screenshot from any client. AI analyzes every street with verdicts and EV loss."],
    ["Custom Solutions", "Describe any spot in text. AI returns the GTO frequencies and detailed reasoning."],
    ["Verdicts", "\u2713\u2713 Best Play \u00B7 \u2713 Good \u00B7 ?! Inaccuracy \u00B7 \u2717 Mistake \u00B7 \u2717\u2717 Blunder"],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map(function(item, i) {
        return (
          <Glass key={i} style={{ padding: 22 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: C.txb, marginBottom: 4 }}>{item[0]}</div>
            <p style={{ fontSize: 15, color: C.txm, lineHeight: 1.6 }}>{item[1]}</p>
          </Glass>
        );
      })}
    </div>
  );
}

/* MAIN APP */
/* MAIN APP */
var landingCss = "\
.ss-landing { --bg: #07080c; --bg1: #0c0d14; --bg2: #11131c; --gold: #d4a72c; --goldL: #e8c34a; --goldD: #b8922a; --raise: #4caf7d; --threebet: #e8c34a; --call: #5b8def; --fold: #d45555; --tx: #b8b4aa; --txb: #eae6dd; --txm: #5a576a; --txd: #2a2935; --f: 'DM Sans', system-ui, sans-serif; --m: 'JetBrains Mono', 'SF Mono', monospace; --border: rgba(255,255,255,0.05); --borderH: rgba(212,167,44,0.18); --glass: rgba(255,255,255,0.018); }\
.ss-landing, .ss-landing *, .ss-landing *::before, .ss-landing *::after { margin: 0; padding: 0; box-sizing: border-box; }\
.ss-landing ::selection { background: var(--gold); color: var(--bg); }\
.ss-landing .atmos { position: fixed; inset: 0; pointer-events: none; z-index: 0; background: radial-gradient(ellipse 800px 500px at 15% 10%, rgba(212,167,44,0.06), transparent 60%), radial-gradient(ellipse 700px 400px at 85% 80%, rgba(91,141,239,0.04), transparent 60%), radial-gradient(ellipse 500px 300px at 50% 50%, rgba(76,175,125,0.025), transparent 70%); }\
.ss-landing .grain { position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.025; background-image: url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\"); }\
@keyframes ssFadeUp { from { opacity:0; transform: translateY(28px) } to { opacity:1; transform: none } }\
@keyframes ssPulseGold { 0%,100% { box-shadow: 0 0 0 0 rgba(212,167,44,0.4) } 50% { box-shadow: 0 0 0 14px rgba(212,167,44,0) } }\
@keyframes ssBlink { 0%,49% { opacity:1 } 50%,100% { opacity:0 } }\
@keyframes ssFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }\
.ss-landing .fu  { animation: ssFadeUp .9s ease both; }\
.ss-landing .fu1 { animation: ssFadeUp .9s .08s ease both; }\
.ss-landing .fu2 { animation: ssFadeUp .9s .16s ease both; }\
.ss-landing .fu3 { animation: ssFadeUp .9s .24s ease both; }\
.ss-landing .fu4 { animation: ssFadeUp .9s .32s ease both; }\
.ss-landing .fu5 { animation: ssFadeUp .9s .40s ease both; }\
.ss-landing nav { position: fixed; top:0; left:0; right:0; z-index:50; background: rgba(7,8,12,0.78); backdrop-filter: blur(18px) saturate(140%); -webkit-backdrop-filter: blur(18px) saturate(140%); border-bottom: 1px solid var(--border); }\
.ss-landing .nav-inner { max-width: 1280px; margin: 0 auto; padding: 14px 32px; display: flex; align-items: center; justify-content: space-between; }\
.ss-landing .logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 18px; color: var(--txb); letter-spacing: -0.01em; }\
.ss-landing .logo-mark { width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg, var(--gold), var(--goldD)); display: grid; place-items: center; font-family: var(--m); font-weight: 800; color: var(--bg); font-size: 14px; box-shadow: 0 4px 14px rgba(212,167,44,0.25), inset 0 1px 0 rgba(255,255,255,0.2); }\
.ss-landing .nav-links { display: flex; gap: 32px; align-items: center; }\
.ss-landing .nav-links a { color: var(--tx); text-decoration: none; font-size: 14px; font-weight: 500; transition: color .2s; }\
.ss-landing .nav-links a:hover { color: var(--txb); }\
.ss-landing .nav-cta { padding: 9px 18px; border-radius: 8px; background: var(--gold); color: var(--bg); font-weight: 700; font-size: 14px; text-decoration: none; transition: transform .2s, box-shadow .2s; }\
.ss-landing .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(212,167,44,0.3); }\
@media (max-width: 768px) { .ss-landing .nav-links { display: none; } .ss-landing .nav-cta { padding: 8px 14px; font-size: 13px; } }\
.ss-landing .hero { position: relative; padding: 140px 32px 80px; max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1.05fr 1fr; gap: 64px; align-items: center; z-index: 2; }\
@media (max-width: 980px) { .ss-landing .hero { grid-template-columns: 1fr; padding-top: 110px; gap: 40px; } }\
.ss-landing .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 100px; background: rgba(212,167,44,0.08); border: 1px solid var(--borderH); font-family: var(--m); font-size: 11px; font-weight: 600; color: var(--gold); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 22px; }\
.ss-landing .hero-eyebrow::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--raise); box-shadow: 0 0 8px var(--raise); }\
.ss-landing .hero h1 { font-size: clamp(40px, 6vw, 68px); line-height: 1.02; font-weight: 800; color: var(--txb); letter-spacing: -0.025em; margin-bottom: 22px; }\
.ss-landing .hero h1 em { font-style: italic; font-weight: 400; background: linear-gradient(110deg, var(--goldL) 0%, var(--gold) 50%, var(--goldD) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }\
.ss-landing .hero p.lede { font-size: 18px; line-height: 1.55; color: var(--tx); max-width: 540px; margin-bottom: 32px; }\
.ss-landing .hero-ctas { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 36px; }\
.ss-landing .btn-primary { padding: 14px 24px; border-radius: 10px; border: none; background: linear-gradient(135deg, var(--gold), var(--goldD)); color: var(--bg); font-family: var(--f); font-weight: 700; font-size: 15px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; transition: transform .2s; animation: ssPulseGold 2.4s ease-in-out infinite; }\
.ss-landing .btn-primary:hover { transform: translateY(-2px); }\
.ss-landing .btn-primary svg { width: 16px; height: 16px; }\
.ss-landing .btn-ghost { padding: 14px 22px; border-radius: 10px; background: transparent; border: 1px solid var(--border); color: var(--txb); font-family: var(--f); font-weight: 600; font-size: 15px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: border-color .2s, background .2s; }\
.ss-landing .btn-ghost:hover { border-color: var(--borderH); background: rgba(212,167,44,0.04); }\
.ss-landing .hero-sites { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-family: var(--m); font-size: 11px; color: var(--txm); letter-spacing: 0.05em; text-transform: uppercase; }\
.ss-landing .hero-sites-list { display: flex; gap: 8px; flex-wrap: wrap; }\
.ss-landing .hero-sites-list span { padding: 4px 9px; border-radius: 5px; background: var(--glass); border: 1px solid var(--border); color: var(--tx); font-weight: 600; text-transform: none; letter-spacing: 0; font-size: 12px; }\
.ss-landing .hero-preview { position: relative; border-radius: 16px; background: linear-gradient(180deg, var(--bg1), var(--bg2)); border: 1px solid var(--border); box-shadow: 0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,167,44,0.04); padding: 24px; overflow: hidden; animation: ssFloat 6s ease-in-out infinite; }\
.ss-landing .hero-preview::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, transparent 60%, rgba(212,167,44,0.04)); pointer-events: none; }\
.ss-landing .preview-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 1px solid var(--border); margin-bottom: 20px; }\
.ss-landing .preview-title { font-family: var(--m); font-size: 11px; color: var(--txm); letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; }\
.ss-landing .preview-badge { padding: 3px 8px; border-radius: 4px; font-family: var(--m); font-size: 10px; font-weight: 700; background: rgba(212,85,85,0.12); color: var(--fold); border: 1px solid rgba(212,85,85,0.2); }\
.ss-landing .hand-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }\
.ss-landing .hand-label { font-family: var(--m); font-size: 11px; color: var(--txm); width: 50px; }\
.ss-landing .hand-cards { display: flex; gap: 6px; }\
.ss-landing .card { width: 36px; height: 50px; border-radius: 4px; background: linear-gradient(180deg, #fafafa, #d8d4cb); display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: var(--m); font-weight: 800; box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(0,0,0,0.1); }\
.ss-landing .card.h, .ss-landing .card.d { color: #c0392b; }\
.ss-landing .card.s, .ss-landing .card.c { color: #1a1a1a; }\
.ss-landing .card .rank { font-size: 14px; line-height: 1; }\
.ss-landing .card .suit { font-size: 11px; line-height: 1; margin-top: 1px; }\
.ss-landing .street-row { display: grid; grid-template-columns: 60px 1fr auto; gap: 14px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }\
.ss-landing .street-row:last-child { border: none; }\
.ss-landing .street-name { font-family: var(--m); font-size: 11px; color: var(--txm); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }\
.ss-landing .street-action { font-size: 13px; color: var(--txb); font-weight: 500; }\
.ss-landing .verdict { padding: 3px 9px; border-radius: 4px; font-family: var(--m); font-size: 10px; font-weight: 700; letter-spacing: 0.04em; }\
.ss-landing .v-best { background: rgba(76,175,125,0.14); color: var(--raise); }\
.ss-landing .v-good { background: rgba(91,141,239,0.14); color: var(--call); }\
.ss-landing .v-mistake { background: rgba(212,85,85,0.14); color: var(--fold); }\
.ss-landing .preview-foot { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }\
.ss-landing .foot-label { font-family: var(--m); font-size: 10px; color: var(--txm); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }\
.ss-landing .foot-val { font-family: var(--m); font-size: 14px; color: var(--fold); font-weight: 700; }\
.ss-landing section { position: relative; z-index: 2; }\
.ss-landing .wrap { max-width: 1280px; margin: 0 auto; padding: 100px 32px; }\
.ss-landing .section-eyebrow { display: inline-block; font-family: var(--m); font-size: 11px; font-weight: 600; color: var(--gold); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; }\
.ss-landing .section-h { font-size: clamp(32px, 4.5vw, 48px); font-weight: 800; line-height: 1.05; letter-spacing: -0.02em; color: var(--txb); margin-bottom: 18px; max-width: 720px; }\
.ss-landing .section-h em { font-style: italic; font-weight: 400; color: var(--gold); }\
.ss-landing .section-d { font-size: 17px; line-height: 1.55; color: var(--tx); max-width: 600px; margin-bottom: 60px; }\
.ss-landing .r { opacity: 0; transform: translateY(28px); transition: opacity .8s, transform .8s; }\
.ss-landing .r.v { opacity: 1; transform: none; }\
.ss-landing .bento { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; }\
.ss-landing .tile { background: var(--bg1); border: 1px solid var(--border); border-radius: 14px; padding: 28px; position: relative; overflow: hidden; transition: border-color .3s, transform .3s; }\
.ss-landing .tile:hover { border-color: var(--borderH); transform: translateY(-2px); }\
.ss-landing .tile-icon { width: 36px; height: 36px; border-radius: 9px; display: grid; place-items: center; background: rgba(212,167,44,0.08); color: var(--gold); margin-bottom: 18px; }\
.ss-landing .tile-icon svg { width: 18px; height: 18px; }\
.ss-landing .tile h3 { font-size: 19px; font-weight: 700; color: var(--txb); margin-bottom: 8px; letter-spacing: -0.01em; }\
.ss-landing .tile p { font-size: 14px; line-height: 1.55; color: var(--tx); }\
.ss-landing .t-wide { grid-column: span 4; }\
.ss-landing .t-half { grid-column: span 3; }\
.ss-landing .t-third { grid-column: span 2; }\
@media (max-width: 980px) { .ss-landing .bento { grid-template-columns: repeat(2, 1fr); } .ss-landing .t-wide, .ss-landing .t-half, .ss-landing .t-third { grid-column: span 2; } }\
.ss-landing .matrix-mini { margin-top: 18px; display: grid; grid-template-columns: repeat(13, 1fr); gap: 1.5px; aspect-ratio: 1; max-width: 280px; }\
.ss-landing .matrix-mini > div { border-radius: 1.5px; aspect-ratio: 1; display: grid; place-items: center; font-family: var(--m); font-size: 7px; font-weight: 700; color: rgba(255,255,255,0.65); }\
.ss-landing .eq-row { display: flex; align-items: center; gap: 12px; margin-top: 14px; }\
.ss-landing .eq-cards { display: flex; gap: 4px; flex-shrink: 0; }\
.ss-landing .eq-cards .card { width: 26px; height: 36px; }\
.ss-landing .eq-cards .card .rank { font-size: 11px; }\
.ss-landing .eq-cards .card .suit { font-size: 8px; }\
.ss-landing .eq-bar { flex: 1; height: 8px; border-radius: 4px; background: var(--bg2); overflow: hidden; display: flex; }\
.ss-landing .eq-bar > div { height: 100%; }\
.ss-landing .eq-bar .e1 { background: var(--raise); }\
.ss-landing .eq-bar .e2 { background: var(--fold); }\
.ss-landing .eq-pct { font-family: var(--m); font-size: 11px; color: var(--txm); width: 38px; text-align: right; }\
.ss-landing .terminal { margin-top: 18px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 14px; font-family: var(--m); font-size: 11px; line-height: 1.6; }\
.ss-landing .terminal .prompt { color: var(--gold); }\
.ss-landing .terminal .out { color: var(--raise); }\
.ss-landing .terminal .dim { color: var(--txm); }\
.ss-landing .terminal .cursor { display: inline-block; width: 6px; height: 11px; background: var(--gold); animation: ssBlink 1s steps(2) infinite; vertical-align: -1px; }\
.ss-landing .compare { background: var(--bg1); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }\
.ss-landing .compare-row { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; align-items: center; }\
.ss-landing .compare-row > div { padding: 18px 24px; font-size: 14px; border-bottom: 1px solid var(--border); }\
.ss-landing .compare-row:last-child > div { border-bottom: none; }\
.ss-landing .compare-head > div { font-family: var(--m); font-size: 11px; color: var(--txm); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; background: var(--bg2); }\
.ss-landing .compare-head .me { color: var(--gold); }\
.ss-landing .compare-feat { color: var(--txb); font-weight: 500; }\
.ss-landing .compare-cell { text-align: center; }\
.ss-landing .yes { color: var(--raise); font-weight: 700; }\
.ss-landing .no  { color: var(--txd); }\
.ss-landing .compare-cell.me { background: rgba(212,167,44,0.025); }\
@media (max-width: 720px) { .ss-landing .compare-row { grid-template-columns: 1.4fr repeat(3, 1fr); } .ss-landing .compare-row > div { padding: 14px 10px; font-size: 12px; } }\
.ss-landing .trust-card { position: relative; background: linear-gradient(180deg, var(--bg1), var(--bg2)); border: 1px solid var(--borderH); border-radius: 18px; padding: 48px 44px; overflow: hidden; }\
.ss-landing .trust-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }\
.ss-landing .trust-stamp { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 100px; background: rgba(76,175,125,0.10); border: 1px solid rgba(76,175,125,0.25); color: var(--raise); font-family: var(--m); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 22px; }\
.ss-landing .trust-stamp svg { width: 14px; height: 14px; }\
.ss-landing .trust-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }\
.ss-landing .trust-item { padding: 22px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; }\
.ss-landing .trust-num { font-family: var(--m); font-size: 26px; font-weight: 800; color: var(--gold); letter-spacing: -0.02em; margin-bottom: 6px; }\
.ss-landing .trust-lbl { font-size: 13px; color: var(--tx); line-height: 1.5; }\
.ss-landing .trust-foot { font-size: 13px; color: var(--txm); line-height: 1.6; padding-top: 22px; border-top: 1px solid var(--border); }\
@media (max-width: 720px) { .ss-landing .trust-card { padding: 32px 24px; } .ss-landing .trust-grid { grid-template-columns: 1fr; } }\
.ss-landing .pricing-wrap { max-width: 460px; margin: 0 auto; background: linear-gradient(180deg, var(--bg1), var(--bg2)); border: 1px solid var(--borderH); border-radius: 18px; padding: 40px; position: relative; overflow: hidden; }\
.ss-landing .pricing-wrap::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }\
.ss-landing .price-tag { display: inline-block; font-family: var(--m); font-size: 11px; color: var(--gold); background: rgba(212,167,44,0.08); padding: 5px 11px; border-radius: 100px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700; margin-bottom: 22px; border: 1px solid var(--borderH); }\
.ss-landing .price-amt { font-size: 64px; font-weight: 800; color: var(--txb); letter-spacing: -0.03em; line-height: 1; margin-bottom: 4px; }\
.ss-landing .price-amt sub { font-size: 16px; font-weight: 500; color: var(--tx); vertical-align: baseline; }\
.ss-landing .price-sub { font-size: 14px; color: var(--tx); margin-bottom: 28px; }\
.ss-landing .price-feats { list-style: none; margin-bottom: 28px; }\
.ss-landing .price-feats li { padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 14px; color: var(--txb); display: flex; align-items: center; gap: 10px; }\
.ss-landing .price-feats li:last-child { border: none; }\
.ss-landing .price-feats li::before { content: ''; width: 14px; height: 14px; border-radius: 50%; background: rgba(76,175,125,0.15); flex-shrink: 0; background-image: url(\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 12l5 5L20 7' stroke='%234caf7d' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\"); background-size: 10px; background-position: center; background-repeat: no-repeat; }\
.ss-landing .price-cta { display: block; width: 100%; padding: 16px; background: linear-gradient(135deg, var(--gold), var(--goldD)); color: var(--bg); border: none; border-radius: 10px; font-family: var(--f); font-weight: 700; font-size: 15px; cursor: pointer; text-align: center; text-decoration: none; transition: transform .2s, box-shadow .2s; }\
.ss-landing .price-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(212,167,44,0.3); }\
.ss-landing .faq { max-width: 720px; margin: 0 auto; }\
.ss-landing .faq-item { border-bottom: 1px solid var(--border); }\
.ss-landing .faq-q { display: flex; justify-content: space-between; align-items: center; padding: 22px 0; cursor: pointer; user-select: none; font-size: 17px; font-weight: 600; color: var(--txb); letter-spacing: -0.01em; }\
.ss-landing .faq-q::after { content: '+'; font-family: var(--m); font-weight: 400; font-size: 22px; color: var(--gold); transition: transform .3s; }\
.ss-landing .faq-item.open .faq-q::after { transform: rotate(45deg); }\
.ss-landing .faq-a { max-height: 0; overflow: hidden; transition: max-height .4s ease, padding .4s; font-size: 15px; line-height: 1.6; color: var(--tx); }\
.ss-landing .faq-item.open .faq-a { max-height: 280px; padding-bottom: 22px; }\
.ss-landing footer { border-top: 1px solid var(--border); padding: 40px 32px; text-align: center; font-family: var(--m); font-size: 12px; color: var(--txm); letter-spacing: 0.04em; }\
.ss-landing footer a { color: var(--tx); text-decoration: none; }\
.ss-landing footer a:hover { color: var(--gold); }\
";

function LandingPage(props) {
  var onSignIn = props.onSignIn;
  var rootRef = useRef(null);

  useEffect(function() {
    var root = rootRef.current;
    if (!root) return;

    // Build mini range matrix (BTN RFI ~ 42%)
    var ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
    var raise = {
      'AA':1,'KK':1,'QQ':1,'JJ':1,'TT':1,'99':1,'88':1,'77':1,'66':1,'55':1,'44':1,'33':1,'22':1,
      'AKs':1,'AQs':1,'AJs':1,'ATs':1,'A9s':1,'A8s':1,'A7s':1,'A6s':1,'A5s':1,'A4s':1,'A3s':1,'A2s':1,
      'KQs':1,'KJs':1,'KTs':1,'K9s':1,'K8s':1,'K7s':1,'K6s':1,'K5s':1,
      'QJs':1,'QTs':1,'Q9s':1,'Q8s':1,'Q7s':1,
      'JTs':1,'J9s':1,'J8s':1,'J7s':1,
      'T9s':1,'T8s':1,'T7s':1,
      '98s':1,'97s':1,'87s':1,'86s':1,'76s':1,'65s':1,'54s':1,
      'AKo':1,'AQo':1,'AJo':1,'ATo':1,'A9o':1,'A8o':1,'A7o':1,
      'KQo':1,'KJo':1,'KTo':1,'K9o':1,
      'QJo':1,'QTo':1,'Q9o':1,
      'JTo':1,'J9o':1,
      'T9o':1
    };
    var grid = root.querySelector('#matrixMini');
    if (grid && grid.childNodes.length === 0) {
      for (var r = 0; r < 13; r++) {
        for (var c = 0; c < 13; c++) {
          var cell = document.createElement('div');
          var hand;
          if (r === c) hand = ranks[r] + ranks[r];
          else if (r < c) hand = ranks[r] + ranks[c] + 's';
          else hand = ranks[c] + ranks[r] + 'o';
          var on = !!raise[hand];
          cell.style.background = on ? 'rgba(76,175,125,0.55)' : 'rgba(212,85,85,0.06)';
          cell.style.border = '1px solid ' + (on ? 'rgba(76,175,125,0.15)' : 'rgba(212,85,85,0.04)');
          cell.textContent = hand.replace(/[so]$/, '');
          cell.style.color = on ? '#fff' : 'rgba(255,255,255,0.1)';
          grid.appendChild(cell);
        }
      }
    }

    // FAQ accordion
    var faqHandlers = [];
    root.querySelectorAll('.faq-q').forEach(function(q) {
      var handler = function() {
        var item = q.parentElement;
        var open = item.classList.contains('open');
        root.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); });
        if (!open) item.classList.add('open');
      };
      q.addEventListener('click', handler);
      faqHandlers.push([q, handler]);
    });

    // Smooth-scroll for in-page anchors
    var scrollHandlers = [];
    root.querySelectorAll('a[href^="#"]').forEach(function(a) {
      var handler = function(e) {
        var href = a.getAttribute('href');
        if (!href || href === '#') return;
        var t = root.querySelector(href);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      };
      a.addEventListener('click', handler);
      scrollHandlers.push([a, handler]);
    });

    // Scroll reveal
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('v'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    root.querySelectorAll('.r').forEach(function(el) { obs.observe(el); });

    return function() {
      faqHandlers.forEach(function(p) { p[0].removeEventListener('click', p[1]); });
      scrollHandlers.forEach(function(p) { p[0].removeEventListener('click', p[1]); });
      obs.disconnect();
    };
  }, []);

  var goSignIn = function(e) { if (e) e.preventDefault(); onSignIn(); };

  return (
    <div ref={rootRef} className="ss-landing" style={{ background: "#07080c", color: "#b8b4aa", fontFamily: "'DM Sans', system-ui, sans-serif", overflowX: "hidden", minHeight: "100vh" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet" />
      <style>{landingCss}</style>

      <div className="atmos"></div>
      <div className="grain"></div>

      <nav>
        <div className="nav-inner">
          <div className="logo"><div className="logo-mark">S</div>SmartSolve</div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#compare">Compare</a>
            <a href="#pricing">Get Started</a>
            <a href="#faq">FAQ</a>
          </div>
          <a href="#pricing" className="nav-cta" onClick={goSignIn}>Sign Up Free</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div>
          <h1 className="fu1">Drop a hand. Get a <em>solver-grade</em> read in 6 seconds.</h1>
          <p className="lede fu2">SmartSolve reads any screenshot — your cards, the board, every action — and grades each street with EV loss vs the GTO line. No solver setup. No node-locking. Just upload and learn.</p>
          <div className="hero-ctas fu3">
            <a href="#pricing" className="btn-primary" onClick={goSignIn}>
              Sign Up Free
              <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
            <a href="#features" className="btn-ghost">See it work</a>
          </div>
          <div className="hero-sites fu4">
            <span>Reads:</span>
            <div className="hero-sites-list">
              <span>PokerStars</span>
              <span>GG</span>
              <span>ACR</span>
              <span>888</span>
              <span>ClubGG</span>
              <span>Ignition</span>
              <span>BetOnline</span>
            </div>
          </div>
        </div>

        <div className="hero-preview fu5">
          <div className="preview-head">
            <div className="preview-title">Hand · Analysis</div>
            <div className="preview-badge">EV −2.4bb</div>
          </div>
          <div className="hand-row">
            <div className="hand-label">Hero</div>
            <div className="hand-cards">
              <div className="card s"><div className="rank">A</div><div className="suit">♠</div></div>
              <div className="card h"><div className="rank">K</div><div className="suit">♥</div></div>
            </div>
            <div style={{ fontFamily: "var(--m)", fontSize: 11, color: "var(--txm)", marginLeft: 8 }}>CO · 100bb</div>
          </div>
          <div className="hand-row">
            <div className="hand-label">Board</div>
            <div className="hand-cards">
              <div className="card d"><div className="rank">Q</div><div className="suit">♦</div></div>
              <div className="card s"><div className="rank">J</div><div className="suit">♠</div></div>
              <div className="card c"><div className="rank">7</div><div className="suit">♣</div></div>
              <div className="card h"><div className="rank">2</div><div className="suit">♥</div></div>
            </div>
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }}></div>
          <div className="street-row">
            <div className="street-name">Pre</div>
            <div className="street-action">Open 2.5x · BB called</div>
            <div className="verdict v-best">BEST</div>
          </div>
          <div className="street-row">
            <div className="street-name">Flop</div>
            <div className="street-action">Bet 33% · BB called</div>
            <div className="verdict v-good">GOOD</div>
          </div>
          <div className="street-row">
            <div className="street-name">Turn</div>
            <div className="street-action">Checked back · should bet 75%</div>
            <div className="verdict v-mistake">MISTAKE</div>
          </div>
          <div className="preview-foot">
            <span className="foot-label">EV Loss · Turn</span>
            <span className="foot-val">−2.4bb</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="wrap">
          <div className="r">
            <div className="section-eyebrow">Features</div>
            <h2 className="section-h">Six tools. <em>One workflow.</em></h2>
            <p className="section-d">Upload a hand, drill ranges, study charts, calculate equity. Everything you need to fix leaks without leaving the browser.</p>
          </div>

          <div className="bento">
            <div className="tile t-wide r">
              <div className="tile-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              </div>
              <h3>Screenshot Analysis</h3>
              <p style={{ marginBottom: 8 }}>Drop a screenshot from any major site. AI extracts your cards, the board, every bet, and grades each street with an EV-loss verdict — Best, Good, Inaccuracy, Mistake, or Blunder.</p>
              <div className="terminal">
                <div><span className="prompt">$</span> upload hand_3284.png</div>
                <div className="dim">› Parsing cards, board, action history…</div>
                <div className="dim">› Cross-referencing GTO solution…</div>
                <div className="out">✓ AKs · CO vs BB · 100bb</div>
                <div className="out">✓ Pre BEST · Flop GOOD · Turn MISTAKE −2.4bb</div>
                <div><span className="prompt">$</span> <span className="cursor"></span></div>
              </div>
            </div>

            <div className="tile t-third r">
              <div className="tile-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              </div>
              <h3>Live Trainer</h3>
              <p>Random hands, random spots. Pick raise / call / fold. Streak counter, accuracy %, total EV lost — all tracked in real time.</p>
            </div>

            <div className="tile t-half r">
              <div className="tile-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              </div>
              <h3>46 GTO Charts</h3>
              <p>RFI, vs Open, vs 3-Bet, vs 4-Bet — every position. Action-colored ranges you can read at a glance.</p>
              <div className="matrix-mini" id="matrixMini"></div>
            </div>

            <div className="tile t-third r">
              <div className="tile-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M9 17V9M15 17V13"/></svg>
              </div>
              <h3>Equity Calc</h3>
              <p>Monte Carlo · 50,000 sims. Click cards, see equity instantly.</p>
              <div className="eq-row">
                <div className="eq-cards">
                  <div className="card s"><div className="rank">A</div><div className="suit">♠</div></div>
                  <div className="card h"><div className="rank">K</div><div className="suit">♥</div></div>
                </div>
                <div className="eq-bar">
                  <div className="e1" style={{ flex: 0.46 }}></div>
                  <div className="e2" style={{ flex: 0.54 }}></div>
                </div>
                <div className="eq-pct">46.2%</div>
              </div>
              <div className="eq-row">
                <div className="eq-cards">
                  <div className="card d"><div className="rank">Q</div><div className="suit">♦</div></div>
                  <div className="card c"><div className="rank">Q</div><div className="suit">♣</div></div>
                </div>
                <div className="eq-bar">
                  <div className="e1" style={{ flex: 0.54 }}></div>
                  <div className="e2" style={{ flex: 0.46 }}></div>
                </div>
                <div className="eq-pct">53.8%</div>
              </div>
            </div>

            <div className="tile t-third r">
              <div className="tile-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 00-3 3v0a3 3 0 003 3h0a3 3 0 003-3v0a3 3 0 00-3-3zM5 22v-6a3 3 0 013-3h8a3 3 0 013 3v6"/><path d="M9 14l3 3 3-3"/></svg>
              </div>
              <h3>Custom Solver</h3>
              <p>Describe any spot in text or voice. Our GTO API returns the solver-verified frequencies plus the reasoning behind them — built for the off-tree river spots no chart covers.</p>
            </div>

            <div className="tile t-third r">
              <div className="tile-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>
              </div>
              <h3>Bankroll Tracker</h3>
              <p>Log sessions, watch the curve. Profit chart, hourly rate, win-rate — without a spreadsheet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section id="compare">
        <div className="wrap">
          <div className="r">
            <div className="section-eyebrow">Why players choose us</div>
            <h2 className="section-h">Who <em>chose us.</em></h2>
            <p className="section-d">Not only do we deliver every chart, frequency, and EV figure through our solver-verified GTO API — we're reinventing what a poker solver looks like. Instant. Visual. Built for how players actually study.</p>
          </div>

          <div className="compare r">
            <div className="compare-row compare-head">
              <div>Feature</div>
              <div className="compare-cell me">SmartSolve</div>
              <div className="compare-cell">PioSOLVER</div>
              <div className="compare-cell">GTO Wizard</div>
            </div>
            <div className="compare-row">
              <div className="compare-feat">Upload screenshots → instant analysis</div>
              <div className="compare-cell me"><span className="yes">✓</span></div>
              <div className="compare-cell"><span className="no">—</span></div>
              <div className="compare-cell"><span className="no">—</span></div>
            </div>
            <div className="compare-row">
              <div className="compare-feat">EV-loss verdict per street</div>
              <div className="compare-cell me"><span className="yes">✓</span></div>
              <div className="compare-cell"><span className="yes">✓</span></div>
              <div className="compare-cell"><span className="yes">✓</span></div>
            </div>
            <div className="compare-row">
              <div className="compare-feat">Custom spots in plain English</div>
              <div className="compare-cell me"><span className="yes">✓</span></div>
              <div className="compare-cell"><span className="no">—</span></div>
              <div className="compare-cell"><span className="no">—</span></div>
            </div>
            <div className="compare-row">
              <div className="compare-feat">Built-in equity calculator</div>
              <div className="compare-cell me"><span className="yes">✓</span></div>
              <div className="compare-cell"><span className="yes">✓</span></div>
              <div className="compare-cell"><span className="yes">✓</span></div>
            </div>
            <div className="compare-row">
              <div className="compare-feat">No download. Works in browser.</div>
              <div className="compare-cell me"><span className="yes">✓</span></div>
              <div className="compare-cell"><span className="no">—</span></div>
              <div className="compare-cell"><span className="yes">✓</span></div>
            </div>
            <div className="compare-row">
              <div className="compare-feat">Free to try, no card required</div>
              <div className="compare-cell me"><span className="yes">✓</span></div>
              <div className="compare-cell"><span className="no">—</span></div>
              <div className="compare-cell"><span className="no">—</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST · POWERED BY OUR GTO API */}
      <section id="trust">
        <div className="wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <div className="trust-card r">
            <h2 className="section-h" style={{ marginBottom: 14 }}>Every chart is <em>solver-verified</em> through our GTO API.</h2>
            <p className="section-d" style={{ marginBottom: 28 }}>
              SmartSolve runs on a proprietary GTO API — pre-computed solver solutions served on demand. Every range, frequency, and EV figure you see is a direct query against that API. No guesswork, no improvisation: pro-grade solver math, served instantly.
            </p>
            <div className="trust-grid">
              <div className="trust-item">
                <div className="trust-num">100%</div>
                <div className="trust-lbl">Charts served by our GTO API</div>
              </div>
              <div className="trust-item">
                <div className="trust-num">2.4M+</div>
                <div className="trust-lbl">Pre-solved spots indexed</div>
              </div>
              <div className="trust-item">
                <div className="trust-num">6-max · 100bb</div>
                <div className="trust-lbl">Solver-verified model</div>
              </div>
            </div>
            <p className="trust-foot">
              Vision reads your screenshot. Our GTO API returns the solution. Same source of truth used in our trainer, charts, and analysis — verified end to end.
            </p>
          </div>
        </div>
      </section>

      {/* SIGN UP */}
      <section id="pricing">
        <div className="wrap">
          <div className="r" style={{ textAlign: "center" }}>
            <div className="section-eyebrow">Get Started</div>
            <h2 className="section-h" style={{ margin: "0 auto 18px" }}>Sign up and <em>try for free.</em></h2>
            <p className="section-d" style={{ margin: "0 auto 60px" }}>No card. No commitment. Make an account and start uploading hands in under a minute.</p>
          </div>

          <div className="pricing-wrap r">
            <div className="price-tag">Free Access</div>
            <div className="price-amt" style={{ fontSize: 48 }}>Sign up &amp; try</div>
            <div className="price-sub">Full access — every feature unlocked from day one.</div>
            <ul className="price-feats">
              <li>Screenshot analysis</li>
              <li>All 46 GTO charts</li>
              <li>Live trainer with EV tracking</li>
              <li>Custom solver (text + voice)</li>
              <li>Equity calculator</li>
              <li>Bankroll + session history</li>
            </ul>
            <a href="#" className="price-cta" onClick={goSignIn}>Sign Up Free</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="wrap">
          <div className="r" style={{ textAlign: "center" }}>
            <div className="section-eyebrow">FAQ</div>
            <h2 className="section-h" style={{ margin: "0 auto 18px" }}>Honest answers.</h2>
            <p className="section-d" style={{ margin: "0 auto 60px" }}>If something's missing, email and ask.</p>
          </div>

          <div className="faq r">
            <div className="faq-item">
              <div className="faq-q">Which sites can SmartSolve read screenshots from?</div>
              <div className="faq-a">PokerStars, GG, ACR, 888, ClubGG, Ignition, and BetOnline are all supported. If your site uses a fairly standard layout, SmartSolve probably works on it. If a screenshot fails, send it and we'll fix the parser.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Is this really GTO-accurate?</div>
              <div className="faq-a">Yes. Every chart, frequency, and EV figure is served by our GTO API — pre-computed solver solutions at 100bb 6-max, indexed and queryable in milliseconds. Your spot maps to the verified solver node and returns the exact frequencies. No approximation, no guessing.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">What about 9-max or different stack depths?</div>
              <div className="faq-a">Currently 6-max, 100bb. 9-max and tournament stack depths are on the roadmap.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Is it really free to sign up?</div>
              <div className="faq-a">Yes. It's free to sign up — not a trial. Make an account and you're in. No card, no countdown, no upsell wall in the middle of a hand review.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Is this allowed on poker sites?</div>
              <div className="faq-a">SmartSolve is a study tool — you upload screenshots after a hand to review what happened. It doesn't run while you play, doesn't read the table in real time, and doesn't violate any major site's ToS. Same category as PioSOLVER or GTO Wizard, just smarter.</div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        © 2026 SmartSolve · <a href="mailto:hello@smartsolvepoker.com">hello@smartsolvepoker.com</a> · <a href="#">Terms</a> · <a href="#">Privacy</a>
      </footer>
    </div>
  );
}

function SignInGate(props) {
  var _mode = useState("signin"); var mode = _mode[0]; var setMode = _mode[1];
  var _email = useState(""); var email = _email[0]; var setEmail = _email[1];
  var _password = useState(""); var password = _password[0]; var setPassword = _password[1];
  var _busy = useState(false); var busy = _busy[0]; var setBusy = _busy[1];
  var _err = useState(""); var err = _err[0]; var setErr = _err[1];
  var _info = useState(""); var info = _info[0]; var setInfo = _info[1];

  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, color: C.tx, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--f)" }}>
        <div style={{ maxWidth: 460, padding: 28, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,167,44,0.18)", borderRadius: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: C.gold, fontFamily: "var(--m)", marginBottom: 8 }}>SETUP REQUIRED</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.txb, margin: "0 0 12px" }}>Supabase isn't configured yet</h2>
          <p style={{ fontSize: 13, color: C.tx, lineHeight: 1.55, margin: "0 0 14px" }}>
            Auth needs two env vars on Vercel before sign-in works:
          </p>
          <div style={{ fontFamily: "var(--m)", fontSize: 12, color: C.txb, background: "rgba(0,0,0,0.3)", padding: "12px 14px", borderRadius: 8, marginBottom: 14, lineHeight: 1.7 }}>
            VITE_SUPABASE_URL<br/>
            VITE_SUPABASE_ANON_KEY
          </div>
          <ol style={{ fontSize: 13, color: C.tx, lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
            <li>Create a project at supabase.com</li>
            <li>Settings → API → copy Project URL + anon key</li>
            <li>Vercel → smartsolve → Settings → Environment Variables → add both → Redeploy</li>
          </ol>
        </div>
      </div>
    );
  }

  var submit = function(e) {
    e.preventDefault();
    if (!email || !password) { setErr("Email and password required."); return; }
    setBusy(true); setErr(""); setInfo("");
    var fn = mode === "signin" ? supabase.auth.signInWithPassword({ email: email, password: password }) : supabase.auth.signUp({ email: email, password: password });
    fn.then(function(res) {
      setBusy(false);
      if (res.error) { setErr(res.error.message); return; }
      if (mode === "signup" && res.data && res.data.user && !res.data.session) {
        setInfo("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    }).catch(function(e) { setBusy(false); setErr(e.message || "Auth error."); });
  };

  var google = function() {
    setBusy(true); setErr("");
    supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })
      .catch(function(e) { setBusy(false); setErr(e.message || "Google sign-in failed."); });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.tx, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--f)" }}>
      {props.onBack && (
        <button onClick={props.onBack} style={{
          position: "absolute", top: 20, left: 20,
          fontFamily: "var(--m)", fontSize: 11, fontWeight: 600, color: C.txm,
          background: "transparent", border: "none", cursor: "pointer", padding: "6px 10px",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" stroke={C.txm} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
      )}
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, justifyContent: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1a1c2a", border: "1px solid rgba(212,167,44,0.15)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none"><rect x="4" y="4" width="56" height="56" rx="10" fill="#1a1c2a"/><rect x="10" y="10" width="11" height="11" rx="3" fill="#d4a72c"/><rect x="23" y="10" width="11" height="11" rx="3" fill="#d4a72c"/><rect x="36" y="10" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.8"/><rect x="49" y="10" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.35"/><rect x="10" y="23" width="11" height="11" rx="3" fill="#d4a72c"/><rect x="23" y="23" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.65"/></svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.txb, letterSpacing: "-0.03em" }}>SmartSolve</div>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.txb, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 6px" }}>{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p style={{ fontSize: 13, color: C.txm, textAlign: "center", margin: "0 0 22px" }}>{mode === "signin" ? "Welcome back to SmartSolve." : "Free. Takes 10 seconds."}</p>

        <form onSubmit={submit}>
          <input type="email" placeholder="Email" value={email} onChange={function(e) { setEmail(e.target.value); }} autoComplete="email" style={{
            width: "100%", padding: "12px 14px", marginBottom: 10, fontFamily: "var(--f)", fontSize: 14,
            background: "rgba(255,255,255,0.03)", color: C.txb, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, outline: "none", boxSizing: "border-box",
          }} />
          <input type="password" placeholder="Password" value={password} onChange={function(e) { setPassword(e.target.value); }} autoComplete={mode === "signin" ? "current-password" : "new-password"} style={{
            width: "100%", padding: "12px 14px", marginBottom: 12, fontFamily: "var(--f)", fontSize: 14,
            background: "rgba(255,255,255,0.03)", color: C.txb, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, outline: "none", boxSizing: "border-box",
          }} />
          {err && <div style={{ fontSize: 12, color: C.red, marginBottom: 10, fontFamily: "var(--m)" }}>{err}</div>}
          {info && <div style={{ fontSize: 12, color: C.green, marginBottom: 10, fontFamily: "var(--m)" }}>{info}</div>}
          <button type="submit" disabled={busy} style={{
            width: "100%", padding: "12px", fontFamily: "var(--f)", fontSize: 14, fontWeight: 700, color: "#1a1630",
            background: busy ? "rgba(212,167,44,0.4)" : "linear-gradient(135deg," + C.gold + "," + C.goldL + ")",
            border: "none", borderRadius: 8, cursor: busy ? "default" : "pointer",
            boxShadow: busy ? "none" : "0 4px 14px rgba(212,167,44,0.25)",
          }}>{busy ? "..." : (mode === "signin" ? "Sign in" : "Create account")}</button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: C.txm, fontSize: 11, fontFamily: "var(--m)", letterSpacing: "0.06em" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          OR
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        {import.meta.env.VITE_GOOGLE_AUTH_ENABLED === "true" ? (
          <button onClick={google} disabled={busy} style={{
            width: "100%", padding: "11px", fontFamily: "var(--f)", fontSize: 14, fontWeight: 600, color: C.txb,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8,
            cursor: busy ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.4 35 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2.1-2 3.9-3.7 5.3l6.3 5.3C39.7 35.5 44 30.3 44 24c0-1.3-.2-2.4-.4-3.5z"/></svg>
            Continue with Google
          </button>
        ) : (
          <div style={{ fontSize: 12, color: C.txm, textAlign: "center", padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 8, fontFamily: "var(--m)" }}>
            Google sign-in coming soon
          </div>
        )}

        <div style={{ marginTop: 22, textAlign: "center", fontSize: 13, color: C.txm }}>
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={function() { setMode(mode === "signin" ? "signup" : "signin"); setErr(""); setInfo(""); }} style={{
            color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--f)", fontSize: 13, fontWeight: 600, padding: 0,
          }}>{mode === "signin" ? "Sign up" : "Sign in"}</button>
        </div>
      </div>
    </div>
  );
}

function useAuth() {
  var _user = useState(null); var user = _user[0]; var setUser = _user[1];
  var _loading = useState(true); var loading = _loading[0]; var setLoading = _loading[1];

  useEffect(function() {
    if (!supabaseConfigured) { setLoading(false); return; }
    supabase.auth.getSession().then(function(res) {
      setUser(res.data.session ? res.data.session.user : null);
      setLoading(false);
    });
    var sub = supabase.auth.onAuthStateChange(function(_event, session) {
      setUser(session ? session.user : null);
    });
    return function() { if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe(); };
  }, []);

  return { user: user, loading: loading };
}

export default function App() {
  var auth = useAuth();
  var _pg = useState("home"); var pg = _pg[0]; var setPg = _pg[1];
  var _hist = useState([]); var hist = _hist[0]; var setHist = _hist[1];
  var _menu = useState(false); var menu = _menu[0]; var setMenu = _menu[1];
  var _viewHand = useState(null); var viewHand = _viewHand[0]; var setViewHand = _viewHand[1];
  var _showAuth = useState(false); var showAuth = _showAuth[0]; var setShowAuth = _showAuth[1];

  /* Load hand history for this user (must run before any early returns) */
  var userId = auth.user && auth.user.id;
  useEffect(function() {
    if (!userId || !supabase) return;
    supabase.from("hand_history").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50)
      .then(function(res) {
        if (res.data) setHist(res.data.map(function(r) { return r.data; }).filter(Boolean));
      });
  }, [userId]);

  if (auth.loading) {
    return <div style={{ minHeight: "100vh", background: C.bg, color: C.txm, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--m)", fontSize: 12, letterSpacing: "0.08em" }}>LOADING...</div>;
  }
  if (!auth.user) {
    if (!showAuth) return <LandingPage onSignIn={function() { setShowAuth(true); }} />;
    return <SignInGate onBack={function() { setShowAuth(false); }} />;
  }
  var signOut = function() { if (supabase) supabase.auth.signOut(); };

  var addH = function(d) {
    if (!d || !d.hero_cards) return;
    setHist(function(h) { return [d].concat(h).slice(0, 50); });
    if (supabase && auth.user) {
      supabase.from("hand_history").insert({
        user_id: auth.user.id,
        hero_cards: d.hero_cards || null,
        hero_position: d.hero_position || null,
        villain_position: d.villain_position || null,
        community_cards: d.community_cards || null,
        grade: d.overall && d.overall.grade ? d.overall.grade : null,
        ev_lost: d.overall && d.overall.ev_lost != null ? d.overall.ev_lost : null,
        data: d,
      }).then(function() {});
    }
  };
  var go = function(id) { setPg(id); setMenu(false); };
  var openHand = function(h) { setViewHand(h); setPg("uploads"); setMenu(false); };

  var nav = [
    { id: "study", icon: Ic.study, t: "Study", d: "Study any spot" },
    { id: "trainer", icon: Ic.train, t: "Trainer", d: "Play vs. GTO" },
    { id: "uploads", icon: Ic.upload, t: "Uploads", d: "Analyze your game" },
    { id: "custom", icon: Ic.solve, t: "Custom", d: "AI solve any spot" },
    { id: "builder", icon: Ic.range, t: "Ranges", d: "Build ranges" },
    { id: "equity", icon: Ic.equity, t: "Equity", d: "Equity calculator" },
    { id: "bankroll", icon: Ic.bankroll, t: "Bankroll", d: "Track your roll" },
    { id: "hands", icon: Ic.hands, t: "Hands", d: "Studied hands" },
    { id: "reports", icon: Ic.report, t: "Reports", d: "Study all flops" },
    { id: "drills", icon: Ic.drill, t: "Drills", d: "Training drills" },
    { id: "help", icon: Ic.help, t: "Help", d: "Tips & tricks" },
  ];

  var topNav = nav.slice(0, 8);
  var moreNav = nav.slice(8);
  var accents = [C.gold, C.green, C.amber, C.blue, C.blue, C.green, C.green, C.amber, C.gold, C.green, C.txm];

  var isHome = pg === "home";

  return (
    <div style={{ "--f": "'DM Sans',system-ui,sans-serif", "--m": "'JetBrains Mono','SF Mono',monospace", minHeight: "100vh", background: C.bg, fontFamily: "var(--f)", color: C.tx }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ background: "rgba(12,13,18,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "0 16px", display: "flex", alignItems: "center", height: 48, position: "sticky", top: 0, zIndex: 20 }}>
        <div onClick={function() { go("home"); }} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", flexShrink: 0, marginRight: 16 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "#1a1c2a", border: "1px solid rgba(212,167,44,0.15)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <svg width="22" height="22" viewBox="0 0 64 64" fill="none"><rect x="4" y="4" width="56" height="56" rx="10" fill="#1a1c2a"/><rect x="10" y="10" width="11" height="11" rx="3" fill="#d4a72c"/><rect x="23" y="10" width="11" height="11" rx="3" fill="#d4a72c"/><rect x="36" y="10" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.8"/><rect x="49" y="10" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.35"/><rect x="10" y="23" width="11" height="11" rx="3" fill="#d4a72c"/><rect x="23" y="23" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.65"/><rect x="36" y="23" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.3"/><rect x="10" y="36" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.55"/><rect x="23" y="36" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.2"/><rect x="10" y="49" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.15"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.txb, letterSpacing: "-0.03em" }}>SmartSolve</span>
        </div>
        <div style={{ display: "flex", gap: 2, flex: 1, overflow: "hidden", background: "rgba(255,255,255,0.025)", borderRadius: 8, padding: 3 }}>
          {topNav.map(function(n) {
            var active = pg === n.id;
            return (
              <button key={n.id} onClick={function() { go(n.id); }} style={{
                fontFamily: "var(--f)", fontSize: 12, fontWeight: active ? 600 : 400,
                color: active ? C.txb : C.txm,
                background: active ? "rgba(255,255,255,0.07)" : "transparent",
                border: "none", borderRadius: 6,
                padding: "6px 12px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                transition: "all 0.15s",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
              }}>{n.t}</button>
            );
          })}
          <button onClick={function() { setMenu(!menu); }} style={{
            fontFamily: "var(--f)", fontSize: 12, color: C.txm,
            background: "transparent", border: "none", borderRadius: 6,
            padding: "6px 10px", cursor: "pointer", whiteSpace: "nowrap",
          }}>{"\u00B7\u00B7\u00B7"}</button>
        </div>
        <button onClick={signOut} title={auth.user && auth.user.email ? auth.user.email : "Sign out"} style={{
          fontFamily: "var(--m)", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: C.txm,
          background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6,
          padding: "5px 10px", cursor: "pointer", marginLeft: 8, flexShrink: 0, whiteSpace: "nowrap",
        }}>SIGN OUT</button>
      </div>

      {menu && (
        <div style={{ position: "fixed", top: 52, right: 16, background: "rgba(26,28,42,0.98)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 6, zIndex: 30, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", minWidth: 200 }}>
          {moreNav.map(function(n) {
            return (
              <button key={n.id} onClick={function() { go(n.id); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", textAlign: "left", fontFamily: "var(--f)" }}>
                <span style={{ flexShrink: 0, opacity: 0.6 }}>{n.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.txb }}>{n.t}</div>
                  <div style={{ fontSize: 11, color: C.txm }}>{n.d}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {menu && <div onClick={function() { setMenu(false); }} style={{ position: "fixed", inset: 0, zIndex: 25 }} />}

      {isHome && (
        <div style={{ animation: "fu 0.5s both" }}>
          <div style={{ position: "relative", overflow: "hidden", padding: "48px 28px 40px", background: "linear-gradient(160deg, #0f1118 0%, #151928 40%, #1a1630 70%, #12101c 100%)" }}>
            <div style={{ position: "absolute", top: -60, right: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,167,44,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -80, left: -60, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,141,239,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#1a1c2a", border: "1px solid rgba(212,167,44,0.15)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", overflow: "hidden" }}>
                  <svg width="36" height="36" viewBox="0 0 64 64" fill="none"><rect x="4" y="4" width="56" height="56" rx="10" fill="#1a1c2a"/><rect x="10" y="10" width="11" height="11" rx="3" fill="#d4a72c"/><rect x="23" y="10" width="11" height="11" rx="3" fill="#d4a72c"/><rect x="36" y="10" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.8"/><rect x="49" y="10" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.35"/><rect x="10" y="23" width="11" height="11" rx="3" fill="#d4a72c"/><rect x="23" y="23" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.65"/><rect x="36" y="23" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.3"/><rect x="10" y="36" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.55"/><rect x="23" y="36" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.2"/><rect x="10" y="49" width="11" height="11" rx="3" fill="#d4a72c" opacity="0.15"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.txb, letterSpacing: "-0.03em", lineHeight: 1.1 }}>SmartSolve</div>
                  <div style={{ fontSize: 12, fontFamily: "var(--m)", color: C.gold, letterSpacing: "0.08em", opacity: 0.7 }}>GTO POKER TRAINER</div>
                </div>
              </div>
              <p style={{ fontSize: 16, color: C.tx, lineHeight: 1.6, maxWidth: 420, marginBottom: 28 }}>
                Master preflop ranges, analyze hands with AI, and train against game-theory optimal strategy.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { id: "trainer", label: "Start Training", sub: "Practice vs GTO", color: C.green },
                  { id: "uploads", label: "Analyze Hand", sub: "Upload screenshot", color: C.gold },
                  { id: "study", label: "Study Ranges", sub: "Browse positions", color: C.blue },
                ].map(function(item) {
                  return (
                    <button key={item.id} onClick={function() { go(item.id); }} style={{
                      flex: 1, display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      fontFamily: "var(--f)", textAlign: "left",
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: item.color + "12", border: "1px solid " + item.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.txb }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: C.txm }}>{item.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ position: "absolute", top: 20, right: 0, display: "flex", gap: 6, opacity: 0.3, transform: "rotate(8deg)", pointerEvents: "none" }}>
                <Crd r="A" sym={SD.s.s} clr={SD.s.c} sz={42} />
                <Crd r="K" sym={SD.h.s} clr={SD.h.c} sz={42} />
              </div>
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: "linear-gradient(transparent, " + C.bg + ")", pointerEvents: "none" }} />
          </div>

          <div style={{ padding: "24px 20px 0", maxWidth: 680, margin: "0 auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: C.txm, fontFamily: "var(--m)", marginBottom: 14 }}>ALL TOOLS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {nav.map(function(n, i) {
                var accent = accents[i] || C.txm;
                return (
                  <div key={n.id} onClick={function() { go(n.id); }} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
                    animation: "fu 0.35s " + (i * 0.04) + "s both",
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: accent + "12",
                      border: "1px solid " + accent + "18",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>{n.icon}</div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.txb, display: "block" }}>{n.t}</span>
                      <span style={{ fontSize: 12, color: C.txm }}>{n.d}</span>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ marginLeft: "auto", opacity: 0.15, flexShrink: 0 }}><path d="M9 6l6 6-6 6" stroke={C.txm} strokeWidth="2" strokeLinecap="round" /></svg>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!isHome && (
        <div style={{ padding: "28px 20px 80px", maxWidth: 720, margin: "0 auto" }}>
          {pg === "study" && <StudyPage />}
          {pg === "trainer" && <TrainerPage />}
          {pg === "uploads" && <UploadsPage onResult={addH} viewHand={viewHand} clearViewHand={function() { setViewHand(null); }} />}
          {pg === "custom" && <CustomPage />}
          {pg === "builder" && <RangeBuilderPage />}
          {pg === "equity" && <EquityPage />}
          {pg === "bankroll" && <BankrollPage user={auth.user} />}
          {pg === "hands" && <HandsPage history={hist} onView={openHand} />}
          {pg === "reports" && <ReportsPage />}
          {pg === "drills" && <DrillsPage onGo={go} />}
          {pg === "help" && <HelpPage />}
        </div>
      )}

      <style>{"@keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}.sp{animation:sp .6s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}::selection{background:rgba(212,167,44,.25)}*{box-sizing:border-box;margin:0;padding:0}textarea:focus{border-color:rgba(212,167,44,.4)!important}button:active{transform:scale(.98)!important}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06);border-radius:3px}"}</style>
      <Analytics />
    </div>
  );
}
