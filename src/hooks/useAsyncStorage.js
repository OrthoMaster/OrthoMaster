import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const useAsyncStorage = (key, initialValue) => {
  const [data, setData] = useState(initialValue)

  useEffect(() => {
    ;(async () => {
      try {
        const value = await AsyncStorage.getItem(key)
        setData(JSON.parse(value) || initialValue)
      } catch (error) {
        console.error('useAsyncStorage getItem error:', error)
      }
    })()
  }, [key, initialValue])

  const setNewData = async (value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value))
      setData(value)
    } catch (error) {
      console.error('useAsyncStorage setItem error:', error)
    }
  }

  return [data, setNewData]
}
export default useAsyncStorage