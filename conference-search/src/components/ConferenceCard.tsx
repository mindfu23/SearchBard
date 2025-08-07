import React from 'react';
import { Conference } from '../types/Conference';
import './ConferenceCard.css';

interface ConferenceCardProps {
  conference: Conference;
}

const ConferenceCard: React.FC<ConferenceCardProps> = ({ conference }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price?: Conference['price']) => {
    if (!price) return 'Contact for pricing';
    
    if (price.min === price.max) {
      return `${price.currency} $${price.min.toLocaleString()}`;
    }
    
    return `${price.currency} $${price.min.toLocaleString()} - $${price.max.toLocaleString()}`;
  };

  const getDuration = () => {
    const start = new Date(conference.startDate);
    const end = new Date(conference.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      'Technology': '#3498db',
      'Healthcare': '#e74c3c',
      'Business': '#f39c12',
      'Education': '#9b59b6',
      'Science': '#1abc9c',
      'Marketing': '#e67e22',
      'Finance': '#34495e',
      'Environment': '#27ae60',
      'Arts & Design': '#e91e63',
      'Engineering': '#795548'
    };
    return colors[subject] || '#95a5a6';
  };

  return (
    <div className="conference-card">
      <div className="card-header">
        <div className="title-section">
          <h3 className="conference-title">{conference.title}</h3>
          <span 
            className="subject-tag"
            style={{ backgroundColor: getSubjectColor(conference.subject) }}
          >
            {conference.subject}
          </span>
        </div>
        <div className="organizer">
          Organized by {conference.organizer}
        </div>
      </div>

      <div className="card-body">
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">📍 Location</div>
            <div className="info-value">
              {conference.location.city}, {conference.location.state}, {conference.location.country}
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">📅 Dates</div>
            <div className="info-value">
              {formatDate(conference.startDate)} - {formatDate(conference.endDate)}
              <span className="duration">({getDuration()})</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">💰 Price</div>
            <div className="info-value">{formatPrice(conference.price)}</div>
          </div>

          {conference.attendeeCount && (
            <div className="info-item">
              <div className="info-label">👥 Expected Attendees</div>
              <div className="info-value">{conference.attendeeCount.toLocaleString()}</div>
            </div>
          )}
        </div>

        <div className="description">
          <div className="info-label">📝 Description</div>
          <p>{conference.description}</p>
        </div>

        {conference.website && (
          <div className="card-footer">
            <a 
              href={conference.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="website-link"
            >
              🔗 Visit Conference Website
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConferenceCard;