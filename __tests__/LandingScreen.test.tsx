import React from 'react';
import { render } from '@testing-library/react-native';
import { LandingScreen } from '../components/auth/LandingScreen';

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

// Mock Clerk
jest.mock('@clerk/clerk-expo', () => ({
  SignedIn: ({ children }: any) => null,
  SignedOut: ({ children }: any) => children,
}));

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <>{children}</>,
}));

// Mock Daruma
jest.mock('../components/ui/DarumaMascot', () => ({
  DarumaMascot: () => null,
}));

describe('LandingScreen', () => {
  it('renders correctly in welcome step', () => {
    const { getByText } = render(<LandingScreen />);
    expect(getByText('FUDAMI')).toBeTruthy();
    expect(getByText('BEGIN JOURNEY')).toBeTruthy();
  });
});
