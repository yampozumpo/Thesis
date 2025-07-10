// AddStepModal.tsx
import React, { useState } from "react";
import "../style/addStepModal.css";

interface AddStepModalProps {
  onClose: () => void;
  onSubmit: (step: NegotiationStep) => void;
}

export interface NegotiationStep {
  date: string;
  description: string;
  category: string;
}

const categories = {
  "International and Regional Actors": [
    "international_ngo", "regional_organization", "international_organization",
    "peace_operation", "foreign_government", "language_organization"
  ],
  "National State Actors": [
    "national_committee", "local_government", "government",
    "president", "political_party", "government_forces", "police"
  ],
  "Local and Informal Actors": [
    "local_ngo", "armed_group", "community_leaders",
    "religious_leaders", "religious_any", "traditional_leaders",
    "local_committee"
  ],
  "Drop": ["company", "women", "individual"]
};

const AddStepModal: React.FC<AddStepModalProps> = ({ onClose, onSubmit }) => {
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = () => {
    if (date && description && category) {
      onSubmit({ date, description, category });
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add Negotiation Step</h2>
        <label>Date:</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label>Description:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

        <label>Category:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select a category</option>
          {Object.entries(categories).map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <div className="modal-buttons">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit}>Add</button>
        </div>
      </div>
    </div>
  );
};

export default AddStepModal;
