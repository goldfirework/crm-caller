import { useState, useEffect, useCallback } from 'react'
import ListSelector from './components/ListSelector'
import CallingView from './components/CallingView'
import ListView from './components/ListView'
import { Phone, Table2, ArrowLeft } from 'lucide-react'

const STORAGE_KEY = 'crm_data_v2'

export const CATEGORIES = {
  uncategorized: {
    label: 'Nye',
    tabLabel: 'Nye / Uringte',
    badgeClass: 'bg-gray-700 text-gray-300 border border-gray-600',
    btnClass: 'bg-gray-700 hover:bg-gray-600 border border-gray-500 text-white',
    tabActiveClass: 'bg-gray-800 text-white border-gray-600',
  },
  no_answer: {
    label: 'Ikke svar',
    tabLabel: 'Ikke svar',
    badgeClass: 'bg-red-900/60 text-red-300 border border-red-800',
    btnClass: 'bg-red-800 hover:bg-red-700 border border-red-700 text-red-100',
    tabActiveClass: 'bg-red-900/40 text-red-200 border-red-700',
  },
  responded: {
    label: 'Svarte',
    tabLabel: 'Svarte',
    badgeClass: 'bg-blue-900/60 text-blue-300 border border-blue-800',
    btnClass: 'bg-blue-700 hover:bg-blue-600 border border-blue-600 text-blue-100',
    tabActiveClass: 'bg-blue-900/40 text-blue-200 border-blue-700',
  },
  interested: {
    label: 'Interessert',
    tabLabel: 'Interessert',
    badgeClass: 'bg-amber-900/60 text-amber-300 border border-amber-800',
    btnClass: 'bg-amber-600 hover:bg-amber-500 border border-amber-500 text-amber-100',
    tabActiveClass: 'bg-amber-900/40 text-amber-200 border-amber-700',
  },
  meeting: {
    label: 'Vil ha møte',
    tabLabel: 'Vil ha møte',
    badgeClass: 'bg-green-900/60 text-green-300 border border-green-800',
    btnClass: 'bg-green-700 hover:bg-green-600 border border-green-600 text-green-100',
    tabActiveClass: 'bg-green-900/40 text-green-200 border-green-700',
  },
}

export default function App() {
  const [lists, setLists] = useState({})
  const [activeListId, setActiveListId] = useState(null)
  const [view, setView] = useState('calling')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        setLists(data.lists || {})
        setActiveListId(data.activeListId || null)
        setView(data.view || 'calling')
      }
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lists, activeListId, view }))
  }, [lists, activeListId, view])

  const activeList = activeListId ? lists[activeListId] : null

  const updateActiveList = useCallback((updater) => {
    setLists(prev => ({
      ...prev,
      [activeListId]: updater(prev[activeListId]),
    }))
  }, [activeListId])

  const handleAddList = (name, filename, leads, source = 'uploaded') => {
    const id = source === 'bundled'
      ? `bundled:${filename.replace('.json', '')}`
      : `uploaded:${Date.now()}`
    const newList = {
      id, name, filename, source, leads,
      categories: {},
      indices: {},
      filterCategory: 'uncategorized',
      createdAt: new Date().toISOString(),
    }
    setLists(prev => ({ ...prev, [id]: newList }))
    setActiveListId(id)
    setView('calling')
  }

  const handleDeleteList = (id) => {
    setLists(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (activeListId === id) setActiveListId(null)
  }

  const handleCategorize = (orgNr, category) => {
    updateActiveList(list => ({
      ...list,
      categories: { ...list.categories, [orgNr]: category },
    }))
  }

  const currentFilter = activeList?.filterCategory || 'uncategorized'

  const getIndex = (cat) => activeList?.indices?.[cat] || 0
  const setIndex = (cat, idx) => {
    updateActiveList(list => ({
      ...list,
      indices: { ...list.indices, [cat]: idx },
    }))
  }

  const setFilterCategory = (cat) => {
    updateActiveList(list => ({ ...list, filterCategory: cat }))
  }

  if (!activeList) {
    return (
      <ListSelector
        lists={lists}
        onOpen={(id) => { setActiveListId(id); setView('calling') }}
        onAdd={handleAddList}
        onDelete={handleDeleteList}
      />
    )
  }

  const leadsArray = Object.entries(activeList.leads).map(([orgNr, data]) => ({
    orgNr,
    ...data,
    _category: activeList.categories[orgNr] || 'uncategorized',
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
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setActiveListId(null)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm shrink-0"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:block">Lister</span>
          </button>
          <span className="text-gray-700 shrink-0">|</span>
          <span className="text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-xs">
            {activeList.name}
          </span>
          <span className="text-xs text-gray-500 hidden sm:block shrink-0">
            {totalCalled}/{leadsArray.length} ringt
          </span>
        </div>

        <nav className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setView('calling')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'calling'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Phone size={14} />
            <span className="hidden sm:block">Ringe</span>
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
            <span className="hidden sm:block">Listevisning</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {view === 'calling' ? (
          <CallingView
            leads={leadsArray}
            filterCategory={currentFilter}
            onFilterChange={setFilterCategory}
            currentIndex={getIndex(currentFilter)}
            onIndexChange={(idx) => setIndex(currentFilter, idx)}
            onCategorize={handleCategorize}
            counts={counts}
          />
        ) : (
          <ListView
            leads={leadsArray}
            leadsRaw={activeList.leads}
            categoriesMap={activeList.categories}
            listName={activeList.name}
            onGoToLead={(orgNr) => {
              const cat = activeList.categories[orgNr] || 'uncategorized'
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
