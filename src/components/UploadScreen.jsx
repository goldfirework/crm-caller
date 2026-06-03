import { useCallback, useState } from 'react'
import { Upload, FileJson, AlertCircle } from 'lucide-react'

export default function UploadScreen({ onUpload }) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const processFile = useCallback((file) => {
    setError('')
    if (!file || !file.name.endsWith('.json')) {
      setError('Please upload a .json file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (typeof data !== 'object' || Array.isArray(data)) {
          setError('Invalid format. Expected a JSON object with org numbers as keys.')
          return
        }
        const keys = Object.keys(data)
        if (keys.length === 0) {
          setError('File is empty.')
          return
        }
        onUpload(data)
      } catch {
        setError('Could not parse JSON. Check the file is valid.')
      }
    }
    reader.readAsText(file)
  }, [onUpload])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    processFile(file)
  }, [processFile])

  const handleFileInput = (e) => {
    processFile(e.target.files[0])
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
            <span className="text-3xl">📞</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CRM Caller</h1>
          <p className="text-gray-400 text-sm">Upload your leads file to get started</p>
        </div>

        <label
          className={`block cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-12 text-center ${
            dragOver
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-900'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="flex flex-col items-center gap-4">
            <div className={`p-4 rounded-xl transition-colors ${dragOver ? 'bg-indigo-500/20' : 'bg-gray-800'}`}>
              <FileJson size={40} className={dragOver ? 'text-indigo-400' : 'text-gray-500'} />
            </div>
            <div>
              <p className="text-white font-medium text-lg mb-1">
                {dragOver ? 'Drop to upload' : 'Drop your JSON file here'}
              </p>
              <p className="text-gray-500 text-sm">or click to browse</p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium text-white transition-colors">
              <Upload size={14} />
              Choose File
            </div>
          </div>
        </label>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-8 bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Expected format</p>
          <pre className="text-xs text-gray-500 overflow-x-auto scrollbar-thin">{`{
  "836994752": {
    "eier": "Navn Navnesen",
    "bedriftsnavn": "FIRMA AS",
    "telefonnummer": "99999999",
    "epost": "...",
    ...
  }
}`}</pre>
        </div>
      </div>
    </div>
  )
}
