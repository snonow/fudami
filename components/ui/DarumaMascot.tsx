import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber/native';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { useTexture } from '@react-three/drei/native';
import { View, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Asset, useAssets } from 'expo-asset';
import * as THREE from 'three';
import { Colors } from '../../constants/Colors';

type MascotMood = 'neutral' | 'happy' | 'sad';

// Texture assets (using constants for cleaner code)
const DARUMA_TEXTURES = {
  neutral: require('../../assets/daruma-no-bg/daruma-neutral-no-bg.png'),
  neutralBlink: require('../../assets/daruma-no-bg/daruma-neutral-blink-no-bg.png'),
  happy: require('../../assets/daruma-no-bg/daruma-happy-no-bg.png'),
  happyBlink: require('../../assets/daruma-no-bg/daruma-happy-blink-no-bg.png'),
  sad: require('../../assets/daruma-no-bg/daruma-sad-no-bg.png'),
  sadBlink: require('../../assets/daruma-no-bg/daruma-sad-blink-no-bg.png'),
};

const DARUMA_OBJ = require('../../assets/3d-daruma.obj');

function DarumaModel({ url, mood }: { url: string; mood: MascotMood }) {
  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Group>(null!);
  const obj = useLoader(OBJLoader, url);
  
  const [isBlinking, setIsBlinking] = useState(false);

  // Load all textures using resolved URIs from assets
  const textures = {
    neutral: useTexture(Asset.fromModule(DARUMA_TEXTURES.neutral).uri),
    neutralBlink: useTexture(Asset.fromModule(DARUMA_TEXTURES.neutralBlink).uri),
    happy: useTexture(Asset.fromModule(DARUMA_TEXTURES.happy).uri),
    happyBlink: useTexture(Asset.fromModule(DARUMA_TEXTURES.happyBlink).uri),
    sad: useTexture(Asset.fromModule(DARUMA_TEXTURES.sad).uri),
    sadBlink: useTexture(Asset.fromModule(DARUMA_TEXTURES.sadBlink).uri),
  };

  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#D32F2F',
    roughness: 0.3,
    metalness: 0.2,
  }), []);

  // Determine active texture based on mood and blink state
  const activeTexture = useMemo(() => {
    if (mood === 'happy') return isBlinking ? textures.happyBlink : textures.happy;
    if (mood === 'sad') return isBlinking ? textures.sadBlink : textures.sad;
    return isBlinking ? textures.neutralBlink : textures.neutral;
  }, [mood, isBlinking, textures.happyBlink, textures.happy, textures.sadBlink, textures.sad, textures.neutralBlink, textures.neutral]);

  // Handle expressive blinking (double blinks occasionally)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 120); 
      
      const nextDelay = Math.random() < 0.2 ? 300 : Math.random() * 5000 + 2000;
      timeout = setTimeout(blink, nextDelay);
    };
    timeout = setTimeout(blink, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // Apply material to the body ONCE
  useEffect(() => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = bodyMaterial;
      }
    });
  }, [obj, bodyMaterial]);

  // Complex animations: Follow cursor + Idle sway
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const { x, y } = state.pointer; // Mouse position normalized (-1 to +1)

    if (groupRef.current) {
      // Smoothly follow the mouse
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, x * 0.4, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -y * 0.2, 0.1);
      
      // Idle float/bob
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.15;
    }

    if (modelRef.current) {
      // Subtle organic sway
      modelRef.current.rotation.z = Math.sin(t * 0.8) * 0.05;
      modelRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.015); // Breathing effect
    }
  });

  return (
    <group ref={groupRef} scale={0.08}>
      <group ref={modelRef}>
        <primitive object={obj} />
        {/* The "Digital Mask" Sticker */}
        <mesh position={[0, 0, 1.2]} rotation={[0, 0, 0]}>
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial 
            map={activeTexture} 
            transparent 
            polygonOffset 
            polygonOffsetFactor={-1} 
          />
        </mesh>
      </group>
    </group>
  );
}

export const DarumaMascot = React.memo(function DarumaMascot({ mood = 'neutral' }: { mood?: MascotMood }) {
  const { width, height } = useWindowDimensions();
  const isDesktop = width > 768;
  
  // BIG on computer, SMALLER on phones
  const size = isDesktop ? Math.min(height * 0.65, 600) : Math.min(height * 0.45, width * 0.85);

  const [assets] = useAssets([
    DARUMA_OBJ,
    DARUMA_TEXTURES.neutral,
    DARUMA_TEXTURES.neutralBlink,
    DARUMA_TEXTURES.happy,
    DARUMA_TEXTURES.happyBlink,
    DARUMA_TEXTURES.sad,
    DARUMA_TEXTURES.sadBlink,
  ]);

  if (!assets || !assets[0].uri) {
    return (
      <View style={[styles.loader, { width: size, height: size }]}>
        <ActivityIndicator color={Colors.palette.softHankoRed} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas camera={{ position: [0, 0, 5], fov: 40 }} shadows>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <spotLight position={[-5, 5, 5]} angle={0.2} penumbra={1} intensity={2} />
        <directionalLight position={[0, 5, 5]} intensity={0.5} />
        
        <React.Suspense fallback={null}>
          <DarumaModel url={assets[0].uri} mood={mood} />
        </React.Suspense>

        {/* Subtle Podium/Shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
          <circleGeometry args={[2, 32]} />
          <meshBasicMaterial color="#000" transparent opacity={0.15} />
        </mesh>
      </Canvas>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 0,
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
