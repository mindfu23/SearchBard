import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders conference search portal heading', () => {
  render(<App />);
  const titleElement = screen.getByRole('heading', { name: /Conference Search Portal/i });
  expect(titleElement).toBeInTheDocument();
});

test('renders search form', () => {
  render(<App />);
  const searchButton = screen.getByText(/Search Conferences/i);
  expect(searchButton).toBeInTheDocument();
});

test('renders ready to find conferences message', () => {
  render(<App />);
  const readyMessage = screen.getByText(/Ready to Find Conferences?/i);
  expect(readyMessage).toBeInTheDocument();
});
