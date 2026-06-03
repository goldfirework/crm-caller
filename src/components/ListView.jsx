import { useState, useMemo } from 'react'
import { Download, ArrowUpDown, ArrowUp, ArrowDown, Phone, ExternalLink } from 'lucide-react'
import { CATEGORIES } from '../App'

const CATEGORY_ORDER = ['uncategorized', 'no_answer', 'responded', 'interested', 'meeting']

const CATEGORY_ICONS = {
  no_answer: '🔕',
  responded: '💬',
  interested: '⭐',
  meeting: '📅',
}

function formatPhone(num) {
  if (!num) return ''
  const s = String(num).replace(/\D/g, '')
  if (s.length === 8) return `${s.slice(0, 2)} ${s.slice(2, 4)} ${s.slice(4, 6)} ${s.slice(6, 8)}`
  return s
}

function CategoryBadge({ category }) {
  const cfg = CATEGORIES[category]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.badgeClass}`}>
      {CATEGORY_ICONS[category] && <span>{CATEGORY_ICONS[category]}</span>}
      {cfg.label}
    </span>
  )
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const COLUMNS = [
  { key: '_category', label: 'Status', sortable: true },
  { key: 'bedriftsnavn', label: 'Business Name', sortable: true },
  { key: 'eier', label: 'Owner', sortable: true },
  { key: 'telefonnummer', label: 'Phone', sortable: false },
  { key: 'epost', label: 'Email', sortable: true },
  { key: 'adresse_1881', label: 'Address', sortable: true },
  { key: 'aktivitet', label: 'Activity', sortable: false },
  { key: 'alder', label: 'Age', sortable: true },
  { key: 'mobiloperator', label: 'Operator', sortable: true },
  { key: 'orgNr', label: 'Org.nr', sortable: true },
  { key: 'registrert_dato', label: 'Registered', sortable: true },
]

export default function ListView({ leads, leadsRaw, categoriesMap, onGoToLead }) {
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortKey, setSortKey] = useState('bedriftsnavn')
  const [sortDir, setSortDir] = useState('asc')
  const [search, setSearch] = useState('')

  const counts = useMemo(() => {
    const c = { all: leads.length }
    CATEGORY_ORDER.forEach(cat => {
      c[cat] = leads.filter(l => l._category === cat).length
    })
    return c
  }, [leads])

  const filtered = useMemo(() => {
    let rows = filterCategory === 'all'
      ? [...leads]
      : leads.filter(l => l._category === filterCategory)

    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(l =>
        (l.bedriftsnavn || '').toLowerCase().includes(q) ||
        (l.eier || '').toLowerCase().includes(q) ||
        (l.telefonnummer || '').toString().includes(q) ||
        (l.orgNr || '').includes(q)
      )
    }

    rows.sort((a, b) => {
      let va = a[sortKey] ?? ''
      let vb = b[sortKey] ?? ''
      if (sortKey === '_category') {
        va = CATEGORY_ORDER.indexOf(va)
        vb = CATEGORY_ORDER.indexOf(vb)
      } else if (typeof va === 'number' && typeof vb === 'number') {
        // numeric compare
      } else {
        va = String(va).toLowerCase()
        vb = String(vb).toLowerCase()
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [leads, filterCategory, sortKey, sortDir, search])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleDownload = (cat) => {
    const subset = Object.fromEntries(
      Object.entries(leadsRaw).filter(([orgNr]) =>
        cat === 'all'
          ? true
          : (categoriesMap[orgNr] || 'uncategorized') === cat
      )
    )
    const dateStr = new Date().toISOString().split('T')[0]
    const label = cat === 'all' ? 'all' : CATEGORIES[cat]?.label.toLowerCase().replace(/\s+/g, '_')
    downloadJson(`leads_${label}_${dateStr}.json`, subset)
  }

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null
    if (sortKey !== col.key) return <ArrowUpDown size={12} className="text-gray-600 ml-1 inline" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-indigo-400 ml-1 inline" />
      : <ArrowDown size={12} className="text-indigo-400 ml-1 inline" />
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filter + download bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* All tab */}
          <button
            onClick={() => setFilterCategory('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              filterCategory === 'all'
                ? 'bg-indigo-900/40 text-indigo-200 border-indigo-700'
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            All
            <span className="px-1.5 py-0.5 rounded-full text-xs font-mono bg-gray-800 text-gray-500">
              {counts.all}
            </span>
          </button>
          {CATEGORY_ORDER.map(cat => {
            const cfg = CATEGORIES[cat]
            const isActive = filterCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  isActive
                    ? cfg.tabActiveClass
                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800'
                }`}
              >
                {CATEGORY_ICONS[cat] && <span className="text-xs">{CATEGORY_ICONS[cat]}</span>}
                {cfg.tabLabel}
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono ${
                  isActive ? 'bg-white/10' : 'bg-gray-800 text-gray-500'
                }`}>
                  {counts[cat] || 0}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search name, business, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-48 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={() => handleDownload(filterCategory)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors whitespace-nowrap"
          >
            <Download size={14} />
            Download {filterCategory === 'all' ? 'All' : CATEGORIES[filterCategory]?.label} ({filtered.length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap select-none ${
                    col.sortable ? 'cursor-pointer hover:text-white' : ''
                  } ${sortKey === col.key ? 'text-indigo-400' : ''}`}
                >
                  {col.label}
                  <SortIcon col={col} />
                </th>
              ))}
              <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Go To
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-12 text-center text-gray-600">
                  No leads found
                </td>
              </tr>
            ) : (
              filtered.map((lead, i) => {
                const phoneRaw = lead.telefonnummer ? String(lead.telefonnummer).replace(/\D/g, '') : ''
                const aktivity = Array.isArray(lead.aktivitet)
                  ? lead.aktivitet.join(' ')
                  : (lead.aktivitet || '')
                const email = lead.epost === 'Mangler epost' ? '' : lead.epost

                return (
                  <tr
                    key={lead.orgNr}
                    className={`border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors ${
                      i % 2 === 0 ? 'bg-transparent' : 'bg-gray-900/20'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <CategoryBadge category={lead._category} />
                    </td>
                    <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate">
                      {lead.bedriftsnavn || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {lead.eier || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {phoneRaw ? (
                        <a
                          href={`tel:+47${phoneRaw}`}
                          className="flex items-center gap-1.5 text-green-400 hover:text-green-300 font-mono transition-colors"
                        >
                          <Phone size={12} />
                          {formatPhone(phoneRaw)}
                        </a>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate">
                      {email || <span className="text-gray-700">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate">
                      {lead.adresse_1881 || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={aktivity}>
                      {aktivity || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-center">
                      {lead.alder || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap max-w-[140px] truncate">
                      {lead.mobiloperator || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs whitespace-nowrap">
                      {lead.orgNr}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {lead.registrert_dato || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onGoToLead(lead.orgNr)}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-indigo-700 rounded-md text-xs text-gray-400 hover:text-white transition-colors"
                        title="Go to this lead in calling view"
                      >
                        <ExternalLink size={11} />
                        Call
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 text-xs text-gray-600">
        Showing {filtered.length} of {leads.length} leads
      </div>
    </div>
  )
}
