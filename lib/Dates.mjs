const Dates = {
    MONTHS: ["JANUARY", "FEBUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"],
    DAYS: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    weekMondayAndFriday(d) {
        let monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay() + 1, 0, 0, 0)
        let friday = new Date(d.getFullYear(), d.getMonth(), monday.getDate() + 4, 0, 0, 0)
        return {monday, friday}
    },
    weekMondayThruFridayRange(d) {
        const week = Dates.weekMondayAndFriday(d)
        const days = []
        days.push(new Date(week.monday.getFullYear(), week.monday.getMonth(), week.monday.getDate(), 0, 0, 0))
        ;[0, 1, 2, 3].forEach(i=>days.push(new Date(week.monday.setDate(week.monday.getDate() + 1))))
        return days
    },
    startDayThruFridayRange(d){
        let today = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
        let friday = 5
        const days = []
        const diff = friday - today.getDay()
        for(let i = 0; i <= diff; i++){
            days.push(new Date(today.getFullYear(), today.getMonth(), d.getDate() + i))
        }
        return days
    },
    formatMonthDate(d) {
        return `${Dates.MONTHS[d.getMonth()]} ${d.getDate()}`
    }
}
export default Dates