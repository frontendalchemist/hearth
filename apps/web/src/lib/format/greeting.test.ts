import { describe, expect, it } from "vitest"
import { timeOfDayGreeting } from "./greeting"

function at(hour: number): Date {
  const d = new Date("2026-05-07T00:00:00")
  d.setHours(hour, 0, 0, 0)
  return d
}

describe("timeOfDayGreeting", () => {
  it("greets morning before noon", () => {
    expect(timeOfDayGreeting(at(0))).toBe("Good morning")
    expect(timeOfDayGreeting(at(11))).toBe("Good morning")
  })

  it("greets afternoon from noon to 5pm", () => {
    expect(timeOfDayGreeting(at(12))).toBe("Good afternoon")
    expect(timeOfDayGreeting(at(17))).toBe("Good afternoon")
  })

  it("greets evening from 6pm onward", () => {
    expect(timeOfDayGreeting(at(18))).toBe("Good evening")
    expect(timeOfDayGreeting(at(23))).toBe("Good evening")
  })
})
