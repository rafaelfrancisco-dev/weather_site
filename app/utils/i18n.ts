export type Lang = 'en' | 'pt'

export function strings(lang: Lang) {
  const en = {
    subtitle: 'Weather & Climate Service',
    search: 'Search location',
    regions: 'Regions',
    time: 'Time',
    weather: 'Weather',
    temp: 'Temp',
    feels: 'Feels like',
    precipProb: 'Precip %',
    wind: 'Wind',
    windSpd: 'Wind',
    humidity: 'Humidity',
    hourly: 'Hourly forecast — next 3 days',
    tenDay: '10-day forecast',
    day: 'Day',
    minmax: 'Min / Max',
    warnings: 'Warnings',
    obs: 'Observations',
    forecast: 'Forecast',
    updated: 'Updated',
    noWarn: 'No active warnings',
    noWarnSub: 'This location is at green awareness level.',
    levels: 'Awareness levels',
    obsTitle: 'Latest station observations',
    obsNote: 'Automatic stations · values updated hourly. "—" indicates no data.',
    disclaimer: 'Data from IPMA — Instituto Português do Mar e da Atmosfera.',
    station: 'Station',
    pressure: 'Pressure',
    precip: 'Precip',
    solar: 'Solar'
  }
  const pt = {
    subtitle: 'Serviço de Meteorologia e Clima',
    search: 'Procurar local',
    regions: 'Regiões',
    time: 'Hora',
    weather: 'Tempo',
    temp: 'Temp',
    feels: 'Sensação',
    precipProb: 'Prec. %',
    wind: 'Vento',
    windSpd: 'Vento',
    humidity: 'Humidade',
    hourly: 'Previsão horária — próximos 3 dias',
    tenDay: 'Previsão a 10 dias',
    day: 'Dia',
    minmax: 'Mín / Máx',
    warnings: 'Avisos',
    obs: 'Observações',
    forecast: 'Previsão',
    updated: 'Atualizado',
    noWarn: 'Sem avisos ativos',
    noWarnSub: 'Este local está no nível de aviso verde.',
    levels: 'Níveis de aviso',
    obsTitle: 'Últimas observações das estações',
    obsNote: 'Estações automáticas · valores atualizados de hora a hora. "—" indica ausência de dados.',
    disclaimer: 'Dados do IPMA — Instituto Português do Mar e da Atmosfera.',
    station: 'Estação',
    pressure: 'Pressão',
    precip: 'Prec.',
    solar: 'Rad.'
  }
  return lang === 'pt' ? pt : en
}

const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function weekday(date: Date, lang: Lang): string {
  return (lang === 'pt' ? WEEKDAY_PT : WEEKDAY_EN)[date.getDay()]
}

export function monthShort(date: Date, lang: Lang): string {
  return (lang === 'pt' ? MONTH_PT : MONTH_EN)[date.getMonth()]
}
