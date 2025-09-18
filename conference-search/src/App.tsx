import React, { useState } from 'react';
import './App.css';
import SearchForm from './components/SearchForm';
import ConferenceResults from './components/ConferenceResults';
import { Conference, SearchFilters } from './types/Conference';
import { ConferenceSearchService } from './services/ConferenceSearchService';

function App() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async (filters: SearchFilters) => {
    setIsLoading(true);
    setSearchPerformed(false);

    // Simulate API delay for better UX
    setTimeout(() => {
      const results = ConferenceSearchService.searchConferences(filters);
      setConferences(results);
      setIsLoading(false);
      setSearchPerformed(true);
    }, 1000);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Conference Search Portal</h1>
        <p className="App-subtitle">
          Discover conferences across the top 10 subjects in your area and time range
        </p>
      </header>

      <main className="App-main">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        <ConferenceResults 
          conferences={conferences} 
          isLoading={isLoading}
          searchPerformed={searchPerformed}
        />
      </main>

      <footer className="App-footer">
        <p>&copy; 2024 Conference Search Portal. Helping you find the perfect conferences for your interests.</p>
      </footer>
    </div>
  );
}

export default App;
