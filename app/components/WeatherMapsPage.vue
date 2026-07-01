<script setup lang="ts">
import type { WarningLevel } from '~/utils/colors'
import '~/assets/css/weather-maps-page.css'

const {
  activeFocusHeight,
  activeLayer,
  activeLayerDef,
  bootstrapped,
  c,
  closeDistrict,
  districtMapExpanded,
  districtMapToggleLabel,
  FIRE,
  focus,
  focusedDistrictLabel,
  focusedDistrictWarning,
  focusedLocations,
  forecastData,
  groupLabel,
  handlePick,
  iconSvg,
  isCapitalLoc,
  isNowDaytime,
  lang,
  latestObservation,
  layerDefs,
  legendTextColor,
  levelColor,
  locationData,
  locationHref,
  locationRegion,
  openDistrict,
  primaryHeight,
  setLayer,
  t,
  warningsSummary,
} = useWeatherMapsPage()

useSeoMeta({ title: 'Weather maps - MET·PT' })
</script>

<template>
  <div v-if="!bootstrapped" class="maps-loading">
    Loading...
  </div>

  <div v-else class="maps-page">
    <header class="maps-hero">
      <div>
        <p class="maps-eyebrow">{{ t.national }}</p>
        <h1>{{ t.weatherMaps }}</h1>
      </div>
      <div class="maps-updated">
        <span>{{ t.updated }}</span>
        <strong>{{ latestObservation }}</strong>
      </div>
    </header>

    <nav class="layer-tabs" aria-label="Weather map layers">
      <button
        v-for="def in layerDefs"
        :key="def.id"
        class="layer-tab"
        :class="{ 'layer-tab--active': activeLayer === def.id }"
        :style="{ '--tab-accent': c.primary, '--tab-soft': c.soft }"
        type="button"
        @click="setLayer(def.id)"
      >
        <span class="layer-tab__swatch" :style="{ background: def.swatchColor }"></span>
        {{ def.label }}
      </button>
    </nav>

    <section v-if="!focus" class="atlas-grid">
      <article class="primary-map-panel">
        <div class="panel-heading">
          <h2>{{ activeLayerDef.label }}</h2>
          <p>{{ t.mapPrimaryHint }}</p>
        </div>

        <div class="map-frame map-frame--national">
          <WeatherMap
            :layer="activeLayer"
            :focus="null"
            :height="primaryHeight"
            :forecast-data="forecastData"
            :fire-data="FIRE"
            @pick="handlePick"
          />
        </div>

        <div class="legend">
          <div class="legend__title">{{ activeLayerDef.legendTitle }}</div>
          <div class="legend__bar">
            <span
              v-for="(stop, index) in activeLayerDef.legendStops"
              :key="stop.label"
              :style="{ background: stop.color, color: legendTextColor(index) }"
            >{{ stop.label }}</span>
          </div>
        </div>
      </article>

      <section class="warnings-panel warnings-panel--national">
        <h2>{{ t.activeWarnings }}</h2>
        <div v-if="warningsSummary.length" class="warnings-list warnings-list--national">
          <button
            v-for="warning in warningsSummary.slice(0, 6)"
            :key="warning.name"
            class="warning-row"
            type="button"
            @click="openDistrict(warning.name, warning.group)"
          >
            <span class="warning-row__dot" :style="{ background: warning.color }"></span>
            <span class="warning-row__area">
              <strong>{{ warning.name }}</strong>
            </span>
            <small>{{ warning.type }}</small>
            <span class="warning-row__arrow">›</span>
          </button>
        </div>
        <p v-else class="empty-copy">
          {{ t.noActiveWarnings }}
        </p>
      </section>
    </section>

    <section v-else class="district-view">
      <button class="back-button" type="button" @click="closeDistrict">
        <span>‹</span>
        {{ t.weatherMaps }}
      </button>

      <header class="district-header">
        <div>
          <p class="maps-eyebrow">{{ groupLabel(focus.group) }}</p>
          <h1>{{ focusedDistrictLabel }}</h1>
        </div>
        <p>{{ focusedLocations.length }} {{ lang === 'pt' ? 'locais' : 'locations' }}</p>
      </header>

      <div class="district-grid" :class="{ 'district-grid--expanded': districtMapExpanded }">
        <article class="district-map-panel">
          <div class="map-frame map-frame--focus" :class="{ 'map-frame--expanded': districtMapExpanded }">
            <button
              class="map-expand-button"
              type="button"
              :aria-pressed="districtMapExpanded"
              :aria-label="districtMapToggleLabel"
              @click="districtMapExpanded = !districtMapExpanded"
            >
              {{ districtMapToggleLabel }}
            </button>
            <WeatherMap
              :layer="activeLayer"
              :focus="focus"
              :height="activeFocusHeight"
              :forecast-data="forecastData"
              :fire-data="FIRE"
              @pick="handlePick"
            />
          </div>
        </article>

        <aside class="location-panel">
          <div class="side-section__header">
            <h2>{{ lang === 'pt' ? 'Locais' : 'Locations' }}</h2>
          </div>
          <div class="location-list">
            <NuxtLink
              v-for="loc in focusedLocations"
              :key="loc.id"
              :to="locationHref(loc.id, loc.name)"
              class="location-row"
            >
              <span class="location-row__icon">
                <img
                  v-if="locationData(loc)?.wt != null"
                  :src="iconSvg(locationData(loc)!.wt!, isNowDaytime())"
                  width="24"
                  height="24"
                  alt=""
                  style="display:block;"
                />
                <span v-else>⌁</span>
              </span>
              <span>
                <strong :style="{ fontWeight: isCapitalLoc(loc) ? 700 : 500 }">{{ loc.name }}</strong>
                <small>{{ isCapitalLoc(loc) ? (lang === 'pt' ? 'Capital de distrito' : 'District capital') : locationRegion(loc) }}</small>
              </span>
              <span
                v-if="focusedDistrictWarning"
                class="location-row__warn"
                :style="{ background: levelColor(focusedDistrictWarning.level as WarningLevel) }"
              ></span>
              <span class="location-row__temp">
                <template v-if="locationData(loc)?.tmax != null">
                  <strong :style="{ color: tempFill(locationData(loc)!.tmax!) }">{{ locationData(loc)!.tmax }}°</strong>
                  <em>/</em>
                  <small>{{ locationData(loc)!.tmin ?? '—' }}°</small>
                </template>
              </span>
              <span class="location-row__arrow">›</span>
            </NuxtLink>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>
