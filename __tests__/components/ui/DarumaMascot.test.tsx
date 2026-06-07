import React from 'react';
import { render } from '@testing-library/react-native';
import { DarumaMascot } from '../../../components/ui/DarumaMascot';

// Mock expo-asset
jest.mock('expo-asset', () => ({
  useAssets: jest.fn(() => [[{ localUri: 'test.obj' }], null]),
}));

// Mock @react-three/fiber
jest.mock('@react-three/fiber/native', () => ({
  Canvas: ({ children }: any) => <>{children}</>,
  useFrame: jest.fn(),
  useLoader: jest.fn(() => ({ traverse: jest.fn() })),
}));

// Mock @react-three/drei
jest.mock('@react-three/drei/native', () => ({
  useTexture: jest.fn(() => ({})),
}));

// Mock three
jest.mock('three', () => ({
  MeshStandardMaterial: jest.fn(),
  Group: jest.fn(),
  Mesh: jest.fn(),
  Color: jest.fn(),
  Vector3: jest.fn(),
}));

describe('DarumaMascot', () => {
  it('renders correctly after assets load', () => {
    const { getByTestId } = render(<DarumaMascot />);
    // Since it's a 3D component, we just check it doesn't throw and renders the container
    // We can add testID to the container in the component if needed.
  });
});
