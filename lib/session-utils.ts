import { signOut } from 'next-auth/react'

/**
 * Utility functions for managing authentication sessions
 */

/**
 * Force sign out and clear all session data
 * Useful when cloning to a new device or switching accounts
 */
export const forceSignOut = async () => {
  try {
    // Clear all cookies related to authentication
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    
    // Sign out using NextAuth
    await signOut({
      callbackUrl: '/sign-in',
      redirect: true
    })
  } catch (error) {
    console.error('Error during force sign out:', error)
    // Fallback: redirect to sign-in page
    window.location.href = '/sign-in'
  }
}

/**
 * Check if user is on a new device (no local storage data)
 */
export const isNewDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const deviceId = localStorage.getItem('kulture_device_id')
  if (!deviceId) {
    // Generate new device ID
    const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('kulture_device_id', newDeviceId)
    return true
  }
  return false
}

/**
 * Clear all local storage and session storage
 */
export const clearAllStorage = () => {
  if (typeof window === 'undefined') return
  
  localStorage.clear()
  sessionStorage.clear()
  
  // Clear specific NextAuth cookies
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=")
    const name = eqPos > -1 ? c.substr(0, eqPos) : c
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
  })
}

/**
 * Get session info for debugging
 */
export const getSessionInfo = () => {
  if (typeof window === 'undefined') return null
  
  return {
    deviceId: localStorage.getItem('kulture_device_id'),
    cookies: document.cookie,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  }
} 