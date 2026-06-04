import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Phone, Building2, User, Mail, MapPin, Zap } from 'lucide-react'
import { CATEGORIES } from '../App'

const CATEGORY_ORDER = ['uncategorized', 'no_answer', 'responded', 'interested', 'meeting']
const ACTION_CATEGORIES = ['no_answer', 'responded', 'interested', 'meeting']

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
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badgeClass}`}>
      {CATEGORY_ICONS[category] && <span>{CATEGORY_ICONS[category]}</span>}
      {cfg.label}
    </span>
  )
}

export default function CallingView({
  leads,
  filterCategory,
  onFilterChange,
  currentIndex,
  onIndexChange,
  onCategorize,
  counts,
}) {
  const filteredLeads = useMemo(
    () => leads.filter(l => l._category === filterCategory),
    [leads, filterCategory]
  )

  const total = filteredLeads.length
  const safeIndex = total > 0 ? Math.min(currentIndex, total - 1) : 0
  const lead = filteredLeads[safeIndex] || null

  const handleCategorize = (category) => {
    if (!lead) return
    onCategorize(lead.orgNr, category)
    const newTotal = total - 1
    if (newTotal <= 0) return
    const nextIdx = safeIndex >= newTotal ? newTotal - 1 : safeIndex
    onIndexChange(nextIdx)
  }

  const goTo = (delta) => {
    const next = Math.max(0, Math.min(total - 1, safeIndex + delta))
    onIndexChange(next)
  }

  const phoneRaw = lead?.telefonnummer ? String(lead.telefonnummer).replace(/\D/g, '') : ''
  const phoneFormatted = formatPhone(phoneRaw)
  const telHref = phoneRaw ? `tel:+47${phoneRaw}` : '#'
  const aktivity = Array.isArray(lead?.aktivitet)
    ? lead.aktivitet.join(' ')
    : (lead?.aktivitet || '')

  return (
    <div className="flex flex-col flex-1">
      {/* Category filter tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1 min-w-max py-2">
          {CATEGORY_ORDER.map(cat => {
            const cfg = CATEGORIES[cat]
            const isActive = filterCategory === cat
            const count = counts[cat] || 0
            return (
              <button
                key={cat}
                onClick={() => onFilterChange(cat)}
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
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
          <span>{safeIndex + 1} av {total}</span>
          <div className="flex-1 mx-4 bg-gray-800 rounded-full h-1">
            <div
              className="bg-indigo-600 h-1 rounded-full transition-all"
              style={{ width: `${((safeIndex + 1) / total) * 100}%` }}
            />
          </div>
          <span className="text-gray-600">{total - safeIndex - 1} igjen</span>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8">
        {!lead ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 mt-16">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-xl font-semibold text-white">Alt ferdig her!</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              Ingen leads i denne kategorien. Bytt fane eller gå tilbake til listelisten.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            {lead._category !== 'uncategorized' && (
              <div className="flex justify-center mb-3">
                <CategoryBadge category={lead._category} />
              </div>
            )}

            {/* Main card */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
              {/* Business + Owner */}
              <div className="p-6 pb-4 border-b border-gray-800">
                <div className="flex items-start gap-3 mb-3">
                  <div className="mt-1 p-2 bg-indigo-600/20 rounded-lg border border-indigo-500/20 shrink-0">
                    <Building2 size={20} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight break-words">
                      {lead.bedriftsnavn || '—'}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-1.5 text-gray-400">
                      <User size={13} />
                      <span className="text-sm">{lead.eier || '—'}</span>
                      {lead.alder && (
                        <span className="text-gray-600 text-xs ml-1">({lead.alder} år)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Org.nr {lead.orgNr}</span>
                  {lead.konfidensgrad && (
                    <>
                      <span>·</span>
                      <span className={`capitalize ${
                        lead.konfidensgrad === 'høy' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {lead.konfidensgrad} konfidensgrad
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Phone — hero element */}
              <div className="px-6 py-6 border-b border-gray-800 text-center">
                {phoneRaw ? (
                  <a href={telHref} className="group inline-flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-green-600 rounded-xl group-hover:bg-green-500 transition-colors">
                        <Phone size={22} className="text-white" />
                      </div>
                      <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-wider group-hover:text-green-400 transition-colors">
                        {phoneFormatted}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 group-hover:text-green-600 transition-colors">
                      Trykk for å ringe · +47 {phoneFormatted}
                    </span>
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Phone size={18} />
                    <span>Ingen telefonnummer</span>
                  </div>
                )}
                {lead.mobiloperator && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-600">
                    <Zap size={11} />
                    <span>{lead.mobiloperator}</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lead.epost && lead.epost !== 'Mangler epost' && (
                  <div className="flex items-start gap-2 text-sm">
                    <Mail size={14} className="text-gray-600 mt-0.5 shrink-0" />
                    <span className="text-gray-300 break-all">{lead.epost}</span>
                  </div>
                )}
                {lead.adresse_1881 && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin size={14} className="text-gray-600 mt-0.5 shrink-0" />
                    <span className="text-gray-400">{lead.adresse_1881}</span>
                  </div>
                )}
                {aktivity && (
                  <div className="sm:col-span-2 text-sm text-gray-500 italic leading-relaxed">
                    {aktivity}
                  </div>
                )}
              </div>
            </div>

            {/* Category buttons */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACTION_CATEGORIES.map(cat => {
                const cfg = CATEGORIES[cat]
                const isCurrent = lead._category === cat
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategorize(cat)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-medium transition-all ${cfg.btnClass} ${
                      isCurrent ? 'ring-2 ring-white/30 scale-[0.98]' : 'hover:scale-[1.02]'
                    }`}
                  >
                    <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                    <span className="leading-tight text-xs text-center">{cfg.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Navigation */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                onClick={() => goTo(-1)}
                disabled={safeIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors"
              >
                <ChevronLeft size={16} />
                Forrige
              </button>

              <span className="text-xs text-gray-600 font-mono">
                {safeIndex + 1} / {total}
              </span>

              <button
                onClick={() => goTo(1)}
                disabled={safeIndex >= total - 1}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors"
              >
                Neste
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
