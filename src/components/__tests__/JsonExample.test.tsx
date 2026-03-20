import { render, screen } from '@testing-library/react';
import JsonExample from '../JsonExample';

test('renders formatted JSON', () => {
  const example = { type: 'attack-pattern', name: 'Test' };
  render(<JsonExample data={example} />);
  expect(screen.getByText(/"attack-pattern"/)).toBeInTheDocument();
});

test('renders copy button', () => {
  render(<JsonExample data={{ type: 'test' }} />);
  expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
});
