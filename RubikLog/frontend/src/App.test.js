import { render, screen } from '@testing-library/react';
import App from './App';

test('renders RubikLog heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/RubikLog/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders form elements', () => {
  render(<App />);
  expect(screen.getByLabelText(/Solve Time/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Scramble/i)).toBeInTheDocument();
  expect(screen.getByText(/Add Solve/i)).toBeInTheDocument();
});
