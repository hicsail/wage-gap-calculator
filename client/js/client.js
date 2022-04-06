/* * * * * * * */
/*  CONSTANTS  */
/* * * * * * * */

const urlParams = new URLSearchParams(window.location.search);
let BASE_URL = "http://localhost:8080"; //use locally
// let BASE_URL = "http://" + window.location.host + ":8080"; // use on MOC/other server
// categories to compare white male salary to
const categories = [{name: "HISPANIC/LATINX", code: "hisp", label:"Hispanic/Latinx Female"}, {name: "WHITE", code: "white", label: "White Female"},
    {name: "BLACK/AFRICAN AMERICAN", code: "afr", label: "Black/African American Female"},
    {name: "NATIVE HAWAIIAN OR PACIFIC ISLANDER", code: "hawaii", label: "Native Hawaiian or Pacific Islander Female"},
    {name: "ASIAN", code: "asian", label: "Asian Female"}, {name: "AMERICAN INDIAN/ALASKA NATIVE", code: "ind", label: "American Indian/Alaska Native Female"},
    {name: "TWO OR MORE RACES (NOT HISPANIC OR LATINX)", code: "two", label: "Two or More Races (Not Hispanic or Latinx) Female"},
    {name: "UNREPORTED", code: "unr", label: "Unreported Female"}];

// used to format numbers into currency strings (doesn't work for string to string)
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

let report; // will hold the BWWC report json file
let wb = XLSX.utils.book_new(); // workbook to add sheets to for the excel export

// window.jsPDF = window.jspdf.jsPDF;

/* * * * * * */
/*  HELPERS  */
/* * * * * * */

// create a dictionary for the combined table inputs of the form {inputCode: input in number form or '-' if empty}
function constructCombinedCompDict() {
    let compDict = {};
    for (let c of categories) {
        compDict[c.label] = "-";
        if ($(`#${c.code}`).val() !== "") {
            compDict[c.label] = Number($(`#${c.code}`).val().replace(/[^0-9.-]+/g,""))
        }
    }

    return compDict;
}

// creates the input section for the combined gender and racial section
function createCombinedSectionInputs() {
    let section = ``;
    let row = ``;

    for (let i = 0; i < categories.length; i++) {
        let cat = categories[i];
        if (i%2 === 0) { // create new row
            // let row = `<div class="row">`;
            let col = `<div class="col-sm">
                        <label for="${cat.code}">${cat.name} FEMALE</label><br>
                        <input type="text" id="${cat.code}" name="${cat.code}" pattern="^\\$\\d{1,3}(,\\d{3})*(\\.\\d+)?$" 
                            value="" data-type="currency" placeholder="$100,000.00">
                       </div>`;
            row = `<div class="row table-row">${col}`;
        } else { // add to existing row and close it
            let col = `<div class="col-sm">
                        <label for="hispF">${cat.name} FEMALE</label><br>
                        <input type="text" id="${cat.code}" name="${cat.code}" pattern="^\\$\\d{1,3}(,\\d{3})*(\\.\\d+)?$" 
                            value="" data-type="currency" placeholder="$100,000.00">
                       </div>`;
            row += `${col}</div>`; // add the second column and close the row you're working on

            // add the row to the section and clear the row variable
            section += row;
            row = ``
        }
    }

    $('#combined-inputs').append(section);
}

// make options for translation modal
function createTranslationOptions() {
    fetch("assets/languages.json")
        .then(response => {
            return response.json();
        })
        .then(languages => {
            for (let i = 0; i < languages.length; i++) {
                let lang = languages[i];
                // create select option in UI
                let option = `<li><a class="btn lang-link" id="${lang.code}" rel="${lang.code}">${lang.language}</a></li>`;
                if (i <= (languages.length/2)) { // split into 2 columns
                    $('#translate-col1').append(option);
                } else {
                    $('#translate-col2').append(option);
                }
            }
        });
}

// from: https://codepedia.info/javascript-export-html-table-data-to-excel and https://community.retool.com/t/add-multiple-sheets-to-exported-xlsx/6108/3
// uses SheetJS (CDN in HTML)
function exportToExcel({filename=null, id=null, sheetName=null, download=false} = {}) {
    if (id) {
        // get the table element
        var elt = document.getElementById(id);

        // make the sheet
        var ws = XLSX.utils.table_to_sheet(elt);

        // add to workbook (workbook (wb) is a constant defined at the top of the file)
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
    return download ? XLSX.writeFile(wb, filename || 'MySheetName.xlsx') : null;
}

function exportToPDF() {
    var w = document.getElementById("res-collapse").offsetWidth;
    var h = document.getElementById("res-collapse").offsetHeight;
    html2canvas(document.getElementById("res-collapse")).then(function(canvas) {
        var img = canvas.toDataURL("image/jpeg", 1);
        var doc = new jspdf.jsPDF({
            unit: 'px',
            format: 'a4',
            orientation: 'portrait'
        });
        // var doc = new jsPDF('p', 'px', [w, h]);
        doc.addImage(img, 'JPEG', 0, 0, w, h);
        doc.save('sample-file.pdf');
    });
}

// to trigger Google translate without using Google translate UI
// from: https://stackoverflow.com/questions/6303021/trigger-google-web-translate-element
function fireEvent(element, event){
    console.log("in Fire Event");
    if (document.createEventObject){
        // dispatch for IE
        console.log("in IE FireEvent");
        var evt = document.createEventObject();
        return element.fireEvent('on'+event, evt)
    }
    else {
        // dispatch for firefox + others
        console.log("In HTML5 dispatchEvent");
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true ); // event type,bubbling,cancelable
        return !element.dispatchEvent(evt);
    }
}

// format table body for binary inputs
function formatBody(data) {
    let newRow = ``;
    for (let i = 0; i < Object.keys(data['Your Results']).length; i++) {
        let key = Object.keys(data['Your Results'])[i];
        let rowStyle = "";
        if (i%2 === 1 && i < Object.keys(data['Your Results']).length - 1) {
            rowStyle = "border-bottom:5px solid #dee2e6"
        }
        newRow += `<tr style="${rowStyle}">\n<th scope="row" style="border-left: hidden;">${key}</th>\n`; // row header
        if (isNaN(data['Your Results'][key])) {
            newRow += `<td>-</td>`; // null val
        } else {
            newRow += `<td>${formatter.format(data['Your Results'][key])}</td>`; // your val
        }
        newRow += `<td>${formatter.format(data['2021 BWWC Report'][key])}</td>`; // report val
        newRow += '</tr>\n';
    }
    return newRow;
}

// format data for binary inputs
function formatData(compDict, compareValue, display) {
    let res = {'Your Results': {}, '2021 BWWC Report': {}};
    for (let label of Object.keys(compDict)) {
        if (display) { // only fill in value with gap if there is a number for the comp
            res['Your Results'][`${label} Avg. Total Compensation`] = compDict[label];
            res['Your Results'][`${label} Wage Gap`] = 1 - compDict[label]/compareValue;
        } else {
            res['Your Results'][`${label} Avg. Total Compensation`] = '-';
            res['Your Results'][`${label} Wage Gap`] = '-';
        }
        res['2021 BWWC Report'][`${label} Avg. Total Compensation`] = report[`${label} Avg. Total Compensation`];
        res['2021 BWWC Report'][`${label} Wage Gap`] = report[`${label} Wage Gap`];
    }

    return res;
}

// format headers for binary input tables
function formatHeader(headerNames) {
    let newRow = `<tr>\n<th style="border-top: hidden; border-left: hidden" scope="col"></th>\n`;
    for (let h of headerNames) {
        newRow += `<th style="border-top: hidden; text-align: right;" scope="col">${h}</th>\n`
    }
    newRow += '</tr>';
    return newRow;
}

// format tables for binary inputs
function formatTable(title, compDict, compareValue, display, tableId) {
    let data = formatData(compDict, compareValue, display);
    let header = formatHeader(Object.keys(data));
    let body = formatBody(data);

    let newTable = `
        <table id="${tableId}" class="table table-striped table-bordered">
          <thead>
          ${header}
          </thead>
          <tbody>
          ${body}
          </tbody>
        </table>
    `;

    return newTable;
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

    if (blur !== "blur") { // moving this to an IF came from: https://stackoverflow.com/questions/56289798/onblur-disables-clicks-outside-input-and-clicking-other-input-on-ios-and-mac-s
        // put caret back in the right position
        var updated_len = input_val.length;
        caret_pos = updated_len - original_len + caret_pos;
        input[0].setSelectionRange(caret_pos, caret_pos);
    }
}

// used in HTML for Google translate
// from: https://stackoverflow.com/questions/57254664/how-to-translate-whole-page-text-content-in-js-with-google-translate-api
function googleTranslateElementInit() {
    new google.translate.TranslateElement({pageLanguage: 'en'}, 'google_translate_element');
}

// loads the json file that holds the BWWC report numbers (stores values in report variable up top)
function loadReport() {
    fetch("assets/report.json")
        .then(response => {
            return response.json();
        })
        .then(data => {
            report = data;
        });
}

// toggle definition modal on results page (when clicking the info icon)
function showDefinitions(event) {
    event.stopPropagation();
    $('#definitions-modal').modal('show')
}

// create the default results page state, showing/hiding tables based on what inputs were provided
function toggleResultTableState(display, headerId, bodyId) {
    if (display) {
        $(headerId).removeClass('collapsed').attr('aria-expanded', true);
        $(bodyId).addClass('show');
    } else {
        $(headerId).addClass('collapsed').attr('aria-expanded', false);
        $(bodyId).removeClass('show');
    }
}

// make sure either both inputs or neither input is filled for binary sections
function validateBinaryInputs(id1, id2, section) {
    // remove error hihglighting
    $(id1).removeClass('input-error');
    $(id2).removeClass('input-error');

    let [comp1, comp2] = [$(id1).val(), $(id2).val()];
    if (comp1 === "" ^ comp2 === "") { // need both or neither to be filled (XOR)
        $('#error-text').html(`Please fill out both fields in Section ${section} or leave them both blank`);
        $('#error').removeClass('hidden');

        // highlight the missing input in red
        if (comp1 === "") {
            $(id1).addClass('input-error');
        } else {
            $(id2).addClass('input-error');
        }

        return {display: false, valid: false};
    }

    // remove error highlighting
    $(id1).removeClass('input-error');
    $(id2).removeClass('input-error');

    if (comp1 === "" && comp2 === "") { // don't display table if nothing entered
        return {display: false, valid: true};
    }
    return {display: true, valid: true};
}

// throw error if there is no email provided
function validateEmail(email) {
    if ((email === "") || (email.indexOf('@') === -1)){
        $('#error-text').html(`Please enter a valid email address`);
        $('#error').removeClass('hidden');
        return false;
    }
    return true;
}

// make sure table and white male input are either both empty or both filled
function validateTableInputs(compWM) {
    let inputCodes = categories.map(obj => obj.code);
    // let inputCodes = categories.flatMap(obj => [`${obj.code}F`, `${obj.code}M`]);
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
    $(".custom_info").tooltip({animation: true}); // allow tooltips
    loadReport(); // load the BWWC report to the constant

    // fill out headers and cells in input table
    createCombinedSectionInputs();

    // create translation option fields in UI and attach click handlers
    createTranslationOptions();
    $('body').on('click', 'a.lang-link', function() {
        // trigger google translate web element
        var value = $(this).attr("rel");
        var jObj = $('.goog-te-combo');
        var db = jObj.get(0);
        jObj.val(value);
        fireEvent(db, 'change');
        return false;

    });

    // format text input as currency while typing
    $("input[data-type='currency']").on({
        keyup: function() {
            formatCurrency($(this));
        },
        blur: function() {
            formatCurrency($(this), "blur");
        }
    });

    // actions for going back from the results page (hide the results section, show the first section, bring back the dark nav)
    $("#back").click(function () {
        $("#results").hide();
        $("#data-entry").show();
        $("#dark-nav").removeClass('hidden');
    });

    // when submitting results
    $('#submit').click(function () {
        $('#warning').addClass('hidden');
        let [compF, compM, compW, compNW, compWM] = [$('#comp-f').val(), $('#comp-m').val(), $('#comp-w').val(), $('#comp-nw').val(), $('#comp-wm').val()];
        let email = $('#email').val();
        // check right number of inputs are present
        let validGenderInputs = validateBinaryInputs("#comp-f", "#comp-m", 1);
        let validRacialInputs = validateBinaryInputs("#comp-nw", "#comp-w", 2);
        let validTableInputs = validateTableInputs(compWM);
        if (validGenderInputs.valid &&
            validRacialInputs.valid &&
            validTableInputs.valid
        ) {

            // if there is nothing to display, don't go to the results page
            if (!validGenderInputs.display &&
                !validRacialInputs.display &&
                !validTableInputs.display
            ) {
                $('#warning').removeClass('hidden');
                return;
            }

            // if there is no email provided, don't go to the results page
            if (!validateEmail(email)) {
                return;
            }

            // hide errors and warning again
            $('#error').addClass('hidden');
            $('#warning').addClass('hidden');


            // convert all currency format strings to numbers
            [compF, compM, compW, compNW, compWM] = [Number(compF.replace(/[^0-9.-]+/g,"")),
                Number(compM.replace(/[^0-9.-]+/g,"")), Number(compW.replace(/[^0-9.-]+/g,"")),
                Number(compNW.replace(/[^0-9.-]+/g,"")), Number(compWM.replace(/[^0-9.-]+/g,""))];

            // toggle initial state of tables based on whether input was provided
            toggleResultTableState(validGenderInputs.display, '#gender-res-a', '#gender-res-body');
            toggleResultTableState(validRacialInputs.display, '#racial-res-a', '#racial-res-body');
            toggleResultTableState(validTableInputs.display, '#combined-res-a', '#combined-res-body');

            // append the correct tables to the correct divs
            $('#gender-res').empty()
                .append(formatTable("Raw Gender Wage Gap", {Female: compF}, compM, validGenderInputs.display, "gender-table"));
            $('#racial-res').empty()
                .append(formatTable("Raw Racial Wage Gap", {'Employees of Color': compNW}, compW, validRacialInputs.display, "racial-table"));
            $('#combined-res').empty()
                .append(formatTable("Raw Gender and Racial Wage Gap", constructCombinedCompDict(), compWM, validTableInputs.display, "combined-table"));

            // toggle collapsible sections to hide calculator and show results
            $("#data-entry").hide();
            $("#results").show();
            // scrolls to the top of the results section automatically
            $('html, body').animate({
                scrollTop: $("#results-section")
            }, 200);
            $("#dark-nav").addClass('hidden'); // show dark nav again

            // submit email address to server
            $.post(`${BASE_URL}/api/submissions`, {email: email})
                .done(function (data) {
                    console.log(`Success from email POST`);
                })
                .fail(function (err) {
                    console.log(`Error from email POST: ${JSON.stringify(err)}`);
                });

            // order of calls to make to use the PDF export function
            // if (validGenderInputs.display) {
            //     exportToExcel({id: "gender-table", sheetName: "Gender Wage Gap"});
            // }
            // if (validRacialInputs.display) {
            //     exportToExcel({id: "racial-table", sheetName: "Racial Wage Gap"});
            // }
            // if (validTableInputs.display) {
            //     exportToExcel({id: "combined-table", sheetName: "Gender and Racial Wage Gap"});
            // }
            // exportToPDF();

            // call to make to use the Excel export function
            // exportToExcel({filename: "Wage_Gap_Calculator_Results.xlsx", download: true})

        }
    });



});
