import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber/native';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Decal, useTexture } from '@react-three/drei/native';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAsset } from 'expo-asset';
import * as THREE from 'three';
import { Colors } from '../../constants/Colors';

type MascotMood = 'neutral' | 'happy' | 'sad';

function DarumaModel({ url, mood }: { url: string; mood: MascotMood }) {
  const meshRef = useRef<THREE.Group>(null!);
  const decalRef = useRef<THREE.Mesh>(null!);
  const obj = useLoader(OBJLoader, url);
  
  const [isBlinking, setIsBlinking] = useState(false);

  // Load all textures
  const textures = {
    neutral: useTexture(require('../../assets/daruma-w-bg/daruma-neutral.png')),
    neutralBlink: useTexture(require('../../assets/daruma-w-bg/daruma-neutral-blink.png')),
    happy: useTexture(require('../../assets/daruma-w-bg/daruma-happy.png')),
    happyBlink: useTexture(require('../../assets/daruma-w-bg/daruma-happy-blink.png')),
    sad: useTexture(require('../../assets/daruma-w-bg/daruma-sad.png')),
    sadBlink: useTexture(require('../../assets/daruma-w-bg/daruma-sad-blink.png')),
  };

  // Determine active texture based on mood and blink state
  const activeTexture = useMemo(() => {
    if (mood === 'happy') return isBlinking ? textures.happyBlink : textures.happy;
    if (mood === 'sad') return isBlinking ? textures.sadBlink : textures.sad;
    return isBlinking ? textures.neutralBlink : textures.neutral;
  }, [mood, isBlinking, textures]);

  // Handle random blinking
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150); // Blink duration
      timeout = setTimeout(blink, Math.random() * 4000 + 2000); // Random interval
    };
    timeout = setTimeout(blink, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // Apply basic material to the body
  useMemo(() => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: '#D32F2F',
          roughness: 0.4,
          metalness: 0.1,
        });
      }
    });
  }, [obj]);

  // Subtle float animation
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(t * 1.2) * 0.1;
      meshRef.current.rotation.z = Math.sin(t * 0.8) * 0.03;
    }
  });

  return (
    <group ref={meshRef} scale={0.06}>
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
  );
}

export function DarumaMascot({ mood = 'neutral' }: { mood?: MascotMood }) {
  const [assets] = useAsset(require('../../assets/3d-daruma.obj'));

  if (!assets) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.teal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.9} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <spotLight position={[-5, 5, 5]} angle={0.15} penumbra={1} />
        <React.Suspense fallback={null}>
          <DarumaModel url={assets[0].localUri || assets[0].uri} mood={mood} />
        </React.Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 280,
    marginVertical: 10,
  },
  loader: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
