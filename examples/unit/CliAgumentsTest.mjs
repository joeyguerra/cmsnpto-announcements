import assert from "assert"
import CliArguments from "../../lib/CliArguments.mjs"
it("Should parse a space delimited line", () =>{
    let expected = {
        name: "Test"
    }
    let actual = CliArguments.parse(..."node test --name=Test".split(" "))
    assert.strictEqual(actual.name, expected.name, "Should be an object with a property called name")
})

