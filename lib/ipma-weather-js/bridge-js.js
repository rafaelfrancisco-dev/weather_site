// NOTICE: This is auto-generated code by BridgeJS from JavaScriptKit,
// DO NOT EDIT.
//
// To update this file, just rebuild your project or run
// `swift package bridge-js`.

export async function createInstantiator(options, swift) {
    let instance;
    let memory;
    let setException;
    let decodeString;
    const textDecoder = new TextDecoder("utf-8");
    const textEncoder = new TextEncoder("utf-8");
    let tmpRetString;
    let tmpRetBytes;
    let tmpRetException;
    let tmpRetOptionalBool;
    let tmpRetOptionalInt;
    let tmpRetOptionalFloat;
    let tmpRetOptionalDouble;
    let tmpRetOptionalHeapObject;
    let strStack = [];
    let i32Stack = [];
    let i64Stack = [];
    let f32Stack = [];
    let f64Stack = [];
    let ptrStack = [];
    let taStack = [];
    const enumHelpers = {};
    const structHelpers = {};

    let _exports = null;
    let bjs = null;
    function __bjs_jsValueLower(value) {
        let kind;
        let payload1;
        let payload2;
        if (value === null) {
            kind = 4;
            payload1 = 0;
            payload2 = 0;
        } else {
            switch (typeof value) {
                case "boolean":
                    kind = 0;
                    payload1 = value ? 1 : 0;
                    payload2 = 0;
                    break;
                case "number":
                    kind = 2;
                    payload1 = 0;
                    payload2 = value;
                    break;
                case "string":
                    kind = 1;
                    payload1 = swift.memory.retain(value);
                    payload2 = 0;
                    break;
                case "undefined":
                    kind = 5;
                    payload1 = 0;
                    payload2 = 0;
                    break;
                case "object":
                    kind = 3;
                    payload1 = swift.memory.retain(value);
                    payload2 = 0;
                    break;
                case "function":
                    kind = 3;
                    payload1 = swift.memory.retain(value);
                    payload2 = 0;
                    break;
                case "symbol":
                    kind = 7;
                    payload1 = swift.memory.retain(value);
                    payload2 = 0;
                    break;
                case "bigint":
                    kind = 8;
                    payload1 = swift.memory.retain(value);
                    payload2 = 0;
                    break;
                default:
                    throw new TypeError("Unsupported JSValue type");
            }
        }
        return [kind, payload1, payload2];
    }
    function __bjs_jsValueLift(kind, payload1, payload2) {
        let jsValue;
        switch (kind) {
            case 0:
                jsValue = payload1 !== 0;
                break;
            case 1:
                jsValue = swift.memory.getObject(payload1);
                break;
            case 2:
                jsValue = payload2;
                break;
            case 3:
                jsValue = swift.memory.getObject(payload1);
                break;
            case 4:
                jsValue = null;
                break;
            case 5:
                jsValue = undefined;
                break;
            case 7:
                jsValue = swift.memory.getObject(payload1);
                break;
            case 8:
                jsValue = swift.memory.getObject(payload1);
                break;
            default:
                throw new TypeError("Unsupported JSValue kind " + kind);
        }
        return jsValue;
    }

    const __bjs_createJSLocationHelpers = () => ({
        lower: (value) => {
            i32Stack.push((value.id | 0));
            const bytes = textEncoder.encode(value.name);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            i32Stack.push((value.regionID | 0));
            i32Stack.push((value.districtID | 0));
            i32Stack.push((value.municipalityID | 0));
            const bytes1 = textEncoder.encode(value.warningAreaID);
            const id1 = swift.memory.retain(bytes1);
            i32Stack.push(bytes1.length);
            i32Stack.push(id1);
            f64Stack.push(value.latitude);
            f64Stack.push(value.longitude);
        },
        lift: () => {
            const f64 = f64Stack.pop();
            const f641 = f64Stack.pop();
            const string = strStack.pop();
            const int = i32Stack.pop();
            const int1 = i32Stack.pop();
            const int2 = i32Stack.pop();
            const string1 = strStack.pop();
            const int3 = i32Stack.pop();
            return { id: int3, name: string1, regionID: int2, districtID: int1, municipalityID: int, warningAreaID: string, latitude: f641, longitude: f64 };
        }
    });
    const __bjs_createJSSeaLocationHelpers = () => ({
        lower: (value) => {
            i32Stack.push((value.id | 0));
            const bytes = textEncoder.encode(value.name);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            i32Stack.push((value.localID | 0));
            i32Stack.push((value.regionID | 0));
            const bytes1 = textEncoder.encode(value.warningAreaID);
            const id1 = swift.memory.retain(bytes1);
            i32Stack.push(bytes1.length);
            i32Stack.push(id1);
            f64Stack.push(value.latitude);
            f64Stack.push(value.longitude);
        },
        lift: () => {
            const f64 = f64Stack.pop();
            const f641 = f64Stack.pop();
            const string = strStack.pop();
            const int = i32Stack.pop();
            const int1 = i32Stack.pop();
            const string1 = strStack.pop();
            const int2 = i32Stack.pop();
            return { id: int2, name: string1, localID: int1, regionID: int, warningAreaID: string, latitude: f641, longitude: f64 };
        }
    });
    const __bjs_createJSStationHelpers = () => ({
        lower: (value) => {
            i32Stack.push((value.id | 0));
            const bytes = textEncoder.encode(value.name);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            f64Stack.push(value.latitude);
            f64Stack.push(value.longitude);
        },
        lift: () => {
            const f64 = f64Stack.pop();
            const f641 = f64Stack.pop();
            const string = strStack.pop();
            const int = i32Stack.pop();
            return { id: int, name: string, latitude: f641, longitude: f64 };
        }
    });
    const __bjs_createJSDistrictHelpers = () => ({
        lower: (value) => {
            i32Stack.push((value.regionID | 0));
            i32Stack.push((value.id | 0));
            const bytes = textEncoder.encode(value.name);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
        },
        lift: () => {
            const string = strStack.pop();
            const int = i32Stack.pop();
            const int1 = i32Stack.pop();
            return { regionID: int1, id: int, name: string };
        }
    });
    const __bjs_createJSAggregateForecastResultHelpers = () => ({
        lower: (value) => {
            i32Stack.push((value.locationID | 0));
            const bytes = textEncoder.encode(value.dataUpdate);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            for (const elem of value.daily) {
                structHelpers.JSAggregateForecastDay.lower(elem);
            }
            i32Stack.push(value.daily.length);
            for (const elem1 of value.periods) {
                structHelpers.JSHourlyForecastPeriod.lower(elem1);
            }
            i32Stack.push(value.periods.length);
        },
        lift: () => {
            const arrayLen = i32Stack.pop();
            let arrayResult;
            if (arrayLen === -1) {
                arrayResult = taStack.pop();
            } else {
                arrayResult = [];
                for (let i = 0; i < arrayLen; i++) {
                    const struct = structHelpers.JSHourlyForecastPeriod.lift();
                    arrayResult.push(struct);
                }
                arrayResult.reverse();
            }
            const arrayLen1 = i32Stack.pop();
            let arrayResult1;
            if (arrayLen1 === -1) {
                arrayResult1 = taStack.pop();
            } else {
                arrayResult1 = [];
                for (let i1 = 0; i1 < arrayLen1; i1++) {
                    const struct1 = structHelpers.JSAggregateForecastDay.lift();
                    arrayResult1.push(struct1);
                }
                arrayResult1.reverse();
            }
            const string = strStack.pop();
            const int = i32Stack.pop();
            return { locationID: int, dataUpdate: string, daily: arrayResult1, periods: arrayResult };
        }
    });
    const __bjs_createJSAggregateForecastDayHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.forecastDate);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            f64Stack.push(value.tMin);
            f64Stack.push(value.tMax);
            const isSome = value.precipitationProbability != null ? 1 : 0;
            if (isSome) {
                f64Stack.push(value.precipitationProbability);
            }
            i32Stack.push(isSome);
            i32Stack.push((value.weatherTypeID | 0));
            const bytes1 = textEncoder.encode(value.windDirection);
            const id1 = swift.memory.retain(bytes1);
            i32Stack.push(bytes1.length);
            i32Stack.push(id1);
            const isSome1 = value.windGust != null ? 1 : 0;
            if (isSome1) {
                i32Stack.push((value.windGust | 0));
            }
            i32Stack.push(isSome1);
            const isSome2 = value.uvIndex != null ? 1 : 0;
            if (isSome2) {
                f64Stack.push(value.uvIndex);
            }
            i32Stack.push(isSome2);
            const isSome3 = value.uvInterval != null ? 1 : 0;
            if (isSome3) {
                const bytes2 = textEncoder.encode(value.uvInterval);
                const id2 = swift.memory.retain(bytes2);
                i32Stack.push(bytes2.length);
                i32Stack.push(id2);
            }
            i32Stack.push(isSome3);
            const isSome4 = value.feelsLike != null ? 1 : 0;
            if (isSome4) {
                f64Stack.push(value.feelsLike);
            }
            i32Stack.push(isSome4);
            const isSome5 = value.humidity != null ? 1 : 0;
            if (isSome5) {
                f64Stack.push(value.humidity);
            }
            i32Stack.push(isSome5);
            const isSome6 = value.seaWaterTemp != null ? 1 : 0;
            if (isSome6) {
                f64Stack.push(value.seaWaterTemp);
            }
            i32Stack.push(isSome6);
            const isSome7 = value.swell != null ? 1 : 0;
            if (isSome7) {
                f64Stack.push(value.swell);
            }
            i32Stack.push(isSome7);
            const isSome8 = value.totalSea != null ? 1 : 0;
            if (isSome8) {
                f64Stack.push(value.totalSea);
            }
            i32Stack.push(isSome8);
            const isSome9 = value.swellDirection != null ? 1 : 0;
            if (isSome9) {
                const bytes3 = textEncoder.encode(value.swellDirection);
                const id3 = swift.memory.retain(bytes3);
                i32Stack.push(bytes3.length);
                i32Stack.push(id3);
            }
            i32Stack.push(isSome9);
            const isSome10 = value.swellPeriod != null ? 1 : 0;
            if (isSome10) {
                f64Stack.push(value.swellPeriod);
            }
            i32Stack.push(isSome10);
            const isSome11 = value.peakPeriod != null ? 1 : 0;
            if (isSome11) {
                f64Stack.push(value.peakPeriod);
            }
            i32Stack.push(isSome11);
            const isSome12 = value.precipitationIntensityClassID != null ? 1 : 0;
            if (isSome12) {
                i32Stack.push((value.precipitationIntensityClassID | 0));
            }
            i32Stack.push(isSome12);
        },
        lift: () => {
            const isSome = i32Stack.pop();
            let optValue;
            if (isSome === 0) {
                optValue = null;
            } else {
                const int = i32Stack.pop();
                optValue = int;
            }
            const isSome1 = i32Stack.pop();
            let optValue1;
            if (isSome1 === 0) {
                optValue1 = null;
            } else {
                const f64 = f64Stack.pop();
                optValue1 = f64;
            }
            const isSome2 = i32Stack.pop();
            let optValue2;
            if (isSome2 === 0) {
                optValue2 = null;
            } else {
                const f641 = f64Stack.pop();
                optValue2 = f641;
            }
            const isSome3 = i32Stack.pop();
            let optValue3;
            if (isSome3 === 0) {
                optValue3 = null;
            } else {
                const string = strStack.pop();
                optValue3 = string;
            }
            const isSome4 = i32Stack.pop();
            let optValue4;
            if (isSome4 === 0) {
                optValue4 = null;
            } else {
                const f642 = f64Stack.pop();
                optValue4 = f642;
            }
            const isSome5 = i32Stack.pop();
            let optValue5;
            if (isSome5 === 0) {
                optValue5 = null;
            } else {
                const f643 = f64Stack.pop();
                optValue5 = f643;
            }
            const isSome6 = i32Stack.pop();
            let optValue6;
            if (isSome6 === 0) {
                optValue6 = null;
            } else {
                const f644 = f64Stack.pop();
                optValue6 = f644;
            }
            const isSome7 = i32Stack.pop();
            let optValue7;
            if (isSome7 === 0) {
                optValue7 = null;
            } else {
                const f645 = f64Stack.pop();
                optValue7 = f645;
            }
            const isSome8 = i32Stack.pop();
            let optValue8;
            if (isSome8 === 0) {
                optValue8 = null;
            } else {
                const f646 = f64Stack.pop();
                optValue8 = f646;
            }
            const isSome9 = i32Stack.pop();
            let optValue9;
            if (isSome9 === 0) {
                optValue9 = null;
            } else {
                const string1 = strStack.pop();
                optValue9 = string1;
            }
            const isSome10 = i32Stack.pop();
            let optValue10;
            if (isSome10 === 0) {
                optValue10 = null;
            } else {
                const f647 = f64Stack.pop();
                optValue10 = f647;
            }
            const isSome11 = i32Stack.pop();
            let optValue11;
            if (isSome11 === 0) {
                optValue11 = null;
            } else {
                const int1 = i32Stack.pop();
                optValue11 = int1;
            }
            const string2 = strStack.pop();
            const int2 = i32Stack.pop();
            const isSome12 = i32Stack.pop();
            let optValue12;
            if (isSome12 === 0) {
                optValue12 = null;
            } else {
                const f648 = f64Stack.pop();
                optValue12 = f648;
            }
            const f649 = f64Stack.pop();
            const f6410 = f64Stack.pop();
            const string3 = strStack.pop();
            return { forecastDate: string3, tMin: f6410, tMax: f649, precipitationProbability: optValue12, weatherTypeID: int2, windDirection: string2, windGust: optValue11, uvIndex: optValue10, uvInterval: optValue9, feelsLike: optValue8, humidity: optValue7, seaWaterTemp: optValue6, swell: optValue5, totalSea: optValue4, swellDirection: optValue3, swellPeriod: optValue2, peakPeriod: optValue1, precipitationIntensityClassID: optValue };
        }
    });
    const __bjs_createJSHourlyForecastPeriodHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.forecastDate);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            i32Stack.push((value.periodType | 0));
            f64Stack.push(value.tMed);
            const isSome = value.humidity != null ? 1 : 0;
            if (isSome) {
                f64Stack.push(value.humidity);
            }
            i32Stack.push(isSome);
            const isSome1 = value.feelsLike != null ? 1 : 0;
            if (isSome1) {
                f64Stack.push(value.feelsLike);
            }
            i32Stack.push(isSome1);
            const isSome2 = value.windSpeed != null ? 1 : 0;
            if (isSome2) {
                f64Stack.push(value.windSpeed);
            }
            i32Stack.push(isSome2);
            i32Stack.push((value.weatherTypeID | 0));
            const bytes1 = textEncoder.encode(value.windDirection);
            const id1 = swift.memory.retain(bytes1);
            i32Stack.push(bytes1.length);
            i32Stack.push(id1);
            const isSome3 = value.precipitationProbability != null ? 1 : 0;
            if (isSome3) {
                f64Stack.push(value.precipitationProbability);
            }
            i32Stack.push(isSome3);
            const isSome4 = value.precipitationIntensityClassID != null ? 1 : 0;
            if (isSome4) {
                i32Stack.push((value.precipitationIntensityClassID | 0));
            }
            i32Stack.push(isSome4);
        },
        lift: () => {
            const isSome = i32Stack.pop();
            let optValue;
            if (isSome === 0) {
                optValue = null;
            } else {
                const int = i32Stack.pop();
                optValue = int;
            }
            const isSome1 = i32Stack.pop();
            let optValue1;
            if (isSome1 === 0) {
                optValue1 = null;
            } else {
                const f64 = f64Stack.pop();
                optValue1 = f64;
            }
            const string = strStack.pop();
            const int1 = i32Stack.pop();
            const isSome2 = i32Stack.pop();
            let optValue2;
            if (isSome2 === 0) {
                optValue2 = null;
            } else {
                const f641 = f64Stack.pop();
                optValue2 = f641;
            }
            const isSome3 = i32Stack.pop();
            let optValue3;
            if (isSome3 === 0) {
                optValue3 = null;
            } else {
                const f642 = f64Stack.pop();
                optValue3 = f642;
            }
            const isSome4 = i32Stack.pop();
            let optValue4;
            if (isSome4 === 0) {
                optValue4 = null;
            } else {
                const f643 = f64Stack.pop();
                optValue4 = f643;
            }
            const f644 = f64Stack.pop();
            const int2 = i32Stack.pop();
            const string1 = strStack.pop();
            return { forecastDate: string1, periodType: int2, tMed: f644, humidity: optValue4, feelsLike: optValue3, windSpeed: optValue2, weatherTypeID: int1, windDirection: string, precipitationProbability: optValue1, precipitationIntensityClassID: optValue };
        }
    });
    const __bjs_createJSAllLocationsForecastEntryHelpers = () => ({
        lower: (value) => {
            i32Stack.push((value.locationID | 0));
            const isSome = value.precipitaProb != null ? 1 : 0;
            if (isSome) {
                f64Stack.push(value.precipitaProb);
            }
            i32Stack.push(isSome);
            f64Stack.push(value.tMin);
            f64Stack.push(value.tMax);
            const bytes = textEncoder.encode(value.windDirection);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            const isSome1 = value.weatherTypeID != null ? 1 : 0;
            if (isSome1) {
                i32Stack.push((value.weatherTypeID | 0));
            }
            i32Stack.push(isSome1);
            const isSome2 = value.windSpeedClassID != null ? 1 : 0;
            if (isSome2) {
                i32Stack.push((value.windSpeedClassID | 0));
            }
            i32Stack.push(isSome2);
            const isSome3 = value.precipitationClassID != null ? 1 : 0;
            if (isSome3) {
                i32Stack.push((value.precipitationClassID | 0));
            }
            i32Stack.push(isSome3);
            f64Stack.push(value.latitude);
            f64Stack.push(value.longitude);
        },
        lift: () => {
            const f64 = f64Stack.pop();
            const f641 = f64Stack.pop();
            const isSome = i32Stack.pop();
            let optValue;
            if (isSome === 0) {
                optValue = null;
            } else {
                const int = i32Stack.pop();
                optValue = int;
            }
            const isSome1 = i32Stack.pop();
            let optValue1;
            if (isSome1 === 0) {
                optValue1 = null;
            } else {
                const int1 = i32Stack.pop();
                optValue1 = int1;
            }
            const isSome2 = i32Stack.pop();
            let optValue2;
            if (isSome2 === 0) {
                optValue2 = null;
            } else {
                const int2 = i32Stack.pop();
                optValue2 = int2;
            }
            const string = strStack.pop();
            const f642 = f64Stack.pop();
            const f643 = f64Stack.pop();
            const isSome3 = i32Stack.pop();
            let optValue3;
            if (isSome3 === 0) {
                optValue3 = null;
            } else {
                const f644 = f64Stack.pop();
                optValue3 = f644;
            }
            const int3 = i32Stack.pop();
            return { locationID: int3, precipitaProb: optValue3, tMin: f643, tMax: f642, windDirection: string, weatherTypeID: optValue2, windSpeedClassID: optValue1, precipitationClassID: optValue, latitude: f641, longitude: f64 };
        }
    });
    const __bjs_createJSDailyForecastResultHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.owner);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            const bytes1 = textEncoder.encode(value.country);
            const id1 = swift.memory.retain(bytes1);
            i32Stack.push(bytes1.length);
            i32Stack.push(id1);
            i32Stack.push((value.locationID | 0));
            const bytes2 = textEncoder.encode(value.dataUpdate);
            const id2 = swift.memory.retain(bytes2);
            i32Stack.push(bytes2.length);
            i32Stack.push(id2);
            for (const elem of value.entries) {
                structHelpers.JSDailyForecastEntry.lower(elem);
            }
            i32Stack.push(value.entries.length);
        },
        lift: () => {
            const arrayLen = i32Stack.pop();
            let arrayResult;
            if (arrayLen === -1) {
                arrayResult = taStack.pop();
            } else {
                arrayResult = [];
                for (let i = 0; i < arrayLen; i++) {
                    const struct = structHelpers.JSDailyForecastEntry.lift();
                    arrayResult.push(struct);
                }
                arrayResult.reverse();
            }
            const string = strStack.pop();
            const int = i32Stack.pop();
            const string1 = strStack.pop();
            const string2 = strStack.pop();
            return { owner: string2, country: string1, locationID: int, dataUpdate: string, entries: arrayResult };
        }
    });
    const __bjs_createJSDailyForecastEntryHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.forecastDate);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            f64Stack.push(value.tMin);
            f64Stack.push(value.tMax);
            const isSome = value.precipitaProb != null ? 1 : 0;
            if (isSome) {
                f64Stack.push(value.precipitaProb);
            }
            i32Stack.push(isSome);
            const isSome1 = value.weatherTypeID != null ? 1 : 0;
            if (isSome1) {
                i32Stack.push((value.weatherTypeID | 0));
            }
            i32Stack.push(isSome1);
            const bytes1 = textEncoder.encode(value.windDirection);
            const id1 = swift.memory.retain(bytes1);
            i32Stack.push(bytes1.length);
            i32Stack.push(id1);
            const isSome2 = value.windSpeedClassID != null ? 1 : 0;
            if (isSome2) {
                i32Stack.push((value.windSpeedClassID | 0));
            }
            i32Stack.push(isSome2);
            f64Stack.push(value.latitude);
            f64Stack.push(value.longitude);
        },
        lift: () => {
            const f64 = f64Stack.pop();
            const f641 = f64Stack.pop();
            const isSome = i32Stack.pop();
            let optValue;
            if (isSome === 0) {
                optValue = null;
            } else {
                const int = i32Stack.pop();
                optValue = int;
            }
            const string = strStack.pop();
            const isSome1 = i32Stack.pop();
            let optValue1;
            if (isSome1 === 0) {
                optValue1 = null;
            } else {
                const int1 = i32Stack.pop();
                optValue1 = int1;
            }
            const isSome2 = i32Stack.pop();
            let optValue2;
            if (isSome2 === 0) {
                optValue2 = null;
            } else {
                const f642 = f64Stack.pop();
                optValue2 = f642;
            }
            const f643 = f64Stack.pop();
            const f644 = f64Stack.pop();
            const string1 = strStack.pop();
            return { forecastDate: string1, tMin: f644, tMax: f643, precipitaProb: optValue2, weatherTypeID: optValue1, windDirection: string, windSpeedClassID: optValue, latitude: f641, longitude: f64 };
        }
    });
    const __bjs_createJSWeatherWarningHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.id);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            const bytes1 = textEncoder.encode(value.text);
            const id1 = swift.memory.retain(bytes1);
            i32Stack.push(bytes1.length);
            i32Stack.push(id1);
            const bytes2 = textEncoder.encode(value.awarenessTypeName);
            const id2 = swift.memory.retain(bytes2);
            i32Stack.push(bytes2.length);
            i32Stack.push(id2);
            const bytes3 = textEncoder.encode(value.warningAreaID);
            const id3 = swift.memory.retain(bytes3);
            i32Stack.push(bytes3.length);
            i32Stack.push(id3);
            const bytes4 = textEncoder.encode(value.startTime);
            const id4 = swift.memory.retain(bytes4);
            i32Stack.push(bytes4.length);
            i32Stack.push(id4);
            const bytes5 = textEncoder.encode(value.endTime);
            const id5 = swift.memory.retain(bytes5);
            i32Stack.push(bytes5.length);
            i32Stack.push(id5);
            const bytes6 = textEncoder.encode(value.awarenessLevelID);
            const id6 = swift.memory.retain(bytes6);
            i32Stack.push(bytes6.length);
            i32Stack.push(id6);
            const isSome = value.level != null ? 1 : 0;
            if (isSome) {
                const bytes7 = textEncoder.encode(value.level);
                const id7 = swift.memory.retain(bytes7);
                i32Stack.push(bytes7.length);
                i32Stack.push(id7);
            }
            i32Stack.push(isSome);
        },
        lift: () => {
            const isSome = i32Stack.pop();
            let optValue;
            if (isSome === 0) {
                optValue = null;
            } else {
                const string = strStack.pop();
                optValue = string;
            }
            const string1 = strStack.pop();
            const string2 = strStack.pop();
            const string3 = strStack.pop();
            const string4 = strStack.pop();
            const string5 = strStack.pop();
            const string6 = strStack.pop();
            const string7 = strStack.pop();
            return { id: string7, text: string6, awarenessTypeName: string5, warningAreaID: string4, startTime: string3, endTime: string2, awarenessLevelID: string1, level: optValue };
        }
    });
    const __bjs_createJSSeaForecastEntryHelpers = () => ({
        lower: (value) => {
            i32Stack.push((value.locationID | 0));
            const isSome = value.wavePeriodMin != null ? 1 : 0;
            if (isSome) {
                f64Stack.push(value.wavePeriodMin);
            }
            i32Stack.push(isSome);
            const isSome1 = value.wavePeriodMax != null ? 1 : 0;
            if (isSome1) {
                f64Stack.push(value.wavePeriodMax);
            }
            i32Stack.push(isSome1);
            const isSome2 = value.waveHighMin != null ? 1 : 0;
            if (isSome2) {
                f64Stack.push(value.waveHighMin);
            }
            i32Stack.push(isSome2);
            const isSome3 = value.waveHighMax != null ? 1 : 0;
            if (isSome3) {
                f64Stack.push(value.waveHighMax);
            }
            i32Stack.push(isSome3);
            const bytes = textEncoder.encode(value.waveDirection);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            const isSome4 = value.totalSeaMin != null ? 1 : 0;
            if (isSome4) {
                f64Stack.push(value.totalSeaMin);
            }
            i32Stack.push(isSome4);
            const isSome5 = value.totalSeaMax != null ? 1 : 0;
            if (isSome5) {
                f64Stack.push(value.totalSeaMax);
            }
            i32Stack.push(isSome5);
            const isSome6 = value.sstMin != null ? 1 : 0;
            if (isSome6) {
                f64Stack.push(value.sstMin);
            }
            i32Stack.push(isSome6);
            const isSome7 = value.sstMax != null ? 1 : 0;
            if (isSome7) {
                f64Stack.push(value.sstMax);
            }
            i32Stack.push(isSome7);
            f64Stack.push(value.latitude);
            f64Stack.push(value.longitude);
        },
        lift: () => {
            const f64 = f64Stack.pop();
            const f641 = f64Stack.pop();
            const isSome = i32Stack.pop();
            let optValue;
            if (isSome === 0) {
                optValue = null;
            } else {
                const f642 = f64Stack.pop();
                optValue = f642;
            }
            const isSome1 = i32Stack.pop();
            let optValue1;
            if (isSome1 === 0) {
                optValue1 = null;
            } else {
                const f643 = f64Stack.pop();
                optValue1 = f643;
            }
            const isSome2 = i32Stack.pop();
            let optValue2;
            if (isSome2 === 0) {
                optValue2 = null;
            } else {
                const f644 = f64Stack.pop();
                optValue2 = f644;
            }
            const isSome3 = i32Stack.pop();
            let optValue3;
            if (isSome3 === 0) {
                optValue3 = null;
            } else {
                const f645 = f64Stack.pop();
                optValue3 = f645;
            }
            const string = strStack.pop();
            const isSome4 = i32Stack.pop();
            let optValue4;
            if (isSome4 === 0) {
                optValue4 = null;
            } else {
                const f646 = f64Stack.pop();
                optValue4 = f646;
            }
            const isSome5 = i32Stack.pop();
            let optValue5;
            if (isSome5 === 0) {
                optValue5 = null;
            } else {
                const f647 = f64Stack.pop();
                optValue5 = f647;
            }
            const isSome6 = i32Stack.pop();
            let optValue6;
            if (isSome6 === 0) {
                optValue6 = null;
            } else {
                const f648 = f64Stack.pop();
                optValue6 = f648;
            }
            const isSome7 = i32Stack.pop();
            let optValue7;
            if (isSome7 === 0) {
                optValue7 = null;
            } else {
                const f649 = f64Stack.pop();
                optValue7 = f649;
            }
            const int = i32Stack.pop();
            return { locationID: int, wavePeriodMin: optValue7, wavePeriodMax: optValue6, waveHighMin: optValue5, waveHighMax: optValue4, waveDirection: string, totalSeaMin: optValue3, totalSeaMax: optValue2, sstMin: optValue1, sstMax: optValue, latitude: f641, longitude: f64 };
        }
    });
    const __bjs_createJSSeismicEventHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.time);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            const isSome = value.location != null ? 1 : 0;
            if (isSome) {
                const bytes1 = textEncoder.encode(value.location);
                const id1 = swift.memory.retain(bytes1);
                i32Stack.push(bytes1.length);
                i32Stack.push(id1);
            }
            i32Stack.push(isSome);
            const bytes2 = textEncoder.encode(value.latitude);
            const id2 = swift.memory.retain(bytes2);
            i32Stack.push(bytes2.length);
            i32Stack.push(id2);
            const bytes3 = textEncoder.encode(value.longitude);
            const id3 = swift.memory.retain(bytes3);
            i32Stack.push(bytes3.length);
            i32Stack.push(id3);
            const bytes4 = textEncoder.encode(value.magnitude);
            const id4 = swift.memory.retain(bytes4);
            i32Stack.push(bytes4.length);
            i32Stack.push(id4);
            const isSome1 = value.magnitudeType != null ? 1 : 0;
            if (isSome1) {
                const bytes5 = textEncoder.encode(value.magnitudeType);
                const id5 = swift.memory.retain(bytes5);
                i32Stack.push(bytes5.length);
                i32Stack.push(id5);
            }
            i32Stack.push(isSome1);
            const isSome2 = value.degree != null ? 1 : 0;
            if (isSome2) {
                const bytes6 = textEncoder.encode(value.degree);
                const id6 = swift.memory.retain(bytes6);
                i32Stack.push(bytes6.length);
                i32Stack.push(id6);
            }
            i32Stack.push(isSome2);
            const isSome3 = value.depth != null ? 1 : 0;
            if (isSome3) {
                i32Stack.push((value.depth | 0));
            }
            i32Stack.push(isSome3);
            const bytes7 = textEncoder.encode(value.dataUpdate);
            const id7 = swift.memory.retain(bytes7);
            i32Stack.push(bytes7.length);
            i32Stack.push(id7);
            const isSome4 = value.obsRegion != null ? 1 : 0;
            if (isSome4) {
                const bytes8 = textEncoder.encode(value.obsRegion);
                const id8 = swift.memory.retain(bytes8);
                i32Stack.push(bytes8.length);
                i32Stack.push(id8);
            }
            i32Stack.push(isSome4);
            const isSome5 = value.source != null ? 1 : 0;
            if (isSome5) {
                const bytes9 = textEncoder.encode(value.source);
                const id9 = swift.memory.retain(bytes9);
                i32Stack.push(bytes9.length);
                i32Stack.push(id9);
            }
            i32Stack.push(isSome5);
            const isSome6 = value.shakemapID != null ? 1 : 0;
            if (isSome6) {
                const bytes10 = textEncoder.encode(value.shakemapID);
                const id10 = swift.memory.retain(bytes10);
                i32Stack.push(bytes10.length);
                i32Stack.push(id10);
            }
            i32Stack.push(isSome6);
        },
        lift: () => {
            const isSome = i32Stack.pop();
            let optValue;
            if (isSome === 0) {
                optValue = null;
            } else {
                const string = strStack.pop();
                optValue = string;
            }
            const isSome1 = i32Stack.pop();
            let optValue1;
            if (isSome1 === 0) {
                optValue1 = null;
            } else {
                const string1 = strStack.pop();
                optValue1 = string1;
            }
            const isSome2 = i32Stack.pop();
            let optValue2;
            if (isSome2 === 0) {
                optValue2 = null;
            } else {
                const string2 = strStack.pop();
                optValue2 = string2;
            }
            const string3 = strStack.pop();
            const isSome3 = i32Stack.pop();
            let optValue3;
            if (isSome3 === 0) {
                optValue3 = null;
            } else {
                const int = i32Stack.pop();
                optValue3 = int;
            }
            const isSome4 = i32Stack.pop();
            let optValue4;
            if (isSome4 === 0) {
                optValue4 = null;
            } else {
                const string4 = strStack.pop();
                optValue4 = string4;
            }
            const isSome5 = i32Stack.pop();
            let optValue5;
            if (isSome5 === 0) {
                optValue5 = null;
            } else {
                const string5 = strStack.pop();
                optValue5 = string5;
            }
            const string6 = strStack.pop();
            const string7 = strStack.pop();
            const string8 = strStack.pop();
            const isSome6 = i32Stack.pop();
            let optValue6;
            if (isSome6 === 0) {
                optValue6 = null;
            } else {
                const string9 = strStack.pop();
                optValue6 = string9;
            }
            const string10 = strStack.pop();
            return { time: string10, location: optValue6, latitude: string8, longitude: string7, magnitude: string6, magnitudeType: optValue5, degree: optValue4, depth: optValue3, dataUpdate: string3, obsRegion: optValue2, source: optValue1, shakemapID: optValue };
        }
    });
    const __bjs_createJSFireRiskEntryHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.dico);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            i32Stack.push((value.riskLevel | 0));
            const bytes1 = textEncoder.encode(value.riskDescriptionPT);
            const id1 = swift.memory.retain(bytes1);
            i32Stack.push(bytes1.length);
            i32Stack.push(id1);
            const bytes2 = textEncoder.encode(value.riskDescriptionEN);
            const id2 = swift.memory.retain(bytes2);
            i32Stack.push(bytes2.length);
            i32Stack.push(id2);
            f64Stack.push(value.latitude);
            f64Stack.push(value.longitude);
        },
        lift: () => {
            const f64 = f64Stack.pop();
            const f641 = f64Stack.pop();
            const string = strStack.pop();
            const string1 = strStack.pop();
            const int = i32Stack.pop();
            const string2 = strStack.pop();
            return { dico: string2, riskLevel: int, riskDescriptionPT: string1, riskDescriptionEN: string, latitude: f641, longitude: f64 };
        }
    });
    const __bjs_createJSUVIndexEntryHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.date);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            i32Stack.push((value.locationID | 0));
            f64Stack.push(value.uvValue);
            const bytes1 = textEncoder.encode(value.hourInterval);
            const id1 = swift.memory.retain(bytes1);
            i32Stack.push(bytes1.length);
            i32Stack.push(id1);
            const bytes2 = textEncoder.encode(value.category);
            const id2 = swift.memory.retain(bytes2);
            i32Stack.push(bytes2.length);
            i32Stack.push(id2);
            const bytes3 = textEncoder.encode(value.categoryDescriptionPT);
            const id3 = swift.memory.retain(bytes3);
            i32Stack.push(bytes3.length);
            i32Stack.push(id3);
            const bytes4 = textEncoder.encode(value.categoryDescriptionEN);
            const id4 = swift.memory.retain(bytes4);
            i32Stack.push(bytes4.length);
            i32Stack.push(id4);
        },
        lift: () => {
            const string = strStack.pop();
            const string1 = strStack.pop();
            const string2 = strStack.pop();
            const string3 = strStack.pop();
            const f64 = f64Stack.pop();
            const int = i32Stack.pop();
            const string4 = strStack.pop();
            return { date: string4, locationID: int, uvValue: f64, hourInterval: string3, category: string2, categoryDescriptionPT: string1, categoryDescriptionEN: string };
        }
    });
    const __bjs_createJSStationObservationHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.time);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            i32Stack.push((value.stationID | 0));
            const isSome = value.temperature != null ? 1 : 0;
            if (isSome) {
                f64Stack.push(value.temperature);
            }
            i32Stack.push(isSome);
            const isSome1 = value.humidity != null ? 1 : 0;
            if (isSome1) {
                f64Stack.push(value.humidity);
            }
            i32Stack.push(isSome1);
            const isSome2 = value.pressure != null ? 1 : 0;
            if (isSome2) {
                f64Stack.push(value.pressure);
            }
            i32Stack.push(isSome2);
            const isSome3 = value.windSpeedKMH != null ? 1 : 0;
            if (isSome3) {
                f64Stack.push(value.windSpeedKMH);
            }
            i32Stack.push(isSome3);
            const isSome4 = value.windSpeedMS != null ? 1 : 0;
            if (isSome4) {
                f64Stack.push(value.windSpeedMS);
            }
            i32Stack.push(isSome4);
            const isSome5 = value.windDirectionID != null ? 1 : 0;
            if (isSome5) {
                i32Stack.push((value.windDirectionID | 0));
            }
            i32Stack.push(isSome5);
            const isSome6 = value.precipitation != null ? 1 : 0;
            if (isSome6) {
                f64Stack.push(value.precipitation);
            }
            i32Stack.push(isSome6);
            const isSome7 = value.solarRadiation != null ? 1 : 0;
            if (isSome7) {
                f64Stack.push(value.solarRadiation);
            }
            i32Stack.push(isSome7);
        },
        lift: () => {
            const isSome = i32Stack.pop();
            let optValue;
            if (isSome === 0) {
                optValue = null;
            } else {
                const f64 = f64Stack.pop();
                optValue = f64;
            }
            const isSome1 = i32Stack.pop();
            let optValue1;
            if (isSome1 === 0) {
                optValue1 = null;
            } else {
                const f641 = f64Stack.pop();
                optValue1 = f641;
            }
            const isSome2 = i32Stack.pop();
            let optValue2;
            if (isSome2 === 0) {
                optValue2 = null;
            } else {
                const int = i32Stack.pop();
                optValue2 = int;
            }
            const isSome3 = i32Stack.pop();
            let optValue3;
            if (isSome3 === 0) {
                optValue3 = null;
            } else {
                const f642 = f64Stack.pop();
                optValue3 = f642;
            }
            const isSome4 = i32Stack.pop();
            let optValue4;
            if (isSome4 === 0) {
                optValue4 = null;
            } else {
                const f643 = f64Stack.pop();
                optValue4 = f643;
            }
            const isSome5 = i32Stack.pop();
            let optValue5;
            if (isSome5 === 0) {
                optValue5 = null;
            } else {
                const f644 = f64Stack.pop();
                optValue5 = f644;
            }
            const isSome6 = i32Stack.pop();
            let optValue6;
            if (isSome6 === 0) {
                optValue6 = null;
            } else {
                const f645 = f64Stack.pop();
                optValue6 = f645;
            }
            const isSome7 = i32Stack.pop();
            let optValue7;
            if (isSome7 === 0) {
                optValue7 = null;
            } else {
                const f646 = f64Stack.pop();
                optValue7 = f646;
            }
            const int1 = i32Stack.pop();
            const string = strStack.pop();
            return { time: string, stationID: int1, temperature: optValue7, humidity: optValue6, pressure: optValue5, windSpeedKMH: optValue4, windSpeedMS: optValue3, windDirectionID: optValue2, precipitation: optValue1, solarRadiation: optValue };
        }
    });
    const __bjs_createJSStationObservationFeatureHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.type);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            structHelpers.JSStationObservationGeometry.lower(value.geometry);
            structHelpers.JSStationObservationProperties.lower(value.properties);
        },
        lift: () => {
            const struct = structHelpers.JSStationObservationProperties.lift();
            const struct1 = structHelpers.JSStationObservationGeometry.lift();
            const string = strStack.pop();
            return { type: string, geometry: struct1, properties: struct };
        }
    });
    const __bjs_createJSStationObservationGeometryHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.type);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            for (const elem of value.coordinates) {
                f64Stack.push(elem);
            }
            i32Stack.push(value.coordinates.length);
        },
        lift: () => {
            const arrayLen = i32Stack.pop();
            let arrayResult;
            if (arrayLen === -1) {
                arrayResult = taStack.pop();
            } else {
                arrayResult = [];
                for (let i = 0; i < arrayLen; i++) {
                    const f64 = f64Stack.pop();
                    arrayResult.push(f64);
                }
                arrayResult.reverse();
            }
            const string = strStack.pop();
            return { type: string, coordinates: arrayResult };
        }
    });
    const __bjs_createJSStationObservationPropertiesHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.time);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            i32Stack.push((value.stationID | 0));
            const bytes1 = textEncoder.encode(value.stationName);
            const id1 = swift.memory.retain(bytes1);
            i32Stack.push(bytes1.length);
            i32Stack.push(id1);
            const isSome = value.temperature != null ? 1 : 0;
            if (isSome) {
                f64Stack.push(value.temperature);
            }
            i32Stack.push(isSome);
            const isSome1 = value.humidity != null ? 1 : 0;
            if (isSome1) {
                f64Stack.push(value.humidity);
            }
            i32Stack.push(isSome1);
            const isSome2 = value.pressure != null ? 1 : 0;
            if (isSome2) {
                f64Stack.push(value.pressure);
            }
            i32Stack.push(isSome2);
            const isSome3 = value.windSpeedKMH != null ? 1 : 0;
            if (isSome3) {
                f64Stack.push(value.windSpeedKMH);
            }
            i32Stack.push(isSome3);
            const isSome4 = value.windSpeedMS != null ? 1 : 0;
            if (isSome4) {
                f64Stack.push(value.windSpeedMS);
            }
            i32Stack.push(isSome4);
            const isSome5 = value.windDirectionID != null ? 1 : 0;
            if (isSome5) {
                i32Stack.push((value.windDirectionID | 0));
            }
            i32Stack.push(isSome5);
            const isSome6 = value.windDirectionDescription != null ? 1 : 0;
            if (isSome6) {
                const bytes2 = textEncoder.encode(value.windDirectionDescription);
                const id2 = swift.memory.retain(bytes2);
                i32Stack.push(bytes2.length);
                i32Stack.push(id2);
            }
            i32Stack.push(isSome6);
            const isSome7 = value.precipitation != null ? 1 : 0;
            if (isSome7) {
                f64Stack.push(value.precipitation);
            }
            i32Stack.push(isSome7);
            const isSome8 = value.solarRadiation != null ? 1 : 0;
            if (isSome8) {
                f64Stack.push(value.solarRadiation);
            }
            i32Stack.push(isSome8);
        },
        lift: () => {
            const isSome = i32Stack.pop();
            let optValue;
            if (isSome === 0) {
                optValue = null;
            } else {
                const f64 = f64Stack.pop();
                optValue = f64;
            }
            const isSome1 = i32Stack.pop();
            let optValue1;
            if (isSome1 === 0) {
                optValue1 = null;
            } else {
                const f641 = f64Stack.pop();
                optValue1 = f641;
            }
            const isSome2 = i32Stack.pop();
            let optValue2;
            if (isSome2 === 0) {
                optValue2 = null;
            } else {
                const string = strStack.pop();
                optValue2 = string;
            }
            const isSome3 = i32Stack.pop();
            let optValue3;
            if (isSome3 === 0) {
                optValue3 = null;
            } else {
                const int = i32Stack.pop();
                optValue3 = int;
            }
            const isSome4 = i32Stack.pop();
            let optValue4;
            if (isSome4 === 0) {
                optValue4 = null;
            } else {
                const f642 = f64Stack.pop();
                optValue4 = f642;
            }
            const isSome5 = i32Stack.pop();
            let optValue5;
            if (isSome5 === 0) {
                optValue5 = null;
            } else {
                const f643 = f64Stack.pop();
                optValue5 = f643;
            }
            const isSome6 = i32Stack.pop();
            let optValue6;
            if (isSome6 === 0) {
                optValue6 = null;
            } else {
                const f644 = f64Stack.pop();
                optValue6 = f644;
            }
            const isSome7 = i32Stack.pop();
            let optValue7;
            if (isSome7 === 0) {
                optValue7 = null;
            } else {
                const f645 = f64Stack.pop();
                optValue7 = f645;
            }
            const isSome8 = i32Stack.pop();
            let optValue8;
            if (isSome8 === 0) {
                optValue8 = null;
            } else {
                const f646 = f64Stack.pop();
                optValue8 = f646;
            }
            const string1 = strStack.pop();
            const int1 = i32Stack.pop();
            const string2 = strStack.pop();
            return { time: string2, stationID: int1, stationName: string1, temperature: optValue8, humidity: optValue7, pressure: optValue6, windSpeedKMH: optValue5, windSpeedMS: optValue4, windDirectionID: optValue3, windDirectionDescription: optValue2, precipitation: optValue1, solarRadiation: optValue };
        }
    });
    const __bjs_createJSLookupDescriptionHelpers = () => ({
        lower: (value) => {
            i32Stack.push((value.id | 0));
            const bytes = textEncoder.encode(value.descriptionEN);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            const bytes1 = textEncoder.encode(value.descriptionPT);
            const id1 = swift.memory.retain(bytes1);
            i32Stack.push(bytes1.length);
            i32Stack.push(id1);
        },
        lift: () => {
            const string = strStack.pop();
            const string1 = strStack.pop();
            const int = i32Stack.pop();
            return { id: int, descriptionEN: string1, descriptionPT: string };
        }
    });
    const __bjs_createJSClimateDataEntryHelpers = () => ({
        lower: (value) => {
            const bytes = textEncoder.encode(value.date);
            const id = swift.memory.retain(bytes);
            i32Stack.push(bytes.length);
            i32Stack.push(id);
            f64Stack.push(value.minimum);
            f64Stack.push(value.maximum);
            f64Stack.push(value.range);
            f64Stack.push(value.mean);
            f64Stack.push(value.std);
        },
        lift: () => {
            const f64 = f64Stack.pop();
            const f641 = f64Stack.pop();
            const f642 = f64Stack.pop();
            const f643 = f64Stack.pop();
            const f644 = f64Stack.pop();
            const string = strStack.pop();
            return { date: string, minimum: f644, maximum: f643, range: f642, mean: f641, std: f64 };
        }
    });

    return {
        /**
         * @param {WebAssembly.Imports} importObject
         */
        addImports: (importObject, importsContext) => {
            bjs = {};
            importObject["bjs"] = bjs;
            bjs["swift_js_return_string"] = function(ptr, len) {
                tmpRetString = decodeString(ptr, len);
            }
            bjs["swift_js_init_memory"] = function(sourceId, bytesPtr) {
                const source = swift.memory.getObject(sourceId);
                swift.memory.release(sourceId);
                const bytes = new Uint8Array(memory.buffer, bytesPtr >>> 0);
                bytes.set(source);
            }
            bjs["swift_js_make_js_string"] = function(ptr, len) {
                return swift.memory.retain(decodeString(ptr, len));
            }
            bjs["swift_js_init_memory_with_result"] = function(ptr, len) {
                const target = new Uint8Array(memory.buffer, ptr >>> 0, len >>> 0);
                target.set(tmpRetBytes);
                tmpRetBytes = undefined;
            }
            bjs["swift_js_throw"] = function(id) {
                tmpRetException = swift.memory.retainByRef(id);
            }
            bjs["swift_js_retain"] = function(id) {
                return swift.memory.retainByRef(id);
            }
            bjs["swift_js_release"] = function(id) {
                swift.memory.release(id);
            }
            bjs["swift_js_push_i32"] = function(v) {
                i32Stack.push(v | 0);
            }
            bjs["swift_js_push_f32"] = function(v) {
                f32Stack.push(Math.fround(v));
            }
            bjs["swift_js_push_f64"] = function(v) {
                f64Stack.push(v);
            }
            bjs["swift_js_push_string"] = function(ptr, len) {
                const value = decodeString(ptr, len);
                strStack.push(value);
            }
            bjs["swift_js_pop_i32"] = function() {
                return i32Stack.pop();
            }
            bjs["swift_js_pop_f32"] = function() {
                return f32Stack.pop();
            }
            bjs["swift_js_pop_f64"] = function() {
                return f64Stack.pop();
            }
            bjs["swift_js_push_pointer"] = function(pointer) {
                ptrStack.push(pointer);
            }
            bjs["swift_js_pop_pointer"] = function() {
                return ptrStack.pop();
            }
            bjs["swift_js_push_i64"] = function(v) {
                i64Stack.push(v);
            }
            bjs["swift_js_pop_i64"] = function() {
                return i64Stack.pop();
            }
            const taCtors = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
            bjs["swift_js_push_typed_array"] = function(kind, ptr, count) {
                const Ctor = taCtors[kind];
                const byteLen = count * Ctor.BYTES_PER_ELEMENT;
                const copy = memory.buffer.slice(ptr, ptr + byteLen);
                taStack.push(Array.from(new Ctor(copy)));
            }
            bjs["swift_js_struct_lower_JSLocation"] = function(objectId) {
                structHelpers.JSLocation.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSLocation"] = function() {
                const value = structHelpers.JSLocation.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSSeaLocation"] = function(objectId) {
                structHelpers.JSSeaLocation.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSSeaLocation"] = function() {
                const value = structHelpers.JSSeaLocation.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSStation"] = function(objectId) {
                structHelpers.JSStation.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSStation"] = function() {
                const value = structHelpers.JSStation.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSDistrict"] = function(objectId) {
                structHelpers.JSDistrict.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSDistrict"] = function() {
                const value = structHelpers.JSDistrict.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSAggregateForecastResult"] = function(objectId) {
                structHelpers.JSAggregateForecastResult.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSAggregateForecastResult"] = function() {
                const value = structHelpers.JSAggregateForecastResult.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSAggregateForecastDay"] = function(objectId) {
                structHelpers.JSAggregateForecastDay.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSAggregateForecastDay"] = function() {
                const value = structHelpers.JSAggregateForecastDay.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSHourlyForecastPeriod"] = function(objectId) {
                structHelpers.JSHourlyForecastPeriod.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSHourlyForecastPeriod"] = function() {
                const value = structHelpers.JSHourlyForecastPeriod.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSAllLocationsForecastEntry"] = function(objectId) {
                structHelpers.JSAllLocationsForecastEntry.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSAllLocationsForecastEntry"] = function() {
                const value = structHelpers.JSAllLocationsForecastEntry.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSDailyForecastResult"] = function(objectId) {
                structHelpers.JSDailyForecastResult.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSDailyForecastResult"] = function() {
                const value = structHelpers.JSDailyForecastResult.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSDailyForecastEntry"] = function(objectId) {
                structHelpers.JSDailyForecastEntry.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSDailyForecastEntry"] = function() {
                const value = structHelpers.JSDailyForecastEntry.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSWeatherWarning"] = function(objectId) {
                structHelpers.JSWeatherWarning.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSWeatherWarning"] = function() {
                const value = structHelpers.JSWeatherWarning.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSSeaForecastEntry"] = function(objectId) {
                structHelpers.JSSeaForecastEntry.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSSeaForecastEntry"] = function() {
                const value = structHelpers.JSSeaForecastEntry.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSSeismicEvent"] = function(objectId) {
                structHelpers.JSSeismicEvent.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSSeismicEvent"] = function() {
                const value = structHelpers.JSSeismicEvent.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSFireRiskEntry"] = function(objectId) {
                structHelpers.JSFireRiskEntry.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSFireRiskEntry"] = function() {
                const value = structHelpers.JSFireRiskEntry.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSUVIndexEntry"] = function(objectId) {
                structHelpers.JSUVIndexEntry.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSUVIndexEntry"] = function() {
                const value = structHelpers.JSUVIndexEntry.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSStationObservation"] = function(objectId) {
                structHelpers.JSStationObservation.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSStationObservation"] = function() {
                const value = structHelpers.JSStationObservation.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSStationObservationFeature"] = function(objectId) {
                structHelpers.JSStationObservationFeature.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSStationObservationFeature"] = function() {
                const value = structHelpers.JSStationObservationFeature.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSStationObservationGeometry"] = function(objectId) {
                structHelpers.JSStationObservationGeometry.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSStationObservationGeometry"] = function() {
                const value = structHelpers.JSStationObservationGeometry.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSStationObservationProperties"] = function(objectId) {
                structHelpers.JSStationObservationProperties.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSStationObservationProperties"] = function() {
                const value = structHelpers.JSStationObservationProperties.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSLookupDescription"] = function(objectId) {
                structHelpers.JSLookupDescription.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSLookupDescription"] = function() {
                const value = structHelpers.JSLookupDescription.lift();
                return swift.memory.retain(value);
            }
            bjs["swift_js_struct_lower_JSClimateDataEntry"] = function(objectId) {
                structHelpers.JSClimateDataEntry.lower(swift.memory.getObject(objectId));
            }
            bjs["swift_js_struct_lift_JSClimateDataEntry"] = function() {
                const value = structHelpers.JSClimateDataEntry.lift();
                return swift.memory.retain(value);
            }
            const __bjs_promiseSettlers = Symbol("JavaScriptKit.promiseSettlers");
            bjs["swift_js_make_promise"] = function() {
                let resolve, reject;
                const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
                promise[__bjs_promiseSettlers] = { resolve, reject };
                return swift.memory.retain(promise);
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa10JSLocationV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSLocation.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa13JSSeaLocationV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSSeaLocation.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa9JSStationV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSStation.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sq10JSLocationV"] = function(promise, value) {
                try {
                    let optResult;
                    if (value) {
                        const struct = structHelpers.JSLocation.lift();
                        optResult = struct;
                    } else {
                        optResult = null;
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(optResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sq9JSStationV"] = function(promise, value) {
                try {
                    let optResult;
                    if (value) {
                        const struct = structHelpers.JSStation.lift();
                        optResult = struct;
                    } else {
                        optResult = null;
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(optResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa10JSDistrictV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSDistrict.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_25JSAggregateForecastResultV"] = function(promise, value) {
                try {
                    const value1 = swift.memory.getObject(value);
                    swift.memory.release(value);
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(value1);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa27JSAllLocationsForecastEntryV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSAllLocationsForecastEntry.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_21JSDailyForecastResultV"] = function(promise, value) {
                try {
                    const value1 = swift.memory.getObject(value);
                    swift.memory.release(value);
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(value1);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa16JSWeatherWarningV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSWeatherWarning.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa18JSSeaForecastEntryV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSSeaForecastEntry.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa14JSSeismicEventV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSSeismicEvent.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa15JSFireRiskEntryV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSFireRiskEntry.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa14JSUVIndexEntryV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSUVIndexEntry.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa20JSStationObservationV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSStationObservation.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa27JSStationObservationFeatureV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSStationObservationFeature.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa19JSLookupDescriptionV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSLookupDescription.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_resolve_IPMAWeatherJS_Sa18JSClimateDataEntryV"] = function(promise) {
                try {
                    const arrayLen = i32Stack.pop();
                    let arrayResult;
                    if (arrayLen === -1) {
                        arrayResult = taStack.pop();
                    } else {
                        arrayResult = [];
                        for (let i = 0; i < arrayLen; i++) {
                            const struct = structHelpers.JSClimateDataEntry.lift();
                            arrayResult.push(struct);
                        }
                        arrayResult.reverse();
                    }
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].resolve(arrayResult);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["promise_reject_IPMAWeatherJS"] = function(promise, valueKind, valuePayload1, valuePayload2) {
                try {
                    const jsValue = __bjs_jsValueLift(valueKind, valuePayload1, valuePayload2);
                    swift.memory.getObject(promise)[__bjs_promiseSettlers].reject(jsValue);
                } catch (error) {
                    setException(error);
                }
            }
            bjs["swift_js_return_optional_bool"] = function(isSome, value) {
                if (isSome === 0) {
                    tmpRetOptionalBool = null;
                } else {
                    tmpRetOptionalBool = value !== 0;
                }
            }
            bjs["swift_js_return_optional_int"] = function(isSome, value) {
                if (isSome === 0) {
                    tmpRetOptionalInt = null;
                } else {
                    tmpRetOptionalInt = value | 0;
                }
            }
            bjs["swift_js_return_optional_float"] = function(isSome, value) {
                if (isSome === 0) {
                    tmpRetOptionalFloat = null;
                } else {
                    tmpRetOptionalFloat = Math.fround(value);
                }
            }
            bjs["swift_js_return_optional_double"] = function(isSome, value) {
                if (isSome === 0) {
                    tmpRetOptionalDouble = null;
                } else {
                    tmpRetOptionalDouble = value;
                }
            }
            bjs["swift_js_return_optional_string"] = function(isSome, ptr, len) {
                if (isSome === 0) {
                    tmpRetString = null;
                } else {
                    tmpRetString = decodeString(ptr, len);
                }
            }
            bjs["swift_js_return_optional_object"] = function(isSome, objectId) {
                if (isSome === 0) {
                    tmpRetString = null;
                } else {
                    tmpRetString = swift.memory.getObject(objectId);
                }
            }
            bjs["swift_js_return_optional_heap_object"] = function(isSome, pointer) {
                if (isSome === 0) {
                    tmpRetOptionalHeapObject = null;
                } else {
                    tmpRetOptionalHeapObject = pointer;
                }
            }
            bjs["swift_js_get_optional_int_presence"] = function() {
                return tmpRetOptionalInt != null ? 1 : 0;
            }
            bjs["swift_js_get_optional_int_value"] = function() {
                const value = tmpRetOptionalInt;
                tmpRetOptionalInt = undefined;
                return value;
            }
            bjs["swift_js_get_optional_string"] = function() {
                const str = tmpRetString;
                tmpRetString = undefined;
                if (str == null) {
                    return -1;
                } else {
                    const bytes = textEncoder.encode(str);
                    tmpRetBytes = bytes;
                    return bytes.length;
                }
            }
            bjs["swift_js_get_optional_float_presence"] = function() {
                return tmpRetOptionalFloat != null ? 1 : 0;
            }
            bjs["swift_js_get_optional_float_value"] = function() {
                const value = tmpRetOptionalFloat;
                tmpRetOptionalFloat = undefined;
                return value;
            }
            bjs["swift_js_get_optional_double_presence"] = function() {
                return tmpRetOptionalDouble != null ? 1 : 0;
            }
            bjs["swift_js_get_optional_double_value"] = function() {
                const value = tmpRetOptionalDouble;
                tmpRetOptionalDouble = undefined;
                return value;
            }
            bjs["swift_js_get_optional_heap_object_pointer"] = function() {
                const pointer = tmpRetOptionalHeapObject;
                tmpRetOptionalHeapObject = undefined;
                return pointer || 0;
            }
            bjs["swift_js_closure_unregister"] = function(funcRef) {}
            // Wrapper functions for module: IPMAWeatherJS
            if (!importObject["IPMAWeatherJS"]) {
                importObject["IPMAWeatherJS"] = {};
            }
            importObject["IPMAWeatherJS"]["bjs_IPMAWeatherClient_wrap"] = function(pointer) {
                const obj = _exports['IPMAWeatherClient'].__construct(pointer);
                return swift.memory.retain(obj);
            };
        },
        setInstance: (i) => {
            instance = i;
            memory = instance.exports.memory;

            decodeString = (ptr, len) => { const bytes = new Uint8Array(memory.buffer, ptr >>> 0, len >>> 0); return textDecoder.decode(bytes); }

            setException = (error) => {
                instance.exports._swift_js_exception.value = swift.memory.retain(error)
            }
        },
        /** @param {WebAssembly.Instance} instance */
        createExports: (instance) => {
            const js = swift.memory.heap;
            const swiftHeapObjectFinalizationRegistry = (typeof FinalizationRegistry === "undefined") ? { register: () => {}, unregister: () => {} } : new FinalizationRegistry((state) => {
                if (state.hasReleased) {
                    return;
                }
                state.hasReleased = true;
                state.identityMap?.delete(state.pointer);
                state.deinit(state.pointer);
            });

            /// Represents a Swift heap object like a class instance or an actor instance.
            class SwiftHeapObject {
                static __wrap(pointer, deinit, prototype, identityCache) {
                    pointer = pointer >>> 0;
                    const makeFresh = (identityMap) => {
                        const obj = Object.create(prototype);
                        const state = { pointer, deinit, hasReleased: false, identityMap };
                        obj.pointer = pointer;
                        obj.__swiftHeapObjectState = state;
                        swiftHeapObjectFinalizationRegistry.register(obj, state, state);
                        if (identityMap) {
                            identityMap.set(pointer, new WeakRef(obj));
                        }
                        return obj;
                    };

                    if (!identityCache) {
                        return makeFresh(null);
                    }

                    const cached = identityCache.get(pointer)?.deref();
                    if (cached && !cached.__swiftHeapObjectState.hasReleased) {
                        deinit(pointer);
                        return cached;
                    }
                    if (identityCache.has(pointer)) {
                        identityCache.delete(pointer);
                    }

                    return makeFresh(identityCache);
                }

                release() {
                    const state = this.__swiftHeapObjectState;
                    if (state.hasReleased) {
                        return;
                    }
                    state.hasReleased = true;
                    swiftHeapObjectFinalizationRegistry.unregister(state);
                    state.identityMap?.delete(state.pointer);
                    state.deinit(state.pointer);
                }
            }
            class IPMAWeatherClient extends SwiftHeapObject {
                static __construct(ptr) {
                    return SwiftHeapObject.__wrap(ptr, instance.exports.bjs_IPMAWeatherClient_deinit, IPMAWeatherClient.prototype, null);
                }

                constructor() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_init();
                    return IPMAWeatherClient.__construct(ret);
                }
                locations() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_locations(this.pointer);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                seaLocations() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_seaLocations(this.pointer);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                stations() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_stations(this.pointer);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                locationByID(id) {
                    const ret = instance.exports.bjs_IPMAWeatherClient_locationByID(this.pointer, id);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                locationByName(name) {
                    const nameBytes = textEncoder.encode(name);
                    const nameId = swift.memory.retain(nameBytes);
                    const ret = instance.exports.bjs_IPMAWeatherClient_locationByName(this.pointer, nameId, nameBytes.length);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                closestLocation(latitude, longitude) {
                    const ret = instance.exports.bjs_IPMAWeatherClient_closestLocation(this.pointer, latitude, longitude);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                closestStation(latitude, longitude) {
                    const ret = instance.exports.bjs_IPMAWeatherClient_closestStation(this.pointer, latitude, longitude);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                forecastLocations() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_forecastLocations(this.pointer);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                districts() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_districts(this.pointer);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                aggregateForecast(locationID) {
                    const ret = instance.exports.bjs_IPMAWeatherClient_aggregateForecast(this.pointer, locationID);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                allLocationsForecast(day) {
                    const ret = instance.exports.bjs_IPMAWeatherClient_allLocationsForecast(this.pointer, day);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                dailyForecast(locationID) {
                    const ret = instance.exports.bjs_IPMAWeatherClient_dailyForecast(this.pointer, locationID);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                weatherWarnings() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_weatherWarnings(this.pointer);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                seaForecast(day) {
                    const ret = instance.exports.bjs_IPMAWeatherClient_seaForecast(this.pointer, day);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                seismicData(area) {
                    const ret = instance.exports.bjs_IPMAWeatherClient_seismicData(this.pointer, area);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                fireRisk(day) {
                    const ret = instance.exports.bjs_IPMAWeatherClient_fireRisk(this.pointer, day);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                uvIndex() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_uvIndex(this.pointer);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                uvIndexForLocation(locationID) {
                    const ret = instance.exports.bjs_IPMAWeatherClient_uvIndexForLocation(this.pointer, locationID);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                stationObservations() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_stationObservations(this.pointer);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                latestStationObservations() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_latestStationObservations(this.pointer);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                weatherTypeDescriptions() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_weatherTypeDescriptions(this.pointer);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                windSpeedClassDescriptions() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_windSpeedClassDescriptions(this.pointer);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                precipitationClassDescriptions() {
                    const ret = instance.exports.bjs_IPMAWeatherClient_precipitationClassDescriptions(this.pointer);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                weatherIconURL(weatherTypeID, timeOfDay, animated) {
                    const timeOfDayBytes = textEncoder.encode(timeOfDay);
                    const timeOfDayId = swift.memory.retain(timeOfDayBytes);
                    instance.exports.bjs_IPMAWeatherClient_weatherIconURL(this.pointer, weatherTypeID, timeOfDayId, timeOfDayBytes.length, animated);
                    const optResult = tmpRetString;
                    tmpRetString = undefined;
                    return optResult;
                }
                climateEvapotranspiration(district, municipality, dico) {
                    const districtBytes = textEncoder.encode(district);
                    const districtId = swift.memory.retain(districtBytes);
                    const municipalityBytes = textEncoder.encode(municipality);
                    const municipalityId = swift.memory.retain(municipalityBytes);
                    const dicoBytes = textEncoder.encode(dico);
                    const dicoId = swift.memory.retain(dicoBytes);
                    const ret = instance.exports.bjs_IPMAWeatherClient_climateEvapotranspiration(this.pointer, districtId, districtBytes.length, municipalityId, municipalityBytes.length, dicoId, dicoBytes.length);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                climatePrecipitation(district, municipality, dico) {
                    const districtBytes = textEncoder.encode(district);
                    const districtId = swift.memory.retain(districtBytes);
                    const municipalityBytes = textEncoder.encode(municipality);
                    const municipalityId = swift.memory.retain(municipalityBytes);
                    const dicoBytes = textEncoder.encode(dico);
                    const dicoId = swift.memory.retain(dicoBytes);
                    const ret = instance.exports.bjs_IPMAWeatherClient_climatePrecipitation(this.pointer, districtId, districtBytes.length, municipalityId, municipalityBytes.length, dicoId, dicoBytes.length);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                climateTempMin(district, municipality, dico) {
                    const districtBytes = textEncoder.encode(district);
                    const districtId = swift.memory.retain(districtBytes);
                    const municipalityBytes = textEncoder.encode(municipality);
                    const municipalityId = swift.memory.retain(municipalityBytes);
                    const dicoBytes = textEncoder.encode(dico);
                    const dicoId = swift.memory.retain(dicoBytes);
                    const ret = instance.exports.bjs_IPMAWeatherClient_climateTempMin(this.pointer, districtId, districtBytes.length, municipalityId, municipalityBytes.length, dicoId, dicoBytes.length);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                climateTempMax(district, municipality, dico) {
                    const districtBytes = textEncoder.encode(district);
                    const districtId = swift.memory.retain(districtBytes);
                    const municipalityBytes = textEncoder.encode(municipality);
                    const municipalityId = swift.memory.retain(municipalityBytes);
                    const dicoBytes = textEncoder.encode(dico);
                    const dicoId = swift.memory.retain(dicoBytes);
                    const ret = instance.exports.bjs_IPMAWeatherClient_climateTempMax(this.pointer, districtId, districtBytes.length, municipalityId, municipalityBytes.length, dicoId, dicoBytes.length);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
                climatePDSI(district, municipality, dico) {
                    const districtBytes = textEncoder.encode(district);
                    const districtId = swift.memory.retain(districtBytes);
                    const municipalityBytes = textEncoder.encode(municipality);
                    const municipalityId = swift.memory.retain(municipalityBytes);
                    const dicoBytes = textEncoder.encode(dico);
                    const dicoId = swift.memory.retain(dicoBytes);
                    const ret = instance.exports.bjs_IPMAWeatherClient_climatePDSI(this.pointer, districtId, districtBytes.length, municipalityId, municipalityBytes.length, dicoId, dicoBytes.length);
                    const ret1 = swift.memory.getObject(ret);
                    swift.memory.release(ret);
                    if (tmpRetException) {
                        const error = swift.memory.getObject(tmpRetException);
                        swift.memory.release(tmpRetException);
                        tmpRetException = undefined;
                        throw error;
                    }
                    return ret1;
                }
            }
            const JSLocationHelpers = __bjs_createJSLocationHelpers();
            structHelpers.JSLocation = JSLocationHelpers;

            const JSSeaLocationHelpers = __bjs_createJSSeaLocationHelpers();
            structHelpers.JSSeaLocation = JSSeaLocationHelpers;

            const JSStationHelpers = __bjs_createJSStationHelpers();
            structHelpers.JSStation = JSStationHelpers;

            const JSDistrictHelpers = __bjs_createJSDistrictHelpers();
            structHelpers.JSDistrict = JSDistrictHelpers;

            const JSAggregateForecastResultHelpers = __bjs_createJSAggregateForecastResultHelpers();
            structHelpers.JSAggregateForecastResult = JSAggregateForecastResultHelpers;

            const JSAggregateForecastDayHelpers = __bjs_createJSAggregateForecastDayHelpers();
            structHelpers.JSAggregateForecastDay = JSAggregateForecastDayHelpers;

            const JSHourlyForecastPeriodHelpers = __bjs_createJSHourlyForecastPeriodHelpers();
            structHelpers.JSHourlyForecastPeriod = JSHourlyForecastPeriodHelpers;

            const JSAllLocationsForecastEntryHelpers = __bjs_createJSAllLocationsForecastEntryHelpers();
            structHelpers.JSAllLocationsForecastEntry = JSAllLocationsForecastEntryHelpers;

            const JSDailyForecastResultHelpers = __bjs_createJSDailyForecastResultHelpers();
            structHelpers.JSDailyForecastResult = JSDailyForecastResultHelpers;

            const JSDailyForecastEntryHelpers = __bjs_createJSDailyForecastEntryHelpers();
            structHelpers.JSDailyForecastEntry = JSDailyForecastEntryHelpers;

            const JSWeatherWarningHelpers = __bjs_createJSWeatherWarningHelpers();
            structHelpers.JSWeatherWarning = JSWeatherWarningHelpers;

            const JSSeaForecastEntryHelpers = __bjs_createJSSeaForecastEntryHelpers();
            structHelpers.JSSeaForecastEntry = JSSeaForecastEntryHelpers;

            const JSSeismicEventHelpers = __bjs_createJSSeismicEventHelpers();
            structHelpers.JSSeismicEvent = JSSeismicEventHelpers;

            const JSFireRiskEntryHelpers = __bjs_createJSFireRiskEntryHelpers();
            structHelpers.JSFireRiskEntry = JSFireRiskEntryHelpers;

            const JSUVIndexEntryHelpers = __bjs_createJSUVIndexEntryHelpers();
            structHelpers.JSUVIndexEntry = JSUVIndexEntryHelpers;

            const JSStationObservationHelpers = __bjs_createJSStationObservationHelpers();
            structHelpers.JSStationObservation = JSStationObservationHelpers;

            const JSStationObservationFeatureHelpers = __bjs_createJSStationObservationFeatureHelpers();
            structHelpers.JSStationObservationFeature = JSStationObservationFeatureHelpers;

            const JSStationObservationGeometryHelpers = __bjs_createJSStationObservationGeometryHelpers();
            structHelpers.JSStationObservationGeometry = JSStationObservationGeometryHelpers;

            const JSStationObservationPropertiesHelpers = __bjs_createJSStationObservationPropertiesHelpers();
            structHelpers.JSStationObservationProperties = JSStationObservationPropertiesHelpers;

            const JSLookupDescriptionHelpers = __bjs_createJSLookupDescriptionHelpers();
            structHelpers.JSLookupDescription = JSLookupDescriptionHelpers;

            const JSClimateDataEntryHelpers = __bjs_createJSClimateDataEntryHelpers();
            structHelpers.JSClimateDataEntry = JSClimateDataEntryHelpers;

            const exports = {
                IPMAWeatherClient,
                JSLocation: {
                    init: function(id, name, regionID, districtID, municipalityID, warningAreaID, latitude, longitude) {
                        const nameBytes = textEncoder.encode(name);
                        const nameId = swift.memory.retain(nameBytes);
                        const warningAreaIDBytes = textEncoder.encode(warningAreaID);
                        const warningAreaIDId = swift.memory.retain(warningAreaIDBytes);
                        instance.exports.bjs_JSLocation_init(id, nameId, nameBytes.length, regionID, districtID, municipalityID, warningAreaIDId, warningAreaIDBytes.length, latitude, longitude);
                        const structValue = structHelpers.JSLocation.lift();
                        return structValue;
                    },
                },
                JSSeaLocation: {
                    init: function(id, name, localID, regionID, warningAreaID, latitude, longitude) {
                        const nameBytes = textEncoder.encode(name);
                        const nameId = swift.memory.retain(nameBytes);
                        const warningAreaIDBytes = textEncoder.encode(warningAreaID);
                        const warningAreaIDId = swift.memory.retain(warningAreaIDBytes);
                        instance.exports.bjs_JSSeaLocation_init(id, nameId, nameBytes.length, localID, regionID, warningAreaIDId, warningAreaIDBytes.length, latitude, longitude);
                        const structValue = structHelpers.JSSeaLocation.lift();
                        return structValue;
                    },
                },
                JSStation: {
                    init: function(id, name, latitude, longitude) {
                        const nameBytes = textEncoder.encode(name);
                        const nameId = swift.memory.retain(nameBytes);
                        instance.exports.bjs_JSStation_init(id, nameId, nameBytes.length, latitude, longitude);
                        const structValue = structHelpers.JSStation.lift();
                        return structValue;
                    },
                },
                JSDistrict: {
                    init: function(regionID, id, name) {
                        const nameBytes = textEncoder.encode(name);
                        const nameId = swift.memory.retain(nameBytes);
                        instance.exports.bjs_JSDistrict_init(regionID, id, nameId, nameBytes.length);
                        const structValue = structHelpers.JSDistrict.lift();
                        return structValue;
                    },
                },
                JSAggregateForecastResult: {
                    init: function(locationID, dataUpdate, daily, periods) {
                        const dataUpdateBytes = textEncoder.encode(dataUpdate);
                        const dataUpdateId = swift.memory.retain(dataUpdateBytes);
                        for (const elem of daily) {
                            structHelpers.JSAggregateForecastDay.lower(elem);
                        }
                        i32Stack.push(daily.length);
                        for (const elem1 of periods) {
                            structHelpers.JSHourlyForecastPeriod.lower(elem1);
                        }
                        i32Stack.push(periods.length);
                        instance.exports.bjs_JSAggregateForecastResult_init(locationID, dataUpdateId, dataUpdateBytes.length);
                        const structValue = structHelpers.JSAggregateForecastResult.lift();
                        return structValue;
                    },
                },
                JSAggregateForecastDay: {
                    init: function(forecastDate, tMin, tMax, precipitationProbability, weatherTypeID, windDirection, windGust, uvIndex, uvInterval, feelsLike, humidity, seaWaterTemp, swell, totalSea, swellDirection, swellPeriod, peakPeriod, precipitationIntensityClassID) {
                        const forecastDateBytes = textEncoder.encode(forecastDate);
                        const forecastDateId = swift.memory.retain(forecastDateBytes);
                        const isSome = precipitationProbability != null;
                        const windDirectionBytes = textEncoder.encode(windDirection);
                        const windDirectionId = swift.memory.retain(windDirectionBytes);
                        const isSome1 = windGust != null;
                        const isSome2 = uvIndex != null;
                        const isSome3 = uvInterval != null;
                        let result, result1;
                        if (isSome3) {
                            const uvIntervalBytes = textEncoder.encode(uvInterval);
                            const uvIntervalId = swift.memory.retain(uvIntervalBytes);
                            result = uvIntervalId;
                            result1 = uvIntervalBytes.length;
                        } else {
                            result = 0;
                            result1 = 0;
                        }
                        const isSome4 = feelsLike != null;
                        const isSome5 = humidity != null;
                        const isSome6 = seaWaterTemp != null;
                        const isSome7 = swell != null;
                        const isSome8 = totalSea != null;
                        const isSome9 = swellDirection != null;
                        let result2, result3;
                        if (isSome9) {
                            const swellDirectionBytes = textEncoder.encode(swellDirection);
                            const swellDirectionId = swift.memory.retain(swellDirectionBytes);
                            result2 = swellDirectionId;
                            result3 = swellDirectionBytes.length;
                        } else {
                            result2 = 0;
                            result3 = 0;
                        }
                        const isSome10 = swellPeriod != null;
                        const isSome11 = peakPeriod != null;
                        const isSome12 = precipitationIntensityClassID != null;
                        instance.exports.bjs_JSAggregateForecastDay_init(forecastDateId, forecastDateBytes.length, tMin, tMax, +isSome, isSome ? precipitationProbability : 0.0, weatherTypeID, windDirectionId, windDirectionBytes.length, +isSome1, isSome1 ? windGust : 0, +isSome2, isSome2 ? uvIndex : 0.0, +isSome3, result, result1, +isSome4, isSome4 ? feelsLike : 0.0, +isSome5, isSome5 ? humidity : 0.0, +isSome6, isSome6 ? seaWaterTemp : 0.0, +isSome7, isSome7 ? swell : 0.0, +isSome8, isSome8 ? totalSea : 0.0, +isSome9, result2, result3, +isSome10, isSome10 ? swellPeriod : 0.0, +isSome11, isSome11 ? peakPeriod : 0.0, +isSome12, isSome12 ? precipitationIntensityClassID : 0);
                        const structValue = structHelpers.JSAggregateForecastDay.lift();
                        return structValue;
                    },
                },
                JSHourlyForecastPeriod: {
                    init: function(forecastDate, periodType, tMed, humidity, feelsLike, windSpeed, weatherTypeID, windDirection, precipitationProbability, precipitationIntensityClassID) {
                        const forecastDateBytes = textEncoder.encode(forecastDate);
                        const forecastDateId = swift.memory.retain(forecastDateBytes);
                        const isSome = humidity != null;
                        const isSome1 = feelsLike != null;
                        const isSome2 = windSpeed != null;
                        const windDirectionBytes = textEncoder.encode(windDirection);
                        const windDirectionId = swift.memory.retain(windDirectionBytes);
                        const isSome3 = precipitationProbability != null;
                        const isSome4 = precipitationIntensityClassID != null;
                        instance.exports.bjs_JSHourlyForecastPeriod_init(forecastDateId, forecastDateBytes.length, periodType, tMed, +isSome, isSome ? humidity : 0.0, +isSome1, isSome1 ? feelsLike : 0.0, +isSome2, isSome2 ? windSpeed : 0.0, weatherTypeID, windDirectionId, windDirectionBytes.length, +isSome3, isSome3 ? precipitationProbability : 0.0, +isSome4, isSome4 ? precipitationIntensityClassID : 0);
                        const structValue = structHelpers.JSHourlyForecastPeriod.lift();
                        return structValue;
                    },
                },
                JSAllLocationsForecastEntry: {
                    init: function(locationID, precipitaProb, tMin, tMax, windDirection, weatherTypeID, windSpeedClassID, precipitationClassID, latitude, longitude) {
                        const isSome = precipitaProb != null;
                        const windDirectionBytes = textEncoder.encode(windDirection);
                        const windDirectionId = swift.memory.retain(windDirectionBytes);
                        const isSome1 = weatherTypeID != null;
                        const isSome2 = windSpeedClassID != null;
                        const isSome3 = precipitationClassID != null;
                        instance.exports.bjs_JSAllLocationsForecastEntry_init(locationID, +isSome, isSome ? precipitaProb : 0.0, tMin, tMax, windDirectionId, windDirectionBytes.length, +isSome1, isSome1 ? weatherTypeID : 0, +isSome2, isSome2 ? windSpeedClassID : 0, +isSome3, isSome3 ? precipitationClassID : 0, latitude, longitude);
                        const structValue = structHelpers.JSAllLocationsForecastEntry.lift();
                        return structValue;
                    },
                },
                JSDailyForecastResult: {
                    init: function(owner, country, locationID, dataUpdate, entries) {
                        const ownerBytes = textEncoder.encode(owner);
                        const ownerId = swift.memory.retain(ownerBytes);
                        const countryBytes = textEncoder.encode(country);
                        const countryId = swift.memory.retain(countryBytes);
                        const dataUpdateBytes = textEncoder.encode(dataUpdate);
                        const dataUpdateId = swift.memory.retain(dataUpdateBytes);
                        for (const elem of entries) {
                            structHelpers.JSDailyForecastEntry.lower(elem);
                        }
                        i32Stack.push(entries.length);
                        instance.exports.bjs_JSDailyForecastResult_init(ownerId, ownerBytes.length, countryId, countryBytes.length, locationID, dataUpdateId, dataUpdateBytes.length);
                        const structValue = structHelpers.JSDailyForecastResult.lift();
                        return structValue;
                    },
                },
                JSDailyForecastEntry: {
                    init: function(forecastDate, tMin, tMax, precipitaProb, weatherTypeID, windDirection, windSpeedClassID, latitude, longitude) {
                        const forecastDateBytes = textEncoder.encode(forecastDate);
                        const forecastDateId = swift.memory.retain(forecastDateBytes);
                        const isSome = precipitaProb != null;
                        const isSome1 = weatherTypeID != null;
                        const windDirectionBytes = textEncoder.encode(windDirection);
                        const windDirectionId = swift.memory.retain(windDirectionBytes);
                        const isSome2 = windSpeedClassID != null;
                        instance.exports.bjs_JSDailyForecastEntry_init(forecastDateId, forecastDateBytes.length, tMin, tMax, +isSome, isSome ? precipitaProb : 0.0, +isSome1, isSome1 ? weatherTypeID : 0, windDirectionId, windDirectionBytes.length, +isSome2, isSome2 ? windSpeedClassID : 0, latitude, longitude);
                        const structValue = structHelpers.JSDailyForecastEntry.lift();
                        return structValue;
                    },
                },
                JSWeatherWarning: {
                    init: function(id, text, awarenessTypeName, warningAreaID, startTime, endTime, awarenessLevelID, level) {
                        const idBytes = textEncoder.encode(id);
                        const idId = swift.memory.retain(idBytes);
                        const textBytes = textEncoder.encode(text);
                        const textId = swift.memory.retain(textBytes);
                        const awarenessTypeNameBytes = textEncoder.encode(awarenessTypeName);
                        const awarenessTypeNameId = swift.memory.retain(awarenessTypeNameBytes);
                        const warningAreaIDBytes = textEncoder.encode(warningAreaID);
                        const warningAreaIDId = swift.memory.retain(warningAreaIDBytes);
                        const startTimeBytes = textEncoder.encode(startTime);
                        const startTimeId = swift.memory.retain(startTimeBytes);
                        const endTimeBytes = textEncoder.encode(endTime);
                        const endTimeId = swift.memory.retain(endTimeBytes);
                        const awarenessLevelIDBytes = textEncoder.encode(awarenessLevelID);
                        const awarenessLevelIDId = swift.memory.retain(awarenessLevelIDBytes);
                        const isSome = level != null;
                        let result, result1;
                        if (isSome) {
                            const levelBytes = textEncoder.encode(level);
                            const levelId = swift.memory.retain(levelBytes);
                            result = levelId;
                            result1 = levelBytes.length;
                        } else {
                            result = 0;
                            result1 = 0;
                        }
                        instance.exports.bjs_JSWeatherWarning_init(idId, idBytes.length, textId, textBytes.length, awarenessTypeNameId, awarenessTypeNameBytes.length, warningAreaIDId, warningAreaIDBytes.length, startTimeId, startTimeBytes.length, endTimeId, endTimeBytes.length, awarenessLevelIDId, awarenessLevelIDBytes.length, +isSome, result, result1);
                        const structValue = structHelpers.JSWeatherWarning.lift();
                        return structValue;
                    },
                },
                JSSeaForecastEntry: {
                    init: function(locationID, wavePeriodMin, wavePeriodMax, waveHighMin, waveHighMax, waveDirection, totalSeaMin, totalSeaMax, sstMin, sstMax, latitude, longitude) {
                        const isSome = wavePeriodMin != null;
                        const isSome1 = wavePeriodMax != null;
                        const isSome2 = waveHighMin != null;
                        const isSome3 = waveHighMax != null;
                        const waveDirectionBytes = textEncoder.encode(waveDirection);
                        const waveDirectionId = swift.memory.retain(waveDirectionBytes);
                        const isSome4 = totalSeaMin != null;
                        const isSome5 = totalSeaMax != null;
                        const isSome6 = sstMin != null;
                        const isSome7 = sstMax != null;
                        instance.exports.bjs_JSSeaForecastEntry_init(locationID, +isSome, isSome ? wavePeriodMin : 0.0, +isSome1, isSome1 ? wavePeriodMax : 0.0, +isSome2, isSome2 ? waveHighMin : 0.0, +isSome3, isSome3 ? waveHighMax : 0.0, waveDirectionId, waveDirectionBytes.length, +isSome4, isSome4 ? totalSeaMin : 0.0, +isSome5, isSome5 ? totalSeaMax : 0.0, +isSome6, isSome6 ? sstMin : 0.0, +isSome7, isSome7 ? sstMax : 0.0, latitude, longitude);
                        const structValue = structHelpers.JSSeaForecastEntry.lift();
                        return structValue;
                    },
                },
                JSSeismicEvent: {
                    init: function(time, location, latitude, longitude, magnitude, magnitudeType, degree, depth, dataUpdate, obsRegion, source, shakemapID) {
                        const timeBytes = textEncoder.encode(time);
                        const timeId = swift.memory.retain(timeBytes);
                        const isSome = location != null;
                        let result, result1;
                        if (isSome) {
                            const locationBytes = textEncoder.encode(location);
                            const locationId = swift.memory.retain(locationBytes);
                            result = locationId;
                            result1 = locationBytes.length;
                        } else {
                            result = 0;
                            result1 = 0;
                        }
                        const latitudeBytes = textEncoder.encode(latitude);
                        const latitudeId = swift.memory.retain(latitudeBytes);
                        const longitudeBytes = textEncoder.encode(longitude);
                        const longitudeId = swift.memory.retain(longitudeBytes);
                        const magnitudeBytes = textEncoder.encode(magnitude);
                        const magnitudeId = swift.memory.retain(magnitudeBytes);
                        const isSome1 = magnitudeType != null;
                        let result2, result3;
                        if (isSome1) {
                            const magnitudeTypeBytes = textEncoder.encode(magnitudeType);
                            const magnitudeTypeId = swift.memory.retain(magnitudeTypeBytes);
                            result2 = magnitudeTypeId;
                            result3 = magnitudeTypeBytes.length;
                        } else {
                            result2 = 0;
                            result3 = 0;
                        }
                        const isSome2 = degree != null;
                        let result4, result5;
                        if (isSome2) {
                            const degreeBytes = textEncoder.encode(degree);
                            const degreeId = swift.memory.retain(degreeBytes);
                            result4 = degreeId;
                            result5 = degreeBytes.length;
                        } else {
                            result4 = 0;
                            result5 = 0;
                        }
                        const isSome3 = depth != null;
                        const dataUpdateBytes = textEncoder.encode(dataUpdate);
                        const dataUpdateId = swift.memory.retain(dataUpdateBytes);
                        const isSome4 = obsRegion != null;
                        let result6, result7;
                        if (isSome4) {
                            const obsRegionBytes = textEncoder.encode(obsRegion);
                            const obsRegionId = swift.memory.retain(obsRegionBytes);
                            result6 = obsRegionId;
                            result7 = obsRegionBytes.length;
                        } else {
                            result6 = 0;
                            result7 = 0;
                        }
                        const isSome5 = source != null;
                        let result8, result9;
                        if (isSome5) {
                            const sourceBytes = textEncoder.encode(source);
                            const sourceId = swift.memory.retain(sourceBytes);
                            result8 = sourceId;
                            result9 = sourceBytes.length;
                        } else {
                            result8 = 0;
                            result9 = 0;
                        }
                        const isSome6 = shakemapID != null;
                        let result10, result11;
                        if (isSome6) {
                            const shakemapIDBytes = textEncoder.encode(shakemapID);
                            const shakemapIDId = swift.memory.retain(shakemapIDBytes);
                            result10 = shakemapIDId;
                            result11 = shakemapIDBytes.length;
                        } else {
                            result10 = 0;
                            result11 = 0;
                        }
                        instance.exports.bjs_JSSeismicEvent_init(timeId, timeBytes.length, +isSome, result, result1, latitudeId, latitudeBytes.length, longitudeId, longitudeBytes.length, magnitudeId, magnitudeBytes.length, +isSome1, result2, result3, +isSome2, result4, result5, +isSome3, isSome3 ? depth : 0, dataUpdateId, dataUpdateBytes.length, +isSome4, result6, result7, +isSome5, result8, result9, +isSome6, result10, result11);
                        const structValue = structHelpers.JSSeismicEvent.lift();
                        return structValue;
                    },
                },
                JSFireRiskEntry: {
                    init: function(dico, riskLevel, riskDescriptionPT, riskDescriptionEN, latitude, longitude) {
                        const dicoBytes = textEncoder.encode(dico);
                        const dicoId = swift.memory.retain(dicoBytes);
                        const riskDescriptionPTBytes = textEncoder.encode(riskDescriptionPT);
                        const riskDescriptionPTId = swift.memory.retain(riskDescriptionPTBytes);
                        const riskDescriptionENBytes = textEncoder.encode(riskDescriptionEN);
                        const riskDescriptionENId = swift.memory.retain(riskDescriptionENBytes);
                        instance.exports.bjs_JSFireRiskEntry_init(dicoId, dicoBytes.length, riskLevel, riskDescriptionPTId, riskDescriptionPTBytes.length, riskDescriptionENId, riskDescriptionENBytes.length, latitude, longitude);
                        const structValue = structHelpers.JSFireRiskEntry.lift();
                        return structValue;
                    },
                },
                JSUVIndexEntry: {
                    init: function(date, locationID, uvValue, hourInterval, category, categoryDescriptionPT, categoryDescriptionEN) {
                        const dateBytes = textEncoder.encode(date);
                        const dateId = swift.memory.retain(dateBytes);
                        const hourIntervalBytes = textEncoder.encode(hourInterval);
                        const hourIntervalId = swift.memory.retain(hourIntervalBytes);
                        const categoryBytes = textEncoder.encode(category);
                        const categoryId = swift.memory.retain(categoryBytes);
                        const categoryDescriptionPTBytes = textEncoder.encode(categoryDescriptionPT);
                        const categoryDescriptionPTId = swift.memory.retain(categoryDescriptionPTBytes);
                        const categoryDescriptionENBytes = textEncoder.encode(categoryDescriptionEN);
                        const categoryDescriptionENId = swift.memory.retain(categoryDescriptionENBytes);
                        instance.exports.bjs_JSUVIndexEntry_init(dateId, dateBytes.length, locationID, uvValue, hourIntervalId, hourIntervalBytes.length, categoryId, categoryBytes.length, categoryDescriptionPTId, categoryDescriptionPTBytes.length, categoryDescriptionENId, categoryDescriptionENBytes.length);
                        const structValue = structHelpers.JSUVIndexEntry.lift();
                        return structValue;
                    },
                },
                JSStationObservation: {
                    init: function(time, stationID, temperature, humidity, pressure, windSpeedKMH, windSpeedMS, windDirectionID, precipitation, solarRadiation) {
                        const timeBytes = textEncoder.encode(time);
                        const timeId = swift.memory.retain(timeBytes);
                        const isSome = temperature != null;
                        const isSome1 = humidity != null;
                        const isSome2 = pressure != null;
                        const isSome3 = windSpeedKMH != null;
                        const isSome4 = windSpeedMS != null;
                        const isSome5 = windDirectionID != null;
                        const isSome6 = precipitation != null;
                        const isSome7 = solarRadiation != null;
                        instance.exports.bjs_JSStationObservation_init(timeId, timeBytes.length, stationID, +isSome, isSome ? temperature : 0.0, +isSome1, isSome1 ? humidity : 0.0, +isSome2, isSome2 ? pressure : 0.0, +isSome3, isSome3 ? windSpeedKMH : 0.0, +isSome4, isSome4 ? windSpeedMS : 0.0, +isSome5, isSome5 ? windDirectionID : 0, +isSome6, isSome6 ? precipitation : 0.0, +isSome7, isSome7 ? solarRadiation : 0.0);
                        const structValue = structHelpers.JSStationObservation.lift();
                        return structValue;
                    },
                },
                JSStationObservationFeature: {
                    init: function(type, geometry, properties) {
                        const typeBytes = textEncoder.encode(type);
                        const typeId = swift.memory.retain(typeBytes);
                        structHelpers.JSStationObservationGeometry.lower(geometry);
                        structHelpers.JSStationObservationProperties.lower(properties);
                        instance.exports.bjs_JSStationObservationFeature_init(typeId, typeBytes.length);
                        const structValue = structHelpers.JSStationObservationFeature.lift();
                        return structValue;
                    },
                },
                JSStationObservationGeometry: {
                    init: function(type, coordinates) {
                        const typeBytes = textEncoder.encode(type);
                        const typeId = swift.memory.retain(typeBytes);
                        for (const elem of coordinates) {
                            f64Stack.push(elem);
                        }
                        i32Stack.push(coordinates.length);
                        instance.exports.bjs_JSStationObservationGeometry_init(typeId, typeBytes.length);
                        const structValue = structHelpers.JSStationObservationGeometry.lift();
                        return structValue;
                    },
                },
                JSStationObservationProperties: {
                    init: function(time, stationID, stationName, temperature, humidity, pressure, windSpeedKMH, windSpeedMS, windDirectionID, windDirectionDescription, precipitation, solarRadiation) {
                        const timeBytes = textEncoder.encode(time);
                        const timeId = swift.memory.retain(timeBytes);
                        const stationNameBytes = textEncoder.encode(stationName);
                        const stationNameId = swift.memory.retain(stationNameBytes);
                        const isSome = temperature != null;
                        const isSome1 = humidity != null;
                        const isSome2 = pressure != null;
                        const isSome3 = windSpeedKMH != null;
                        const isSome4 = windSpeedMS != null;
                        const isSome5 = windDirectionID != null;
                        const isSome6 = windDirectionDescription != null;
                        let result, result1;
                        if (isSome6) {
                            const windDirectionDescriptionBytes = textEncoder.encode(windDirectionDescription);
                            const windDirectionDescriptionId = swift.memory.retain(windDirectionDescriptionBytes);
                            result = windDirectionDescriptionId;
                            result1 = windDirectionDescriptionBytes.length;
                        } else {
                            result = 0;
                            result1 = 0;
                        }
                        const isSome7 = precipitation != null;
                        const isSome8 = solarRadiation != null;
                        instance.exports.bjs_JSStationObservationProperties_init(timeId, timeBytes.length, stationID, stationNameId, stationNameBytes.length, +isSome, isSome ? temperature : 0.0, +isSome1, isSome1 ? humidity : 0.0, +isSome2, isSome2 ? pressure : 0.0, +isSome3, isSome3 ? windSpeedKMH : 0.0, +isSome4, isSome4 ? windSpeedMS : 0.0, +isSome5, isSome5 ? windDirectionID : 0, +isSome6, result, result1, +isSome7, isSome7 ? precipitation : 0.0, +isSome8, isSome8 ? solarRadiation : 0.0);
                        const structValue = structHelpers.JSStationObservationProperties.lift();
                        return structValue;
                    },
                },
                JSLookupDescription: {
                    init: function(id, descriptionEN, descriptionPT) {
                        const descriptionENBytes = textEncoder.encode(descriptionEN);
                        const descriptionENId = swift.memory.retain(descriptionENBytes);
                        const descriptionPTBytes = textEncoder.encode(descriptionPT);
                        const descriptionPTId = swift.memory.retain(descriptionPTBytes);
                        instance.exports.bjs_JSLookupDescription_init(id, descriptionENId, descriptionENBytes.length, descriptionPTId, descriptionPTBytes.length);
                        const structValue = structHelpers.JSLookupDescription.lift();
                        return structValue;
                    },
                },
                JSClimateDataEntry: {
                    init: function(date, minimum, maximum, range, mean, std) {
                        const dateBytes = textEncoder.encode(date);
                        const dateId = swift.memory.retain(dateBytes);
                        instance.exports.bjs_JSClimateDataEntry_init(dateId, dateBytes.length, minimum, maximum, range, mean, std);
                        const structValue = structHelpers.JSClimateDataEntry.lift();
                        return structValue;
                    },
                },
            };
            _exports = exports;
            return exports;
        },
    }
}