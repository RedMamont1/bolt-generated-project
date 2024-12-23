import React, { useState, useEffect } from 'react'
import { FaMicrophone, FaStop } from 'react-icons/fa'
import { format } from 'date-fns'

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [recordings, setRecordings] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const savedRecordings = localStorage.getItem('recordings')
    if (savedRecordings) {
      setRecordings(JSON.parse(savedRecordings))
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      let chunks = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const newRecording = {
          id: Date.now(),
          url,
          date: new Date().toISOString(),
          category: 'voice-memo'
        }
        
        const updatedRecordings = [newRecording, ...recordings]
        setRecordings(updatedRecordings)
        localStorage.setItem('recordings', JSON.stringify(updatedRecordings))
        chunks = []
      }

      recorder.start(1000)
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (err) {
      console.error('Recording error:', err)
      setError('Could not start recording. Please check your microphone.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-center">
          {error}
        </div>
      )}

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center ${
            isRecording 
              ? 'bg-gray-500 animate-pulse' 
              : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
          }`}
        >
          {isRecording ? (
            <FaStop size={24} className="text-white" />
          ) : (
            <FaMicrophone size={24} className="text-white" />
          )}
        </button>
        {isRecording && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm">
              Recording...
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-24">
        {recordings.map((recording) => (
          <div key={recording.id} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-500">
                {format(new Date(recording.date), 'MMM d, yyyy h:mm a')}
              </span>
              <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                {recording.category}
              </span>
            </div>
            <audio 
              controls 
              className="w-full" 
              src={recording.url}
              preload="metadata"
            />
          </div>
        ))}

        {recordings.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No recordings yet. Tap the microphone button to start recording.
          </div>
        )}
      </div>
    </div>
  )
}
