import type { Exports } from 'ipma-weather-js'

export type IPMAWeatherClient = InstanceType<Exports['IPMAWeatherClient']>
export type JSLocation = ReturnType<Exports['JSLocation']['init']>
export type JSDistrict = ReturnType<Exports['JSDistrict']['init']>
export type JSWeatherWarning = ReturnType<Exports['JSWeatherWarning']['init']>
export type JSAggregateForecastDay = ReturnType<Exports['JSAggregateForecastDay']['init']>
export type JSHourlyForecastPeriod = ReturnType<Exports['JSHourlyForecastPeriod']['init']>
export type JSStationObservationFeature = ReturnType<Exports['JSStationObservationFeature']['init']>
export type JSLookupDescription = ReturnType<Exports['JSLookupDescription']['init']>
