import { useMemo, useState } from "react";

// ===== TYPES =====
type FactorId =
  | "looks"
  | "kindness"
  | "sincerity"
  | "conversation"
  | "stability"
  | "excitement";

type SceneTag =
  | "第一印象"
  | "会話"
  | "別れ際・帰宅後"
  | "弱っている時"
  | "将来・生活観"
  | "デート進行"
  | "移動・エスコート"
  | "予定外対応"
  | "校正";

type PairTag = [FactorId, FactorId] | ["calibration", "calibration"];

type Question = {
  id: number;
  pair: PairTag;
  pairKey: string;
  scene: SceneTag;
  question: string;
  a: string;
  b: string;
  aFactor?: FactorId;
  bFactor?: FactorId;
  calibration?: boolean;
};

type FactorMeta = {
  id: FactorId;
  label: string;
  short: string;
  color: string;
};

type WeightMap = Record<FactorId, number>;

// ===== CONSTANTS =====
const FACTORS: FactorMeta[] = [
  { id: "looks", label: "ルックス", short: "見た目", color: "bg-pink-500" },
  { id: "kindness", label: "やさしさ", short: "やさしさ", color: "bg-emerald-500" },
  { id: "sincerity", label: "誠実さ", short: "誠実さ", color: "bg-blue-500" },
  { id: "conversation", label: "会話の楽しさ", short: "会話", color: "bg-amber-500" },
  { id: "stability", label: "生活安定", short: "安定", color: "bg-slate-600" },
  { id: "excitement", label: "刺激", short: "刺激", color: "bg-violet-500" },
];

const QUESTION_TARGET = 12;
const REGULAR_TARGET = 11;

const INITIAL_RAW: WeightMap = {
  looks: 50,
  kindness: 50,
  sincerity: 50,
  conversation: 50,
  stability: 50,
  excitement: 50,
};

const EMPTY_WEIGHT: WeightMap = {
  looks: 0,
  kindness: 0,
  sincerity: 0,
  conversation: 0,
  stability: 0,
  excitement: 0,
};

// ===== HELPERS =====
function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function normalize(raw: WeightMap): WeightMap {
  const sum = Object.values(raw).reduce((acc, v) => acc + Math.max(0, v), 0);
  const base = sum <= 0 ? FACTORS.length : sum;
  return FACTORS.reduce((acc, factor) => {
    acc[factor.id] = (Math.max(0, raw[factor.id]) / base) * 100;
    return acc;
  }, {} as WeightMap);
}

function sortedFactorEntries(weights: WeightMap) {
  return FACTORS.map((factor) => ({ ...factor, value: weights[factor.id] })).sort(
    (a, b) => b.value - a.value
  );
}

// ===== QUESTION POOL =====
const QUESTIONS: Question[] = [
  {
    id: 1,
    pair: ["looks", "kindness"],
    pairKey: pairKey("looks", "kindness"),
    scene: "会話",
    aFactor: "looks",
    bFactor: "kindness",
    a: `待ち合わせで会った瞬間、思わず「やっぱり素敵だな」と思った。
ただ、話していると、興味の中心は少し自分に向いている感じがする。`,
    b: `見た目は特別目を引くわけではない。
でも、会話の途中でこちらの緊張に気づいて、自然に話しやすい空気にしてくれた。`,
    question: "2回目も会いたいのはどっち？",
  },
  {
    id: 2,
    pair: ["excitement", "sincerity"],
    pairKey: pairKey("excitement", "sincerity"),
    scene: "別れ際・帰宅後",
    aFactor: "excitement",
    bFactor: "sincerity",
    a: `別れ際に「今度、面白いところ連れていくよ」と言ってきて、少し心が動いた。
でも、連絡の返し方には気まぐれさがある。`,
    b: `別れたあとに「今日はありがとう、楽しかった」と短く丁寧な連絡が来た。
派手さはないが、言葉と態度が揃っている。`,
    question: "今の自分が、より惹かれるのはどっち？",
  },
  {
    id: 3,
    pair: ["conversation", "stability"],
    pairKey: pairKey("conversation", "stability"),
    scene: "将来・生活観",
    aFactor: "conversation",
    bFactor: "stability",
    a: `カフェで話していたら、気づいたら予定の時間を少し過ぎていた。
ただ、仕事や生活の話になると、まだふわっとしている。`,
    b: `会話は落ち着いていて、すごく盛り上がるわけではない。
でも、普段の生活や働き方の話を聞くと、地に足がついている感じがする。`,
    question: "交際を考える入口として、前向きになれるのはどっち？",
  },
  {
    id: 4,
    pair: ["kindness", "sincerity"],
    pairKey: pairKey("kindness", "sincerity"),
    scene: "弱っている時",
    aFactor: "kindness",
    bFactor: "sincerity",
    a: `こちらが少し落ち込んでいると、すぐに気づいて優しく声をかけてくれる。
でも、その場その場で言うことが少し変わることがある。`,
    b: `言い方はやや不器用で、柔らかさは強くない。
ただ、約束したことや言ったことはきちんと守る。`,
    question: "困ったときに頼りたいのはどっち？",
  },
  {
    id: 5,
    pair: ["looks", "conversation"],
    pairKey: pairKey("looks", "conversation"),
    scene: "会話",
    aFactor: "looks",
    bFactor: "conversation",
    a: `隣にいると少し嬉しくなるくらい、見た目はかなり好み。
ただ、話は悪くないけれど、深く広がっていく感じはあまりない。`,
    b: `外見は特別刺さるわけではない。
でも、ひとつ話すとふたつ返ってきて、自然に笑ってしまう。`,
    question: "もう一度会ったあと、さらに会いたくなりそうなのはどっち？",
  },
  {
    id: 6,
    pair: ["stability", "excitement"],
    pairKey: pairKey("stability", "excitement"),
    scene: "将来・生活観",
    aFactor: "stability",
    bFactor: "excitement",
    a: `将来のことを少し話したとき、仕事も暮らしもかなり安定していて安心感があった。
ただ、心が大きく揺れる感じは少ない。`,
    b: `先の見通しはまだ読みにくい。
でも、一緒にいると自分の知らない景色が見えそうな気がする。`,
    question: "今の自分が、より引っ張られるのはどっち？",
  },
  {
    id: 7,
    pair: ["kindness", "conversation"],
    pairKey: pairKey("kindness", "conversation"),
    scene: "弱っている時",
    aFactor: "kindness",
    bFactor: "conversation",
    a: `こちらが少し疲れていると、「無理しないで」と自然に言ってくれる。
ただ、会話そのものは穏やかで、盛り上がりは控えめ。`,
    b: `話しているとテンポが合って、気づけばどんどん会話が続く。
ただ、相手への細かな気遣いは少し薄い。`,
    question: "自然とまた連絡したくなるのはどっち？",
  },
  {
    id: 8,
    pair: ["sincerity", "looks"],
    pairKey: pairKey("sincerity", "looks"),
    scene: "第一印象",
    aFactor: "looks",
    bFactor: "sincerity",
    a: `会った瞬間からかなり魅力的で、目で追ってしまう。
でも、誰に対しても同じように振る舞っていそうな不安が少しある。`,
    b: `見た目は落ち着いていて普通。
ただ、話し方や約束の扱い方に、信用できる感じがある。`,
    question: "安心して関わり始められるのはどっち？",
  },
  {
    id: 9,
    pair: ["excitement", "conversation"],
    pairKey: pairKey("excitement", "conversation"),
    scene: "別れ際・帰宅後",
    aFactor: "excitement",
    bFactor: "conversation",
    a: `帰り道、「次は何が起こるんだろう」と少し頭が熱くなる感じが残った。
少し危ういけれど、忘れにくい。`,
    b: `別れたあと、派手さはないのに、不思議と気持ちが落ち着いていた。
話している時間の心地よさが、後からじわっと残る。`,
    question: "帰り道で、より頭に残っているのはどっち？",
  },
  {
    id: 10,
    pair: ["stability", "kindness"],
    pairKey: pairKey("stability", "kindness"),
    scene: "将来・生活観",
    aFactor: "stability",
    bFactor: "kindness",
    a: `生活やお金の感覚を話したとき、堅実で現実的だと感じた。
ただ、感情面では少し距離がある。`,
    b: `先の安定感はまだこれからという感じ。
でも、こちらの小さな不安にちゃんと気づいて、気持ちをやわらげてくれる。`,
    question: "いま実際に心が動きやすいのはどっち？",
  },
  {
    id: 11,
    pair: ["looks", "kindness"],
    pairKey: pairKey("looks", "kindness"),
    scene: "第一印象",
    aFactor: "looks",
    bFactor: "kindness",
    a: `10人中10人がイケメンと言う。会った瞬間、目を引かれる。
ただ、一緒にいる間もずっとスマホを気にしている。`,
    b: `顔はタイプではない。
でも、あなたが困っているとき、真っ先に駆けつける。`,
    question: "2回目も会いたいのはどっち？",
  },
  {
    id: 12,
    pair: ["conversation", "stability"],
    pairKey: pairKey("conversation", "stability"),
    scene: "デート進行",
    aFactor: "conversation",
    bFactor: "stability",
    a: `理想通りの高収入。将来の不安は少なそう。
ただ、仕事が忙しく、デートはいつも短時間で切り上げられる。`,
    b: `収入は平均的。
でも、二人だけのマニアックな共通の趣味の話で、気づくとずっと笑ってしまう。`,
    question: "また会って話したくなるのはどっち？",
  },
  {
    id: 13,
    pair: ["stability", "excitement"],
    pairKey: pairKey("stability", "excitement"),
    scene: "会話",
    aFactor: "stability",
    bFactor: "excitement",
    a: `将来の安泰が見えるエリート。
ただ、会話が少しマニュアル通りで、驚きは少ない。`,
    b: `職種は一般的で、生活は堅実。
でも、彼と話すと、自分の価値観が広がるワクワク感がある。`,
    question: "今の自分が、より引っ張られるのはどっち？",
  },
  {
    id: 14,
    pair: ["stability", "kindness"],
    pairKey: pairKey("stability", "kindness"),
    scene: "移動・エスコート",
    aFactor: "stability",
    bFactor: "kindness",
    a: `高級車で迎えに来る。頼もしさもある。
ただ、運転中の言動が攻撃的で、少し怖い。`,
    b: `移動は公共交通機関。派手さはない。
でも、混雑した電車でさりげなくあなたを守る。`,
    question: "一緒にいて安心できるのはどっち？",
  },
  {
    id: 15,
    pair: ["sincerity", "conversation"],
    pairKey: pairKey("sincerity", "conversation"),
    scene: "会話",
    aFactor: "sincerity",
    bFactor: "conversation",
    a: `真面目で、約束を守り、嘘をつかない。
ただ、冗談がほとんど通じない。`,
    b: `少し調子がいいところはある。
でも、その場にいるだけで周囲を明るくする太陽みたいな人。`,
    question: "また連絡したくなるのはどっち？",
  },
  {
    id: 16,
    pair: ["sincerity", "excitement"],
    pairKey: pairKey("sincerity", "excitement"),
    scene: "別れ際・帰宅後",
    aFactor: "sincerity",
    bFactor: "excitement",
    a: `連絡がまめで、安心感がある。
ただ、新しいことへの挑戦にはかなり消極的。`,
    b: `連絡は不定期。
でも、会うたびに新しい世界に連れ出してくれる刺激がある。`,
    question: "今の自分が惹かれるのはどっち？",
  },
  {
    id: 17,
    pair: ["sincerity", "excitement"],
    pairKey: pairKey("sincerity", "excitement"),
    scene: "予定外対応",
    aFactor: "sincerity",
    bFactor: "excitement",
    a: `約束は必ず守る。
ただ、急な予定変更には弱く、少し固まってしまう。`,
    b: `少しルーズ。
でも、予期せぬトラブルも「探検だね」と楽しめる柔軟さがある。`,
    question: "一緒にいて面白い未来がありそうなのはどっち？",
  },
  {
    id: 18,
    pair: ["sincerity", "excitement"],
    pairKey: pairKey("sincerity", "excitement"),
    scene: "将来・生活観",
    aFactor: "sincerity",
    bFactor: "excitement",
    a: `変化を好まない安定志向。浮気の心配もほぼない。
ただ、毎回の展開はかなり予想しやすい。`,
    b: `多趣味で多忙。少し危うい雰囲気もある。
でも、一緒にいて飽きない。`,
    question: "理屈を抜きにして気になるのはどっち？",
  },
  {
    id: 19,
    pair: ["stability", "sincerity"],
    pairKey: pairKey("stability", "sincerity"),
    scene: "会話",
    aFactor: "stability",
    bFactor: "sincerity",
    a: `社会的地位が高く、頼もしさもある。
ただ、いつも「うまくやっている自分」しか見せない。`,
    b: `地位は普通。
でも、自分の弱さや失敗も隠さず話してくれる。`,
    question: "信頼できると感じるのはどっち？",
  },
  {
    id: 20,
    pair: ["calibration", "calibration"],
    pairKey: "calibration",
    scene: "校正",
    calibration: true,
    a: `あなたが「自分は最重視している」と答えた因子だけが圧倒的に高い。
ただ、他はそこまで刺さらない。`,
    b: `その因子は平均的。
でも、他の多くの要素がかなりあなた好み。`,
    question: "実際に心が動くのはどっち？",
  },
];

// ===== UI PARTS =====
function StackedBar({
  weights,
  compact = false,
  large = false,
}: {
  weights: WeightMap;
  compact?: boolean;
  large?: boolean;
}) {
  const normalized = normalize(weights);

  return (
    <div
      className={`overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm ${
        compact ? "h-12" : large ? "h-[28rem] w-40" : "h-72 w-28"
      }`}
    >
      <div className={`flex ${compact ? "h-full flex-row" : "h-full flex-col"}`}>
        {FACTORS.map((factor) => {
          const size = normalized[factor.id];
          return (
            <div
              key={factor.id}
              className={`${factor.color} flex items-center justify-center ${
                compact ? "text-xs" : large ? "text-sm" : "text-xs"
              } font-black text-white`}
              style={compact ? { width: `${size}%` } : { height: `${size}%` }}
              title={`${factor.label} ${roundOne(size)}%`}
            >
              {size >= (compact ? 11 : 8) ? `${Math.round(size)}%` : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== QUESTION SELECTION =====
function chooseNextRegularQuestion({
  remaining,
  askedIds,
  score,
  exposure,
  lastQuestion,
}: {
  remaining: Question[];
  askedIds: number[];
  score: WeightMap;
  exposure: WeightMap;
  lastQuestion: Question | null;
}) {
  const candidates = remaining.filter((q) => !q.calibration);
  if (candidates.length === 0) return null;

  let best: Question | null = null;
  let bestValue = -Infinity;

  for (const q of candidates) {
    const [left, right] = q.pair as [FactorId, FactorId];
    const closeness = 24 - Math.abs(score[left] - score[right]) * 6;
    const exposureNeed = 14 - exposure[left] - exposure[right];
    const samePairPenalty = lastQuestion && lastQuestion.pairKey === q.pairKey ? 7 : 0;
    const sameScenePenalty = lastQuestion && lastQuestion.scene === q.scene ? 3.5 : 0;
    const alreadyUsedThisPair = askedIds.filter((id) => {
      const asked = QUESTIONS.find((item) => item.id === id);
      return asked?.pairKey === q.pairKey;
    }).length;
    const repeatPairPenalty = alreadyUsedThisPair * 2.2;
    const novelty = Math.random() * 1.6;

    const total =
      closeness +
      exposureNeed +
      novelty -
      samePairPenalty -
      sameScenePenalty -
      repeatPairPenalty;

    if (total > bestValue) {
      bestValue = total;
      best = q;
    }
  }

  return best;
}

// ===== MAIN APP =====
export default function App() {
  const [selfRaw, setSelfRaw] = useState<WeightMap>(INITIAL_RAW);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [askedIds, setAskedIds] = useState<number[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [score, setScore] = useState<WeightMap>(EMPTY_WEIGHT);
  const [exposure, setExposure] = useState<WeightMap>(EMPTY_WEIGHT);
  const [calibrationAnswer, setCalibrationAnswer] = useState<"A" | "B" | null>(null);

  const currentQuestion = useMemo(
    () => QUESTIONS.find((question) => question.id === currentId) ?? null,
    [currentId]
  );

  const selfNormalized = useMemo(() => normalize(selfRaw), [selfRaw]);

  const inferredNormalized = useMemo(() => {
    const adjusted = FACTORS.reduce((acc, factor) => {
      acc[factor.id] = score[factor.id] + 0.4;
      return acc;
    }, {} as WeightMap);
    return normalize(adjusted);
  }, [score]);

  const majorGaps = useMemo(() => {
    return FACTORS.map((factor) => ({
      ...factor,
      selfValue: selfNormalized[factor.id],
      inferredValue: inferredNormalized[factor.id],
      diff: inferredNormalized[factor.id] - selfNormalized[factor.id],
      absDiff: Math.abs(inferredNormalized[factor.id] - selfNormalized[factor.id]),
    }))
      .sort((a, b) => b.absDiff - a.absDiff)
      .slice(0, 2);
  }, [selfNormalized, inferredNormalized]);

  const uncertainFactors = useMemo(() => {
    return FACTORS.map((factor) => ({ ...factor, exposure: exposure[factor.id] }))
      .sort((a, b) => a.exposure - b.exposure)
      .slice(0, 2);
  }, [exposure]);

  const selfTop = useMemo(() => sortedFactorEntries(selfNormalized)[0], [selfNormalized]);
  const measuredTop = useMemo(
    () => sortedFactorEntries(inferredNormalized)[0],
    [inferredNormalized]
  );

  function updateSelfRaw(factorId: FactorId, value: number) {
    setSelfRaw((prev) => ({ ...prev, [factorId]: clamp(value, 0, 100) }));
  }

  function startAssessment() {
    const regularQuestions = QUESTIONS.filter((q) => !q.calibration);
    const first = regularQuestions[Math.floor(Math.random() * regularQuestions.length)];

    setStarted(true);
    setFinished(false);
    setAskedIds([]);
    setScore(EMPTY_WEIGHT);
    setExposure(EMPTY_WEIGHT);
    setCalibrationAnswer(null);
    setCurrentId(first.id);
  }

  function resetAll() {
    setStarted(false);
    setFinished(false);
    setAskedIds([]);
    setCurrentId(null);
    setScore(EMPTY_WEIGHT);
    setExposure(EMPTY_WEIGHT);
    setCalibrationAnswer(null);
  }

  function handleAnswer(choice: "A" | "B") {
    if (!currentQuestion) return;

    const nextAskedIds = [...askedIds, currentQuestion.id];
    const nextScore = { ...score };
    const nextExposure = { ...exposure };

    if (currentQuestion.calibration) {
      setCalibrationAnswer(choice);
    } else {
      const [left, right] = currentQuestion.pair as [FactorId, FactorId];
      nextExposure[left] += 1;
      nextExposure[right] += 1;
      if (choice === "A" && currentQuestion.aFactor) nextScore[currentQuestion.aFactor] += 1;
      if (choice === "B" && currentQuestion.bFactor) nextScore[currentQuestion.bFactor] += 1;
    }

    setAskedIds(nextAskedIds);
    setScore(nextScore);
    setExposure(nextExposure);

    const answeredRegularAfter = nextAskedIds.filter(
      (id) => !QUESTIONS.find((question) => question.id === id)?.calibration
    ).length;

    const calibrationQuestion = QUESTIONS.find((question) => question.calibration);
    const calibrationAsked = calibrationQuestion
      ? nextAskedIds.includes(calibrationQuestion.id)
      : true;

    if (answeredRegularAfter >= REGULAR_TARGET && calibrationQuestion && !calibrationAsked) {
      setCurrentId(calibrationQuestion.id);
      return;
    }

    if (nextAskedIds.length >= QUESTION_TARGET) {
      setCurrentId(null);
      setFinished(true);
      return;
    }

    const remaining = QUESTIONS.filter((question) => !nextAskedIds.includes(question.id));
    const nextRegular = chooseNextRegularQuestion({
      remaining,
      askedIds: nextAskedIds,
      score: nextScore,
      exposure: nextExposure,
      lastQuestion: currentQuestion,
    });

    if (!nextRegular) {
      if (calibrationQuestion && !calibrationAsked) {
        setCurrentId(calibrationQuestion.id);
      } else {
        setCurrentId(null);
        setFinished(true);
      }
      return;
    }

    setCurrentId(nextRegular.id);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-500">
              自己申告と実際の選択のズレを見る
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">重要因子</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              「初回〜2回目で惹かれる相手」を想定して、あなたが自分では何を重視していると思っているかと、
              実際の二択から見えてくる重みの差を可視化します。
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 text-3xl shadow-sm">
            🧭
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col items-center justify-between gap-4 text-center md:flex-row md:items-start md:text-left">
              <div>
                <h2 className="text-xl font-bold text-slate-900 text-center md:text-left">
                  1. 自己申告の重要因子
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  まずは「自分では何を重視していると思うか」を動かしてください。数値は自動で100%に整えます。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelfRaw(INITIAL_RAW)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                均等に戻す
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700">自己申告の配分プレビュー</span>
                  <span className="text-xs text-slate-500">結果欄と同じ横棒表示</span>
                </div>
                <StackedBar weights={selfRaw} compact />
              </div>

              <div className="space-y-2">
                {FACTORS.map((factor) => {
                  const normalized = roundOne(selfNormalized[factor.id]);
                  return (
                    <div
                      key={factor.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex w-20 shrink-0 items-center gap-2 sm:w-28">
                          <span className={`h-3 w-3 rounded-full ${factor.color}`} />
                          <span className="text-sm font-semibold text-slate-800">
                            {factor.label}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={selfRaw[factor.id]}
                          onChange={(e) => updateSelfRaw(factor.id, Number(e.target.value))}
                          className="min-w-0 flex-1 accent-slate-800"
                        />
                        <span className="w-14 shrink-0 text-right text-sm font-bold text-slate-700">
                          {normalized}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startAssessment}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                質問に進む
              </button>
              {started && !finished && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  最初からやり直す
                </button>
              )}
            </div>
          </section>

          <div className="space-y-6">
            {!started && (
              <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-7 text-slate-600 shadow-sm">
                <h2 className="mb-2 text-lg font-bold text-slate-900">2. 二択質問</h2>
                <p>
                  1問目はランダムです。以後は、まだ輪郭が曖昧な優先順位を埋めやすいカードを優先しつつ、同じ因子ペアや同じ場面が続きすぎないように出します。
                </p>
              </section>
            )}

            {started && !finished && currentQuestion && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-900 text-center md:text-left">
                    2. 二択質問
                  </h2>
                  <div className="text-sm font-semibold text-slate-500">
                    {Math.min(askedIds.length + 1, QUESTION_TARGET)} / {QUESTION_TARGET}
                  </div>
                </div>

                <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{
                      width: `${(Math.min(askedIds.length + 1, QUESTION_TARGET) / QUESTION_TARGET) * 100}%`,
                    }}
                  />
                </div>

                <p className="mb-5 text-center text-base font-semibold leading-7 text-slate-900 md:text-lg">
                  {currentQuestion.question}
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleAnswer("A")}
                    className="h-full rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                  >
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-base font-black text-white shadow-sm">
                      A
                    </div>
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-700 md:text-[15px]">
                      {currentQuestion.a}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnswer("B")}
                    className="h-full rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                  >
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-base font-black text-slate-900 ring-2 ring-slate-700 shadow-sm">
                      B
                    </div>
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-700 md:text-[15px]">
                      {currentQuestion.b}
                    </p>
                  </button>
                </div>
              </section>
            )}

            {finished && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-900">3. 結果</h2>
                  <button
                    type="button"
                    onClick={startAssessment}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    もう一度やる
                  </button>
                </div>

                <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm leading-7 text-slate-700">
                    <span className="font-bold text-slate-900">現時点では、</span>
                    自己申告では <span className="font-semibold">{selfTop.label}</span> が最上位、
                    実際の選択では <span className="font-semibold">{measuredTop.label}</span> が最上位に出ています。
                    {selfTop.id === measuredTop.id
                      ? " 自己認識と実際の選択は、かなり近い形です。"
                      : " 自己認識と、実際に惹かれやすい要素のあいだに少しズレが見えます。"}
                  </p>
                  {calibrationAnswer && (
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      校正カードでは{" "}
                      <span className="font-semibold">
                        {calibrationAnswer === "A"
                          ? "『最重視因子だけが圧倒的に高い相手』"
                          : "『最重視因子は普通でも、他がかなり好みの相手』"}
                      </span>
                      を選びました。
                    </p>
                  )}
                </div>

                <div className="mb-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">自己申告</h3>
                      <span className="text-xs text-slate-500">最初に自分で置いた比率</span>
                    </div>
                    <StackedBar weights={selfRaw} compact />
                  </div>
                  <div className="rounded-3xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">実測</h3>
                      <span className="text-xs text-slate-500">二択から見えた比率</span>
                    </div>
                    <StackedBar weights={score} compact />
                  </div>
                </div>

                <div className="space-y-2">
                  {FACTORS.map((factor) => {
                    const selfValue = selfNormalized[factor.id];
                    const inferredValue = inferredNormalized[factor.id];
                    const diff = inferredValue - selfValue;
                    return (
                      <div
                        key={factor.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex w-24 shrink-0 items-center gap-2 sm:w-28">
                            <span className={`h-3 w-3 rounded-full ${factor.color}`} />
                            <span className="text-sm font-semibold text-slate-900">{factor.label}</span>
                          </div>

                          <div className="min-w-0 flex-1 text-xs leading-6 text-slate-600 sm:text-sm">
                            <span className="font-medium text-slate-700">自己申告</span>{" "}
                            <span className="font-semibold text-slate-800">{roundOne(selfValue)}%</span>
                            <span className="mx-2 text-slate-400">→</span>
                            <span className="font-medium text-slate-700">実測</span>{" "}
                            <span className="font-semibold text-slate-800">{roundOne(inferredValue)}%</span>
                          </div>

                          <span
                            className={`shrink-0 text-sm font-bold ${
                              diff >= 0 ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {diff >= 0 ? "+" : ""}
                            {roundOne(diff)}pt
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 font-bold text-slate-900">ギャップが大きい因子</h3>
                    <div className="space-y-3 text-sm leading-6 text-slate-700">
                      {majorGaps.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
                          <div className="font-semibold text-slate-900">{item.label}</div>
                          <div>
                            {item.diff > 0
                              ? `思っていたより、実際の選択では ${item.label} が強く出ています。`
                              : `思っていたより、実際の選択では ${item.label} は前に出ていません。`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 font-bold text-slate-900">まだ輪郭が粗い因子</h3>
                    <div className="space-y-3 text-sm leading-6 text-slate-700">
                      {uncertainFactors.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
                          <div className="font-semibold text-slate-900">{item.label}</div>
                          <div>
                            この因子が絡む比較は、まだ回答数がやや少なめです。現時点ではこう見える、くらいで受け取るのがよさそうです。
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

