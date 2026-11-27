<template>
  <div class="space-y-2">
    <div class="p-1 rounded-2xl border border-amber-500/20 bg-slate-950/60 shadow-inner overflow-hidden">
      <div class="relative pl-7 pt-5">
        <div class="absolute left-7 right-0 top-0 h-5 bg-slate-900/75 border-b border-amber-500/20">
          <span
            v-for="tick in topRuler"
            :key="tick.key"
            class="game-ruler-label game-ruler-label-top"
            :style="{ left: `${tick.pos}px` }"
          >{{ tick.text }}</span>
        </div>
        <div class="absolute left-0 top-5 bottom-0 w-7 bg-slate-900/75 border-r border-amber-500/20">
          <span
            v-for="tick in leftRuler"
            :key="tick.key"
            class="game-ruler-label game-ruler-label-left"
            :style="{ top: `${tick.pos}px` }"
          >{{ tick.text }}</span>
        </div>
        <div
          ref="mapEl"
          class="game-map w-full rounded-xl overflow-hidden relative bg-[#c9b88f] transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_0_18px_rgba(251,191,36,0.12)]"
          :style="{ height: `${height}px` }"
        >
          <div v-if="mapLoading" class="absolute inset-0 z-[500] flex items-center justify-center text-xs text-slate-300 bg-slate-900/60">
            載入地圖中...
          </div>
          <div v-if="mapError" class="absolute inset-0 z-[500] flex items-center justify-center text-xs text-slate-400">
            此地圖暫無資料
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-500">
      <span><b class="font-black text-slate-400">區域</b> {{ regionName || '—' }}</span>
      <span><b class="font-black text-slate-400">地圖</b> {{ selectedMap || '—' }}</span>
      <span><b class="font-black text-slate-400">位置</b> {{ markerLocations.length }}</span>
      <span><b class="font-black text-slate-400">游標</b> X: {{ cursorCoords.x ?? '--' }} Y: {{ cursorCoords.y ?? '--' }}</span>
      <span class="ml-auto shrink-0 text-slate-400">© SQUARE ENIX</span>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import 'leaflet/dist/leaflet.css'
import { MAP_IMAGE_SIZE, getGameMap, getGameMapImageUrls } from '@/config/gameMaps'
import { AETHERYTES_BY_MAP } from '@/config/aetherytes'
import { MAP_REGIONS_BY_ID } from '@/config/mapRegions'
import { getMonsterExplorerColor } from '@/config/mapColors'

const props = defineProps({
  monster: { type: Object, default: null },
  monsters: { type: Array, default: null },
  selectedMonsterId: { type: [String, Number], default: null },
  coloredMarkers: { type: Boolean, default: false },
  initialLocation: { type: Object, default: null },
  height: { type: Number, default: 420 },
  viewMode: { type: String, default: 'cover' }
})

const emit = defineEmits(['select-location', 'select-monster'])

const mapEl = ref(null)
const selectedMap = ref('')
const mapError = ref(false)
const mapLoading = ref(false)
const cursorCoords = ref({ x: null, y: null })
const topRuler = ref([])
const leftRuler = ref([])

let map = null
let leaflet = null
let imageLayer = null
let gridLayer = null
let markerLayer = null
let aetheryteLayer = null
let markerRenderer = null
let renderToken = 0
let isDestroyed = false
let resizeObserver = null
let renderedMapId = ''
let currentActiveMapId = ''
let cursorUpdateAt = 0
let rulerFrame = null

const mapImageCache = new Map()
const mapImagePending = new Map()
const activeMapRefs = new Map()
let mapImageCacheBytes = 0
const MAX_CACHED_MAPS = 12
const MAX_CACHE_BYTES = 10 * 1024 * 1024

let aetheryteIconUrl = null
let aetheryteIconPending = null

const loadAetheryteIcon = async () => {
  if (aetheryteIconUrl) return aetheryteIconUrl
  if (aetheryteIconPending) return aetheryteIconPending

  aetheryteIconPending = (async () => {
    const urls = [
      'https://v2.xivapi.com/api/asset?path=ui/icon/060000/060453.tex&format=png',
      'https://xivapi-v2.xivcdn.com/api/asset?path=ui/icon/060000/060453.tex&format=png'
    ]
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          cache: 'force-cache',
          headers: { Accept: 'image/png' }
        })
        if (!response.ok) continue
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        if (isDestroyed) {
          URL.revokeObjectURL(objectUrl)
          return null
        }
        aetheryteIconUrl = objectUrl
        return aetheryteIconUrl
      } catch (error) {
        // 換下一個來源
      }
    }
    return null
  })()

  try {
    return await aetheryteIconPending
  } finally {
    aetheryteIconPending = null
  }
}

const acquireActiveMap = (key) => {
  if (!key) return
  activeMapRefs.set(key, (activeMapRefs.get(key) || 0) + 1)
}

const releaseActiveMap = (key) => {
  if (!key) return
  const count = activeMapRefs.get(key) || 0
  if (count <= 1) {
    activeMapRefs.delete(key)
  } else {
    activeMapRefs.set(key, count - 1)
  }
}

const getCachedMapImage = (key) => {
  const entry = mapImageCache.get(key)
  if (!entry) return null
  // LRU：命中後移到最後，常用地圖不會優先被釋放
  mapImageCache.delete(key)
  mapImageCache.set(key, entry)
  return entry.url
}

const evictMapCache = () => {
  while (mapImageCache.size > MAX_CACHED_MAPS || mapImageCacheBytes > MAX_CACHE_BYTES) {
    let candidateKey = null
    let candidateEntry = null
    for (const [key, entry] of mapImageCache) {
      if ((activeMapRefs.get(key) || 0) > 0) continue
      candidateKey = key
      candidateEntry = entry
      break
    }
    if (!candidateKey) break
    URL.revokeObjectURL(candidateEntry.url)
    mapImageCache.delete(candidateKey)
    mapImageCacheBytes -= candidateEntry.size
  }
}

const cacheMapImage = (key, objectUrl, size = 0) => {
  const existing = mapImageCache.get(key)
  if (existing) {
    mapImageCache.delete(key)
    mapImageCacheBytes -= existing.size
    if (existing.url !== objectUrl) URL.revokeObjectURL(existing.url)
  }
  mapImageCache.set(key, { url: objectUrl, size })
  mapImageCacheBytes += size
  evictMapCache()
}

const loadMapImage = async (mapInfo) => {
  const key = mapInfo.mapId
  const cached = getCachedMapImage(key)
  if (cached) return cached
  if (mapImagePending.has(key)) return mapImagePending.get(key)

  const promise = (async () => {
    for (const url of getGameMapImageUrls(mapInfo)) {
      try {
        const response = await fetch(url, { cache: 'force-cache' })
        if (!response.ok) continue
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        if (isDestroyed) {
          URL.revokeObjectURL(objectUrl)
          return null
        }
        cacheMapImage(key, objectUrl, blob.size)
        return objectUrl
      } catch (error) {
        // 換下一個來源
      }
    }
    return null
  })()

  mapImagePending.set(key, promise)
  try {
    return await promise
  } finally {
    mapImagePending.delete(key)
  }
}

const AETHERYTE_FALLBACK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M6 3h12l4 6-10 12L2 9Z"/><path d="M11 3 8 9l4 12 4-12-3-6"/><path d="M2 9h20"/></svg>'

const sourceMonsters = computed(() => {
  if (Array.isArray(props.monsters) && props.monsters.length > 0) return props.monsters
  return props.monster ? [props.monster] : []
})

const allGameLocations = computed(() => {
  const entries = []
  for (const monster of sourceMonsters.value) {
    for (const loc of (monster.locations || [])) {
      if (!loc || !getGameMap(loc.map)) continue
      if (loc.x == null || loc.x === '' || loc.y == null || loc.y === '') continue
      if (!Number.isFinite(Number(loc.x)) || !Number.isFinite(Number(loc.y))) continue
      entries.push({ monster, loc })
    }
  }
  return entries
})

const gameLocations = computed(() => {
  if (props.selectedMonsterId == null) return allGameLocations.value
  return allGameLocations.value.filter(entry => entry.monster.id === props.selectedMonsterId)
})

const availableMaps = computed(() => [...new Set(allGameLocations.value.map(entry => entry.loc.map))])

const markerLocations = computed(() =>
  gameLocations.value.filter(entry => entry.loc.map === selectedMap.value)
)

const regionName = computed(() => {
  const mapInfo = getGameMap(selectedMap.value)
  return mapInfo ? (MAP_REGIONS_BY_ID[mapInfo.mapId] || '') : ''
})

const toLatLng = (loc) => {
  const mapInfo = getGameMap(loc.map)
  if (!mapInfo) return null
  const units = 4100 / mapInfo.sizeFactor
  const px = ((Number(loc.x) - 1) / units) * MAP_IMAGE_SIZE
  const py = ((Number(loc.y) - 1) / units) * MAP_IMAGE_SIZE
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null
  return [MAP_IMAGE_SIZE - py, px]
}

const focusSelectedLocations = (animate = true) => {
  if (!map || !leaflet || props.selectedMonsterId == null) return
  const points = markerLocations.value
    .map(entry => toLatLng(entry.loc))
    .filter(Boolean)
  if (!points.length) return

  const bounds = leaflet.latLngBounds(points)
  if (map.getBounds().contains(bounds)) return

  if (points.length === 1) {
    map.panTo(points[0], { animate })
    return
  }

  map.fitBounds(bounds, {
    padding: [48, 48],
    maxZoom: map.getZoom(),
    animate
  })
}

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[char]))

const isInitialLocation = (loc) => {
  const initial = props.initialLocation
  if (!initial) return false
  return initial.map === loc.map &&
    Number(initial.x) === Number(loc.x) &&
    Number(initial.y) === Number(loc.y)
}

const clearLayers = () => {
  if (imageLayer && map) {
    map.removeLayer(imageLayer)
    imageLayer = null
  }
  if (gridLayer && map) {
    map.removeLayer(gridLayer)
    gridLayer = null
  }
  if (aetheryteLayer && map) {
    map.removeLayer(aetheryteLayer)
    aetheryteLayer = null
  }
  if (markerLayer && map) {
    map.removeLayer(markerLayer)
    markerLayer = null
  }
}

const buildGridLayer = (mapInfo) => {
  if (!leaflet || !map) return
  if (gridLayer) {
    map.removeLayer(gridLayer)
    gridLayer = null
  }

  gridLayer = leaflet.layerGroup()
  const units = 4100 / mapInfo.sizeFactor
  const maxCoord = Math.ceil(units + 1)
  const pxFor = (coord) => ((coord - 1) / units) * MAP_IMAGE_SIZE

  for (let coord = 1; coord <= maxCoord; coord++) {
    const px = pxFor(coord)
    if (px < 0 || px > MAP_IMAGE_SIZE) continue
    const major = coord % 5 === 0
    const style = {
      color: '#3f3220',
      weight: major ? 1 : 0.5,
      opacity: major ? 0.32 : 0.12,
      interactive: false
    }
    leaflet.polyline([[0, px], [MAP_IMAGE_SIZE, px]], style).addTo(gridLayer)
    leaflet.polyline([[MAP_IMAGE_SIZE - px, 0], [MAP_IMAGE_SIZE - px, MAP_IMAGE_SIZE]], style).addTo(gridLayer)
  }

  gridLayer.addTo(map)
}

const updateRulers = () => {
  if (!map) return
  const mapInfo = getGameMap(selectedMap.value)
  if (!mapInfo) {
    topRuler.value = []
    leftRuler.value = []
    return
  }

  const size = map.getSize()
  const units = 4100 / mapInfo.sizeFactor
  const step = 64
  const top = []
  const left = []

  for (let pos = 34; pos <= size.x - 12; pos += step) {
    const lng = map.containerPointToLatLng([pos, 0]).lng
    const value = (lng / MAP_IMAGE_SIZE) * units + 1
    top.push({ key: `x-${pos}`, pos, text: Math.round(value) })
  }

  for (let pos = 26; pos <= size.y - 12; pos += step) {
    const lat = map.containerPointToLatLng([0, pos]).lat
    const value = ((MAP_IMAGE_SIZE - lat) / MAP_IMAGE_SIZE) * units + 1
    left.push({ key: `y-${pos}`, pos, text: Math.round(value) })
  }

  topRuler.value = top
  leftRuler.value = left
}

const applyMapView = () => {
  if (!map) return
  const size = map.getSize()
  if (!size.x || !size.y) return

  const containZoom = Math.floor((Math.log(Math.min(size.x, size.y) / MAP_IMAGE_SIZE) / Math.LN2) * 4) / 4
  const coverZoom = Math.ceil((Math.log(Math.max(size.x, size.y) / MAP_IMAGE_SIZE) / Math.LN2) * 4) / 4
  const targetZoom = props.viewMode === 'contain' ? containZoom : coverZoom
  const minZoom = Math.min(1, Math.max(-3, targetZoom))
  map.setMinZoom(minZoom)
  map.setMaxBounds([[0, 0], [MAP_IMAGE_SIZE, MAP_IMAGE_SIZE]])
  if (map.getZoom() < minZoom) {
    map.setView([MAP_IMAGE_SIZE / 2, MAP_IMAGE_SIZE / 2], minZoom, { animate: false })
  }
  updateRulers()
}

const fitWholeMap = () => {
  if (!map) return
  map.fitBounds([[0, 0], [MAP_IMAGE_SIZE, MAP_IMAGE_SIZE]], {
    padding: [0, 0],
    animate: false
  })
}

const handleMapMouseMove = (event) => {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  if (now - cursorUpdateAt < 80) return
  cursorUpdateAt = now

  const { lat, lng } = event.latlng
  if (lat < 0 || lat > MAP_IMAGE_SIZE || lng < 0 || lng > MAP_IMAGE_SIZE) {
    cursorCoords.value = { x: null, y: null }
    return
  }
  const mapInfo = getGameMap(selectedMap.value)
  if (!mapInfo) return
  const units = 4100 / mapInfo.sizeFactor
  const x = (lng / MAP_IMAGE_SIZE) * units + 1
  const y = ((MAP_IMAGE_SIZE - lat) / MAP_IMAGE_SIZE) * units + 1
  cursorCoords.value = { x: x.toFixed(2), y: y.toFixed(2) }
}

const handleMapMouseOut = () => {
  cursorUpdateAt = 0
  cursorCoords.value = { x: null, y: null }
}

const scheduleRulers = () => {
  if (rulerFrame) return
  rulerFrame = requestAnimationFrame(() => {
    rulerFrame = null
    updateRulers()
  })
}

const buildMarkerLayer = () => {
  if (!leaflet || !map) return
  if (markerLayer) {
    map.removeLayer(markerLayer)
    markerLayer = null
  }

  markerLayer = leaflet.layerGroup()

  if (props.coloredMarkers && !markerRenderer) {
    markerRenderer = leaflet.canvas({ padding: 0.5 })
  }

  const mapInfo = getGameMap(selectedMap.value)
  const units = mapInfo ? 4100 / mapInfo.sizeFactor : 41
  const pxPerUnit = MAP_IMAGE_SIZE / units
  const groupedMarkers = new Map()

  markerLocations.value.forEach(entry => {
    const loc = entry.loc
    const key = `${loc.map}:${Math.round(Number(loc.x) * 2)}:${Math.round(Number(loc.y) * 2)}`
    if (!groupedMarkers.has(key)) groupedMarkers.set(key, [])
    groupedMarkers.get(key).push(entry)
  })

  const offsetByEntry = new Map()
  if (props.coloredMarkers) {
    groupedMarkers.forEach(group => {
      if (group.length < 2) return
      const count = group.length
      const radiusPx = pxPerUnit * (0.28 + 0.06 * Math.min(count - 1, 5))
      group.forEach((entry, index) => {
        const angle = (Math.PI * 2 * index) / count - Math.PI / 2
        offsetByEntry.set(entry, {
          dx: Math.cos(angle) * radiusPx,
          dy: Math.sin(angle) * radiusPx
        })
      })
    })
  }

  markerLocations.value.forEach(entry => {
    const { monster, loc } = entry
    const baseLatLng = toLatLng(loc)
    if (!baseLatLng) return
    const offset = offsetByEntry.get(entry)
    const latlng = offset
      ? [baseLatLng[0] - offset.dy, baseLatLng[1] + offset.dx]
      : baseLatLng
    const initial = isInitialLocation(loc)
    const emphasized = initial || (Array.isArray(props.monsters) && props.selectedMonsterId != null)
    const name = monster?.name || '未知怪物'
    const marker = leaflet.circleMarker(latlng, {
      renderer: props.coloredMarkers ? markerRenderer : undefined,
      radius: emphasized ? 6 : (props.coloredMarkers ? 5 : 4.5),
      color: '#e2e8f0',
      weight: emphasized ? 1.5 : 1.2,
      opacity: 0.95,
      fillColor: props.coloredMarkers ? getMonsterExplorerColor(monster) : '#1e3a8a',
      fillOpacity: 1
    })
    marker.bindPopup(
      `<div style="font-size:12px;font-weight:900;line-height:1.4;">${escapeHtml(name)}</div>` +
      `<div style="font-size:11px;opacity:.8;">${escapeHtml(loc.map)} · X:${escapeHtml(loc.x)} Y:${escapeHtml(loc.y)}</div>`
    )
    marker.bindTooltip(
      `${escapeHtml(name)} X:${escapeHtml(loc.x)} Y:${escapeHtml(loc.y)}`,
      {
        direction: 'top',
        offset: [0, -6],
        opacity: 1,
        className: 'game-map-tooltip'
      }
    )
    marker.on('click', () => {
      if (Array.isArray(props.monsters)) {
        emit('select-monster', monster)
      } else {
        emit('select-location', loc)
      }
    })
    marker.addTo(markerLayer)

    if (props.coloredMarkers && props.selectedMonsterId != null) {
      const pulse = leaflet.marker(latlng, {
        icon: leaflet.divIcon({
          className: 'game-selected-pulse-wrap',
          html: '<span class="game-selected-pulse"></span>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        }),
        interactive: false,
        keyboard: false,
        zIndexOffset: 1000
      })
      pulse.addTo(markerLayer)
    }
  })

  markerLayer.addTo(map)
}

const renderMap = async () => {
  if (!leaflet || !map) return
  const mapInfo = getGameMap(selectedMap.value)

  if (!mapInfo) {
    mapError.value = true
    renderedMapId = ''
    if (currentActiveMapId) {
      releaseActiveMap(currentActiveMapId)
      currentActiveMapId = ''
    }
    return
  }

  // 同一張地圖只重建標記，避免重複建立圖片圖層與解碼
  if (renderedMapId === mapInfo.mapId && imageLayer) {
    mapError.value = false
    buildMarkerLayer()
    updateRulers()
    return
  }

  if (currentActiveMapId && currentActiveMapId !== mapInfo.mapId) {
    releaseActiveMap(currentActiveMapId)
    currentActiveMapId = ''
  }
  if (!currentActiveMapId) {
    currentActiveMapId = mapInfo.mapId
    acquireActiveMap(mapInfo.mapId)
  }

  const token = ++renderToken
  clearLayers()
  mapError.value = false
  renderedMapId = ''

  mapLoading.value = !mapImageCache.has(mapInfo.mapId)
  const imageUrl = await loadMapImage(mapInfo)
  if (token !== renderToken || isDestroyed || !leaflet || !map) return

  if (!imageUrl) {
    mapLoading.value = false
    mapError.value = true
    if (currentActiveMapId) {
      releaseActiveMap(currentActiveMapId)
      currentActiveMapId = ''
    }
    return
  }

  const bounds = [[0, 0], [MAP_IMAGE_SIZE, MAP_IMAGE_SIZE]]
  imageLayer = leaflet.imageOverlay(imageUrl, bounds, { className: 'game-map-image' })
  imageLayer.addTo(map)

  cursorCoords.value = { x: null, y: null }
  buildGridLayer(mapInfo)

  aetheryteLayer = leaflet.layerGroup()
  const aetherytes = AETHERYTES_BY_MAP[mapInfo.mapId] || []
  const aetheryteIcon = aetherytes.length ? await loadAetheryteIcon() : null
  if (token !== renderToken || isDestroyed || !leaflet || !map) return
  aetherytes.forEach(a => {
    const marker = leaflet.marker([MAP_IMAGE_SIZE - a.y, a.x], {
      icon: leaflet.divIcon({
        className: 'game-aetheryte-wrap',
        html: aetheryteIcon
          ? `<img class="game-aetheryte-icon" src="${aetheryteIcon}" alt="" draggable="false" />`
          : `<div class="game-aetheryte">${AETHERYTE_FALLBACK_ICON}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      }),
      zIndexOffset: -100,
      keyboard: false
    })
    marker.bindPopup(
      `<div style="font-size:10px;opacity:.65;letter-spacing:.08em;">傳送水晶</div>` +
      `<div style="font-size:12px;font-weight:900;">${escapeHtml(a.name)}</div>`
    )
    marker.bindTooltip(escapeHtml(a.name), {
      direction: 'top',
      offset: [0, -12],
      className: 'game-map-tooltip'
    })
    marker.addTo(aetheryteLayer)
  })
  aetheryteLayer.addTo(map)

  buildMarkerLayer()
  applyMapView()
  fitWholeMap()
  updateRulers()
  focusSelectedLocations(false)

  renderedMapId = mapInfo.mapId
  mapLoading.value = false
}

const syncSelectedMap = () => {
  const initialMap = props.initialLocation?.map
  const next = availableMaps.value.includes(initialMap)
    ? initialMap
    : (availableMaps.value[0] || '')
  if (next !== selectedMap.value) {
    selectedMap.value = next
  }
}

onMounted(async () => {
  syncSelectedMap()
  await nextTick()
  if (!mapEl.value) return

  const module = await import('leaflet')
  if (isDestroyed || !mapEl.value) return
  leaflet = module.default || module

  map = leaflet.map(mapEl.value, {
    crs: leaflet.CRS.Simple,
    minZoom: -3,
    maxZoom: 1,
    zoomSnap: 0.25,
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false,
    attributionControl: false,
    maxBoundsViscosity: 1,
    zoomControl: true
  })
  map.setView([MAP_IMAGE_SIZE / 2, MAP_IMAGE_SIZE / 2], -2, { animate: false })
  map.attributionControl?.addAttribution('© SQUARE ENIX')
  map.on('mousemove', handleMapMouseMove)
  map.on('mouseout', handleMapMouseOut)
  map.on('move zoom resize', scheduleRulers)
  renderMap()
  resizeObserver = new ResizeObserver(() => {
    if (!map) return
    map.invalidateSize()
    const wasAtMinZoom = map.getZoom() <= map.getMinZoom() + 0.01
    applyMapView()
    if (props.viewMode === 'contain' && wasAtMinZoom) {
      fitWholeMap()
    }
    updateRulers()
  })
  resizeObserver.observe(mapEl.value)
  setTimeout(() => map?.invalidateSize(), 0)
})

watch(selectedMap, () => {
  renderMap()
})

watch(availableMaps, () => {
  syncSelectedMap()
  if (!availableMaps.value.length) {
    clearLayers()
    mapError.value = true
    renderedMapId = ''
    if (currentActiveMapId) {
      releaseActiveMap(currentActiveMapId)
      currentActiveMapId = ''
    }
  } else {
    renderMap()
  }
}, { deep: true })

watch(() => props.initialLocation, () => {
  syncSelectedMap()
  if (map && selectedMap.value === props.initialLocation?.map) {
    buildMarkerLayer()
  }
}, { deep: true })

watch(() => props.selectedMonsterId, () => {
  if (!map) return
  buildMarkerLayer()
  focusSelectedLocations()
})

watch(() => props.viewMode, () => {
  if (!map) return
  applyMapView()
  fitWholeMap()
  focusSelectedLocations(false)
  updateRulers()
})

watch(() => props.monsters, () => {
  if (!map) return
  syncSelectedMap()
  buildMarkerLayer()
}, { deep: true })

defineExpose({
  fitWholeMap,
  focusSelectedLocations
})

onBeforeUnmount(() => {
  isDestroyed = true
  renderToken++
  if (rulerFrame) {
    cancelAnimationFrame(rulerFrame)
    rulerFrame = null
  }
  resizeObserver?.disconnect()
  resizeObserver = null
  renderedMapId = ''
  if (currentActiveMapId) {
    releaseActiveMap(currentActiveMapId)
    currentActiveMapId = ''
  }
  if (map) {
    map.remove()
    map = null
  }
  markerRenderer = null
  imageLayer = null
  gridLayer = null
  markerLayer = null
  aetheryteLayer = null
  for (const entry of mapImageCache.values()) {
    URL.revokeObjectURL(entry.url)
  }
  mapImageCache.clear()
  mapImageCacheBytes = 0
  mapImagePending.clear()
  if (aetheryteIconUrl) {
    URL.revokeObjectURL(aetheryteIconUrl)
    aetheryteIconUrl = null
  }
  aetheryteIconPending = null
})
</script>

<style scoped>
.game-ruler-label {
  position: absolute;
  font-size: 9px;
  line-height: 1;
  font-weight: 800;
  color: #fcd34d;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  white-space: nowrap;
}

.game-ruler-label-top {
  bottom: 4px;
  transform: translateX(-50%);
}

.game-ruler-label-left {
  left: 4px;
  transform: translateY(-50%);
}

:deep(.leaflet-container) {
  background: #c9b88f;
  font-family: inherit;
  cursor: crosshair !important;
}

:deep(.leaflet-container.leaflet-dragging) {
  cursor: grabbing !important;
}

:deep(.leaflet-control-zoom) {
  border: 1px solid rgba(251, 191, 36, 0.25) !important;
  border-radius: 8px !important;
  overflow: hidden;
}

:deep(.leaflet-control-zoom a) {
  background: #141f33;
  color: #fcd34d;
  border-color: #2c3d5a;
}

:deep(.leaflet-control-zoom a:hover) {
  background: #243553;
}

:deep(.leaflet-popup-content-wrapper),
:deep(.leaflet-popup-tip) {
  background: #141f33;
  color: #dbe4f3;
  border: 1px solid #2c3d5a;
}

:deep(.leaflet-popup-content) {
  margin: 10px 12px;
}

:deep(.game-aetheryte-wrap) {
  background: transparent;
  border: 0;
}

:deep(.game-aetheryte) {
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  border: 2px solid #e0f2fe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0f9ff;
  background: radial-gradient(circle at 30% 25%, #7dd3fc, #0369a1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}

:deep(.game-aetheryte svg) {
  width: 13px;
  height: 13px;
}

:deep(.game-aetheryte-icon) {
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.65));
}

:deep(.game-map-tooltip) {
  background: #141f33;
  color: #dbe4f3;
  border: 1px solid #2c3d5a;
  border-radius: 6px;
  padding: 3px 7px;
  font-size: 10px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
}

:deep(.game-map-tooltip.leaflet-tooltip-top:before) {
  border-top-color: #2c3d5a;
}

:deep(.game-selected-pulse-wrap) {
  background: transparent;
  border: 0;
  pointer-events: none;
}

:deep(.game-selected-pulse) {
  display: block;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.35);
  animation: game-selected-pulse 1.5s ease-out infinite;
}

@keyframes game-selected-pulse {
  0% {
    transform: scale(0.35);
    opacity: 1;
  }
  70% {
    transform: scale(1.15);
    opacity: 0.55;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}
</style>
