// NOTICE: This is auto-generated code by BridgeJS from JavaScriptKit,
// DO NOT EDIT.
//
// To update this file, just rebuild your project or run
// `swift package bridge-js`.

export interface JSLocation {
    id: number;
    name: string;
    regionID: number;
    districtID: number;
    municipalityID: number;
    warningAreaID: string;
    latitude: number;
    longitude: number;
}
export interface JSSeaLocation {
    id: number;
    name: string;
    localID: number;
    regionID: number;
    warningAreaID: string;
    latitude: number;
    longitude: number;
}
export interface JSStation {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
}
export interface JSDistrict {
    regionID: number;
    id: number;
    name: string;
}
export interface JSAggregateForecastResult {
    locationID: number;
    dataUpdate: string;
    daily: JSAggregateForecastDay[];
    periods: JSHourlyForecastPeriod[];
}
export interface JSAggregateForecastDay {
    forecastDate: string;
    tMin: number;
    tMax: number;
    precipitationProbability: number | null;
    weatherTypeID: number;
    windDirection: string;
    windGust: number | null;
    uvIndex: number | null;
    uvInterval: string | null;
    feelsLike: number | null;
    humidity: number | null;
    seaWaterTemp: number | null;
    swell: number | null;
    totalSea: number | null;
    swellDirection: string | null;
    swellPeriod: number | null;
    peakPeriod: number | null;
    precipitationIntensityClassID: number | null;
}
export interface JSHourlyForecastPeriod {
    forecastDate: string;
    periodType: number;
    tMed: number;
    humidity: number | null;
    feelsLike: number | null;
    windSpeed: number | null;
    weatherTypeID: number;
    windDirection: string;
    precipitationProbability: number | null;
    precipitationIntensityClassID: number | null;
}
export interface JSAllLocationsForecastEntry {
    locationID: number;
    precipitaProb: number | null;
    tMin: number;
    tMax: number;
    windDirection: string;
    weatherTypeID: number | null;
    windSpeedClassID: number | null;
    precipitationClassID: number | null;
    latitude: number;
    longitude: number;
}
export interface JSDailyForecastResult {
    owner: string;
    country: string;
    locationID: number;
    dataUpdate: string;
    entries: JSDailyForecastEntry[];
}
export interface JSDailyForecastEntry {
    forecastDate: string;
    tMin: number;
    tMax: number;
    precipitaProb: number | null;
    weatherTypeID: number | null;
    windDirection: string;
    windSpeedClassID: number | null;
    latitude: number;
    longitude: number;
}
export interface JSWeatherWarning {
    id: string;
    text: string;
    awarenessTypeName: string;
    warningAreaID: string;
    startTime: string;
    endTime: string;
    awarenessLevelID: string;
    level: string | null;
}
export interface JSSeaForecastEntry {
    locationID: number;
    wavePeriodMin: number | null;
    wavePeriodMax: number | null;
    waveHighMin: number | null;
    waveHighMax: number | null;
    waveDirection: string;
    totalSeaMin: number | null;
    totalSeaMax: number | null;
    sstMin: number | null;
    sstMax: number | null;
    latitude: number;
    longitude: number;
}
export interface JSSeismicEvent {
    time: string;
    location: string | null;
    latitude: string;
    longitude: string;
    magnitude: string;
    magnitudeType: string | null;
    degree: string | null;
    depth: number | null;
    dataUpdate: string;
    obsRegion: string | null;
    source: string | null;
    shakemapID: string | null;
}
export interface JSFireRiskEntry {
    dico: string;
    riskLevel: number;
    riskDescriptionPT: string;
    riskDescriptionEN: string;
    latitude: number;
    longitude: number;
}
export interface JSUVIndexEntry {
    date: string;
    locationID: number;
    uvValue: number;
    hourInterval: string;
    category: string;
    categoryDescriptionPT: string;
    categoryDescriptionEN: string;
}
export interface JSStationObservation {
    time: string;
    stationID: number;
    temperature: number | null;
    humidity: number | null;
    pressure: number | null;
    windSpeedKMH: number | null;
    windSpeedMS: number | null;
    windDirectionID: number | null;
    precipitation: number | null;
    solarRadiation: number | null;
}
export interface JSStationObservationFeature {
    type: string;
    geometry: JSStationObservationGeometry;
    properties: JSStationObservationProperties;
}
export interface JSStationObservationGeometry {
    type: string;
    coordinates: number[];
}
export interface JSStationObservationProperties {
    time: string;
    stationID: number;
    stationName: string;
    temperature: number | null;
    humidity: number | null;
    pressure: number | null;
    windSpeedKMH: number | null;
    windSpeedMS: number | null;
    windDirectionID: number | null;
    windDirectionDescription: string | null;
    precipitation: number | null;
    solarRadiation: number | null;
}
export interface JSLookupDescription {
    id: number;
    descriptionEN: string;
    descriptionPT: string;
}
export interface JSClimateDataEntry {
    date: string;
    minimum: number;
    maximum: number;
    range: number;
    mean: number;
    std: number;
}
/// Represents a Swift heap object like a class instance or an actor instance.
export interface SwiftHeapObject {
    /// Release the heap object.
    ///
    /// Note: Calling this method will release the heap object and it will no longer be accessible.
    release(): void;
}
export interface IPMAWeatherClient extends SwiftHeapObject {
    locations(): Promise<JSLocation[]>;
    seaLocations(): Promise<JSSeaLocation[]>;
    stations(): Promise<JSStation[]>;
    locationByID(id: number): Promise<JSLocation | null>;
    locationByName(name: string): Promise<JSLocation | null>;
    closestLocation(latitude: number, longitude: number): Promise<JSLocation | null>;
    closestStation(latitude: number, longitude: number): Promise<JSStation | null>;
    forecastLocations(): Promise<JSLocation[]>;
    districts(): Promise<JSDistrict[]>;
    aggregateForecast(locationID: number): Promise<JSAggregateForecastResult>;
    allLocationsForecast(day: number): Promise<JSAllLocationsForecastEntry[]>;
    dailyForecast(locationID: number): Promise<JSDailyForecastResult>;
    weatherWarnings(): Promise<JSWeatherWarning[]>;
    seaForecast(day: number): Promise<JSSeaForecastEntry[]>;
    seismicData(area: number): Promise<JSSeismicEvent[]>;
    fireRisk(day: number): Promise<JSFireRiskEntry[]>;
    uvIndex(): Promise<JSUVIndexEntry[]>;
    uvIndexForLocation(locationID: number): Promise<JSUVIndexEntry[]>;
    stationObservations(): Promise<JSStationObservation[]>;
    latestStationObservations(): Promise<JSStationObservationFeature[]>;
    weatherTypeDescriptions(): Promise<JSLookupDescription[]>;
    windSpeedClassDescriptions(): Promise<JSLookupDescription[]>;
    precipitationClassDescriptions(): Promise<JSLookupDescription[]>;
    weatherIconURL(weatherTypeID: number, timeOfDay: string, animated: boolean): string | null;
    climateEvapotranspiration(district: string, municipality: string, dico: string): Promise<JSClimateDataEntry[]>;
    climatePrecipitation(district: string, municipality: string, dico: string): Promise<JSClimateDataEntry[]>;
    climateTempMin(district: string, municipality: string, dico: string): Promise<JSClimateDataEntry[]>;
    climateTempMax(district: string, municipality: string, dico: string): Promise<JSClimateDataEntry[]>;
    climatePDSI(district: string, municipality: string, dico: string): Promise<JSClimateDataEntry[]>;
}
export type Exports = {
    IPMAWeatherClient: {
        new(): IPMAWeatherClient;
    }
    JSLocation: {
        init(id: number, name: string, regionID: number, districtID: number, municipalityID: number, warningAreaID: string, latitude: number, longitude: number): JSLocation;
    }
    JSSeaLocation: {
        init(id: number, name: string, localID: number, regionID: number, warningAreaID: string, latitude: number, longitude: number): JSSeaLocation;
    }
    JSStation: {
        init(id: number, name: string, latitude: number, longitude: number): JSStation;
    }
    JSDistrict: {
        init(regionID: number, id: number, name: string): JSDistrict;
    }
    JSAggregateForecastResult: {
        init(locationID: number, dataUpdate: string, daily: JSAggregateForecastDay[], periods: JSHourlyForecastPeriod[]): JSAggregateForecastResult;
    }
    JSAggregateForecastDay: {
        init(forecastDate: string, tMin: number, tMax: number, precipitationProbability: number | null, weatherTypeID: number, windDirection: string, windGust: number | null, uvIndex: number | null, uvInterval: string | null, feelsLike: number | null, humidity: number | null, seaWaterTemp: number | null, swell: number | null, totalSea: number | null, swellDirection: string | null, swellPeriod: number | null, peakPeriod: number | null, precipitationIntensityClassID: number | null): JSAggregateForecastDay;
    }
    JSHourlyForecastPeriod: {
        init(forecastDate: string, periodType: number, tMed: number, humidity: number | null, feelsLike: number | null, windSpeed: number | null, weatherTypeID: number, windDirection: string, precipitationProbability: number | null, precipitationIntensityClassID: number | null): JSHourlyForecastPeriod;
    }
    JSAllLocationsForecastEntry: {
        init(locationID: number, precipitaProb: number | null, tMin: number, tMax: number, windDirection: string, weatherTypeID: number | null, windSpeedClassID: number | null, precipitationClassID: number | null, latitude: number, longitude: number): JSAllLocationsForecastEntry;
    }
    JSDailyForecastResult: {
        init(owner: string, country: string, locationID: number, dataUpdate: string, entries: JSDailyForecastEntry[]): JSDailyForecastResult;
    }
    JSDailyForecastEntry: {
        init(forecastDate: string, tMin: number, tMax: number, precipitaProb: number | null, weatherTypeID: number | null, windDirection: string, windSpeedClassID: number | null, latitude: number, longitude: number): JSDailyForecastEntry;
    }
    JSWeatherWarning: {
        init(id: string, text: string, awarenessTypeName: string, warningAreaID: string, startTime: string, endTime: string, awarenessLevelID: string, level: string | null): JSWeatherWarning;
    }
    JSSeaForecastEntry: {
        init(locationID: number, wavePeriodMin: number | null, wavePeriodMax: number | null, waveHighMin: number | null, waveHighMax: number | null, waveDirection: string, totalSeaMin: number | null, totalSeaMax: number | null, sstMin: number | null, sstMax: number | null, latitude: number, longitude: number): JSSeaForecastEntry;
    }
    JSSeismicEvent: {
        init(time: string, location: string | null, latitude: string, longitude: string, magnitude: string, magnitudeType: string | null, degree: string | null, depth: number | null, dataUpdate: string, obsRegion: string | null, source: string | null, shakemapID: string | null): JSSeismicEvent;
    }
    JSFireRiskEntry: {
        init(dico: string, riskLevel: number, riskDescriptionPT: string, riskDescriptionEN: string, latitude: number, longitude: number): JSFireRiskEntry;
    }
    JSUVIndexEntry: {
        init(date: string, locationID: number, uvValue: number, hourInterval: string, category: string, categoryDescriptionPT: string, categoryDescriptionEN: string): JSUVIndexEntry;
    }
    JSStationObservation: {
        init(time: string, stationID: number, temperature: number | null, humidity: number | null, pressure: number | null, windSpeedKMH: number | null, windSpeedMS: number | null, windDirectionID: number | null, precipitation: number | null, solarRadiation: number | null): JSStationObservation;
    }
    JSStationObservationFeature: {
        init(type: string, geometry: JSStationObservationGeometry, properties: JSStationObservationProperties): JSStationObservationFeature;
    }
    JSStationObservationGeometry: {
        init(type: string, coordinates: number[]): JSStationObservationGeometry;
    }
    JSStationObservationProperties: {
        init(time: string, stationID: number, stationName: string, temperature: number | null, humidity: number | null, pressure: number | null, windSpeedKMH: number | null, windSpeedMS: number | null, windDirectionID: number | null, windDirectionDescription: string | null, precipitation: number | null, solarRadiation: number | null): JSStationObservationProperties;
    }
    JSLookupDescription: {
        init(id: number, descriptionEN: string, descriptionPT: string): JSLookupDescription;
    }
    JSClimateDataEntry: {
        init(date: string, minimum: number, maximum: number, range: number, mean: number, std: number): JSClimateDataEntry;
    }
}
export type Imports = {
}
export function createInstantiator(options: {
    imports: Imports;
}, swift: any): Promise<{
    addImports: (importObject: WebAssembly.Imports) => void;
    setInstance: (instance: WebAssembly.Instance) => void;
    createExports: (instance: WebAssembly.Instance) => Exports;
}>;