import tap from "tap"
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

tap.test("Find month name", t => {
    t.ok(MONTHS[0] == "JAN")
    t.end()
})