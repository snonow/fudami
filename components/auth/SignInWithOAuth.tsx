import React from 'react'
import * as WebBrowser from 'expo-web-browser'
import { Text, View, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useOAuth, useSignIn, useSignUp } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'

WebBrowser.maybeCompleteAuthSession()

export const SignInWithOAuth = () => {
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: 'oauth_google' })
  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: 'oauth_apple' })
  const [loading, setLoading] = React.useState<string | null>(null)

  const onGooglePress = React.useCallback(async () => {
    setLoading('google')
    try {
      const { createdSessionId, setActive } = await startGoogleFlow({
        redirectUrl: Linking.createURL('/(tabs)', { scheme: 'fudami' }),
      })
      if (createdSessionId) {
        setActive!({ session: createdSessionId })
      }
    } catch (err) {
      console.error('Google OAuth error', err)
    } finally {
      setLoading(null)
    }
  }, [startGoogleFlow])

  const onApplePress = React.useCallback(async () => {
    setLoading('apple')
    try {
      const { createdSessionId, setActive } = await startAppleFlow({
        redirectUrl: Linking.createURL('/(tabs)', { scheme: 'fudami' }),
      })
      if (createdSessionId) {
        setActive!({ session: createdSessionId })
      }
    } catch (err) {
      console.error('Apple OAuth error', err)
    } finally {
      setLoading(null)
    }
  }, [startAppleFlow])

  return (
    <View style={styles.container}>
      {/* Google Button */}
      <Pressable 
        style={[styles.button, styles.googleButton]} 
        onPress={onGooglePress}
        disabled={!!loading}
      >
        {loading === 'google' ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color={Colors.white} style={styles.icon} />
            <Text style={styles.buttonText}>Continue with Google</Text>
          </>
        )}
      </Pressable>

      {/* Apple Button */}
      <Pressable 
        style={[styles.button, styles.appleButton]} 
        onPress={onApplePress}
        disabled={!!loading}
      >
        {loading === 'apple' ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="logo-apple" size={22} color={Colors.white} style={styles.icon} />
            <Text style={styles.buttonText}>Continue with Apple</Text>
          </>
        )}
      </Pressable>
      
      <Text style={styles.note}>
        Email/Password login is available in the dashboard settings.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: 280,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  icon: {
    marginRight: 10,
  },
  note: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  }
})
