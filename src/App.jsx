import { useState, useEffect } from 'react'
import UploadScreen from './components/UploadScreen'
import CallingView from './components/CallingView'
import ListView from './components/ListView'
import { Phone, Table2, Upload } from 'lucide-react'

const STORAGE_KEY = 'crm_data_v1'

export const CATEGORIES = {
  uncategorized: {
    label: 'New',
    tabLabel: 'New / Uncalled',
    badgeClass: 'bg-gray-700 text-gray-300 border border-gray-600',
    btnClass: 'bg-gray-700 hover:bg-gray-600 border border-gray-500 text-white',
    tabClass: 'text-gray-400 border-gray-700',
    tabActiveClass: 'bg-gray-800 text-white border-gray-600',
  },
  no_answer: {
    label: 'No Answer',
    tabLabel: 'No Answer',
    badgeClass: 'bg-red-900/60 text-red-300 border border-red-800',
    btnClass: 'bg-red-800 hover:bg-red-700 border border-red-700 text-red-100',
    tabClass: 'text-red-400 border-red-900',
    tabActiveClass: 'bg-red-900/40 text-red-200 border-red-700',
  },
  responded: {
    label: 'Responded',
    tabLabel: 'Responded',
    badgeClass: 'bg-blue-900/60 text-blue-300 border border-blue-800',
    btnClass: 'bg-blue-700 hover:bg-blue-600 border border-blue-600 text-blue-100',
    tabClass: 'text-blue-400 border-blue-900',
    tabActiveClass: 'bg-blue-900/40 text-blue-200 border-blue-700',
  },
  interested: {
    label: 'Interested',
    tabLabel: 'Interested',
    badgeClass: 'bg-amber-900/60 text-amber-300 border border-amber-800',
    btnClass: 'bg-amber-600 hover:bg-amber-500 border border-amber-500 text-amber-100',
    tabClass: 'text-amber-400 border-amber-900',
    tabActiveClass: 'bg-amber-900/40 text-amber-200 border-amber-700',
  },
  meeting: {
    label: 'Wants Meeting',
    tabLabel: 'Wants Meeting',
    badgeClass: 'bg-green-900/60 text-green-300 border border-green-800',
    btnClass: 'bg-green-700 hover:bg-green-600 border border-green-600 text-green-100',
    tabClass: 'text-green-400 border-green-900',
    tabActiveClass: 'bg-green-900/40 text-green-200 border-green-700',
  },
}

export default function App() {
  const [view, setView] = useState('calling')
  const [leads, setLeads] = useState(null)
  const [categories, setCategories] = useState({})
  const [indices, setIndices] = useState({})
  const [filterCategory, setFilterCategory] = useState('uncategorized')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        setLeads(data.leads)
        setCategories(data.categories || {})
        setIndices(data.indices || {})
        setFilterCategory(data.filterCategory || 'uncategorized')
        setView(data.view || 'calling')
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (leads) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        leads, categories, indices, filterCategory, view,
      }))
    }
  }, [leads, categories, indices, filterCategory, view])

  const handleUpload = (data) => {
    setLeads(data)
    setCategories({})
    setIndices({})
    setFilterCategory('uncategorized')
    setView('calling')
  }

  const handleReset = () => {
    if (window.confirm('Clear all data and upload a new file? Progress will be lost.')) {
      localStorage.removeItem(STORAGE_KEY)
      setLeads(null)
      setCategories({})
      setIndices({})
    }
  }

  const handleCategorize = (orgNr, category) => {
    setCategories(prev => ({ ...prev, [orgNr]: category }))
  }

  const getIndex = (cat) => indices[cat] || 0
  const setIndex = (cat, idx) => setIndices(prev => ({ ...prev, [cat]: idx }))

  if (!leads) {
    return <UploadScreen onUpload={handleUpload} />
  }

  const leadsArray = Object.entries(leads).map(([orgNr, data]) => ({
    orgNr,
    ...data,
    _category: categories[orgNr] || 'uncategorized',
  }))

  const counts = Object.fromEntries(
    Object.keys(CATEGORIES).map(cat => [
      cat,
      leadsArray.filter(l => l._category === cat).length,
    ])
  )

  const totalCalled = leadsArray.length - counts.uncategorized

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white tracking-tight">CRM Caller</span>
          <span className="text-xs text-gray-500 hidden sm:block">
            {totalCalled}/{leadsArray.length} called
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <button
            onClick={() => setView('calling')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'calling'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Phone size={14} />
            <span className="hidden sm:block">Calling</span>
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'list'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Table2 size={14} />
            <span className="hidden sm:block">List View</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-500 hover:text-white hover:bg-gray-800 transition-colors ml-1"
            title="Upload new file"
          >
            <Upload size={14} />
            <span className="hidden sm:block">New File</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {view === 'calling' ? (
          <CallingView
            leads={leadsArray}
            filterCategory={filterCategory}
            onFilterChange={(cat) => {
              setFilterCategory(cat)
            }}
            currentIndex={getIndex(filterCategory)}
            onIndexChange={(idx) => setIndex(filterCategory, idx)}
            onCategorize={handleCategorize}
            counts={counts}
          />
        ) : (
          <ListView
            leads={leadsArray}
            leadsRaw={leads}
            categoriesMap={categories}
            onGoToLead={(orgNr) => {
              const cat = categories[orgNr] || 'uncategorized'
              const filtered = leadsArray.filter(l => l._category === cat)
              const idx = filtered.findIndex(l => l.orgNr === orgNr)
              if (idx !== -1) {
                setIndex(cat, idx)
                setFilterCategory(cat)
              }
              setView('calling')
            }}
          />
        )}
      </main>
    </div>
  )
}
