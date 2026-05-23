export const TYPE_LABELS = {
  fiche_client: 'Fiche client',
  logistique: 'Logistique',
  compta: 'Compta',
  tarif: 'Tarif',
  autre: 'Autre',
  commande: 'Commande',
}

export const TYPE_STYLES = {
  fiche_client: { wrapper: 'bg-purple-50 text-purple-800 border border-purple-200', label: 'Fiche client' },
  logistique:   { wrapper: 'bg-orange-50 text-orange-800 border border-orange-200', label: 'Logistique' },
  compta:       { wrapper: 'bg-blue-50 text-blue-800 border border-blue-200',       label: 'Compta' },
  tarif:        { wrapper: 'bg-teal-50 text-teal-800 border border-teal-200',       label: 'Tarif' },
  autre:        { wrapper: 'bg-stone-100 text-stone-600 border border-stone-200',   label: 'Autre' },
}

export const STATUSES = ['Entrante', 'À traiter', 'Traitée']

export const STATUS_ACTIVE = {
  'Entrante': 'bg-blue-50 text-blue-800 border-blue-300',
  'À traiter': 'bg-amber-50 text-amber-800 border-amber-300',
  'Traitée': 'bg-emerald-50 text-emerald-800 border-emerald-300',
}
