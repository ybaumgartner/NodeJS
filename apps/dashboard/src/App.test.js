import { render, screen } from '@testing-library/react';
import App from './App';

test("renders the finance analysis studio", () => {
  render(<App />);
  expect(
    screen.getByText(/analyse financiere multi-exercices/i)
  ).toBeInTheDocument();
  expect(screen.getByText(/etats standardises/i)).toBeInTheDocument();
});
