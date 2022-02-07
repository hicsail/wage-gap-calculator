/* * * * * * * */
/*  CONSTANTS  */
/* * * * * * * */

const urlParams = new URLSearchParams(window.location.search);
// categories to compare white male salary to
const categories = [{name: "Hispanic/Latinx", code: "hisp"}, {name: "White", code: "white"}, {name: "Black/African American", code: "afr"},
    {name: "Native Hawaiian or Pacific Islander", code: "hawaii"}, {name: "Asian", code: "asian"}, {name: "American Indian/Alaska Native", code: "ind"},
    {name: "Two or More Races (Not Hispanic or Latinx)", code: "two"}, {name: "Unreported", code: "unr"}];
// const categories = ["Hispanic/Latinx", "White", "Black/African American", "Native Hawaiian or Pacific Islander",
//     "Asian", "American Indian/Alaska Native", "Two or More Races (Not Hispanic or Latinx)", "Unreported"];

// POTENTIAL ERROR MESSAGES:
const NO_COMP_F = "Please enter the average total compensation for women (Section 1)";
const NO_COMP_M = "Please enter the average total compensation for men (Section 1)";
const NO_COMP_W = "Please enter the average total compensation for white employees (Section 2)";
const NO_COMP_NW = "Please enter the average total compensation for employees of color (Section 2)";
const NO_COMP_W2 = "Please enter the average total compensation for white employees to compare (Section 3)";
const NO_CAT = "Please select a category to compare to (Section 3)";
const NO_COMP_VAL = "Please enter the average total compensation for your selected category (Section 3)";

/* * * * * * */
/*  HELPERS  */
/* * * * * * */

// create nested headers for combined tables
function createNestedTableHeaders() {
    let header1 = `<tr><th scope="col"></th>`;
    let header2 = `<tr><th scope="col"></th>`;
    for (let i=0; i < categories.length; i++) {
        const cat = categories[i];
        header1 += `<th scope="col" colspan="2">${cat.name}</th>`;
        header2 += `<th scope="col">Female</th><th scope="col">Male</th>`;
    }

    return header1 + header2;
}

// create table of inputs for combined section
function createInputTable() {
    $('#headers').append(createNestedTableHeaders());
    $('#table-body').append(`<th scope="row">Average Annual Compensation</th>`);
    for (let i=0; i < categories.length; i++) {
        const cat = categories[i];
        $('#table-body').append(`<td><input type="text" id="${cat.code}F" name="${cat.code}F" pattern="^\\$\\d{1,3}(,\\d{3})*(\\.\\d+)?$"
                                                       value="" data-type="currency" placeholder="$100,000.00"></td>`)
            .append(`<td><input type="text" id="${cat.code}M" name="${cat.code}M" pattern="^\\$\\d{1,3}(,\\d{3})*(\\.\\d+)?$"
                                                       value="" data-type="currency" placeholder="$100,000.00"></td>`);
    }
}

// format table body for binary inputs
function formatBody(data) {
    let newRow = ``;
    for (let key of Object.keys(data['Your Results'])) {
        newRow += `<tr>\n<th scope="row" style="width: 33.33%">${key}</th>\n`; // row header
        newRow += `<td style="width: 33.33%">${data['Your Results'][key]}</td>`; // your val
        newRow += `<td style="width: 33.33%">${data['Compare to Report'][key]}</td>`; // report val
        newRow += '</tr>\n';
    }
    return newRow;
}

// format table body for table inputs
function formatCombinedBody(data) {
    let yourRow = `<tr>\n<th scope="row">Your Gap</th>\n`;
    let compRow = `<tr>\n<th scope="row">Compare to Report</th>\n`;
    let inputCodes = categories.flatMap(obj => [`${obj.code}F`, `${obj.code}M`]);
    for (let code of inputCodes) {
        if (code in data) {
            yourRow += `<td>${data[code]}</td>`; // your val
        }
        compRow += `<td>0</td>`; // comp val
    }

    yourRow += '</tr>\n';
    compRow += '</tr>\n';

    return yourRow+compRow;

}

// format data for table inputs
function formatCombinedData(compWM) {
    let inputCodes = categories.flatMap(obj => [`${obj.code}F`, `${obj.code}M`]);
    let inputs = inputCodes.map(code => $(`#${code}`).val());
    let filled = inputs.map(val => val !== "");

    let gaps = {};
    for (let i = 0; i < inputs.length; i++) {
        gaps[inputCodes[i]] = "-";
        if (filled[i]) {
            let compCat = (Number(inputs[i].replace(/[^0-9.-]+/g,"")));
            let min = Math.min(compWM, compCat);
            let max = Math.max(compWM, compCat);
            gaps[inputCodes[i]] = 1 - min/max;
        }
    }

    return gaps;
}

// format table for table inputs
function formatCombinedTable(compWM) {
    let data = formatCombinedData(Number(compWM.replace(/[^0-9.-]+/g,"")));
    let header = createNestedTableHeaders();
    let body = formatCombinedBody(data);

    let newTable = `
      <div class="table-wrapper wrapper">
        <table class="compare-table inner table-hover table-bordered">
          <thead>
          ${header}
          </thead>
          <tbody>
          ${body}
          </tbody>
      </table>
      </div>
    `;

    $('#res-tables').append(newTable);
}

// format data for binary inputs
function formatData(comp1, comp2, labels) {
    let min = Math.min(comp1, comp2);
    let max = Math.max(comp1, comp2);
    let gap = 1 - min/max;

    let vals = [comp1, comp2, gap];
    let keys = [`Avg. total compensation (${labels[0]})`, `Avg. total compensation (${labels[1]})`, 'Raw Wage Gap'];

    let res = {'Your Results': {}, 'Compare to Report': {}};

    for (let i=0; i < keys.length; i++) {
        let k = keys[i];
        res['Your Results'][k] = vals[i];
        res['Compare to Report'][k] = 0;
    }

    return res;

    // return format {'Your Results': {'Avg. total compensation (female)': compF, 'Avg. total compensation (male)': compM, 'Raw Wage Gap': gap},
    //     'Combined Results': {'Avg. total compensation (female)': compF, 'Avg. total compensation (male)': compM, 'Raw Wage Gap': gap}}
}

// format headers for binary-input tables
function formatHeader(headerNames) {
    let newRow = `<tr>\n<th scope="col"></th>\n`;
    for (let h of headerNames) {
        newRow += `<th scope="col">${h}</th>\n`
    }
    newRow += '</tr>';
    return newRow;
}

// format tables for binary inputs
function formatTable(comp1, comp2, labels) {
    let data = formatData(Number(comp1.replace(/[^0-9.-]+/g,"")), Number(comp2.replace(/[^0-9.-]+/g,"")), labels);
    let header = formatHeader(Object.keys(data));
    let body = formatBody(data);

    let newTable = `
      <table class="table table-hover table-bordered">
        <thead>
        ${header}
        </thead>
        <tbody>
        ${body}
        </tbody>
      </table>
    `;

    $('#res-tables').append(newTable);
}

// Currency formatting from:
// https://codepen.io/akalkhair/pen/dyPaozZ
function formatNumber(n) {
    // format number 1000000 to 1,234,567
    return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function formatCurrency(input, blur) {
    // appends $ to value, validates decimal side
    // and puts cursor back in right position.

    // get input value
    var input_val = input.val();
    // console.log(input_val);

    // don't validate empty input
    if (input_val === "") { return; }

    // original length
    var original_len = input_val.length;

    // initial caret position
    var caret_pos = input.prop("selectionStart");

    // check for decimal
    if (input_val.indexOf(".") >= 0) {

        // get position of first decimal
        // this prevents multiple decimals from
        // being entered
        var decimal_pos = input_val.indexOf(".");

        // split number by decimal point
        var left_side = input_val.substring(0, decimal_pos);
        var right_side = input_val.substring(decimal_pos);

        // add commas to left side of number
        left_side = formatNumber(left_side);

        // validate right side
        right_side = formatNumber(right_side);

        // On blur make sure 2 numbers after decimal
        if (blur === "blur") {
            right_side += "00";
        }

        // Limit decimal to only 2 digits
        right_side = right_side.substring(0, 2);

        // join number by .
        input_val = "$" + left_side + "." + right_side;

    } else {
        // no decimal entered
        // add commas to number
        // remove all non-digits
        input_val = formatNumber(input_val);
        input_val = "$" + input_val;

        // final formatting
        if (blur === "blur") {
            input_val += ".00";
        }
    }

    // send updated string to input
    input.val(input_val);

    // put caret back in the right position
    var updated_len = input_val.length;
    caret_pos = updated_len - original_len + caret_pos;
    input[0].setSelectionRange(caret_pos, caret_pos);
}

// used in HTML for Google translate
// from: https://stackoverflow.com/questions/57254664/how-to-translate-whole-page-text-content-in-js-with-google-translate-api
function googleTranslateElementInit() {
    new google.translate.TranslateElement({pageLanguage: 'en', includedLanguages: 'zh-CN,cs,da,nl,en,et,fr'}, 'google_translate_element');
}

// toggle help section (when clicking the info icon)
function showHelp(id) {
    let helpId = id+'-help';
    $(`#${helpId}`).toggle();
}

// make sure either both inputs or neither input is filled for binary sections
function validateBinaryInputs(comp1, comp2, section) {
    if (comp1 === "" ^ comp2 === "") { // need both or neither to be filled (XOR)
        $('#error-text').html(`Please fill out both fields in Section ${section} or leave them both blank`);
        $('#error').removeClass('hidden');
        return {display: false, valid: false};
    }

    if (comp1 === "" && comp2 === "") { // don't display table if nothing entered
        return {display: false, valid: true};
    }
    return {display: true, valid: true};
}

// make sure table and white male input are either both empty or both filled
function validateTableInputs(compWM) {
    let inputCodes = categories.flatMap(obj => [`${obj.code}F`, `${obj.code}M`]);
    let inputs = inputCodes.map(code => $(`#${code}`).val());
    let allBlank = inputs.every(val => val === "");
    let anyFilled = inputs.some(val => val !== "");

    if ((compWM === "" && anyFilled) || (compWM !== "" && allBlank)) { // need both or neither to be filled (XOR)
        $('#error-text').html(`Please fill out both fields in Section 3 or leave them both blank`);
        $('#error').removeClass('hidden');
        return {display: false, valid: false};
    }

    if (compWM === "" && allBlank) { // don't display table if nothing entered
        return {display: false, valid: true};
    }
    return {display: true, valid: true};
}

/* * * * * * */
/*  BROWSER  */
/* * * * * * */
$(document).ready(function() {
    // $("#results").show();
    $("#data-entry").show(); // show calculator first

    // fill out headers and cells in input table
    createInputTable();

    $("input[data-type='currency']").on({
        keyup: function() {
            formatCurrency($(this));
        },
        blur: function() {
            formatCurrency($(this), "blur");
        }
    });

    $("#back").click(function () {
        $("#results").hide();
        $("#data-entry").show();
    });

    $('#submit').click(function () {
        let [compF, compM, compW, compNW, compWM] = [$('#comp-f').val(), $('#comp-m').val(), $('#comp-w').val(), $('#comp-nw').val(), $('#comp-wm').val()];
        // check right number of inputs are present
        let validGenderInputs = validateBinaryInputs(compF, compM, 1);
        let validRacialInputs = validateBinaryInputs(compNW, compW, 2);
        let validTableInputs = validateTableInputs(compWM);
        if (validGenderInputs.valid &&
            validRacialInputs.valid &&
            validTableInputs.valid
        ) {
            $('#error').addClass('hidden');

            $('#res-tables').empty();
            // add section for gender gap results
            if (validGenderInputs.display) {
                $('#res-tables').append(`<h5>Raw Gender Wage Gap</h5>`);
                formatTable(compF, compM, ['female', 'male']);
            }

            // add section for racial gap rseults
            if (validRacialInputs.display) {
                $('#res-tables').append(`<h5>Raw Racial Wage Gap</h5>`);
                formatTable(compW, compNW, ['white employees', 'employees of color']);
            }

            // add section for combined gap rseults
            if (validTableInputs.display) {
                $('#res-tables').append(`<h5>Combined Raw Gender and Racial Wage Gap</h5>`);
                formatCombinedTable(compWM);
            }

            // toggle collapsible sections to hide calculator and show results
            $("#data-entry").hide();
            $("#results").show();

        }
    });



});
