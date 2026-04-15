"use client";

import { useEffect, useState, useCallback } from "react";

// ── Hacker Lock Screen ───────────────────────────────────────────────────
function LockScreen({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const inputEl = document.getElementById("pios-lock-input");
    if (inputEl) inputEl.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input) return;
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: input })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("pios_access", "granted");
        onUnlock();
      } else {
        setError("ACCESS DENIED");
        setInput("");
      }
    } catch {
      setError("CONNECTION FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", width: "100vw", backgroundColor: "#050505", color: "#00ff41", fontFamily: "monospace", padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <div style={{ maxWidth: "600px", width: "100%" }}>
        <div style={{ marginBottom: "2rem", opacity: 0.9, lineHeight: 1.6 }}>
          INITIALIZING PIOS TERMINAL v2.0.4<br/>
          ENCRYPTED CONNECTION ESTABLISHED.<br/>
          <br/>
          AWAITING AUTHORIZATION...
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ marginRight: "1rem", color: "#00ff41" }}>root@pios:~$</span>
            <input 
              id="pios-lock-input"
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoComplete="off"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#00ff41",
                fontFamily: "monospace",
                fontSize: "1rem",
                outline: "none",
                flex: 1,
                letterSpacing: "4px"
              }}
            />
          </div>

          {error && <div style={{ color: "#ff003c", marginTop: "1rem", fontWeight: "bold" }}>[ERROR] {error}</div>}
        </form>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        input[type="password"]::-webkit-textfield-decoration-container { visibility: hidden; }
        input[type="password"]::-ms-reveal { display: none; }
      `}} />
    </div>
  );
}


// ── Expandable Item Component ───────────────────────────────────────────────
function ExpandableItem({ title, subtitle, content, aiSummary, link }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: 10,
        border: "1px solid var(--border-subtle)",
        transition: "all 0.2s ease",
        marginBottom: 8,
        overflow: "hidden"
      }}
    >
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ flex: 1, paddingRight: 10 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.4, marginBottom: 4, color: "var(--text-primary)" }}>{title}</div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", gap: 8, flexWrap: "wrap" }}>{subtitle}</div>
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          {expanded ? "▲" : "▼"}
        </div>
      </div>
      
      {expanded && (
        <div style={{ padding: "0 14px 14px 14px", fontSize: "0.8rem", color: "var(--text-secondary)", borderTop: "1px solid var(--border-subtle)", paddingTop: 10 }}>
          {content && <div style={{ marginBottom: 12, lineHeight: 1.5 }}>{content}</div>}
          
          {aiSummary && (
            <div style={{ padding: "10px", background: "rgba(139, 92, 246, 0.06)", borderRadius: 8, border: "1px solid rgba(139, 92, 246, 0.1)", marginBottom: 12 }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#a78bfa", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <span className="ai-sparkle">✨</span> AI Review Insight
              </div>
              <div style={{ color: "var(--text-primary)", lineHeight: 1.5 }}>{aiSummary}</div>
            </div>
          )}
          
          {link && (
            <div>
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 500, fontSize: "0.75rem" }}>
                Open Original →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Gauge Ring Component ──────────────────────────────────────────────────
function GaugeRing({ value = 0, color = "#3b82f6", label = "", size = 80 }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="gauge-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle className="gauge-bg" cx="40" cy="40" r={radius} />
        <circle
          className="gauge-fill"
          cx="40"
          cy="40"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-value" style={{ color }}>
        {value?.toFixed(0)}%
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────
function SkeletonCard({ className = "" }) {
  return (
    <div className={`card ${className}`}>
      <div className="skeleton" style={{ height: 16, width: "40%", marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 12, width: "80%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 12, width: "60%" }} />
    </div>
  );
}

// ── Time Display ──────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
        {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
        {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
}

// ── Weather Widget Component ───────────────────────────────────────────────
function WeatherWidget({ weather }) {
  const [expanded, setExpanded] = useState(false);

  if (!weather || !weather.current_weather) return null;
  const current = weather.current_weather;
  const daily = weather.daily || {};

  const getWeatherEmoji = (code) => {
    if (code === 0) return "☀️";
    if ([1, 2].includes(code)) return "⛅";
    if (code === 3) return "☁️";
    if ([45, 48].includes(code)) return "🌫";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
    if ([95, 96, 99].includes(code)) return "⛈";
    return "🌡";
  };

  return (
    <div 
      className="card card-glow-cyan animate-fade-in animate-delay-2" 
      onClick={() => setExpanded(!expanded)} 
      style={{ cursor: "pointer", transition: "all 0.3s ease", userSelect: "none" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: expanded ? 24 : 16 }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1.2rem" }}>🌦</span> Weather
        </h2>
        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}>
          ▼
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#22d3ee" }}>
          {current.temperature}°
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          {current.is_day ? "☀️ Daytime" : "🌙 Night"} • {current.windspeed} km/h wind
        </div>
      </div>

      {!expanded ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.75rem" }}>
          <div style={{ padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8 }}>
            <span style={{ color: "var(--text-muted)" }}>Wind</span>
            <div style={{ fontWeight: 600 }}>{current.windspeed} km/h</div>
          </div>
          <div style={{ padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8 }}>
            <span style={{ color: "var(--text-muted)" }}>Direction</span>
            <div style={{ fontWeight: 600 }}>{current.winddirection}°</div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
          <h3 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>7-Day Forecast</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {daily.time?.map((dateStr, idx) => {
              const date = new Date(dateStr);
              const dayName = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }); // Open-Meteo daily dates usually meant to be treated as local "UTC" string format "YYYY-MM-DD"
              const min = daily.temperature_2m_min[idx];
              const max = daily.temperature_2m_max[idx];
              const code = daily.weathercode[idx];
              const isToday = idx === 0;

              return (
                <div key={dateStr} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: isToday ? "rgba(34, 211, 238, 0.1)" : "var(--bg-elevated)", borderRadius: 8, border: isToday ? "1px solid rgba(34, 211, 238, 0.2)" : "1px solid transparent" }}>
                  <div style={{ flex: 1, fontSize: "0.85rem", fontWeight: isToday ? 600 : 400, color: isToday ? "#22d3ee" : "var(--text-primary)" }}>
                    {isToday ? "Today" : dayName}
                  </div>
                  <div style={{ fontSize: "1.2rem", padding: "0 16px" }}>
                    {getWeatherEmoji(code)}
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: "0.8rem", width: 80, justifyContent: "flex-end" }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{Math.round(max)}°</span>
                    <span style={{ color: "var(--text-muted)" }}>{Math.round(min)}°</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export default function Home() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [data, setData] = useState({
    system: null,
    weather: null,
    news: null,
    emails: null,
    research: null,
    youtube: null,
    analytics: null,
    aiInsights: null,
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (localStorage.getItem("pios_access") === "granted") {
      setIsAuthorized(true);
    }
    setAuthChecked(true);
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const endpoints = [
        { key: "system", url: "/api/system" },
        { key: "weather", url: "/api/weather" },
        { key: "news", url: "/api/news" },
        { key: "research", url: "/api/research" },
        { key: "emails", url: "/api/email" },
        { key: "youtube", url: "/api/youtube" },
        { key: "analytics", url: "/api/analytics" },
        { key: "aiInsights", url: "/api/ai/insights" },
      ];

      const results = await Promise.allSettled(
        endpoints.map((e) => fetch(e.url).then((r) => r.json()))
      );

      const newData = {};
      endpoints.forEach((e, i) => {
        newData[e.key] = results[i].status === "fulfilled" ? results[i].value : null;
      });

      setData((prev) => ({ ...prev, ...newData }));
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    
    fetchAllData();
    const interval = setInterval(fetchAllData, 120000); // 2 min refresh
    return () => clearInterval(interval);
  }, [fetchAllData, isAuthorized]);

  if (!authChecked) {
    return <div style={{ minHeight: "100vh", background: "#050505" }} />;
  }

  if (!isAuthorized) {
    return <LockScreen onUnlock={() => setIsAuthorized(true)} />;
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", padding: "2rem", background: "var(--bg-primary)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div className="skeleton" style={{ height: 40, width: 280, marginBottom: 40 }} />
          <div className="dashboard-grid">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const { system, weather, news, research, emails, youtube, analytics, aiInsights } = data;

  return (
    <main style={{ minHeight: "100vh", padding: "1.5rem 2rem", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* ═══ HEADER ═══════════════════════════════════════════════════ */}
        <header
          className="animate-fade-in"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "2rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>
              <span style={{ background: "linear-gradient(135deg, #60a5fa, #a78bfa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                PIOS
              </span>
              {" "}
              <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>Dashboard</span>
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <span className="status-dot online" />
              <span>All systems operational</span>
              {lastRefresh && (
                <span style={{ marginLeft: 8, opacity: 0.6 }}>
                  Updated {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <LiveClock />
        </header>

        {/* ═══ TOPIC FILTER BAR ═══════════════════════════════════════ */}
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            gap: 8,
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          {[
            { key: "all", label: "All", icon: "🌐" },
            { key: "quantum", label: "Quantum", icon: "⚛️" },
            { key: "blockchain", label: "Blockchain", icon: "🔗" },
            { key: "ai", label: "AI", icon: "🤖" },
            { key: "geopolitics", label: "Geopolitics", icon: "🌍" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                border: activeFilter === f.key
                  ? "1px solid rgba(139, 92, 246, 0.5)"
                  : "1px solid var(--border-subtle)",
                background: activeFilter === f.key
                  ? "rgba(139, 92, 246, 0.15)"
                  : "var(--bg-card)",
                color: activeFilter === f.key
                  ? "#a78bfa"
                  : "var(--text-secondary)",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) => {
                if (activeFilter !== f.key) {
                  e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilter !== f.key) {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <span>{f.icon}</span> {f.label}
            </button>
          ))}
        </div>

        <div className="dashboard-grid">

          {/* ═══ SYSTEM METRICS ═══════════════════════════════════════ */}
          {system && (
            <div className="card card-glow-blue animate-fade-in animate-delay-1 col-span-2">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.2rem" }}>🖥️</span> Server Metrics
                </h2>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className="badge badge-blue">{system.platform} • {system.arch}</span>
                  <span className="badge badge-purple" style={{ fontSize: "0.6rem" }}>Render</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", marginBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <GaugeRing value={system.cpu?.usage} color="#3b82f6" />
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 6 }}>CPU</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <GaugeRing value={system.ram?.percentage} color="#8b5cf6" />
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 6 }}>RAM</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <GaugeRing value={system.disk?.[0]?.percentage} color="#06b6d4" />
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 6 }}>Disk</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.75rem" }}>
                <div style={{ padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8 }}>
                  <span style={{ color: "var(--text-muted)" }}>Hostname</span>
                  <div style={{ fontWeight: 600 }}>{system.hostname}</div>
                </div>
                <div style={{ padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8 }}>
                  <span style={{ color: "var(--text-muted)" }}>Uptime</span>
                  <div style={{ fontWeight: 600 }}>{system.uptime}</div>
                </div>
                <div style={{ padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8 }}>
                  <span style={{ color: "var(--text-muted)" }}>CPU Model</span>
                  <div style={{ fontWeight: 600, fontSize: "0.7rem" }}>{system.cpu?.model?.slice(0, 30)}</div>
                </div>
                <div style={{ padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8 }}>
                  <span style={{ color: "var(--text-muted)" }}>RAM Used</span>
                  <div style={{ fontWeight: 600 }}>{system.ram?.used} / {system.ram?.total}</div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ WEATHER ══════════════════════════════════════════════ */}
          <WeatherWidget weather={weather} />

          {/* ═══ YOUTUBE ══════════════════════════════════════════════ */}
          {youtube && !youtube.error && (
            <div className="card card-glow-rose animate-fade-in animate-delay-3">
              <h2 style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: "1.2rem" }}>📺</span> YouTube
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Subscribers", value: parseInt(youtube.subscriberCount || 0).toLocaleString(), color: "#fb7185" },
                  { label: "Total Views", value: parseInt(youtube.viewCount || 0).toLocaleString(), color: "#f43f5e" },
                  { label: "Videos", value: youtube.videoCount || 0, color: "#e11d48" },
                ].map((stat) => (
                  <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 8 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{stat.label}</span>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ GA4 ANALYTICS ════════════════════════════════════════ */}
          {analytics?.stats && (
            <div className="card card-glow-purple animate-fade-in animate-delay-3 col-span-2">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.2rem" }}>📊</span> Website Analytics
                </h2>
                <span className="badge badge-purple">{analytics.stats.dateRange}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Active Users", value: analytics.stats.activeUsers?.toLocaleString(), color: "#a78bfa" },
                  { label: "Sessions", value: analytics.stats.sessions?.toLocaleString(), color: "#8b5cf6" },
                  { label: "Page Views", value: analytics.stats.pageViews?.toLocaleString(), color: "#7c3aed" },
                ].map((stat) => (
                  <div key={stat.label} style={{ padding: "12px", background: "var(--bg-elevated)", borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "New Users", value: analytics.stats.newUsers?.toLocaleString(), color: "#34d399" },
                  { label: "Bounce Rate", value: `${(analytics.stats.bounceRate * 100).toFixed(1)}%`, color: "#fbbf24" },
                  { label: "Avg Duration", value: `${Math.round(analytics.stats.avgSessionDuration)}s`, color: "#22d3ee" },
                ].map((stat) => (
                  <div key={stat.label} style={{ padding: "12px", background: "var(--bg-elevated)", borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Top Pages */}
              {analytics.topPages?.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Top Pages</div>
                  {analytics.topPages.map((page, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", fontSize: "0.75rem", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span style={{ color: "var(--text-primary)", fontFamily: "monospace", fontSize: "0.7rem" }}>{page.page}</span>
                      <span style={{ color: "#a78bfa", fontWeight: 600 }}>{page.views}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ AI INSIGHTS ══════════════════════════════════════════ */}
          {aiInsights?.newsSummaries?.length > 0 && (
            <div className="card card-glow-purple animate-fade-in animate-delay-2 col-span-2">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="ai-sparkle" style={{ fontSize: "1.2rem" }}>🧠</span> AI Intelligence Feed
                </h2>
                <span className="badge badge-purple">
                  {aiInsights.counts?.news || 0} insights
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {aiInsights.newsSummaries.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="ai-insight" style={{ fontSize: "0.8rem" }}>
                    <div style={{ color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 4 }}>
                      {item.summary}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="badge badge-purple" style={{ fontSize: "0.6rem" }}>
                        via {item.provider}
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ EMAILS ══════════════════════════════════════════════ */}
          {emails && Array.isArray(emails) && emails.length > 0 && (
            <div className="card card-glow-emerald animate-fade-in animate-delay-3 col-span-2">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.2rem" }}>📧</span> Gmail
                </h2>
                <span className="badge badge-emerald">{emails.length} emails</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {emails.slice(0, 6).map((email, idx) => (
                  <ExpandableItem
                    key={email.id || idx}
                    title={email.subject || "(No subject)"}
                    subtitle={<span>{email.from}</span>}
                    content={email.snippet}
                    aiSummary={aiInsights?.emailInsights?.find(e => e.subject === email.subject || e.input?.includes(email.subject))?.reason}
                    link={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ═══ NEWS ═════════════════════════════════════════════════ */}
          {news?.articles && (() => {
            const filteredArticles = activeFilter === "all"
              ? news.articles
              : news.articles.filter((a) => {
                  const text = ((a.title || "") + " " + (a.description || "")).toLowerCase();
                  if (activeFilter === "quantum") return /quantum/.test(text);
                  if (activeFilter === "blockchain") return /blockchain|crypto|defi|web3/.test(text);
                  if (activeFilter === "ai") return /\bai\b|artificial intelligence|machine learning|neural|deep learning|llm/.test(text);
                  if (activeFilter === "geopolitics") return /geopolit|sanctions|diplomacy|conflict|nato|treaty/.test(text);
                  return true;
                });
            return filteredArticles.length > 0 ? (
            <div className="card animate-fade-in animate-delay-3 col-span-2">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.2rem" }}>📰</span> Latest News
                  {activeFilter !== "all" && (
                    <span style={{ fontSize: "0.7rem", color: "#a78bfa", fontWeight: 400 }}>({activeFilter})</span>
                  )}
                </h2>
                <span className="badge badge-amber">{filteredArticles.length} articles</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {filteredArticles.slice(0, 8).map((article, idx) => (
                  <ExpandableItem
                    key={idx}
                    title={article.title}
                    subtitle={
                      <>
                        <span>{article.source?.name}</span>
                        <span>•</span>
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                      </>
                    }
                    content={article.description}
                    aiSummary={aiInsights?.newsSummaries?.find(s => s.title === article.title || s.input?.includes(article.title))?.summary}
                    link={article.url}
                  />
                ))}
              </div>
            </div>
            ) : null;
          })()}

          {/* ═══ RESEARCH ═════════════════════════════════════════════ */}
          {research && Array.isArray(research) && research.length > 0 && (() => {
            const filteredPapers = activeFilter === "all"
              ? research
              : research.filter((p) => {
                  const text = (p.title || "").toLowerCase();
                  if (activeFilter === "quantum") return /quantum/.test(text);
                  if (activeFilter === "blockchain") return /blockchain|distributed ledger/.test(text);
                  if (activeFilter === "ai") return /\bai\b|artificial intelligence|machine learning|neural|deep learning|llm|language model|federated/.test(text);
                  if (activeFilter === "geopolitics") return /geopolit|security|policy|governance/.test(text);
                  return true;
                });
            return filteredPapers.length > 0 ? (
            <div className="card animate-fade-in animate-delay-4 col-span-2">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.2rem" }}>🔬</span> Research Papers
                  {activeFilter !== "all" && (
                    <span style={{ fontSize: "0.7rem", color: "#a78bfa", fontWeight: 400 }}>({activeFilter})</span>
                  )}
                </h2>
                <span className="badge badge-emerald">{filteredPapers.length} papers</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {filteredPapers.slice(0, 8).map((paper, idx) => (
                  <ExpandableItem
                    key={idx}
                    title={paper.title}
                    subtitle={
                      <>
                        <span>{paper.authors?.map((a) => a.name || a).join(", ") || "Unknown"}</span>
                        {paper.year && <><span>•</span><span>{paper.year}</span></>}
                        {paper.citationCount != null && (
                          <span style={{ color: "var(--accent-emerald)" }}>
                            📊 {paper.citationCount} citations
                          </span>
                        )}
                        {paper.source && (
                          <span style={{
                            fontSize: "0.6rem",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: paper.source === "arxiv" ? "rgba(251, 113, 133, 0.15)" : "rgba(59, 130, 246, 0.15)",
                            color: paper.source === "arxiv" ? "#fb7185" : "#60a5fa",
                            fontWeight: 600,
                          }}>
                            {paper.source === "arxiv" ? "arXiv" : "S2"}
                          </span>
                        )}
                      </>
                    }
                    content={paper.abstract || "Abstract snippet or content unavailable."}
                    aiSummary={aiInsights?.researchInsights?.find(r => r.title === paper.title || r.input?.includes(paper.title))?.explanation}
                    link={
                      paper.source === "arxiv" && paper.paperId
                        ? `https://arxiv.org/abs/${paper.paperId}`
                        : `https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`
                    }
                  />
                ))}
              </div>
            </div>
            ) : null;
          })()}

        </div>

        {/* ═══ FOOTER ═══════════════════════════════════════════════════ */}
        <footer
          className="animate-fade-in animate-delay-6"
          style={{
            marginTop: "2.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border-subtle)",
            textAlign: "center",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
          }}
        >
          PIOS — Personal Intelligence Operating System • Built with Next.js & AI
        </footer>

      </div>
    </main>
  );
}
