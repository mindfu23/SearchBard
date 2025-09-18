import React from 'react';
import { Conference } from '../types/Conference';
import ConferenceCard from './ConferenceCard';
import './ConferenceResults.css';

interface ConferenceResultsProps {
  conferences: Conference[];
  isLoading: boolean;
  searchPerformed: boolean;
}

const ConferenceResults: React.FC<ConferenceResultsProps> = ({ 
  conferences, 
  isLoading, 
  searchPerformed 
}) => {
  if (isLoading) {
    return (
      <div className="results-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Searching for conferences...</p>
        </div>
      </div>
    );
  }

  if (!searchPerformed) {
    return (
      <div className="results-container">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Ready to Find Conferences?</h3>
          <p>Use the search form above to find conferences across the top 10 subjects in your area and time range.</p>
        </div>
      </div>
    );
  }

  if (conferences.length === 0) {
    return (
      <div className="results-container">
        <div className="no-results-state">
          <div className="no-results-icon">📅</div>
          <h3>No Conferences Found</h3>
          <p>Try adjusting your search criteria:</p>
          <ul>
            <li>Select more subjects</li>
            <li>Expand your location radius</li>
            <li>Adjust your date range</li>
            <li>Try a different location</li>
          </ul>
        </div>
      </div>
    );
  }

  const getResultsSummary = () => {
    const subjects = Array.from(new Set(conferences.map(c => c.subject))).sort();
    const locations = Array.from(new Set(conferences.map(c => `${c.location.city}, ${c.location.state}`)));
    
    return {
      total: conferences.length,
      subjects: subjects.length,
      locations: locations.length,
      subjectList: subjects,
      earliestDate: conferences.reduce((earliest, conf) => 
        conf.startDate < earliest ? conf.startDate : earliest, 
        conferences[0].startDate
      ),
      latestDate: conferences.reduce((latest, conf) => 
        conf.endDate > latest ? conf.endDate : latest, 
        conferences[0].endDate
      )
    };
  };

  const summary = getResultsSummary();

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Conference Search Results</h2>
        <div className="results-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-number">{summary.total}</span>
              <span className="stat-label">Conferences Found</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{summary.subjects}</span>
              <span className="stat-label">Subjects</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{summary.locations}</span>
              <span className="stat-label">Locations</span>
            </div>
          </div>
          
          <div className="summary-details">
            <p><strong>Subjects:</strong> {summary.subjectList.join(', ')}</p>
            <p><strong>Date Range:</strong> {new Date(summary.earliestDate).toLocaleDateString()} - {new Date(summary.latestDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="results-list">
        {conferences.map(conference => (
          <ConferenceCard key={conference.id} conference={conference} />
        ))}
      </div>

      <div className="results-footer">
        <p>Showing all {conferences.length} conferences that match your criteria.</p>
      </div>
    </div>
  );
};

export default ConferenceResults;