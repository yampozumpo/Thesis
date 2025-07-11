import React, { useEffect, useRef, useState } from "react";
import "../style/Timeline.css";
import { NegotiationStep } from "./AddStepModal";
import Papa from "papaparse";

const START_YEAR = 1900;
const END_YEAR = 2025;
const TICK_SPACING = 80;
const TICK_STEPS = [1 / 12, 1, 2, 5, 10]; // 1/12 = month

interface TimelineProps {
  steps: NegotiationStep[];
  onAddStepClick: () => void;
  setSteps?: React.Dispatch<React.SetStateAction<NegotiationStep[]>>;
}

const Timeline: React.FC<TimelineProps> = ({ steps, onAddStepClick, setSteps }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tickStepIndex, setTickStepIndex] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [initialOffsetX, setInitialOffsetX] = useState(0);
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const [selectedStep, setSelectedStep] = useState<NegotiationStep | null>(null);
  const [selectedX, setSelectedX] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Bulk add UI state
  const [bulkDyadId, setBulkDyadId] = useState("");
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [negotiationData, setNegotiationData] = useState<any[]>([]);
  const [globalCategoryDict, setGlobalCategoryDict] = useState<any>({});
  const [frequentPatterns, setFrequentPatterns] = useState<number[][]>([]);
  const [shownPattern, setShownPattern] = useState<number[][] | null>(null);

  // Ref for scrolling to the pattern section
  const patternRef = useRef<HTMLDivElement>(null);

  // Load categories.csv once
  useEffect(() => {
    Papa.parse("/data/categories.csv", {
      header: true,
      download: true,
      complete: (results) => {
        setCategoriesData(results.data);
      }
    });
  }, []);

  // Load negotiation CSV once
  useEffect(() => {
    Papa.parse("/data/peace_observatory(negotiations).csv", {
      header: true,
      delimiter: ";",
      download: true,
      complete: (results) => {
        setNegotiationData(results.data);
      }
    });
  }, []);

  useEffect(() => {
    fetch("/data/global_category_dict.json")
      .then(res => res.json())
      .then(setGlobalCategoryDict);
  }, []);

  // Load frequent_patterns.csv as arrays of numbers (sequences)
  useEffect(() => {
    Papa.parse("/data/frequent_patterns.csv", {
      header: true,
      download: true,
      complete: (results) => {
        const patterns = results.data
          .map((row: any) => {
            try {
              // Pattern is like "[(62,),(7,)]"
              return JSON.parse(
                row.Pattern
                  .replace(/'/g, '"')
                  .replace(/\(/g, "[")
                  .replace(/\)/g, "]")
              ).map((arr: any) => arr[0]);
            } catch {
              return [];
            }
          })
          .filter((arr: number[]) => arr.length >= 2); // Only patterns of length >= 2
        setFrequentPatterns(patterns);
      }
    });
  }, []);

  // Scroll to the pattern section when shownPattern changes, and scroll a bit more for visibility
  useEffect(() => {
    if (shownPattern !== null && patternRef.current) {
      patternRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      setTimeout(() => {
        const popup = patternRef.current?.closest(".step-info-popup");
        if (popup) {
          popup.scrollBy({ top: 120, behavior: "smooth" });
        }
      }, 350);
    }
  }, [shownPattern]);

  // Timeline logic (unchanged)
  const tickStep = TICK_STEPS[tickStepIndex];
  const ticks: number[] = [];
  for (let y = START_YEAR; y <= END_YEAR + 0.0001; y += tickStep) {
    ticks.push(y);
  }
  const trackWidth = ticks.length * TICK_SPACING;
  const containerWidth = containerRef.current?.offsetWidth || 0;
  const extraPadding = containerWidth / 2;
  const firstVisibleIndex = Math.max(0, Math.floor(-offsetX / TICK_SPACING) - 10);
  const lastVisibleIndex = Math.min(
    ticks.length - 1,
    Math.ceil((-offsetX + containerWidth) / TICK_SPACING) + 10
  );
  const visibleTicks = ticks.slice(firstVisibleIndex, lastVisibleIndex + 1);

  const applyMomentum = () => {
    velocityRef.current *= 0.85;
    if (Math.abs(velocityRef.current) < 0.3) return;
    setOffsetX((prev) => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const extraPadding = containerWidth / 2;
      const maxOffset = extraPadding;
      const minOffset = -(trackWidth - containerWidth) - extraPadding;
      const next = prev + velocityRef.current;
      animationRef.current = requestAnimationFrame(applyMomentum);
      return Math.max(minOffset, Math.min(maxOffset, next));
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.min(TICK_STEPS.length - 1, Math.max(0, tickStepIndex + direction));
    if (newIndex !== tickStepIndex) {
      const rect = containerRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;

      // Use the current tickStep for the visible year calculation
      const currentTickStep = TICK_STEPS[tickStepIndex];
      const visibleYear = START_YEAR + ((-offsetX + rect.width * percent) / TICK_SPACING) * currentTickStep;

      // Use the new tickStep for the new offset calculation
      const newTickStep = TICK_STEPS[newIndex];
      const newOffset = -((visibleYear - START_YEAR) / newTickStep) * TICK_SPACING + rect.width * percent;

      const extraPadding = rect.width / 2;
      const newTrackWidth = Math.ceil((END_YEAR - START_YEAR) / newTickStep + 1) * TICK_SPACING;
      const maxOffset = extraPadding;
      const minOffset = -(newTrackWidth - rect.width) - extraPadding;

      setTickStepIndex(newIndex);
      setOffsetX(Math.max(minOffset, Math.min(maxOffset, newOffset)));
    }
  };

  const lastXRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragStartX === null) return;
      const dx = e.clientX - dragStartX;
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const extraPadding = containerWidth / 2;
      const maxOffset = extraPadding;
      const minOffset = -(trackWidth - containerWidth) - extraPadding;
      setOffsetX(Math.max(minOffset, Math.min(maxOffset, initialOffsetX + dx)));
      if (lastXRef.current !== null) {
        velocityRef.current = e.clientX - lastXRef.current;
      }
      lastXRef.current = e.clientX;
    };

    const handleMouseUp = () => {
      setDragStartX(null);
      if (Math.abs(velocityRef.current) > 0.5) {
        animationRef.current = requestAnimationFrame(applyMomentum);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragStartX, initialOffsetX, trackWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setDragStartX(e.clientX);
    setInitialOffsetX(offsetX);
    velocityRef.current = 0;
    lastXRef.current = e.clientX;
  };

  // Bulk add logic using negotiationData
  const handleBulkAdd = () => {
    if (!setSteps) return;
    // Filter negotiationData by dyad_id
    const filteredNegotiations = negotiationData.filter(row => String(row.dyad_id) === bulkDyadId);
    // Filter categoriesData by dyad_id
    const filteredCategories = categoriesData.filter(row => String(row.dyad_id) === bulkDyadId);

    const stepsToAdd = filteredNegotiations.map((negRow, idx) => {
      // Find a matching categories row (use idx for 1-to-1, or just first match)
      const catRow = filteredCategories[idx] || filteredCategories[0] || {};

      // Parse category fields (remove brackets and quotes)
      const clean = (val: string) =>
        typeof val === "string"
          ? val.replace(/^\[|\]$/g, "").replace(/'/g, "").trim()
          : val || "";

      const year = negRow.start_negotiations_year || negRow.end_negotiations_year || "2000";
      const month = negRow.start_negotiations_month || "1";
      const day = negRow.start_negotiations_day || "1";
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      return {
        actorCategory: clean(catRow.Category_Actors),
        phaseCategory: clean(catRow.Category_Phases),
        themeCategory: clean(catRow.Category_Goal),
        date: dateStr,
        description: negRow.description || `Bulk added for dyad_id ${bulkDyadId}`
      };
    });

    setSteps(prev => [...prev, ...stepsToAdd]);
  };

  // --- Step positions for arrows ---
  const stepPositions = steps
    .map((step) => {
      const date = new Date(step.date);
      const yearFraction = date.getFullYear() + date.getMonth() / 12 + date.getDate() / 365;
      if (yearFraction < START_YEAR || yearFraction > END_YEAR) return null;
      const index = (yearFraction - START_YEAR) / tickStep;
      return index * TICK_SPACING;
    })
    .filter((x): x is number => x !== null);

  // --- Helper: find global_category number for a step ---
  const getGlobalCatNum = (step: any) => {
    const match = Object.entries(globalCategoryDict).find(
      ([, cat]: any) =>
        cat.Category_Actors === step.actorCategory &&
        cat.Category_Phases === step.phaseCategory &&
        cat.Category_Goal === step.themeCategory
    );
    return match ? Number(match[0]) : null;
  };

  // --- Delete step handler ---
  const handleDeleteStep = () => {
    if (selectedIndex === null || !setSteps) return;
    setSteps(prev => prev.filter((_, i) => i !== selectedIndex));
    setSelectedStep(null);
    setSelectedX(null);
    setSelectedIndex(null);
    setShownPattern(null);
  };

  return (
    <div
      className="timeline-wrapper"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseLeave={() => {
        setDragStartX(null);
        velocityRef.current = 0;
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }}
      onDragStart={e => e.preventDefault()}
      style={{
        overflowX: "visible",
        overflowY: "visible",
        position: "relative",
        height: "100%",
        cursor: dragStartX !== null ? "grabbing" : "grab",
        userSelect: dragStartX !== null ? "none" : "auto"
      }}
    >
      <div
      style={{
        position: "fixed",
        left: 0,
        bottom: 10,
        zIndex: 100,
        background: "#222",
        padding: "12px 16px",
        borderRadius: "8px 8px 0 0",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center"
      }}
    >
      <input
        type="text"
        placeholder="Enter dyad_id"
        value={bulkDyadId}
        onChange={e => setBulkDyadId(e.target.value)}
        style={{ marginRight: 8 }}
      />
      <button onClick={handleBulkAdd}>Add All Steps for Dyad</button>
    </div>

    {/* Cancel all steps button, fixed at bottom right */}
    {setSteps && (
      <button
        onClick={() => {
          setSteps([]);
          setSelectedStep(null);
          setSelectedX(null);
          setSelectedIndex(null);
          setShownPattern(null);
        }}
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 101,
          background: "#b71c1c",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "14px 22px",
          fontSize: "16px",
          fontWeight: "bold",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          cursor: "pointer"
        }}
      >
        Cancel All Negotiation Steps
      </button>
    )}
      <div className="timeline-line" />
      <div
        className="timeline-track"
        style={{
          width: `${trackWidth}px`,
          transform: `translateX(${offsetX}px)`,
          transition: dragStartX === null ? "transform 0.2s ease-out" : "none",
          position: "relative",
          overflow: "visible"
        }}
      >
        {/* SVG arrows between steps */}
        <svg
          width={trackWidth}
          height={200}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 10
          }}
        >
          {stepPositions.length > 1 &&
            stepPositions.slice(0, -1).map((x1, i) => {
              const x2 = stepPositions[i + 1];
              const y1 = 50;
              const y2 = 50;
              const dist = Math.abs(x2 - x1);
              const minArch = 30;
              const maxArch = 120;
              const archHeight = Math.max(minArch, Math.min(maxArch, Math.sqrt(dist) * 12));
              const mx = (x1 + x2) / 2;
              return (
                <path
                  key={i}
                  d={`M${x1},${y1} Q${mx},${y1 + archHeight} ${x2},${y2}`}
                  stroke="orange"
                  strokeWidth={2}
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 8 4, 0 8" fill="orange" />
            </marker>
          </defs>
        </svg>

        {visibleTicks.map((tick, i) => {
          const index = firstVisibleIndex + i;
          let label = "";
          if (tickStep < 1) {
            const year = Math.floor(tick);
            const month = Math.round((tick - year) * 12) + 1;
            label = `${year}-${month.toString().padStart(2, "0")}`;
          } else {
            label = `${Math.round(tick)}`;
          }
          return (
            <div
              key={tick}
              className="year-tick"
              style={{
                left: `${index * TICK_SPACING}px`,
                position: "absolute",
                transform: "translateX(-50%)"
              }}
            >
              <div className="tick" />
              <div
                className="label"
                style={{
                  whiteSpace: "nowrap",
                  fontSize: tickStep < 1 ? "11px" : "13px",
                  minWidth: tickStep < 1 ? "40px" : undefined,
                  textAlign: "center"
                }}
              >
                {label}
              </div>
            </div>
          );
        })}

        {steps.map((step, i) => {
          const date = new Date(step.date);
          const yearFraction = date.getFullYear() + date.getMonth() / 12 + date.getDate() / 365;
          if (yearFraction < START_YEAR || yearFraction > END_YEAR) return null;
          const index = (yearFraction - START_YEAR) / tickStep;
          const x = index * TICK_SPACING;
          return (
            <div
              key={`step-${i}`}
              className="step-dot"
              onClick={() => {
                setSelectedStep(step);
                setSelectedX(x);
                setSelectedIndex(i);
                setShownPattern(null);
              }}
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "red",
                position: "absolute",
                left: `${x}px`,
                top: "43px",
                transform: "translateX(-50%)",
                cursor: "pointer"
              }}
            />
          );
        })}
      </div>
      {selectedStep && selectedX !== null && (() => {
        const popupWidth = 520;
        const popupHeight = 300;
        const margin = 10;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        let top = 0; // Appear higher
        let left = (selectedX + offsetX);

        // Prevent going off the right edge
        if (left + popupWidth / 2 + margin > viewportWidth) {
          left = viewportWidth - popupWidth / 2 - margin;
        }
        // Prevent going off the left edge
        if (left - popupWidth / 2 < margin) {
          left = popupWidth / 2 + margin;
        }
        // Prevent going off the bottom edge
        if (top + popupHeight + margin > viewportHeight) {
          top = viewportHeight - popupHeight - margin;
          if (top < margin) top = margin;
        }

        return (
          <div
            className="step-info-popup"
            style={{
              position: "absolute",
              top: `${top}px`,
              left: `${left}px`,
              transform: "translateX(-50%)",
              zIndex: 10,
              maxWidth: popupWidth,
              maxHeight: popupHeight,
              overflowY: "auto",
              background: "#222",
              color: "#fff",
              borderRadius: "8px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
              padding: "16px"
            }}
            onWheel={e => e.stopPropagation()}
          >
            {/* X button for closing the main popup */}
            <button
              onClick={() => {
                setSelectedStep(null);
                setSelectedX(null);
                setSelectedIndex(null);
                setShownPattern(null);
              }}
              style={{
                position: "absolute",
                top: 8,
                right: 12,
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: 22,
                fontWeight: "bold",
                cursor: "pointer",
                zIndex: 20,
                lineHeight: 1
              }}
              aria-label="Close"
            >
              ×
            </button>
            <div className="popup-content">
              <h4>Step Details</h4>
              <p><strong>Date:</strong> {selectedStep.date}</p>
              <p><strong>Description:</strong> {selectedStep.description}</p>
              <p><strong>Category 1:</strong> {selectedStep.actorCategory}</p>
              <p><strong>Category 2:</strong> {selectedStep.phaseCategory}</p>
              <p><strong>Category 3:</strong> {selectedStep.themeCategory}</p>
              <button
                style={{ marginTop: 8 }}
                onClick={() => {
                  // Always recalculate catNum here
                  const catNum = getGlobalCatNum(selectedStep);
                  let foundPatterns: number[][] = [];
                  if (catNum !== null) {
                    for (const pattern of frequentPatterns) {
                      if (pattern.includes(catNum)) {
                        foundPatterns.push(pattern);
                      }
                    }
                  }
                  setShownPattern(foundPatterns); // Always set, even if empty
                }}
              >
                Show frequent successor
              </button>
              {shownPattern !== null && (
                <div
                  ref={patternRef}
                  style={{
                    marginTop: 12,
                    background: "#333",
                    color: "#ffd700",
                    borderRadius: "8px",
                    padding: "12px",
                    maxWidth: 400,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    position: "relative"
                  }}
                >
                  {/* X button for closing the pattern popup */}
                  <button
                    onClick={() => setShownPattern(null)}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 12,
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: "bold",
                      cursor: "pointer",
                      zIndex: 20,
                      lineHeight: 1
                    }}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <strong>Possible frequent patterns from this category:</strong>
                  {shownPattern.length === 0 ? (
                    <div style={{ marginTop: 8, color: "#fff" }}>
                      No frequent patterns found for this category.
                      <br />
                      !STILL NEED TO ADD THEM!
                    </div>
                  ) : (
                    <ul style={{ margin: "8px 0 0 0", padding: 0, listStyle: "none" }}>
                      {shownPattern.map((pat, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>
                          {pat.join(" → ")}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {setSteps && (
                <button
                  style={{ background: "crimson", color: "white", marginTop: 8 }}
                  onClick={handleDeleteStep}
                >
                  Delete Step
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Timeline;