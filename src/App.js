import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "./supabase";

// ── UTILITIES ─────────────────────────────────────────────────────────────────
function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ── SUPABASE HELPERS ──────────────────────────────────────────────────────────
async function loadIdeas(clientId) {
  try {
    const { data } = await supabase
      .from("ideas")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    return data || [];
  } catch { return []; }
}

async function saveIdeasToDb(clientId, ideas) {
  try {
    await supabase.from("ideas").delete().eq("client_id", clientId);
    if (ideas.length > 0) {
      await supabase.from("ideas").insert(
        ideas.map(i => ({ ...i, client_id: clientId }))
      );
    }
  } catch (e) { console.error("Save error", e); }
}

async function loadCode(clientId) {
  try {
    const { data } = await supabase
      .from("user_codes")
      .select("code")
      .eq("code", clientId)
      .single();
    return data?.code || null;
  } catch { return null; }
}

async function saveCode(code) {
  try {
    await supabase.from("user_codes").upsert({ code });
  } catch {}
}

async function loadIncoming(myCode) {
  try {
    const { data } = await supabase
      .from("friend_messages")
      .select("*")
      .eq("to_code", myCode)
      .order("created_at", { ascending: false });
    return data || [];
  } catch { return []; }
}

async function sendMessage(toCode, fromCode, text) {
  try {
    await supabase.from("friend_messages").insert({
      to_code: toCode,
      from_code: fromCode,
      text,
      ts: new Date().toLocaleDateString(),
    });
  } catch {}
}

async function deleteMessage(id) {
  try {
    await supabase.from("friend_messages").delete().eq("id", id);
  } catch {}
}

// ── MAP STAGES ────────────────────────────────────────────────────────────────
const STAGES = [
  { id: 0, name: "Tidal Pool",      emoji: "🌊", req: 0,  desc: "Your journey begins..." },
  { id: 1, name: "Sandy Shore",     emoji: "🏖️", req: 3,  desc: "The sand feels warm!" },
  { id: 2, name: "Kelp Forest",     emoji: "🌿", req: 8,  desc: "Getting adventurous!" },
  { id: 3, name: "Coral Reef",      emoji: "🪸", req: 15, desc: "Colourful and alive!" },
  { id: 4, name: "Open Ocean",      emoji: "🌊", req: 25, desc: "Out in the deep blue!" },
  { id: 5, name: "Sunken Ship",     emoji: "⚓",  req: 40, desc: "Hidden treasures await..." },
  { id: 6, name: "Volcanic Vent",   emoji: "🌋", req: 60, desc: "Hot stuff, Kani!" },
  { id: 7, name: "Treasure Island", emoji: "🏝️", req: 85, desc: "You found paradise!" },
];
function getStage(total) {
  let s = STAGES[0];
  for (const st of STAGES) { if (total >= st.req) s = st; }
  return s;
}
function getNextStage(total) {
  return STAGES.find(s => s.req > total) || null;
}

// ── STRESS RELIEF SUGGESTIONS ─────────────────────────────────────────────────
const SUGGESTIONS = [
  { cat: "🧘 Calm Down", color: "#00897B", tasks: [
    "Take 5 slow deep breaths",
    "Step outside for 5 minutes",
    "Make a warm drink and sit quietly",
    "Do a 2-minute body scan — relax each muscle",
    "Put on one calming song and just listen",
    "Splash cold water on your face",
    "Write down 3 things you can see right now",
  ]},
  { cat: "⚡ Quick Wins", color: "#F57C00", tasks: [
    "Clear your desk or one surface",
    "Delete 10 old emails or notifications",
    "Drink a full glass of water",
    "Make your bed",
    "Write tomorrow's top 3 tasks",
    "Reply to one message you've been putting off",
    "Wash the dishes in the sink",
  ]},
  { cat: "🏃 Move a Little", color: "#C62828", tasks: [
    "Do 10 jumping jacks",
    "Walk around the block once",
    "Stretch your neck and shoulders for 2 mins",
    "Dance to one song",
    "Do 5 minutes of yoga or stretching",
    "Take the stairs instead of the lift",
    "Stand up and shake out your hands",
  ]},
  { cat: "🌱 Self-Care", color: "#6A1B9A", tasks: [
    "Put your phone down for 15 minutes",
    "Eat a piece of fruit",
    "Write down one thing you're proud of today",
    "Tidy one small area that bothers you",
    "Light a candle or open a window",
    "Text someone you care about",
    "Do something creative for 10 minutes",
  ]},
];

// ── CRAB SVG ──────────────────────────────────────────────────────────────────
function Crab({ size = 72, animate = false, smiling = false }) {
  const eyeY = smiling ? 17 : 19;
  const mouthPath = smiling
    ? "M 24 29 Q 32 38 40 29"
    : "M 27 31 Q 32 28 37 31";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64"
      style={{ display:"block", filter: animate ? "drop-shadow(0 6px 16px #FF8A7166)" : "drop-shadow(0 3px 6px rgba(0,0,0,0.15))", transition:"all .4s" }}>
      <line x1="10" y1="36" x2="2"  y2="27" stroke="#c0392b" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="10" y1="41" x2="1"  y2="37" stroke="#c0392b" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="54" y1="36" x2="62" y2="27" stroke="#c0392b" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="54" y1="41" x2="63" y2="37" stroke="#c0392b" strokeWidth="3.5" strokeLinecap="round"/>
      <ellipse cx="7"  cy="23" rx="6.5" ry="5"   fill="#e74c3c" transform="rotate(-30 7 23)"/>
      <ellipse cx="5"  cy="19" rx="4.5" ry="3.2" fill="#c0392b" transform="rotate(-50 5 19)"/>
      <ellipse cx="57" cy="23" rx="6.5" ry="5"   fill="#e74c3c" transform="rotate(30 57 23)"/>
      <ellipse cx="59" cy="19" rx="4.5" ry="3.2" fill="#c0392b" transform="rotate(50 59 19)"/>
      <line x1="13" y1="32" x2="6"  y2="21" stroke="#c0392b" strokeWidth="4.5" strokeLinecap="round"/>
      <line x1="51" y1="32" x2="58" y2="21" stroke="#c0392b" strokeWidth="4.5" strokeLinecap="round"/>
      <ellipse cx="32" cy="38" rx="22" ry="14" fill="#e74c3c"/>
      <path d="M 15 33 Q 32 27 49 33" stroke="#c0392b" strokeWidth="1.5" fill="none" opacity="0.4"/>
      <path d="M 13 39 Q 32 32 51 39" stroke="#c0392b" strokeWidth="1.5" fill="none" opacity="0.4"/>
      <ellipse cx="32" cy="23" rx="14.5" ry="11.5" fill="#e74c3c"/>
      <circle cx="25" cy={eyeY} r="5.5" fill="white"/>
      <circle cx="39" cy={eyeY} r="5.5" fill="white"/>
      {smiling && <>
        <ellipse cx="25" cy={eyeY-3} rx="5.5" ry="3" fill="#e74c3c"/>
        <ellipse cx="39" cy={eyeY-3} rx="5.5" ry="3" fill="#e74c3c"/>
      </>}
      <circle cx="26" cy={eyeY+1} r="2.8" fill="#1a0800"/>
      <circle cx="40" cy={eyeY+1} r="2.8" fill="#1a0800"/>
      <circle cx="27" cy={eyeY-.5} r="1.1" fill="white"/>
      <circle cx="41" cy={eyeY-.5} r="1.1" fill="white"/>
      <path d={mouthPath} stroke={smiling ? "#fff" : "#c0392b"} strokeWidth={smiling ? 2.5 : 2} fill="none" strokeLinecap="round"/>
      {smiling && <>
        <ellipse cx="21" cy="27" rx="4.5" ry="2.5" fill="#ff8a80" opacity="0.75"/>
        <ellipse cx="43" cy="27" rx="4.5" ry="2.5" fill="#ff8a80" opacity="0.75"/>
      </>}
      <line x1="25" y1="12" x2="25" y2="18" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="39" y1="12" x2="39" y2="18" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── CONFETTI ──────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const pieces = useMemo(() => Array.from({ length: 26 }, (_, i) => ({
    x:    5 + Math.random() * 90,
    color: ["#FF8A71","#FFB300","#4ecdc4","#a29bfe","#2ecc71","#e74c3c","#f06292"][i % 7],
    delay: Math.random() * 0.65,
    size:  7 + Math.random() * 8,
    dur:   1.4 + Math.random() * 0.8,
    round: Math.random() > 0.5,
  })), []);  // stable — only computed once
  if (!active) return null;
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:300, overflow:"hidden" }}>
      <style>{`@keyframes confettiFall { to { transform: translateY(110vh) rotate(800deg); opacity:0; } }`}</style>
      {pieces.map((p, i) => (
        <div key={i} style={{ position:"absolute", left:p.x+"%", top:"-24px", width:p.size, height:p.size, borderRadius:p.round?"50%":"3px", background:p.color, animation:`confettiFall ${p.dur}s ${p.delay}s ease-in forwards` }}/>
      ))}
    </div>
  );
}

// ── OCEAN CREATURES ───────────────────────────────────────────────────────────
function Dolphin({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display:"block", filter:"drop-shadow(0 3px 6px rgba(0,0,0,0.12))" }}>
      {/* tail */}
      <path d="M 8 36 Q 4 28 2 38 Q 6 44 10 38 Z" fill="#4FC3F7"/>
      <path d="M 8 36 Q 4 44 2 34 Q 6 28 10 36 Z" fill="#29B6F6"/>
      {/* body */}
      <ellipse cx="30" cy="36" rx="22" ry="10" fill="#4FC3F7"/>
      {/* belly */}
      <ellipse cx="30" cy="38" rx="16" ry="6" fill="#E1F5FE"/>
      {/* dorsal fin */}
      <path d="M 32 26 Q 38 18 44 26 Z" fill="#29B6F6"/>
      {/* snout */}
      <path d="M 50 32 Q 60 34 58 38 Q 54 36 50 38 Z" fill="#4FC3F7"/>
      {/* eye */}
      <circle cx="48" cy="32" r="2.5" fill="#1a3a4a"/>
      <circle cx="49" cy="31" r="0.8" fill="white"/>
      {/* smile */}
      <path d="M 52 36 Q 56 38 58 36" stroke="#29B6F6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* pectoral fin */}
      <path d="M 36 38 Q 30 46 22 44 Q 28 40 36 38 Z" fill="#29B6F6"/>
    </svg>
  );
}

function Octopus({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display:"block", filter:"drop-shadow(0 3px 6px rgba(0,0,0,0.12))" }}>
      {/* tentacles */}
      {[0,1,2,3,4,5,6,7].map(i => {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = 32 + Math.cos(angle) * 14;
        const y1 = 36 + Math.sin(angle) * 10;
        const x2 = 32 + Math.cos(angle) * 28;
        const y2 = 54 + Math.sin(angle) * 6;
        const cx = 32 + Math.cos(angle + 0.3) * 22;
        const cy = 46 + Math.sin(angle) * 8;
        return <path key={i} d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} stroke="#AB47BC" strokeWidth="4" fill="none" strokeLinecap="round"/>;
      })}
      {/* body */}
      <ellipse cx="32" cy="28" rx="18" ry="16" fill="#CE93D8"/>
      {/* head bump */}
      <ellipse cx="32" cy="18" rx="12" ry="10" fill="#BA68C8"/>
      {/* eyes */}
      <circle cx="25" cy="26" r="5" fill="white"/>
      <circle cx="39" cy="26" r="5" fill="white"/>
      <circle cx="26" cy="27" r="2.5" fill="#4a0080"/>
      <circle cx="40" cy="27" r="2.5" fill="#4a0080"/>
      <circle cx="27" cy="26" r="1" fill="white"/>
      <circle cx="41" cy="26" r="1" fill="white"/>
      {/* smile */}
      <path d="M 26 33 Q 32 38 38 33" stroke="#9C27B0" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* blush */}
      <ellipse cx="20" cy="30" rx="3" ry="2" fill="#f48fb1" opacity="0.5"/>
      <ellipse cx="44" cy="30" rx="3" ry="2" fill="#f48fb1" opacity="0.5"/>
    </svg>
  );
}

function Mermaid({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display:"block", filter:"drop-shadow(0 3px 6px rgba(0,0,0,0.12))" }}>
      {/* tail fin */}
      <path d="M 24 54 Q 18 62 14 58 Q 20 52 24 54 Z" fill="#26C6DA"/>
      <path d="M 24 54 Q 30 62 34 58 Q 28 52 24 54 Z" fill="#00ACC1"/>
      {/* tail */}
      <path d="M 20 40 Q 16 50 24 54 Q 28 50 24 40 Z" fill="#26C6DA"/>
      {/* scales hint */}
      <path d="M 20 42 Q 24 44 28 42" stroke="#00ACC1" strokeWidth="1" fill="none" opacity="0.5"/>
      <path d="M 19 46 Q 24 48 29 46" stroke="#00ACC1" strokeWidth="1" fill="none" opacity="0.5"/>
      {/* body */}
      <ellipse cx="26" cy="32" rx="10" ry="12" fill="#FFCCBC"/>
      {/* top / shell bra */}
      <ellipse cx="22" cy="30" rx="5" ry="3.5" fill="#26C6DA" transform="rotate(-10 22 30)"/>
      <ellipse cx="30" cy="30" rx="5" ry="3.5" fill="#26C6DA" transform="rotate(10 30 30)"/>
      {/* arms */}
      <path d="M 16 28 Q 10 32 12 38" stroke="#FFCCBC" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M 36 28 Q 42 32 40 38" stroke="#FFCCBC" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* head */}
      <circle cx="26" cy="18" r="11" fill="#FFCCBC"/>
      {/* hair */}
      <path d="M 16 14 Q 14 24 16 32" stroke="#F06292" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M 36 14 Q 38 24 36 32" stroke="#F06292" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <ellipse cx="26" cy="12" rx="11" ry="7" fill="#F06292"/>
      {/* eyes */}
      <circle cx="22" cy="18" r="2.5" fill="#4a2800"/>
      <circle cx="30" cy="18" r="2.5" fill="#4a2800"/>
      <circle cx="23" cy="17" r="0.9" fill="white"/>
      <circle cx="31" cy="17" r="0.9" fill="white"/>
      {/* smile */}
      <path d="M 22 23 Q 26 27 30 23" stroke="#e57373" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* blush */}
      <ellipse cx="18" cy="21" rx="2.5" ry="1.5" fill="#ff8a80" opacity="0.5"/>
      <ellipse cx="34" cy="21" rx="2.5" ry="1.5" fill="#ff8a80" opacity="0.5"/>
    </svg>
  );
}

// ── CREATURE CONFIG ───────────────────────────────────────────────────────────
const CREATURES = [
  { id: "crab",    emoji: "🦀", name: "Crab" },
  { id: "dolphin", emoji: "🐬", name: "Dolphin" },
  { id: "octopus", emoji: "🐙", name: "Octopus" },
  { id: "mermaid", emoji: "🧜", name: "Mermaid" },
];

function CreatureIcon({ id, size = 56, smiling = false, animate = false }) {
  if (id === "dolphin") return <Dolphin size={size}/>;
  if (id === "octopus") return <Octopus size={size}/>;
  if (id === "mermaid") return <Mermaid size={size}/>;
  return <Crab size={size} smiling={smiling} animate={animate}/>;
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [ready, setReady]             = useState(false);
  const [tab, setTab]                 = useState("chest");
  const [ideas, setIdeas]             = useState([]);
  const [newIdea, setNewIdea]         = useState("");
  const [shuffled, setShuffled]       = useState(null);
  const [myCode, setMyCode]           = useState("");
  const [joinCode, setJoinCode]       = useState("");
  const [friendBoxes, setFriendBoxes] = useState([]);
  const [friendIdea, setFriendIdea]   = useState("");
  const [friendTarget, setFriendTarget]   = useState(null);
  const [editingFriend, setEditingFriend] = useState(null);
  const [editingName, setEditingName]     = useState("");
  const [incoming, setIncoming]       = useState([]);
  const [toast, setToast]             = useState({ msg:"", visible:false });
  const [confetti, setConfetti]       = useState(false);
  const [totalDone, setTotalDone]     = useState(0);
  const [justLeveled, setJustLeveled] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [openCat, setOpenCat]         = useState(null);
  const [firstVisit, setFirstVisit]   = useState(false);
  const [myCreature, setMyCreature]   = useState(null);
  const toastRef = useRef();

  const showToast = (msg) => {
    setToast({ msg, visible:true });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(t => ({ ...t, visible:false })), 2600);
  };

  const fireCelebration = () => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3500);
  };

  useEffect(() => {
    (async () => {
      // Get or create a client ID stored in localStorage
      let clientId = localStorage.getItem("kd_client_id");
      if (!clientId) {
        clientId = generateCode();
        localStorage.setItem("kd_client_id", clientId);
        await saveCode(clientId);
        setFirstVisit(true);
      }
      setMyCode(clientId);

      // Load ideas from Supabase
      const savedIdeas = await loadIdeas(clientId);
      setIdeas(savedIdeas);

      // Load total done count
      const savedTotal = localStorage.getItem("kd_total");
      setTotalDone(savedTotal ? parseInt(savedTotal) : 0);

      // Load friend boxes from localStorage
      const savedFriends = localStorage.getItem("kd_friends");
      if (savedFriends) setFriendBoxes(JSON.parse(savedFriends));

      // Load creature choice
      const savedCreature = localStorage.getItem("kd_creature");
      setMyCreature(savedCreature || null);

      // Load incoming messages
      const inc = await loadIncoming(clientId);
      setIncoming(inc);

      setReady(true);
    })();
  }, []);

  const saveIdeas = async (list) => {
    setIdeas(list);
    await saveIdeasToDb(myCode, list);
  };

  const addIdea = async () => {
    if (!newIdea.trim()) return;
    const newItem = { id: Date.now(), text: newIdea.trim(), done: false, ts: new Date().toLocaleDateString() };
    const updated = [newItem, ...ideas];
    setIdeas(updated);
    await supabase.from("ideas").insert({ ...newItem, client_id: myCode });
    setNewIdea(""); setFirstVisit(false);
    showToast("✨ Added to your box!");
  };

  const toggleDone = async (id) => {
    const idea = ideas.find(i => i.id === id);
    const wasUndone = !idea?.done;
    const updated = ideas.map(i => i.id === id ? { ...i, done: !i.done } : i);
    setIdeas(updated);
    await supabase.from("ideas").update({ done: !idea.done }).eq("id", id).eq("client_id", myCode);
    if (wasUndone) {
      const newTotal = totalDone + 1;
      const prev = getStage(totalDone), next = getStage(newTotal);
      setTotalDone(newTotal);
      localStorage.setItem("kd_total", String(newTotal));
      fireCelebration();
      if (next.id > prev.id) {
        setJustLeveled(true);
        setTimeout(() => setJustLeveled(false), 3000);
        showToast(`🎉 ${next.emoji} ${next.name} unlocked!`);
      } else {
        showToast("🦀 Kani do it! Task complete!");
      }
    }
    if (shuffled?.id === id) setShuffled(s => s ? { ...s, done: !s.done } : null);
  };

  const deleteIdea = async (id) => {
    setIdeas(ideas.filter(i => i.id !== id));
    await supabase.from("ideas").delete().eq("id", id).eq("client_id", myCode);
    if (shuffled?.id === id) setShuffled(null);
  };

  const addSuggestion = async (text) => {
    const newItem = { id: Date.now(), text, done: false, ts: new Date().toLocaleDateString(), tag: "feel-good" };
    setIdeas([newItem, ...ideas]);
    await supabase.from("ideas").insert({ ...newItem, client_id: myCode });
    setShowSuggestions(false); setOpenCat(null);
    showToast("🌊 Added to your box!");
  };

  const doShuffle = () => {
    const pool = ideas.filter(i => !i.done);
    if (!pool.length) return;
    setShuffled(pool[Math.floor(Math.random() * pool.length)]);
  };

  const joinFriend = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    if (code === myCode) { showToast("That's your own code!"); return; }
    if (friendBoxes.find(b => b.code === code)) { showToast("Already connected!"); return; }
    // Check if the code exists
    const { data } = await supabase.from("user_codes").select("code").eq("code", code).single();
    if (!data) { showToast("Code not found — double check with your friend"); return; }
    const updated = [...friendBoxes, { code, label: "Friend " + (friendBoxes.length + 1) }];
    setFriendBoxes(updated);
    localStorage.setItem("kd_friends", JSON.stringify(updated));
    setJoinCode("");
    showToast("🎉 Connected to their box!");
  };

  const sendToFriend = async (code) => {
    if (!friendIdea.trim()) return;
    await sendMessage(code, myCode, friendIdea.trim());
    setFriendIdea(""); setFriendTarget(null);
    showToast("💌 Idea sent!");
  };

  const acceptIncoming = async (item) => {
    const newItem = { id: Date.now(), text: item.text, done: false, ts: item.ts, from_friend: item.from_code };
    setIdeas([newItem, ...ideas]);
    await supabase.from("ideas").insert({ ...newItem, client_id: myCode });
    await deleteMessage(item.id);
    setIncoming(incoming.filter(i => i.id !== item.id));
    showToast("✨ Added to your box!");
  };

  const dismissIncoming = async (item) => {
    await deleteMessage(item.id);
    setIncoming(incoming.filter(i => i.id !== item.id));
  };

  const refreshIncoming = async () => {
    const inc = await loadIncoming(myCode);
    setIncoming(inc);
    showToast("Refreshed!");
  };

  const pickCreature = (id) => {
    setMyCreature(id);
    localStorage.setItem("kd_creature", id);
  };

  const renameFriend = (code, newName) => {
    const updated = friendBoxes.map(b => b.code === code ? { ...b, label: newName } : b);
    setFriendBoxes(updated);
    localStorage.setItem("kd_friends", JSON.stringify(updated));
    setEditingFriend(null);
    setEditingName("");
    showToast("Name updated! ⚓");
  };

  // ── DERIVED ────────────────────────────────────────────────────────────────
  const stage     = getStage(totalDone);
  const nextStage = getNextStage(totalDone);
  const toNext    = nextStage ? nextStage.req - totalDone : 0;
  const stagePct  = nextStage ? ((totalDone - stage.req) / (nextStage.req - stage.req)) * 100 : 100;
  const activeCnt = ideas.filter(i => !i.done).length;
  const doneCnt   = ideas.filter(i => i.done).length;
  const justSmiled = doneCnt >= 1; // Kani smiles permanently once first task is done

  // ── DESIGN TOKENS ──────────────────────────────────────────────────────────
  const C = {
    aqua:"#B2EBF2", bgFrom:"#4DB6AC", bgTo:"#006064",
    coral:"#FF8A71", navText:"#002D2F", muted:"#4a8c8e",
    card:"#ffffff", cardBorder:"#C8F0F5",
    accent2:"#00897B", gold:"#FFB300", danger:"#E53935",
    inputBg:"#E0F7FA", inputBorder:"#80DEEA",
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Nunito',sans-serif; background:${C.bgTo}; -webkit-tap-highlight-color:transparent; }
    button { cursor:pointer; font-family:'Nunito',sans-serif; }
    textarea, input { font-family:'Nunito',sans-serif; }
    @keyframes bob     { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-8px)} }
    @keyframes bobFast { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-11px)} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes slideUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes popIn   { 0%{transform:scale(.87);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
    .idea-row  { animation: slideUp .26s ease both; }
    .tab-pane  { animation: fadeIn .22s ease; }
  `;

  const s = {
    app:    { minHeight:"100vh", background:`linear-gradient(175deg, ${C.bgFrom} 0%, ${C.bgTo} 100%)`, color:C.navText, paddingBottom:100 },
    wrap:   { maxWidth:480, margin:"0 auto", padding:"20px 16px 0" },
    topBand:{ background:C.aqua },
    header: { padding:"26px 20px 0", textAlign:"center" },
    logo:   { fontSize:38, fontWeight:700, color:C.navText, fontFamily:"'Fredoka',sans-serif", letterSpacing:.5 },
    logoC:  { color:C.coral },
    tagline:{ fontSize:11.5, color:C.muted, letterSpacing:2.5, textTransform:"uppercase", marginTop:5, marginBottom:18, fontWeight:700 },
    tabs:   { display:"flex", gap:7, padding:"10px 14px 14px" },
    tab:    (a) => ({ flex:1, padding:"10px 3px", borderRadius:14, border:"none", fontSize:12, fontWeight:800, transition:"all .18s", background:a?C.coral:"rgba(0,45,47,0.1)", color:a?"#fff":C.navText, boxShadow:a?"0 3px 10px rgba(255,138,113,0.45)":"none", letterSpacing:.2 }),
    card:   { background:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:20, padding:20, marginBottom:14, boxShadow:"0 2px 20px rgba(0,96,100,0.10)" },
    adventureCard: { background:C.aqua, borderRadius:20, padding:20, marginBottom:14, boxShadow:"0 2px 20px rgba(0,96,100,0.12)" },
    label:  { fontSize:11, color:C.muted, letterSpacing:2.5, textTransform:"uppercase", marginBottom:12, fontWeight:800, display:"block" },
    item:   (d) => ({ background:d?"#F1FBF6":"#fff", border:`1.5px solid ${d?"#B2DFDB":C.cardBorder}`, borderRadius:16, padding:"13px 14px", display:"flex", alignItems:"flex-start", gap:12, marginBottom:9 }),
    check:  (d) => ({ width:28, height:28, borderRadius:"50%", border:`2.5px solid ${d?C.accent2:C.inputBorder}`, background:d?C.accent2:"transparent", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:13, fontWeight:900, marginTop:1, transition:"all .2s", cursor:"pointer" }),
    iText:  (d) => ({ flex:1, fontSize:14.5, lineHeight:1.55, color:d?C.muted:C.navText, textDecoration:d?"line-through":"none", textDecorationColor:C.accent2, transition:"color .2s" }),
    del:    { background:"transparent", border:"none", color:"#aaa", fontSize:16, padding:"0 2px", flexShrink:0, marginTop:2 },
    meta:   { fontSize:11, color:C.muted, marginTop:3, opacity:.8 },
    textarea:{ width:"100%", background:C.inputBg, border:`1.5px solid ${C.inputBorder}`, borderRadius:14, padding:"13px 15px", color:C.navText, fontSize:15, resize:"none", minHeight:92, outline:"none", lineHeight:1.55 },
    input:  { flex:1, background:C.inputBg, border:`1.5px solid ${C.inputBorder}`, borderRadius:13, padding:"12px 15px", color:C.navText, fontSize:14, outline:"none", letterSpacing:3, textTransform:"uppercase" },
    btn:    (bg=C.coral,fg="#fff") => ({ width:"100%", marginTop:11, padding:"14px", background:bg, border:"none", borderRadius:14, color:fg, fontSize:15, fontWeight:800, transition:"opacity .15s", boxShadow:`0 3px 10px ${bg}44`, letterSpacing:.3 }),
    smBtn:  (c) => ({ padding:"6px 13px", background:c+"18", border:`1.5px solid ${c}55`, borderRadius:9, color:c, fontSize:12, fontWeight:800 }),
    outline:{ background:"transparent", border:`1.5px solid ${C.inputBorder}`, borderRadius:13, padding:"11px 15px", color:C.navText, fontSize:13, fontWeight:700 },
    row:    { display:"flex", gap:8 },
    empty:  { textAlign:"center", padding:"44px 24px", color:"rgba(255,255,255,0.75)", fontSize:14, lineHeight:1.9 },
    emptyIcon:{ fontSize:44, marginBottom:14, display:"block" },
    toast:  (v) => ({ position:"fixed", bottom:28, left:"50%", transform:`translateX(-50%) translateY(${v?0:10}px)`, background:"#002D2F", color:"#fff", padding:"12px 24px", borderRadius:50, fontSize:13, fontWeight:800, zIndex:400, pointerEvents:"none", whiteSpace:"nowrap", transition:"all .3s", opacity:v?1:0, boxShadow:"0 4px 20px rgba(0,0,0,0.25)" }),
    codeBox:{ background:C.inputBg, border:`2px dashed ${C.coral}`, borderRadius:14, padding:"16px 18px", marginBottom:14, textAlign:"center" },
    codeVal:{ fontFamily:"monospace", fontSize:30, letterSpacing:7, color:C.coral, fontWeight:900 },
    divider:{ textAlign:"center", color:"rgba(255,255,255,0.45)", fontSize:12, margin:"6px 0 16px", letterSpacing:1.5, fontWeight:600 },
  };

  if (!ready) return (
    <div style={{ ...s.app, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <div style={{ animation:"bob 1.4s infinite" }}><Crab size={72}/></div>
      <div style={{ color:"#B2EBF2", fontFamily:"'Fredoka',sans-serif", fontSize:22, fontWeight:600 }}>Loading Kani Do...</div>
    </div>
  );

  // Creature chooser screen — shown on first visit
  if (!myCreature) return (
    <>
      <style>{css}</style>
      <div style={{ ...s.app, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", padding:"40px 24px" }}>
        <div style={{ color:"#B2EBF2", fontFamily:"'Fredoka',sans-serif", fontSize:28, fontWeight:700, marginBottom:8, textAlign:"center" }}>
          Welcome to Kani Do! 🌊
        </div>
        <div style={{ color:"rgba(255,255,255,0.75)", fontSize:15, marginBottom:36, textAlign:"center", lineHeight:1.7 }}>
          Choose your sea creature to get started.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, width:"100%", maxWidth:340 }}>
          {CREATURES.map(c => (
            <button key={c.id} onClick={() => pickCreature(c.id)}
              style={{ background:"rgba(255,255,255,0.12)", border:"2px solid rgba(255,255,255,0.25)", borderRadius:20, padding:"24px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:10, cursor:"pointer", transition:"all .2s" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.22)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.12)"}
            >
              <div style={{ animation:"bob 2s infinite ease-in-out" }}>
                <CreatureIcon id={c.id} size={64}/>
              </div>
              <div style={{ color:"#fff", fontWeight:800, fontSize:15, fontFamily:"'Fredoka',sans-serif" }}>{c.name}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <Confetti active={confetti}/>
      <div style={s.app}>

        {/* ── TOP BAND ── */}
        <div style={s.topBand}>
          <div style={s.header}>
            <div style={s.logo}>Kani <span style={s.logoC}>Do</span> 🦀</div>
            <div style={s.tagline}>Navigate your day, one island at a time</div>
          </div>
          <div style={s.tabs}>
            {[["chest","🪙 Chest"],["map","🗺️ Map"],["bounty",`⚓ Bounty${incoming.length?` (${incoming.length})`:""}`]].map(([k,l])=>(
              <button key={k} style={s.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <svg viewBox="0 0 480 28" preserveAspectRatio="none" style={{ display:"block", width:"100%" }} height="28">
          <path d="M0,0 L480,0 L480,10 Q360,28 240,18 Q120,8 0,20 Z" fill={C.aqua}/>
        </svg>

        <div style={s.wrap} className="tab-pane" key={tab}>

          {/* ══ MAP ══════════════════════════════════════════════════════════ */}
          {tab === "map" && (
            <>
              <div style={{ ...s.adventureCard, textAlign:"center" }}>
                <div style={{ animation: justLeveled ? "bobFast .4s 4" : "bob 2.2s infinite ease-in-out", display:"inline-block", marginBottom:10 }}>
                  <CreatureIcon id={myCreature} size={84} animate={justLeveled} smiling={justSmiled}/>
                </div>
                </div>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:700, fontSize:22, color:C.navText, marginBottom:3 }}>{stage.emoji} {stage.name}</div>
                <div style={{ fontSize:13, color:C.muted, marginBottom:14 }}>{stage.desc}</div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(0,45,47,0.08)", borderRadius:50, padding:"6px 16px", marginBottom:14 }}>
                  <span style={{ fontSize:16 }}>⭐</span>
                  <span style={{ fontSize:14, fontWeight:800, color:C.navText }}>{totalDone} task{totalDone!==1?"s":""} completed</span>
                </div>
                {nextStage ? (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:6, fontWeight:700 }}>
                      <span>Next: {nextStage.emoji} {nextStage.name}</span>
                      <span>{toNext} to go</span>
                    </div>
                    <div style={{ height:10, background:"rgba(0,45,47,0.12)", borderRadius:50, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:Math.max(4,stagePct)+"%", background:`linear-gradient(90deg, ${C.coral}, ${C.gold})`, borderRadius:50, transition:"width 1s ease" }}/>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize:14, color:C.gold, fontWeight:800 }}>🏆 You've reached the end — legend!</div>
                )}
      </div>
    </div>
    <div style={s.toast(toast.visible)}>{toast.msg}</div>
  </>
  );
}
