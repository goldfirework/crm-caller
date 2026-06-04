import { useState, useEffect, useCallback, useRef } from 'react'
import { Upload, Trash2, ChevronRight, Database, AlertCircle, Loader2 } from 'lucide-react'

function ListCard({ list, onOpenClick, onDeleteClick }) {
  const total = Object.keys(list.leads).length
  const called = Object.values(list.categories || {}).filter(c => c !== 'uncategorized').length
  const pct = total > 0 ? Math.round((called / total) * 100) : 0

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-700 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{list.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {total.toLocaleString('nb')} leads &middot; {pct}% ringt
        </p>
        {pct > 0 && (
          <div className="mt-2 bg-gray-800 rounded-full h-1 w-32">
            <div
              className="bg-indigo-600 h-1 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onDeleteClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteClick() }}
            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
            title="Slett liste"
          >
            <Trash2 size={14} />
          </button>
        )}
        <button
          onClick={onOpenClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium text-white transition-colors"
        >
          {pct > 0 ? 'Fortsett' : 'Åpne'}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default function ListSelector({ lists, onOpen, onAdd, onDelete }) {
  const [bundledFiles, setBundledFiles] = useState([])
  const [loadingBundled, setLoadingBundled] = useState(true)
  const [loadingFile, setLoadingFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef()

  useEffect(() => {
    fetch('/lead_lists/index.json')
      .then(r => r.json())
      .then(files => setBundledFiles(Array.isArray(files) ? files : []))
      .catch(() => setBundledFiles([]))
      .finally(() => setLoadingBundled(false))
  }, [])

  const handleOpenBundled = async (filename) => {
    const id = `bundled:${filename.replace('.json', '')}`
    if (lists[id]) { onOpen(id); return }

    setLoadingFile(filename)
    setError('')
    try {
      const r = await fetch(`/lead_lists/${filename}`)
      if (!r.ok) throw new Error()
      const data = await r.json()
      const name = filename.replace('.json', '')
      onAdd(name, filename, data, 'bundled')
    } catch {
      setError(`Kunne ikke laste «${filename}»`)
    } finally {
      setLoadingFile(null)
    }
  }

  const processFile = useCallback((file) => {
    setError('')
    if (!file) return
    if (!file.name.endsWith('.json')) {
      setError('Kun .json-filer støttes.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (typeof data !== 'object' || Array.isArray(data)) {
          setError('Ugyldig format. Forventet JSON-objekt med org.nr som nøkler.')
          return
        }
        if (Object.keys(data).length === 0) {
          setError('Filen er tom.')
          return
        }
        onAdd(file.name.replace('.json', ''), file.name, data, 'uploaded')
      } catch {
        setError('Kunne ikke lese JSON-filen. Sjekk at filen er gyldig.')
      }
    }
    reader.readAsText(file)
  }, [onAdd])

  const uploadedLists = Object.values(lists).filter(l => l.source === 'uploaded')

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-start p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
            <span className="text-2xl">📞</span>
          </div>
          <h1 className="text-2xl font-bold text-white">CRM Caller</h1>
          <p className="text-gray-500 text-sm mt-1">Velg en liste for å begynne å ringe</p>
        </div>

        {/* Bundled lists */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Database size={12} />
            Forhåndsinnlastede lister
          </h2>
          {loadingBundled ? (
            <div className="flex items-center gap-2 text-gray-600 text-sm py-4">
              <Loader2 size={14} className="animate-spin" />
              Laster lister...
            </div>
          ) : bundledFiles.length === 0 ? (
            <p className="text-gray-700 text-sm py-2 italic">Ingen forhåndsinnlastede lister funnet.</p>
          ) : (
            <div className="space-y-2">
              {bundledFiles.map(filename => {
                const id = `bundled:${filename.replace('.json', '')}`
                const existing = lists[id]
                const isLoading = loadingFile === filename

                return (
                  <div
                    key={filename}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{filename.replace('.json', '')}</p>
                      {existing ? (
                        <>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {Object.keys(existing.leads).length.toLocaleString('nb')} leads &middot;{' '}
                            {Math.round(
                              (Object.values(existing.categories || {}).filter(c => c !== 'uncategorized').length /
                                Object.keys(existing.leads).length) * 100
                            )}% ringt
                          </p>
                          {(() => {
                            const total = Object.keys(existing.leads).length
                            const called = Object.values(existing.categories || {}).filter(c => c !== 'uncategorized').length
                            const pct = total > 0 ? Math.round((called / total) * 100) : 0
                            return pct > 0 ? (
                              <div className="mt-2 bg-gray-800 rounded-full h-1 w-32">
                                <div className="bg-indigo-600 h-1 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            ) : null
                          })()}
                        </>
                      ) : (
                        <p className="text-xs text-gray-600 mt-0.5">Ikke åpnet ennå</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleOpenBundled(filename)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors shrink-0"
                    >
                      {isLoading
                        ? <Loader2 size={14} className="animate-spin" />
                        : <ChevronRight size={14} />}
                      {existing
                        ? (Object.values(existing.categories || {}).filter(c => c !== 'uncategorized').length > 0 ? 'Fortsett' : 'Åpne')
                        : 'Åpne'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Uploaded lists */}
        {uploadedLists.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Upload size={12} />
              Mine opplastede lister
            </h2>
            <div className="space-y-2">
              {uploadedLists.map(list => (
                <ListCard
                  key={list.id}
                  list={list}
                  onOpenClick={() => onOpen(list.id)}
                  onDeleteClick={() => {
                    if (window.confirm(`Slett «${list.name}»? Fremgang vil gå tapt.`)) {
                      onDelete(list.id)
                    }
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upload new */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Last opp ny liste
          </h2>
          <label
            className={`block cursor-pointer rounded-xl border-2 border-dashed transition-all p-8 text-center ${
              dragOver
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              processFile(e.dataTransfer.files[0])
            }}
          >
            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={e => processFile(e.target.files[0])}
            />
            <div className="flex flex-col items-center gap-3">
              <Upload
                size={28}
                className={dragOver ? 'text-indigo-400' : 'text-gray-600'}
              />
              <div>
                <p className="text-sm text-gray-400 mb-1">
                  {dragOver ? 'Slipp for å laste opp' : 'Dra og slipp JSON-fil her'}
                </p>
                <p className="text-xs text-gray-600">eller klikk for å velge fil</p>
              </div>
            </div>
          </label>

          {error && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
