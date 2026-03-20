import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

test('renders app title and search', () => {
  render(<App />);
  expect(screen.getByText('STIX 2.1 Meta Explorer')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Search objects...')).toBeInTheDocument();
});

test('renders filter chips', () => {
  render(<App />);
  expect(screen.getByText('SDO')).toBeInTheDocument();
  expect(screen.getByText('SRO')).toBeInTheDocument();
  expect(screen.getByText('SCO')).toBeInTheDocument();
  expect(screen.getByText('Meta')).toBeInTheDocument();
});

test('renders object cards', () => {
  render(<App />);
  expect(screen.getByText('Attack Pattern')).toBeInTheDocument();
});

test('clicking a card opens the detail drawer', () => {
  render(<App />);
  fireEvent.click(screen.getByText('Attack Pattern'));
  // Drawer should show the full description and category badge
  expect(screen.getByText('Domain Object')).toBeInTheDocument();
});

test('search filters cards', () => {
  render(<App />);
  fireEvent.change(screen.getByPlaceholderText('Search objects...'), {
    target: { value: 'malware' },
  });
  expect(screen.getByText('Malware')).toBeInTheDocument();
  expect(screen.queryByText('Campaign')).not.toBeInTheDocument();
});
