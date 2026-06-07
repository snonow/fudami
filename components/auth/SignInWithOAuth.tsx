import React from 'react'
import * as WebBrowser from 'expo-web-browser'
import { Text, View, Pressable, StyleSheet } from 'react-native'
import { useOAuth } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { Colors } from '../constants/Colors'

WebBrowser.maybeCompleteAuthSession()

export const SignInWithOAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

  const onPress = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/dashboard', { scheme: 'fudami' }),
      })

      if (createdSessionId) {
        setActive!({ session: createdSessionId })
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error('OAuth error', err)
    }
  }, [])

  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>Sign in with Google</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.teal,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    elevation: 5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
})
