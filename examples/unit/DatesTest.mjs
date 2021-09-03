
import Dates from "../../lib/Dates.mjs"
import assert from "assert"

it("Monday - friday on a Tuesday", done => {
    let today = new Date(2019, 7, 20, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    assert.strictEqual(week.monday.getDate(), 19, `Should be ${week}`)
    assert.strictEqual(week.friday.getDate(), 23, `Should be friday ${week.friday}`)
    done()
})
it("Monday - friday on a Monday", done => {
    let today = new Date(2019, 7, 19, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    assert.strictEqual(week.monday.getDate(), 19, `Should be ${week.monday}`)
    assert.strictEqual(week.friday.getDate(), 23, `Should be friday ${week.friday}`)
    done()
})

it("Monday - friday on a Friday", done => {
    let today = new Date(2019, 7, 23, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    assert.strictEqual(week.monday.getDate(), 19, `Should be ${week.monday}`)
    assert.strictEqual(week.friday.getDate(), 23, `Should be friday ${week.friday}`)
    done()
})

it("Monday - friday on a Wednesday", done => {
    let today = new Date(2019, 7, 21, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    assert.strictEqual(week.monday.getDate(), 19, `Should be ${week.monday}`)
    assert.strictEqual(week.friday.getDate(), 23, `Should be friday ${week.friday}`)
    done()
})

it("Monday - friday on a Thursday", done => {
    let today = new Date(2019, 7, 22, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    assert.strictEqual(week.monday.getDate(), 19, `Should be ${week.monday}`)
    assert.strictEqual(week.friday.getDate(), 23, `Should be friday ${week.friday}`)
    done()
})

it("Monday - friday on a Saturday", done => {
    let today = new Date(2019, 7, 24, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    assert.strictEqual(week.monday.getDate(), 19, `Should be ${week.monday}`)
    assert.strictEqual(week.friday.getDate(), 23, `Should be friday ${week.friday}`)
    done()
})

it("Monday - friday on a Sunday", done => {
    let today = new Date(2019, 7, 25, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    assert.strictEqual(week.monday.getDate(), 26, `Should be ${week.monday}`)
    assert.strictEqual(week.friday.getDate(), 30, `Should be friday ${week.friday}`)
    done()
})

it("Monday - friday changing months", done => {
    let today = new Date(2019, 8, 30, 0, 0, 0)
    let week = Dates.weekMondayAndFriday(today)
    assert.strictEqual(week.monday.getDate(), 30, `Should be ${week.monday}`)
    assert.strictEqual(week.friday.getDate(), 4, `Should be friday in October ${week.friday}`)
    assert.strictEqual(week.friday.getMonth(), 9, "Should be October")
    done()
})

it("Monday - friday just the days", done => {
    let today = new Date(2019, 8, 30, 0, 0, 0)
    let days = Dates.weekMondayThruFridayRange(today)
    assert.strictEqual(days[0].getDate(), 30)
    done()
})

it("Get a list of MONTH DAY", done => {
    let today = new Date(2019, 8, 30, 0, 0, 0)
    let days = Dates.weekMondayThruFridayRange(today)
    days.forEach(d => {
        assert.strictEqual(Dates.formatMonthDate(d), `${Dates.MONTHS[d.getMonth()]} ${d.getDate()}`)
    })
    done()
})
it("Wednesday - should be wednesday through friday", done => {
    let today = new Date(2019, 8, 18)
    let days = Dates.startDayThruFridayRange(today)
    assert.strictEqual(days[0].getDate(), 18)
    assert.strictEqual(days[1].getDate(), 19)
    assert.strictEqual(days[2].getDate(), 20)
    console.log(days)
    done()
})