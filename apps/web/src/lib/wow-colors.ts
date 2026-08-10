// Esquema Oficial de Cores de Classes do World of Warcraft
export const WOW_CLASS_COLORS: Record<string, string> = {
  'cavaleiro da morte': '#C41F3B',
  'death knight': '#C41F3B',
  'caçador de demônios': '#7104c4',
  'cacador de demonios': '#7104c4',
  'demon hunter': '#7104c4',
  'druida': '#FF7D0A',
  'druid': '#FF7D0A',
  'evocador': '#33937F',
  'convocador': '#33937F',
  'evoker': '#33937F',
  'caçador': '#ABD473',
  'cacador': '#ABD473',
  'hunter': '#ABD473',
  'mago': '#40C7EB',
  'mage': '#40C7EB',
  'monge': '#00FF96',
  'monk': '#00FF96',
  'paladino': '#F58CBA',
  'paladin': '#F58CBA',
  'sacerdote': '#FFFFFF',
  'priest': '#FFFFFF',
  'ladino': '#FFF569',
  'rogue': '#FFF569',
  'xamã': '#0070DE',
  'xama': '#0070DE',
  'shaman': '#0070DE',
  'bruxo': '#8787ED',
  'warlock': '#8787ED',
  'guerreiro': '#C79C5E',
  'warrior': '#C79C5E',
}

export function getClassColor(className?: string): string {
  if (!className) return '#F5D166'
  const normalizedKey = className.trim().toLowerCase()
  return WOW_CLASS_COLORS[normalizedKey] || '#F5D166'
}
