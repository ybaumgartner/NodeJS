import { render, screen } from '@testing-library/react';
import App from './App';

test("renders the mandate studio", () => {
  render(<App />);
  expect(
    screen.getByText(/studio de traitement des mandats financiers/i)
  ).toBeInTheDocument();
  expect(screen.getAllByText(/mandat 2 - projet usa/i).length).toBeGreaterThan(0);
});
