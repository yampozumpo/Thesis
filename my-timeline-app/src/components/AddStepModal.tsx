import React, { useState } from "react";
import "../style/addStepModal.css";

export interface NegotiationStep {
  actorCategory: string;
  phaseCategory: string;
  themeCategory: string;
  date: string;
  description: string;
}

interface AddStepModalProps {
  onClose: () => void;
  onSubmit: (step: NegotiationStep) => void;
}

// Category lists for each dropdown
const actorCategories = [
  "International and Regional Actors",
  "National State Actors",
  "Local and Informal Actors",
  "Non-Mediated"
];

const phaseCategories = [
  "prenego",
  "nego",
  "nego_implement"
];

const themeCategories = [
  "Cessation of Hostilities and Security",
  "Political Power and Governance",
  "Post-Conflict Justice and Social Healing",
  "Resource Management and Economic Issues",
  "External Involvement and Military Presence",
  "Unspecified"
];

const AddStepModal: React.FC<AddStepModalProps> = ({ onClose, onSubmit }) => {
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [actorCategory, setActorCategory] = useState("***");
  const [phaseCategory, setPhaseCategory] = useState("***");
  const [themeCategory, setThemeCategory] = useState("***");

  const handleSubmit = () => {
    onSubmit({
      date,
      description,
      actorCategory,
      phaseCategory,
      themeCategory,
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add Negotiation Step</h2>
        <div className="modal-fields">
          <div>
            <label>Date:</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label>Description:</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label>Actor Category:</label>
            <select value={actorCategory} onChange={e => setActorCategory(e.target.value)}>
              <option value="***">***</option>
              {actorCategories.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Phase Category:</label>
            <select value={phaseCategory} onChange={e => setPhaseCategory(e.target.value)}>
              <option value="***">***</option>
              {phaseCategories.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Theme Category:</label>
            <select value={themeCategory} onChange={e => setThemeCategory(e.target.value)}>
              <option value="***">***</option>
              {themeCategories.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-buttons">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit} style={{ background: "green", color: "white" }}>Add</button>
        </div>
      </div>
    </div>
  );
};

export default AddStepModal;