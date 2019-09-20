import tap from "tap"

import Dates from "../lib/Dates.mjs"

tap.test("Monday - friday on a Tuesday", t => {
    let today = new Date(2019, 7, 20, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    t.equal(week.monday.getDate(), 19, `Should be ${week}`)
    t.equal(week.friday.getDate(), 23, `Should be friday ${week.friday}`)
    t.end()
})
tap.test("Monday - friday on a Monday", t => {
    let today = new Date(2019, 7, 19, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    t.equal(week.monday.getDate(), 19, `Should be ${week.monday}`)
    t.equal(week.friday.getDate(), 23, `Should be friday ${week.friday}`)
    t.end()
})

tap.test("Monday - friday on a Friday", t => {
    let today = new Date(2019, 7, 23, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    t.equal(week.monday.getDate(), 19, `Should be ${week.monday}`)
    t.equal(week.friday.getDate(), 23, `Should be friday ${week.friday}`)
    t.end()
})

tap.test("Monday - friday on a Wednesday", t => {
    let today = new Date(2019, 7, 21, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    t.equal(week.monday.getDate(), 19, `Should be ${week.monday}`)
    t.equal(week.friday.getDate(), 23, `Should be friday ${week.friday}`)
    t.end()
})

tap.test("Monday - friday on a Thursday", t => {
    let today = new Date(2019, 7, 22, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    t.equal(week.monday.getDate(), 19, `Should be ${week.monday}`)
    t.equal(week.friday.getDate(), 23, `Should be friday ${week.friday}`)
    t.end()
})

tap.test("Monday - friday on a Saturday", t => {
    let today = new Date(2019, 7, 24, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    t.equal(week.monday.getDate(), 19, `Should be ${week.monday}`)
    t.equal(week.friday.getDate(), 23, `Should be friday ${week.friday}`)
    t.end()
})

tap.test("Monday - friday on a Sunday", t => {
    let today = new Date(2019, 7, 25, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    t.equal(week.monday.getDate(), 26, `Should be ${week.monday}`)
    t.equal(week.friday.getDate(), 30, `Should be friday ${week.friday}`)
    t.end()
})

tap.test("Monday - friday changing months", t => {
    let today = new Date(2019, 8, 30, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    t.equal(week.monday.getDate(), 30, `Should be ${week.monday}`)
    t.equal(week.friday.getDate(), 4, `Should be friday in October ${week.friday}`)
    t.equal(week.friday.getMonth(), 9, "Should be October")
    t.end()
})

tap.test("Monday - friday just the days", t => {
    let today = new Date(2019, 8, 30, 0, 0, 0)
    let days = Dates.weekMondayThruFridayRange(today)
    t.equal(days[0].getDate(), 30)
    t.end()
})

tap.test("Get a list of MONTH DAY", t => {
    let today = new Date(2019, 8, 30, 0, 0, 0)
    let days = Dates.weekMondayThruFridayRange(today)
    days.forEach(d => {
        t.equal(Dates.formatMonthDate(d), `${Dates.MONTHS[d.getMonth()]} ${d.getDate()}`)
    })
    t.end()
})
tap.test("Wednesday - should be wednesday through friday", t => {
    let today = new Date(2019, 8, 18)
    let days = Dates.startDayThruFridayRange(today)
    t.equal(days[0].getDate(), 18)
    t.equal(days[1].getDate(), 19)
    t.equal(days[2].getDate(), 20)
    console.log(days)
    t.end()
})