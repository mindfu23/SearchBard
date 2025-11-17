import React, { useState } from 'react';
import { SearchFilters, TOP_SUBJECTS } from '../types/Conference';
import './SearchForm.css';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading = false }) => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [radius, setRadius] = useState(50);

  const handleSubjectChange = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSelectAllSubjects = () => {
    setSelectedSubjects(selectedSubjects.length === TOP_SUBJECTS.length ? [] : [...TOP_SUBJECTS]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filters: SearchFilters = {
      subjects: selectedSubjects,
      location,
      startDate,
      endDate,
      radius
    };
    
    onSearch(filters);
  };

  const resetForm = () => {
    setSelectedSubjects([]);
    setLocation('');
    setStartDate('');
    setEndDate('');
    setRadius(50);
  };

  return (
    <div className="search-form-container">
      <h2>Conference Search</h2>
      <p className="subtitle">Find conferences across these subjects in your area</p>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-section">
          <label className="section-label">
            Conference Subjects
            <button 
              type="button" 
              onClick={handleSelectAllSubjects}
              className="select-all-btn"
            >
              {selectedSubjects.length === TOP_SUBJECTS.length ? 'Deselect All' : 'Select All'}
            </button>
          </label>
          <div className="subjects-grid">
            {TOP_SUBJECTS.map(subject => (
              <label key={subject} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject)}
                  onChange={() => handleSubjectChange(subject)}
                />
                <span className="checkbox-text">{subject}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="section-label">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State (e.g., San Francisco, CA)"
            className="text-input"
          />
          <div className="radius-container">
            <label htmlFor="radius">Search radius: {radius} miles</label>
            <input
              id="radius"
              type="range"
              min="10"
              max="500"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="radius-slider"
            />
          </div>
        </div>

        <div className="form-section">
          <label className="section-label">Date Range</label>
          <div className="date-inputs">
            <div className="date-field">
              <label htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-field">
              <label htmlFor="end-date">End Date</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="date-input"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading}
            className="search-btn"
          >
            {isLoading ? 'Searching...' : 'Search Conferences'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="reset-btn"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;