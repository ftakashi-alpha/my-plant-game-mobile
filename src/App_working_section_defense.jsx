import React, { useMemo, useState } from "react";

const SIZE = 6;
const MAX_TURN = 20;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const pct = (v) => `${Math.round(v * 100)}%`;

const difficulties = {
  easy: { name: "やさしい", money: 180, income: 16, risk: 0.75 },
  normal: { name: "ふつう", money: 140, income: 12, risk: 1.0 },
  hard: { name: "むずかしい", money: 100, income: 9, risk: 1.35 },
  research: { name: "研究用調整", money: 140, income: 12, risk: 1.0 },
};

const crops = {
  tomato: {
    name: "トマト",
    mark: "ト",
    pathogenFactor: 1.0,
    vectorFactor: 1.0,
    deathFactor: 1.0,
    text: "標準的な作物です。病原菌圧と媒介虫リスクの両方を受けます。",
  },
  cucumber: {
    name: "キュウリ",
    mark: "キ",
    pathogenFactor: 0.9,
    vectorFactor: 1.25,
    deathFactor: 0.95,
    text: "媒介虫リスクがやや高い作物です。ウイルス病管理の学習に向きます。",
  },
  potato: {
    name: "ジャガイモ",
    mark: "ジ",
    pathogenFactor: 1.25,
    vectorFactor: 0.85,
    deathFactor: 1.15,
    text: "病原菌圧の影響を受けやすい作物です。糸状菌病・細菌病の管理に向きます。",
  },
};

const diseaseModes = {
  standard: {
    name: "標準モード",
    pathogenRisk: 1.0,
    vectorRisk: 1.0,
    fungicideEffect: 1.0,
    microbeEffect: 1.0,
    enemyEffect: 1.0,
    text: "病原菌圧と媒介虫の両方を管理する総合モードです。",
  },
  virus: {
    name: "ウイルスモード",
    pathogenRisk: 0.25,
    vectorRisk: 1.85,
    fungicideEffect: 0.15,
    microbeEffect: 0.35,
    enemyEffect: 1.35,
    text: "媒介虫による伝搬が主なリスクです。天敵・媒介虫管理が重要です。",
  },
  fungal: {
    name: "糸状菌モード",
    pathogenRisk: 1.75,
    vectorRisk: 0.35,
    fungicideEffect: 1.35,
    microbeEffect: 1.25,
    enemyEffect: 0.6,
    text: "病原菌圧と環境条件の影響が大きいモードです。薬剤・圃場衛生・微生物資材が重要です。",
  },
  bacterial: {
    name: "細菌モード",
    pathogenRisk: 1.45,
    vectorRisk: 0.45,
    fungicideEffect: 0.55,
    microbeEffect: 1.15,
    enemyEffect: 0.7,
    text: "雨滴・水はね・傷口感染を想定します。圃場衛生・微生物資材が重要です。",
  },
};

const defenses = [
  {
    id: "diagnosis",
    name: "診断・トラップ調査",
    type: "モニタリング",
    cost: 10,
    duration: 3,
    infectionReduction: 0.06,
    diseaseReduction: 0.04,
    pathogenReduction: 0,
    vectorReduction: 0.08,
    resistanceUp: 0,
    resistanceDown: 0,
    text: "早期検知によりリスクを把握します。直接効果は小さいですが、IPM評価に有利です。",
  },
  {
    id: "sanitation",
    name: "圃場衛生",
    type: "耕種的防除",
    cost: 20,
    duration: 4,
    infectionReduction: 0.12,
    diseaseReduction: 0.08,
    pathogenReduction: 16,
    vectorReduction: 0,
    resistanceUp: 0,
    resistanceDown: 0,
    text: "罹病株除去、残渣処理、排水改善により病原菌圧を下げます。",
  },
  {
    id: "fungicide",
    name: "薬剤防除",
    type: "化学的防除",
    cost: 26,
    duration: 3,
    infectionReduction: 0.32,
    diseaseReduction: 0.18,
    pathogenReduction: 8,
    vectorReduction: 0,
    resistanceUp: 9,
    resistanceDown: 0,
    text: "短期効果は高いですが、連用により薬剤耐性リスクが上昇します。",
  },
  {
    id: "microbe",
    name: "微生物資材",
    type: "生物的防除",
    cost: 24,
    duration: 5,
    infectionReduction: 0.2,
    diseaseReduction: 0.12,
    pathogenReduction: 12,
    vectorReduction: 0,
    resistanceUp: 0,
    resistanceDown: 0,
    text: "拮抗微生物などにより病原菌圧を抑える持続型の防除です。",
  },
  {
    id: "enemy",
    name: "天敵・媒介虫管理",
    type: "生物的防除",
    cost: 24,
    duration: 4,
    infectionReduction: 0.08,
    diseaseReduction: 0.04,
    pathogenReduction: 0,
    vectorReduction: 0.42,
    resistanceUp: 0,
    resistanceDown: 0,
    text: "媒介虫密度を下げます。特にウイルス病モードで有効です。",
  },
  {
    id: "resistant",
    name: "抵抗性品種",
    type: "品種抵抗性",
    cost: 36,
    duration: 8,
    infectionReduction: 0.26,
    diseaseReduction: 0.16,
    pathogenReduction: 0,
    vectorReduction: 0,
    resistanceUp: 0,
    resistanceDown: 0,
    text: "感染・発病確率を持続的に下げます。他の手段との併用が重要です。",
  },
  {
    id: "rotation",
    name: "輪作・薬剤ローテーション",
    type: "抵抗性管理",
    cost: 28,
    duration: 5,
    infectionReduction: 0.1,
    diseaseReduction: 0.06,
    pathogenReduction: 16,
    vectorReduction: 0,
    resistanceUp: 0,
    resistanceDown: 16,
    text: "病原菌圧と薬剤耐性リスクを同時に下げます。IPM評価に有利です。",
  },
];

function initialPlots() {
  return Array.from({ length: SIZE * SIZE }, (_, i) => ({
    id: i,
    infection: i === 14 || i === 21 ? 32 : 0,
    disease: i === 14 || i === 21 ? 12 : 0,
    dead: false,
    effects: [],
  }));
}

function plotStatus(p) {
  if (p.dead) return { label: "枯死", bg: "#4a5568", color: "white" };
  if (p.disease >= 70) return { label: "重症", bg: "#fc8181", color: "#1a202c" };
  if (p.disease >= 35) return { label: "発病", bg: "#f6ad55", color: "#1a202c" };
  if (p.infection >= 45) return { label: "潜伏", bg: "#faf089", color: "#1a202c" };
  return { label: "健全", bg: "#c6f6d5", color: "#1a202c" };
}

function sumPlotEffects(plot) {
  const activeEffects = plot.effects.filter((e) => e.remaining > 0);

  const infectionReduction = clamp(
    activeEffects.reduce((s, e) => s + e.infectionReduction, 0),
    0,
    0.86
  );

  const diseaseReduction = clamp(
    activeEffects.reduce((s, e) => s + e.diseaseReduction, 0),
    0,
    0.75
  );

  const vectorReduction = clamp(
    activeEffects.reduce((s, e) => s + e.vectorReduction, 0),
    0,
    0.8
  );

  return { infectionReduction, diseaseReduction, vectorReduction };
}

export default function App() {
  const [difficulty, setDifficulty] = useState("normal");
  const [cropKey, setCropKey] = useState("tomato");
  const [modeKey, setModeKey] = useState("standard");
  const [education, setEducation] = useState(true);
  const [targetMode, setTargetMode] = useState("selected");

  const [research, setResearch] = useState({
    risk: 1.0,
    income: 12,
    initialPathogen: 34,
    initialVector: 22,
  });

  const [turn, setTurn] = useState(1);
  const [money, setMoney] = useState(difficulties.normal.money);
  const [plots, setPlots] = useState(initialPlots);
  const [selected, setSelected] = useState([]);
  const [pathogenPressure, setPathogenPressure] = useState(34);
  const [vectorLevel, setVectorLevel] = useState(22);
  const [resistance, setResistance] = useState(0);
  const [usedDefenseIds, setUsedDefenseIds] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [logs, setLogs] = useState([
    "ゲーム開始。区画をクリックして選択し、防除手段を選んでください。",
  ]);

  const diff =
    difficulty === "research"
      ? {
          ...difficulties.research,
          risk: Number(research.risk),
          income: Number(research.income),
        }
      : difficulties[difficulty];

  const crop = crops[cropKey];
  const mode = diseaseModes[modeKey];

  const selectedPlots = plots.filter((p) => selected.includes(p.id));

  const summary = useMemo(() => {
    const dead = plots.filter((p) => p.dead).length;
    const severe = plots.filter((p) => !p.dead && p.disease >= 70).length;
    const diseased = plots.filter((p) => !p.dead && p.disease >= 35).length;
    const latent = plots.filter(
      (p) => !p.dead && p.disease < 35 && p.infection >= 45
    ).length;
    const healthy = plots.length - dead - severe - diseased - latent;

    const yieldScore = Math.round(
      plots.reduce((sum, p) => {
        if (p.dead) return sum;
        return sum + clamp(100 - p.disease * 0.8 - p.infection * 0.15, 0, 100);
      }, 0) / plots.length
    );

    return { healthy, latent, diseased, severe, dead, yieldScore };
  }, [plots]);

  const baseRisk = useMemo(() => {
    const pathogenPart =
      (pathogenPressure / 100) *
      0.26 *
      diff.risk *
      crop.pathogenFactor *
      mode.pathogenRisk;

    const vectorPart =
      (vectorLevel / 100) *
      0.22 *
      diff.risk *
      crop.vectorFactor *
      mode.vectorRisk;

    const resistancePenalty = 1 + resistance / 180;

    return clamp((pathogenPart + vectorPart) * resistancePenalty, 0.01, 0.85);
  }, [pathogenPressure, vectorLevel, diff.risk, crop, mode, resistance]);

  const selectedEffectSummary = useMemo(() => {
    if (selectedPlots.length === 0) {
      return { infectionReduction: 0, diseaseReduction: 0, vectorReduction: 0 };
    }

    const total = selectedPlots.reduce(
      (acc, p) => {
        const e = sumPlotEffects(p);
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

  const adjustedRiskForSelected = clamp(
    baseRisk * (1 - selectedEffectSummary.infectionReduction),
    0.005,
    0.9
  );

  const ipmScore = useMemo(() => {
    const usedTypes = new Set(
      defenses.filter((d) => usedDefenseIds.includes(d.id)).map((d) => d.type)
    ).size;

    const diagnosis = usedDefenseIds.includes("diagnosis") ? 18 : 0;
    const rotation = usedDefenseIds.includes("rotation") ? 18 : 0;
    const resistanceBonus = resistance < 35 ? 16 : resistance < 60 ? 8 : 0;
    const diversity = usedTypes * 8;
    const yieldBonus = Math.round(summary.yieldScore / 5);

    return clamp(
      diagnosis + rotation + resistanceBonus + diversity + yieldBonus,
      0,
      100
    );
  }, [usedDefenseIds, resistance, summary.yieldScore]);

  const finalScore = Math.round(
    summary.yieldScore * 7 +
      ipmScore * 4 -
      summary.dead * 18 -
      resistance * 1.4 +
      money * 0.3
  );

  function addLog(message) {
    setLogs((prev) => [message, ...prev].slice(0, 15));
  }

  function resetGame(nextDifficulty = difficulty) {
    const d =
      nextDifficulty === "research"
        ? difficulties.research
        : difficulties[nextDifficulty];

    setTurn(1);
    setMoney(d.money);
    setPlots(initialPlots());
    setSelected([]);
    setPathogenPressure(
      nextDifficulty === "research" ? Number(research.initialPathogen) : 34
    );
    setVectorLevel(
      nextDifficulty === "research" ? Number(research.initialVector) : 22
    );
    setResistance(0);
    setUsedDefenseIds([]);
    setScore(0);
    setGameOver(false);
    setLogs(["ゲームをリセットしました。区画を選択して防除を開始してください。"]);
  }

  function changeDifficulty(value) {
    setDifficulty(value);
    setTimeout(() => resetGame(value), 0);
  }

  function togglePlot(id) {
    if (gameOver) return;

    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelected(plots.filter((p) => !p.dead).map((p) => p.id));
  }

  function clearSelection() {
    setSelected([]);
  }

  function adjustedDefense(def) {
    const d = { ...def };

    if (def.id === "fungicide") {
      d.infectionReduction *= mode.fungicideEffect;
      d.diseaseReduction *= mode.fungicideEffect;
      d.pathogenReduction *= mode.fungicideEffect;

      const resistanceLoss = clamp(1 - resistance / 130, 0.25, 1);
      d.infectionReduction *= resistanceLoss;
      d.diseaseReduction *= resistanceLoss;
    }

    if (def.id === "microbe") {
      d.infectionReduction *= mode.microbeEffect;
      d.diseaseReduction *= mode.microbeEffect;
      d.pathogenReduction *= mode.microbeEffect;
    }

    if (def.id === "enemy") {
      d.infectionReduction *= mode.enemyEffect;
      d.diseaseReduction *= mode.enemyEffect;
      d.vectorReduction *= mode.enemyEffect;
    }

    return d;
  }

  function targetIdsForDefense() {
    if (targetMode === "all") {
      return plots.filter((p) => !p.dead).map((p) => p.id);
    }

    return selected.filter((id) => {
      const p = plots.find((plot) => plot.id === id);
      return p && !p.dead;
    });
  }

  function calculateCost(def, targetCount) {
    if (targetCount <= 0) return def.cost;

    if (targetMode === "all") {
      return Math.ceil(def.cost * 1.8);
    }

    return Math.ceil(def.cost * 0.45 * targetCount);
  }

  function applyDefense(def) {
    if (gameOver) return;

    const ids = targetIdsForDefense();

    if (ids.length === 0) {
      addLog("防除対象の区画が選択されていません。区画をクリックして選択してください。");
      return;
    }

    const cost = calculateCost(def, ids.length);

    if (money < cost) {
      addLog(`資金不足です。必要資金=${cost}、現在資金=${money}です。`);
      return;
    }

    const d = adjustedDefense(def);

    setMoney((m) => m - cost);

    setPlots((prev) =>
      prev.map((p) => {
        if (!ids.includes(p.id) || p.dead) return p;

        return {
          ...p,
          effects: [
            ...p.effects.filter((e) => e.id !== def.id || e.remaining <= 0),
            {
              id: def.id,
              name: def.name,
              type: def.type,
              remaining: def.duration,
              infectionReduction: d.infectionReduction,
              diseaseReduction: d.diseaseReduction,
              vectorReduction: d.vectorReduction,
            },
          ],
        };
      })
    );

    const coverage = ids.length / plots.filter((p) => !p.dead).length;

    setPathogenPressure((p) =>
      clamp(p - d.pathogenReduction * coverage, 0, 100)
    );

    if (d.vectorReduction > 0) {
      setVectorLevel((v) => clamp(v * (1 - d.vectorReduction * coverage), 0, 100));
    }

    if (def.resistanceUp > 0) {
      setResistance((r) =>
        clamp(r + def.resistanceUp + Math.round(r * 0.06), 0, 100)
      );
    }

    if (def.resistanceDown > 0) {
      setResistance((r) => clamp(r - def.resistanceDown, 0, 100));
    }

    setUsedDefenseIds((prev) =>
      prev.includes(def.id) ? prev : [...prev, def.id]
    );

    addLog(
      `${def.name}を${ids.length}区画に実施しました。費用=${cost}、効果=${def.duration}ターン。`
    );
  }

  function nextTurn() {
    if (gameOver) return;

    const vectorEvent = Math.random() < 0.28;
    const vectorIncrease = vectorEvent
      ? Math.round(12 + Math.random() * 16)
      : Math.round(Math.random() * 8);

    const weatherIncrease =
      modeKey === "fungal" || modeKey === "bacterial"
        ? Math.round(7 + Math.random() * 10)
        : Math.round(3 + Math.random() * 6);

    const nextVector = clamp(
      vectorLevel + vectorIncrease * crop.vectorFactor * mode.vectorRisk,
      0,
      100
    );

    const nextPathogen = clamp(
      pathogenPressure + weatherIncrease * crop.pathogenFactor * mode.pathogenRisk,
      0,
      100
    );

    const pathogenPart =
      (nextPathogen / 100) *
      0.26 *
      diff.risk *
      crop.pathogenFactor *
      mode.pathogenRisk;

    const vectorPart =
      (nextVector / 100) *
      0.22 *
      diff.risk *
      crop.vectorFactor *
      mode.vectorRisk;

    const wholeBaseRisk = clamp(
      (pathogenPart + vectorPart) * (1 + resistance / 180),
      0.01,
      0.85
    );

    const updatedPlots = plots.map((p) => {
      if (p.dead) return p;

      const eff = sumPlotEffects(p);

      const localRisk = clamp(
        wholeBaseRisk *
          (1 - eff.infectionReduction) *
          (1 - eff.vectorReduction * 0.35),
        0.005,
        0.9
      );

      const infectionGain = localRisk * 100 * (0.55 + Math.random() * 0.9);
      const infection = clamp(p.infection + infectionGain, 0, 100);

      let diseaseGain = 0;

      if (infection >= 45) {
        diseaseGain =
          (infection - 35) *
          0.11 *
          diff.risk *
          crop.deathFactor *
          mode.pathogenRisk;
      }

      diseaseGain +=
        (nextPathogen / 100) *
        4.2 *
        crop.pathogenFactor *
        mode.pathogenRisk;

      diseaseGain *= 1 - eff.diseaseReduction;

      const recovery =
        p.effects.some(
          (e) =>
            e.remaining > 0 &&
            (e.id === "microbe" || e.id === "sanitation" || e.id === "rotation")
        )
          ? 1.8
          : 0.4;

      const disease = clamp(p.disease + diseaseGain - recovery, 0, 100);

      const nextEffects = p.effects
        .map((e) => ({ ...e, remaining: Math.max(0, e.remaining - 1) }))
        .filter((e) => e.remaining > 0);

      return {
        ...p,
        infection,
        disease,
        dead: disease >= 100,
        effects: nextEffects,
      };
    });

    const income = Math.round(diff.income);
    const deadCount = updatedPlots.filter((p) => p.dead).length;
    const diseasedCount = updatedPlots.filter((p) => p.disease >= 35).length;

    setPlots(updatedPlots);
    setPathogenPressure(nextPathogen);
    setVectorLevel(nextVector);
    setMoney((m) => clamp(m + income - Math.round(deadCount * 0.4), 0, 999));
    setScore((s) =>
      s + Math.max(0, income * 5 - diseasedCount * 2 - deadCount * 5)
    );

    addLog(
      `ターン${turn}終了。基礎感染確率=${pct(
        wholeBaseRisk
      )}、病原菌圧=${Math.round(nextPathogen)}、媒介虫=${Math.round(
        nextVector
      )}。${vectorEvent ? "媒介虫がランダム発生しました。" : "小規模な媒介虫増加がありました。"}`
    );

    if (turn >= MAX_TURN) {
      setGameOver(true);
      addLog(`ゲーム終了。IPM評価=${ipmScore}点、推定最終スコア=${finalScore}点。`);
    } else {
      setTurn((t) => t + 1);
    }
  }

  const yieldLabel =
    summary.yieldScore >= 85
      ? "優秀"
      : summary.yieldScore >= 70
      ? "良好"
      : summary.yieldScore >= 50
      ? "要改善"
      : "大きな被害";

  return (
    <div style={styles.app}>
      <div style={styles.twoColumn}>
        <section style={styles.card}>
          <h1 style={styles.h1}>植物病害防除ゲーム</h1>
          <p style={styles.text}>
            区画をクリックして選択し、防除手段を指定区画または圃場全体に適用します。
            病原菌圧・媒介虫・薬剤耐性を管理しながら、収量とIPM評価を高めてください。
          </p>

          <div style={styles.controlGrid}>
            <Control label="難易度">
              <select style={styles.input} value={difficulty} onChange={(e) => changeDifficulty(e.target.value)}>
                {Object.entries(difficulties).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </Control>

            <Control label="作物">
              <select style={styles.input} value={cropKey} onChange={(e) => setCropKey(e.target.value)}>
                {Object.entries(crops).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
            </Control>

            <Control label="病害モード">
              <select style={styles.input} value={modeKey} onChange={(e) => setModeKey(e.target.value)}>
                {Object.entries(diseaseModes).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
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
                <option value="on">表示する</option>
                <option value="off">表示しない</option>
              </select>
            </Control>
          </div>

          {difficulty === "research" && (
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
                <input style={styles.input} type="number" value={research.initialPathogen}
                  onChange={(e) => setResearch({ ...research, initialPathogen: e.target.value })} />
              </Control>
              <Control label="初期媒介虫">
                <input style={styles.input} type="number" value={research.initialVector}
                  onChange={(e) => setResearch({ ...research, initialVector: e.target.value })} />
              </Control>
            </div>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>現在の状態</h2>
          <div style={styles.metricGrid}>
            <Metric title="ターン" value={`${turn}/${MAX_TURN}`} />
            <Metric title="資金" value={money} />
            <Metric title="病原菌圧" value={Math.round(pathogenPressure)} />
            <Metric title="媒介虫" value={Math.round(vectorLevel)} />
            <Metric title="薬剤耐性" value={Math.round(resistance)} />
            <Metric title="選択区画" value={selected.length} />
          </div>

          <div style={{ ...styles.metricGrid, marginTop: 10 }}>
            <Metric title="基礎感染確率" value={pct(baseRisk)} />
            <Metric title="選択区画の防除後感染確率" value={pct(adjustedRiskForSelected)} />
            <Metric title="選択区画の感染低下" value={pct(selectedEffectSummary.infectionReduction)} />
            <Metric title="IPM評価" value={ipmScore} />
            <Metric title="推定最終スコア" value={finalScore} />
          </div>
        </section>
      </div>

      {education && (
        <section style={{ ...styles.card, background: "#ebf8ff", borderColor: "#bee3f8" }}>
          <h2 style={styles.h2}>教育モード</h2>
          <p style={styles.text}>
            <b>{crop.name}</b>：{crop.text}<br />
            <b>{mode.name}</b>：{mode.text}<br />
            防除は区画単位で効果を持ちます。圃場全体の病原菌圧を下げるには、
            <b> 圃場衛生、微生物資材、輪作・薬剤ローテーション </b>
            が重要です。ウイルスモードでは <b>天敵・媒介虫管理</b> の優先度が高くなります。
          </p>
        </section>
      )}

      {gameOver && (
        <section style={{ ...styles.card, background: "#fffaf0", borderColor: "#fbd38d" }}>
          <h2 style={styles.h2}>ゲーム終了後評価</h2>
          <p style={styles.text}>
            評価結果：収量={yieldLabel}、収量点={summary.yieldScore}、
            IPM評価={ipmScore}点、最終スコア={finalScore}点。
          </p>
        </section>
      )}

      <div style={styles.twoColumn}>
        <section style={styles.card}>
          <h2 style={styles.h2}>圃場マップ</h2>
          <p style={styles.text}>
            区画をクリックすると選択できます。選択区画には青い枠が表示されます。
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <button style={styles.button} onClick={selectAll}>全区画選択</button>
            <button style={styles.buttonGray} onClick={clearSelection}>選択解除</button>
            <button style={styles.button} onClick={nextTurn} disabled={gameOver}>次のターンへ</button>
            <button style={styles.buttonRed} onClick={() => resetGame()}>リセット</button>
          </div>

          <div style={styles.fieldGrid}>
            {plots.map((p) => {
              const st = plotStatus(p);
              const isSelected = selected.includes(p.id);
              const eff = sumPlotEffects(p);

              return (
                <button
                  key={p.id}
                  onClick={() => togglePlot(p.id)}
                  style={{
                    ...styles.plot,
                    background: st.bg,
                    color: st.color,
                    outline: isSelected ? "4px solid #3182ce" : "1px solid rgba(0,0,0,0.1)",
                    transform: isSelected ? "scale(1.03)" : "scale(1)",
                    opacity: p.dead ? 0.85 : 1,
                  }}
                >
                  <div>{crop.mark}</div>
                  <div>{st.label}</div>
                  <div>病勢 {Math.round(p.disease)}</div>
                  <div style={{ fontSize: 10 }}>防除 {pct(eff.infectionReduction)}</div>
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
            <Metric title="収量点" value={summary.yieldScore} />
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>防除手段</h2>
          <p style={styles.text}>
            現在の対象：<b>{targetMode === "selected" ? "選択区画" : "圃場全体"}</b>
            {targetMode === "selected" ? ` / 選択数=${selected.length}` : ""}
          </p>

          <div style={styles.defenseGrid}>
            {defenses.map((d) => {
              const targetCount = targetMode === "all"
                ? plots.filter((p) => !p.dead).length
                : selected.length;

              const cost = calculateCost(d, targetCount);
              const disabled = gameOver || targetCount === 0 || money < cost;

              return (
                <div key={d.id} style={styles.defenseCard}>
                  <div style={styles.defenseTitle}>
                    <span>{d.name}</span>
                    <span>{cost}</span>
                  </div>
                  <div style={styles.badgeLine}>
                    <span style={styles.badge}>{d.type}</span>
                    <span style={styles.badge}>{d.duration}ターン</span>
                  </div>
                  <p style={styles.smallText}>{d.text}</p>
                  <p style={styles.smallText}>
                    感染低下：{pct(d.infectionReduction)} / 病勢抑制：{pct(d.diseaseReduction)} /
                    病原菌圧低下：{d.pathogenReduction} / 媒介虫低下：{pct(d.vectorReduction)}
                  </p>
                  <button
                    style={{ ...styles.button, width: "100%", opacity: disabled ? 0.45 : 1 }}
                    onClick={() => applyDefense(d)}
                    disabled={disabled}
                  >
                    実施する
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div style={styles.twoColumn}>
        <section style={styles.card}>
          <h2 style={styles.h2}>選択区画の詳細</h2>
          {selectedPlots.length === 0 ? (
            <p style={styles.text}>区画が選択されていません。</p>
          ) : (
            <div style={styles.detailList}>
              {selectedPlots.map((p) => {
                const eff = sumPlotEffects(p);
                return (
                  <div key={p.id} style={styles.detailBox}>
                    <b>区画 {p.id}</b>
                    <div style={styles.smallText}>
                      感染度={Math.round(p.infection)} / 病勢={Math.round(p.disease)} /
                      感染低下={pct(eff.infectionReduction)}
                    </div>
                    <div style={styles.smallText}>
                      有効効果：
                      {p.effects.length === 0
                        ? "なし"
                        : p.effects.map((e) => `${e.name} 残り${e.remaining}`).join("、")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>メッセージログ</h2>
          <ul style={styles.log}>
            {logs.map((l, i) => (
              <li key={`${l}-${i}`}>{l}</li>
            ))}
          </ul>
        </section>
      </div>

      <section style={styles.card}>
        <h2 style={styles.h2}>スコア・評価</h2>
        <div style={styles.metricGrid}>
          <Metric title="進行スコア" value={score} />
          <Metric title="収量点" value={summary.yieldScore} />
          <Metric title="IPM評価" value={ipmScore} />
          <Metric title="推定最終スコア" value={finalScore} />
          <Metric title="耐性リスク" value={Math.round(resistance)} />
        </div>
      </section>
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
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
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
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
    gap: 14,
  },
  card: {
    background: "white",
    border: "1px solid #d9e2d0",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 8px 20px rgba(31,41,51,0.08)",
    marginBottom: 14,
  },
  h1: {
    marginTop: 0,
    marginBottom: 8,
    fontSize: 26,
  },
  h2: {
    marginTop: 0,
    marginBottom: 10,
    fontSize: 18,
  },
  text: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#3f4d5a",
  },
  smallText: {
    fontSize: 12,
    lineHeight: 1.5,
    color: "#52606d",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))",
    gap: 8,
  },
  metric: {
    background: "#f7fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 10,
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
    minHeight: 66,
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
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: 10,
  },
  defenseCard: {
    border: "1px solid #d9e2d0",
    borderRadius: 16,
    padding: 10,
    background: "#fbfff8",
  },
  defenseTitle: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    fontWeight: 800,
  },
  badgeLine: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
    marginTop: 5,
  },
  badge: {
    display: "inline-block",
    background: "#edf2f7",
    color: "#2d3748",
    borderRadius: 99,
    padding: "3px 8px",
    fontSize: 11,
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
  log: {
    maxHeight: 260,
    overflow: "auto",
    lineHeight: 1.5,
    paddingLeft: 20,
  },
};
