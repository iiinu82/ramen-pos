import { describe, test, expect } from "vitest";
import { getDayRange, getMonthRange } from "./dateRange";

// Date を [年, 月, 日, 時] の配列にして、比べやすくする（今いる場所の時間で見る）
const ymdh = (d) => [
  d.getFullYear(),
  d.getMonth() + 1,
  d.getDate(),
  d.getHours(),
];

describe("getDayRange(1日の範囲)", () => {
  test("その日の0時から、翌日の0時まで", () => {
    const { start, end } = getDayRange("2026-10-12");
    expect(ymdh(start)).toEqual([2026, 10, 12, 0]);
    expect(ymdh(end)).toEqual([2026, 10, 13, 0]);
  });

  test("月末の翌日は、翌月の1日になる", () => {
    expect(ymdh(getDayRange("2026-10-31").end)).toEqual([2026, 11, 1, 0]);
  });

  test("年末の翌日は、翌年の1月1日になる", () => {
    expect(ymdh(getDayRange("2026-12-31").end)).toEqual([2027, 1, 1, 0]);
  });

  test("うるう年の2月は、29日がある", () => {
    expect(ymdh(getDayRange("2024-02-28").end)).toEqual([2024, 2, 29, 0]);
    expect(ymdh(getDayRange("2024-02-29").end)).toEqual([2024, 3, 1, 0]);
  });
});

describe("getMonthRange(1か月の範囲)", () => {
  test("その月の1日の0時から、翌月の1日の0時まで", () => {
    const { start, end } = getMonthRange("2026-10");
    expect(ymdh(start)).toEqual([2026, 10, 1, 0]);
    expect(ymdh(end)).toEqual([2026, 11, 1, 0]);
  });

  test("12月の翌月は、翌年の1月になる", () => {
    expect(ymdh(getMonthRange("2026-12").end)).toEqual([2027, 1, 1, 0]);
  });

  test("2月の翌月は、うるう年でも平年でも、3月1日になる", () => {
    expect(ymdh(getMonthRange("2024-02").end)).toEqual([2024, 3, 1, 0]);
    expect(ymdh(getMonthRange("2026-02").end)).toEqual([2026, 3, 1, 0]);
  });
});
