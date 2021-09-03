import assert from "assert"
import MembershipToolKit from "../MembershipToolKit.mjs"

it.skip("Should login to MTK", async ()=>{
    let res = await MembershipToolKit.login({email: process.env.email, password: process.env.password}, "https://cmsnpto.membershiptoolkit.com/login-form", async ()=>{
        console.log("done")
    })
    const actual = res.cookie.find(c => c.AWSALB)
    console.log(actual)
    assert.ok(actual != null)
})

// 
// handleSelectTemplateClick('nl:02223-NL20210902071609-084932800-795156198');
// function handleSelectTemplateClick(id) {
// 	var $form = $('#select_template_modal_form');
// 	var $hiddenId = $('#select_template_nl_id');

// 	$hiddenId.val(id);

// 	$form.submit();
// } // handleSelectTemplateClick

/*
form fields to submit to dashboard/newsletters/setup/new

    name = action
    value = new
    subject = ""
    nl_id = nl:02223-NL20210902071609-084932800-795156198

*/

