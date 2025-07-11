import React, { useState } from "react";
import Timeline from "./components/Timeline";
import AddStepModal, { NegotiationStep } from "./components/AddStepModal";

function App() {
  const [steps, setSteps] = useState<NegotiationStep[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddStep = (step: NegotiationStep) => {
    setSteps(prev => [...prev, step]);
  };

  return (
    <div className="App" style={{ backgroundColor: "black", height: "100vh", color: "white", display: "flex", flexDirection: "column" }}>
      <h1 style={{ textAlign: "center", padding: "10px" }}>Interactive Timeline</h1>
      <div style={{ flex: 1, overflow: "hidden", marginTop: "10vh" }}>
        <Timeline
          steps={steps}
          setSteps={setSteps}
          onAddStepClick={() => setIsModalOpen(true)}
        />
      </div>

      <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", gap: "12px", zIndex: 1001 }}>
        <button className="add-step-button" onClick={() => setIsModalOpen(true)}>
          + Add Step
        </button>
        {steps.length >= 2 && (
          <button className="search-similar-button" onClick={() => alert("Search Similar Negotiations triggered: THIS IS A PLACEHOLDER")}>
            Search Similar Negotiations
          </button>
        )}
      </div>

      {isModalOpen && (
        <AddStepModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddStep}
        />
      )}
    </div>
  );
}

export default App;