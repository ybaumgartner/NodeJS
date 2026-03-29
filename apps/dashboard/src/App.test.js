import { render, screen } from '@testing-library/react';
import App from './App';

test("renders the finance analysis studio", () => {
  render(<App />);
  expect(
    screen.getByText(/studio professionnel d'analyse financiere/i)
  ).toBeInTheDocument();
  expect(screen.getByText(/tableau de flux/i)).toBeInTheDocument();
});
