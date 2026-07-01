function popupRoot() {
  const root = document.createElement('div')
  root.style.fontFamily = "'IBM Plex Sans', sans-serif"
  root.style.padding = '6px 10px'
  return root
}

function popupTitle(text: unknown, weight = '600') {
  const title = document.createElement('div')
  title.textContent = String(text ?? '')
  title.style.fontSize = '12px'
  title.style.fontWeight = weight
  title.style.color = '#1e2a3a'
  return title
}

export function stationPopupNode(name: unknown, temp: unknown, color: unknown) {
  const root = popupRoot()
  root.append(popupTitle(name))
  if (temp != null) {
    const value = document.createElement('div')
    value.textContent = `${temp}°`
    value.style.fontFamily = "'IBM Plex Mono', monospace"
    value.style.fontSize = '16px'
    value.style.fontWeight = '600'
    value.style.color = String(color ?? '#1e2a3a')
    value.style.marginTop = '2px'
    root.append(value)
  }
  return root
}

export function capitalPopupNode(p: Record<string, unknown>) {
  const tmax = p.tmax as number | null
  const tmin = p.tmin as number | null
  const uv = p.uv as number | null
  const color = p.tempColor as string
  const root = popupRoot()
  const title = popupTitle(p.name, '700')
  title.style.marginBottom = '3px'
  root.append(title)
  if (tmax != null) {
    const max = document.createElement('span')
    max.textContent = `${tmax}°`
    max.style.fontFamily = "'IBM Plex Mono', monospace"
    max.style.fontSize = '15px'
    max.style.fontWeight = '600'
    max.style.color = color
    root.append(max)
  }
  if (tmin != null) {
    const min = document.createElement('span')
    min.textContent = `/ ${tmin}°`
    min.style.fontFamily = "'IBM Plex Mono', monospace"
    min.style.fontSize = '12px'
    min.style.color = '#5a6a7a'
    min.style.marginLeft = '4px'
    root.append(min)
  }
  if (uv != null) {
    const uvLine = document.createElement('div')
    uvLine.textContent = `UV ${uv}`
    uvLine.style.fontSize = '11px'
    uvLine.style.color = '#5a6a7a'
    uvLine.style.marginTop = '2px'
    root.append(uvLine)
  }
  return root
}

export function locationPopupNode(name: unknown, tempLabel: unknown, tempTextColor: unknown) {
  const root = popupRoot()
  root.style.fontSize = '13px'
  root.style.padding = '5px 8px'
  root.style.fontWeight = '600'
  root.style.color = '#1e2a3a'
  root.append(document.createTextNode(String(name ?? '')))
  if (tempLabel) {
    const temp = document.createElement('span')
    temp.textContent = String(tempLabel)
    temp.style.fontFamily = "'IBM Plex Mono', monospace"
    temp.style.fontSize = '13px'
    temp.style.fontWeight = '600'
    temp.style.color = String(tempTextColor ?? '#1e2a3a')
    temp.style.marginLeft = '6px'
    root.append(temp)
  }
  return root
}

export function seaPopupNode(p: Record<string, unknown>) {
  const root = popupRoot()
  const title = popupTitle(p.name, '700')
  title.style.marginBottom = '2px'
  root.append(title)

  const height = document.createElement('div')
  height.textContent = `${p.h}m`
  height.style.fontFamily = "'IBM Plex Mono', monospace"
  height.style.fontSize = '14px'
  height.style.fontWeight = '600'
  height.style.color = String(p.color ?? '#1e2a3a')
  root.append(height)

  const details = document.createElement('div')
  details.textContent = `${p.dir ?? ''} · ${p.period ?? ''}s`
  details.style.fontSize = '11px'
  details.style.color = '#5a6a7a'
  root.append(details)
  return root
}
