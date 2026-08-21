import { useCallback, useEffect, useRef, useState } from "react"
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from "expo-speech-recognition"

type VoiceInputState = {
    recognizing: boolean
    transcript: string
    volume: number
    isAvailable: boolean
    error: string | null
}

type VoiceInputActions = {
    startRecognition: () => Promise<void>
    stopRecognition: () => void
    resetTranscript: () => void
}

export function useVoiceInput(): VoiceInputState & VoiceInputActions {
    const [recognizing, setRecognizing] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [volume, setVolume] = useState(0)
    const [isAvailable, setIsAvailable] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const hasRequestedPermission = useRef(false)
    const recognizingRef = useRef(false)
    const startingRef = useRef(false)
    const stopQueuedRef = useRef(false)

    useEffect(() => {
        const checkAvailability = async () => {
            try {
                const available = await ExpoSpeechRecognitionModule.isRecognitionAvailable()
                setIsAvailable(available)
            } catch {
                setIsAvailable(false)
            }
        }
        checkAvailability()
    }, [])

    useSpeechRecognitionEvent("start", () => {
        startingRef.current = false
        recognizingRef.current = true
        setRecognizing(true)
        setError(null)
        if (stopQueuedRef.current) {
            stopQueuedRef.current = false
            ExpoSpeechRecognitionModule.stop()
        }
    })

    useSpeechRecognitionEvent("end", () => {
        startingRef.current = false
        stopQueuedRef.current = false
        recognizingRef.current = false
        setRecognizing(false)
    })

    useSpeechRecognitionEvent("result", (event) => {
        const result = event.results[0]?.transcript
        if (result) {
            setTranscript(result)
        }
    })

    useSpeechRecognitionEvent("error", (event) => {
        startingRef.current = false
        stopQueuedRef.current = false
        recognizingRef.current = false
        setRecognizing(false)
        if (event.error === "not-allowed") {
            setError("Microphone permission denied")
        } else if (event.error === "no-speech") {
            setError("No speech detected")
        } else if (event.error === "network") {
            setError("Network error")
        } else if (event.error !== "aborted") {
            setError(event.message || "Speech recognition error")
        }
    })

    useSpeechRecognitionEvent("volumechange", (event) => {
        setVolume(event.value)
    })

    const requestPermission = useCallback(async () => {
        if (hasRequestedPermission.current) return true
        try {
            const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
            hasRequestedPermission.current = true
            return result.granted
        } catch {
            return false
        }
    }, [])

    const startRecognition = useCallback(async () => {
        if (recognizingRef.current || startingRef.current) return

        startingRef.current = true
        stopQueuedRef.current = false

        const granted = await requestPermission()
        if (!granted) {
            startingRef.current = false
            setError("Microphone permission denied")
            return
        }

        setTranscript("")
        setError(null)

        try {
            ExpoSpeechRecognitionModule.start({
                lang: "en-US",
                interimResults: true,
                continuous: true,
                volumeChangeEventOptions: {
                    enabled: true,
                    intervalMillis: 100,
                },
                iosTaskHint: "dictation",
            })
        } catch {
            startingRef.current = false
        }
    }, [requestPermission])

    const stopRecognition = useCallback(() => {
        if (startingRef.current) {
            stopQueuedRef.current = true
            return
        }
        if (!recognizingRef.current) return
        ExpoSpeechRecognitionModule.stop()
    }, [])

    const resetTranscript = useCallback(() => {
        setTranscript("")
    }, [])

    useEffect(() => {
        return () => {
            if (recognizingRef.current || startingRef.current) {
                ExpoSpeechRecognitionModule.abort()
            }
        }
    }, [])

    return {
        recognizing,
        transcript,
        volume,
        isAvailable,
        error,
        startRecognition,
        stopRecognition,
        resetTranscript,
    }
}
