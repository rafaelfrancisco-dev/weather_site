import type { Exports } from '@rafaelfrancisco-dev/ipma-weather-js'

export type IPMAWeatherClient = InstanceType<Exports['IPMAWeatherClient']>
export type JSLocation = ReturnType<Exports['JSLocation']['init']>
export type JSDistrict = ReturnType<Exports['JSDistrict']['init']>
export type JSWeatherWarning = ReturnType<Exports['JSWeatherWarning']['init']>
export type JSAggregateForecastDay = ReturnType<Exports['JSAggregateForecastDay']['init']>
export type JSHourlyForecastPeriod = ReturnType<Exports['JSHourlyForecastPeriod']['init']>
export type JSStation = ReturnType<Exports['JSStation']['init']>
export type JSStationObservation = ReturnType<Exports['JSStationObservation']['init']>
export type JSLookupDescription = ReturnType<Exports['JSLookupDescription']['init']>
