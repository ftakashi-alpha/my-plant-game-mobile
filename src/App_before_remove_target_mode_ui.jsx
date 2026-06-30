import React, { useMemo, useState } from "react";

const SIZE = 6;
const MAX_TURN = 20;

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const pct = (v) => `${Math.round(v * 1000) / 10}%`;

const difficulties = {
  easy: { name: "やさしい", money: 190, income: 16, risk: 0.62, growth: 1.2 },
  normal: { name: "ふつう", money: 150, income: 14, risk: 0.88, growth: 1.08 },
  hard: { name: "むずかしい", money: 115, income: 11, risk: 1.18, growth: 0.98 },
  research: { name: "研究用調整", money: 150, income: 14, risk: 0.88, growth: 1.08 },
};

const cropModes = {
  tomato: {
    name: "トマト",
    icon: "🍅",
    vectorFactor: 1.0,
    pathogenFactor: 1.0,
    growthFactor: 1.0,
    deathFactor: 1.0,
    description: "標準的な作物モードです。病原菌圧と媒介虫の両方をバランスよく受けます。",
  },
  cucumber: {
    name: "キュウリ",
    icon: "🥒",
    vectorFactor: 1.25,
    pathogenFactor: 0.9,
    growthFactor: 1.08,
    deathFactor: 0.95,
    description: "媒介虫リスクをやや高めにしたモードです。ウイルス病の学習に向きます。",
  },
  potato: {
    name: "ジャガイモ",
    icon: "🥔",
    vectorFactor: 0.9,
    pathogenFactor: 1.25,
    growthFactor: 0.95,
    deathFactor: 1.15,
    description: "病原菌圧リスクをやや高めにしたモードです。土壌病害・疫病型の学習に向きます。",
  },
};

const diseaseModes = {
  comprehensive: {
    name: "総合モード",
    icon: "🌿",
    pathogenRisk: 1.0,
    vectorRisk: 1.0,
    fungicideEffect: 1.0,
    insecticideEffect: 1.0,
    microbeEffect: 1.0,
    enemyEffect: 1.0,
    description: "病原菌と媒介虫の両方を管理する標準モードです。",
  },
  virus: {
    name: "ウイルスモード",
    icon: "🧬",
    pathogenRisk: 0.15,
    vectorRisk: 1.8,
    fungicideEffect: 0.15,
    insecticideEffect: 1.25,
    microbeEffect: 0.35,
    enemyEffect: 1.25,
    description: "媒介虫による拡散が主となるモードです。化学殺虫剤、天敵、防虫ネットが重要です。",
  },
  fungal: {
    name: "糸状菌モード",
    icon: "🍄",
    pathogenRisk: 1.75,
    vectorRisk: 0.35,
    fungicideEffect: 1.35,
    insecticideEffect: 0.6,
    microbeEffect: 1.25,
    enemyEffect: 0.65,
    description: "病原菌圧と風雨による拡散が重要なモードです。化学殺菌剤、拮抗微生物、雨除けが有効です。",
  },
  bacterial: {
    name: "細菌モード",
    icon: "🧫",
    pathogenRisk: 1.45,
    vectorRisk: 0.45,
    fungicideEffect: 0.65,
    insecticideEffect: 0.65,
    microbeEffect: 1.1,
    enemyEffect: 0.75,
    description: "雨滴・水はねによる拡散が重要なモードです。雨除け、圃場衛生、拮抗微生物が重要です。",
  },
};

const tools = {
  monitor: {
    name: "診断・トラップ",
    mark: "🔍",
    cost: 10,
    range: "area",
    group: "診断",
    type: "monitor",
    duration: 4,
    infectionReduction: 0.08,
    diseaseReduction: 0.04,
    pathogenReduction: 0,
    vectorReduction: 0.08,
    edu: "潜伏感染や病原菌圧を見える化します。薬剤耐性を上げない観察型の手段です。",
  },
  fungicide: {
    name: "化学殺菌剤",
    mark: "💧",
    cost: 14,
    range: "area",
    group: "化学",
    type: "chemicalFungicide",
    duration: 3,
    infectionReduction: 0.3,
    diseaseReduction: 0.22,
    pathogenReduction: 10,
    vectorReduction: 0,
    edu: "病原菌を抑えます。ただし連用すると病原体の薬剤耐性が上がります。",
  },
  insecticide: {
    name: "化学殺虫剤",
    mark: "🧪",
    cost: 14,
    range: "area",
    group: "化学",
    type: "chemicalInsecticide",
    duration: 3,
    infectionReduction: 0.1,
    diseaseReduction: 0.04,
    pathogenReduction: 0,
    vectorReduction: 0.48,
    edu: "媒介虫を抑えます。ただし連用すると媒介虫の薬剤抵抗性が上がります。",
  },
  microbe: {
    name: "拮抗微生物",
    mark: "🌱",
    cost: 18,
    range: "area",
    group: "生物",
    type: "bio",
    duration: 4,
    infectionReduction: 0.2,
    diseaseReduction: 0.14,
    pathogenReduction: 12,
    vectorReduction: 0,
    edu: "病原菌を生物的に抑え、化学殺菌剤への依存を下げます。",
  },
  enemy: {
    name: "天敵",
    mark: "🐞",
    cost: 18,
    range: "area",
    group: "生物",
    type: "bio",
    duration: 4,
    infectionReduction: 0.08,
    diseaseReduction: 0.03,
    pathogenReduction: 0,
    vectorReduction: 0.42,
    edu: "媒介虫を生物的に抑え、化学殺虫剤への依存を下げます。",
  },
  net: {
    name: "防虫ネット",
    mark: "🕸️",
    cost: 16,
    range: "area",
    group: "物理",
    type: "physical",
    duration: 5,
    infectionReduction: 0.08,
    diseaseReduction: 0.03,
    pathogenReduction: 0,
    vectorReduction: 0.52,
    edu: "媒介虫の侵入を物理的に防ぎます。ウイルス病対策で重要です。",
  },
  rainShelter: {
    name: "雨除け施設",
    mark: "☂️",
    cost: 18,
    range: "area",
    group: "物理",
    type: "physical",
    duration: 5,
    infectionReduction: 0.14,
    diseaseReduction: 0.1,
    pathogenReduction: 10,
    vectorReduction: 0,
    edu: "水はねを減らし、病原菌拡散を抑える薬剤に頼らない防除です。",
  },
  soilHeat: {
    name: "土壌熱消毒",
    mark: "🔥",
    cost: 18,
    range: "area",
    group: "物理",
    type: "physical",
    duration: 5,
    infectionReduction: 0.16,
    diseaseReduction: 0.08,
    pathogenReduction: 16,
    vectorReduction: 0,
    edu: "土壌病原菌を減らす予防的な物理防除です。",
  },
  light: {
    name: "光防除",
    mark: "💡",
    cost: 20,
    range: "area",
    group: "物理",
    type: "physical",
    duration: 4,
    infectionReduction: 0.12,
    diseaseReduction: 0.06,
    pathogenReduction: 4,
    vectorReduction: 0.22,
    edu: "光を利用して病害虫の行動や病原菌の活動を抑えます。",
  },
  immunity: {
    name: "免疫誘導剤",
    mark: "✨",
    cost: 18,
    range: "area",
    group: "IPM",
    type: "host",
    duration: 5,
    infectionReduction: 0.18,
    diseaseReduction: 0.16,
    pathogenReduction: 0,
    vectorReduction: 0,
    edu: "植物側の防御反応を高めるため、薬剤耐性とは異なる作用点です。",
  },
  organicFertilizer: {
    name: "有機肥料",
    mark: "🌾",
    cost: 12,
    range: "area",
    group: "栽培",
    type: "culture",
    duration: 3,
    infectionReduction: 0.04,
    diseaseReduction: 0.04,
    pathogenReduction: 4,
    vectorReduction: 0,
    growthBonus: 8,
    edu: "健全な生育を支える補助手段です。土壌環境の改善を想定します。",
  },
  chemicalFertilizer: {
    name: "化学肥料",
    mark: "⚗️",
    cost: 10,
    range: "area",
    group: "栽培",
    type: "culture",
    duration: 2,
    infectionReduction: -0.04,
    diseaseReduction: -0.02,
    pathogenReduction: -8,
    vectorReduction: 0,
    growthBonus: 12,
    edu: "速効的に生育を助けますが、過剰施用により病原菌圧を高める教育的設定です。",
  },
  resistant: {
    name: "抵抗性品種",
    mark: "🛡️",
    cost: 24,
    range: "single",
    group: "IPM",
    type: "host",
    duration: 999,
    infectionReduction: 0.34,
    diseaseReduction: 0.24,
    pathogenReduction: 0,
    vectorReduction: 0,
    edu: "薬剤が効きにくい状況でも有効な病害に強い品種です。区画単位で導入します。",
  },
  roguing: {
    name: "抜取",
    mark: "✂️",
    cost: 8,
    range: "single",
    group: "衛生",
    type: "sanitation",
    duration: 999,
    infectionReduction: 0,
    diseaseReduction: 0,
    pathogenReduction: 10,
    vectorReduction: 0,
    edu: "発病株を除去し、周囲への感染源を減らします。重症区画で有効です。",
  },
};

const naturalEventSettings = {
  enemyProb: 0.14,
  microbeProb: 0.14,
  bothProb: 0.05,
  duration: 3,
  enemyVectorReduction: 0.28,
  enemyInfectionReduction: 0.07,
  microbeInfectionReduction: 0.12,
  microbeDiseaseReduction: 0.08,
  microbePathogenReduction: 6,
};

const items = {
  rotate: {
    name: "薬剤ローテーション",
    mark: "🔄",
    cost: 15,
    edu: "作用点を変えて選抜圧を下げ、殺菌剤耐性・殺虫剤抵抗性を同時に下げます。",
  },
  rest: {
    name: "休薬期間",
    mark: "⏸️",
    cost: 8,
    edu: "選抜圧を下げます。数ターン、薬剤耐性の自然低下を強めます。",
  },
  microbeBoost: {
    name: "微生物強化資材",
    mark: "🌱+",
    cost: 20,
    edu: "病原菌管理を生物防除へ寄せ、殺菌剤耐性を下げます。",
  },
  enemyBoost: {
    name: "天敵放飼強化",
    mark: "🐞+",
    cost: 20,
    edu: "媒介虫管理を生物防除へ寄せ、殺虫剤抵抗性を下げます。",
  },
};

function createPlots() {
  return Array.from({ length: SIZE * SIZE }, (_, id) => ({
    id,
    infection: id === 14 || id === 21 ? 24 : 0,
    disease: id === 14 || id === 21 ? 7 : 0,
    growth: 8,
    dead: false,
    vector: Math.random() < 0.17,
    pathogen: Math.random() < 0.24,
    effects: [],
  }));
}

function getStatus(p) {
  if (p.dead) return { label: "枯死", color: "#d6d3d1", text: "#1f2933", mark: "💀" };
  if (p.disease >= 70) return { label: "重症", color: "#fca5a5", text: "#1f2933", mark: "🔴" };
  if (p.disease >= 35) return { label: "初期発病", color: "#fed7aa", text: "#1f2933", mark: "🟠" };
  if (p.infection >= 45) return { label: "潜伏感染", color: "#fef9c3", text: "#1f2933", mark: "🟡" };
  return { label: "健全", color: "#dcfce7", text: "#1f2933", mark: "" };
}

function level(v) {
  if (v < 0.25) return "🟢低";
  if (v < 0.55) return "🟡中";
  if (v < 0.85) return "🔴高";
  return "⛔最大";
}

function weatherInfo(turn) {
  if ([5, 6, 13, 14].includes(turn)) {
    return { icon: "🌧️", name: "長雨", diseaseBonus: 0.045, vectorBonus: 0, text: "水はね・濡れ時間により病原菌が広がりやすい状態です。" };
  }
  if ([9, 18, 19].includes(turn)) {
    return { icon: "🌬️", name: "強風", diseaseBonus: 0.045, vectorBonus: 0.015, text: "風で病原菌や媒介虫が移動しやすい状態です。" };
  }
  if ([11, 12].includes(turn)) {
    return { icon: "☀️", name: "高温乾燥", diseaseBonus: 0, vectorBonus: 0.06, text: "媒介虫が増えやすく、ウイルス病リスクが高まりやすい状態です。" };
  }
  return { icon: "⛅", name: "平常", diseaseBonus: 0, vectorBonus: 0, text: "標準的な感染リスクです。" };
}

function neighbors(id) {
  const r = Math.floor(id / SIZE);
  const c = id % SIZE;
  const out = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) {
        out.push(rr * SIZE + cc);
      }
    }
  }

  return out;
}

function sumEffects(plot) {
  const active = (plot.effects || []).filter((e) => e.remaining > 0);

  return {
    infectionReduction: clamp(active.reduce((s, e) => s + (e.infectionReduction || 0), 0), -0.3, 0.9),
    diseaseReduction: clamp(active.reduce((s, e) => s + (e.diseaseReduction || 0), 0), -0.3, 0.8),
    vectorReduction: clamp(active.reduce((s, e) => s + (e.vectorReduction || 0), 0), 0, 0.9),
    hasDiagnosis: active.some((e) => e.key === "monitor"),
    activeCount: active.length,
    names: active.map((e) => `${e.mark || ""}${e.name || e.key} 残${e.remaining >= 999 ? "永続" : e.remaining}`),
    marks: active.map((e) => e.mark).filter(Boolean),
  };
}

export default function App() {
  const [difficultyKey, setDifficultyKey] = useState("normal");
  const [cropKey, setCropKey] = useState("tomato");
  const [modeKey, setModeKey] = useState("comprehensive");
  const [targetMode, setTargetMode] = useState("selected");
  const [education, setEducation] = useState(true);

  const [research, setResearch] = useState({
    risk: 1.0,
    income: 12,
    initialPathogenPressure: 30,
    initialVectorLevel: 20,
  });

  const [plots, setPlots] = useState(createPlots);
  const [selected, setSelected] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [toolKey, setToolKey] = useState("monitor");
  const [turn, setTurn] = useState(1);
  const [money, setMoney] = useState(difficulties.normal.money);
  const [pathogenPressure, setPathogenPressure] = useState(30);
  const [vectorLevel, setVectorLevel] = useState(20);
  const [fungicideRes, setFungicideRes] = useState(0);
  const [insecticideRes, setInsecticideRes] = useState(0);
  const [restTurns, setRestTurns] = useState(0);
  const [actions, setActions] = useState({});
  const [log, setLog] = useState([
    "ゲーム開始。区画を選び、防除範囲と診断情報を確認しながらIPMを実践してください。",
  ]);
  const [lesson, setLesson] = useState(
    "教育モード：診断・トラップを実施している区画では、病原菌・媒介虫・防除効果などの詳細情報が表示されます。未診断区画では基本情報のみ表示されます。"
  );
  const [gameOver, setGameOver] = useState(false);

  const difficulty =
    difficultyKey === "research"
      ? { ...difficulties.research, risk: Number(research.risk), income: Number(research.income) }
      : difficulties[difficultyKey];

  const crop = cropModes[cropKey];
  const mode = diseaseModes[modeKey];
  const weather = weatherInfo(turn);
  const tool = tools[toolKey];

  const hoveredPlot = hoveredId === null ? null : plots.find((p) => p.id === hoveredId) || null;

  function getCenterIds() {
    if (targetMode === "all") {
      return plots.filter((p) => !p.dead || toolKey === "resistant").map((p) => p.id);
    }
    return selected;
  }

  function getTargetIds() {
    const centers = getCenterIds();

    if (tool.range === "single") {
      return [...new Set(centers)];
    }

    return [...new Set(centers.flatMap((id) => neighbors(id)))];
  }

  function getPreviewIds() {
    if (hoveredId !== null) {
      return tool.range === "single" ? [hoveredId] : neighbors(hoveredId);
    }

    const centers = getCenterIds();
    if (tool.range === "single") {
      return centers;
    }

    return [...new Set(centers.flatMap((id) => neighbors(id)))];
  }

  const previewIds = getPreviewIds();
  const activeEffectIds = plots
    .filter((p) => p.effects.some((e) => e.remaining > 0))
    .map((p) => p.id);

  const summary = useMemo(() => {
    const dead = plots.filter((p) => p.dead).length;
    const severe = plots.filter((p) => !p.dead && p.disease >= 70).length;
    const diseased = plots.filter((p) => !p.dead && p.disease >= 35).length;
    const latent = plots.filter((p) => !p.dead && p.disease < 35 && p.infection >= 45).length;
    const healthy = plots.length - dead - severe - diseased - latent;

    const yieldValue = Math.round(
      plots.reduce((sum, p) => {
        if (p.dead) return sum;
        const diseaseLoss = p.disease * 0.65;
        const infectionLoss = p.infection * 0.12;
        return sum + clamp(p.growth + 50 - diseaseLoss - infectionLoss, 0, 100);
      }, 0) / plots.length
    );

    return { healthy, latent, diseased, severe, dead, yieldValue };
  }, [plots]);

  const baseRisk = useMemo(() => {
    const pathogenPart =
      (pathogenPressure / 100) * 0.24 *
      difficulty.risk *
      crop.pathogenFactor *
      mode.pathogenRisk;

    const vectorPart =
      (vectorLevel / 100) * 0.19 *
      difficulty.risk *
      crop.vectorFactor *
      mode.vectorRisk;

    return clamp(pathogenPart + vectorPart + weather.diseaseBonus + weather.vectorBonus, 0.01, 0.9);
  }, [pathogenPressure, vectorLevel, difficulty.risk, crop, mode, weather]);

  const selectedPlots = plots.filter((p) => selected.includes(p.id));

  const selectedEffect = useMemo(() => {
    if (selectedPlots.length === 0) {
      return { infectionReduction: 0, diseaseReduction: 0, vectorReduction: 0 };
    }

    const total = selectedPlots.reduce(
      (acc, p) => {
        const e = sumEffects(p);
        acc.infectionReduction += e.infectionReduction;
        acc.diseaseReduction += e.diseaseReduction;
        acc.vectorReduction += e.vectorReduction;
        return acc;
      },
      { infectionReduction: 0, diseaseReduction: 0, vectorReduction: 0 }
    );

    return {
      infectionReduction: total.infectionReduction / selectedPlots.length,
      diseaseReduction: total.diseaseReduction / selectedPlots.length,
      vectorReduction: total.vectorReduction / selectedPlots.length,
    };
  }, [selectedPlots]);

  const selectedRisk = clamp(baseRisk * (1 - selectedEffect.infectionReduction), 0.005, 0.9);

  const hoveredRiskInfo = hoveredPlot
    ? (() => {
        const eff = sumEffects(hoveredPlot);
        const risk = clamp(
          baseRisk * (1 - eff.infectionReduction) * (1 - eff.vectorReduction * 0.35),
          0.005,
          0.9
        );
        return { eff, risk, reduction: clamp(baseRisk - risk, 0, 1) };
      })()
    : null;

  const ipmScore = useMemo(() => {
    const used = Object.keys(actions).filter((k) => actions[k] > 0);
    const types = new Set(used.map((k) => tools[k]?.type || "other"));
    let score = 50;

    if (used.includes("monitor")) score += 10;
    if ([...types].includes("bio")) score += 10;
    if ([...types].includes("physical")) score += 10;
    if ([...types].includes("host")) score += 8;
    if ([...types].includes("sanitation")) score += 5;
    if ((actions.fungicide || 0) + (actions.insecticide || 0) > 0 && types.size >= 3) score += 7;
    if ((actions.fungicide || 0) + (actions.insecticide || 0) >= 6) score -= 15;
    if (fungicideRes >= 0.55 || insecticideRes >= 0.55) score -= 15;
    if (summary.dead > 0) score -= summary.dead * 2;
    if (summary.diseased + summary.severe >= 8) score -= 10;
    if (summary.yieldValue >= 80) score += 5;

    return Math.round(clamp(score, 0, 100));
  }, [actions, fungicideRes, insecticideRes, summary]);

  const finalScore = Math.max(
    0,
    Math.round(summary.yieldValue * 8 + ipmScore * 4 + money - summary.diseased * 6 - summary.dead * 18)
  );

  function addLog(text) {
    setLog((prev) => [text, ...prev].slice(0, 15));
  }

  function educate(text) {
    if (education) setLesson(text);
  }

  function reset(nextDiff = difficultyKey, nextMode = modeKey, nextCrop = cropKey) {
    const d = nextDiff === "research" ? difficulties.research : difficulties[nextDiff];

    setDifficultyKey(nextDiff);
    setModeKey(nextMode);
    setCropKey(nextCrop);
    setPlots(createPlots());
    setSelected([]);
    setHoveredId(null);
    setToolKey("monitor");
    setTurn(1);
    setMoney(d.money);
    setPathogenPressure(nextDiff === "research" ? Number(research.initialPathogenPressure) : 35);
    setVectorLevel(nextDiff === "research" ? Number(research.initialVectorLevel) : 25);
    setFungicideRes(0);
    setInsecticideRes(0);
    setRestTurns(0);
    setActions({});
    setGameOver(false);
    setLog([`${d.name}・${diseaseModes[nextMode].name}・${cropModes[nextCrop].name}でリセットしました。`]);
    setLesson(`【作物モード】${cropModes[nextCrop].icon} ${cropModes[nextCrop].name}\n${cropModes[nextCrop].description}`);
  }

  function togglePlot(id) {
    if (gameOver) return;

    setHoveredId(id);
    setSelected([id]);

    applySelectedTool(toolKey, id);
  }

  function selectAll() {
    setSelected(plots.filter((p) => !p.dead).map((p) => p.id));
  }

  function clearSelection() {
    setSelected([]);
  }

  function adjustedTool(baseTool) {
    const t = { ...baseTool };

    if (baseTool.type === "chemicalFungicide") {
      const resistancePenalty = clamp(1 - fungicideRes * 0.85, 0.18, 1);
      t.infectionReduction *= mode.fungicideEffect * resistancePenalty;
      t.diseaseReduction *= mode.fungicideEffect * resistancePenalty;
      t.pathogenReduction *= mode.fungicideEffect * resistancePenalty;
    }

    if (baseTool.type === "chemicalInsecticide") {
      const resistancePenalty = clamp(1 - insecticideRes * 0.85, 0.18, 1);
      t.vectorReduction *= mode.insecticideEffect * resistancePenalty;
      t.infectionReduction *= mode.insecticideEffect * resistancePenalty;
    }

    if (baseTool.key === "microbe") {
      t.infectionReduction *= mode.microbeEffect;
      t.diseaseReduction *= mode.microbeEffect;
      t.pathogenReduction *= mode.microbeEffect;
    }

    if (baseTool.key === "enemy") {
      t.vectorReduction *= mode.enemyEffect;
      t.infectionReduction *= mode.enemyEffect;
    }

    return t;
  }

  function calculateCost(targetCount) {
    if (targetCount <= 0) return tool.cost;
    if (targetMode === "all") return Math.ceil(tool.cost * 2.2);
    if (tool.range === "single") return Math.ceil(tool.cost * 0.75 * targetCount);
    return Math.ceil(tool.cost * 0.35 * targetCount);
  }

  function applySelectedTool(selectedToolKey = toolKey, centerId = null) {
    if (gameOver) return;

    const currentTool = tools[selectedToolKey];

    if (!currentTool) {
      setLog((prev) => ["防除手段が正しく選択されていません。", ...prev].slice(0, 15));
      return;
    }

    const centerIds =
      centerId !== null
        ? [centerId]
        : selected.length > 0
        ? selected
        : [];

    if (centerIds.length === 0) {
      const msg = `先に区画をクリックしてください。現在選択中の防除手段は ${currentTool.mark} ${currentTool.name} です。`;
      setLog((prev) => [msg, ...prev].slice(0, 15));
      educate(`【操作案内】まず防除手段を選び、次に圃場マップ上の区画をクリックしてください。クリックした区画を中心に防除が実施されます。`);
      return;
    }

    const targetIds =
      currentTool.range === "single"
        ? [...new Set(centerIds)]
        : [...new Set(centerIds.flatMap((id) => neighbors(id)))];

    const cost = currentTool.cost;

    if (money < cost) {
      const msg = `資金不足です。${currentTool.name}の必要資金=${cost}、現在資金=${money}です。`;
      setLog((prev) => [msg, ...prev].slice(0, 15));
      educate(`【資金不足】${currentTool.name}は実行できません。必要資金=${cost}、現在資金=${money}です。`);
      return;
    }

    const t = adjustedTool({ ...currentTool, key: selectedToolKey });
    const aliveCount = Math.max(1, plots.filter((p) => !p.dead).length);
    const coverage = clamp(targetIds.length / aliveCount, 0, 1);

    setMoney((m) => m - cost);

    setPlots((prev) =>
      prev.map((p) => {
        if (!targetIds.includes(p.id)) return p;

        if (selectedToolKey === "roguing") {
          return {
            ...p,
            dead: true,
            disease: 0,
            infection: 0,
            effects: [
              {
                key: selectedToolKey,
                name: t.name,
                mark: t.mark,
                type: t.type,
                remaining: 999,
                infectionReduction: 0,
                diseaseReduction: 0,
                vectorReduction: 0,
              },
            ],
          };
        }

        const growthBonus = t.growthBonus || 0;

        return {
          ...p,
          growth: clamp(p.growth + growthBonus, 0, 100),
          pathogen: t.pathogenReduction < 0 ? true : p.pathogen && t.pathogenReduction <= 0,
          vector: t.vectorReduction > 0.35 ? false : p.vector,
          dead: selectedToolKey === "resistant" ? false : p.dead,
          infection: selectedToolKey === "resistant" ? Math.max(0, p.infection - 20) : p.infection,
          disease: selectedToolKey === "resistant" ? Math.max(0, p.disease - 25) : p.disease,
          effects: [
            ...(p.effects || []).filter((e) => e.key !== selectedToolKey || e.remaining <= 0),
            {
              key: selectedToolKey,
              name: t.name,
              mark: t.mark,
              type: t.type,
              remaining: t.duration || currentTool.duration || 3,
              infectionReduction: t.infectionReduction || 0,
              diseaseReduction: t.diseaseReduction || 0,
              vectorReduction: t.vectorReduction || 0,
            },
          ],
        };
      })
    );

    setPathogenPressure((p) => clamp(p - t.pathogenReduction * coverage, 0, 100));

    if (t.vectorReduction > 0) {
      setVectorLevel((v) => clamp(v * (1 - t.vectorReduction * coverage), 0, 100));
    }

    if (selectedToolKey === "fungicide") {
      setFungicideRes((v) => clamp(v + 0.12, 0, 1));
    }

    if (selectedToolKey === "insecticide") {
      setInsecticideRes((v) => clamp(v + 0.12, 0, 1));
    }

    if (selectedToolKey === "microbe") {
      setFungicideRes((v) => clamp(v - 0.04, 0, 1));
    }

    if (selectedToolKey === "enemy" || selectedToolKey === "net") {
      setInsecticideRes((v) => clamp(v - 0.04, 0, 1));
    }

    setActions((prev) => ({
      ...prev,
      [selectedToolKey]: (prev[selectedToolKey] || 0) + 1,
    }));

    setToolKey(selectedToolKey);

    const msg =
      currentTool.range === "single"
        ? `${currentTool.mark} ${currentTool.name}を区画${centerIds[0] + 1}に実施しました。影響区画=1、費用=${cost}。`
        : `${currentTool.mark} ${currentTool.name}を区画${centerIds[0] + 1}を中心に実施しました。影響区画=${targetIds.length}、費用=${cost}。`;

    setLog((prev) => [msg, ...prev].slice(0, 15));

    educate(
      `【防除実施】${currentTool.mark} ${currentTool.name}\n` +
      `${currentTool.edu}\n\n` +
      `クリック区画：${centerIds[0] + 1}\n` +
      `影響区画数：${targetIds.length}\n` +
      `費用：${cost}\n` +
      `範囲：${currentTool.range === "single" ? "クリック区画のみ" : "クリック区画を中心とする最大9区画"}`
    );
  }

  function useItem(key) {
    const item = items[key];
    if (!item || gameOver) return;

    if (money < item.cost) {
      addLog(`資金不足です。${item.name}には${item.cost}ポイント必要です。`);
      return;
    }

    setMoney((m) => m - item.cost);

    if (key === "rotate") {
      setFungicideRes((v) => clamp(v - 0.2, 0, 1));
      setInsecticideRes((v) => clamp(v - 0.2, 0, 1));
    }

    if (key === "rest") setRestTurns(3);
    if (key === "microbeBoost") setFungicideRes((v) => clamp(v - 0.25, 0, 1));
    if (key === "enemyBoost") setInsecticideRes((v) => clamp(v - 0.25, 0, 1));

    addLog(`${item.mark} ${item.name}を使用しました。`);
    educate(`【耐性管理】${item.mark} ${item.name}\n${item.edu}`);
  }

  function nextTurn() {
    if (gameOver) return;

    const newWeather = weatherInfo(turn + 1);
    const vectorEvent = Math.random() < 0.22;
    const vectorIncrease = vectorEvent ? Math.round(8 + Math.random() * 12) : Math.round(Math.random() * 4);

    const pathogenIncrease =
      newWeather.name === "長雨" || newWeather.name === "強風"
        ? Math.round(5 + Math.random() * 7)
        : Math.round(1 + Math.random() * 4);

    const nextVector = clamp(
      vectorLevel + vectorIncrease * crop.vectorFactor * mode.vectorRisk,
      0,
      100
    );

    const nextPathogen = clamp(
      pathogenPressure + pathogenIncrease * crop.pathogenFactor * mode.pathogenRisk,
      0,
      100
    );

    const pathogenPart =
      (nextPathogen / 100) * 0.24 *
      difficulty.risk *
      crop.pathogenFactor *
      mode.pathogenRisk;

    const vectorPart =
      (nextVector / 100) * 0.19 *
      difficulty.risk *
      crop.vectorFactor *
      mode.vectorRisk;

    const wholeRisk = clamp(pathogenPart + vectorPart + newWeather.diseaseBonus + newWeather.vectorBonus, 0.01, 0.9);

    const nextPlots = plots.map((p) => {
      if (p.dead) return p;

      const eff = sumEffects(p);
      const localRisk = clamp(
        wholeRisk * (1 - eff.infectionReduction) * (1 - eff.vectorReduction * 0.35),
        0.005,
        0.9
      );

      const localVectorEvent = Math.random() < 0.06 * mode.vectorRisk;
      const localPathogenEvent = Math.random() < 0.06 * mode.pathogenRisk;

      const infectionGain = localRisk * 100 * (0.45 + Math.random() * 0.75);
      const infection = clamp(p.infection + infectionGain, 0, 100);

      let diseaseGain = 0;

      if (infection >= 45) {
        diseaseGain =
          (infection - 35) * 0.075 *
          difficulty.risk *
          crop.deathFactor *
          mode.pathogenRisk;
      }

      diseaseGain +=
        (nextPathogen / 100) * 3.0 *
        crop.pathogenFactor *
        mode.pathogenRisk;

      diseaseGain *= 1 - eff.diseaseReduction;

      const recovery = p.effects.some((e) => e.key === "microbe" || e.key === "rainShelter" || e.key === "immunity")
        ? 2.0 : 0.55;

      const disease = clamp(p.disease + diseaseGain - recovery, 0, 100);
      const growth = clamp(p.growth + 4.6 * difficulty.growth * crop.growthFactor - disease / 48, 0, 100);

      const nextEffects = p.effects
        .map((e) => ({
          ...e,
          remaining: Math.max(0, e.remaining >= 999 ? 999 : e.remaining - 1),
        }))
        .filter((e) => e.remaining > 0);

      return {
        ...p,
        infection,
        disease,
        growth,
        vector: p.vector || localVectorEvent,
        pathogen: p.pathogen || localPathogenEvent,
        dead: disease >= 100,
        effects: nextEffects,
      };
    });

    let eventPlots = nextPlots;
    let adjustedNextVector = nextVector;
    let adjustedNextPathogen = nextPathogen;
    const naturalLogs = [];

    const naturalRoll = Math.random();
    let naturalType = "none";

    if (naturalRoll < naturalEventSettings.bothProb) {
      naturalType = "both";
    } else if (naturalRoll < naturalEventSettings.bothProb + naturalEventSettings.enemyProb) {
      naturalType = "enemy";
    } else if (
      naturalRoll <
      naturalEventSettings.bothProb +
        naturalEventSettings.enemyProb +
        naturalEventSettings.microbeProb
    ) {
      naturalType = "microbe";
    }

    if (naturalType !== "none") {
      const alivePlots = eventPlots.filter((p) => !p.dead);

      if (alivePlots.length > 0) {
        const center = alivePlots[Math.floor(Math.random() * alivePlots.length)];
        const naturalTargetIds = neighbors(center.id);
        const naturalCoverage = clamp(
          naturalTargetIds.length / Math.max(1, alivePlots.length),
          0,
          1
        );

        if (naturalType === "enemy" || naturalType === "both") {
          eventPlots = eventPlots.map((p) => {
            if (!naturalTargetIds.includes(p.id) || p.dead) return p;

            return {
              ...p,
              vector: false,
              effects: [
                ...(p.effects || []).filter((e) => e.key !== "naturalEnemy" || e.remaining <= 0),
                {
                  key: "naturalEnemy",
                  name: "天然天敵",
                  mark: "🐞",
                  type: "natural",
                  remaining: naturalEventSettings.duration,
                  infectionReduction: naturalEventSettings.enemyInfectionReduction,
                  diseaseReduction: 0.02,
                  vectorReduction: naturalEventSettings.enemyVectorReduction,
                },
              ],
            };
          });

          adjustedNextVector = clamp(
            adjustedNextVector - 10 * naturalCoverage,
            0,
            100
          );

          naturalLogs.push(
            `🐞 天然天敵が区画${center.id + 1}周辺に発生しました。影響区画=${naturalTargetIds.length}、効果=${naturalEventSettings.duration}ターン。`
          );
        }

        if (naturalType === "microbe" || naturalType === "both") {
          eventPlots = eventPlots.map((p) => {
            if (!naturalTargetIds.includes(p.id) || p.dead) return p;

            return {
              ...p,
              pathogen: false,
              effects: [
                ...(p.effects || []).filter((e) => e.key !== "naturalMicrobe" || e.remaining <= 0),
                {
                  key: "naturalMicrobe",
                  name: "天然拮抗微生物",
                  mark: "🌱",
                  type: "natural",
                  remaining: naturalEventSettings.duration,
                  infectionReduction: naturalEventSettings.microbeInfectionReduction,
                  diseaseReduction: naturalEventSettings.microbeDiseaseReduction,
                  vectorReduction: 0,
                },
              ],
            };
          });

          adjustedNextPathogen = clamp(
            adjustedNextPathogen - naturalEventSettings.microbePathogenReduction * naturalCoverage,
            0,
            100
          );

          naturalLogs.push(
            `🌱 天然拮抗微生物が区画${center.id + 1}周辺に発生しました。影響区画=${naturalTargetIds.length}、効果=${naturalEventSettings.duration}ターン。`
          );
        }
      }
    }

    setPlots(eventPlots);
    setVectorLevel(adjustedNextVector);
    setPathogenPressure(adjustedNextPathogen);

    naturalLogs.forEach((m) => addLog(m));
    setMoney((m) => clamp(m + Math.round(difficulty.income * crop.growthFactor) - Math.round(summary.dead * 0.5), 0, 999));

    if (restTurns > 0) {
      setRestTurns((v) => v - 1);
      setFungicideRes((v) => clamp(v - 0.05, 0, 1));
      setInsecticideRes((v) => clamp(v - 0.05, 0, 1));
    } else {
      setFungicideRes((v) => clamp(v - 0.015, 0, 1));
      setInsecticideRes((v) => clamp(v - 0.015, 0, 1));
    }

    addLog(
      `ターン${turn}終了。${newWeather.icon}${newWeather.name}。基礎感染確率=${pct(
        wholeRisk
      )}、病原菌圧=${Math.round(nextPathogen)}、媒介虫=${Math.round(nextVector)}。${
        vectorEvent ? "媒介虫がランダム発生しました。" : "小規模な変動でした。"
      }`
    );

    if (turn >= MAX_TURN) {
      setGameOver(true);
      const label = ipmScore >= 80 ? "優良" : ipmScore >= 60 ? "良好" : ipmScore >= 40 ? "要改善" : "大きく改善が必要";
      setLesson(
        `【ゲーム終了評価】\n収量点=${summary.yieldValue}、IPM評価=${ipmScore}点（${label}）、総合スコア=${finalScore}点。\n\n殺菌剤耐性=${level(fungicideRes)}、殺虫剤抵抗性=${level(insecticideRes)}。\n診断・物理防除・生物防除・抵抗性利用を組み合わせるほどIPM評価が高くなります。天然天敵や天然拮抗微生物が発生した場合は、自然抑制効果も防除効果として活用できます。`
      );
    } else {
      setTurn((t) => t + 1);
    }
  }

  const yieldLabel =
    summary.yieldValue >= 85
      ? "優秀"
      : summary.yieldValue >= 70
      ? "良好"
      : summary.yieldValue >= 50
      ? "要改善"
      : "大きな被害";

  return (
    <div style={styles.app}>
      <section style={styles.card}>
        <h1 style={styles.h1}>植物病害防除ゲーム：診断・範囲表示整理版</h1>
        <p style={styles.text}>
          防除効果継続中の区画に「継続」表示を残し、範囲型防除では中心区画と影響予定区画を区別して表示します。
          診断・トラップを実施した区画だけ、病原菌・媒介虫・推定リスクなどの詳細情報を表示します。
        </p>

        <div style={styles.controlGrid}>
          <Control label="難易度">
            <select style={styles.input} value={difficultyKey} onChange={(e) => reset(e.target.value, modeKey, cropKey)}>
              {Object.entries(difficulties).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
          </Control>

          <Control label="作物モード">
            <select style={styles.input} value={cropKey} onChange={(e) => reset(difficultyKey, modeKey, e.target.value)}>
              {Object.entries(cropModes).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.name}</option>
              ))}
            </select>
          </Control>

          <Control label="病害モード">
            <select style={styles.input} value={modeKey} onChange={(e) => reset(difficultyKey, e.target.value, cropKey)}>
              {Object.entries(diseaseModes).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.name}</option>
              ))}
            </select>
          </Control>

          <Control label="防除対象">
            <select style={styles.input} value={targetMode} onChange={(e) => setTargetMode(e.target.value)}>
              <option value="selected">選択区画</option>
              <option value="all">圃場全体</option>
            </select>
          </Control>

          <Control label="教育モード">
            <select style={styles.input} value={education ? "on" : "off"} onChange={(e) => setEducation(e.target.value === "on")}>
              <option value="on">ON</option>
              <option value="off">OFF</option>
            </select>
          </Control>
        </div>

        {difficultyKey === "research" && (
          <div style={{ ...styles.controlGrid, marginTop: 10 }}>
            <Control label="リスク倍率">
              <input style={styles.input} type="number" step="0.1" value={research.risk}
                onChange={(e) => setResearch({ ...research, risk: e.target.value })} />
            </Control>
            <Control label="収入/ターン">
              <input style={styles.input} type="number" value={research.income}
                onChange={(e) => setResearch({ ...research, income: e.target.value })} />
            </Control>
            <Control label="初期病原菌圧">
              <input style={styles.input} type="number" value={research.initialPathogenPressure}
                onChange={(e) => setResearch({ ...research, initialPathogenPressure: e.target.value })} />
            </Control>
            <Control label="初期媒介虫">
              <input style={styles.input} type="number" value={research.initialVectorLevel}
                onChange={(e) => setResearch({ ...research, initialVectorLevel: e.target.value })} />
            </Control>
          </div>
        )}
      </section>

      <div style={styles.twoColumn}>
        <section style={styles.card}>
          <h2 style={styles.h2}>現在の状態</h2>
          <div style={styles.metricGrid}>
            <Metric title="ターン" value={`${turn}/${MAX_TURN}`} />
            <Metric title="資金" value={money} />
            <Metric title="天候" value={`${weather.icon}${weather.name}`} />
            <Metric title="病原菌圧" value={Math.round(pathogenPressure)} />
            <Metric title="媒介虫" value={Math.round(vectorLevel)} />
            <Metric title="基礎感染確率" value={pct(baseRisk)} />
            <Metric title="選択区画リスク" value={pct(selectedRisk)} />
            <Metric title="収量点" value={summary.yieldValue} />
            <Metric title="IPM評価" value={ipmScore} />
            <Metric title="総合スコア" value={finalScore} />
          </div>

          <p style={styles.text}>{crop.icon} {crop.name}：{crop.description}</p>
          <p style={styles.text}>{mode.icon} {mode.name}：{mode.description}</p>
          <p style={styles.text}>{weather.icon} {weather.text}</p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>薬剤耐性</h2>
          <div style={styles.metricGrid}>
            <Metric title="化学殺菌剤耐性" value={`${level(fungicideRes)} ${fungicideRes.toFixed(2)}`} />
            <Metric title="化学殺虫剤抵抗性" value={`${level(insecticideRes)} ${insecticideRes.toFixed(2)}`} />
            <Metric title="休薬期間" value={restTurns > 0 ? `残り${restTurns}` : "なし"} />
          </div>

          <div style={styles.defenseGrid}>
            {Object.entries(items).map(([k, item]) => (
              <button key={k} style={styles.itemButton} onClick={() => useItem(k)} disabled={gameOver}>
                <b>{item.mark} {item.name}</b>
                <br />
                費用 {item.cost}
              </button>
            ))}
          </div>
        </section>
      </div>

      {education && (
        <section style={{ ...styles.card, background: "#ebf8ff", borderColor: "#bee3f8" }}>
          <h2 style={styles.h2}>教育モード解説</h2>
          <pre style={styles.lesson}>{lesson}</pre>
        </section>
      )}

      {gameOver && (
        <section style={{ ...styles.card, background: "#fffaf0", borderColor: "#fbd38d" }}>
          <h2 style={styles.h2}>ゲーム終了後評価</h2>
          <p style={styles.text}>
            収量評価：<b>{yieldLabel}</b> / 収量点：<b>{summary.yieldValue}</b> /
            IPM評価：<b>{ipmScore}</b> / 総合スコア：<b>{finalScore}</b>
          </p>
        </section>
      )}

      <div style={styles.twoColumn}>
        <section style={styles.card}>
          <h2 style={styles.h2}>圃場マップ</h2>
          <p style={styles.text}>
            先に防除手段を選び、次に圃場区画をクリックすると防除が実施されます。範囲型はクリック区画を中心に最大9区画へ自動的に影響します。単一区画型はクリック区画のみに作用します。緑枠・継続＝防除効果が継続中の区画です。
          </p>

          <div style={styles.buttonLine}><button style={styles.button} onClick={nextTurn} disabled={gameOver}>1ターン進める</button>
            <button style={styles.buttonRed} onClick={() => reset()}>リセット</button>
          </div>

          <div style={styles.fieldGrid}>
            {plots.map((p) => {
              const st = getStatus(p);
              const isSelected = selected.includes(p.id);
              const isPreview = previewIds.includes(p.id);
              const eff = sumEffects(p);
              const isActive = eff.activeCount > 0;
              const isCenter = hoveredId === p.id || selected.includes(p.id);

              let outline = "1px solid rgba(0,0,0,0.12)";
              if (isSelected) outline = "4px solid #2563eb";
              else if (isPreview) outline = "3px dashed #60a5fa";
              else if (isActive) outline = "3px solid #22c55e";

              return (
                <button
                  key={p.id}
                  onClick={() => togglePlot(p.id)}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onFocus={() => setHoveredId(p.id)}
                  style={{
                    ...styles.plot,
                    background: st.color,
                    color: st.text,
                    outline,
                    transform: isSelected ? "scale(1.03)" : "scale(1)",
                  }}
                >
                  <div>{p.dead ? "💀" : crop.icon}{st.mark}</div>
                  <div>{st.label}</div>
                  <div>病勢 {Math.round(p.disease)}</div>
                  <div style={{ fontSize: 10 }}>防除 {pct(eff.infectionReduction)}</div>
                  {eff.marks && eff.marks.length > 0 && (
                    <div
                      title={eff.names.join("、")}
                      style={{
                        marginTop: 2,
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        justifyContent: "center",
                        maxWidth: "100%",
                        fontSize: 13,
                        lineHeight: 1.1,
                      }}
                    >
                      {eff.marks.slice(0, 5).map((m, i) => (
                        <span key={`${m}-${i}`}>{m}</span>
                      ))}
                      {eff.marks.length > 5 && (
                        <span style={{ fontSize: 10 }}>+{eff.marks.length - 5}</span>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: 12 }}>
                    {p.vector && !p.dead ? "🐛" : ""}{p.pathogen && !p.dead && eff.hasDiagnosis ? "🧫" : ""}
                  </div>

                  {isPreview && !p.dead && (
                    <div style={{
                      marginTop: 2,
                      padding: "1px 5px",
                      borderRadius: 999,
                      background: isCenter ? "#2563eb" : "#bfdbfe",
                      color: isCenter ? "white" : "#1e3a8a",
                      fontSize: 10,
                      fontWeight: 800,
                    }}>
                      {isCenter ? "中心" : "影響予定"}
                    </div>
                  )}

                  {isActive && (
                    <div style={{
                      marginTop: 2,
                      padding: "1px 5px",
                      borderRadius: 999,
                      background: "#bbf7d0",
                      color: "#166534",
                      fontSize: 10,
                      fontWeight: 800,
                    }}>
                      {p.dead ? "抜取済" : `継続${eff.activeCount}`}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ ...styles.metricGrid, marginTop: 10 }}>
            <Metric title="健全" value={summary.healthy} />
            <Metric title="潜伏" value={summary.latent} />
            <Metric title="発病" value={summary.diseased} />
            <Metric title="重症" value={summary.severe} />
            <Metric title="枯死" value={summary.dead} />
            <Metric title="選択区画" value={selected.length} />
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>防除手段</h2>
          <p style={styles.text}>
            防除手段をクリックして選択してください。その後、圃場マップ上の区画をクリックすると実施されます。現在選択中：<b>{tool.mark} {tool.name}</b> / 範囲：
            <b>{tool.range === "single" ? "単一区画のみ" : "中心＋周囲8区画"}</b>
            <br />
            {tool.range === "single"
              ? "この防除手段は選択した区画のみに作用します。"
              : "この防除手段は中心区画だけでなく、周囲8区画にも作用します。"}
          </p>

          <div style={styles.defenseGrid}>
            {Object.entries(tools).map(([key, t]) => (
              <button
                key={key}
                style={{
                  ...styles.toolButton,
                  border: toolKey === key ? "3px solid #059669" : "1px solid #cbd5e1",
                  background: toolKey === key ? "#d1fae5" : "white",
                }}
                onClick={() => {
                  setToolKey(key);
                  educate(`【防除選択】${t.mark} ${t.name}\n${t.edu}\n\n次に、圃場マップ上の区画をクリックすると実施されます。`);
                }}
              >
                <b>{t.mark} {t.name}</b>
                <br />
                費用 {t.cost} / {t.group}
                <br />
                <span style={{ fontSize: 11 }}>
                  {t.range === "single" ? "単一区画" : "中心＋周囲"}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div style={styles.twoColumn}>
        <section style={styles.card}>
          <h2 style={styles.h2}>カーソル区画の詳細</h2>
          {!hoveredPlot ? (
            <p style={styles.text}>
              区画にカーソルを合わせる、または区画をクリックすると、この欄に区画情報が表示されます。
            </p>
          ) : (
            <HoverDetail
              plot={hoveredPlot}
              riskInfo={hoveredRiskInfo}
              baseRisk={baseRisk}
            />
          )}
        </section>
      </div>

      <section style={styles.card}>
        <h2 style={styles.h2}>メッセージログ</h2>
        <ul style={styles.log}>
          {log.map((l, i) => (
            <li key={`${l}-${i}`}>{l}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function HoverDetail({ plot, riskInfo, baseRisk }) {
  const st = getStatus(plot);
  const eff = riskInfo.eff;

  return (
    <div style={styles.detailBox}>
      <b>区画 {plot.id + 1}：{st.label}</b>

      <div style={styles.smallText}>
        感染度={Math.round(plot.infection)} / 病勢={Math.round(plot.disease)} / 成長={Math.round(plot.growth)}
      </div>

      {!eff.hasDiagnosis ? (
        <>
          <div style={styles.warningBox}>
            🔍 この区画では診断・トラップが有効ではありません。
            <br />
            詳細な病原菌・媒介虫・推定リスク情報は表示されません。
          </div>
          <div style={styles.smallText}>
            表示可能情報：感染度、病勢、成長、症状ステージ、防除継続の有無。
          </div>
        </>
      ) : (
        <>
          <div style={styles.smallText}>
            媒介虫={plot.vector ? "あり" : "低い"} / 病原菌={plot.pathogen ? "あり" : "低い"}
          </div>
          <div style={styles.smallText}>
            防除前推定感染確率={pct(baseRisk)} / 防除後推定感染確率={pct(riskInfo.risk)} / 低下量={pct(riskInfo.reduction)}
          </div>
          <div style={styles.smallText}>
            感染低下={pct(eff.infectionReduction)} / 病勢抑制={pct(eff.diseaseReduction)} / 媒介虫低下={pct(eff.vectorReduction)}
          </div>
        </>
      )}

      <div style={styles.smallText}>
        有効防除：{eff.names.length === 0 ? "なし" : eff.names.join("、")}
      </div>
    </div>
  );
}

function Control({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#52606d" }}>{label}</label>
      {children}
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div style={styles.metric}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#52606d" }}>{title}</div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f3f7f0",
    padding: 18,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1f2933",
  },
  card: {
    background: "white",
    border: "1px solid #d9e2d0",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 8px 20px rgba(31,41,51,0.08)",
    marginBottom: 14,
  },
  h1: { marginTop: 0, marginBottom: 8, fontSize: 26 },
  h2: { marginTop: 0, marginBottom: 10, fontSize: 18 },
  text: { fontSize: 14, lineHeight: 1.6, color: "#3f4d5a" },
  smallText: { fontSize: 12, lineHeight: 1.5, color: "#52606d" },
  lesson: {
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    lineHeight: 1.6,
    margin: 0,
  },
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
    gap: 14,
  },
  controlGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 10,
  },
  input: {
    width: "100%",
    border: "1px solid #cbd5c0",
    borderRadius: 12,
    padding: 8,
    background: "#fbfff8",
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 8,
  },
  metric: {
    background: "#f7fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 10,
  },
  buttonLine: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  button: {
    border: 0,
    borderRadius: 14,
    padding: "10px 12px",
    background: "#2f855a",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  buttonRed: {
    border: 0,
    borderRadius: 14,
    padding: "10px 12px",
    background: "#c53030",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  buttonGray: {
    border: 0,
    borderRadius: 14,
    padding: "10px 12px",
    background: "#718096",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
    gap: 6,
  },
  plot: {
    minHeight: 86,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "0.12s",
  },
  defenseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 8,
  },
  toolButton: {
    padding: 8,
    borderRadius: 12,
    cursor: "pointer",
    textAlign: "left",
  },
  itemButton: {
    padding: 8,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    textAlign: "left",
  },
  detailList: {
    display: "grid",
    gap: 8,
  },
  detailBox: {
    background: "#f7fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 10,
  },
  warningBox: {
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
    borderRadius: 12,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    fontSize: 12,
    lineHeight: 1.5,
  },
  log: {
    maxHeight: 280,
    overflow: "auto",
    lineHeight: 1.5,
    paddingLeft: 20,
  },
};









