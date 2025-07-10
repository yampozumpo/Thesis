// Timeline.tsx
import React, { useEffect, useRef, useState } from "react";
import "../style/Timeline.css";
import { NegotiationStep } from "./AddStepModal";

const START_YEAR = 1700;
const END_YEAR = 2025;
const TICK_SPACING = 80;
const TICK_STEPS = [1, 2, 5, 10];

interface TimelineProps {
  steps: NegotiationStep[];
  onAddStepClick: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ steps, onAddStepClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tickStepIndex, setTickStepIndex] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [initialOffsetX, setInitialOffsetX] = useState(0);
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const [selectedStep, setSelectedStep] = useState<NegotiationStep | null>(null);
  const [selectedX, setSelectedX] = useState<number | null>(null);

  const tickStep = TICK_STEPS[tickStepIndex];
  const years: number[] = [];
  for (let y = START_YEAR; y <= END_YEAR; y += tickStep) {
    years.push(y);
  }
  const trackWidth = years.length * TICK_SPACING;

  const applyMomentum = () => {
    velocityRef.current *= 0.85;
    if (Math.abs(velocityRef.current) < 0.3) return;
    setOffsetX((prev) => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const maxOffset = 0;
      const minOffset = -(trackWidth - containerWidth);
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
      const visibleYear = START_YEAR + (-offsetX + rect.width * percent) / TICK_SPACING * tickStep;
      const newOffset = -(visibleYear - START_YEAR) / TICK_STEPS[newIndex] * TICK_SPACING + rect.width * percent;
      setTickStepIndex(newIndex);
      setOffsetX(() => {
        const containerWidth = rect.width;
        const maxOffset = 0;
        const minOffset = -(trackWidth - containerWidth);
        return Math.max(minOffset, Math.min(maxOffset, newOffset));
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragStartX === null) return;
      const dx = e.clientX - dragStartX;
      velocityRef.current = dx - initialOffsetX;
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const maxOffset = 0;
      const minOffset = -(trackWidth - containerWidth);
      setOffsetX(Math.max(minOffset, Math.min(maxOffset, initialOffsetX + dx)));
    };

    const handleMouseUp = () => {
      setDragStartX(null);
      if (Math.abs(velocityRef.current) > 0.5) {
        animationRef.current = requestAnimationFrame(applyMomentum);
      }
    };

    const preventScroll = (e: WheelEvent) => {
      if (containerRef.current && containerRef.current.matches(':hover')) {
        e.preventDefault();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("wheel", preventScroll, { passive: false });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("wheel", preventScroll);
    };
  }, [dragStartX, initialOffsetX, trackWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setDragStartX(e.clientX);
    setInitialOffsetX(offsetX);
    velocityRef.current = 0;
  };

  return (
    <div
      className="timeline-wrapper"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      style={{
        overflowX: "hidden",
        overflowY: "visible",
        position: "relative",
        height: "100%",
        cursor: dragStartX !== null ? "grabbing" : "grab"
      }}
    >
      <div className="timeline-line" />
      <div
        className="timeline-track"
        style={{
          width: `${trackWidth}px`,
          transform: `translateX(${offsetX}px)`,
          transition: dragStartX === null ? "transform 0.2s ease-out" : "none",
          position: "relative"
        }}
      >
        {years.map((year, index) => (
          <div
            key={year}
            className="year-tick"
            style={{
              left: `${index * TICK_SPACING}px`,
              position: "absolute",
              transform: "translateX(-50%)"
            }}
          >
            <div className="tick" />
            <div className="label">{year}</div>
          </div>
        ))}
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
              }}
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "red",
                position: "absolute",
                left: `${x}px`,
                transform: "translateX(-50%)",
                cursor: "pointer"
              }}
            />
          );
        })}
      </div>
      {selectedStep && selectedX !== null && (
        <div
          className="step-info-popup"
          style={{
            position: "absolute",
            top: "50px",
            left: `${selectedX + offsetX}px`,
            transform: "translateX(-50%)",
            zIndex: 10
          }}
        >
          <div className="popup-content">
            <h4>Step Details</h4>
            <p><strong>Date:</strong> {selectedStep.date}</p>
            <p><strong>Description:</strong> {selectedStep.description}</p>
            <p><strong>Category:</strong> {selectedStep.category}</p>
            <button onClick={() => setSelectedStep(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
