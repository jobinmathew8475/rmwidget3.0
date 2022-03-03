// Copyright (c) 2016 Mark Fitzpatrick Version 1.0 May 11, 2016
// Version 1.1 5/16/2017  - Updated max MCA per new FHA lending limits, reduced margin for lower EIR, and fixed bug where IMIP was calculating off property value and not MCA.
// Version 1.2 10/6/2017  - Updated PL tables and UFMIP rates based on new FHA guidelines.
// Version 1.3 12/30/2017 - Updated max MCA per new FHA lending limit to take effect 1/1/2018.
// Version 1.4 6/10/2018  - Reduced margin for EIR and proceed amount calculations.
// Version 2.0 9/26/2018  - Rewrote the code for greater efficiency and better testing capabilities. Added amortization. 
// Version 2.1 10/27/2018 - Added Google chart functionality to am schedule and consolidated three tabs on am schedule to just two, Loan Balance and Cashflow. 
//                          Also did some minor formatting and design improvements to improve appearance and information clarity. 
// Version 2.1 01/22/2019 - Removed FHA lending limit and margin constants in favor of a call to an external js file that can be easily updated using the HECM desktop rate updater app.
// Version 2.1 05/07/2020 - Fixed a bug where PL factor function returned a zero if rates fell too low. 
// Version 2.2 09/17/2020 - Eliminated use of accounting library, which was triggering jQuery syntax issues. Javascript has native functionality to format currency.
"use strict";

// Options to receive proceeds that are loaded into a select box.
const OPTION_LUMP_SUM_AND_LOC = 0;
const OPTION_LOC_ONLY = 1;
const OPTION_LIFETIME_PAYMENT = 2;
const OPTION_20_YEAR_PAYMENT = 3;
const OPTION_15_YEAR_PAYMENT = 4;
const OPTION_10_YEAR_PAYMENT = 5;

// HECM CONSTANTS
const LENDING_LIMIT = 970800;
const MIP_RATE = 0.5;
const IMIP_RATE = .02;

// State locations loaded into a select box.
const STATE_AL = 0;
const STATE_AK = 1;
const STATE_AZ = 2;
const STATE_AR = 3;
const STATE_CA = 4;
const STATE_CO = 5;
const STATE_CT = 6;
const STATE_DE = 7;
const STATE_DC = 8;
const STATE_FL = 9;
const STATE_GA = 10;
const STATE_HI = 11;
const STATE_ID = 12;
const STATE_IL = 13;
const STATE_IN = 14;
const STATE_IA = 15;
const STATE_KS = 16;
const STATE_KY = 17;
const STATE_LA = 18;
const STATE_ME = 19;
const STATE_MD = 20;
const STATE_MA = 21;
const STATE_MI = 22;
const STATE_MN = 23;
const STATE_MS = 24;
const STATE_MO = 25;
const STATE_MT = 26;
const STATE_NE = 27;
const STATE_NV = 28;
const STATE_NH = 29;
const STATE_NJ = 30;
const STATE_NM = 31;
const STATE_NY = 32;
const STATE_NC = 33;
const STATE_ND = 34;
const STATE_OH = 35;
const STATE_OK = 36;
const STATE_OR = 37;
const STATE_PA = 38;
const STATE_RI = 39;
const STATE_SC = 40;
const STATE_SD = 41;
const STATE_TN = 42;
const STATE_TX = 43;
const STATE_UT = 44;
const STATE_VT = 45;
const STATE_VA = 46;
const STATE_WA = 47;
const STATE_WV = 48;
const STATE_WI = 49;
const STATE_WY = 50;

function amortizationpurchase (isvariableprogram) {  
    
    var age = validateAge(store.get('age'));  // The amortization is calculated to age 99.
    
    // Adjustable-rate interest.    
    var totalinterest = store.get('totalinterest');
    totalinterest = parseFloat(totalinterest);

    // Fixed-rate interest.
    var totalinterestfixed = store.get('totalinterestfixed');
    totalinterestfixed = parseFloat(totalinterestfixed);

    // Starting property value.
    var propval = store.get('propval');
    
    // Appreciation rate. 
    var appreciationrate = validateAppreciationRate(store.get('homeappreciation'));
    document.getElementById('homeappreciation').selectedIndex = appreciationrate;
    appreciationrate = appreciationrate.toFixed(appreciationrate, 2) / 100;     // Converting from a combo box index (which is what is stored) into the correct value for calculation purposes.     
   
    // The principal limit is the starting loan balance.
    var pl = validateCurrency(parseInt(store.get('plvariable')));   
    
    var equity = propval - pl;
       
    isvariableprogram = parseInt(isvariableprogram);
 
    var am = new Array();
    am.push(["Age", "Home Value", "Loan Balance", "Equity Reserve"]);

    // Looping through until age 99 calculating the principal balance and remaining home equity, taking into account the appreciation rate.
    for ( var i = age; i < 100; i++) {
        am.push([i, formatMoney(propval, $, 0), formatMoney(pl, $, 0), formatMoney(equity, $, 0)]);

        if ( isvariableprogram > 0 ) {
            pl = calcaccruals(pl, totalinterest, 0);
        } else {
            pl = calcaccruals(pl, totalinterestfixed, 0);
        }       

        // Calculating accruals for loan balance and equity.
        propval = calcaccruals(propval, appreciationrate, 0); 
        equity = propval - pl;
    } 

    // Outputting the HTML table.
    var dvTable = document.getElementById("dvTable");
    dvTable.innerHTML = "";
    var table = createTable(am);
    dvTable.appendChild(table);
    
}

function amortization(isvariableprogram) {  
//    alert(isvariableprogram); 

    var ispurchase = store.get('ispurchase');    
    var age = validateAge(store.get('age'));  // The amortization is calculated to age 99.
    
    // Adjustable-rate interest.    
    var totalinterest = store.get('totalinterest');
    totalinterest = parseFloat(totalinterest);

    // Fixed-rate interest.
    var totalinterestfixed = store.get('totalinterestfixed');
    totalinterestfixed = parseFloat(totalinterestfixed);
  
    // Starting property value.
    var propval = store.get('propval');
    //propval = propval.toFixed(propval);  
    
    // Appreciation rate. 
    var appreciationrate = validateAppreciationRate(store.get('homeappreciation'));
    document.getElementById('homeappreciation').selectedIndex = appreciationrate;
    appreciationrate = appreciationrate.toFixed(appreciationrate, 2) / 100;     // Converting from a combo box index (which is what is stored) into the correct value for calculation purposes.     
   
    isvariableprogram = parseInt(isvariableprogram);
    
    var startingbalance = 0;

    if (ispurchase == true) {
        
        startingbalance = validateCurrency(parseInt(store.get('startingbalance')));
 
        var am = new Array();
        am.push(["Age", "Home Value", "Loan Balance", "Equity Reserve"]);
        
        equity = propval - startingbalance;

        for ( var i = age; i < 100; i++) {
            am.push([i, formatMoney(propval, $, 0), formatMoney(startingbalance, $, 0), formatMoney(equity, $, 0)]);
            
            if ( isvariableprogram > 0 ) {
                startingbalance = calcaccruals(startingbalance, totalinterest, 0);
            } else {
                startingbalance = calcaccruals(startingbalance, totalinterestfixed, 0);
            }       
            
            // Calculating accruals for loan balance and equity.
            propval = calcaccruals(propval, appreciationrate, 0); 
            equity = propval - startingbalance;
        }

    } else {
        
        if ( isvariableprogram > 0 ) {
            // Getting starting balance stored from CalculateRM, including mortgage payoffs, closing costs, and cash at closing.
            startingbalance = validateCurrency(parseInt(store.get('startingbalance')) + parseInt(store.get('cashToCloseVariable')));
        } else {
            startingbalance = validateCurrency(parseInt(store.get('startingbalancefixed')) + parseInt(store.get('cashToCloseFixed')));
        }  

        var totalloc = validateCurrency(store.get('totalloc'));

        var mortgagepayment = 0;    
        mortgagepayment = validateCurrency(store.get('pipayment'));

        // Getting the remaining number of years left on the mortgage.
        var yearsleft = validateYearsLeft(store.get('yearsleft')); 

        // Extra income in the form of term or tenure payments. 
        var additionalincome = 0;    
        additionalincome = validateCurrency(store.get('monthlypayment'));

        var term = 0;    
        term = validateTerm(store.get('paymentoptions')); // How long the extra income is to last. 

        // Grabbing payment option for calculating a term or tenure payment.
        switch(term) {
            case OPTION_LIFETIME_PAYMENT:
                term = 100 - age;
                break;
            case OPTION_20_YEAR_PAYMENT:
                term = 20;
                break;
            case OPTION_15_YEAR_PAYMENT:
                term = 15;
                break;
            case OPTION_10_YEAR_PAYMENT:
                term = 10;
                break;
            default:
                term = 0;
        }

        // Minimum term is five years, regardless of age.
        if (term < 5) {
            term = 5;
        }

        var equity = propval - startingbalance;

        //Build an array containing amortization records.
        var am = new Array();
        am.push(["Age", "Home Value", "Loan Balance", "Available Line of Credit", "Equity Reserve"]);

        var amcashflow = new Array();
        amcashflow.push(["Age", "Mortgage Payment Savings", "Add'l HECM Income", "Total Savings & Income", "Cumulative Savings & Income"]);

        var totalincome = 0;
        var totalmortgagepayments = 0;
        var startingloc = 0;
        var cumsavingsandincome = 0;
        var yearlyinterest = 0;

        var data = new Array();
        data[0] = ['Age', 'LOC'];

        for ( var i = age; i < 100; i++) {
            if ( isvariableprogram > 0 ) {

                startingloc = totalloc;

                am.push([i, formatMoney(propval, $, 0), formatMoney(startingbalance, $, 0), formatMoney(totalloc, $, 0), formatMoney(equity - totalloc, $, 0)]);

                totalloc = calcaccruals(startingloc, totalinterest, 0);
    //            yearlyinterest = calcaccruals(startingbalance, totalinterest, 0, true);            

                if (i < (parseInt(age) + parseInt(term))) {
                    startingbalance = calcaccruals(startingbalance, totalinterest, additionalincome);
                } else {
                    startingbalance = calcaccruals(startingbalance, totalinterest, 0);
                }

            } else {

    //            yearlyinterest = calcaccruals(startingbalance, totalinterest, 0, true);
                am.push([i, formatMoney(propval, $, 0), formatMoney(startingbalance, $, 0), "N/A", formatMoney(equity, $, 0)]);
                startingbalance = calcaccruals(startingbalance, totalinterestfixed, 0);
            }

            // Calculating accruals for loan balance and equity.
            propval = calcaccruals(propval, appreciationrate, 0); 
            equity = propval - startingbalance;

    //        if ( isvariableprogram > 0 ) {
    //            startingloc = totalloc;
    //            totalloc = calcaccruals(startingloc, totalinterest, 0);
    //        
    //            // Line of credit tab.
    //            amloc.push([i, formatMoney(startingloc, $, 0), accounting.toFixed(totalinterest * 100, 3)  + "%", formatMoney(totalloc - startingloc, $, 0), formatMoney(totalloc, $, 0)]);
    //
    //            data[i] = [{age: i, loc: accounting.toFixed(totalloc, 0) }];
    //            
    //        } else {
    //            amloc.push([i, "N/A", "N/A", "N/A", "N/A"]);
    //        }

            if ( isvariableprogram > 0 ) {
                // Calculating annual income and mortgage payment savings.
                if (i < age + term) {
                    totalincome = additionalincome * 12;
                } else {
                    totalincome = 0;
                }
            } else {
                totalincome = 0;
            }

            if (i < age + yearsleft) {
                totalmortgagepayments = mortgagepayment * 12;
            } else {
                totalmortgagepayments = 0;
            }

            cumsavingsandincome = cumsavingsandincome + totalincome + totalmortgagepayments;

            if ( isvariableprogram > 0 ) {
                // Mortgage payment savings and HECM income tab.
                amcashflow.push([i, formatMoney(totalmortgagepayments, $, 0), formatMoney(totalincome, $, 0), formatMoney(totalmortgagepayments + totalincome, $, 0), formatMoney(cumsavingsandincome, $, 0)]);
            } else {
                amcashflow.push([i, formatMoney(totalmortgagepayments, $, 0), "N/A", formatMoney(totalmortgagepayments, $, 0), formatMoney(cumsavingsandincome, $, 0)]);
            }
        } 
    }          

    var counter = 1;
    var table;
    var tempArray = new Array();

    // Looping through the two different tables displayed on the amortization page.
    for (counter = 1; counter <= 2; counter++) {

        switch (counter) {
            case 1:
                tempArray = am;
                break;
            case 2:
                tempArray = amcashflow;
                break;        
        }        

        switch (counter) {
            case 1:
                var dvTable = document.getElementById("dvTable");
                dvTable.innerHTML = "";
                var table = createTable(tempArray);
                dvTable.appendChild(table);
                break;
            case 2:
                var cashflowTable = document.getElementById("cashflowTable");
                if (!cashflowTable === false) {  // If the purchase calculator is calling this function, then this div won't exist.                    
                    cashflowTable.innerHTML = "";
                    var table = createTable(tempArray);
                    cashflowTable.appendChild(table);
                }
                break;        
        }       
    }

    return data;
 }
 
 function createTable (tempArray) {
     
    var i = 0;
     
    // Setting up the HTML table.
    var table = document.createElement("TABLE");
    table.className = "amortizations";
    table.border = "0";

    // Get the count of columns.
    var columnCount = tempArray[0].length;

    // Add the header row.
    var row = table.insertRow(-1);
    for ( i = 0; i < columnCount; i++) {
        var headerCell = document.createElement("TH");
        headerCell.innerHTML = tempArray[0][i];
        row.appendChild(headerCell);
    }

    // Add the data rows.
    for ( i = 1; i < tempArray.length; i++) {
        row = table.insertRow(-1);
//                    if(i % 2 == 0){
//                        row.className = "evenrowcolor";
//                    }else{
//                        row.className = "oddrowcolor";
//                    }          
        for (var j = 0; j < columnCount; j++) {
            var cell = row.insertCell(-1);
            cell.innerHTML = tempArray[i][j]; 
            if (j === 0) {
                cell.className = "age";
            }  
            if (j === columnCount - 1) {
                cell.className = "total";
            }                 
        }

    }

    return table;
 }
 
function calcaccruals(startingamount, interestrate, monthlyinstallment, calculatejustinterest) {
    // Calculate interest or growth accruals monthly for a total year. Return value can be the new balance including interest/growth 
    // or just the interest/growth accrued.

    "use strict";

    if (calculatejustinterest === "undefined") {
        calculatejustinterest = false;
    }

    if (monthlyinstallment === "undefined") {
        monthlyinstallment = 0;
    }
    
    // Calculate the monthly interest rate. 
    var monthlyinterest = parseFloat(interestrate/12);

    var balance = startingamount;
    var accruedinterest;
    
    var i;
    
    // Loop through 12 months and figure out the accrued interest for the total year. 
    for (i = 1; i < 13; i++) {
        balance = parseFloat(balance) + parseFloat(monthlyinstallment);
        accruedinterest = parseFloat(balance) * monthlyinterest;            
        balance = parseFloat(balance) + parseFloat(accruedinterest);
    }

    if (calculatejustinterest === true ) {
        return roundNumber(balance - startingamount, 2);
    } else {
        return roundNumber(balance, 2);
    }
}

//function initpl() {
    // Grabbing any locally stored values to initialize some fields.
    
//    "use strict";
 
//    var age = store.get('age');
//    age = +accounting.toFixed(age, 0);
//    document.getElementById("age").value = age;
//    $("#age").text(age);
 
//    var propval = store.get('propval');
//    propval = formatMoney(propval);
//    document.getElementById("propval").value = propval;
  
//    var loanbal = store.get('loanbal');
//    loanbal = formatMoney(loanbal);
//    document.getElementById("loanbal").value = loanbal;
  
//    var pipayment = store.get('pipayment');
//    pipayment = formatMoney(pipayment);
//    document.getElementById("pipayment").value = pipayment;
    
//    resetresultsfields();

//}

function scrolltotop () {
    document.body.scrollTop = document.documentElement.scrollTop = 0;
}

//function resetresultsfields () {
    // Setting results fields defaults.
//    document.getElementById("imip").innerHTML = formatMoney(0);
//    document.getElementById("orig").innerHTML = formatMoney(0);
//    document.getElementById("closingcosts").innerHTML = formatMoney(0);
//    document.getElementById("totalclosingcosts").innerHTML = formatMoney(0);

//    document.getElementById("cash1styear").innerHTML = formatMoney(0);
//    document.getElementById("cash2ndyear").innerHTML = formatMoney(0);
//    document.getElementById("totalcash").innerHTML = formatMoney(0);

    //document.getElementById("paymentsavings").innerHTML = formatMoney(0);
//    document.getElementById("addedincome").innerHTML = formatMoney(0);
//    document.getElementById("totaladdedcashflow").innerHTML = formatMoney(0);
//}

function formatMoney(value) {
        // Create our number formatter.
    var formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',

      // These options are needed to round to whole numbers if that's what you want.
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return formatter.format(value); /* $2,500.00 */
}

function clearStorage () {
    // Clears local storage. Used only in development.
    store.clear()
}

window.load_page_values = function(pageid) {
// This function loads any saved values into the calculator pages.

    switch(pageid) {
        case "2":

            loadstep2();

            break;

        case "31":

            loadstep3();
            
            break;

        case "33":

            loadstep4();

            break;

        case "35": //Step 1

            //store.clear();
            loadstep1();

            break;

        case "43": //Step 5

            loadstep1();
            loadstep2();
            loadstep3();
            loadstep4();

            break;

        case "187": //Step 6

            loadstep1();
            loadstep2();
            loadstep3();
            loadstep4();

            break;

        default:
            break;
    }
}

function loadstep1() {
    
    document.getElementById("age").value = validateAge(store.get("age"));
    document.getElementById("propval").value = formatMoney(validateCurrency(store.get("propval")), $, 0);     
}

function loadstep2() {
    
    document.getElementById("loanbal").value = formatMoney(validateCurrency(store.get("loanbal")), $, 0);  
    document.getElementById("pipayment").value = formatMoney(validateCurrency(store.get("pipayment")), $, 0); 
    document.getElementById("yearsleft").value = validateYearsLeft(store.get("yearsleft"));     

}

function loadstep3() {
    
    document.getElementById('stateloc').selectedIndex = validateStateLocationIndex(store.get("stateloc"));
    
}

function loadstep4() {
    
    document.getElementById('paymentoptions').selectedIndex = validateProceedsOptionIndex(store.get("paymentoptions"));
    
}

function calculate() {
    window.location = "/reverse-mortgage-calculator-step-6";
    calculateRM();
}

function homepageredirect() {
    window.location = "/reverse-mortgage-calculator-step-2";
}   

/////////////////////////////////////////////////////////////////////////////////////////


function get3rdPartyCosts(mca){
    
    var closingcosts = .00625 * mca;

    // Setting minimum closing costs.
    if (closingcosts < 2800) {
        closingcosts = 2800;
    }
    
    // Setting minimum closing costs.
    if (closingcosts > 4900) {
        closingcosts = 4900;
    }    
    
    return roundNumber(closingcosts, 0);
}

//function getIMIP(propval){
//    if (propval > getFHALoanLimit()){
//        propval = getFHALoanLimit();
//    }
//
//    return roundNumber(.02 * propval, 0);
//}

function getOrig(mca){
    
    var orig = 0;
    
    if (mca < 200000) {
        orig = mca * .02;
    } else {
        orig = (200000 * .02) + ((mca - 200000) * .01);
    }
    
    orig = roundNumber(orig, 0);
    
    if (orig > 6000) orig = 6000;
    
    return orig;
        
//    var orig = .01 * mca;
//
//    if (orig < 2500) {
//        orig = 2500;
//    }
//    
//    if (orig > 6000) {
//        orig = 6000;
//    }
//    
//    return roundNumber(orig, 0);
}

function roundNumber(num, scale) {
  if(!("" + num).indexOf("e") >=0 ) {
    return +(Math.round(num + "e+" + scale)  + "e-" + scale);
  } else {
    var arr = ("" + num).split("e");
    var sig = ""
    if(+arr[1] + scale > 0) {
      sig = "+";
    }
    return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
  }
}

function isBoolean(val) {
   return val === false || val === true;
}


/////////////////////////////////////////////////////////////////////////////////////////

function hecmInputs() {
    
    this.age = 0;

    this.propertyvalue = 0;
    this.existingmortgagebalance = 0;
    this.existingpipayment = 0;
    this.yearsleftexistingmortgage = 0;
    this.state = 0;
    this.proceedsoptionindex = 0;
    this.swaprate = 0;
    this.oneyearcmtrate = 0;
    this.margin = 0;
    this.lendinglimit = 0;
    this.ispurchase = false;  
    
   return this;    
}

function validateRate ( rate ) {
    
        // This function is used in a few different places to make sure input data is valid.
    let tempValue = rate;

   // tempValue = accounting.unformat(tempValue); // Stripping off dollar sign in case it's present. 
    
    if (isNumeric(tempValue) == false) {
        return NaN;
        console.log ( ' Not numeric');
    } else {
        console.log ( ' numeric');
        tempValue = Number(tempValue);
        if (tempValue < 0) {
            tempValue = 0;
        } else if (tempValue > 5000000) {
            tempValue = 5000000;
        }
    }  
    
    return tempValue;
    
}

function isValidAge(age) {
    
    if (Number.isInteger(age) === false) {
        return false;
    } else if ( age > 99 ) {
        return false;
    } else if (age < 18 ) {
        return false;
    } else {
        return true;
    }     
}


function isValidYearsLeft(yearsLeft) {
    
    if (Number.isInteger(yearsLeft) === false) {
        return false;
    } else if ( yearsLeft > 40 ) {
        return false;
    } else if (yearsLeft < 0 ) {
        return false;
    } else {
        return true;
    }     
}

function isValidFloatValue(propertyValue) {
    
    let tempValue = propertyValue;

    tempValue = accounting.unformat(tempValue); // Stripping off dollar sign in case it's present (for currency values). 
   
    return !(tempValue <= 0);   
}

function isValidProceedsOptionIndex(proceedsoptionindex) {
    
    if (Number.isInteger(proceedsoptionindex) === false) {
        return false;
    } else if ( proceedsoptionindex > 5 ) {
        return false;
    } else if (proceedsoptionindex < 0 ) {
        return false;
    } else {
        return true;
    }     
}

function calculateHECM ( age = 0, propertyValue = 0, mortgageBalance = 0, piPayment = 0, yearsLeft = 0, proceedsOptionIndex = 0, swapRate = 0, 
    oneYearCMTRate = 0, margin = 0, isPurchase = false ) {
        
    var errorMessage = '';
    
    // Validating inputs and returning error messages as needed.
    if (isValidAge(age) === false) {
        age = 62;
        errorMessage += 'Invalid age corrected to 62. ';
    } else {
        age = +(age);
    }
    
    if (isValidFloatValue(propertyValue) === false ) {
        propertyValue = 0;
        errorMessage += 'Invalid property value corrected to 0. ';  
    } else {
        propertyValue = +(propertyValue);        
    }
    
    if (isValidFloatValue(mortgageBalance) === false ) {
        mortgageBalance = 0;
        errorMessage += 'Invalid mortgage balance corrected to 0. ';   
    } else {
        mortgageBalance = +(mortgageBalance);           
    }    
    
    if (isValidFloatValue(piPayment) === false ) {
        piPayment = 0;
        errorMessage += 'Invalid PI payment corrected to 0. '; 
    } else {
        piPayment = +(piPayment);           
    }   
    
    if (isValidYearsLeft(yearsLeft) === false ) {
        yearsLeft = 0;
        errorMessage += 'Invalid years left corrected to 0. '; 
    } else {
        yearsLeft = +(yearsLeft);           
    }
    
    if (isValidProceedsOptionIndex(proceedsOptionIndex) === false ) {
        proceedsOptionIndex = 0;
        errorMessage += 'Invalid proceeds options index corrected to 0. ';    
    } else {
        proceedsOptionIndex = +(proceedsOptionIndex);            
    } 
    
    if (isValidFloatValue(swapRate) === false ) {
        swapRate = 0;
        errorMessage += 'Invalid swap rate value corrected to 0. ';   
    } else {
        swapRate = +(swapRate);           
    }   
    
    if (isValidFloatValue(oneYearCMTRate) === false ) {
        oneYearCMTRate = 0;
        errorMessage += 'Invalid CMT rate value corrected to 0. ';       
    } else {
        oneYearCMTRate = +(oneYearCMTRate);            
    }    
    
    if (isValidFloatValue(margin) === false ) {
        margin = 0;
        errorMessage += 'Invalid margin rate value corrected to 0. ';     
    } else {
        margin = +(margin);           
    }   

    // Round up to the next year when calculating proceeds. Max age 99.  
    if (age < 99) {
        var ageForCalculation = age + 1;
    } else {
        var ageForCalculation = age;
    }
    
    // if the property value is higher than the lending limit, set the MCA to the lending limit. 
    // Otherwise, MCA is equal to the property value.
    if (propertyValue > LENDING_LIMIT ) {
        var mca = LENDING_LIMIT;
    } else {
        var mca = propertyValue;
    }
    
    // Calculating interest rates.
    var fixedEIRandIIR = roundNumber(swapRate + margin, 2); 
    var variableEIR = roundNumber(swapRate + margin, 2);
    var variableIIR = roundNumber(oneYearCMTRate + margin, 2);// EIR and IIR for the variable can be different numbers. The EIR is used to calculate proceeds, the IIR is used to calculate interest accruals over time.

    var fixedPLF = getPLFactor(ageForCalculation, fixedEIRandIIR/100);
    var variablePLF = getPLFactor(ageForCalculation, variableEIR/100);

    //Calculating principal limits.
    var plFixed = roundNumber(mca * fixedPLF, 0);  
    var plVariable = roundNumber(mca * variablePLF, 0);   
    
    // If this is a purchase HECM, setting the mortgage balance to the value of the property will trigger the correct 
    // cash to close calculation for both programs.
    if (isPurchase === true) {
        mortgageBalance = propertyValue;  
    }
    
    // Calculating closing costs.
    var imip = roundNumber(mca * IMIP_RATE, 0);  
    var orig = getOrig(mca);
    var closingCosts = get3rdPartyCosts(mca);

    // Calculating mandatory obligations, which impacts how much cash/LOC can be taken the first year.
    var mandatoryObligations = mortgageBalance + orig + closingCosts + imip; 
    
    var termOrTenurePayment = 0;
    var firstYearMoneyVariable = 0;
    var secondYearMoneyVariable = 0;
    var firstYearMoneyFixed = 0;
    
   // Calculating the variable program first. If the mandatory obligations are higher than the principal limit, borrower needs to bring in
    // cash to closing. This will be the case for purchase HECMs.
    if (mandatoryObligations > plVariable) {
        
        firstYearMoneyVariable = plVariable - mandatoryObligations;
        
    } else {
        
        // If a term or tenure payment has been selected, need to calculate the net principal limit first 
        // so we know how much cash is available for term or tenure payments. Minimum term is 5 years.
        if (proceedsOptionIndex === OPTION_LIFETIME_PAYMENT || proceedsOptionIndex === OPTION_20_YEAR_PAYMENT || proceedsOptionIndex === OPTION_15_YEAR_PAYMENT || proceedsOptionIndex === OPTION_10_YEAR_PAYMENT ) {

            let term;
            let netpl = plVariable - mandatoryObligations; // The net amount available after mandatory obligations (mortgages and closing costs) are paid.

            // Grabbing payment option for calculating a term or tenure payment.
            switch(proceedsOptionIndex) {
                case OPTION_LIFETIME_PAYMENT:
                    term = 100 - age;
                    break;
                case OPTION_20_YEAR_PAYMENT:
                    term = 20;
                    break;
                case OPTION_15_YEAR_PAYMENT:
                    term = 15;
                    break;
                case OPTION_10_YEAR_PAYMENT:
                    term = 10;
                    break;
                default:
                    term = 0;
            }

            // Minimum term is five years, regardless of age.
            if (term < 5) {
                term = 5;
            }

            // Calculating the monthly payment based on the available money, EIR, MIP, and term.              
            termOrTenurePayment = calculatepayment(netpl, variableEIR + MIP_RATE, term);  

        } else {

            // Cash/LOC or LOC was selected. Not all of the money is available right away, so need to calculate availability based on the mandatory obligations.
            firstYearMoneyVariable = roundNumber(0.6 * plVariable,0);
            secondYearMoneyVariable = roundNumber(0.4 * plVariable, 0);

            // If mandatory obligations are more than 60% of the principal limit, then borrower can take extra 10% of the principal limit up to the principal limit. 
            if (mandatoryObligations > firstYearMoneyVariable) {

                // Once you're over the 60% of the principal limit, you can take out another 10% max.
                firstYearMoneyVariable =  roundNumber(0.1 * plVariable, 0);  

                // If the mandatory obligations and first year limit exceed the principal limit, chop it back down and no cash is available the second year.
                if ((mandatoryObligations + firstYearMoneyVariable) > plVariable) {
                    firstYearMoneyVariable = plVariable - mandatoryObligations;
                    secondYearMoneyVariable = 0; 
                } else {
                    secondYearMoneyVariable = plVariable - firstYearMoneyVariable - mandatoryObligations;
                }

            } else {
                firstYearMoneyVariable = firstYearMoneyVariable - mandatoryObligations;
            } 

        }     
    }  
    
    // Calculating the fixed program. If the mandatory obligations are higher than the principal limit, borrower needs to bring in
    // cash to closing. This will be the case for purchase HECMs.
    if (mandatoryObligations > plFixed) {
    
        firstYearMoneyFixed = plFixed - mandatoryObligations;
        
    } else {
        
        firstYearMoneyFixed = roundNumber(0.6 * plFixed, 0);

        // If mandatory obligations are more than 60% of the principal limit, then can take an extra 10% and that's it (not to exceed the principal limit). 
        if (mandatoryObligations > firstYearMoneyFixed) {

            // Once you're over the 60% of the principal limit, you can take out another 10% max.
            firstYearMoneyFixed =  roundNumber(0.1 * plFixed, 0);  

            // If the mandatory obligations and first year limit exceed the principal limit, chop it back down. No cash is available the second year on the fixed program.
            if ((mandatoryObligations + firstYearMoneyFixed) > plFixed) {
                firstYearMoneyFixed = plFixed - mandatoryObligations;
            }

        } else {
            firstYearMoneyFixed = firstYearMoneyFixed - mandatoryObligations;
        }     

    }

    var objHECMResults = {
        age: age,
        ageForCalculation: ageForCalculation,
        variableEIR: variableEIR,
        variableIIR: variableIIR,
        fixedEIR: fixedEIRandIIR,
        fixedIIR: fixedEIRandIIR,
        variablePLF: variablePLF,
        fixedPLF: fixedPLF,    
        plFixed: plFixed,
        plVariable: plVariable,
        mip: MIP_RATE,
        mca: mca,
        mortgagebalance: mortgageBalance,
        imip: imip,
        origination: orig,
        thirdPartyClosingCosts: closingCosts,
        mandatoryobligations: mandatoryObligations,
        firstYearMoneyVariable: firstYearMoneyVariable,
        secondYearMoneyVariable: secondYearMoneyVariable,
        firstYearMoneyFixed: firstYearMoneyFixed,
        termOrTenurePayment: termOrTenurePayment,
        isPurchase: isPurchase,
        errorMessage: errorMessage
        
    };
    
    return objHECMResults;
    
}


/////////////////////////////////////////////////////////////////////////////////////////


function Borrower() {
    
    this.age = 0;
    this.propval = 0;
    this.loanbal = 0;
    this.pipayment = 0;
    this.yearsleftonmtg = 0;
    this.state = 0;
    this.proceedsoptionindex = 0;
    this.ispurchase = false;  
    
   return this;    
}



function loadBwrAndCalculateRM( isHECMPurchase ) {
    
    var isPurchaseTemp;

    // If value passed in isn't a valid boolean, assume this is a traditional HECM (not a purchase).
    if (isBoolean(isHECMPurchase) === false) {
        isPurchaseTemp = false;
    } else {
        isPurchaseTemp = isHECMPurchase;
    }   
    
    var objBorrower = {
        age: validateAge(store.get("age")) , 
        propval: validateCurrency(store.get("propval")),
        loanbal: validateCurrency(store.get("loanbal")),
        pipayment: validateCurrency(store.get("pipayment")),
        yearsleft: validateYearsLeft(store.get("yearsleft")),
        state: validateStateLocationIndex(store.get("state")),
        proceedsoptionindex: validateProceedsOptionIndex(store.get("paymentoptions")), // Tenure.
        ispurchase: isPurchaseTemp
    };

    var objHECM = calculateRM ( objBorrower );
    var ltv = 0;

    // Updating form fields with variable-rate program data.
    document.getElementById("program").innerHTML = "Variable"; 
    document.getElementById("index").innerHTML = "1-Year CMT";

    var iir = objHECM.variableIIR;
    document.getElementById("iir").innerHTML = iir.toFixed(2) + "%";   // Convert to string with 2 decimal places.
    document.getElementById("mip").innerHTML = objHECM.mip.toFixed(2) + "%";

    var totalInterest = iir + objHECM.mip;
    document.getElementById("totalinterest").innerHTML = totalInterest.toFixed(2) + "%";  
    store.set('totalinterest', totalInterest/100);

    ltv = parseInt(objHECM.plVariable) / parseInt(objBorrower.propval) * 100;
    ltv = ltv.toFixed(1) + "%"; 
    document.getElementById("pllabel").innerHTML = "Principal limit (LTV " + ltv + "):";
    document.getElementById("pl").innerHTML = formatMoney(objHECM.plVariable, $, 0);

    document.getElementById("imip").innerHTML = "-" + formatMoney(objHECM.imip, $, 0); 
    document.getElementById("orig").innerHTML = "-" + formatMoney(objHECM.origination, $, 0);
    document.getElementById("closingcosts").innerHTML = "-" + formatMoney(objHECM.thirdPartyClosingCosts, $, 0); 

    // Updating form fields with fixed-rate program data.
    document.getElementById("program2").innerHTML = "Fixed"; 
    document.getElementById("index2").innerHTML = "N/A";  
        
    iir = objHECM.fixedIIR;
    document.getElementById("iir2").innerHTML = iir.toFixed(2) + "%";   // Convert to string with 2 decimal places.
    document.getElementById("mip2").innerHTML = objHECM.mip.toFixed(2) + "%";  
            
    totalInterest = iir + objHECM.mip;
    document.getElementById("totalinterest2").innerHTML = totalInterest.toFixed(2) + "%";    
    store.set('totalinterestfixed', totalInterest/100);  

    ltv = parseInt(objHECM.plFixed) / parseInt(objBorrower.propval) * 100;
    ltv = ltv.toFixed(1) + "%"; 
    document.getElementById("pllabel").innerHTML = "Principal limit (LTV " + ltv + "):";
    document.getElementById("pl2").innerHTML = formatMoney(objHECM.plFixed, $, 0);  
    
    document.getElementById("imip2").innerHTML = "-" + formatMoney(objHECM.imip, $, 0); 
    document.getElementById("orig2").innerHTML = "-" + formatMoney(objHECM.origination, $, 0);
    document.getElementById("closingcosts2").innerHTML = "-" + formatMoney(objHECM.thirdPartyClosingCosts, $, 0); 
    
    if (objHECM.isPurchase === false ) {

        // Mortgage balance fields. Will show as negative number if a mortgage balance since it reduces net proceeds. 
        if (objHECM.mortgagebalance > 0) {        
            document.getElementById("mortgagepayoff").innerHTML = "-" + formatMoney(objHECM.mortgagebalance, $, 0);   
        } else {
            document.getElementById("mortgagepayoff").innerHTML = "$0";  // No mortgage balance, so make sure it doesn't show a negative zero, just zero.
        }
        
        // If short to close, display it to user. EIR is the same for both programs, so if short to close, it will be the same amount for both programs. Displaying variable program
        // values regardless of selected program. 
        if ((objHECM.plVariable - objHECM.mandatoryobligations) < 0 ) {
            document.getElementById("netpl").innerHTML = "-" + formatMoney(Math.abs(objHECM.plVariable - objHECM.mandatoryobligations), $, 0); 
            document.getElementById("netpl").style.color = "#FFA0A0";

            // Adding STC message to DOM structure for the sake user clarity.
            var parentdiv = document.getElementById("netpltotal");
            var stcdiv = document.createElement( 'div' );
            stcdiv.innerHTML = "Short to close! You'll need to bring in " + formatMoney(Math.abs(objHECM.plVariable - objHECM.mandatoryobligations), $, 0) + " to close." ;
            stcdiv.id = "stclabel";
            stcdiv.class = "pagecalcline";
            parentdiv.parentNode.insertBefore(stcdiv, parentdiv.nextSibling);

        } else {  // Not short to close, so display net PL, which is the same value for both variable and fixed, so pulling from variable program data here. 

            document.getElementById("netpl").innerHTML = formatMoney(objHECM.plVariable - objHECM.mandatoryobligations, $, 0); 
        }
        
        document.getElementById("cash1styear").innerHTML = formatMoney(objHECM.firstYearMoneyVariable, $, 0);
        document.getElementById("cash2ndyear").innerHTML = formatMoney(objHECM.secondYearMoneyVariable, $, 0);
        document.getElementById("totalcash").innerHTML = formatMoney(objHECM.firstYearMoneyVariable + objHECM.secondYearMoneyVariable, $, 0);
        
        document.getElementById("paymentsavings").innerHTML = formatMoney(objBorrower.pipayment, $, 0);   
        document.getElementById("addedincome").innerHTML = formatMoney(objHECM.termOrTenurePayment, $, 0);  
        document.getElementById("totaladdedcashflow").innerHTML = formatMoney(parseInt(objBorrower.pipayment) + parseInt(objHECM.termOrTenurePayment), $, 0);        
        
        // Displaying fixed-rate program values. 
        document.getElementById("mortgagepayoff2").innerHTML = formatMoney(objHECM.mortgagebalance, $, 0);  
        
        document.getElementById("cash1styear2").innerHTML = formatMoney(objHECM.firstYearMoneyFixed, $, 0);
        document.getElementById("cash2ndyear2").innerHTML = "N/A"; // No second year cash for fixed program.
        document.getElementById("totalcash2").innerHTML = formatMoney(objHECM.firstYearMoneyFixed, $, 0);        

        document.getElementById("paymentsavings2").innerHTML = formatMoney(objBorrower.pipayment, $, 0);   
        document.getElementById("addedincome2").innerHTML = "N/A" 
        document.getElementById("totaladdedcashflow2").innerHTML = formatMoney(objBorrower.pipayment, $, 0);   
        
        if ( objBorrower.proceedsoptionindex === OPTION_LUMP_SUM_AND_LOC ) {

            store.set('startingbalance', objHECM.mandatoryobligations + objHECM.firstYearMoneyVariable);
            store.set('totalloc', objHECM.secondYearMoneyVariable);

            document.getElementById("cashfirstyearlabel").innerHTML = "Lump sum at closing:"; 
            document.getElementById("cashsecondyearlabel").innerHTML = "Add'l line of credit after one year:"; 

        } else {

            store.set('startingbalance', objHECM.mandatoryobligations);
            store.set('totalloc', objHECM.firstYearMoneyVariable + objHECM.secondYearMoneyVariable);

            switch(objBorrower.proceedsoptionindex) {
                case OPTION_LIFETIME_PAYMENT:
                    document.getElementById("addedincomelabel").innerHTML = "Lifetime guaranteed tenure income:"; 
                    break;
                case OPTION_20_YEAR_PAYMENT:
                    document.getElementById("addedincomelabel").innerHTML = "20-year term income:"; 
                    break;
                case OPTION_15_YEAR_PAYMENT:
                    document.getElementById("addedincomelabel").innerHTML = "15-year term income:"; 
                    break;
                case OPTION_10_YEAR_PAYMENT:
                    document.getElementById("addedincomelabel").innerHTML = "10-year term income:"; 
                    break;
                case OPTION_LOC_ONLY:
                    document.getElementById("cashfirstyearlabel").innerHTML = "Line of credit at closing:"; 
                    document.getElementById("cashsecondyearlabel").innerHTML = "Add'l line of credit after one year:";
                    break;
                default:                
            }        
        }            
  
        store.set('mortgagebalance', objHECM.mortgagebalance);
        store.set('pipayment', objBorrower.pipayment);
        store.set('yearsleft', objBorrower.yearsleft);    


        // Storing chart values for variable program. 
        store.set('cashatclosing', objHECM.firstYearMoneyVariable);
        store.set('secondyearcash', objHECM.secondYearMoneyVariable);
        store.set('equityreserve', objBorrower.propval - objHECM.imip - objHECM.origination - objHECM.thirdPartyClosingCosts - objHECM.mortgagebalance - objHECM.firstYearMoneyVariable - objHECM.secondYearMoneyVariable);

        // Storing non-redundant chart values for fixed program.
        store.set('startingbalancefixed', objHECM.mandatoryobligations + objHECM.firstYearMoneyFixed);
        store.set('cashatclosingfixed', objHECM.firstYearMoneyFixed);
        store.set('equityreservefixed', objBorrower.propval - objHECM.imip - objHECM.origination - objHECM.thirdPartyClosingCosts - objHECM.mortgagebalance - objHECM.firstYearMoneyFixed);        

    } else {   // Is purchase. Displaying down payment amount.

        document.getElementById("purchaseprice").innerHTML = "-" + formatMoney(objBorrower.propval, $, 0); 
        document.getElementById("purchaseprice2").innerHTML = "-" + formatMoney(objBorrower.propval, $, 0); 

        document.getElementById("netpl").innerHTML = formatMoney(objHECM.plVariable - objHECM.mandatoryobligations, $, 0); 
        document.getElementById("netpl2").innerHTML = formatMoney(objHECM.plFixed - objHECM.mandatoryobligations, $, 0); 
        
        document.getElementById("downpayment").innerHTML = "Cash to close is: " + formatMoney(Math.abs(objHECM.plVariable - objHECM.mandatoryobligations), $, 0);
        document.getElementById("downpayment2").innerHTML = "Cash to close is: " + formatMoney(Math.abs(objHECM.plFixed - objHECM.mandatoryobligations), $, 0);

        store.set('plvariable', objHECM.plVariable);

    }
    
    store.set('age', objBorrower.age);
    store.set('propval', objBorrower.propval);    
    store.set('totalclosingcosts', objHECM.imip +  objHECM.origination + objHECM.thirdPartyClosingCosts);
    store.set('ispurchase', objBorrower.ispurchase);
}

function HECM() {

    this.variableEIR = 0;
    this.variableIIR = 0;
    this.fixedEIR = 0;
    this.fixedIIR = 0;
    this.plFactorVariable = 0;
    this.plFactorFixed = 0;    
    this.plFixed = 0;
    this.plVariable = 0;
    this.ltv = 0;
    this.mip = 0.50;
    this.mca = 0;
    this.mortgagebalance = 0;
    this.imip = 0;
    this.origination = 0;
    this.thirdPartyClosingCosts = 0;
    this.mandatoryobligations = 0;
    this.firstYearMoneyVariable = 0;
    this.secondYearMoneyVariable = 0;
    this.firstYearMoneyFixed = 0;  // No second year money on the fixed program.
    this.termOrTenurePayment = 0;  // Term or tenure only on variable.
    this.cashToCloseVariable = 0;
    this.cashToCloseFixed = 0;
    this.isPurchase = false;   
    this.errorMessage = '';
    
   return this;      
};

function calculatePrincipalLimit ( age, propval, eir ) {

    var objHECM = new HECM();

    var mca = getFHALoanLimit();
    if (propval < mca) {
        mca = propval;
    }

    var plFactor = parseFloat(getPLFactor(age, eir));
    var pl = roundNumber(mca * plFactor, 0); 

    objHECM.ltv = pl/propval;
    objHECM.plFactorVariable = plFactor;
    objHECM.plVariable = formatMoney(pl, $, 0);  

    return objHECM;
    
}

function calculateRM(objBorrower, tenYearICESwapRate = 0, oneYearLIBORRate = 0, marginVariable = 0, marginFixed = 0) {
    
    // 10-Year Swap Rate and 1-Year LIBOR Rate variables are for testing purposes. 
    // If they're passed in, the function will default to those values to calculate HECM proceeds. Otherwise, they're left as zeroes.   
    if (tenYearICESwapRate == null) {
        tenYearICESwapRate = 0;
    }
    
    if (oneYearLIBORRate == null) {
        oneYearLIBORRate = 0;
    }
    
    if (marginVariable == null) {
        marginVariable = 0;
    }
    
    if (marginFixed == null) {
        marginFixed = 0;
    }        
    
    var objHECM = new HECM();
    
    let age = objBorrower.age + 1;
    if (age > 99) {
        age = 99;
    }

    let propval = objBorrower.propval;
    let loanbal = objBorrower.loanbal;
    let pipayment = objBorrower.pipayment;
    let yearsleft = objBorrower.yearsleftonmtg;
    let state = objBorrower.state;
    let selectedProceedsOptionIndex = objBorrower.proceedsoptionindex;
    let ispurchase = objBorrower.ispurchase;
    
    var mca = getFHALoanLimit();
    if (propval < mca) {
        mca = propval;
    }
    
    objHECM.mca = mca;

    var swapRate = 0;
    var liborRate = 0;

    // If a swap rate wasn't passed in (for testing purposes), then load the live value. 
    if ( tenYearICESwapRate === 0 ) {
        swapRate = getSwapRate();        
    } else {
        swapRate = tenYearICESwapRate;
    }

//    store.set('swapRate', swapRate);
    
    // If a LIBOR rate wasn't passed in (for testing purposes), then load the live value. 
    if ( oneYearLIBORRate === 0 ) {
        liborRate = get1YearLIBORRate();
    } else {
        liborRate = oneYearLIBORRate;
    }

//    store.set('liborRate', liborRate);
 
    if (marginVariable === 0) {
        marginVariable = getMargin();
    }
    
    if (marginFixed === 0) {
        marginFixed = getMargin();
    }   

//    console.log("MCA: " +  mca);
//    console.log ("Age: " + age);
//    console.log ("Swap: " + swapRate);
//    console.log ("Margin Fixed: " + marginFixed);
//    console.log ("Margin Variable: " + marginVariable);
    
    // EIR is used to calculate the benefit amount for both loan programs. The EIR matches the note rate (IIR) for the fixed
    // program. The note rate can be different than the EIR for the variable program. 
    var fixedEIRandIIR = roundNumber(parseFloat(swapRate) + parseFloat(marginFixed), 2); // EIR and IIR are the same for the fixed rate program.
    var variableEIR = roundNumber(parseFloat(swapRate) + parseFloat(marginVariable), 2);
    var variableIIR = roundNumber(parseFloat(liborRate) +parseFloat( marginVariable), 2);// EIR and IIR for the variable can be different numbers. The EIR is used to calculate proceeds, the IIR is used to calculate interest accruals over time.

//    console.log ("Fixed EIR: " + fixedEIRandIIR);
//    console.log ("Variable EIR: " + variableEIR);

    objHECM.fixedEIR = fixedEIRandIIR;
    objHECM.fixedIIR = fixedEIRandIIR;
    objHECM.variableEIR = variableEIR;
    objHECM.variableIIR = variableIIR;
    
     // Grabbing PL Factor based on the EIR to determine initial loan-to-value for each program.
    var principalLimitFixed = roundNumber(mca * (getPLFactor(age, fixedEIRandIIR/100)), 0);  
    var principalLimitVariable = roundNumber(mca * (getPLFactor(age, variableEIR/100)), 0); 
    
    objHECM.plFixed = principalLimitFixed;
    objHECM.plVariable = principalLimitVariable;
    
    // If this is a purchase HECM, setting the mortgage balance to the value of the property will trigger the correct 
    // cash to close calculation for both programs.
    if (ispurchase === true) {
        loanbal = propval;  
        objHECM.isPurchase = true;  
    }
    
    // Calculating closing costs.
    var imip = getIMIP(propval);
    var orig = getOrig(propval);
    var closingcosts = get3rdPartyCosts(propval);
    
    objHECM.imip = imip;
    objHECM.origination = orig;
    objHECM.thirdPartyClosingCosts = closingcosts;
    objHECM.mortgagebalance = loanbal;

    // Calculating mandatory obligations, which impacts how much cash/LOC can be taken the first year.
    var mandatoryobs = parseInt(loanbal) + parseInt(orig) + parseInt(closingcosts) + parseInt(imip);
    
    objHECM.mandatoryobligations = mandatoryobs;
    
    // Calculating the variable program first. If the mandatory obligations are higher than the principal limit, borrower needs to bring in
    // cash to closing. This will be the case for purchase HECMs.
    if (mandatoryobs > principalLimitVariable) {
        
        objHECM.cashToCloseVariable = principalLimitVariable - mandatoryobs;
        store.set("cashToCloseVariable", objHECM.cashToCloseVariable); // Used by the chart.
        
    } else {

        objHECM.cashToCloseVariable = 0;
        store.set("cashToCloseVariable", objHECM.cashToCloseVariable); // Used by the chart.
        
        // If a term or tenure payment has been selected, need to calculate the net principal limit first 
        // so we know how much cash is available for term or tenure payments. Minimum term is 5 years.
        if (selectedProceedsOptionIndex === OPTION_LIFETIME_PAYMENT || selectedProceedsOptionIndex === OPTION_20_YEAR_PAYMENT || selectedProceedsOptionIndex === OPTION_15_YEAR_PAYMENT || selectedProceedsOptionIndex === OPTION_10_YEAR_PAYMENT ) {

            let term;
            let netpl = principalLimitVariable - mandatoryobs; // The net amount available after mandatory obligations (mortgages and closing costs) are paid.

            // Grabbing payment option for calculating a term or tenure payment.
            switch(selectedProceedsOptionIndex) {
                case OPTION_LIFETIME_PAYMENT:
                    term = 100 - age;
                    break;
                case OPTION_20_YEAR_PAYMENT:
                    term = 20;
                    break;
                case OPTION_15_YEAR_PAYMENT:
                    term = 15;
                    break;
                case OPTION_10_YEAR_PAYMENT:
                    term = 10;
                    break;
                default:
                    term = 0;
            }

            // Minimum term is five years, regardless of age.
            if (term < 5) {
                term = 5;
            }

            // Calculating the monthly payment based on the available money, rate, and term.              
            objHECM.termOrTenurePayment = calculatepayment(netpl, variableEIR, term);  
            store.set('monthlypayment', objHECM.termOrTenurePayment);

        } else {

            store.set('monthlypayment', 0);

            // Cash/LOC or LOC was selected. Not all of the money is available right away, so need to calculate availability based on the mandatory obligations.
            var firstYearMoneyVariable = roundNumber(0.6 * principalLimitVariable,0);
            var secondYearMoneyVariable = roundNumber(0.4 * principalLimitVariable, 0);

            // If mandatory obligations are more than 60% of the principal limit, then borrower can take extra 10% of the principal limit up to the principal limit. 
            if (mandatoryobs > firstYearMoneyVariable) {

                // Once you're over the 60% of the principal limit, you can take out another 10% max.
                firstYearMoneyVariable =  roundNumber(0.1 * principalLimitVariable, 0);  

                // If the mandatory obligations and first year limit exceed the principal limit, chop it back down and no cash is available the second year.
                if ((mandatoryobs + firstYearMoneyVariable) > principalLimitVariable) {
                    firstYearMoneyVariable = principalLimitVariable - mandatoryobs;
                    secondYearMoneyVariable = 0; 
                } else {
                    secondYearMoneyVariable = principalLimitVariable - firstYearMoneyVariable - mandatoryobs;
                }

            } else {
                firstYearMoneyVariable = firstYearMoneyVariable - mandatoryobs;
            } 

            objHECM.firstYearMoneyVariable  = firstYearMoneyVariable;
            objHECM.secondYearMoneyVariable = secondYearMoneyVariable;  

        }     
    }
    
    // Calculating the fixed program. If the mandatory obligations are higher than the principal limit, borrower needs to bring in
    // cash to closing. This will be the case for purchase HECMs.
    if (mandatoryobs > principalLimitFixed) {
    
        objHECM.cashToCloseFixed = principalLimitFixed - mandatoryobs;
        store.set("cashToCloseFixed", objHECM.cashToCloseFixed); // Used by the chart.
        
    } else {

        objHECM.cashToCloseFixed = 0;
        store.set("cashToCloseFixed", objHECM.cashToCloseFixed); // Used by the chart.
        
        var firstYearMoneyFixed = roundNumber(0.6 * principalLimitFixed, 0);

        // If mandatory obligations are more than 60% of the principal limit, then can take an extra 10% and that's it (not to exceed the principal limit). 
        if (mandatoryobs > firstYearMoneyFixed) {

            // Once you're over the 60% of the principal limit, you can take out another 10% max.
            firstYearMoneyFixed =  roundNumber(0.1 * principalLimitFixed, 0);  

            // If the mandatory obligations and first year limit exceed the principal limit, chop it back down. No cash is available the second year on the fixed program.
            if ((mandatoryobs + firstYearMoneyFixed) > principalLimitFixed) {
                firstYearMoneyFixed = principalLimitFixed - mandatoryobs;
            }

        } else {
            firstYearMoneyFixed = firstYearMoneyFixed - mandatoryobs;
        }     

        objHECM.firstYearMoneyFixed = firstYearMoneyFixed;
    }
          
    return objHECM;
}

function calculatepayment(npl, annualinterest, terminyears) {
    // Get the user's input from the form. Assume it is all valid.
    // Convert interest from a percentage to a decimal, and convert from
    // an annual rate to a monthly rate. Convert payment period in years
    // to the number of monthly payments.
    // Can calculate in Excel using the PMT function.
   
    var principal = npl;
    //console.log ("*************");
   // console.log ("CALCULATE PMT");
   // console.log ("NPL: " + npl);
   // console.log ("Interest: " + annualinterest);
    var interest = (annualinterest / 100 / 12);
    var payments = terminyears * 12;  
   // console.log ("Term: " + payments);

    // Now compute the monthly payment figure, using esoteric math.
    var x = Math.pow(1 + interest, payments);
    var monthly = parseFloat((principal*x*interest)/(x-1));

    // Check that the result is a finite number. If so, display the results.
    if (!isNaN(monthly) && 
        (monthly != Number.POSITIVE_INFINITY) &&
        (monthly != Number.NEGATIVE_INFINITY)) {

        //monthly = formatMoney(monthly); 
	return roundNumber(monthly, 0);
    }
    // Otherwise, the user's input was probably invalid, so don't
    // display anything.
    else {
        return 0;
    }
}

function isNumeric ( obj ) {
    // parseFloat NaNs numeric-cast false positives (null|true|false|"")
    // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
    // subtraction forces infinities to NaN
    // adding 1 corrects loss of precision from parseFloat (#15100)
    return !jQuery.isArray( obj ) && (obj - parseFloat( obj ) + 1) >= 0;
}

function validateAge(age) {

    // This function is used in a few different places to make sure input data is valid.
    let tempAge = age;
    if (isNumeric(tempAge) === false) {
        tempAge = 62;
    }

    tempAge = Number(tempAge); 
    
    switch (true) {
        case (tempAge < 18):
            tempAge = 18;
            break;
        case (tempAge > 99):
            tempAge = 99;
            break;
    }
    
    return tempAge;
}

function validateYearsLeft(yearsleft) {
    
    // This function is used in a few different places to make sure input data is valid.
    let tempYearsLeft = yearsleft;
    if (isNumeric(tempYearsLeft) === false) {
        tempYearsLeft = 0;
    }

    tempYearsLeft = Number(tempYearsLeft); 
    
    switch (true) {
        case (tempYearsLeft < 0):
            tempYearsLeft = 0;
            break;
        case (tempYearsLeft > 40):
            tempYearsLeft = 40;
            break;
    }
    
    return tempYearsLeft;   
}

function validateCurrency(value) {

    // This function is used in a few different places to make sure input data is valid.
    let tempValue = value;

    tempValue = accounting.unformat(tempValue); // Stripping off dollar sign in case it's present. 
    
    if (isNumeric(tempValue) == false) {
        tempValue = 0;
    } else {
        tempValue = Number(tempValue);
        if (tempValue < 0) {
            tempValue = 0;
        } else if (tempValue > 5000000) {
            tempValue = 5000000;
        }
    }  
    
    return tempValue;
}

function validateAppreciationRate (value) {
    
    let tempValue = value;
    
    // If the passed value is nonnumeric or not between 0 and 5, then just select 0.
    if (isNumeric(tempValue) === false) {
        tempValue = 4;
    } else {
        if (tempValue < 0) {
            tempValue = 4;
        } else if (tempValue > 5) {
            tempValue = 4;
        }
    }  
    
    return tempValue; 
}

function validateTerm (value) {
    
    let tempValue = value;
    
    // If the passed value is nonnumeric or not between 0 and 5, then just select 0.
    if (isNumeric(tempValue) === false) {
        tempValue = 0;
    } else {
        if (tempValue < 0) {
            tempValue = 0;
        }
    }  
    
    return tempValue; 
}

function validateProceedsOptionIndex (value) {
    
       // This function is used in a few different places to make sure input data is valid.
    let tempValue = value;
    
    // If the passed value is nonnumeric or not between 0 and 5, then just select 0.
    if (isNumeric(tempValue) == false) {
        tempValue = 0;
    } else {
        if (tempValue < 0) {
            tempValue = 0;
        } else if (tempValue > 5) {
            tempValue = 0;
        }
    }  
    
    return tempValue; 
}

function validateStateLocationIndex (value) {
    
       // This function is used in a few different places to make sure input data is valid.
    let tempValue = value;
    
    // If the passed value is nonnumeric or not between 0 and 5, then just select 0.
    if (isNumeric(tempValue) == false) {
        tempValue = 0;
    } else {
        if (tempValue < 0) {
            tempValue = 0;
        } else if (tempValue > 49) {
            tempValue = 0;
        }
    }  
    
    return tempValue; 
}

function age_change () {
    
    // Making sure we have a valid numeric age within the correct range of 18-99.
    var age = validateAge(document.getElementById("age").value);
   
    // Returning scrubbed value to the form and storing for later use.
    document.getElementById("age").value = age;
    store.set('age', age);   
}

function propval_change () {

    var propval = validateCurrency(document.getElementById("propval").value);
    
    // Returning the scrubbed and formatted value to the form and storing a plain version of the number.
    document.getElementById("propval").value = formatMoney(propval, $,0);   
    store.set('propval', propval); 

}

function loanbal_change () {
    
    var loanbal = validateCurrency(document.getElementById("loanbal").value);
    
    // Returning the scrubbed and formatted value to the form and storing a plain version of the number.
    document.getElementById("loanbal").value = formatMoney(loanbal, $,0);   
    store.set('loanbal', loanbal);  
    
}

function pipayment_change () {
    
    var pipayment = validateCurrency(document.getElementById("pipayment").value);
    
    // Returning the scrubbed and formatted value to the form and storing a plain version of the number.
    document.getElementById("pipayment").value = formatMoney(pipayment, $,0);   
    store.set('pipayment', pipayment);  
    
}

function stateloc_change () {

    var stateloc = validateStateLocationIndex(document.getElementById('stateloc').selectedIndex);
   
    store.set('stateloc', stateloc);
};

function paymentoptions_change () {
    // This function is called by the main calculator on MyHECM.com.
    
    var paymentoptions = validateProceedsOptionIndex(document.getElementById('paymentoptions').selectedIndex);

    store.set('paymentoptions', paymentoptions);   
}

function yearsleft_change () {
    // This function is called by the main calculator on MyHECM.com.
    
    // Grabbing and scrubbing the mortgage years left. 
    var yearsleft =  validateYearsLeft(document.getElementById("yearsleft").value);

    // Returning scrubbed value to the form and storing for later use.
    document.getElementById("yearsleft").value = yearsleft;
    store.set('yearsleft', yearsleft);    
}

function homeappreciation_change () {
    // This function is called by the main calculator on MyHECM.com.
    
    var homeappreciation = document.getElementById('homeappreciation').selectedIndex;

    store.set('homeappreciation', homeappreciation);   
}

function getPLFactor(age, rate) {
    // Determine the principal limit based on age and current expected interest rate. 
    // This is based on the latest HUD tables released in August 2015.
    
    "use strict";
    var pl = 0;    
    rate = rate * 1;
    
    // Rounding the rate to the nearest 1/8%.
    var float = 0.125 * 1;
    rate = Math.round((rate / float) * 100);
    rate = (rate * float) / 100;
    
    if (parseFloat(rate) < 0.03000) {
        rate = 0.03000;
    }
    
    // Searching the PL table based on age and interest rate.
    switch (parseInt(age)) {
    case 18:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.317;
            break;
        case parseFloat(0.03125):
            pl = 0.314;
            break;
        case parseFloat(0.03250):
            pl = 0.303;
            break;
        case parseFloat(0.03375):
            pl = 0.293;
            break;
        case parseFloat(0.03500):
            pl = 0.283;
            break;
        case parseFloat(0.03625):
            pl = 0.273;
            break;
        case parseFloat(0.03750):
            pl = 0.263;
            break;
        case parseFloat(0.03875):
            pl = 0.254;
            break;
        case parseFloat(0.04000):
            pl = 0.246;
            break;
        case parseFloat(0.04125):
            pl = 0.237;
            break;
        case parseFloat(0.04250):
            pl = 0.229;
            break;
        case parseFloat(0.04375):
            pl = 0.221;
            break;
        case parseFloat(0.04500):
            pl = 0.213;
            break;
        case parseFloat(0.04625):
            pl = 0.206;
            break;
        case parseFloat(0.04750):
            pl = 0.199;
            break;
        case parseFloat(0.04875):
            pl = 0.192;
            break;
        case parseFloat(0.05000):
            pl = 0.186;
            break;
        case parseFloat(0.05125):
            pl = 0.179;
            break;
        case parseFloat(0.05250):
            pl = 0.173;
            break;
        case parseFloat(0.05375):
            pl = 0.167;
            break;
        case parseFloat(0.05500):
            pl = 0.162;
            break;
        case parseFloat(0.05625):
            pl = 0.156;
            break;
        case parseFloat(0.05750):
            pl = 0.151;
            break;
        case parseFloat(0.05875):
            pl = 0.146;
            break;
        case parseFloat(0.06000):
            pl = 0.141;
            break;
        case parseFloat(0.06125):
            pl = 0.136;
            break;
        case parseFloat(0.06250):
            pl = 0.131;
            break;
        case parseFloat(0.06375):
            pl = 0.127;
            break;
        case parseFloat(0.06500):
            pl = 0.123;
            break;
        case parseFloat(0.06625):
            pl = 0.119;
            break;
        case parseFloat(0.06750):
            pl = 0.115;
            break;
        case parseFloat(0.06875):
            pl = 0.111;
            break;
        case parseFloat(0.07000):
            pl = 0.107;
            break;
        case parseFloat(0.07125):
            pl = 0.103;
            break;
        case parseFloat(0.07250):
            pl = 0.1;
            break;
        case parseFloat(0.07375):
            pl = 0.097;
            break;
        case parseFloat(0.07500):
            pl = 0.093;
            break;
        case parseFloat(0.07625):
            pl = 0.09;
            break;
        case parseFloat(0.07750):
            pl = 0.087;
            break;
        case parseFloat(0.07875):
            pl = 0.084;
            break;
        case parseFloat(0.08000):
            pl = 0.082;
            break;
        case parseFloat(0.08125):
            pl = 0.079;
            break;
        case parseFloat(0.08250):
            pl = 0.076;
            break;
        case parseFloat(0.08375):
            pl = 0.074;
            break;
        case parseFloat(0.08500):
            pl = 0.071;
            break;
        case parseFloat(0.08625):
            pl = 0.069;
            break;
        case parseFloat(0.08750):
            pl = 0.067;
            break;
        case parseFloat(0.08875):
            pl = 0.064;
            break;
        case parseFloat(0.09000):
            pl = 0.062;
            break;
        case parseFloat(0.09125):
            pl = 0.06;
            break;
        case parseFloat(0.09250):
            pl = 0.058;
            break;
        case parseFloat(0.09375):
            pl = 0.056;
            break;
        case parseFloat(0.09500):
            pl = 0.055;
            break;
        case parseFloat(0.09625):
            pl = 0.053;
            break;
        case parseFloat(0.09750):
            pl = 0.051;
            break;
        case parseFloat(0.09875):
            pl = 0.049;
            break;
        }
        break;
    case 19:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.317;
            break;
        case parseFloat(0.03125):
            pl = 0.317;
            break;
        case parseFloat(0.03250):
            pl = 0.307;
            break;
        case parseFloat(0.03375):
            pl = 0.296;
            break;
        case parseFloat(0.03500):
            pl = 0.286;
            break;
        case parseFloat(0.03625):
            pl = 0.276;
            break;
        case parseFloat(0.03750):
            pl = 0.267;
            break;
        case parseFloat(0.03875):
            pl = 0.258;
            break;
        case parseFloat(0.04000):
            pl = 0.249;
            break;
        case parseFloat(0.04125):
            pl = 0.241;
            break;
        case parseFloat(0.04250):
            pl = 0.232;
            break;
        case parseFloat(0.04375):
            pl = 0.225;
            break;
        case parseFloat(0.04500):
            pl = 0.217;
            break;
        case parseFloat(0.04625):
            pl = 0.21;
            break;
        case parseFloat(0.04750):
            pl = 0.202;
            break;
        case parseFloat(0.04875):
            pl = 0.196;
            break;
        case parseFloat(0.05000):
            pl = 0.189;
            break;
        case parseFloat(0.05125):
            pl = 0.183;
            break;
        case parseFloat(0.05250):
            pl = 0.176;
            break;
        case parseFloat(0.05375):
            pl = 0.171;
            break;
        case parseFloat(0.05500):
            pl = 0.165;
            break;
        case parseFloat(0.05625):
            pl = 0.159;
            break;
        case parseFloat(0.05750):
            pl = 0.154;
            break;
        case parseFloat(0.05875):
            pl = 0.149;
            break;
        case parseFloat(0.06000):
            pl = 0.144;
            break;
        case parseFloat(0.06125):
            pl = 0.139;
            break;
        case parseFloat(0.06250):
            pl = 0.134;
            break;
        case parseFloat(0.06375):
            pl = 0.13;
            break;
        case parseFloat(0.06500):
            pl = 0.126;
            break;
        case parseFloat(0.06625):
            pl = 0.121;
            break;
        case parseFloat(0.06750):
            pl = 0.117;
            break;
        case parseFloat(0.06875):
            pl = 0.113;
            break;
        case parseFloat(0.07000):
            pl = 0.11;
            break;
        case parseFloat(0.07125):
            pl = 0.106;
            break;
        case parseFloat(0.07250):
            pl = 0.102;
            break;
        case parseFloat(0.07375):
            pl = 0.099;
            break;
        case parseFloat(0.07500):
            pl = 0.096;
            break;
        case parseFloat(0.07625):
            pl = 0.093;
            break;
        case parseFloat(0.07750):
            pl = 0.09;
            break;
        case parseFloat(0.07875):
            pl = 0.087;
            break;
        case parseFloat(0.08000):
            pl = 0.084;
            break;
        case parseFloat(0.08125):
            pl = 0.081;
            break;
        case parseFloat(0.08250):
            pl = 0.078;
            break;
        case parseFloat(0.08375):
            pl = 0.076;
            break;
        case parseFloat(0.08500):
            pl = 0.073;
            break;
        case parseFloat(0.08625):
            pl = 0.071;
            break;
        case parseFloat(0.08750):
            pl = 0.069;
            break;
        case parseFloat(0.08875):
            pl = 0.066;
            break;
        case parseFloat(0.09000):
            pl = 0.064;
            break;
        case parseFloat(0.09125):
            pl = 0.062;
            break;
        case parseFloat(0.09250):
            pl = 0.06;
            break;
        case parseFloat(0.09375):
            pl = 0.058;
            break;
        case parseFloat(0.09500):
            pl = 0.056;
            break;
        case parseFloat(0.09625):
            pl = 0.054;
            break;
        case parseFloat(0.09750):
            pl = 0.053;
            break;
        case parseFloat(0.09875):
            pl = 0.051;
            break;
        }
        break;
    case 20:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.326;
            break;
        case parseFloat(0.03125):
            pl = 0.322;
            break;
        case parseFloat(0.03250):
            pl = 0.311;
            break;
        case parseFloat(0.03375):
            pl = 0.3;
            break;
        case parseFloat(0.03500):
            pl = 0.29;
            break;
        case parseFloat(0.03625):
            pl = 0.28;
            break;
        case parseFloat(0.03750):
            pl = 0.271;
            break;
        case parseFloat(0.03875):
            pl = 0.262;
            break;
        case parseFloat(0.04000):
            pl = 0.253;
            break;
        case parseFloat(0.04125):
            pl = 0.244;
            break;
        case parseFloat(0.04250):
            pl = 0.236;
            break;
        case parseFloat(0.04375):
            pl = 0.228;
            break;
        case parseFloat(0.04500):
            pl = 0.22;
            break;
        case parseFloat(0.04625):
            pl = 0.213;
            break;
        case parseFloat(0.04750):
            pl = 0.206;
            break;
        case parseFloat(0.04875):
            pl = 0.199;
            break;
        case parseFloat(0.05000):
            pl = 0.192;
            break;
        case parseFloat(0.05125):
            pl = 0.186;
            break;
        case parseFloat(0.05250):
            pl = 0.18;
            break;
        case parseFloat(0.05375):
            pl = 0.174;
            break;
        case parseFloat(0.05500):
            pl = 0.168;
            break;
        case parseFloat(0.05625):
            pl = 0.162;
            break;
        case parseFloat(0.05750):
            pl = 0.157;
            break;
        case parseFloat(0.05875):
            pl = 0.152;
            break;
        case parseFloat(0.06000):
            pl = 0.147;
            break;
        case parseFloat(0.06125):
            pl = 0.142;
            break;
        case parseFloat(0.06250):
            pl = 0.137;
            break;
        case parseFloat(0.06375):
            pl = 0.133;
            break;
        case parseFloat(0.06500):
            pl = 0.128;
            break;
        case parseFloat(0.06625):
            pl = 0.124;
            break;
        case parseFloat(0.06750):
            pl = 0.12;
            break;
        case parseFloat(0.06875):
            pl = 0.116;
            break;
        case parseFloat(0.07000):
            pl = 0.112;
            break;
        case parseFloat(0.07125):
            pl = 0.109;
            break;
        case parseFloat(0.07250):
            pl = 0.105;
            break;
        case parseFloat(0.07375):
            pl = 0.102;
            break;
        case parseFloat(0.07500):
            pl = 0.098;
            break;
        case parseFloat(0.07625):
            pl = 0.095;
            break;
        case parseFloat(0.07750):
            pl = 0.092;
            break;
        case parseFloat(0.07875):
            pl = 0.089;
            break;
        case parseFloat(0.08000):
            pl = 0.086;
            break;
        case parseFloat(0.08125):
            pl = 0.083;
            break;
        case parseFloat(0.08250):
            pl = 0.081;
            break;
        case parseFloat(0.08375):
            pl = 0.078;
            break;
        case parseFloat(0.08500):
            pl = 0.075;
            break;
        case parseFloat(0.08625):
            pl = 0.073;
            break;
        case parseFloat(0.08750):
            pl = 0.071;
            break;
        case parseFloat(0.08875):
            pl = 0.068;
            break;
        case parseFloat(0.09000):
            pl = 0.066;
            break;
        case parseFloat(0.09125):
            pl = 0.064;
            break;
        case parseFloat(0.09250):
            pl = 0.062;
            break;
        case parseFloat(0.09375):
            pl = 0.06;
            break;
        case parseFloat(0.09500):
            pl = 0.058;
            break;
        case parseFloat(0.09625):
            pl = 0.056;
            break;
        case parseFloat(0.09750):
            pl = 0.054;
            break;
        case parseFloat(0.09875):
            pl = 0.053;
            break;
        }
        break;
    case 21:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.326;
            break;
        case parseFloat(0.03125):
            pl = 0.325;
            break;
        case parseFloat(0.03250):
            pl = 0.314;
            break;
        case parseFloat(0.03375):
            pl = 0.304;
            break;
        case parseFloat(0.03500):
            pl = 0.294;
            break;
        case parseFloat(0.03625):
            pl = 0.284;
            break;
        case parseFloat(0.03750):
            pl = 0.274;
            break;
        case parseFloat(0.03875):
            pl = 0.265;
            break;
        case parseFloat(0.04000):
            pl = 0.256;
            break;
        case parseFloat(0.04125):
            pl = 0.248;
            break;
        case parseFloat(0.04250):
            pl = 0.24;
            break;
        case parseFloat(0.04375):
            pl = 0.232;
            break;
        case parseFloat(0.04500):
            pl = 0.224;
            break;
        case parseFloat(0.04625):
            pl = 0.217;
            break;
        case parseFloat(0.04750):
            pl = 0.209;
            break;
        case parseFloat(0.04875):
            pl = 0.202;
            break;
        case parseFloat(0.05000):
            pl = 0.196;
            break;
        case parseFloat(0.05125):
            pl = 0.189;
            break;
        case parseFloat(0.05250):
            pl = 0.183;
            break;
        case parseFloat(0.05375):
            pl = 0.177;
            break;
        case parseFloat(0.05500):
            pl = 0.171;
            break;
        case parseFloat(0.05625):
            pl = 0.166;
            break;
        case parseFloat(0.05750):
            pl = 0.16;
            break;
        case parseFloat(0.05875):
            pl = 0.155;
            break;
        case parseFloat(0.06000):
            pl = 0.15;
            break;
        case parseFloat(0.06125):
            pl = 0.145;
            break;
        case parseFloat(0.06250):
            pl = 0.14;
            break;
        case parseFloat(0.06375):
            pl = 0.136;
            break;
        case parseFloat(0.06500):
            pl = 0.131;
            break;
        case parseFloat(0.06625):
            pl = 0.127;
            break;
        case parseFloat(0.06750):
            pl = 0.123;
            break;
        case parseFloat(0.06875):
            pl = 0.119;
            break;
        case parseFloat(0.07000):
            pl = 0.115;
            break;
        case parseFloat(0.07125):
            pl = 0.111;
            break;
        case parseFloat(0.07250):
            pl = 0.108;
            break;
        case parseFloat(0.07375):
            pl = 0.104;
            break;
        case parseFloat(0.07500):
            pl = 0.101;
            break;
        case parseFloat(0.07625):
            pl = 0.098;
            break;
        case parseFloat(0.07750):
            pl = 0.094;
            break;
        case parseFloat(0.07875):
            pl = 0.091;
            break;
        case parseFloat(0.08000):
            pl = 0.088;
            break;
        case parseFloat(0.08125):
            pl = 0.086;
            break;
        case parseFloat(0.08250):
            pl = 0.083;
            break;
        case parseFloat(0.08375):
            pl = 0.08;
            break;
        case parseFloat(0.08500):
            pl = 0.078;
            break;
        case parseFloat(0.08625):
            pl = 0.075;
            break;
        case parseFloat(0.08750):
            pl = 0.073;
            break;
        case parseFloat(0.08875):
            pl = 0.07;
            break;
        case parseFloat(0.09000):
            pl = 0.068;
            break;
        case parseFloat(0.09125):
            pl = 0.066;
            break;
        case parseFloat(0.09250):
            pl = 0.064;
            break;
        case parseFloat(0.09375):
            pl = 0.062;
            break;
        case parseFloat(0.09500):
            pl = 0.06;
            break;
        case parseFloat(0.09625):
            pl = 0.058;
            break;
        case parseFloat(0.09750):
            pl = 0.056;
            break;
        case parseFloat(0.09875):
            pl = 0.054;
            break;
        }
        break;
    case 22:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.326;
            break;
        case parseFloat(0.03125):
            pl = 0.326;
            break;
        case parseFloat(0.03250):
            pl = 0.318;
            break;
        case parseFloat(0.03375):
            pl = 0.308;
            break;
        case parseFloat(0.03500):
            pl = 0.297;
            break;
        case parseFloat(0.03625):
            pl = 0.288;
            break;
        case parseFloat(0.03750):
            pl = 0.278;
            break;
        case parseFloat(0.03875):
            pl = 0.269;
            break;
        case parseFloat(0.04000):
            pl = 0.26;
            break;
        case parseFloat(0.04125):
            pl = 0.252;
            break;
        case parseFloat(0.04250):
            pl = 0.243;
            break;
        case parseFloat(0.04375):
            pl = 0.235;
            break;
        case parseFloat(0.04500):
            pl = 0.228;
            break;
        case parseFloat(0.04625):
            pl = 0.22;
            break;
        case parseFloat(0.04750):
            pl = 0.213;
            break;
        case parseFloat(0.04875):
            pl = 0.206;
            break;
        case parseFloat(0.05000):
            pl = 0.199;
            break;
        case parseFloat(0.05125):
            pl = 0.193;
            break;
        case parseFloat(0.05250):
            pl = 0.186;
            break;
        case parseFloat(0.05375):
            pl = 0.18;
            break;
        case parseFloat(0.05500):
            pl = 0.174;
            break;
        case parseFloat(0.05625):
            pl = 0.169;
            break;
        case parseFloat(0.05750):
            pl = 0.163;
            break;
        case parseFloat(0.05875):
            pl = 0.158;
            break;
        case parseFloat(0.06000):
            pl = 0.153;
            break;
        case parseFloat(0.06125):
            pl = 0.148;
            break;
        case parseFloat(0.06250):
            pl = 0.143;
            break;
        case parseFloat(0.06375):
            pl = 0.139;
            break;
        case parseFloat(0.06500):
            pl = 0.134;
            break;
        case parseFloat(0.06625):
            pl = 0.13;
            break;
        case parseFloat(0.06750):
            pl = 0.126;
            break;
        case parseFloat(0.06875):
            pl = 0.122;
            break;
        case parseFloat(0.07000):
            pl = 0.118;
            break;
        case parseFloat(0.07125):
            pl = 0.114;
            break;
        case parseFloat(0.07250):
            pl = 0.11;
            break;
        case parseFloat(0.07375):
            pl = 0.107;
            break;
        case parseFloat(0.07500):
            pl = 0.103;
            break;
        case parseFloat(0.07625):
            pl = 0.1;
            break;
        case parseFloat(0.07750):
            pl = 0.097;
            break;
        case parseFloat(0.07875):
            pl = 0.094;
            break;
        case parseFloat(0.08000):
            pl = 0.091;
            break;
        case parseFloat(0.08125):
            pl = 0.088;
            break;
        case parseFloat(0.08250):
            pl = 0.085;
            break;
        case parseFloat(0.08375):
            pl = 0.082;
            break;
        case parseFloat(0.08500):
            pl = 0.08;
            break;
        case parseFloat(0.08625):
            pl = 0.077;
            break;
        case parseFloat(0.08750):
            pl = 0.075;
            break;
        case parseFloat(0.08875):
            pl = 0.073;
            break;
        case parseFloat(0.09000):
            pl = 0.07;
            break;
        case parseFloat(0.09125):
            pl = 0.068;
            break;
        case parseFloat(0.09250):
            pl = 0.066;
            break;
        case parseFloat(0.09375):
            pl = 0.064;
            break;
        case parseFloat(0.09500):
            pl = 0.062;
            break;
        case parseFloat(0.09625):
            pl = 0.06;
            break;
        case parseFloat(0.09750):
            pl = 0.058;
            break;
        case parseFloat(0.09875):
            pl = 0.056;
            break;
        }
        break;
    case 23:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.326;
            break;
        case parseFloat(0.03125):
            pl = 0.326;
            break;
        case parseFloat(0.03250):
            pl = 0.322;
            break;
        case parseFloat(0.03375):
            pl = 0.312;
            break;
        case parseFloat(0.03500):
            pl = 0.301;
            break;
        case parseFloat(0.03625):
            pl = 0.291;
            break;
        case parseFloat(0.03750):
            pl = 0.282;
            break;
        case parseFloat(0.03875):
            pl = 0.273;
            break;
        case parseFloat(0.04000):
            pl = 0.264;
            break;
        case parseFloat(0.04125):
            pl = 0.255;
            break;
        case parseFloat(0.04250):
            pl = 0.247;
            break;
        case parseFloat(0.04375):
            pl = 0.239;
            break;
        case parseFloat(0.04500):
            pl = 0.231;
            break;
        case parseFloat(0.04625):
            pl = 0.224;
            break;
        case parseFloat(0.04750):
            pl = 0.216;
            break;
        case parseFloat(0.04875):
            pl = 0.209;
            break;
        case parseFloat(0.05000):
            pl = 0.203;
            break;
        case parseFloat(0.05125):
            pl = 0.196;
            break;
        case parseFloat(0.05250):
            pl = 0.19;
            break;
        case parseFloat(0.05375):
            pl = 0.184;
            break;
        case parseFloat(0.05500):
            pl = 0.178;
            break;
        case parseFloat(0.05625):
            pl = 0.172;
            break;
        case parseFloat(0.05750):
            pl = 0.167;
            break;
        case parseFloat(0.05875):
            pl = 0.161;
            break;
        case parseFloat(0.06000):
            pl = 0.156;
            break;
        case parseFloat(0.06125):
            pl = 0.151;
            break;
        case parseFloat(0.06250):
            pl = 0.146;
            break;
        case parseFloat(0.06375):
            pl = 0.142;
            break;
        case parseFloat(0.06500):
            pl = 0.137;
            break;
        case parseFloat(0.06625):
            pl = 0.133;
            break;
        case parseFloat(0.06750):
            pl = 0.129;
            break;
        case parseFloat(0.06875):
            pl = 0.124;
            break;
        case parseFloat(0.07000):
            pl = 0.121;
            break;
        case parseFloat(0.07125):
            pl = 0.117;
            break;
        case parseFloat(0.07250):
            pl = 0.113;
            break;
        case parseFloat(0.07375):
            pl = 0.109;
            break;
        case parseFloat(0.07500):
            pl = 0.106;
            break;
        case parseFloat(0.07625):
            pl = 0.103;
            break;
        case parseFloat(0.07750):
            pl = 0.099;
            break;
        case parseFloat(0.07875):
            pl = 0.096;
            break;
        case parseFloat(0.08000):
            pl = 0.093;
            break;
        case parseFloat(0.08125):
            pl = 0.09;
            break;
        case parseFloat(0.08250):
            pl = 0.088;
            break;
        case parseFloat(0.08375):
            pl = 0.085;
            break;
        case parseFloat(0.08500):
            pl = 0.082;
            break;
        case parseFloat(0.08625):
            pl = 0.08;
            break;
        case parseFloat(0.08750):
            pl = 0.077;
            break;
        case parseFloat(0.08875):
            pl = 0.075;
            break;
        case parseFloat(0.09000):
            pl = 0.072;
            break;
        case parseFloat(0.09125):
            pl = 0.07;
            break;
        case parseFloat(0.09250):
            pl = 0.068;
            break;
        case parseFloat(0.09375):
            pl = 0.066;
            break;
        case parseFloat(0.09500):
            pl = 0.064;
            break;
        case parseFloat(0.09625):
            pl = 0.062;
            break;
        case parseFloat(0.09750):
            pl = 0.06;
            break;
        case parseFloat(0.09875):
            pl = 0.058;
            break;
        }
        break;
    case 24:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.326;
            break;
        case parseFloat(0.03125):
            pl = 0.326;
            break;
        case parseFloat(0.03250):
            pl = 0.326;
            break;
        case parseFloat(0.03375):
            pl = 0.315;
            break;
        case parseFloat(0.03500):
            pl = 0.305;
            break;
        case parseFloat(0.03625):
            pl = 0.295;
            break;
        case parseFloat(0.03750):
            pl = 0.286;
            break;
        case parseFloat(0.03875):
            pl = 0.277;
            break;
        case parseFloat(0.04000):
            pl = 0.268;
            break;
        case parseFloat(0.04125):
            pl = 0.259;
            break;
        case parseFloat(0.04250):
            pl = 0.251;
            break;
        case parseFloat(0.04375):
            pl = 0.243;
            break;
        case parseFloat(0.04500):
            pl = 0.235;
            break;
        case parseFloat(0.04625):
            pl = 0.227;
            break;
        case parseFloat(0.04750):
            pl = 0.22;
            break;
        case parseFloat(0.04875):
            pl = 0.213;
            break;
        case parseFloat(0.05000):
            pl = 0.206;
            break;
        case parseFloat(0.05125):
            pl = 0.2;
            break;
        case parseFloat(0.05250):
            pl = 0.193;
            break;
        case parseFloat(0.05375):
            pl = 0.187;
            break;
        case parseFloat(0.05500):
            pl = 0.181;
            break;
        case parseFloat(0.05625):
            pl = 0.176;
            break;
        case parseFloat(0.05750):
            pl = 0.17;
            break;
        case parseFloat(0.05875):
            pl = 0.165;
            break;
        case parseFloat(0.06000):
            pl = 0.159;
            break;
        case parseFloat(0.06125):
            pl = 0.154;
            break;
        case parseFloat(0.06250):
            pl = 0.149;
            break;
        case parseFloat(0.06375):
            pl = 0.145;
            break;
        case parseFloat(0.06500):
            pl = 0.14;
            break;
        case parseFloat(0.06625):
            pl = 0.136;
            break;
        case parseFloat(0.06750):
            pl = 0.132;
            break;
        case parseFloat(0.06875):
            pl = 0.127;
            break;
        case parseFloat(0.07000):
            pl = 0.123;
            break;
        case parseFloat(0.07125):
            pl = 0.12;
            break;
        case parseFloat(0.07250):
            pl = 0.116;
            break;
        case parseFloat(0.07375):
            pl = 0.112;
            break;
        case parseFloat(0.07500):
            pl = 0.109;
            break;
        case parseFloat(0.07625):
            pl = 0.105;
            break;
        case parseFloat(0.07750):
            pl = 0.102;
            break;
        case parseFloat(0.07875):
            pl = 0.099;
            break;
        case parseFloat(0.08000):
            pl = 0.096;
            break;
        case parseFloat(0.08125):
            pl = 0.093;
            break;
        case parseFloat(0.08250):
            pl = 0.09;
            break;
        case parseFloat(0.08375):
            pl = 0.087;
            break;
        case parseFloat(0.08500):
            pl = 0.084;
            break;
        case parseFloat(0.08625):
            pl = 0.082;
            break;
        case parseFloat(0.08750):
            pl = 0.079;
            break;
        case parseFloat(0.08875):
            pl = 0.077;
            break;
        case parseFloat(0.09000):
            pl = 0.075;
            break;
        case parseFloat(0.09125):
            pl = 0.072;
            break;
        case parseFloat(0.09250):
            pl = 0.07;
            break;
        case parseFloat(0.09375):
            pl = 0.068;
            break;
        case parseFloat(0.09500):
            pl = 0.066;
            break;
        case parseFloat(0.09625):
            pl = 0.064;
            break;
        case parseFloat(0.09750):
            pl = 0.062;
            break;
        case parseFloat(0.09875):
            pl = 0.06;
            break;
        }
        break;
    case 25:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.35;
            break;
        case parseFloat(0.03125):
            pl = 0.341;
            break;
        case parseFloat(0.03250):
            pl = 0.33;
            break;
        case parseFloat(0.03375):
            pl = 0.319;
            break;
        case parseFloat(0.03500):
            pl = 0.309;
            break;
        case parseFloat(0.03625):
            pl = 0.299;
            break;
        case parseFloat(0.03750):
            pl = 0.29;
            break;
        case parseFloat(0.03875):
            pl = 0.281;
            break;
        case parseFloat(0.04000):
            pl = 0.272;
            break;
        case parseFloat(0.04125):
            pl = 0.263;
            break;
        case parseFloat(0.04250):
            pl = 0.255;
            break;
        case parseFloat(0.04375):
            pl = 0.247;
            break;
        case parseFloat(0.04500):
            pl = 0.239;
            break;
        case parseFloat(0.04625):
            pl = 0.231;
            break;
        case parseFloat(0.04750):
            pl = 0.224;
            break;
        case parseFloat(0.04875):
            pl = 0.217;
            break;
        case parseFloat(0.05000):
            pl = 0.21;
            break;
        case parseFloat(0.05125):
            pl = 0.203;
            break;
        case parseFloat(0.05250):
            pl = 0.197;
            break;
        case parseFloat(0.05375):
            pl = 0.191;
            break;
        case parseFloat(0.05500):
            pl = 0.185;
            break;
        case parseFloat(0.05625):
            pl = 0.179;
            break;
        case parseFloat(0.05750):
            pl = 0.173;
            break;
        case parseFloat(0.05875):
            pl = 0.168;
            break;
        case parseFloat(0.06000):
            pl = 0.163;
            break;
        case parseFloat(0.06125):
            pl = 0.158;
            break;
        case parseFloat(0.06250):
            pl = 0.153;
            break;
        case parseFloat(0.06375):
            pl = 0.148;
            break;
        case parseFloat(0.06500):
            pl = 0.143;
            break;
        case parseFloat(0.06625):
            pl = 0.139;
            break;
        case parseFloat(0.06750):
            pl = 0.135;
            break;
        case parseFloat(0.06875):
            pl = 0.13;
            break;
        case parseFloat(0.07000):
            pl = 0.126;
            break;
        case parseFloat(0.07125):
            pl = 0.122;
            break;
        case parseFloat(0.07250):
            pl = 0.119;
            break;
        case parseFloat(0.07375):
            pl = 0.115;
            break;
        case parseFloat(0.07500):
            pl = 0.111;
            break;
        case parseFloat(0.07625):
            pl = 0.108;
            break;
        case parseFloat(0.07750):
            pl = 0.105;
            break;
        case parseFloat(0.07875):
            pl = 0.102;
            break;
        case parseFloat(0.08000):
            pl = 0.098;
            break;
        case parseFloat(0.08125):
            pl = 0.095;
            break;
        case parseFloat(0.08250):
            pl = 0.092;
            break;
        case parseFloat(0.08375):
            pl = 0.09;
            break;
        case parseFloat(0.08500):
            pl = 0.087;
            break;
        case parseFloat(0.08625):
            pl = 0.084;
            break;
        case parseFloat(0.08750):
            pl = 0.082;
            break;
        case parseFloat(0.08875):
            pl = 0.079;
            break;
        case parseFloat(0.09000):
            pl = 0.077;
            break;
        case parseFloat(0.09125):
            pl = 0.074;
            break;
        case parseFloat(0.09250):
            pl = 0.072;
            break;
        case parseFloat(0.09375):
            pl = 0.07;
            break;
        case parseFloat(0.09500):
            pl = 0.068;
            break;
        case parseFloat(0.09625):
            pl = 0.066;
            break;
        case parseFloat(0.09750):
            pl = 0.064;
            break;
        case parseFloat(0.09875):
            pl = 0.062;
            break;
        }
        break;
    case 26:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.35;
            break;
        case parseFloat(0.03125):
            pl = 0.345;
            break;
        case parseFloat(0.03250):
            pl = 0.334;
            break;
        case parseFloat(0.03375):
            pl = 0.323;
            break;
        case parseFloat(0.03500):
            pl = 0.313;
            break;
        case parseFloat(0.03625):
            pl = 0.303;
            break;
        case parseFloat(0.03750):
            pl = 0.294;
            break;
        case parseFloat(0.03875):
            pl = 0.284;
            break;
        case parseFloat(0.04000):
            pl = 0.276;
            break;
        case parseFloat(0.04125):
            pl = 0.267;
            break;
        case parseFloat(0.04250):
            pl = 0.259;
            break;
        case parseFloat(0.04375):
            pl = 0.25;
            break;
        case parseFloat(0.04500):
            pl = 0.243;
            break;
        case parseFloat(0.04625):
            pl = 0.235;
            break;
        case parseFloat(0.04750):
            pl = 0.228;
            break;
        case parseFloat(0.04875):
            pl = 0.221;
            break;
        case parseFloat(0.05000):
            pl = 0.214;
            break;
        case parseFloat(0.05125):
            pl = 0.207;
            break;
        case parseFloat(0.05250):
            pl = 0.201;
            break;
        case parseFloat(0.05375):
            pl = 0.194;
            break;
        case parseFloat(0.05500):
            pl = 0.188;
            break;
        case parseFloat(0.05625):
            pl = 0.182;
            break;
        case parseFloat(0.05750):
            pl = 0.177;
            break;
        case parseFloat(0.05875):
            pl = 0.171;
            break;
        case parseFloat(0.06000):
            pl = 0.166;
            break;
        case parseFloat(0.06125):
            pl = 0.161;
            break;
        case parseFloat(0.06250):
            pl = 0.156;
            break;
        case parseFloat(0.06375):
            pl = 0.151;
            break;
        case parseFloat(0.06500):
            pl = 0.147;
            break;
        case parseFloat(0.06625):
            pl = 0.142;
            break;
        case parseFloat(0.06750):
            pl = 0.138;
            break;
        case parseFloat(0.06875):
            pl = 0.133;
            break;
        case parseFloat(0.07000):
            pl = 0.129;
            break;
        case parseFloat(0.07125):
            pl = 0.125;
            break;
        case parseFloat(0.07250):
            pl = 0.122;
            break;
        case parseFloat(0.07375):
            pl = 0.118;
            break;
        case parseFloat(0.07500):
            pl = 0.114;
            break;
        case parseFloat(0.07625):
            pl = 0.111;
            break;
        case parseFloat(0.07750):
            pl = 0.107;
            break;
        case parseFloat(0.07875):
            pl = 0.104;
            break;
        case parseFloat(0.08000):
            pl = 0.101;
            break;
        case parseFloat(0.08125):
            pl = 0.098;
            break;
        case parseFloat(0.08250):
            pl = 0.095;
            break;
        case parseFloat(0.08375):
            pl = 0.092;
            break;
        case parseFloat(0.08500):
            pl = 0.089;
            break;
        case parseFloat(0.08625):
            pl = 0.087;
            break;
        case parseFloat(0.08750):
            pl = 0.084;
            break;
        case parseFloat(0.08875):
            pl = 0.082;
            break;
        case parseFloat(0.09000):
            pl = 0.079;
            break;
        case parseFloat(0.09125):
            pl = 0.077;
            break;
        case parseFloat(0.09250):
            pl = 0.074;
            break;
        case parseFloat(0.09375):
            pl = 0.072;
            break;
        case parseFloat(0.09500):
            pl = 0.07;
            break;
        case parseFloat(0.09625):
            pl = 0.068;
            break;
        case parseFloat(0.09750):
            pl = 0.066;
            break;
        case parseFloat(0.09875):
            pl = 0.064;
            break;
        }
        break;
    case 27:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.35;
            break;
        case parseFloat(0.03125):
            pl = 0.349;
            break;
        case parseFloat(0.03250):
            pl = 0.338;
            break;
        case parseFloat(0.03375):
            pl = 0.327;
            break;
        case parseFloat(0.03500):
            pl = 0.317;
            break;
        case parseFloat(0.03625):
            pl = 0.307;
            break;
        case parseFloat(0.03750):
            pl = 0.298;
            break;
        case parseFloat(0.03875):
            pl = 0.289;
            break;
        case parseFloat(0.04000):
            pl = 0.28;
            break;
        case parseFloat(0.04125):
            pl = 0.271;
            break;
        case parseFloat(0.04250):
            pl = 0.262;
            break;
        case parseFloat(0.04375):
            pl = 0.254;
            break;
        case parseFloat(0.04500):
            pl = 0.246;
            break;
        case parseFloat(0.04625):
            pl = 0.239;
            break;
        case parseFloat(0.04750):
            pl = 0.231;
            break;
        case parseFloat(0.04875):
            pl = 0.224;
            break;
        case parseFloat(0.05000):
            pl = 0.217;
            break;
        case parseFloat(0.05125):
            pl = 0.211;
            break;
        case parseFloat(0.05250):
            pl = 0.204;
            break;
        case parseFloat(0.05375):
            pl = 0.198;
            break;
        case parseFloat(0.05500):
            pl = 0.192;
            break;
        case parseFloat(0.05625):
            pl = 0.186;
            break;
        case parseFloat(0.05750):
            pl = 0.18;
            break;
        case parseFloat(0.05875):
            pl = 0.175;
            break;
        case parseFloat(0.06000):
            pl = 0.17;
            break;
        case parseFloat(0.06125):
            pl = 0.164;
            break;
        case parseFloat(0.06250):
            pl = 0.159;
            break;
        case parseFloat(0.06375):
            pl = 0.155;
            break;
        case parseFloat(0.06500):
            pl = 0.15;
            break;
        case parseFloat(0.06625):
            pl = 0.145;
            break;
        case parseFloat(0.06750):
            pl = 0.141;
            break;
        case parseFloat(0.06875):
            pl = 0.137;
            break;
        case parseFloat(0.07000):
            pl = 0.133;
            break;
        case parseFloat(0.07125):
            pl = 0.129;
            break;
        case parseFloat(0.07250):
            pl = 0.125;
            break;
        case parseFloat(0.07375):
            pl = 0.121;
            break;
        case parseFloat(0.07500):
            pl = 0.117;
            break;
        case parseFloat(0.07625):
            pl = 0.114;
            break;
        case parseFloat(0.07750):
            pl = 0.11;
            break;
        case parseFloat(0.07875):
            pl = 0.107;
            break;
        case parseFloat(0.08000):
            pl = 0.104;
            break;
        case parseFloat(0.08125):
            pl = 0.101;
            break;
        case parseFloat(0.08250):
            pl = 0.098;
            break;
        case parseFloat(0.08375):
            pl = 0.095;
            break;
        case parseFloat(0.08500):
            pl = 0.092;
            break;
        case parseFloat(0.08625):
            pl = 0.089;
            break;
        case parseFloat(0.08750):
            pl = 0.087;
            break;
        case parseFloat(0.08875):
            pl = 0.084;
            break;
        case parseFloat(0.09000):
            pl = 0.081;
            break;
        case parseFloat(0.09125):
            pl = 0.079;
            break;
        case parseFloat(0.09250):
            pl = 0.077;
            break;
        case parseFloat(0.09375):
            pl = 0.074;
            break;
        case parseFloat(0.09500):
            pl = 0.072;
            break;
        case parseFloat(0.09625):
            pl = 0.07;
            break;
        case parseFloat(0.09750):
            pl = 0.068;
            break;
        case parseFloat(0.09875):
            pl = 0.066;
            break;
        }
        break;
    case 28:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.35;
            break;
        case parseFloat(0.03125):
            pl = 0.35;
            break;
        case parseFloat(0.03250):
            pl = 0.342;
            break;
        case parseFloat(0.03375):
            pl = 0.332;
            break;
        case parseFloat(0.03500):
            pl = 0.321;
            break;
        case parseFloat(0.03625):
            pl = 0.311;
            break;
        case parseFloat(0.03750):
            pl = 0.302;
            break;
        case parseFloat(0.03875):
            pl = 0.293;
            break;
        case parseFloat(0.04000):
            pl = 0.284;
            break;
        case parseFloat(0.04125):
            pl = 0.275;
            break;
        case parseFloat(0.04250):
            pl = 0.266;
            break;
        case parseFloat(0.04375):
            pl = 0.258;
            break;
        case parseFloat(0.04500):
            pl = 0.25;
            break;
        case parseFloat(0.04625):
            pl = 0.243;
            break;
        case parseFloat(0.04750):
            pl = 0.235;
            break;
        case parseFloat(0.04875):
            pl = 0.228;
            break;
        case parseFloat(0.05000):
            pl = 0.221;
            break;
        case parseFloat(0.05125):
            pl = 0.215;
            break;
        case parseFloat(0.05250):
            pl = 0.208;
            break;
        case parseFloat(0.05375):
            pl = 0.202;
            break;
        case parseFloat(0.05500):
            pl = 0.196;
            break;
        case parseFloat(0.05625):
            pl = 0.19;
            break;
        case parseFloat(0.05750):
            pl = 0.184;
            break;
        case parseFloat(0.05875):
            pl = 0.178;
            break;
        case parseFloat(0.06000):
            pl = 0.173;
            break;
        case parseFloat(0.06125):
            pl = 0.168;
            break;
        case parseFloat(0.06250):
            pl = 0.163;
            break;
        case parseFloat(0.06375):
            pl = 0.158;
            break;
        case parseFloat(0.06500):
            pl = 0.153;
            break;
        case parseFloat(0.06625):
            pl = 0.149;
            break;
        case parseFloat(0.06750):
            pl = 0.144;
            break;
        case parseFloat(0.06875):
            pl = 0.14;
            break;
        case parseFloat(0.07000):
            pl = 0.136;
            break;
        case parseFloat(0.07125):
            pl = 0.132;
            break;
        case parseFloat(0.07250):
            pl = 0.128;
            break;
        case parseFloat(0.07375):
            pl = 0.124;
            break;
        case parseFloat(0.07500):
            pl = 0.12;
            break;
        case parseFloat(0.07625):
            pl = 0.117;
            break;
        case parseFloat(0.07750):
            pl = 0.113;
            break;
        case parseFloat(0.07875):
            pl = 0.11;
            break;
        case parseFloat(0.08000):
            pl = 0.107;
            break;
        case parseFloat(0.08125):
            pl = 0.103;
            break;
        case parseFloat(0.08250):
            pl = 0.1;
            break;
        case parseFloat(0.08375):
            pl = 0.097;
            break;
        case parseFloat(0.08500):
            pl = 0.095;
            break;
        case parseFloat(0.08625):
            pl = 0.092;
            break;
        case parseFloat(0.08750):
            pl = 0.089;
            break;
        case parseFloat(0.08875):
            pl = 0.086;
            break;
        case parseFloat(0.09000):
            pl = 0.084;
            break;
        case parseFloat(0.09125):
            pl = 0.081;
            break;
        case parseFloat(0.09250):
            pl = 0.079;
            break;
        case parseFloat(0.09375):
            pl = 0.077;
            break;
        case parseFloat(0.09500):
            pl = 0.075;
            break;
        case parseFloat(0.09625):
            pl = 0.072;
            break;
        case parseFloat(0.09750):
            pl = 0.07;
            break;
        case parseFloat(0.09875):
            pl = 0.068;
            break;
        }
        break;
    case 29:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.35;
            break;
        case parseFloat(0.03125):
            pl = 0.35;
            break;
        case parseFloat(0.03250):
            pl = 0.346;
            break;
        case parseFloat(0.03375):
            pl = 0.336;
            break;
        case parseFloat(0.03500):
            pl = 0.325;
            break;
        case parseFloat(0.03625):
            pl = 0.316;
            break;
        case parseFloat(0.03750):
            pl = 0.306;
            break;
        case parseFloat(0.03875):
            pl = 0.297;
            break;
        case parseFloat(0.04000):
            pl = 0.288;
            break;
        case parseFloat(0.04125):
            pl = 0.279;
            break;
        case parseFloat(0.04250):
            pl = 0.271;
            break;
        case parseFloat(0.04375):
            pl = 0.262;
            break;
        case parseFloat(0.04500):
            pl = 0.254;
            break;
        case parseFloat(0.04625):
            pl = 0.247;
            break;
        case parseFloat(0.04750):
            pl = 0.239;
            break;
        case parseFloat(0.04875):
            pl = 0.232;
            break;
        case parseFloat(0.05000):
            pl = 0.225;
            break;
        case parseFloat(0.05125):
            pl = 0.218;
            break;
        case parseFloat(0.05250):
            pl = 0.212;
            break;
        case parseFloat(0.05375):
            pl = 0.206;
            break;
        case parseFloat(0.05500):
            pl = 0.199;
            break;
        case parseFloat(0.05625):
            pl = 0.193;
            break;
        case parseFloat(0.05750):
            pl = 0.188;
            break;
        case parseFloat(0.05875):
            pl = 0.182;
            break;
        case parseFloat(0.06000):
            pl = 0.177;
            break;
        case parseFloat(0.06125):
            pl = 0.171;
            break;
        case parseFloat(0.06250):
            pl = 0.166;
            break;
        case parseFloat(0.06375):
            pl = 0.161;
            break;
        case parseFloat(0.06500):
            pl = 0.157;
            break;
        case parseFloat(0.06625):
            pl = 0.152;
            break;
        case parseFloat(0.06750):
            pl = 0.148;
            break;
        case parseFloat(0.06875):
            pl = 0.143;
            break;
        case parseFloat(0.07000):
            pl = 0.139;
            break;
        case parseFloat(0.07125):
            pl = 0.135;
            break;
        case parseFloat(0.07250):
            pl = 0.131;
            break;
        case parseFloat(0.07375):
            pl = 0.127;
            break;
        case parseFloat(0.07500):
            pl = 0.123;
            break;
        case parseFloat(0.07625):
            pl = 0.12;
            break;
        case parseFloat(0.07750):
            pl = 0.116;
            break;
        case parseFloat(0.07875):
            pl = 0.113;
            break;
        case parseFloat(0.08000):
            pl = 0.11;
            break;
        case parseFloat(0.08125):
            pl = 0.106;
            break;
        case parseFloat(0.08250):
            pl = 0.103;
            break;
        case parseFloat(0.08375):
            pl = 0.1;
            break;
        case parseFloat(0.08500):
            pl = 0.097;
            break;
        case parseFloat(0.08625):
            pl = 0.094;
            break;
        case parseFloat(0.08750):
            pl = 0.092;
            break;
        case parseFloat(0.08875):
            pl = 0.089;
            break;
        case parseFloat(0.09000):
            pl = 0.086;
            break;
        case parseFloat(0.09125):
            pl = 0.084;
            break;
        case parseFloat(0.09250):
            pl = 0.082;
            break;
        case parseFloat(0.09375):
            pl = 0.079;
            break;
        case parseFloat(0.09500):
            pl = 0.077;
            break;
        case parseFloat(0.09625):
            pl = 0.075;
            break;
        case parseFloat(0.09750):
            pl = 0.073;
            break;
        case parseFloat(0.09875):
            pl = 0.07;
            break;
        }
        break;
    case 30:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.373;
            break;
        case parseFloat(0.03125):
            pl = 0.361;
            break;
        case parseFloat(0.03250):
            pl = 0.35;
            break;
        case parseFloat(0.03375):
            pl = 0.34;
            break;
        case parseFloat(0.03500):
            pl = 0.33;
            break;
        case parseFloat(0.03625):
            pl = 0.32;
            break;
        case parseFloat(0.03750):
            pl = 0.31;
            break;
        case parseFloat(0.03875):
            pl = 0.301;
            break;
        case parseFloat(0.04000):
            pl = 0.292;
            break;
        case parseFloat(0.04125):
            pl = 0.283;
            break;
        case parseFloat(0.04250):
            pl = 0.275;
            break;
        case parseFloat(0.04375):
            pl = 0.267;
            break;
        case parseFloat(0.04500):
            pl = 0.259;
            break;
        case parseFloat(0.04625):
            pl = 0.251;
            break;
        case parseFloat(0.04750):
            pl = 0.243;
            break;
        case parseFloat(0.04875):
            pl = 0.236;
            break;
        case parseFloat(0.05000):
            pl = 0.229;
            break;
        case parseFloat(0.05125):
            pl = 0.222;
            break;
        case parseFloat(0.05250):
            pl = 0.216;
            break;
        case parseFloat(0.05375):
            pl = 0.209;
            break;
        case parseFloat(0.05500):
            pl = 0.203;
            break;
        case parseFloat(0.05625):
            pl = 0.197;
            break;
        case parseFloat(0.05750):
            pl = 0.191;
            break;
        case parseFloat(0.05875):
            pl = 0.186;
            break;
        case parseFloat(0.06000):
            pl = 0.18;
            break;
        case parseFloat(0.06125):
            pl = 0.175;
            break;
        case parseFloat(0.06250):
            pl = 0.17;
            break;
        case parseFloat(0.06375):
            pl = 0.165;
            break;
        case parseFloat(0.06500):
            pl = 0.16;
            break;
        case parseFloat(0.06625):
            pl = 0.155;
            break;
        case parseFloat(0.06750):
            pl = 0.151;
            break;
        case parseFloat(0.06875):
            pl = 0.147;
            break;
        case parseFloat(0.07000):
            pl = 0.142;
            break;
        case parseFloat(0.07125):
            pl = 0.138;
            break;
        case parseFloat(0.07250):
            pl = 0.134;
            break;
        case parseFloat(0.07375):
            pl = 0.13;
            break;
        case parseFloat(0.07500):
            pl = 0.126;
            break;
        case parseFloat(0.07625):
            pl = 0.123;
            break;
        case parseFloat(0.07750):
            pl = 0.119;
            break;
        case parseFloat(0.07875):
            pl = 0.116;
            break;
        case parseFloat(0.08000):
            pl = 0.112;
            break;
        case parseFloat(0.08125):
            pl = 0.109;
            break;
        case parseFloat(0.08250):
            pl = 0.106;
            break;
        case parseFloat(0.08375):
            pl = 0.103;
            break;
        case parseFloat(0.08500):
            pl = 0.1;
            break;
        case parseFloat(0.08625):
            pl = 0.097;
            break;
        case parseFloat(0.08750):
            pl = 0.094;
            break;
        case parseFloat(0.08875):
            pl = 0.092;
            break;
        case parseFloat(0.09000):
            pl = 0.089;
            break;
        case parseFloat(0.09125):
            pl = 0.087;
            break;
        case parseFloat(0.09250):
            pl = 0.084;
            break;
        case parseFloat(0.09375):
            pl = 0.082;
            break;
        case parseFloat(0.09500):
            pl = 0.079;
            break;
        case parseFloat(0.09625):
            pl = 0.077;
            break;
        case parseFloat(0.09750):
            pl = 0.075;
            break;
        case parseFloat(0.09875):
            pl = 0.073;
            break;
        }
        break;
    case 31:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.373;
            break;
        case parseFloat(0.03125):
            pl = 0.366;
            break;
        case parseFloat(0.03250):
            pl = 0.355;
            break;
        case parseFloat(0.03375):
            pl = 0.344;
            break;
        case parseFloat(0.03500):
            pl = 0.334;
            break;
        case parseFloat(0.03625):
            pl = 0.324;
            break;
        case parseFloat(0.03750):
            pl = 0.314;
            break;
        case parseFloat(0.03875):
            pl = 0.305;
            break;
        case parseFloat(0.04000):
            pl = 0.296;
            break;
        case parseFloat(0.04125):
            pl = 0.287;
            break;
        case parseFloat(0.04250):
            pl = 0.279;
            break;
        case parseFloat(0.04375):
            pl = 0.271;
            break;
        case parseFloat(0.04500):
            pl = 0.263;
            break;
        case parseFloat(0.04625):
            pl = 0.255;
            break;
        case parseFloat(0.04750):
            pl = 0.248;
            break;
        case parseFloat(0.04875):
            pl = 0.24;
            break;
        case parseFloat(0.05000):
            pl = 0.233;
            break;
        case parseFloat(0.05125):
            pl = 0.226;
            break;
        case parseFloat(0.05250):
            pl = 0.22;
            break;
        case parseFloat(0.05375):
            pl = 0.213;
            break;
        case parseFloat(0.05500):
            pl = 0.207;
            break;
        case parseFloat(0.05625):
            pl = 0.201;
            break;
        case parseFloat(0.05750):
            pl = 0.195;
            break;
        case parseFloat(0.05875):
            pl = 0.19;
            break;
        case parseFloat(0.06000):
            pl = 0.184;
            break;
        case parseFloat(0.06125):
            pl = 0.179;
            break;
        case parseFloat(0.06250):
            pl = 0.174;
            break;
        case parseFloat(0.06375):
            pl = 0.169;
            break;
        case parseFloat(0.06500):
            pl = 0.164;
            break;
        case parseFloat(0.06625):
            pl = 0.159;
            break;
        case parseFloat(0.06750):
            pl = 0.154;
            break;
        case parseFloat(0.06875):
            pl = 0.15;
            break;
        case parseFloat(0.07000):
            pl = 0.146;
            break;
        case parseFloat(0.07125):
            pl = 0.142;
            break;
        case parseFloat(0.07250):
            pl = 0.137;
            break;
        case parseFloat(0.07375):
            pl = 0.134;
            break;
        case parseFloat(0.07500):
            pl = 0.13;
            break;
        case parseFloat(0.07625):
            pl = 0.126;
            break;
        case parseFloat(0.07750):
            pl = 0.122;
            break;
        case parseFloat(0.07875):
            pl = 0.119;
            break;
        case parseFloat(0.08000):
            pl = 0.116;
            break;
        case parseFloat(0.08125):
            pl = 0.112;
            break;
        case parseFloat(0.08250):
            pl = 0.109;
            break;
        case parseFloat(0.08375):
            pl = 0.106;
            break;
        case parseFloat(0.08500):
            pl = 0.103;
            break;
        case parseFloat(0.08625):
            pl = 0.1;
            break;
        case parseFloat(0.08750):
            pl = 0.097;
            break;
        case parseFloat(0.08875):
            pl = 0.094;
            break;
        case parseFloat(0.09000):
            pl = 0.092;
            break;
        case parseFloat(0.09125):
            pl = 0.089;
            break;
        case parseFloat(0.09250):
            pl = 0.087;
            break;
        case parseFloat(0.09375):
            pl = 0.084;
            break;
        case parseFloat(0.09500):
            pl = 0.082;
            break;
        case parseFloat(0.09625):
            pl = 0.08;
            break;
        case parseFloat(0.09750):
            pl = 0.077;
            break;
        case parseFloat(0.09875):
            pl = 0.075;
            break;
        }
        break;
    case 32:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.373;
            break;
        case parseFloat(0.03125):
            pl = 0.37;
            break;
        case parseFloat(0.03250):
            pl = 0.359;
            break;
        case parseFloat(0.03375):
            pl = 0.348;
            break;
        case parseFloat(0.03500):
            pl = 0.338;
            break;
        case parseFloat(0.03625):
            pl = 0.328;
            break;
        case parseFloat(0.03750):
            pl = 0.319;
            break;
        case parseFloat(0.03875):
            pl = 0.309;
            break;
        case parseFloat(0.04000):
            pl = 0.3;
            break;
        case parseFloat(0.04125):
            pl = 0.292;
            break;
        case parseFloat(0.04250):
            pl = 0.283;
            break;
        case parseFloat(0.04375):
            pl = 0.275;
            break;
        case parseFloat(0.04500):
            pl = 0.267;
            break;
        case parseFloat(0.04625):
            pl = 0.259;
            break;
        case parseFloat(0.04750):
            pl = 0.252;
            break;
        case parseFloat(0.04875):
            pl = 0.244;
            break;
        case parseFloat(0.05000):
            pl = 0.237;
            break;
        case parseFloat(0.05125):
            pl = 0.231;
            break;
        case parseFloat(0.05250):
            pl = 0.224;
            break;
        case parseFloat(0.05375):
            pl = 0.217;
            break;
        case parseFloat(0.05500):
            pl = 0.211;
            break;
        case parseFloat(0.05625):
            pl = 0.205;
            break;
        case parseFloat(0.05750):
            pl = 0.199;
            break;
        case parseFloat(0.05875):
            pl = 0.194;
            break;
        case parseFloat(0.06000):
            pl = 0.188;
            break;
        case parseFloat(0.06125):
            pl = 0.183;
            break;
        case parseFloat(0.06250):
            pl = 0.177;
            break;
        case parseFloat(0.06375):
            pl = 0.172;
            break;
        case parseFloat(0.06500):
            pl = 0.167;
            break;
        case parseFloat(0.06625):
            pl = 0.163;
            break;
        case parseFloat(0.06750):
            pl = 0.158;
            break;
        case parseFloat(0.06875):
            pl = 0.154;
            break;
        case parseFloat(0.07000):
            pl = 0.149;
            break;
        case parseFloat(0.07125):
            pl = 0.145;
            break;
        case parseFloat(0.07250):
            pl = 0.141;
            break;
        case parseFloat(0.07375):
            pl = 0.137;
            break;
        case parseFloat(0.07500):
            pl = 0.133;
            break;
        case parseFloat(0.07625):
            pl = 0.129;
            break;
        case parseFloat(0.07750):
            pl = 0.126;
            break;
        case parseFloat(0.07875):
            pl = 0.122;
            break;
        case parseFloat(0.08000):
            pl = 0.119;
            break;
        case parseFloat(0.08125):
            pl = 0.115;
            break;
        case parseFloat(0.08250):
            pl = 0.112;
            break;
        case parseFloat(0.08375):
            pl = 0.109;
            break;
        case parseFloat(0.08500):
            pl = 0.106;
            break;
        case parseFloat(0.08625):
            pl = 0.103;
            break;
        case parseFloat(0.08750):
            pl = 0.1;
            break;
        case parseFloat(0.08875):
            pl = 0.097;
            break;
        case parseFloat(0.09000):
            pl = 0.095;
            break;
        case parseFloat(0.09125):
            pl = 0.092;
            break;
        case parseFloat(0.09250):
            pl = 0.089;
            break;
        case parseFloat(0.09375):
            pl = 0.087;
            break;
        case parseFloat(0.09500):
            pl = 0.084;
            break;
        case parseFloat(0.09625):
            pl = 0.082;
            break;
        case parseFloat(0.09750):
            pl = 0.08;
            break;
        case parseFloat(0.09875):
            pl = 0.078;
            break;
        }
        break;
    case 33:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.373;
            break;
        case parseFloat(0.03125):
            pl = 0.373;
            break;
        case parseFloat(0.03250):
            pl = 0.363;
            break;
        case parseFloat(0.03375):
            pl = 0.353;
            break;
        case parseFloat(0.03500):
            pl = 0.343;
            break;
        case parseFloat(0.03625):
            pl = 0.333;
            break;
        case parseFloat(0.03750):
            pl = 0.323;
            break;
        case parseFloat(0.03875):
            pl = 0.314;
            break;
        case parseFloat(0.04000):
            pl = 0.305;
            break;
        case parseFloat(0.04125):
            pl = 0.296;
            break;
        case parseFloat(0.04250):
            pl = 0.288;
            break;
        case parseFloat(0.04375):
            pl = 0.279;
            break;
        case parseFloat(0.04500):
            pl = 0.271;
            break;
        case parseFloat(0.04625):
            pl = 0.264;
            break;
        case parseFloat(0.04750):
            pl = 0.256;
            break;
        case parseFloat(0.04875):
            pl = 0.249;
            break;
        case parseFloat(0.05000):
            pl = 0.242;
            break;
        case parseFloat(0.05125):
            pl = 0.235;
            break;
        case parseFloat(0.05250):
            pl = 0.228;
            break;
        case parseFloat(0.05375):
            pl = 0.222;
            break;
        case parseFloat(0.05500):
            pl = 0.215;
            break;
        case parseFloat(0.05625):
            pl = 0.209;
            break;
        case parseFloat(0.05750):
            pl = 0.203;
            break;
        case parseFloat(0.05875):
            pl = 0.197;
            break;
        case parseFloat(0.06000):
            pl = 0.192;
            break;
        case parseFloat(0.06125):
            pl = 0.186;
            break;
        case parseFloat(0.06250):
            pl = 0.181;
            break;
        case parseFloat(0.06375):
            pl = 0.176;
            break;
        case parseFloat(0.06500):
            pl = 0.171;
            break;
        case parseFloat(0.06625):
            pl = 0.166;
            break;
        case parseFloat(0.06750):
            pl = 0.162;
            break;
        case parseFloat(0.06875):
            pl = 0.157;
            break;
        case parseFloat(0.07000):
            pl = 0.153;
            break;
        case parseFloat(0.07125):
            pl = 0.148;
            break;
        case parseFloat(0.07250):
            pl = 0.144;
            break;
        case parseFloat(0.07375):
            pl = 0.14;
            break;
        case parseFloat(0.07500):
            pl = 0.136;
            break;
        case parseFloat(0.07625):
            pl = 0.133;
            break;
        case parseFloat(0.07750):
            pl = 0.129;
            break;
        case parseFloat(0.07875):
            pl = 0.125;
            break;
        case parseFloat(0.08000):
            pl = 0.122;
            break;
        case parseFloat(0.08125):
            pl = 0.118;
            break;
        case parseFloat(0.08250):
            pl = 0.115;
            break;
        case parseFloat(0.08375):
            pl = 0.112;
            break;
        case parseFloat(0.08500):
            pl = 0.109;
            break;
        case parseFloat(0.08625):
            pl = 0.106;
            break;
        case parseFloat(0.08750):
            pl = 0.103;
            break;
        case parseFloat(0.08875):
            pl = 0.1;
            break;
        case parseFloat(0.09000):
            pl = 0.097;
            break;
        case parseFloat(0.09125):
            pl = 0.095;
            break;
        case parseFloat(0.09250):
            pl = 0.092;
            break;
        case parseFloat(0.09375):
            pl = 0.09;
            break;
        case parseFloat(0.09500):
            pl = 0.087;
            break;
        case parseFloat(0.09625):
            pl = 0.085;
            break;
        case parseFloat(0.09750):
            pl = 0.082;
            break;
        case parseFloat(0.09875):
            pl = 0.08;
            break;
        }
        break;
    case 34:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.373;
            break;
        case parseFloat(0.03125):
            pl = 0.373;
            break;
        case parseFloat(0.03250):
            pl = 0.368;
            break;
        case parseFloat(0.03375):
            pl = 0.357;
            break;
        case parseFloat(0.03500):
            pl = 0.347;
            break;
        case parseFloat(0.03625):
            pl = 0.337;
            break;
        case parseFloat(0.03750):
            pl = 0.328;
            break;
        case parseFloat(0.03875):
            pl = 0.318;
            break;
        case parseFloat(0.04000):
            pl = 0.309;
            break;
        case parseFloat(0.04125):
            pl = 0.3;
            break;
        case parseFloat(0.04250):
            pl = 0.292;
            break;
        case parseFloat(0.04375):
            pl = 0.284;
            break;
        case parseFloat(0.04500):
            pl = 0.276;
            break;
        case parseFloat(0.04625):
            pl = 0.268;
            break;
        case parseFloat(0.04750):
            pl = 0.26;
            break;
        case parseFloat(0.04875):
            pl = 0.253;
            break;
        case parseFloat(0.05000):
            pl = 0.246;
            break;
        case parseFloat(0.05125):
            pl = 0.239;
            break;
        case parseFloat(0.05250):
            pl = 0.232;
            break;
        case parseFloat(0.05375):
            pl = 0.226;
            break;
        case parseFloat(0.05500):
            pl = 0.219;
            break;
        case parseFloat(0.05625):
            pl = 0.213;
            break;
        case parseFloat(0.05750):
            pl = 0.207;
            break;
        case parseFloat(0.05875):
            pl = 0.202;
            break;
        case parseFloat(0.06000):
            pl = 0.196;
            break;
        case parseFloat(0.06125):
            pl = 0.19;
            break;
        case parseFloat(0.06250):
            pl = 0.185;
            break;
        case parseFloat(0.06375):
            pl = 0.18;
            break;
        case parseFloat(0.06500):
            pl = 0.175;
            break;
        case parseFloat(0.06625):
            pl = 0.17;
            break;
        case parseFloat(0.06750):
            pl = 0.165;
            break;
        case parseFloat(0.06875):
            pl = 0.161;
            break;
        case parseFloat(0.07000):
            pl = 0.156;
            break;
        case parseFloat(0.07125):
            pl = 0.152;
            break;
        case parseFloat(0.07250):
            pl = 0.148;
            break;
        case parseFloat(0.07375):
            pl = 0.144;
            break;
        case parseFloat(0.07500):
            pl = 0.14;
            break;
        case parseFloat(0.07625):
            pl = 0.136;
            break;
        case parseFloat(0.07750):
            pl = 0.132;
            break;
        case parseFloat(0.07875):
            pl = 0.129;
            break;
        case parseFloat(0.08000):
            pl = 0.125;
            break;
        case parseFloat(0.08125):
            pl = 0.122;
            break;
        case parseFloat(0.08250):
            pl = 0.118;
            break;
        case parseFloat(0.08375):
            pl = 0.115;
            break;
        case parseFloat(0.08500):
            pl = 0.112;
            break;
        case parseFloat(0.08625):
            pl = 0.109;
            break;
        case parseFloat(0.08750):
            pl = 0.106;
            break;
        case parseFloat(0.08875):
            pl = 0.103;
            break;
        case parseFloat(0.09000):
            pl = 0.1;
            break;
        case parseFloat(0.09125):
            pl = 0.098;
            break;
        case parseFloat(0.09250):
            pl = 0.095;
            break;
        case parseFloat(0.09375):
            pl = 0.092;
            break;
        case parseFloat(0.09500):
            pl = 0.09;
            break;
        case parseFloat(0.09625):
            pl = 0.087;
            break;
        case parseFloat(0.09750):
            pl = 0.085;
            break;
        case parseFloat(0.09875):
            pl = 0.083;
            break;
        }
        break;
    case 35:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.394;
            break;
        case parseFloat(0.03125):
            pl = 0.383;
            break;
        case parseFloat(0.03250):
            pl = 0.372;
            break;
        case parseFloat(0.03375):
            pl = 0.362;
            break;
        case parseFloat(0.03500):
            pl = 0.352;
            break;
        case parseFloat(0.03625):
            pl = 0.342;
            break;
        case parseFloat(0.03750):
            pl = 0.332;
            break;
        case parseFloat(0.03875):
            pl = 0.323;
            break;
        case parseFloat(0.04000):
            pl = 0.314;
            break;
        case parseFloat(0.04125):
            pl = 0.305;
            break;
        case parseFloat(0.04250):
            pl = 0.296;
            break;
        case parseFloat(0.04375):
            pl = 0.288;
            break;
        case parseFloat(0.04500):
            pl = 0.28;
            break;
        case parseFloat(0.04625):
            pl = 0.272;
            break;
        case parseFloat(0.04750):
            pl = 0.265;
            break;
        case parseFloat(0.04875):
            pl = 0.257;
            break;
        case parseFloat(0.05000):
            pl = 0.25;
            break;
        case parseFloat(0.05125):
            pl = 0.243;
            break;
        case parseFloat(0.05250):
            pl = 0.237;
            break;
        case parseFloat(0.05375):
            pl = 0.23;
            break;
        case parseFloat(0.05500):
            pl = 0.224;
            break;
        case parseFloat(0.05625):
            pl = 0.217;
            break;
        case parseFloat(0.05750):
            pl = 0.211;
            break;
        case parseFloat(0.05875):
            pl = 0.206;
            break;
        case parseFloat(0.06000):
            pl = 0.2;
            break;
        case parseFloat(0.06125):
            pl = 0.194;
            break;
        case parseFloat(0.06250):
            pl = 0.189;
            break;
        case parseFloat(0.06375):
            pl = 0.184;
            break;
        case parseFloat(0.06500):
            pl = 0.179;
            break;
        case parseFloat(0.06625):
            pl = 0.174;
            break;
        case parseFloat(0.06750):
            pl = 0.169;
            break;
        case parseFloat(0.06875):
            pl = 0.165;
            break;
        case parseFloat(0.07000):
            pl = 0.16;
            break;
        case parseFloat(0.07125):
            pl = 0.156;
            break;
        case parseFloat(0.07250):
            pl = 0.152;
            break;
        case parseFloat(0.07375):
            pl = 0.147;
            break;
        case parseFloat(0.07500):
            pl = 0.143;
            break;
        case parseFloat(0.07625):
            pl = 0.14;
            break;
        case parseFloat(0.07750):
            pl = 0.136;
            break;
        case parseFloat(0.07875):
            pl = 0.132;
            break;
        case parseFloat(0.08000):
            pl = 0.129;
            break;
        case parseFloat(0.08125):
            pl = 0.125;
            break;
        case parseFloat(0.08250):
            pl = 0.122;
            break;
        case parseFloat(0.08375):
            pl = 0.118;
            break;
        case parseFloat(0.08500):
            pl = 0.115;
            break;
        case parseFloat(0.08625):
            pl = 0.112;
            break;
        case parseFloat(0.08750):
            pl = 0.109;
            break;
        case parseFloat(0.08875):
            pl = 0.106;
            break;
        case parseFloat(0.09000):
            pl = 0.103;
            break;
        case parseFloat(0.09125):
            pl = 0.101;
            break;
        case parseFloat(0.09250):
            pl = 0.098;
            break;
        case parseFloat(0.09375):
            pl = 0.095;
            break;
        case parseFloat(0.09500):
            pl = 0.093;
            break;
        case parseFloat(0.09625):
            pl = 0.09;
            break;
        case parseFloat(0.09750):
            pl = 0.088;
            break;
        case parseFloat(0.09875):
            pl = 0.086;
            break;
        }
        break;
    case 36:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.396;
            break;
        case parseFloat(0.03125):
            pl = 0.388;
            break;
        case parseFloat(0.03250):
            pl = 0.377;
            break;
        case parseFloat(0.03375):
            pl = 0.366;
            break;
        case parseFloat(0.03500):
            pl = 0.356;
            break;
        case parseFloat(0.03625):
            pl = 0.346;
            break;
        case parseFloat(0.03750):
            pl = 0.337;
            break;
        case parseFloat(0.03875):
            pl = 0.327;
            break;
        case parseFloat(0.04000):
            pl = 0.318;
            break;
        case parseFloat(0.04125):
            pl = 0.309;
            break;
        case parseFloat(0.04250):
            pl = 0.301;
            break;
        case parseFloat(0.04375):
            pl = 0.293;
            break;
        case parseFloat(0.04500):
            pl = 0.285;
            break;
        case parseFloat(0.04625):
            pl = 0.277;
            break;
        case parseFloat(0.04750):
            pl = 0.269;
            break;
        case parseFloat(0.04875):
            pl = 0.262;
            break;
        case parseFloat(0.05000):
            pl = 0.255;
            break;
        case parseFloat(0.05125):
            pl = 0.248;
            break;
        case parseFloat(0.05250):
            pl = 0.241;
            break;
        case parseFloat(0.05375):
            pl = 0.234;
            break;
        case parseFloat(0.05500):
            pl = 0.228;
            break;
        case parseFloat(0.05625):
            pl = 0.222;
            break;
        case parseFloat(0.05750):
            pl = 0.216;
            break;
        case parseFloat(0.05875):
            pl = 0.21;
            break;
        case parseFloat(0.06000):
            pl = 0.204;
            break;
        case parseFloat(0.06125):
            pl = 0.199;
            break;
        case parseFloat(0.06250):
            pl = 0.193;
            break;
        case parseFloat(0.06375):
            pl = 0.188;
            break;
        case parseFloat(0.06500):
            pl = 0.183;
            break;
        case parseFloat(0.06625):
            pl = 0.178;
            break;
        case parseFloat(0.06750):
            pl = 0.173;
            break;
        case parseFloat(0.06875):
            pl = 0.169;
            break;
        case parseFloat(0.07000):
            pl = 0.164;
            break;
        case parseFloat(0.07125):
            pl = 0.16;
            break;
        case parseFloat(0.07250):
            pl = 0.155;
            break;
        case parseFloat(0.07375):
            pl = 0.151;
            break;
        case parseFloat(0.07500):
            pl = 0.147;
            break;
        case parseFloat(0.07625):
            pl = 0.143;
            break;
        case parseFloat(0.07750):
            pl = 0.139;
            break;
        case parseFloat(0.07875):
            pl = 0.136;
            break;
        case parseFloat(0.08000):
            pl = 0.132;
            break;
        case parseFloat(0.08125):
            pl = 0.129;
            break;
        case parseFloat(0.08250):
            pl = 0.125;
            break;
        case parseFloat(0.08375):
            pl = 0.122;
            break;
        case parseFloat(0.08500):
            pl = 0.119;
            break;
        case parseFloat(0.08625):
            pl = 0.115;
            break;
        case parseFloat(0.08750):
            pl = 0.112;
            break;
        case parseFloat(0.08875):
            pl = 0.109;
            break;
        case parseFloat(0.09000):
            pl = 0.106;
            break;
        case parseFloat(0.09125):
            pl = 0.104;
            break;
        case parseFloat(0.09250):
            pl = 0.101;
            break;
        case parseFloat(0.09375):
            pl = 0.098;
            break;
        case parseFloat(0.09500):
            pl = 0.096;
            break;
        case parseFloat(0.09625):
            pl = 0.093;
            break;
        case parseFloat(0.09750):
            pl = 0.091;
            break;
        case parseFloat(0.09875):
            pl = 0.088;
            break;
        }
        break;
    case 37:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.396;
            break;
        case parseFloat(0.03125):
            pl = 0.392;
            break;
        case parseFloat(0.03250):
            pl = 0.381;
            break;
        case parseFloat(0.03375):
            pl = 0.371;
            break;
        case parseFloat(0.03500):
            pl = 0.361;
            break;
        case parseFloat(0.03625):
            pl = 0.351;
            break;
        case parseFloat(0.03750):
            pl = 0.341;
            break;
        case parseFloat(0.03875):
            pl = 0.332;
            break;
        case parseFloat(0.04000):
            pl = 0.323;
            break;
        case parseFloat(0.04125):
            pl = 0.314;
            break;
        case parseFloat(0.04250):
            pl = 0.306;
            break;
        case parseFloat(0.04375):
            pl = 0.297;
            break;
        case parseFloat(0.04500):
            pl = 0.289;
            break;
        case parseFloat(0.04625):
            pl = 0.281;
            break;
        case parseFloat(0.04750):
            pl = 0.274;
            break;
        case parseFloat(0.04875):
            pl = 0.266;
            break;
        case parseFloat(0.05000):
            pl = 0.259;
            break;
        case parseFloat(0.05125):
            pl = 0.252;
            break;
        case parseFloat(0.05250):
            pl = 0.245;
            break;
        case parseFloat(0.05375):
            pl = 0.239;
            break;
        case parseFloat(0.05500):
            pl = 0.232;
            break;
        case parseFloat(0.05625):
            pl = 0.226;
            break;
        case parseFloat(0.05750):
            pl = 0.22;
            break;
        case parseFloat(0.05875):
            pl = 0.214;
            break;
        case parseFloat(0.06000):
            pl = 0.208;
            break;
        case parseFloat(0.06125):
            pl = 0.203;
            break;
        case parseFloat(0.06250):
            pl = 0.197;
            break;
        case parseFloat(0.06375):
            pl = 0.192;
            break;
        case parseFloat(0.06500):
            pl = 0.187;
            break;
        case parseFloat(0.06625):
            pl = 0.182;
            break;
        case parseFloat(0.06750):
            pl = 0.177;
            break;
        case parseFloat(0.06875):
            pl = 0.173;
            break;
        case parseFloat(0.07000):
            pl = 0.168;
            break;
        case parseFloat(0.07125):
            pl = 0.163;
            break;
        case parseFloat(0.07250):
            pl = 0.159;
            break;
        case parseFloat(0.07375):
            pl = 0.155;
            break;
        case parseFloat(0.07500):
            pl = 0.151;
            break;
        case parseFloat(0.07625):
            pl = 0.147;
            break;
        case parseFloat(0.07750):
            pl = 0.143;
            break;
        case parseFloat(0.07875):
            pl = 0.139;
            break;
        case parseFloat(0.08000):
            pl = 0.136;
            break;
        case parseFloat(0.08125):
            pl = 0.132;
            break;
        case parseFloat(0.08250):
            pl = 0.129;
            break;
        case parseFloat(0.08375):
            pl = 0.125;
            break;
        case parseFloat(0.08500):
            pl = 0.122;
            break;
        case parseFloat(0.08625):
            pl = 0.119;
            break;
        case parseFloat(0.08750):
            pl = 0.116;
            break;
        case parseFloat(0.08875):
            pl = 0.113;
            break;
        case parseFloat(0.09000):
            pl = 0.11;
            break;
        case parseFloat(0.09125):
            pl = 0.107;
            break;
        case parseFloat(0.09250):
            pl = 0.104;
            break;
        case parseFloat(0.09375):
            pl = 0.101;
            break;
        case parseFloat(0.09500):
            pl = 0.099;
            break;
        case parseFloat(0.09625):
            pl = 0.096;
            break;
        case parseFloat(0.09750):
            pl = 0.094;
            break;
        case parseFloat(0.09875):
            pl = 0.091;
            break;
        }
        break;
    case 38:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.396;
            break;
        case parseFloat(0.03125):
            pl = 0.396;
            break;
        case parseFloat(0.03250):
            pl = 0.386;
            break;
        case parseFloat(0.03375):
            pl = 0.376;
            break;
        case parseFloat(0.03500):
            pl = 0.365;
            break;
        case parseFloat(0.03625):
            pl = 0.356;
            break;
        case parseFloat(0.03750):
            pl = 0.346;
            break;
        case parseFloat(0.03875):
            pl = 0.337;
            break;
        case parseFloat(0.04000):
            pl = 0.328;
            break;
        case parseFloat(0.04125):
            pl = 0.319;
            break;
        case parseFloat(0.04250):
            pl = 0.31;
            break;
        case parseFloat(0.04375):
            pl = 0.302;
            break;
        case parseFloat(0.04500):
            pl = 0.294;
            break;
        case parseFloat(0.04625):
            pl = 0.286;
            break;
        case parseFloat(0.04750):
            pl = 0.278;
            break;
        case parseFloat(0.04875):
            pl = 0.271;
            break;
        case parseFloat(0.05000):
            pl = 0.264;
            break;
        case parseFloat(0.05125):
            pl = 0.257;
            break;
        case parseFloat(0.05250):
            pl = 0.25;
            break;
        case parseFloat(0.05375):
            pl = 0.243;
            break;
        case parseFloat(0.05500):
            pl = 0.237;
            break;
        case parseFloat(0.05625):
            pl = 0.231;
            break;
        case parseFloat(0.05750):
            pl = 0.224;
            break;
        case parseFloat(0.05875):
            pl = 0.219;
            break;
        case parseFloat(0.06000):
            pl = 0.213;
            break;
        case parseFloat(0.06125):
            pl = 0.207;
            break;
        case parseFloat(0.06250):
            pl = 0.202;
            break;
        case parseFloat(0.06375):
            pl = 0.196;
            break;
        case parseFloat(0.06500):
            pl = 0.191;
            break;
        case parseFloat(0.06625):
            pl = 0.186;
            break;
        case parseFloat(0.06750):
            pl = 0.181;
            break;
        case parseFloat(0.06875):
            pl = 0.177;
            break;
        case parseFloat(0.07000):
            pl = 0.172;
            break;
        case parseFloat(0.07125):
            pl = 0.167;
            break;
        case parseFloat(0.07250):
            pl = 0.163;
            break;
        case parseFloat(0.07375):
            pl = 0.159;
            break;
        case parseFloat(0.07500):
            pl = 0.155;
            break;
        case parseFloat(0.07625):
            pl = 0.151;
            break;
        case parseFloat(0.07750):
            pl = 0.147;
            break;
        case parseFloat(0.07875):
            pl = 0.143;
            break;
        case parseFloat(0.08000):
            pl = 0.139;
            break;
        case parseFloat(0.08125):
            pl = 0.136;
            break;
        case parseFloat(0.08250):
            pl = 0.132;
            break;
        case parseFloat(0.08375):
            pl = 0.129;
            break;
        case parseFloat(0.08500):
            pl = 0.125;
            break;
        case parseFloat(0.08625):
            pl = 0.122;
            break;
        case parseFloat(0.08750):
            pl = 0.119;
            break;
        case parseFloat(0.08875):
            pl = 0.116;
            break;
        case parseFloat(0.09000):
            pl = 0.113;
            break;
        case parseFloat(0.09125):
            pl = 0.11;
            break;
        case parseFloat(0.09250):
            pl = 0.107;
            break;
        case parseFloat(0.09375):
            pl = 0.105;
            break;
        case parseFloat(0.09500):
            pl = 0.102;
            break;
        case parseFloat(0.09625):
            pl = 0.099;
            break;
        case parseFloat(0.09750):
            pl = 0.097;
            break;
        case parseFloat(0.09875):
            pl = 0.094;
            break;
        }
        break;
    case 39:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.396;
            break;
        case parseFloat(0.03125):
            pl = 0.396;
            break;
        case parseFloat(0.03250):
            pl = 0.391;
            break;
        case parseFloat(0.03375):
            pl = 0.38;
            break;
        case parseFloat(0.03500):
            pl = 0.37;
            break;
        case parseFloat(0.03625):
            pl = 0.36;
            break;
        case parseFloat(0.03750):
            pl = 0.351;
            break;
        case parseFloat(0.03875):
            pl = 0.341;
            break;
        case parseFloat(0.04000):
            pl = 0.332;
            break;
        case parseFloat(0.04125):
            pl = 0.324;
            break;
        case parseFloat(0.04250):
            pl = 0.315;
            break;
        case parseFloat(0.04375):
            pl = 0.307;
            break;
        case parseFloat(0.04500):
            pl = 0.299;
            break;
        case parseFloat(0.04625):
            pl = 0.291;
            break;
        case parseFloat(0.04750):
            pl = 0.283;
            break;
        case parseFloat(0.04875):
            pl = 0.276;
            break;
        case parseFloat(0.05000):
            pl = 0.268;
            break;
        case parseFloat(0.05125):
            pl = 0.261;
            break;
        case parseFloat(0.05250):
            pl = 0.255;
            break;
        case parseFloat(0.05375):
            pl = 0.248;
            break;
        case parseFloat(0.05500):
            pl = 0.241;
            break;
        case parseFloat(0.05625):
            pl = 0.235;
            break;
        case parseFloat(0.05750):
            pl = 0.229;
            break;
        case parseFloat(0.05875):
            pl = 0.223;
            break;
        case parseFloat(0.06000):
            pl = 0.217;
            break;
        case parseFloat(0.06125):
            pl = 0.212;
            break;
        case parseFloat(0.06250):
            pl = 0.206;
            break;
        case parseFloat(0.06375):
            pl = 0.201;
            break;
        case parseFloat(0.06500):
            pl = 0.196;
            break;
        case parseFloat(0.06625):
            pl = 0.19;
            break;
        case parseFloat(0.06750):
            pl = 0.186;
            break;
        case parseFloat(0.06875):
            pl = 0.181;
            break;
        case parseFloat(0.07000):
            pl = 0.176;
            break;
        case parseFloat(0.07125):
            pl = 0.172;
            break;
        case parseFloat(0.07250):
            pl = 0.167;
            break;
        case parseFloat(0.07375):
            pl = 0.163;
            break;
        case parseFloat(0.07500):
            pl = 0.159;
            break;
        case parseFloat(0.07625):
            pl = 0.155;
            break;
        case parseFloat(0.07750):
            pl = 0.151;
            break;
        case parseFloat(0.07875):
            pl = 0.147;
            break;
        case parseFloat(0.08000):
            pl = 0.143;
            break;
        case parseFloat(0.08125):
            pl = 0.139;
            break;
        case parseFloat(0.08250):
            pl = 0.136;
            break;
        case parseFloat(0.08375):
            pl = 0.132;
            break;
        case parseFloat(0.08500):
            pl = 0.129;
            break;
        case parseFloat(0.08625):
            pl = 0.126;
            break;
        case parseFloat(0.08750):
            pl = 0.123;
            break;
        case parseFloat(0.08875):
            pl = 0.119;
            break;
        case parseFloat(0.09000):
            pl = 0.116;
            break;
        case parseFloat(0.09125):
            pl = 0.113;
            break;
        case parseFloat(0.09250):
            pl = 0.111;
            break;
        case parseFloat(0.09375):
            pl = 0.108;
            break;
        case parseFloat(0.09500):
            pl = 0.105;
            break;
        case parseFloat(0.09625):
            pl = 0.102;
            break;
        case parseFloat(0.09750):
            pl = 0.1;
            break;
        case parseFloat(0.09875):
            pl = 0.097;
            break;
        }
        break;
    case 40:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.417;
            break;
        case parseFloat(0.03125):
            pl = 0.406;
            break;
        case parseFloat(0.03250):
            pl = 0.395;
            break;
        case parseFloat(0.03375):
            pl = 0.385;
            break;
        case parseFloat(0.03500):
            pl = 0.375;
            break;
        case parseFloat(0.03625):
            pl = 0.365;
            break;
        case parseFloat(0.03750):
            pl = 0.356;
            break;
        case parseFloat(0.03875):
            pl = 0.346;
            break;
        case parseFloat(0.04000):
            pl = 0.337;
            break;
        case parseFloat(0.04125):
            pl = 0.328;
            break;
        case parseFloat(0.04250):
            pl = 0.32;
            break;
        case parseFloat(0.04375):
            pl = 0.311;
            break;
        case parseFloat(0.04500):
            pl = 0.303;
            break;
        case parseFloat(0.04625):
            pl = 0.296;
            break;
        case parseFloat(0.04750):
            pl = 0.288;
            break;
        case parseFloat(0.04875):
            pl = 0.28;
            break;
        case parseFloat(0.05000):
            pl = 0.273;
            break;
        case parseFloat(0.05125):
            pl = 0.266;
            break;
        case parseFloat(0.05250):
            pl = 0.259;
            break;
        case parseFloat(0.05375):
            pl = 0.253;
            break;
        case parseFloat(0.05500):
            pl = 0.246;
            break;
        case parseFloat(0.05625):
            pl = 0.24;
            break;
        case parseFloat(0.05750):
            pl = 0.234;
            break;
        case parseFloat(0.05875):
            pl = 0.228;
            break;
        case parseFloat(0.06000):
            pl = 0.222;
            break;
        case parseFloat(0.06125):
            pl = 0.216;
            break;
        case parseFloat(0.06250):
            pl = 0.211;
            break;
        case parseFloat(0.06375):
            pl = 0.205;
            break;
        case parseFloat(0.06500):
            pl = 0.2;
            break;
        case parseFloat(0.06625):
            pl = 0.195;
            break;
        case parseFloat(0.06750):
            pl = 0.19;
            break;
        case parseFloat(0.06875):
            pl = 0.185;
            break;
        case parseFloat(0.07000):
            pl = 0.18;
            break;
        case parseFloat(0.07125):
            pl = 0.176;
            break;
        case parseFloat(0.07250):
            pl = 0.171;
            break;
        case parseFloat(0.07375):
            pl = 0.167;
            break;
        case parseFloat(0.07500):
            pl = 0.163;
            break;
        case parseFloat(0.07625):
            pl = 0.159;
            break;
        case parseFloat(0.07750):
            pl = 0.155;
            break;
        case parseFloat(0.07875):
            pl = 0.151;
            break;
        case parseFloat(0.08000):
            pl = 0.147;
            break;
        case parseFloat(0.08125):
            pl = 0.143;
            break;
        case parseFloat(0.08250):
            pl = 0.14;
            break;
        case parseFloat(0.08375):
            pl = 0.136;
            break;
        case parseFloat(0.08500):
            pl = 0.133;
            break;
        case parseFloat(0.08625):
            pl = 0.129;
            break;
        case parseFloat(0.08750):
            pl = 0.126;
            break;
        case parseFloat(0.08875):
            pl = 0.123;
            break;
        case parseFloat(0.09000):
            pl = 0.12;
            break;
        case parseFloat(0.09125):
            pl = 0.117;
            break;
        case parseFloat(0.09250):
            pl = 0.114;
            break;
        case parseFloat(0.09375):
            pl = 0.111;
            break;
        case parseFloat(0.09500):
            pl = 0.108;
            break;
        case parseFloat(0.09625):
            pl = 0.106;
            break;
        case parseFloat(0.09750):
            pl = 0.103;
            break;
        case parseFloat(0.09875):
            pl = 0.101;
            break;
        }
        break;
    case 41:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.42;
            break;
        case parseFloat(0.03125):
            pl = 0.411;
            break;
        case parseFloat(0.03250):
            pl = 0.4;
            break;
        case parseFloat(0.03375):
            pl = 0.39;
            break;
        case parseFloat(0.03500):
            pl = 0.38;
            break;
        case parseFloat(0.03625):
            pl = 0.37;
            break;
        case parseFloat(0.03750):
            pl = 0.36;
            break;
        case parseFloat(0.03875):
            pl = 0.351;
            break;
        case parseFloat(0.04000):
            pl = 0.342;
            break;
        case parseFloat(0.04125):
            pl = 0.333;
            break;
        case parseFloat(0.04250):
            pl = 0.325;
            break;
        case parseFloat(0.04375):
            pl = 0.316;
            break;
        case parseFloat(0.04500):
            pl = 0.308;
            break;
        case parseFloat(0.04625):
            pl = 0.3;
            break;
        case parseFloat(0.04750):
            pl = 0.293;
            break;
        case parseFloat(0.04875):
            pl = 0.285;
            break;
        case parseFloat(0.05000):
            pl = 0.278;
            break;
        case parseFloat(0.05125):
            pl = 0.271;
            break;
        case parseFloat(0.05250):
            pl = 0.264;
            break;
        case parseFloat(0.05375):
            pl = 0.257;
            break;
        case parseFloat(0.05500):
            pl = 0.251;
            break;
        case parseFloat(0.05625):
            pl = 0.244;
            break;
        case parseFloat(0.05750):
            pl = 0.238;
            break;
        case parseFloat(0.05875):
            pl = 0.232;
            break;
        case parseFloat(0.06000):
            pl = 0.226;
            break;
        case parseFloat(0.06125):
            pl = 0.221;
            break;
        case parseFloat(0.06250):
            pl = 0.215;
            break;
        case parseFloat(0.06375):
            pl = 0.21;
            break;
        case parseFloat(0.06500):
            pl = 0.204;
            break;
        case parseFloat(0.06625):
            pl = 0.199;
            break;
        case parseFloat(0.06750):
            pl = 0.194;
            break;
        case parseFloat(0.06875):
            pl = 0.189;
            break;
        case parseFloat(0.07000):
            pl = 0.185;
            break;
        case parseFloat(0.07125):
            pl = 0.18;
            break;
        case parseFloat(0.07250):
            pl = 0.176;
            break;
        case parseFloat(0.07375):
            pl = 0.171;
            break;
        case parseFloat(0.07500):
            pl = 0.167;
            break;
        case parseFloat(0.07625):
            pl = 0.163;
            break;
        case parseFloat(0.07750):
            pl = 0.159;
            break;
        case parseFloat(0.07875):
            pl = 0.155;
            break;
        case parseFloat(0.08000):
            pl = 0.151;
            break;
        case parseFloat(0.08125):
            pl = 0.147;
            break;
        case parseFloat(0.08250):
            pl = 0.144;
            break;
        case parseFloat(0.08375):
            pl = 0.14;
            break;
        case parseFloat(0.08500):
            pl = 0.137;
            break;
        case parseFloat(0.08625):
            pl = 0.133;
            break;
        case parseFloat(0.08750):
            pl = 0.13;
            break;
        case parseFloat(0.08875):
            pl = 0.127;
            break;
        case parseFloat(0.09000):
            pl = 0.124;
            break;
        case parseFloat(0.09125):
            pl = 0.121;
            break;
        case parseFloat(0.09250):
            pl = 0.118;
            break;
        case parseFloat(0.09375):
            pl = 0.115;
            break;
        case parseFloat(0.09500):
            pl = 0.112;
            break;
        case parseFloat(0.09625):
            pl = 0.109;
            break;
        case parseFloat(0.09750):
            pl = 0.106;
            break;
        case parseFloat(0.09875):
            pl = 0.104;
            break;
        }
        break;
    case 42:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.42;
            break;
        case parseFloat(0.03125):
            pl = 0.416;
            break;
        case parseFloat(0.03250):
            pl = 0.405;
            break;
        case parseFloat(0.03375):
            pl = 0.395;
            break;
        case parseFloat(0.03500):
            pl = 0.385;
            break;
        case parseFloat(0.03625):
            pl = 0.375;
            break;
        case parseFloat(0.03750):
            pl = 0.365;
            break;
        case parseFloat(0.03875):
            pl = 0.356;
            break;
        case parseFloat(0.04000):
            pl = 0.347;
            break;
        case parseFloat(0.04125):
            pl = 0.338;
            break;
        case parseFloat(0.04250):
            pl = 0.33;
            break;
        case parseFloat(0.04375):
            pl = 0.321;
            break;
        case parseFloat(0.04500):
            pl = 0.313;
            break;
        case parseFloat(0.04625):
            pl = 0.305;
            break;
        case parseFloat(0.04750):
            pl = 0.298;
            break;
        case parseFloat(0.04875):
            pl = 0.29;
            break;
        case parseFloat(0.05000):
            pl = 0.283;
            break;
        case parseFloat(0.05125):
            pl = 0.276;
            break;
        case parseFloat(0.05250):
            pl = 0.269;
            break;
        case parseFloat(0.05375):
            pl = 0.262;
            break;
        case parseFloat(0.05500):
            pl = 0.256;
            break;
        case parseFloat(0.05625):
            pl = 0.249;
            break;
        case parseFloat(0.05750):
            pl = 0.243;
            break;
        case parseFloat(0.05875):
            pl = 0.237;
            break;
        case parseFloat(0.06000):
            pl = 0.231;
            break;
        case parseFloat(0.06125):
            pl = 0.225;
            break;
        case parseFloat(0.06250):
            pl = 0.22;
            break;
        case parseFloat(0.06375):
            pl = 0.214;
            break;
        case parseFloat(0.06500):
            pl = 0.209;
            break;
        case parseFloat(0.06625):
            pl = 0.204;
            break;
        case parseFloat(0.06750):
            pl = 0.199;
            break;
        case parseFloat(0.06875):
            pl = 0.194;
            break;
        case parseFloat(0.07000):
            pl = 0.189;
            break;
        case parseFloat(0.07125):
            pl = 0.184;
            break;
        case parseFloat(0.07250):
            pl = 0.18;
            break;
        case parseFloat(0.07375):
            pl = 0.175;
            break;
        case parseFloat(0.07500):
            pl = 0.171;
            break;
        case parseFloat(0.07625):
            pl = 0.167;
            break;
        case parseFloat(0.07750):
            pl = 0.163;
            break;
        case parseFloat(0.07875):
            pl = 0.159;
            break;
        case parseFloat(0.08000):
            pl = 0.155;
            break;
        case parseFloat(0.08125):
            pl = 0.151;
            break;
        case parseFloat(0.08250):
            pl = 0.148;
            break;
        case parseFloat(0.08375):
            pl = 0.144;
            break;
        case parseFloat(0.08500):
            pl = 0.14;
            break;
        case parseFloat(0.08625):
            pl = 0.137;
            break;
        case parseFloat(0.08750):
            pl = 0.134;
            break;
        case parseFloat(0.08875):
            pl = 0.13;
            break;
        case parseFloat(0.09000):
            pl = 0.127;
            break;
        case parseFloat(0.09125):
            pl = 0.124;
            break;
        case parseFloat(0.09250):
            pl = 0.121;
            break;
        case parseFloat(0.09375):
            pl = 0.118;
            break;
        case parseFloat(0.09500):
            pl = 0.115;
            break;
        case parseFloat(0.09625):
            pl = 0.113;
            break;
        case parseFloat(0.09750):
            pl = 0.11;
            break;
        case parseFloat(0.09875):
            pl = 0.107;
            break;
        }
        break;
    case 43:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.42;
            break;
        case parseFloat(0.03125):
            pl = 0.42;
            break;
        case parseFloat(0.03250):
            pl = 0.41;
            break;
        case parseFloat(0.03375):
            pl = 0.4;
            break;
        case parseFloat(0.03500):
            pl = 0.39;
            break;
        case parseFloat(0.03625):
            pl = 0.38;
            break;
        case parseFloat(0.03750):
            pl = 0.37;
            break;
        case parseFloat(0.03875):
            pl = 0.361;
            break;
        case parseFloat(0.04000):
            pl = 0.352;
            break;
        case parseFloat(0.04125):
            pl = 0.343;
            break;
        case parseFloat(0.04250):
            pl = 0.335;
            break;
        case parseFloat(0.04375):
            pl = 0.326;
            break;
        case parseFloat(0.04500):
            pl = 0.318;
            break;
        case parseFloat(0.04625):
            pl = 0.31;
            break;
        case parseFloat(0.04750):
            pl = 0.303;
            break;
        case parseFloat(0.04875):
            pl = 0.295;
            break;
        case parseFloat(0.05000):
            pl = 0.288;
            break;
        case parseFloat(0.05125):
            pl = 0.281;
            break;
        case parseFloat(0.05250):
            pl = 0.274;
            break;
        case parseFloat(0.05375):
            pl = 0.267;
            break;
        case parseFloat(0.05500):
            pl = 0.261;
            break;
        case parseFloat(0.05625):
            pl = 0.254;
            break;
        case parseFloat(0.05750):
            pl = 0.248;
            break;
        case parseFloat(0.05875):
            pl = 0.242;
            break;
        case parseFloat(0.06000):
            pl = 0.236;
            break;
        case parseFloat(0.06125):
            pl = 0.23;
            break;
        case parseFloat(0.06250):
            pl = 0.224;
            break;
        case parseFloat(0.06375):
            pl = 0.219;
            break;
        case parseFloat(0.06500):
            pl = 0.214;
            break;
        case parseFloat(0.06625):
            pl = 0.208;
            break;
        case parseFloat(0.06750):
            pl = 0.203;
            break;
        case parseFloat(0.06875):
            pl = 0.198;
            break;
        case parseFloat(0.07000):
            pl = 0.194;
            break;
        case parseFloat(0.07125):
            pl = 0.189;
            break;
        case parseFloat(0.07250):
            pl = 0.184;
            break;
        case parseFloat(0.07375):
            pl = 0.18;
            break;
        case parseFloat(0.07500):
            pl = 0.176;
            break;
        case parseFloat(0.07625):
            pl = 0.171;
            break;
        case parseFloat(0.07750):
            pl = 0.167;
            break;
        case parseFloat(0.07875):
            pl = 0.163;
            break;
        case parseFloat(0.08000):
            pl = 0.159;
            break;
        case parseFloat(0.08125):
            pl = 0.155;
            break;
        case parseFloat(0.08250):
            pl = 0.152;
            break;
        case parseFloat(0.08375):
            pl = 0.148;
            break;
        case parseFloat(0.08500):
            pl = 0.144;
            break;
        case parseFloat(0.08625):
            pl = 0.141;
            break;
        case parseFloat(0.08750):
            pl = 0.138;
            break;
        case parseFloat(0.08875):
            pl = 0.134;
            break;
        case parseFloat(0.09000):
            pl = 0.131;
            break;
        case parseFloat(0.09125):
            pl = 0.128;
            break;
        case parseFloat(0.09250):
            pl = 0.125;
            break;
        case parseFloat(0.09375):
            pl = 0.122;
            break;
        case parseFloat(0.09500):
            pl = 0.119;
            break;
        case parseFloat(0.09625):
            pl = 0.116;
            break;
        case parseFloat(0.09750):
            pl = 0.114;
            break;
        case parseFloat(0.09875):
            pl = 0.111;
            break;
        }
        break;
    case 44:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.42;
            break;
        case parseFloat(0.03125):
            pl = 0.42;
            break;
        case parseFloat(0.03250):
            pl = 0.415;
            break;
        case parseFloat(0.03375):
            pl = 0.405;
            break;
        case parseFloat(0.03500):
            pl = 0.395;
            break;
        case parseFloat(0.03625):
            pl = 0.385;
            break;
        case parseFloat(0.03750):
            pl = 0.375;
            break;
        case parseFloat(0.03875):
            pl = 0.366;
            break;
        case parseFloat(0.04000):
            pl = 0.357;
            break;
        case parseFloat(0.04125):
            pl = 0.348;
            break;
        case parseFloat(0.04250):
            pl = 0.34;
            break;
        case parseFloat(0.04375):
            pl = 0.332;
            break;
        case parseFloat(0.04500):
            pl = 0.323;
            break;
        case parseFloat(0.04625):
            pl = 0.316;
            break;
        case parseFloat(0.04750):
            pl = 0.308;
            break;
        case parseFloat(0.04875):
            pl = 0.3;
            break;
        case parseFloat(0.05000):
            pl = 0.293;
            break;
        case parseFloat(0.05125):
            pl = 0.286;
            break;
        case parseFloat(0.05250):
            pl = 0.279;
            break;
        case parseFloat(0.05375):
            pl = 0.272;
            break;
        case parseFloat(0.05500):
            pl = 0.266;
            break;
        case parseFloat(0.05625):
            pl = 0.259;
            break;
        case parseFloat(0.05750):
            pl = 0.253;
            break;
        case parseFloat(0.05875):
            pl = 0.247;
            break;
        case parseFloat(0.06000):
            pl = 0.241;
            break;
        case parseFloat(0.06125):
            pl = 0.235;
            break;
        case parseFloat(0.06250):
            pl = 0.229;
            break;
        case parseFloat(0.06375):
            pl = 0.224;
            break;
        case parseFloat(0.06500):
            pl = 0.218;
            break;
        case parseFloat(0.06625):
            pl = 0.213;
            break;
        case parseFloat(0.06750):
            pl = 0.208;
            break;
        case parseFloat(0.06875):
            pl = 0.203;
            break;
        case parseFloat(0.07000):
            pl = 0.198;
            break;
        case parseFloat(0.07125):
            pl = 0.194;
            break;
        case parseFloat(0.07250):
            pl = 0.189;
            break;
        case parseFloat(0.07375):
            pl = 0.184;
            break;
        case parseFloat(0.07500):
            pl = 0.18;
            break;
        case parseFloat(0.07625):
            pl = 0.176;
            break;
        case parseFloat(0.07750):
            pl = 0.172;
            break;
        case parseFloat(0.07875):
            pl = 0.167;
            break;
        case parseFloat(0.08000):
            pl = 0.164;
            break;
        case parseFloat(0.08125):
            pl = 0.16;
            break;
        case parseFloat(0.08250):
            pl = 0.156;
            break;
        case parseFloat(0.08375):
            pl = 0.152;
            break;
        case parseFloat(0.08500):
            pl = 0.149;
            break;
        case parseFloat(0.08625):
            pl = 0.145;
            break;
        case parseFloat(0.08750):
            pl = 0.142;
            break;
        case parseFloat(0.08875):
            pl = 0.138;
            break;
        case parseFloat(0.09000):
            pl = 0.135;
            break;
        case parseFloat(0.09125):
            pl = 0.132;
            break;
        case parseFloat(0.09250):
            pl = 0.129;
            break;
        case parseFloat(0.09375):
            pl = 0.126;
            break;
        case parseFloat(0.09500):
            pl = 0.123;
            break;
        case parseFloat(0.09625):
            pl = 0.12;
            break;
        case parseFloat(0.09750):
            pl = 0.117;
            break;
        case parseFloat(0.09875):
            pl = 0.114;
            break;
        }
        break;
    case 45:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.441;
            break;
        case parseFloat(0.03125):
            pl = 0.43;
            break;
        case parseFloat(0.03250):
            pl = 0.42;
            break;
        case parseFloat(0.03375):
            pl = 0.41;
            break;
        case parseFloat(0.03500):
            pl = 0.4;
            break;
        case parseFloat(0.03625):
            pl = 0.39;
            break;
        case parseFloat(0.03750):
            pl = 0.381;
            break;
        case parseFloat(0.03875):
            pl = 0.371;
            break;
        case parseFloat(0.04000):
            pl = 0.362;
            break;
        case parseFloat(0.04125):
            pl = 0.354;
            break;
        case parseFloat(0.04250):
            pl = 0.345;
            break;
        case parseFloat(0.04375):
            pl = 0.337;
            break;
        case parseFloat(0.04500):
            pl = 0.329;
            break;
        case parseFloat(0.04625):
            pl = 0.321;
            break;
        case parseFloat(0.04750):
            pl = 0.313;
            break;
        case parseFloat(0.04875):
            pl = 0.306;
            break;
        case parseFloat(0.05000):
            pl = 0.298;
            break;
        case parseFloat(0.05125):
            pl = 0.291;
            break;
        case parseFloat(0.05250):
            pl = 0.284;
            break;
        case parseFloat(0.05375):
            pl = 0.277;
            break;
        case parseFloat(0.05500):
            pl = 0.271;
            break;
        case parseFloat(0.05625):
            pl = 0.264;
            break;
        case parseFloat(0.05750):
            pl = 0.258;
            break;
        case parseFloat(0.05875):
            pl = 0.252;
            break;
        case parseFloat(0.06000):
            pl = 0.246;
            break;
        case parseFloat(0.06125):
            pl = 0.24;
            break;
        case parseFloat(0.06250):
            pl = 0.234;
            break;
        case parseFloat(0.06375):
            pl = 0.229;
            break;
        case parseFloat(0.06500):
            pl = 0.223;
            break;
        case parseFloat(0.06625):
            pl = 0.218;
            break;
        case parseFloat(0.06750):
            pl = 0.213;
            break;
        case parseFloat(0.06875):
            pl = 0.208;
            break;
        case parseFloat(0.07000):
            pl = 0.203;
            break;
        case parseFloat(0.07125):
            pl = 0.198;
            break;
        case parseFloat(0.07250):
            pl = 0.194;
            break;
        case parseFloat(0.07375):
            pl = 0.189;
            break;
        case parseFloat(0.07500):
            pl = 0.185;
            break;
        case parseFloat(0.07625):
            pl = 0.18;
            break;
        case parseFloat(0.07750):
            pl = 0.176;
            break;
        case parseFloat(0.07875):
            pl = 0.172;
            break;
        case parseFloat(0.08000):
            pl = 0.168;
            break;
        case parseFloat(0.08125):
            pl = 0.164;
            break;
        case parseFloat(0.08250):
            pl = 0.16;
            break;
        case parseFloat(0.08375):
            pl = 0.156;
            break;
        case parseFloat(0.08500):
            pl = 0.153;
            break;
        case parseFloat(0.08625):
            pl = 0.149;
            break;
        case parseFloat(0.08750):
            pl = 0.146;
            break;
        case parseFloat(0.08875):
            pl = 0.142;
            break;
        case parseFloat(0.09000):
            pl = 0.139;
            break;
        case parseFloat(0.09125):
            pl = 0.136;
            break;
        case parseFloat(0.09250):
            pl = 0.133;
            break;
        case parseFloat(0.09375):
            pl = 0.13;
            break;
        case parseFloat(0.09500):
            pl = 0.127;
            break;
        case parseFloat(0.09625):
            pl = 0.124;
            break;
        case parseFloat(0.09750):
            pl = 0.121;
            break;
        case parseFloat(0.09875):
            pl = 0.118;
            break;
        }
        break;
    case 46:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.443;
            break;
        case parseFloat(0.03125):
            pl = 0.436;
            break;
        case parseFloat(0.03250):
            pl = 0.425;
            break;
        case parseFloat(0.03375):
            pl = 0.415;
            break;
        case parseFloat(0.03500):
            pl = 0.405;
            break;
        case parseFloat(0.03625):
            pl = 0.395;
            break;
        case parseFloat(0.03750):
            pl = 0.386;
            break;
        case parseFloat(0.03875):
            pl = 0.377;
            break;
        case parseFloat(0.04000):
            pl = 0.368;
            break;
        case parseFloat(0.04125):
            pl = 0.359;
            break;
        case parseFloat(0.04250):
            pl = 0.35;
            break;
        case parseFloat(0.04375):
            pl = 0.342;
            break;
        case parseFloat(0.04500):
            pl = 0.334;
            break;
        case parseFloat(0.04625):
            pl = 0.326;
            break;
        case parseFloat(0.04750):
            pl = 0.318;
            break;
        case parseFloat(0.04875):
            pl = 0.311;
            break;
        case parseFloat(0.05000):
            pl = 0.303;
            break;
        case parseFloat(0.05125):
            pl = 0.296;
            break;
        case parseFloat(0.05250):
            pl = 0.289;
            break;
        case parseFloat(0.05375):
            pl = 0.283;
            break;
        case parseFloat(0.05500):
            pl = 0.276;
            break;
        case parseFloat(0.05625):
            pl = 0.269;
            break;
        case parseFloat(0.05750):
            pl = 0.263;
            break;
        case parseFloat(0.05875):
            pl = 0.257;
            break;
        case parseFloat(0.06000):
            pl = 0.251;
            break;
        case parseFloat(0.06125):
            pl = 0.245;
            break;
        case parseFloat(0.06250):
            pl = 0.239;
            break;
        case parseFloat(0.06375):
            pl = 0.234;
            break;
        case parseFloat(0.06500):
            pl = 0.228;
            break;
        case parseFloat(0.06625):
            pl = 0.223;
            break;
        case parseFloat(0.06750):
            pl = 0.218;
            break;
        case parseFloat(0.06875):
            pl = 0.213;
            break;
        case parseFloat(0.07000):
            pl = 0.208;
            break;
        case parseFloat(0.07125):
            pl = 0.203;
            break;
        case parseFloat(0.07250):
            pl = 0.198;
            break;
        case parseFloat(0.07375):
            pl = 0.194;
            break;
        case parseFloat(0.07500):
            pl = 0.189;
            break;
        case parseFloat(0.07625):
            pl = 0.185;
            break;
        case parseFloat(0.07750):
            pl = 0.181;
            break;
        case parseFloat(0.07875):
            pl = 0.177;
            break;
        case parseFloat(0.08000):
            pl = 0.172;
            break;
        case parseFloat(0.08125):
            pl = 0.169;
            break;
        case parseFloat(0.08250):
            pl = 0.165;
            break;
        case parseFloat(0.08375):
            pl = 0.161;
            break;
        case parseFloat(0.08500):
            pl = 0.157;
            break;
        case parseFloat(0.08625):
            pl = 0.154;
            break;
        case parseFloat(0.08750):
            pl = 0.15;
            break;
        case parseFloat(0.08875):
            pl = 0.147;
            break;
        case parseFloat(0.09000):
            pl = 0.143;
            break;
        case parseFloat(0.09125):
            pl = 0.14;
            break;
        case parseFloat(0.09250):
            pl = 0.137;
            break;
        case parseFloat(0.09375):
            pl = 0.134;
            break;
        case parseFloat(0.09500):
            pl = 0.131;
            break;
        case parseFloat(0.09625):
            pl = 0.128;
            break;
        case parseFloat(0.09750):
            pl = 0.125;
            break;
        case parseFloat(0.09875):
            pl = 0.122;
            break;
        }
        break;
    case 47:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.443;
            break;
        case parseFloat(0.03125):
            pl = 0.441;
            break;
        case parseFloat(0.03250):
            pl = 0.43;
            break;
        case parseFloat(0.03375):
            pl = 0.42;
            break;
        case parseFloat(0.03500):
            pl = 0.41;
            break;
        case parseFloat(0.03625):
            pl = 0.401;
            break;
        case parseFloat(0.03750):
            pl = 0.391;
            break;
        case parseFloat(0.03875):
            pl = 0.382;
            break;
        case parseFloat(0.04000):
            pl = 0.373;
            break;
        case parseFloat(0.04125):
            pl = 0.364;
            break;
        case parseFloat(0.04250):
            pl = 0.356;
            break;
        case parseFloat(0.04375):
            pl = 0.347;
            break;
        case parseFloat(0.04500):
            pl = 0.339;
            break;
        case parseFloat(0.04625):
            pl = 0.331;
            break;
        case parseFloat(0.04750):
            pl = 0.324;
            break;
        case parseFloat(0.04875):
            pl = 0.316;
            break;
        case parseFloat(0.05000):
            pl = 0.309;
            break;
        case parseFloat(0.05125):
            pl = 0.302;
            break;
        case parseFloat(0.05250):
            pl = 0.295;
            break;
        case parseFloat(0.05375):
            pl = 0.288;
            break;
        case parseFloat(0.05500):
            pl = 0.281;
            break;
        case parseFloat(0.05625):
            pl = 0.275;
            break;
        case parseFloat(0.05750):
            pl = 0.268;
            break;
        case parseFloat(0.05875):
            pl = 0.262;
            break;
        case parseFloat(0.06000):
            pl = 0.256;
            break;
        case parseFloat(0.06125):
            pl = 0.25;
            break;
        case parseFloat(0.06250):
            pl = 0.245;
            break;
        case parseFloat(0.06375):
            pl = 0.239;
            break;
        case parseFloat(0.06500):
            pl = 0.233;
            break;
        case parseFloat(0.06625):
            pl = 0.228;
            break;
        case parseFloat(0.06750):
            pl = 0.223;
            break;
        case parseFloat(0.06875):
            pl = 0.218;
            break;
        case parseFloat(0.07000):
            pl = 0.213;
            break;
        case parseFloat(0.07125):
            pl = 0.208;
            break;
        case parseFloat(0.07250):
            pl = 0.203;
            break;
        case parseFloat(0.07375):
            pl = 0.199;
            break;
        case parseFloat(0.07500):
            pl = 0.194;
            break;
        case parseFloat(0.07625):
            pl = 0.19;
            break;
        case parseFloat(0.07750):
            pl = 0.185;
            break;
        case parseFloat(0.07875):
            pl = 0.181;
            break;
        case parseFloat(0.08000):
            pl = 0.177;
            break;
        case parseFloat(0.08125):
            pl = 0.173;
            break;
        case parseFloat(0.08250):
            pl = 0.169;
            break;
        case parseFloat(0.08375):
            pl = 0.165;
            break;
        case parseFloat(0.08500):
            pl = 0.162;
            break;
        case parseFloat(0.08625):
            pl = 0.158;
            break;
        case parseFloat(0.08750):
            pl = 0.155;
            break;
        case parseFloat(0.08875):
            pl = 0.151;
            break;
        case parseFloat(0.09000):
            pl = 0.148;
            break;
        case parseFloat(0.09125):
            pl = 0.144;
            break;
        case parseFloat(0.09250):
            pl = 0.141;
            break;
        case parseFloat(0.09375):
            pl = 0.138;
            break;
        case parseFloat(0.09500):
            pl = 0.135;
            break;
        case parseFloat(0.09625):
            pl = 0.132;
            break;
        case parseFloat(0.09750):
            pl = 0.129;
            break;
        case parseFloat(0.09875):
            pl = 0.126;
            break;
        }
        break;
    case 48:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.443;
            break;
        case parseFloat(0.03125):
            pl = 0.443;
            break;
        case parseFloat(0.03250):
            pl = 0.435;
            break;
        case parseFloat(0.03375):
            pl = 0.425;
            break;
        case parseFloat(0.03500):
            pl = 0.415;
            break;
        case parseFloat(0.03625):
            pl = 0.406;
            break;
        case parseFloat(0.03750):
            pl = 0.396;
            break;
        case parseFloat(0.03875):
            pl = 0.387;
            break;
        case parseFloat(0.04000):
            pl = 0.378;
            break;
        case parseFloat(0.04125):
            pl = 0.37;
            break;
        case parseFloat(0.04250):
            pl = 0.361;
            break;
        case parseFloat(0.04375):
            pl = 0.353;
            break;
        case parseFloat(0.04500):
            pl = 0.345;
            break;
        case parseFloat(0.04625):
            pl = 0.337;
            break;
        case parseFloat(0.04750):
            pl = 0.329;
            break;
        case parseFloat(0.04875):
            pl = 0.322;
            break;
        case parseFloat(0.05000):
            pl = 0.314;
            break;
        case parseFloat(0.05125):
            pl = 0.307;
            break;
        case parseFloat(0.05250):
            pl = 0.3;
            break;
        case parseFloat(0.05375):
            pl = 0.293;
            break;
        case parseFloat(0.05500):
            pl = 0.287;
            break;
        case parseFloat(0.05625):
            pl = 0.28;
            break;
        case parseFloat(0.05750):
            pl = 0.274;
            break;
        case parseFloat(0.05875):
            pl = 0.268;
            break;
        case parseFloat(0.06000):
            pl = 0.261;
            break;
        case parseFloat(0.06125):
            pl = 0.256;
            break;
        case parseFloat(0.06250):
            pl = 0.25;
            break;
        case parseFloat(0.06375):
            pl = 0.244;
            break;
        case parseFloat(0.06500):
            pl = 0.239;
            break;
        case parseFloat(0.06625):
            pl = 0.233;
            break;
        case parseFloat(0.06750):
            pl = 0.228;
            break;
        case parseFloat(0.06875):
            pl = 0.223;
            break;
        case parseFloat(0.07000):
            pl = 0.218;
            break;
        case parseFloat(0.07125):
            pl = 0.213;
            break;
        case parseFloat(0.07250):
            pl = 0.208;
            break;
        case parseFloat(0.07375):
            pl = 0.204;
            break;
        case parseFloat(0.07500):
            pl = 0.199;
            break;
        case parseFloat(0.07625):
            pl = 0.195;
            break;
        case parseFloat(0.07750):
            pl = 0.19;
            break;
        case parseFloat(0.07875):
            pl = 0.186;
            break;
        case parseFloat(0.08000):
            pl = 0.182;
            break;
        case parseFloat(0.08125):
            pl = 0.178;
            break;
        case parseFloat(0.08250):
            pl = 0.174;
            break;
        case parseFloat(0.08375):
            pl = 0.17;
            break;
        case parseFloat(0.08500):
            pl = 0.166;
            break;
        case parseFloat(0.08625):
            pl = 0.163;
            break;
        case parseFloat(0.08750):
            pl = 0.159;
            break;
        case parseFloat(0.08875):
            pl = 0.156;
            break;
        case parseFloat(0.09000):
            pl = 0.152;
            break;
        case parseFloat(0.09125):
            pl = 0.149;
            break;
        case parseFloat(0.09250):
            pl = 0.146;
            break;
        case parseFloat(0.09375):
            pl = 0.142;
            break;
        case parseFloat(0.09500):
            pl = 0.139;
            break;
        case parseFloat(0.09625):
            pl = 0.136;
            break;
        case parseFloat(0.09750):
            pl = 0.133;
            break;
        case parseFloat(0.09875):
            pl = 0.13;
            break;
        }
        break;
    case 49:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.443;
            break;
        case parseFloat(0.03125):
            pl = 0.443;
            break;
        case parseFloat(0.03250):
            pl = 0.441;
            break;
        case parseFloat(0.03375):
            pl = 0.431;
            break;
        case parseFloat(0.03500):
            pl = 0.421;
            break;
        case parseFloat(0.03625):
            pl = 0.411;
            break;
        case parseFloat(0.03750):
            pl = 0.402;
            break;
        case parseFloat(0.03875):
            pl = 0.393;
            break;
        case parseFloat(0.04000):
            pl = 0.384;
            break;
        case parseFloat(0.04125):
            pl = 0.375;
            break;
        case parseFloat(0.04250):
            pl = 0.367;
            break;
        case parseFloat(0.04375):
            pl = 0.358;
            break;
        case parseFloat(0.04500):
            pl = 0.35;
            break;
        case parseFloat(0.04625):
            pl = 0.342;
            break;
        case parseFloat(0.04750):
            pl = 0.335;
            break;
        case parseFloat(0.04875):
            pl = 0.327;
            break;
        case parseFloat(0.05000):
            pl = 0.32;
            break;
        case parseFloat(0.05125):
            pl = 0.313;
            break;
        case parseFloat(0.05250):
            pl = 0.306;
            break;
        case parseFloat(0.05375):
            pl = 0.299;
            break;
        case parseFloat(0.05500):
            pl = 0.292;
            break;
        case parseFloat(0.05625):
            pl = 0.286;
            break;
        case parseFloat(0.05750):
            pl = 0.279;
            break;
        case parseFloat(0.05875):
            pl = 0.273;
            break;
        case parseFloat(0.06000):
            pl = 0.267;
            break;
        case parseFloat(0.06125):
            pl = 0.261;
            break;
        case parseFloat(0.06250):
            pl = 0.255;
            break;
        case parseFloat(0.06375):
            pl = 0.25;
            break;
        case parseFloat(0.06500):
            pl = 0.244;
            break;
        case parseFloat(0.06625):
            pl = 0.239;
            break;
        case parseFloat(0.06750):
            pl = 0.233;
            break;
        case parseFloat(0.06875):
            pl = 0.228;
            break;
        case parseFloat(0.07000):
            pl = 0.223;
            break;
        case parseFloat(0.07125):
            pl = 0.218;
            break;
        case parseFloat(0.07250):
            pl = 0.213;
            break;
        case parseFloat(0.07375):
            pl = 0.209;
            break;
        case parseFloat(0.07500):
            pl = 0.204;
            break;
        case parseFloat(0.07625):
            pl = 0.2;
            break;
        case parseFloat(0.07750):
            pl = 0.195;
            break;
        case parseFloat(0.07875):
            pl = 0.191;
            break;
        case parseFloat(0.08000):
            pl = 0.187;
            break;
        case parseFloat(0.08125):
            pl = 0.183;
            break;
        case parseFloat(0.08250):
            pl = 0.179;
            break;
        case parseFloat(0.08375):
            pl = 0.175;
            break;
        case parseFloat(0.08500):
            pl = 0.171;
            break;
        case parseFloat(0.08625):
            pl = 0.167;
            break;
        case parseFloat(0.08750):
            pl = 0.164;
            break;
        case parseFloat(0.08875):
            pl = 0.16;
            break;
        case parseFloat(0.09000):
            pl = 0.157;
            break;
        case parseFloat(0.09125):
            pl = 0.153;
            break;
        case parseFloat(0.09250):
            pl = 0.15;
            break;
        case parseFloat(0.09375):
            pl = 0.147;
            break;
        case parseFloat(0.09500):
            pl = 0.144;
            break;
        case parseFloat(0.09625):
            pl = 0.141;
            break;
        case parseFloat(0.09750):
            pl = 0.138;
            break;
        case parseFloat(0.09875):
            pl = 0.135;
            break;
        }
        break;
    case 50:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.46;
            break;
        case parseFloat(0.03125):
            pl = 0.456;
            break;
        case parseFloat(0.03250):
            pl = 0.446;
            break;
        case parseFloat(0.03375):
            pl = 0.436;
            break;
        case parseFloat(0.03500):
            pl = 0.426;
            break;
        case parseFloat(0.03625):
            pl = 0.417;
            break;
        case parseFloat(0.03750):
            pl = 0.407;
            break;
        case parseFloat(0.03875):
            pl = 0.398;
            break;
        case parseFloat(0.04000):
            pl = 0.389;
            break;
        case parseFloat(0.04125):
            pl = 0.381;
            break;
        case parseFloat(0.04250):
            pl = 0.372;
            break;
        case parseFloat(0.04375):
            pl = 0.364;
            break;
        case parseFloat(0.04500):
            pl = 0.356;
            break;
        case parseFloat(0.04625):
            pl = 0.348;
            break;
        case parseFloat(0.04750):
            pl = 0.34;
            break;
        case parseFloat(0.04875):
            pl = 0.333;
            break;
        case parseFloat(0.05000):
            pl = 0.326;
            break;
        case parseFloat(0.05125):
            pl = 0.318;
            break;
        case parseFloat(0.05250):
            pl = 0.311;
            break;
        case parseFloat(0.05375):
            pl = 0.304;
            break;
        case parseFloat(0.05500):
            pl = 0.298;
            break;
        case parseFloat(0.05625):
            pl = 0.291;
            break;
        case parseFloat(0.05750):
            pl = 0.285;
            break;
        case parseFloat(0.05875):
            pl = 0.279;
            break;
        case parseFloat(0.06000):
            pl = 0.273;
            break;
        case parseFloat(0.06125):
            pl = 0.267;
            break;
        case parseFloat(0.06250):
            pl = 0.261;
            break;
        case parseFloat(0.06375):
            pl = 0.255;
            break;
        case parseFloat(0.06500):
            pl = 0.249;
            break;
        case parseFloat(0.06625):
            pl = 0.244;
            break;
        case parseFloat(0.06750):
            pl = 0.239;
            break;
        case parseFloat(0.06875):
            pl = 0.234;
            break;
        case parseFloat(0.07000):
            pl = 0.229;
            break;
        case parseFloat(0.07125):
            pl = 0.224;
            break;
        case parseFloat(0.07250):
            pl = 0.219;
            break;
        case parseFloat(0.07375):
            pl = 0.214;
            break;
        case parseFloat(0.07500):
            pl = 0.209;
            break;
        case parseFloat(0.07625):
            pl = 0.205;
            break;
        case parseFloat(0.07750):
            pl = 0.2;
            break;
        case parseFloat(0.07875):
            pl = 0.196;
            break;
        case parseFloat(0.08000):
            pl = 0.192;
            break;
        case parseFloat(0.08125):
            pl = 0.188;
            break;
        case parseFloat(0.08250):
            pl = 0.184;
            break;
        case parseFloat(0.08375):
            pl = 0.18;
            break;
        case parseFloat(0.08500):
            pl = 0.176;
            break;
        case parseFloat(0.08625):
            pl = 0.172;
            break;
        case parseFloat(0.08750):
            pl = 0.169;
            break;
        case parseFloat(0.08875):
            pl = 0.165;
            break;
        case parseFloat(0.09000):
            pl = 0.161;
            break;
        case parseFloat(0.09125):
            pl = 0.158;
            break;
        case parseFloat(0.09250):
            pl = 0.155;
            break;
        case parseFloat(0.09375):
            pl = 0.151;
            break;
        case parseFloat(0.09500):
            pl = 0.148;
            break;
        case parseFloat(0.09625):
            pl = 0.145;
            break;
        case parseFloat(0.09750):
            pl = 0.142;
            break;
        case parseFloat(0.09875):
            pl = 0.139;
            break;
        }
        break;
    case 51:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.46;
            break;
        case parseFloat(0.03125):
            pl = 0.46;
            break;
        case parseFloat(0.03250):
            pl = 0.451;
            break;
        case parseFloat(0.03375):
            pl = 0.442;
            break;
        case parseFloat(0.03500):
            pl = 0.432;
            break;
        case parseFloat(0.03625):
            pl = 0.422;
            break;
        case parseFloat(0.03750):
            pl = 0.413;
            break;
        case parseFloat(0.03875):
            pl = 0.404;
            break;
        case parseFloat(0.04000):
            pl = 0.395;
            break;
        case parseFloat(0.04125):
            pl = 0.386;
            break;
        case parseFloat(0.04250):
            pl = 0.378;
            break;
        case parseFloat(0.04375):
            pl = 0.37;
            break;
        case parseFloat(0.04500):
            pl = 0.362;
            break;
        case parseFloat(0.04625):
            pl = 0.354;
            break;
        case parseFloat(0.04750):
            pl = 0.346;
            break;
        case parseFloat(0.04875):
            pl = 0.339;
            break;
        case parseFloat(0.05000):
            pl = 0.331;
            break;
        case parseFloat(0.05125):
            pl = 0.324;
            break;
        case parseFloat(0.05250):
            pl = 0.317;
            break;
        case parseFloat(0.05375):
            pl = 0.31;
            break;
        case parseFloat(0.05500):
            pl = 0.304;
            break;
        case parseFloat(0.05625):
            pl = 0.297;
            break;
        case parseFloat(0.05750):
            pl = 0.291;
            break;
        case parseFloat(0.05875):
            pl = 0.284;
            break;
        case parseFloat(0.06000):
            pl = 0.278;
            break;
        case parseFloat(0.06125):
            pl = 0.272;
            break;
        case parseFloat(0.06250):
            pl = 0.266;
            break;
        case parseFloat(0.06375):
            pl = 0.261;
            break;
        case parseFloat(0.06500):
            pl = 0.255;
            break;
        case parseFloat(0.06625):
            pl = 0.25;
            break;
        case parseFloat(0.06750):
            pl = 0.244;
            break;
        case parseFloat(0.06875):
            pl = 0.239;
            break;
        case parseFloat(0.07000):
            pl = 0.234;
            break;
        case parseFloat(0.07125):
            pl = 0.229;
            break;
        case parseFloat(0.07250):
            pl = 0.224;
            break;
        case parseFloat(0.07375):
            pl = 0.219;
            break;
        case parseFloat(0.07500):
            pl = 0.215;
            break;
        case parseFloat(0.07625):
            pl = 0.21;
            break;
        case parseFloat(0.07750):
            pl = 0.206;
            break;
        case parseFloat(0.07875):
            pl = 0.201;
            break;
        case parseFloat(0.08000):
            pl = 0.197;
            break;
        case parseFloat(0.08125):
            pl = 0.193;
            break;
        case parseFloat(0.08250):
            pl = 0.189;
            break;
        case parseFloat(0.08375):
            pl = 0.185;
            break;
        case parseFloat(0.08500):
            pl = 0.181;
            break;
        case parseFloat(0.08625):
            pl = 0.177;
            break;
        case parseFloat(0.08750):
            pl = 0.174;
            break;
        case parseFloat(0.08875):
            pl = 0.17;
            break;
        case parseFloat(0.09000):
            pl = 0.166;
            break;
        case parseFloat(0.09125):
            pl = 0.163;
            break;
        case parseFloat(0.09250):
            pl = 0.159;
            break;
        case parseFloat(0.09375):
            pl = 0.156;
            break;
        case parseFloat(0.09500):
            pl = 0.153;
            break;
        case parseFloat(0.09625):
            pl = 0.15;
            break;
        case parseFloat(0.09750):
            pl = 0.147;
            break;
        case parseFloat(0.09875):
            pl = 0.144;
            break;
        }
        break;
    case 52:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.46;
            break;
        case parseFloat(0.03125):
            pl = 0.46;
            break;
        case parseFloat(0.03250):
            pl = 0.457;
            break;
        case parseFloat(0.03375):
            pl = 0.447;
            break;
        case parseFloat(0.03500):
            pl = 0.437;
            break;
        case parseFloat(0.03625):
            pl = 0.428;
            break;
        case parseFloat(0.03750):
            pl = 0.419;
            break;
        case parseFloat(0.03875):
            pl = 0.41;
            break;
        case parseFloat(0.04000):
            pl = 0.401;
            break;
        case parseFloat(0.04125):
            pl = 0.392;
            break;
        case parseFloat(0.04250):
            pl = 0.384;
            break;
        case parseFloat(0.04375):
            pl = 0.376;
            break;
        case parseFloat(0.04500):
            pl = 0.368;
            break;
        case parseFloat(0.04625):
            pl = 0.36;
            break;
        case parseFloat(0.04750):
            pl = 0.352;
            break;
        case parseFloat(0.04875):
            pl = 0.344;
            break;
        case parseFloat(0.05000):
            pl = 0.337;
            break;
        case parseFloat(0.05125):
            pl = 0.33;
            break;
        case parseFloat(0.05250):
            pl = 0.323;
            break;
        case parseFloat(0.05375):
            pl = 0.316;
            break;
        case parseFloat(0.05500):
            pl = 0.309;
            break;
        case parseFloat(0.05625):
            pl = 0.303;
            break;
        case parseFloat(0.05750):
            pl = 0.296;
            break;
        case parseFloat(0.05875):
            pl = 0.29;
            break;
        case parseFloat(0.06000):
            pl = 0.284;
            break;
        case parseFloat(0.06125):
            pl = 0.278;
            break;
        case parseFloat(0.06250):
            pl = 0.272;
            break;
        case parseFloat(0.06375):
            pl = 0.266;
            break;
        case parseFloat(0.06500):
            pl = 0.261;
            break;
        case parseFloat(0.06625):
            pl = 0.255;
            break;
        case parseFloat(0.06750):
            pl = 0.25;
            break;
        case parseFloat(0.06875):
            pl = 0.245;
            break;
        case parseFloat(0.07000):
            pl = 0.24;
            break;
        case parseFloat(0.07125):
            pl = 0.235;
            break;
        case parseFloat(0.07250):
            pl = 0.23;
            break;
        case parseFloat(0.07375):
            pl = 0.225;
            break;
        case parseFloat(0.07500):
            pl = 0.22;
            break;
        case parseFloat(0.07625):
            pl = 0.216;
            break;
        case parseFloat(0.07750):
            pl = 0.211;
            break;
        case parseFloat(0.07875):
            pl = 0.207;
            break;
        case parseFloat(0.08000):
            pl = 0.202;
            break;
        case parseFloat(0.08125):
            pl = 0.198;
            break;
        case parseFloat(0.08250):
            pl = 0.194;
            break;
        case parseFloat(0.08375):
            pl = 0.19;
            break;
        case parseFloat(0.08500):
            pl = 0.186;
            break;
        case parseFloat(0.08625):
            pl = 0.182;
            break;
        case parseFloat(0.08750):
            pl = 0.179;
            break;
        case parseFloat(0.08875):
            pl = 0.175;
            break;
        case parseFloat(0.09000):
            pl = 0.171;
            break;
        case parseFloat(0.09125):
            pl = 0.168;
            break;
        case parseFloat(0.09250):
            pl = 0.164;
            break;
        case parseFloat(0.09375):
            pl = 0.161;
            break;
        case parseFloat(0.09500):
            pl = 0.158;
            break;
        case parseFloat(0.09625):
            pl = 0.155;
            break;
        case parseFloat(0.09750):
            pl = 0.151;
            break;
        case parseFloat(0.09875):
            pl = 0.148;
            break;
        }
        break;
    case 53:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.46;
            break;
        case parseFloat(0.03125):
            pl = 0.46;
            break;
        case parseFloat(0.03250):
            pl = 0.46;
            break;
        case parseFloat(0.03375):
            pl = 0.453;
            break;
        case parseFloat(0.03500):
            pl = 0.443;
            break;
        case parseFloat(0.03625):
            pl = 0.434;
            break;
        case parseFloat(0.03750):
            pl = 0.424;
            break;
        case parseFloat(0.03875):
            pl = 0.415;
            break;
        case parseFloat(0.04000):
            pl = 0.407;
            break;
        case parseFloat(0.04125):
            pl = 0.398;
            break;
        case parseFloat(0.04250):
            pl = 0.39;
            break;
        case parseFloat(0.04375):
            pl = 0.381;
            break;
        case parseFloat(0.04500):
            pl = 0.373;
            break;
        case parseFloat(0.04625):
            pl = 0.366;
            break;
        case parseFloat(0.04750):
            pl = 0.358;
            break;
        case parseFloat(0.04875):
            pl = 0.35;
            break;
        case parseFloat(0.05000):
            pl = 0.343;
            break;
        case parseFloat(0.05125):
            pl = 0.336;
            break;
        case parseFloat(0.05250):
            pl = 0.329;
            break;
        case parseFloat(0.05375):
            pl = 0.322;
            break;
        case parseFloat(0.05500):
            pl = 0.315;
            break;
        case parseFloat(0.05625):
            pl = 0.309;
            break;
        case parseFloat(0.05750):
            pl = 0.302;
            break;
        case parseFloat(0.05875):
            pl = 0.296;
            break;
        case parseFloat(0.06000):
            pl = 0.29;
            break;
        case parseFloat(0.06125):
            pl = 0.284;
            break;
        case parseFloat(0.06250):
            pl = 0.278;
            break;
        case parseFloat(0.06375):
            pl = 0.272;
            break;
        case parseFloat(0.06500):
            pl = 0.267;
            break;
        case parseFloat(0.06625):
            pl = 0.261;
            break;
        case parseFloat(0.06750):
            pl = 0.256;
            break;
        case parseFloat(0.06875):
            pl = 0.251;
            break;
        case parseFloat(0.07000):
            pl = 0.245;
            break;
        case parseFloat(0.07125):
            pl = 0.24;
            break;
        case parseFloat(0.07250):
            pl = 0.235;
            break;
        case parseFloat(0.07375):
            pl = 0.231;
            break;
        case parseFloat(0.07500):
            pl = 0.226;
            break;
        case parseFloat(0.07625):
            pl = 0.221;
            break;
        case parseFloat(0.07750):
            pl = 0.217;
            break;
        case parseFloat(0.07875):
            pl = 0.212;
            break;
        case parseFloat(0.08000):
            pl = 0.208;
            break;
        case parseFloat(0.08125):
            pl = 0.204;
            break;
        case parseFloat(0.08250):
            pl = 0.2;
            break;
        case parseFloat(0.08375):
            pl = 0.196;
            break;
        case parseFloat(0.08500):
            pl = 0.192;
            break;
        case parseFloat(0.08625):
            pl = 0.188;
            break;
        case parseFloat(0.08750):
            pl = 0.184;
            break;
        case parseFloat(0.08875):
            pl = 0.18;
            break;
        case parseFloat(0.09000):
            pl = 0.177;
            break;
        case parseFloat(0.09125):
            pl = 0.173;
            break;
        case parseFloat(0.09250):
            pl = 0.17;
            break;
        case parseFloat(0.09375):
            pl = 0.166;
            break;
        case parseFloat(0.09500):
            pl = 0.163;
            break;
        case parseFloat(0.09625):
            pl = 0.159;
            break;
        case parseFloat(0.09750):
            pl = 0.156;
            break;
        case parseFloat(0.09875):
            pl = 0.153;
            break;
        }
        break;
    case 54:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.46;
            break;
        case parseFloat(0.03125):
            pl = 0.46;
            break;
        case parseFloat(0.03250):
            pl = 0.46;
            break;
        case parseFloat(0.03375):
            pl = 0.458;
            break;
        case parseFloat(0.03500):
            pl = 0.449;
            break;
        case parseFloat(0.03625):
            pl = 0.439;
            break;
        case parseFloat(0.03750):
            pl = 0.43;
            break;
        case parseFloat(0.03875):
            pl = 0.421;
            break;
        case parseFloat(0.04000):
            pl = 0.413;
            break;
        case parseFloat(0.04125):
            pl = 0.404;
            break;
        case parseFloat(0.04250):
            pl = 0.396;
            break;
        case parseFloat(0.04375):
            pl = 0.387;
            break;
        case parseFloat(0.04500):
            pl = 0.379;
            break;
        case parseFloat(0.04625):
            pl = 0.372;
            break;
        case parseFloat(0.04750):
            pl = 0.364;
            break;
        case parseFloat(0.04875):
            pl = 0.357;
            break;
        case parseFloat(0.05000):
            pl = 0.349;
            break;
        case parseFloat(0.05125):
            pl = 0.342;
            break;
        case parseFloat(0.05250):
            pl = 0.335;
            break;
        case parseFloat(0.05375):
            pl = 0.328;
            break;
        case parseFloat(0.05500):
            pl = 0.321;
            break;
        case parseFloat(0.05625):
            pl = 0.315;
            break;
        case parseFloat(0.05750):
            pl = 0.308;
            break;
        case parseFloat(0.05875):
            pl = 0.302;
            break;
        case parseFloat(0.06000):
            pl = 0.296;
            break;
        case parseFloat(0.06125):
            pl = 0.29;
            break;
        case parseFloat(0.06250):
            pl = 0.284;
            break;
        case parseFloat(0.06375):
            pl = 0.278;
            break;
        case parseFloat(0.06500):
            pl = 0.273;
            break;
        case parseFloat(0.06625):
            pl = 0.267;
            break;
        case parseFloat(0.06750):
            pl = 0.262;
            break;
        case parseFloat(0.06875):
            pl = 0.256;
            break;
        case parseFloat(0.07000):
            pl = 0.251;
            break;
        case parseFloat(0.07125):
            pl = 0.246;
            break;
        case parseFloat(0.07250):
            pl = 0.241;
            break;
        case parseFloat(0.07375):
            pl = 0.236;
            break;
        case parseFloat(0.07500):
            pl = 0.232;
            break;
        case parseFloat(0.07625):
            pl = 0.227;
            break;
        case parseFloat(0.07750):
            pl = 0.222;
            break;
        case parseFloat(0.07875):
            pl = 0.218;
            break;
        case parseFloat(0.08000):
            pl = 0.214;
            break;
        case parseFloat(0.08125):
            pl = 0.209;
            break;
        case parseFloat(0.08250):
            pl = 0.205;
            break;
        case parseFloat(0.08375):
            pl = 0.201;
            break;
        case parseFloat(0.08500):
            pl = 0.197;
            break;
        case parseFloat(0.08625):
            pl = 0.193;
            break;
        case parseFloat(0.08750):
            pl = 0.189;
            break;
        case parseFloat(0.08875):
            pl = 0.186;
            break;
        case parseFloat(0.09000):
            pl = 0.182;
            break;
        case parseFloat(0.09125):
            pl = 0.178;
            break;
        case parseFloat(0.09250):
            pl = 0.175;
            break;
        case parseFloat(0.09375):
            pl = 0.171;
            break;
        case parseFloat(0.09500):
            pl = 0.168;
            break;
        case parseFloat(0.09625):
            pl = 0.165;
            break;
        case parseFloat(0.09750):
            pl = 0.161;
            break;
        case parseFloat(0.09875):
            pl = 0.158;
            break;
        }
        break;
    case 55:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.484;
            break;
        case parseFloat(0.03125):
            pl = 0.484;
            break;
        case parseFloat(0.03250):
            pl = 0.474;
            break;
        case parseFloat(0.03375):
            pl = 0.464;
            break;
        case parseFloat(0.03500):
            pl = 0.455;
            break;
        case parseFloat(0.03625):
            pl = 0.445;
            break;
        case parseFloat(0.03750):
            pl = 0.436;
            break;
        case parseFloat(0.03875):
            pl = 0.427;
            break;
        case parseFloat(0.04000):
            pl = 0.419;
            break;
        case parseFloat(0.04125):
            pl = 0.41;
            break;
        case parseFloat(0.04250):
            pl = 0.402;
            break;
        case parseFloat(0.04375):
            pl = 0.394;
            break;
        case parseFloat(0.04500):
            pl = 0.386;
            break;
        case parseFloat(0.04625):
            pl = 0.378;
            break;
        case parseFloat(0.04750):
            pl = 0.37;
            break;
        case parseFloat(0.04875):
            pl = 0.363;
            break;
        case parseFloat(0.05000):
            pl = 0.355;
            break;
        case parseFloat(0.05125):
            pl = 0.348;
            break;
        case parseFloat(0.05250):
            pl = 0.341;
            break;
        case parseFloat(0.05375):
            pl = 0.334;
            break;
        case parseFloat(0.05500):
            pl = 0.328;
            break;
        case parseFloat(0.05625):
            pl = 0.321;
            break;
        case parseFloat(0.05750):
            pl = 0.315;
            break;
        case parseFloat(0.05875):
            pl = 0.308;
            break;
        case parseFloat(0.06000):
            pl = 0.302;
            break;
        case parseFloat(0.06125):
            pl = 0.296;
            break;
        case parseFloat(0.06250):
            pl = 0.29;
            break;
        case parseFloat(0.06375):
            pl = 0.284;
            break;
        case parseFloat(0.06500):
            pl = 0.279;
            break;
        case parseFloat(0.06625):
            pl = 0.273;
            break;
        case parseFloat(0.06750):
            pl = 0.268;
            break;
        case parseFloat(0.06875):
            pl = 0.262;
            break;
        case parseFloat(0.07000):
            pl = 0.257;
            break;
        case parseFloat(0.07125):
            pl = 0.252;
            break;
        case parseFloat(0.07250):
            pl = 0.247;
            break;
        case parseFloat(0.07375):
            pl = 0.242;
            break;
        case parseFloat(0.07500):
            pl = 0.238;
            break;
        case parseFloat(0.07625):
            pl = 0.233;
            break;
        case parseFloat(0.07750):
            pl = 0.228;
            break;
        case parseFloat(0.07875):
            pl = 0.224;
            break;
        case parseFloat(0.08000):
            pl = 0.219;
            break;
        case parseFloat(0.08125):
            pl = 0.215;
            break;
        case parseFloat(0.08250):
            pl = 0.211;
            break;
        case parseFloat(0.08375):
            pl = 0.207;
            break;
        case parseFloat(0.08500):
            pl = 0.203;
            break;
        case parseFloat(0.08625):
            pl = 0.199;
            break;
        case parseFloat(0.08750):
            pl = 0.195;
            break;
        case parseFloat(0.08875):
            pl = 0.191;
            break;
        case parseFloat(0.09000):
            pl = 0.187;
            break;
        case parseFloat(0.09125):
            pl = 0.184;
            break;
        case parseFloat(0.09250):
            pl = 0.18;
            break;
        case parseFloat(0.09375):
            pl = 0.177;
            break;
        case parseFloat(0.09500):
            pl = 0.173;
            break;
        case parseFloat(0.09625):
            pl = 0.17;
            break;
        case parseFloat(0.09750):
            pl = 0.167;
            break;
        case parseFloat(0.09875):
            pl = 0.163;
            break;
        }
        break;
    case 56:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.489;
            break;
        case parseFloat(0.03125):
            pl = 0.489;
            break;
        case parseFloat(0.03250):
            pl = 0.48;
            break;
        case parseFloat(0.03375):
            pl = 0.47;
            break;
        case parseFloat(0.03500):
            pl = 0.46;
            break;
        case parseFloat(0.03625):
            pl = 0.451;
            break;
        case parseFloat(0.03750):
            pl = 0.442;
            break;
        case parseFloat(0.03875):
            pl = 0.433;
            break;
        case parseFloat(0.04000):
            pl = 0.425;
            break;
        case parseFloat(0.04125):
            pl = 0.416;
            break;
        case parseFloat(0.04250):
            pl = 0.408;
            break;
        case parseFloat(0.04375):
            pl = 0.4;
            break;
        case parseFloat(0.04500):
            pl = 0.392;
            break;
        case parseFloat(0.04625):
            pl = 0.384;
            break;
        case parseFloat(0.04750):
            pl = 0.376;
            break;
        case parseFloat(0.04875):
            pl = 0.369;
            break;
        case parseFloat(0.05000):
            pl = 0.362;
            break;
        case parseFloat(0.05125):
            pl = 0.354;
            break;
        case parseFloat(0.05250):
            pl = 0.347;
            break;
        case parseFloat(0.05375):
            pl = 0.341;
            break;
        case parseFloat(0.05500):
            pl = 0.334;
            break;
        case parseFloat(0.05625):
            pl = 0.327;
            break;
        case parseFloat(0.05750):
            pl = 0.321;
            break;
        case parseFloat(0.05875):
            pl = 0.315;
            break;
        case parseFloat(0.06000):
            pl = 0.308;
            break;
        case parseFloat(0.06125):
            pl = 0.302;
            break;
        case parseFloat(0.06250):
            pl = 0.296;
            break;
        case parseFloat(0.06375):
            pl = 0.291;
            break;
        case parseFloat(0.06500):
            pl = 0.285;
            break;
        case parseFloat(0.06625):
            pl = 0.279;
            break;
        case parseFloat(0.06750):
            pl = 0.274;
            break;
        case parseFloat(0.06875):
            pl = 0.269;
            break;
        case parseFloat(0.07000):
            pl = 0.263;
            break;
        case parseFloat(0.07125):
            pl = 0.258;
            break;
        case parseFloat(0.07250):
            pl = 0.253;
            break;
        case parseFloat(0.07375):
            pl = 0.248;
            break;
        case parseFloat(0.07500):
            pl = 0.244;
            break;
        case parseFloat(0.07625):
            pl = 0.239;
            break;
        case parseFloat(0.07750):
            pl = 0.234;
            break;
        case parseFloat(0.07875):
            pl = 0.23;
            break;
        case parseFloat(0.08000):
            pl = 0.225;
            break;
        case parseFloat(0.08125):
            pl = 0.221;
            break;
        case parseFloat(0.08250):
            pl = 0.217;
            break;
        case parseFloat(0.08375):
            pl = 0.213;
            break;
        case parseFloat(0.08500):
            pl = 0.209;
            break;
        case parseFloat(0.08625):
            pl = 0.205;
            break;
        case parseFloat(0.08750):
            pl = 0.201;
            break;
        case parseFloat(0.08875):
            pl = 0.197;
            break;
        case parseFloat(0.09000):
            pl = 0.193;
            break;
        case parseFloat(0.09125):
            pl = 0.189;
            break;
        case parseFloat(0.09250):
            pl = 0.186;
            break;
        case parseFloat(0.09375):
            pl = 0.182;
            break;
        case parseFloat(0.09500):
            pl = 0.179;
            break;
        case parseFloat(0.09625):
            pl = 0.175;
            break;
        case parseFloat(0.09750):
            pl = 0.172;
            break;
        case parseFloat(0.09875):
            pl = 0.169;
            break;
        }
        break;
    case 57:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.495;
            break;
        case parseFloat(0.03125):
            pl = 0.495;
            break;
        case parseFloat(0.03250):
            pl = 0.485;
            break;
        case parseFloat(0.03375):
            pl = 0.476;
            break;
        case parseFloat(0.03500):
            pl = 0.466;
            break;
        case parseFloat(0.03625):
            pl = 0.457;
            break;
        case parseFloat(0.03750):
            pl = 0.448;
            break;
        case parseFloat(0.03875):
            pl = 0.439;
            break;
        case parseFloat(0.04000):
            pl = 0.431;
            break;
        case parseFloat(0.04125):
            pl = 0.422;
            break;
        case parseFloat(0.04250):
            pl = 0.414;
            break;
        case parseFloat(0.04375):
            pl = 0.406;
            break;
        case parseFloat(0.04500):
            pl = 0.398;
            break;
        case parseFloat(0.04625):
            pl = 0.39;
            break;
        case parseFloat(0.04750):
            pl = 0.383;
            break;
        case parseFloat(0.04875):
            pl = 0.375;
            break;
        case parseFloat(0.05000):
            pl = 0.368;
            break;
        case parseFloat(0.05125):
            pl = 0.361;
            break;
        case parseFloat(0.05250):
            pl = 0.354;
            break;
        case parseFloat(0.05375):
            pl = 0.347;
            break;
        case parseFloat(0.05500):
            pl = 0.34;
            break;
        case parseFloat(0.05625):
            pl = 0.334;
            break;
        case parseFloat(0.05750):
            pl = 0.327;
            break;
        case parseFloat(0.05875):
            pl = 0.321;
            break;
        case parseFloat(0.06000):
            pl = 0.315;
            break;
        case parseFloat(0.06125):
            pl = 0.309;
            break;
        case parseFloat(0.06250):
            pl = 0.303;
            break;
        case parseFloat(0.06375):
            pl = 0.297;
            break;
        case parseFloat(0.06500):
            pl = 0.291;
            break;
        case parseFloat(0.06625):
            pl = 0.286;
            break;
        case parseFloat(0.06750):
            pl = 0.28;
            break;
        case parseFloat(0.06875):
            pl = 0.275;
            break;
        case parseFloat(0.07000):
            pl = 0.27;
            break;
        case parseFloat(0.07125):
            pl = 0.265;
            break;
        case parseFloat(0.07250):
            pl = 0.26;
            break;
        case parseFloat(0.07375):
            pl = 0.255;
            break;
        case parseFloat(0.07500):
            pl = 0.25;
            break;
        case parseFloat(0.07625):
            pl = 0.245;
            break;
        case parseFloat(0.07750):
            pl = 0.24;
            break;
        case parseFloat(0.07875):
            pl = 0.236;
            break;
        case parseFloat(0.08000):
            pl = 0.231;
            break;
        case parseFloat(0.08125):
            pl = 0.227;
            break;
        case parseFloat(0.08250):
            pl = 0.223;
            break;
        case parseFloat(0.08375):
            pl = 0.219;
            break;
        case parseFloat(0.08500):
            pl = 0.214;
            break;
        case parseFloat(0.08625):
            pl = 0.21;
            break;
        case parseFloat(0.08750):
            pl = 0.207;
            break;
        case parseFloat(0.08875):
            pl = 0.203;
            break;
        case parseFloat(0.09000):
            pl = 0.199;
            break;
        case parseFloat(0.09125):
            pl = 0.195;
            break;
        case parseFloat(0.09250):
            pl = 0.191;
            break;
        case parseFloat(0.09375):
            pl = 0.188;
            break;
        case parseFloat(0.09500):
            pl = 0.184;
            break;
        case parseFloat(0.09625):
            pl = 0.181;
            break;
        case parseFloat(0.09750):
            pl = 0.178;
            break;
        case parseFloat(0.09875):
            pl = 0.174;
            break;
        }
        break;
    case 58:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.5;
            break;
        case parseFloat(0.03125):
            pl = 0.5;
            break;
        case parseFloat(0.03250):
            pl = 0.491;
            break;
        case parseFloat(0.03375):
            pl = 0.482;
            break;
        case parseFloat(0.03500):
            pl = 0.472;
            break;
        case parseFloat(0.03625):
            pl = 0.463;
            break;
        case parseFloat(0.03750):
            pl = 0.454;
            break;
        case parseFloat(0.03875):
            pl = 0.446;
            break;
        case parseFloat(0.04000):
            pl = 0.437;
            break;
        case parseFloat(0.04125):
            pl = 0.429;
            break;
        case parseFloat(0.04250):
            pl = 0.42;
            break;
        case parseFloat(0.04375):
            pl = 0.412;
            break;
        case parseFloat(0.04500):
            pl = 0.405;
            break;
        case parseFloat(0.04625):
            pl = 0.397;
            break;
        case parseFloat(0.04750):
            pl = 0.389;
            break;
        case parseFloat(0.04875):
            pl = 0.382;
            break;
        case parseFloat(0.05000):
            pl = 0.375;
            break;
        case parseFloat(0.05125):
            pl = 0.367;
            break;
        case parseFloat(0.05250):
            pl = 0.36;
            break;
        case parseFloat(0.05375):
            pl = 0.354;
            break;
        case parseFloat(0.05500):
            pl = 0.347;
            break;
        case parseFloat(0.05625):
            pl = 0.34;
            break;
        case parseFloat(0.05750):
            pl = 0.334;
            break;
        case parseFloat(0.05875):
            pl = 0.328;
            break;
        case parseFloat(0.06000):
            pl = 0.321;
            break;
        case parseFloat(0.06125):
            pl = 0.315;
            break;
        case parseFloat(0.06250):
            pl = 0.309;
            break;
        case parseFloat(0.06375):
            pl = 0.304;
            break;
        case parseFloat(0.06500):
            pl = 0.298;
            break;
        case parseFloat(0.06625):
            pl = 0.292;
            break;
        case parseFloat(0.06750):
            pl = 0.287;
            break;
        case parseFloat(0.06875):
            pl = 0.281;
            break;
        case parseFloat(0.07000):
            pl = 0.276;
            break;
        case parseFloat(0.07125):
            pl = 0.271;
            break;
        case parseFloat(0.07250):
            pl = 0.266;
            break;
        case parseFloat(0.07375):
            pl = 0.261;
            break;
        case parseFloat(0.07500):
            pl = 0.256;
            break;
        case parseFloat(0.07625):
            pl = 0.251;
            break;
        case parseFloat(0.07750):
            pl = 0.247;
            break;
        case parseFloat(0.07875):
            pl = 0.242;
            break;
        case parseFloat(0.08000):
            pl = 0.238;
            break;
        case parseFloat(0.08125):
            pl = 0.233;
            break;
        case parseFloat(0.08250):
            pl = 0.229;
            break;
        case parseFloat(0.08375):
            pl = 0.225;
            break;
        case parseFloat(0.08500):
            pl = 0.221;
            break;
        case parseFloat(0.08625):
            pl = 0.217;
            break;
        case parseFloat(0.08750):
            pl = 0.213;
            break;
        case parseFloat(0.08875):
            pl = 0.209;
            break;
        case parseFloat(0.09000):
            pl = 0.205;
            break;
        case parseFloat(0.09125):
            pl = 0.201;
            break;
        case parseFloat(0.09250):
            pl = 0.197;
            break;
        case parseFloat(0.09375):
            pl = 0.194;
            break;
        case parseFloat(0.09500):
            pl = 0.19;
            break;
        case parseFloat(0.09625):
            pl = 0.187;
            break;
        case parseFloat(0.09750):
            pl = 0.183;
            break;
        case parseFloat(0.09875):
            pl = 0.18;
            break;
        }
        break;
    case 59:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.506;
            break;
        case parseFloat(0.03125):
            pl = 0.506;
            break;
        case parseFloat(0.03250):
            pl = 0.497;
            break;
        case parseFloat(0.03375):
            pl = 0.488;
            break;
        case parseFloat(0.03500):
            pl = 0.479;
            break;
        case parseFloat(0.03625):
            pl = 0.47;
            break;
        case parseFloat(0.03750):
            pl = 0.461;
            break;
        case parseFloat(0.03875):
            pl = 0.452;
            break;
        case parseFloat(0.04000):
            pl = 0.443;
            break;
        case parseFloat(0.04125):
            pl = 0.435;
            break;
        case parseFloat(0.04250):
            pl = 0.427;
            break;
        case parseFloat(0.04375):
            pl = 0.419;
            break;
        case parseFloat(0.04500):
            pl = 0.411;
            break;
        case parseFloat(0.04625):
            pl = 0.403;
            break;
        case parseFloat(0.04750):
            pl = 0.396;
            break;
        case parseFloat(0.04875):
            pl = 0.388;
            break;
        case parseFloat(0.05000):
            pl = 0.381;
            break;
        case parseFloat(0.05125):
            pl = 0.374;
            break;
        case parseFloat(0.05250):
            pl = 0.367;
            break;
        case parseFloat(0.05375):
            pl = 0.36;
            break;
        case parseFloat(0.05500):
            pl = 0.354;
            break;
        case parseFloat(0.05625):
            pl = 0.347;
            break;
        case parseFloat(0.05750):
            pl = 0.341;
            break;
        case parseFloat(0.05875):
            pl = 0.334;
            break;
        case parseFloat(0.06000):
            pl = 0.328;
            break;
        case parseFloat(0.06125):
            pl = 0.322;
            break;
        case parseFloat(0.06250):
            pl = 0.316;
            break;
        case parseFloat(0.06375):
            pl = 0.31;
            break;
        case parseFloat(0.06500):
            pl = 0.305;
            break;
        case parseFloat(0.06625):
            pl = 0.299;
            break;
        case parseFloat(0.06750):
            pl = 0.293;
            break;
        case parseFloat(0.06875):
            pl = 0.288;
            break;
        case parseFloat(0.07000):
            pl = 0.283;
            break;
        case parseFloat(0.07125):
            pl = 0.278;
            break;
        case parseFloat(0.07250):
            pl = 0.273;
            break;
        case parseFloat(0.07375):
            pl = 0.268;
            break;
        case parseFloat(0.07500):
            pl = 0.263;
            break;
        case parseFloat(0.07625):
            pl = 0.258;
            break;
        case parseFloat(0.07750):
            pl = 0.253;
            break;
        case parseFloat(0.07875):
            pl = 0.249;
            break;
        case parseFloat(0.08000):
            pl = 0.244;
            break;
        case parseFloat(0.08125):
            pl = 0.24;
            break;
        case parseFloat(0.08250):
            pl = 0.235;
            break;
        case parseFloat(0.08375):
            pl = 0.231;
            break;
        case parseFloat(0.08500):
            pl = 0.227;
            break;
        case parseFloat(0.08625):
            pl = 0.223;
            break;
        case parseFloat(0.08750):
            pl = 0.219;
            break;
        case parseFloat(0.08875):
            pl = 0.215;
            break;
        case parseFloat(0.09000):
            pl = 0.211;
            break;
        case parseFloat(0.09125):
            pl = 0.207;
            break;
        case parseFloat(0.09250):
            pl = 0.204;
            break;
        case parseFloat(0.09375):
            pl = 0.2;
            break;
        case parseFloat(0.09500):
            pl = 0.196;
            break;
        case parseFloat(0.09625):
            pl = 0.193;
            break;
        case parseFloat(0.09750):
            pl = 0.189;
            break;
        case parseFloat(0.09875):
            pl = 0.186;
            break;
        }
        break;
    case 60:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.511;
            break;
        case parseFloat(0.03125):
            pl = 0.511;
            break;
        case parseFloat(0.03250):
            pl = 0.503;
            break;
        case parseFloat(0.03375):
            pl = 0.494;
            break;
        case parseFloat(0.03500):
            pl = 0.485;
            break;
        case parseFloat(0.03625):
            pl = 0.476;
            break;
        case parseFloat(0.03750):
            pl = 0.467;
            break;
        case parseFloat(0.03875):
            pl = 0.458;
            break;
        case parseFloat(0.04000):
            pl = 0.45;
            break;
        case parseFloat(0.04125):
            pl = 0.442;
            break;
        case parseFloat(0.04250):
            pl = 0.433;
            break;
        case parseFloat(0.04375):
            pl = 0.425;
            break;
        case parseFloat(0.04500):
            pl = 0.418;
            break;
        case parseFloat(0.04625):
            pl = 0.41;
            break;
        case parseFloat(0.04750):
            pl = 0.403;
            break;
        case parseFloat(0.04875):
            pl = 0.395;
            break;
        case parseFloat(0.05000):
            pl = 0.388;
            break;
        case parseFloat(0.05125):
            pl = 0.381;
            break;
        case parseFloat(0.05250):
            pl = 0.374;
            break;
        case parseFloat(0.05375):
            pl = 0.367;
            break;
        case parseFloat(0.05500):
            pl = 0.36;
            break;
        case parseFloat(0.05625):
            pl = 0.354;
            break;
        case parseFloat(0.05750):
            pl = 0.347;
            break;
        case parseFloat(0.05875):
            pl = 0.341;
            break;
        case parseFloat(0.06000):
            pl = 0.335;
            break;
        case parseFloat(0.06125):
            pl = 0.329;
            break;
        case parseFloat(0.06250):
            pl = 0.323;
            break;
        case parseFloat(0.06375):
            pl = 0.317;
            break;
        case parseFloat(0.06500):
            pl = 0.311;
            break;
        case parseFloat(0.06625):
            pl = 0.306;
            break;
        case parseFloat(0.06750):
            pl = 0.3;
            break;
        case parseFloat(0.06875):
            pl = 0.295;
            break;
        case parseFloat(0.07000):
            pl = 0.29;
            break;
        case parseFloat(0.07125):
            pl = 0.284;
            break;
        case parseFloat(0.07250):
            pl = 0.279;
            break;
        case parseFloat(0.07375):
            pl = 0.274;
            break;
        case parseFloat(0.07500):
            pl = 0.269;
            break;
        case parseFloat(0.07625):
            pl = 0.265;
            break;
        case parseFloat(0.07750):
            pl = 0.26;
            break;
        case parseFloat(0.07875):
            pl = 0.255;
            break;
        case parseFloat(0.08000):
            pl = 0.251;
            break;
        case parseFloat(0.08125):
            pl = 0.246;
            break;
        case parseFloat(0.08250):
            pl = 0.242;
            break;
        case parseFloat(0.08375):
            pl = 0.238;
            break;
        case parseFloat(0.08500):
            pl = 0.233;
            break;
        case parseFloat(0.08625):
            pl = 0.229;
            break;
        case parseFloat(0.08750):
            pl = 0.225;
            break;
        case parseFloat(0.08875):
            pl = 0.221;
            break;
        case parseFloat(0.09000):
            pl = 0.217;
            break;
        case parseFloat(0.09125):
            pl = 0.214;
            break;
        case parseFloat(0.09250):
            pl = 0.21;
            break;
        case parseFloat(0.09375):
            pl = 0.206;
            break;
        case parseFloat(0.09500):
            pl = 0.203;
            break;
        case parseFloat(0.09625):
            pl = 0.199;
            break;
        case parseFloat(0.09750):
            pl = 0.195;
            break;
        case parseFloat(0.09875):
            pl = 0.192;
            break;
        }
        break;
    case 61:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.517;
            break;
        case parseFloat(0.03125):
            pl = 0.517;
            break;
        case parseFloat(0.03250):
            pl = 0.509;
            break;
        case parseFloat(0.03375):
            pl = 0.5;
            break;
        case parseFloat(0.03500):
            pl = 0.491;
            break;
        case parseFloat(0.03625):
            pl = 0.482;
            break;
        case parseFloat(0.03750):
            pl = 0.473;
            break;
        case parseFloat(0.03875):
            pl = 0.465;
            break;
        case parseFloat(0.04000):
            pl = 0.456;
            break;
        case parseFloat(0.04125):
            pl = 0.448;
            break;
        case parseFloat(0.04250):
            pl = 0.44;
            break;
        case parseFloat(0.04375):
            pl = 0.432;
            break;
        case parseFloat(0.04500):
            pl = 0.424;
            break;
        case parseFloat(0.04625):
            pl = 0.417;
            break;
        case parseFloat(0.04750):
            pl = 0.409;
            break;
        case parseFloat(0.04875):
            pl = 0.402;
            break;
        case parseFloat(0.05000):
            pl = 0.395;
            break;
        case parseFloat(0.05125):
            pl = 0.388;
            break;
        case parseFloat(0.05250):
            pl = 0.381;
            break;
        case parseFloat(0.05375):
            pl = 0.374;
            break;
        case parseFloat(0.05500):
            pl = 0.367;
            break;
        case parseFloat(0.05625):
            pl = 0.361;
            break;
        case parseFloat(0.05750):
            pl = 0.354;
            break;
        case parseFloat(0.05875):
            pl = 0.348;
            break;
        case parseFloat(0.06000):
            pl = 0.342;
            break;
        case parseFloat(0.06125):
            pl = 0.336;
            break;
        case parseFloat(0.06250):
            pl = 0.33;
            break;
        case parseFloat(0.06375):
            pl = 0.324;
            break;
        case parseFloat(0.06500):
            pl = 0.318;
            break;
        case parseFloat(0.06625):
            pl = 0.313;
            break;
        case parseFloat(0.06750):
            pl = 0.307;
            break;
        case parseFloat(0.06875):
            pl = 0.302;
            break;
        case parseFloat(0.07000):
            pl = 0.297;
            break;
        case parseFloat(0.07125):
            pl = 0.291;
            break;
        case parseFloat(0.07250):
            pl = 0.286;
            break;
        case parseFloat(0.07375):
            pl = 0.281;
            break;
        case parseFloat(0.07500):
            pl = 0.276;
            break;
        case parseFloat(0.07625):
            pl = 0.271;
            break;
        case parseFloat(0.07750):
            pl = 0.267;
            break;
        case parseFloat(0.07875):
            pl = 0.262;
            break;
        case parseFloat(0.08000):
            pl = 0.258;
            break;
        case parseFloat(0.08125):
            pl = 0.253;
            break;
        case parseFloat(0.08250):
            pl = 0.249;
            break;
        case parseFloat(0.08375):
            pl = 0.244;
            break;
        case parseFloat(0.08500):
            pl = 0.24;
            break;
        case parseFloat(0.08625):
            pl = 0.236;
            break;
        case parseFloat(0.08750):
            pl = 0.232;
            break;
        case parseFloat(0.08875):
            pl = 0.228;
            break;
        case parseFloat(0.09000):
            pl = 0.224;
            break;
        case parseFloat(0.09125):
            pl = 0.22;
            break;
        case parseFloat(0.09250):
            pl = 0.216;
            break;
        case parseFloat(0.09375):
            pl = 0.213;
            break;
        case parseFloat(0.09500):
            pl = 0.209;
            break;
        case parseFloat(0.09625):
            pl = 0.205;
            break;
        case parseFloat(0.09750):
            pl = 0.202;
            break;
        case parseFloat(0.09875):
            pl = 0.198;
            break;
        }
        break;
    case 62:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.524;
            break;
        case parseFloat(0.03125):
            pl = 0.524;
            break;
        case parseFloat(0.03250):
            pl = 0.522;
            break;
        case parseFloat(0.03375):
            pl = 0.513;
            break;
        case parseFloat(0.03500):
            pl = 0.504;
            break;
        case parseFloat(0.03625):
            pl = 0.496;
            break;
        case parseFloat(0.03750):
            pl = 0.487;
            break;
        case parseFloat(0.03875):
            pl = 0.479;
            break;
        case parseFloat(0.04000):
            pl = 0.47;
            break;
        case parseFloat(0.04125):
            pl = 0.462;
            break;
        case parseFloat(0.04250):
            pl = 0.454;
            break;
        case parseFloat(0.04375):
            pl = 0.447;
            break;
        case parseFloat(0.04500):
            pl = 0.439;
            break;
        case parseFloat(0.04625):
            pl = 0.431;
            break;
        case parseFloat(0.04750):
            pl = 0.424;
            break;
        case parseFloat(0.04875):
            pl = 0.417;
            break;
        case parseFloat(0.05000):
            pl = 0.41;
            break;
        case parseFloat(0.05125):
            pl = 0.403;
            break;
        case parseFloat(0.05250):
            pl = 0.396;
            break;
        case parseFloat(0.05375):
            pl = 0.389;
            break;
        case parseFloat(0.05500):
            pl = 0.382;
            break;
        case parseFloat(0.05625):
            pl = 0.376;
            break;
        case parseFloat(0.05750):
            pl = 0.37;
            break;
        case parseFloat(0.05875):
            pl = 0.363;
            break;
        case parseFloat(0.06000):
            pl = 0.357;
            break;
        case parseFloat(0.06125):
            pl = 0.351;
            break;
        case parseFloat(0.06250):
            pl = 0.345;
            break;
        case parseFloat(0.06375):
            pl = 0.339;
            break;
        case parseFloat(0.06500):
            pl = 0.334;
            break;
        case parseFloat(0.06625):
            pl = 0.328;
            break;
        case parseFloat(0.06750):
            pl = 0.322;
            break;
        case parseFloat(0.06875):
            pl = 0.317;
            break;
        case parseFloat(0.07000):
            pl = 0.312;
            break;
        case parseFloat(0.07125):
            pl = 0.307;
            break;
        case parseFloat(0.07250):
            pl = 0.301;
            break;
        case parseFloat(0.07375):
            pl = 0.296;
            break;
        case parseFloat(0.07500):
            pl = 0.291;
            break;
        case parseFloat(0.07625):
            pl = 0.287;
            break;
        case parseFloat(0.07750):
            pl = 0.282;
            break;
        case parseFloat(0.07875):
            pl = 0.277;
            break;
        case parseFloat(0.08000):
            pl = 0.272;
            break;
        case parseFloat(0.08125):
            pl = 0.268;
            break;
        case parseFloat(0.08250):
            pl = 0.264;
            break;
        case parseFloat(0.08375):
            pl = 0.259;
            break;
        case parseFloat(0.08500):
            pl = 0.255;
            break;
        case parseFloat(0.08625):
            pl = 0.251;
            break;
        case parseFloat(0.08750):
            pl = 0.247;
            break;
        case parseFloat(0.08875):
            pl = 0.242;
            break;
        case parseFloat(0.09000):
            pl = 0.238;
            break;
        case parseFloat(0.09125):
            pl = 0.235;
            break;
        case parseFloat(0.09250):
            pl = 0.231;
            break;
        case parseFloat(0.09375):
            pl = 0.227;
            break;
        case parseFloat(0.09500):
            pl = 0.223;
            break;
        case parseFloat(0.09625):
            pl = 0.22;
            break;
        case parseFloat(0.09750):
            pl = 0.216;
            break;
        case parseFloat(0.09875):
            pl = 0.212;
            break;
        }
        break;
    case 63:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.53;
            break;
        case parseFloat(0.03125):
            pl = 0.53;
            break;
        case parseFloat(0.03250):
            pl = 0.528;
            break;
        case parseFloat(0.03375):
            pl = 0.519;
            break;
        case parseFloat(0.03500):
            pl = 0.511;
            break;
        case parseFloat(0.03625):
            pl = 0.502;
            break;
        case parseFloat(0.03750):
            pl = 0.493;
            break;
        case parseFloat(0.03875):
            pl = 0.485;
            break;
        case parseFloat(0.04000):
            pl = 0.477;
            break;
        case parseFloat(0.04125):
            pl = 0.469;
            break;
        case parseFloat(0.04250):
            pl = 0.461;
            break;
        case parseFloat(0.04375):
            pl = 0.453;
            break;
        case parseFloat(0.04500):
            pl = 0.446;
            break;
        case parseFloat(0.04625):
            pl = 0.438;
            break;
        case parseFloat(0.04750):
            pl = 0.431;
            break;
        case parseFloat(0.04875):
            pl = 0.423;
            break;
        case parseFloat(0.05000):
            pl = 0.416;
            break;
        case parseFloat(0.05125):
            pl = 0.409;
            break;
        case parseFloat(0.05250):
            pl = 0.403;
            break;
        case parseFloat(0.05375):
            pl = 0.396;
            break;
        case parseFloat(0.05500):
            pl = 0.389;
            break;
        case parseFloat(0.05625):
            pl = 0.383;
            break;
        case parseFloat(0.05750):
            pl = 0.376;
            break;
        case parseFloat(0.05875):
            pl = 0.37;
            break;
        case parseFloat(0.06000):
            pl = 0.364;
            break;
        case parseFloat(0.06125):
            pl = 0.358;
            break;
        case parseFloat(0.06250):
            pl = 0.352;
            break;
        case parseFloat(0.06375):
            pl = 0.346;
            break;
        case parseFloat(0.06500):
            pl = 0.341;
            break;
        case parseFloat(0.06625):
            pl = 0.335;
            break;
        case parseFloat(0.06750):
            pl = 0.329;
            break;
        case parseFloat(0.06875):
            pl = 0.324;
            break;
        case parseFloat(0.07000):
            pl = 0.319;
            break;
        case parseFloat(0.07125):
            pl = 0.313;
            break;
        case parseFloat(0.07250):
            pl = 0.308;
            break;
        case parseFloat(0.07375):
            pl = 0.303;
            break;
        case parseFloat(0.07500):
            pl = 0.298;
            break;
        case parseFloat(0.07625):
            pl = 0.293;
            break;
        case parseFloat(0.07750):
            pl = 0.289;
            break;
        case parseFloat(0.07875):
            pl = 0.284;
            break;
        case parseFloat(0.08000):
            pl = 0.279;
            break;
        case parseFloat(0.08125):
            pl = 0.275;
            break;
        case parseFloat(0.08250):
            pl = 0.27;
            break;
        case parseFloat(0.08375):
            pl = 0.266;
            break;
        case parseFloat(0.08500):
            pl = 0.262;
            break;
        case parseFloat(0.08625):
            pl = 0.257;
            break;
        case parseFloat(0.08750):
            pl = 0.253;
            break;
        case parseFloat(0.08875):
            pl = 0.249;
            break;
        case parseFloat(0.09000):
            pl = 0.245;
            break;
        case parseFloat(0.09125):
            pl = 0.241;
            break;
        case parseFloat(0.09250):
            pl = 0.237;
            break;
        case parseFloat(0.09375):
            pl = 0.233;
            break;
        case parseFloat(0.09500):
            pl = 0.23;
            break;
        case parseFloat(0.09625):
            pl = 0.226;
            break;
        case parseFloat(0.09750):
            pl = 0.222;
            break;
        case parseFloat(0.09875):
            pl = 0.219;
            break;
        }
        break;
    case 64:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.536;
            break;
        case parseFloat(0.03125):
            pl = 0.536;
            break;
        case parseFloat(0.03250):
            pl = 0.534;
            break;
        case parseFloat(0.03375):
            pl = 0.526;
            break;
        case parseFloat(0.03500):
            pl = 0.517;
            break;
        case parseFloat(0.03625):
            pl = 0.508;
            break;
        case parseFloat(0.03750):
            pl = 0.5;
            break;
        case parseFloat(0.03875):
            pl = 0.492;
            break;
        case parseFloat(0.04000):
            pl = 0.483;
            break;
        case parseFloat(0.04125):
            pl = 0.475;
            break;
        case parseFloat(0.04250):
            pl = 0.468;
            break;
        case parseFloat(0.04375):
            pl = 0.46;
            break;
        case parseFloat(0.04500):
            pl = 0.452;
            break;
        case parseFloat(0.04625):
            pl = 0.445;
            break;
        case parseFloat(0.04750):
            pl = 0.438;
            break;
        case parseFloat(0.04875):
            pl = 0.43;
            break;
        case parseFloat(0.05000):
            pl = 0.423;
            break;
        case parseFloat(0.05125):
            pl = 0.416;
            break;
        case parseFloat(0.05250):
            pl = 0.41;
            break;
        case parseFloat(0.05375):
            pl = 0.403;
            break;
        case parseFloat(0.05500):
            pl = 0.396;
            break;
        case parseFloat(0.05625):
            pl = 0.39;
            break;
        case parseFloat(0.05750):
            pl = 0.384;
            break;
        case parseFloat(0.05875):
            pl = 0.377;
            break;
        case parseFloat(0.06000):
            pl = 0.371;
            break;
        case parseFloat(0.06125):
            pl = 0.365;
            break;
        case parseFloat(0.06250):
            pl = 0.359;
            break;
        case parseFloat(0.06375):
            pl = 0.353;
            break;
        case parseFloat(0.06500):
            pl = 0.348;
            break;
        case parseFloat(0.06625):
            pl = 0.342;
            break;
        case parseFloat(0.06750):
            pl = 0.337;
            break;
        case parseFloat(0.06875):
            pl = 0.331;
            break;
        case parseFloat(0.07000):
            pl = 0.326;
            break;
        case parseFloat(0.07125):
            pl = 0.321;
            break;
        case parseFloat(0.07250):
            pl = 0.316;
            break;
        case parseFloat(0.07375):
            pl = 0.31;
            break;
        case parseFloat(0.07500):
            pl = 0.305;
            break;
        case parseFloat(0.07625):
            pl = 0.301;
            break;
        case parseFloat(0.07750):
            pl = 0.296;
            break;
        case parseFloat(0.07875):
            pl = 0.291;
            break;
        case parseFloat(0.08000):
            pl = 0.286;
            break;
        case parseFloat(0.08125):
            pl = 0.282;
            break;
        case parseFloat(0.08250):
            pl = 0.277;
            break;
        case parseFloat(0.08375):
            pl = 0.273;
            break;
        case parseFloat(0.08500):
            pl = 0.269;
            break;
        case parseFloat(0.08625):
            pl = 0.264;
            break;
        case parseFloat(0.08750):
            pl = 0.26;
            break;
        case parseFloat(0.08875):
            pl = 0.256;
            break;
        case parseFloat(0.09000):
            pl = 0.252;
            break;
        case parseFloat(0.09125):
            pl = 0.248;
            break;
        case parseFloat(0.09250):
            pl = 0.244;
            break;
        case parseFloat(0.09375):
            pl = 0.24;
            break;
        case parseFloat(0.09500):
            pl = 0.237;
            break;
        case parseFloat(0.09625):
            pl = 0.233;
            break;
        case parseFloat(0.09750):
            pl = 0.229;
            break;
        case parseFloat(0.09875):
            pl = 0.226;
            break;
        }
        break;
    case 65:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.542;
            break;
        case parseFloat(0.03125):
            pl = 0.542;
            break;
        case parseFloat(0.03250):
            pl = 0.54;
            break;
        case parseFloat(0.03375):
            pl = 0.532;
            break;
        case parseFloat(0.03500):
            pl = 0.523;
            break;
        case parseFloat(0.03625):
            pl = 0.515;
            break;
        case parseFloat(0.03750):
            pl = 0.506;
            break;
        case parseFloat(0.03875):
            pl = 0.498;
            break;
        case parseFloat(0.04000):
            pl = 0.49;
            break;
        case parseFloat(0.04125):
            pl = 0.482;
            break;
        case parseFloat(0.04250):
            pl = 0.474;
            break;
        case parseFloat(0.04375):
            pl = 0.467;
            break;
        case parseFloat(0.04500):
            pl = 0.459;
            break;
        case parseFloat(0.04625):
            pl = 0.452;
            break;
        case parseFloat(0.04750):
            pl = 0.444;
            break;
        case parseFloat(0.04875):
            pl = 0.437;
            break;
        case parseFloat(0.05000):
            pl = 0.43;
            break;
        case parseFloat(0.05125):
            pl = 0.423;
            break;
        case parseFloat(0.05250):
            pl = 0.417;
            break;
        case parseFloat(0.05375):
            pl = 0.41;
            break;
        case parseFloat(0.05500):
            pl = 0.403;
            break;
        case parseFloat(0.05625):
            pl = 0.397;
            break;
        case parseFloat(0.05750):
            pl = 0.391;
            break;
        case parseFloat(0.05875):
            pl = 0.384;
            break;
        case parseFloat(0.06000):
            pl = 0.378;
            break;
        case parseFloat(0.06125):
            pl = 0.372;
            break;
        case parseFloat(0.06250):
            pl = 0.366;
            break;
        case parseFloat(0.06375):
            pl = 0.361;
            break;
        case parseFloat(0.06500):
            pl = 0.355;
            break;
        case parseFloat(0.06625):
            pl = 0.349;
            break;
        case parseFloat(0.06750):
            pl = 0.344;
            break;
        case parseFloat(0.06875):
            pl = 0.338;
            break;
        case parseFloat(0.07000):
            pl = 0.333;
            break;
        case parseFloat(0.07125):
            pl = 0.328;
            break;
        case parseFloat(0.07250):
            pl = 0.323;
            break;
        case parseFloat(0.07375):
            pl = 0.318;
            break;
        case parseFloat(0.07500):
            pl = 0.313;
            break;
        case parseFloat(0.07625):
            pl = 0.308;
            break;
        case parseFloat(0.07750):
            pl = 0.303;
            break;
        case parseFloat(0.07875):
            pl = 0.298;
            break;
        case parseFloat(0.08000):
            pl = 0.294;
            break;
        case parseFloat(0.08125):
            pl = 0.289;
            break;
        case parseFloat(0.08250):
            pl = 0.285;
            break;
        case parseFloat(0.08375):
            pl = 0.28;
            break;
        case parseFloat(0.08500):
            pl = 0.276;
            break;
        case parseFloat(0.08625):
            pl = 0.272;
            break;
        case parseFloat(0.08750):
            pl = 0.267;
            break;
        case parseFloat(0.08875):
            pl = 0.263;
            break;
        case parseFloat(0.09000):
            pl = 0.259;
            break;
        case parseFloat(0.09125):
            pl = 0.255;
            break;
        case parseFloat(0.09250):
            pl = 0.251;
            break;
        case parseFloat(0.09375):
            pl = 0.247;
            break;
        case parseFloat(0.09500):
            pl = 0.244;
            break;
        case parseFloat(0.09625):
            pl = 0.24;
            break;
        case parseFloat(0.09750):
            pl = 0.236;
            break;
        case parseFloat(0.09875):
            pl = 0.233;
            break;
        }
        break;
    case 66:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.549;
            break;
        case parseFloat(0.03125):
            pl = 0.549;
            break;
        case parseFloat(0.03250):
            pl = 0.547;
            break;
        case parseFloat(0.03375):
            pl = 0.538;
            break;
        case parseFloat(0.03500):
            pl = 0.529;
            break;
        case parseFloat(0.03625):
            pl = 0.521;
            break;
        case parseFloat(0.03750):
            pl = 0.513;
            break;
        case parseFloat(0.03875):
            pl = 0.505;
            break;
        case parseFloat(0.04000):
            pl = 0.497;
            break;
        case parseFloat(0.04125):
            pl = 0.489;
            break;
        case parseFloat(0.04250):
            pl = 0.481;
            break;
        case parseFloat(0.04375):
            pl = 0.474;
            break;
        case parseFloat(0.04500):
            pl = 0.466;
            break;
        case parseFloat(0.04625):
            pl = 0.459;
            break;
        case parseFloat(0.04750):
            pl = 0.452;
            break;
        case parseFloat(0.04875):
            pl = 0.445;
            break;
        case parseFloat(0.05000):
            pl = 0.438;
            break;
        case parseFloat(0.05125):
            pl = 0.431;
            break;
        case parseFloat(0.05250):
            pl = 0.424;
            break;
        case parseFloat(0.05375):
            pl = 0.417;
            break;
        case parseFloat(0.05500):
            pl = 0.411;
            break;
        case parseFloat(0.05625):
            pl = 0.405;
            break;
        case parseFloat(0.05750):
            pl = 0.398;
            break;
        case parseFloat(0.05875):
            pl = 0.392;
            break;
        case parseFloat(0.06000):
            pl = 0.386;
            break;
        case parseFloat(0.06125):
            pl = 0.38;
            break;
        case parseFloat(0.06250):
            pl = 0.374;
            break;
        case parseFloat(0.06375):
            pl = 0.368;
            break;
        case parseFloat(0.06500):
            pl = 0.363;
            break;
        case parseFloat(0.06625):
            pl = 0.357;
            break;
        case parseFloat(0.06750):
            pl = 0.352;
            break;
        case parseFloat(0.06875):
            pl = 0.346;
            break;
        case parseFloat(0.07000):
            pl = 0.341;
            break;
        case parseFloat(0.07125):
            pl = 0.336;
            break;
        case parseFloat(0.07250):
            pl = 0.33;
            break;
        case parseFloat(0.07375):
            pl = 0.325;
            break;
        case parseFloat(0.07500):
            pl = 0.32;
            break;
        case parseFloat(0.07625):
            pl = 0.316;
            break;
        case parseFloat(0.07750):
            pl = 0.311;
            break;
        case parseFloat(0.07875):
            pl = 0.306;
            break;
        case parseFloat(0.08000):
            pl = 0.301;
            break;
        case parseFloat(0.08125):
            pl = 0.297;
            break;
        case parseFloat(0.08250):
            pl = 0.292;
            break;
        case parseFloat(0.08375):
            pl = 0.288;
            break;
        case parseFloat(0.08500):
            pl = 0.283;
            break;
        case parseFloat(0.08625):
            pl = 0.279;
            break;
        case parseFloat(0.08750):
            pl = 0.275;
            break;
        case parseFloat(0.08875):
            pl = 0.271;
            break;
        case parseFloat(0.09000):
            pl = 0.267;
            break;
        case parseFloat(0.09125):
            pl = 0.263;
            break;
        case parseFloat(0.09250):
            pl = 0.259;
            break;
        case parseFloat(0.09375):
            pl = 0.255;
            break;
        case parseFloat(0.09500):
            pl = 0.251;
            break;
        case parseFloat(0.09625):
            pl = 0.247;
            break;
        case parseFloat(0.09750):
            pl = 0.244;
            break;
        case parseFloat(0.09875):
            pl = 0.24;
            break;
        }
        break;
    case 67:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.556;
            break;
        case parseFloat(0.03125):
            pl = 0.556;
            break;
        case parseFloat(0.03250):
            pl = 0.553;
            break;
        case parseFloat(0.03375):
            pl = 0.545;
            break;
        case parseFloat(0.03500):
            pl = 0.536;
            break;
        case parseFloat(0.03625):
            pl = 0.528;
            break;
        case parseFloat(0.03750):
            pl = 0.52;
            break;
        case parseFloat(0.03875):
            pl = 0.512;
            break;
        case parseFloat(0.04000):
            pl = 0.504;
            break;
        case parseFloat(0.04125):
            pl = 0.496;
            break;
        case parseFloat(0.04250):
            pl = 0.488;
            break;
        case parseFloat(0.04375):
            pl = 0.481;
            break;
        case parseFloat(0.04500):
            pl = 0.473;
            break;
        case parseFloat(0.04625):
            pl = 0.466;
            break;
        case parseFloat(0.04750):
            pl = 0.459;
            break;
        case parseFloat(0.04875):
            pl = 0.452;
            break;
        case parseFloat(0.05000):
            pl = 0.445;
            break;
        case parseFloat(0.05125):
            pl = 0.438;
            break;
        case parseFloat(0.05250):
            pl = 0.432;
            break;
        case parseFloat(0.05375):
            pl = 0.425;
            break;
        case parseFloat(0.05500):
            pl = 0.419;
            break;
        case parseFloat(0.05625):
            pl = 0.412;
            break;
        case parseFloat(0.05750):
            pl = 0.406;
            break;
        case parseFloat(0.05875):
            pl = 0.4;
            break;
        case parseFloat(0.06000):
            pl = 0.394;
            break;
        case parseFloat(0.06125):
            pl = 0.388;
            break;
        case parseFloat(0.06250):
            pl = 0.382;
            break;
        case parseFloat(0.06375):
            pl = 0.376;
            break;
        case parseFloat(0.06500):
            pl = 0.37;
            break;
        case parseFloat(0.06625):
            pl = 0.365;
            break;
        case parseFloat(0.06750):
            pl = 0.359;
            break;
        case parseFloat(0.06875):
            pl = 0.354;
            break;
        case parseFloat(0.07000):
            pl = 0.349;
            break;
        case parseFloat(0.07125):
            pl = 0.343;
            break;
        case parseFloat(0.07250):
            pl = 0.338;
            break;
        case parseFloat(0.07375):
            pl = 0.333;
            break;
        case parseFloat(0.07500):
            pl = 0.328;
            break;
        case parseFloat(0.07625):
            pl = 0.323;
            break;
        case parseFloat(0.07750):
            pl = 0.319;
            break;
        case parseFloat(0.07875):
            pl = 0.314;
            break;
        case parseFloat(0.08000):
            pl = 0.309;
            break;
        case parseFloat(0.08125):
            pl = 0.305;
            break;
        case parseFloat(0.08250):
            pl = 0.3;
            break;
        case parseFloat(0.08375):
            pl = 0.296;
            break;
        case parseFloat(0.08500):
            pl = 0.291;
            break;
        case parseFloat(0.08625):
            pl = 0.287;
            break;
        case parseFloat(0.08750):
            pl = 0.283;
            break;
        case parseFloat(0.08875):
            pl = 0.279;
            break;
        case parseFloat(0.09000):
            pl = 0.274;
            break;
        case parseFloat(0.09125):
            pl = 0.27;
            break;
        case parseFloat(0.09250):
            pl = 0.266;
            break;
        case parseFloat(0.09375):
            pl = 0.262;
            break;
        case parseFloat(0.09500):
            pl = 0.259;
            break;
        case parseFloat(0.09625):
            pl = 0.255;
            break;
        case parseFloat(0.09750):
            pl = 0.251;
            break;
        case parseFloat(0.09875):
            pl = 0.247;
            break;
        }
        break;
    case 68:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.562;
            break;
        case parseFloat(0.03125):
            pl = 0.562;
            break;
        case parseFloat(0.03250):
            pl = 0.56;
            break;
        case parseFloat(0.03375):
            pl = 0.551;
            break;
        case parseFloat(0.03500):
            pl = 0.543;
            break;
        case parseFloat(0.03625):
            pl = 0.535;
            break;
        case parseFloat(0.03750):
            pl = 0.527;
            break;
        case parseFloat(0.03875):
            pl = 0.519;
            break;
        case parseFloat(0.04000):
            pl = 0.511;
            break;
        case parseFloat(0.04125):
            pl = 0.503;
            break;
        case parseFloat(0.04250):
            pl = 0.496;
            break;
        case parseFloat(0.04375):
            pl = 0.488;
            break;
        case parseFloat(0.04500):
            pl = 0.481;
            break;
        case parseFloat(0.04625):
            pl = 0.474;
            break;
        case parseFloat(0.04750):
            pl = 0.467;
            break;
        case parseFloat(0.04875):
            pl = 0.46;
            break;
        case parseFloat(0.05000):
            pl = 0.453;
            break;
        case parseFloat(0.05125):
            pl = 0.446;
            break;
        case parseFloat(0.05250):
            pl = 0.439;
            break;
        case parseFloat(0.05375):
            pl = 0.433;
            break;
        case parseFloat(0.05500):
            pl = 0.426;
            break;
        case parseFloat(0.05625):
            pl = 0.42;
            break;
        case parseFloat(0.05750):
            pl = 0.414;
            break;
        case parseFloat(0.05875):
            pl = 0.408;
            break;
        case parseFloat(0.06000):
            pl = 0.402;
            break;
        case parseFloat(0.06125):
            pl = 0.396;
            break;
        case parseFloat(0.06250):
            pl = 0.39;
            break;
        case parseFloat(0.06375):
            pl = 0.384;
            break;
        case parseFloat(0.06500):
            pl = 0.379;
            break;
        case parseFloat(0.06625):
            pl = 0.373;
            break;
        case parseFloat(0.06750):
            pl = 0.368;
            break;
        case parseFloat(0.06875):
            pl = 0.362;
            break;
        case parseFloat(0.07000):
            pl = 0.357;
            break;
        case parseFloat(0.07125):
            pl = 0.352;
            break;
        case parseFloat(0.07250):
            pl = 0.346;
            break;
        case parseFloat(0.07375):
            pl = 0.341;
            break;
        case parseFloat(0.07500):
            pl = 0.336;
            break;
        case parseFloat(0.07625):
            pl = 0.332;
            break;
        case parseFloat(0.07750):
            pl = 0.327;
            break;
        case parseFloat(0.07875):
            pl = 0.322;
            break;
        case parseFloat(0.08000):
            pl = 0.317;
            break;
        case parseFloat(0.08125):
            pl = 0.313;
            break;
        case parseFloat(0.08250):
            pl = 0.308;
            break;
        case parseFloat(0.08375):
            pl = 0.304;
            break;
        case parseFloat(0.08500):
            pl = 0.299;
            break;
        case parseFloat(0.08625):
            pl = 0.295;
            break;
        case parseFloat(0.08750):
            pl = 0.291;
            break;
        case parseFloat(0.08875):
            pl = 0.287;
            break;
        case parseFloat(0.09000):
            pl = 0.282;
            break;
        case parseFloat(0.09125):
            pl = 0.278;
            break;
        case parseFloat(0.09250):
            pl = 0.274;
            break;
        case parseFloat(0.09375):
            pl = 0.271;
            break;
        case parseFloat(0.09500):
            pl = 0.267;
            break;
        case parseFloat(0.09625):
            pl = 0.263;
            break;
        case parseFloat(0.09750):
            pl = 0.259;
            break;
        case parseFloat(0.09875):
            pl = 0.255;
            break;
        }
        break;
    case 69:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.569;
            break;
        case parseFloat(0.03125):
            pl = 0.569;
            break;
        case parseFloat(0.03250):
            pl = 0.566;
            break;
        case parseFloat(0.03375):
            pl = 0.558;
            break;
        case parseFloat(0.03500):
            pl = 0.55;
            break;
        case parseFloat(0.03625):
            pl = 0.542;
            break;
        case parseFloat(0.03750):
            pl = 0.534;
            break;
        case parseFloat(0.03875):
            pl = 0.526;
            break;
        case parseFloat(0.04000):
            pl = 0.518;
            break;
        case parseFloat(0.04125):
            pl = 0.51;
            break;
        case parseFloat(0.04250):
            pl = 0.503;
            break;
        case parseFloat(0.04375):
            pl = 0.496;
            break;
        case parseFloat(0.04500):
            pl = 0.488;
            break;
        case parseFloat(0.04625):
            pl = 0.481;
            break;
        case parseFloat(0.04750):
            pl = 0.474;
            break;
        case parseFloat(0.04875):
            pl = 0.467;
            break;
        case parseFloat(0.05000):
            pl = 0.461;
            break;
        case parseFloat(0.05125):
            pl = 0.454;
            break;
        case parseFloat(0.05250):
            pl = 0.447;
            break;
        case parseFloat(0.05375):
            pl = 0.441;
            break;
        case parseFloat(0.05500):
            pl = 0.434;
            break;
        case parseFloat(0.05625):
            pl = 0.428;
            break;
        case parseFloat(0.05750):
            pl = 0.422;
            break;
        case parseFloat(0.05875):
            pl = 0.416;
            break;
        case parseFloat(0.06000):
            pl = 0.41;
            break;
        case parseFloat(0.06125):
            pl = 0.404;
            break;
        case parseFloat(0.06250):
            pl = 0.398;
            break;
        case parseFloat(0.06375):
            pl = 0.392;
            break;
        case parseFloat(0.06500):
            pl = 0.387;
            break;
        case parseFloat(0.06625):
            pl = 0.381;
            break;
        case parseFloat(0.06750):
            pl = 0.376;
            break;
        case parseFloat(0.06875):
            pl = 0.37;
            break;
        case parseFloat(0.07000):
            pl = 0.365;
            break;
        case parseFloat(0.07125):
            pl = 0.36;
            break;
        case parseFloat(0.07250):
            pl = 0.355;
            break;
        case parseFloat(0.07375):
            pl = 0.35;
            break;
        case parseFloat(0.07500):
            pl = 0.345;
            break;
        case parseFloat(0.07625):
            pl = 0.34;
            break;
        case parseFloat(0.07750):
            pl = 0.335;
            break;
        case parseFloat(0.07875):
            pl = 0.33;
            break;
        case parseFloat(0.08000):
            pl = 0.326;
            break;
        case parseFloat(0.08125):
            pl = 0.321;
            break;
        case parseFloat(0.08250):
            pl = 0.317;
            break;
        case parseFloat(0.08375):
            pl = 0.312;
            break;
        case parseFloat(0.08500):
            pl = 0.308;
            break;
        case parseFloat(0.08625):
            pl = 0.303;
            break;
        case parseFloat(0.08750):
            pl = 0.299;
            break;
        case parseFloat(0.08875):
            pl = 0.295;
            break;
        case parseFloat(0.09000):
            pl = 0.291;
            break;
        case parseFloat(0.09125):
            pl = 0.287;
            break;
        case parseFloat(0.09250):
            pl = 0.283;
            break;
        case parseFloat(0.09375):
            pl = 0.279;
            break;
        case parseFloat(0.09500):
            pl = 0.275;
            break;
        case parseFloat(0.09625):
            pl = 0.271;
            break;
        case parseFloat(0.09750):
            pl = 0.267;
            break;
        case parseFloat(0.09875):
            pl = 0.264;
            break;
        }
        break;
    case 70:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.576;
            break;
        case parseFloat(0.03125):
            pl = 0.576;
            break;
        case parseFloat(0.03250):
            pl = 0.57;
            break;
        case parseFloat(0.03375):
            pl = 0.562;
            break;
        case parseFloat(0.03500):
            pl = 0.554;
            break;
        case parseFloat(0.03625):
            pl = 0.546;
            break;
        case parseFloat(0.03750):
            pl = 0.538;
            break;
        case parseFloat(0.03875):
            pl = 0.53;
            break;
        case parseFloat(0.04000):
            pl = 0.522;
            break;
        case parseFloat(0.04125):
            pl = 0.515;
            break;
        case parseFloat(0.04250):
            pl = 0.507;
            break;
        case parseFloat(0.04375):
            pl = 0.5;
            break;
        case parseFloat(0.04500):
            pl = 0.493;
            break;
        case parseFloat(0.04625):
            pl = 0.486;
            break;
        case parseFloat(0.04750):
            pl = 0.479;
            break;
        case parseFloat(0.04875):
            pl = 0.472;
            break;
        case parseFloat(0.05000):
            pl = 0.465;
            break;
        case parseFloat(0.05125):
            pl = 0.458;
            break;
        case parseFloat(0.05250):
            pl = 0.452;
            break;
        case parseFloat(0.05375):
            pl = 0.445;
            break;
        case parseFloat(0.05500):
            pl = 0.439;
            break;
        case parseFloat(0.05625):
            pl = 0.433;
            break;
        case parseFloat(0.05750):
            pl = 0.427;
            break;
        case parseFloat(0.05875):
            pl = 0.42;
            break;
        case parseFloat(0.06000):
            pl = 0.415;
            break;
        case parseFloat(0.06125):
            pl = 0.409;
            break;
        case parseFloat(0.06250):
            pl = 0.403;
            break;
        case parseFloat(0.06375):
            pl = 0.397;
            break;
        case parseFloat(0.06500):
            pl = 0.392;
            break;
        case parseFloat(0.06625):
            pl = 0.386;
            break;
        case parseFloat(0.06750):
            pl = 0.381;
            break;
        case parseFloat(0.06875):
            pl = 0.375;
            break;
        case parseFloat(0.07000):
            pl = 0.37;
            break;
        case parseFloat(0.07125):
            pl = 0.365;
            break;
        case parseFloat(0.07250):
            pl = 0.36;
            break;
        case parseFloat(0.07375):
            pl = 0.355;
            break;
        case parseFloat(0.07500):
            pl = 0.35;
            break;
        case parseFloat(0.07625):
            pl = 0.345;
            break;
        case parseFloat(0.07750):
            pl = 0.34;
            break;
        case parseFloat(0.07875):
            pl = 0.335;
            break;
        case parseFloat(0.08000):
            pl = 0.33;
            break;
        case parseFloat(0.08125):
            pl = 0.326;
            break;
        case parseFloat(0.08250):
            pl = 0.321;
            break;
        case parseFloat(0.08375):
            pl = 0.317;
            break;
        case parseFloat(0.08500):
            pl = 0.312;
            break;
        case parseFloat(0.08625):
            pl = 0.308;
            break;
        case parseFloat(0.08750):
            pl = 0.304;
            break;
        case parseFloat(0.08875):
            pl = 0.3;
            break;
        case parseFloat(0.09000):
            pl = 0.296;
            break;
        case parseFloat(0.09125):
            pl = 0.291;
            break;
        case parseFloat(0.09250):
            pl = 0.287;
            break;
        case parseFloat(0.09375):
            pl = 0.284;
            break;
        case parseFloat(0.09500):
            pl = 0.28;
            break;
        case parseFloat(0.09625):
            pl = 0.276;
            break;
        case parseFloat(0.09750):
            pl = 0.272;
            break;
        case parseFloat(0.09875):
            pl = 0.268;
            break;
        }
        break;
    case 71:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.583;
            break;
        case parseFloat(0.03125):
            pl = 0.578;
            break;
        case parseFloat(0.03250):
            pl = 0.57;
            break;
        case parseFloat(0.03375):
            pl = 0.562;
            break;
        case parseFloat(0.03500):
            pl = 0.554;
            break;
        case parseFloat(0.03625):
            pl = 0.546;
            break;
        case parseFloat(0.03750):
            pl = 0.538;
            break;
        case parseFloat(0.03875):
            pl = 0.53;
            break;
        case parseFloat(0.04000):
            pl = 0.522;
            break;
        case parseFloat(0.04125):
            pl = 0.515;
            break;
        case parseFloat(0.04250):
            pl = 0.507;
            break;
        case parseFloat(0.04375):
            pl = 0.5;
            break;
        case parseFloat(0.04500):
            pl = 0.493;
            break;
        case parseFloat(0.04625):
            pl = 0.486;
            break;
        case parseFloat(0.04750):
            pl = 0.479;
            break;
        case parseFloat(0.04875):
            pl = 0.472;
            break;
        case parseFloat(0.05000):
            pl = 0.465;
            break;
        case parseFloat(0.05125):
            pl = 0.458;
            break;
        case parseFloat(0.05250):
            pl = 0.452;
            break;
        case parseFloat(0.05375):
            pl = 0.445;
            break;
        case parseFloat(0.05500):
            pl = 0.439;
            break;
        case parseFloat(0.05625):
            pl = 0.433;
            break;
        case parseFloat(0.05750):
            pl = 0.427;
            break;
        case parseFloat(0.05875):
            pl = 0.421;
            break;
        case parseFloat(0.06000):
            pl = 0.415;
            break;
        case parseFloat(0.06125):
            pl = 0.409;
            break;
        case parseFloat(0.06250):
            pl = 0.403;
            break;
        case parseFloat(0.06375):
            pl = 0.397;
            break;
        case parseFloat(0.06500):
            pl = 0.392;
            break;
        case parseFloat(0.06625):
            pl = 0.386;
            break;
        case parseFloat(0.06750):
            pl = 0.381;
            break;
        case parseFloat(0.06875):
            pl = 0.375;
            break;
        case parseFloat(0.07000):
            pl = 0.37;
            break;
        case parseFloat(0.07125):
            pl = 0.365;
            break;
        case parseFloat(0.07250):
            pl = 0.36;
            break;
        case parseFloat(0.07375):
            pl = 0.355;
            break;
        case parseFloat(0.07500):
            pl = 0.35;
            break;
        case parseFloat(0.07625):
            pl = 0.345;
            break;
        case parseFloat(0.07750):
            pl = 0.34;
            break;
        case parseFloat(0.07875):
            pl = 0.335;
            break;
        case parseFloat(0.08000):
            pl = 0.331;
            break;
        case parseFloat(0.08125):
            pl = 0.326;
            break;
        case parseFloat(0.08250):
            pl = 0.321;
            break;
        case parseFloat(0.08375):
            pl = 0.317;
            break;
        case parseFloat(0.08500):
            pl = 0.313;
            break;
        case parseFloat(0.08625):
            pl = 0.308;
            break;
        case parseFloat(0.08750):
            pl = 0.304;
            break;
        case parseFloat(0.08875):
            pl = 0.3;
            break;
        case parseFloat(0.09000):
            pl = 0.296;
            break;
        case parseFloat(0.09125):
            pl = 0.292;
            break;
        case parseFloat(0.09250):
            pl = 0.288;
            break;
        case parseFloat(0.09375):
            pl = 0.284;
            break;
        case parseFloat(0.09500):
            pl = 0.28;
            break;
        case parseFloat(0.09625):
            pl = 0.276;
            break;
        case parseFloat(0.09750):
            pl = 0.272;
            break;
        case parseFloat(0.09875):
            pl = 0.268;
            break;
        }
        break;
    case 72:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.588;
            break;
        case parseFloat(0.03125):
            pl = 0.58;
            break;
        case parseFloat(0.03250):
            pl = 0.572;
            break;
        case parseFloat(0.03375):
            pl = 0.563;
            break;
        case parseFloat(0.03500):
            pl = 0.555;
            break;
        case parseFloat(0.03625):
            pl = 0.547;
            break;
        case parseFloat(0.03750):
            pl = 0.539;
            break;
        case parseFloat(0.03875):
            pl = 0.531;
            break;
        case parseFloat(0.04000):
            pl = 0.524;
            break;
        case parseFloat(0.04125):
            pl = 0.516;
            break;
        case parseFloat(0.04250):
            pl = 0.509;
            break;
        case parseFloat(0.04375):
            pl = 0.502;
            break;
        case parseFloat(0.04500):
            pl = 0.494;
            break;
        case parseFloat(0.04625):
            pl = 0.487;
            break;
        case parseFloat(0.04750):
            pl = 0.48;
            break;
        case parseFloat(0.04875):
            pl = 0.474;
            break;
        case parseFloat(0.05000):
            pl = 0.467;
            break;
        case parseFloat(0.05125):
            pl = 0.46;
            break;
        case parseFloat(0.05250):
            pl = 0.454;
            break;
        case parseFloat(0.05375):
            pl = 0.447;
            break;
        case parseFloat(0.05500):
            pl = 0.441;
            break;
        case parseFloat(0.05625):
            pl = 0.435;
            break;
        case parseFloat(0.05750):
            pl = 0.428;
            break;
        case parseFloat(0.05875):
            pl = 0.422;
            break;
        case parseFloat(0.06000):
            pl = 0.416;
            break;
        case parseFloat(0.06125):
            pl = 0.411;
            break;
        case parseFloat(0.06250):
            pl = 0.405;
            break;
        case parseFloat(0.06375):
            pl = 0.399;
            break;
        case parseFloat(0.06500):
            pl = 0.393;
            break;
        case parseFloat(0.06625):
            pl = 0.388;
            break;
        case parseFloat(0.06750):
            pl = 0.383;
            break;
        case parseFloat(0.06875):
            pl = 0.377;
            break;
        case parseFloat(0.07000):
            pl = 0.372;
            break;
        case parseFloat(0.07125):
            pl = 0.367;
            break;
        case parseFloat(0.07250):
            pl = 0.362;
            break;
        case parseFloat(0.07375):
            pl = 0.357;
            break;
        case parseFloat(0.07500):
            pl = 0.352;
            break;
        case parseFloat(0.07625):
            pl = 0.347;
            break;
        case parseFloat(0.07750):
            pl = 0.342;
            break;
        case parseFloat(0.07875):
            pl = 0.337;
            break;
        case parseFloat(0.08000):
            pl = 0.332;
            break;
        case parseFloat(0.08125):
            pl = 0.328;
            break;
        case parseFloat(0.08250):
            pl = 0.323;
            break;
        case parseFloat(0.08375):
            pl = 0.319;
            break;
        case parseFloat(0.08500):
            pl = 0.314;
            break;
        case parseFloat(0.08625):
            pl = 0.31;
            break;
        case parseFloat(0.08750):
            pl = 0.306;
            break;
        case parseFloat(0.08875):
            pl = 0.302;
            break;
        case parseFloat(0.09000):
            pl = 0.298;
            break;
        case parseFloat(0.09125):
            pl = 0.293;
            break;
        case parseFloat(0.09250):
            pl = 0.289;
            break;
        case parseFloat(0.09375):
            pl = 0.285;
            break;
        case parseFloat(0.09500):
            pl = 0.282;
            break;
        case parseFloat(0.09625):
            pl = 0.278;
            break;
        case parseFloat(0.09750):
            pl = 0.274;
            break;
        case parseFloat(0.09875):
            pl = 0.27;
            break;
        }
        break;
    case 73:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.595;
            break;
        case parseFloat(0.03125):
            pl = 0.587;
            break;
        case parseFloat(0.03250):
            pl = 0.579;
            break;
        case parseFloat(0.03375):
            pl = 0.57;
            break;
        case parseFloat(0.03500):
            pl = 0.562;
            break;
        case parseFloat(0.03625):
            pl = 0.555;
            break;
        case parseFloat(0.03750):
            pl = 0.547;
            break;
        case parseFloat(0.03875):
            pl = 0.539;
            break;
        case parseFloat(0.04000):
            pl = 0.532;
            break;
        case parseFloat(0.04125):
            pl = 0.524;
            break;
        case parseFloat(0.04250):
            pl = 0.517;
            break;
        case parseFloat(0.04375):
            pl = 0.51;
            break;
        case parseFloat(0.04500):
            pl = 0.503;
            break;
        case parseFloat(0.04625):
            pl = 0.496;
            break;
        case parseFloat(0.04750):
            pl = 0.489;
            break;
        case parseFloat(0.04875):
            pl = 0.482;
            break;
        case parseFloat(0.05000):
            pl = 0.475;
            break;
        case parseFloat(0.05125):
            pl = 0.469;
            break;
        case parseFloat(0.05250):
            pl = 0.462;
            break;
        case parseFloat(0.05375):
            pl = 0.456;
            break;
        case parseFloat(0.05500):
            pl = 0.449;
            break;
        case parseFloat(0.05625):
            pl = 0.443;
            break;
        case parseFloat(0.05750):
            pl = 0.437;
            break;
        case parseFloat(0.05875):
            pl = 0.431;
            break;
        case parseFloat(0.06000):
            pl = 0.425;
            break;
        case parseFloat(0.06125):
            pl = 0.419;
            break;
        case parseFloat(0.06250):
            pl = 0.414;
            break;
        case parseFloat(0.06375):
            pl = 0.408;
            break;
        case parseFloat(0.06500):
            pl = 0.402;
            break;
        case parseFloat(0.06625):
            pl = 0.397;
            break;
        case parseFloat(0.06750):
            pl = 0.392;
            break;
        case parseFloat(0.06875):
            pl = 0.386;
            break;
        case parseFloat(0.07000):
            pl = 0.381;
            break;
        case parseFloat(0.07125):
            pl = 0.376;
            break;
        case parseFloat(0.07250):
            pl = 0.371;
            break;
        case parseFloat(0.07375):
            pl = 0.366;
            break;
        case parseFloat(0.07500):
            pl = 0.361;
            break;
        case parseFloat(0.07625):
            pl = 0.356;
            break;
        case parseFloat(0.07750):
            pl = 0.351;
            break;
        case parseFloat(0.07875):
            pl = 0.346;
            break;
        case parseFloat(0.08000):
            pl = 0.342;
            break;
        case parseFloat(0.08125):
            pl = 0.337;
            break;
        case parseFloat(0.08250):
            pl = 0.332;
            break;
        case parseFloat(0.08375):
            pl = 0.328;
            break;
        case parseFloat(0.08500):
            pl = 0.324;
            break;
        case parseFloat(0.08625):
            pl = 0.319;
            break;
        case parseFloat(0.08750):
            pl = 0.315;
            break;
        case parseFloat(0.08875):
            pl = 0.311;
            break;
        case parseFloat(0.09000):
            pl = 0.307;
            break;
        case parseFloat(0.09125):
            pl = 0.303;
            break;
        case parseFloat(0.09250):
            pl = 0.299;
            break;
        case parseFloat(0.09375):
            pl = 0.295;
            break;
        case parseFloat(0.09500):
            pl = 0.291;
            break;
        case parseFloat(0.09625):
            pl = 0.287;
            break;
        case parseFloat(0.09750):
            pl = 0.283;
            break;
        case parseFloat(0.09875):
            pl = 0.279;
            break;
        }
        break;
    case 74:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.602;
            break;
        case parseFloat(0.03125):
            pl = 0.593;
            break;
        case parseFloat(0.03250):
            pl = 0.585;
            break;
        case parseFloat(0.03375):
            pl = 0.577;
            break;
        case parseFloat(0.03500):
            pl = 0.569;
            break;
        case parseFloat(0.03625):
            pl = 0.561;
            break;
        case parseFloat(0.03750):
            pl = 0.554;
            break;
        case parseFloat(0.03875):
            pl = 0.546;
            break;
        case parseFloat(0.04000):
            pl = 0.539;
            break;
        case parseFloat(0.04125):
            pl = 0.531;
            break;
        case parseFloat(0.04250):
            pl = 0.524;
            break;
        case parseFloat(0.04375):
            pl = 0.517;
            break;
        case parseFloat(0.04500):
            pl = 0.51;
            break;
        case parseFloat(0.04625):
            pl = 0.503;
            break;
        case parseFloat(0.04750):
            pl = 0.496;
            break;
        case parseFloat(0.04875):
            pl = 0.49;
            break;
        case parseFloat(0.05000):
            pl = 0.483;
            break;
        case parseFloat(0.05125):
            pl = 0.477;
            break;
        case parseFloat(0.05250):
            pl = 0.47;
            break;
        case parseFloat(0.05375):
            pl = 0.464;
            break;
        case parseFloat(0.05500):
            pl = 0.458;
            break;
        case parseFloat(0.05625):
            pl = 0.451;
            break;
        case parseFloat(0.05750):
            pl = 0.445;
            break;
        case parseFloat(0.05875):
            pl = 0.439;
            break;
        case parseFloat(0.06000):
            pl = 0.434;
            break;
        case parseFloat(0.06125):
            pl = 0.428;
            break;
        case parseFloat(0.06250):
            pl = 0.422;
            break;
        case parseFloat(0.06375):
            pl = 0.416;
            break;
        case parseFloat(0.06500):
            pl = 0.411;
            break;
        case parseFloat(0.06625):
            pl = 0.405;
            break;
        case parseFloat(0.06750):
            pl = 0.4;
            break;
        case parseFloat(0.06875):
            pl = 0.395;
            break;
        case parseFloat(0.07000):
            pl = 0.39;
            break;
        case parseFloat(0.07125):
            pl = 0.384;
            break;
        case parseFloat(0.07250):
            pl = 0.379;
            break;
        case parseFloat(0.07375):
            pl = 0.374;
            break;
        case parseFloat(0.07500):
            pl = 0.369;
            break;
        case parseFloat(0.07625):
            pl = 0.364;
            break;
        case parseFloat(0.07750):
            pl = 0.36;
            break;
        case parseFloat(0.07875):
            pl = 0.355;
            break;
        case parseFloat(0.08000):
            pl = 0.35;
            break;
        case parseFloat(0.08125):
            pl = 0.346;
            break;
        case parseFloat(0.08250):
            pl = 0.341;
            break;
        case parseFloat(0.08375):
            pl = 0.337;
            break;
        case parseFloat(0.08500):
            pl = 0.332;
            break;
        case parseFloat(0.08625):
            pl = 0.328;
            break;
        case parseFloat(0.08750):
            pl = 0.324;
            break;
        case parseFloat(0.08875):
            pl = 0.32;
            break;
        case parseFloat(0.09000):
            pl = 0.315;
            break;
        case parseFloat(0.09125):
            pl = 0.311;
            break;
        case parseFloat(0.09250):
            pl = 0.307;
            break;
        case parseFloat(0.09375):
            pl = 0.303;
            break;
        case parseFloat(0.09500):
            pl = 0.299;
            break;
        case parseFloat(0.09625):
            pl = 0.295;
            break;
        case parseFloat(0.09750):
            pl = 0.292;
            break;
        case parseFloat(0.09875):
            pl = 0.288;
            break;
        }
        break;
    case 75:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.609;
            break;
        case parseFloat(0.03125):
            pl = 0.601;
            break;
        case parseFloat(0.03250):
            pl = 0.593;
            break;
        case parseFloat(0.03375):
            pl = 0.585;
            break;
        case parseFloat(0.03500):
            pl = 0.577;
            break;
        case parseFloat(0.03625):
            pl = 0.569;
            break;
        case parseFloat(0.03750):
            pl = 0.562;
            break;
        case parseFloat(0.03875):
            pl = 0.555;
            break;
        case parseFloat(0.04000):
            pl = 0.547;
            break;
        case parseFloat(0.04125):
            pl = 0.54;
            break;
        case parseFloat(0.04250):
            pl = 0.533;
            break;
        case parseFloat(0.04375):
            pl = 0.526;
            break;
        case parseFloat(0.04500):
            pl = 0.519;
            break;
        case parseFloat(0.04625):
            pl = 0.512;
            break;
        case parseFloat(0.04750):
            pl = 0.505;
            break;
        case parseFloat(0.04875):
            pl = 0.499;
            break;
        case parseFloat(0.05000):
            pl = 0.492;
            break;
        case parseFloat(0.05125):
            pl = 0.486;
            break;
        case parseFloat(0.05250):
            pl = 0.479;
            break;
        case parseFloat(0.05375):
            pl = 0.473;
            break;
        case parseFloat(0.05500):
            pl = 0.467;
            break;
        case parseFloat(0.05625):
            pl = 0.461;
            break;
        case parseFloat(0.05750):
            pl = 0.455;
            break;
        case parseFloat(0.05875):
            pl = 0.449;
            break;
        case parseFloat(0.06000):
            pl = 0.443;
            break;
        case parseFloat(0.06125):
            pl = 0.438;
            break;
        case parseFloat(0.06250):
            pl = 0.432;
            break;
        case parseFloat(0.06375):
            pl = 0.426;
            break;
        case parseFloat(0.06500):
            pl = 0.421;
            break;
        case parseFloat(0.06625):
            pl = 0.415;
            break;
        case parseFloat(0.06750):
            pl = 0.41;
            break;
        case parseFloat(0.06875):
            pl = 0.405;
            break;
        case parseFloat(0.07000):
            pl = 0.4;
            break;
        case parseFloat(0.07125):
            pl = 0.394;
            break;
        case parseFloat(0.07250):
            pl = 0.389;
            break;
        case parseFloat(0.07375):
            pl = 0.384;
            break;
        case parseFloat(0.07500):
            pl = 0.379;
            break;
        case parseFloat(0.07625):
            pl = 0.375;
            break;
        case parseFloat(0.07750):
            pl = 0.37;
            break;
        case parseFloat(0.07875):
            pl = 0.365;
            break;
        case parseFloat(0.08000):
            pl = 0.36;
            break;
        case parseFloat(0.08125):
            pl = 0.356;
            break;
        case parseFloat(0.08250):
            pl = 0.351;
            break;
        case parseFloat(0.08375):
            pl = 0.347;
            break;
        case parseFloat(0.08500):
            pl = 0.343;
            break;
        case parseFloat(0.08625):
            pl = 0.338;
            break;
        case parseFloat(0.08750):
            pl = 0.334;
            break;
        case parseFloat(0.08875):
            pl = 0.33;
            break;
        case parseFloat(0.09000):
            pl = 0.326;
            break;
        case parseFloat(0.09125):
            pl = 0.321;
            break;
        case parseFloat(0.09250):
            pl = 0.317;
            break;
        case parseFloat(0.09375):
            pl = 0.313;
            break;
        case parseFloat(0.09500):
            pl = 0.31;
            break;
        case parseFloat(0.09625):
            pl = 0.306;
            break;
        case parseFloat(0.09750):
            pl = 0.302;
            break;
        case parseFloat(0.09875):
            pl = 0.298;
            break;
        }
        break;
    case 76:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.614;
            break;
        case parseFloat(0.03125):
            pl = 0.606;
            break;
        case parseFloat(0.03250):
            pl = 0.598;
            break;
        case parseFloat(0.03375):
            pl = 0.59;
            break;
        case parseFloat(0.03500):
            pl = 0.582;
            break;
        case parseFloat(0.03625):
            pl = 0.575;
            break;
        case parseFloat(0.03750):
            pl = 0.567;
            break;
        case parseFloat(0.03875):
            pl = 0.56;
            break;
        case parseFloat(0.04000):
            pl = 0.553;
            break;
        case parseFloat(0.04125):
            pl = 0.546;
            break;
        case parseFloat(0.04250):
            pl = 0.539;
            break;
        case parseFloat(0.04375):
            pl = 0.532;
            break;
        case parseFloat(0.04500):
            pl = 0.525;
            break;
        case parseFloat(0.04625):
            pl = 0.518;
            break;
        case parseFloat(0.04750):
            pl = 0.511;
            break;
        case parseFloat(0.04875):
            pl = 0.505;
            break;
        case parseFloat(0.05000):
            pl = 0.498;
            break;
        case parseFloat(0.05125):
            pl = 0.492;
            break;
        case parseFloat(0.05250):
            pl = 0.486;
            break;
        case parseFloat(0.05375):
            pl = 0.479;
            break;
        case parseFloat(0.05500):
            pl = 0.473;
            break;
        case parseFloat(0.05625):
            pl = 0.467;
            break;
        case parseFloat(0.05750):
            pl = 0.461;
            break;
        case parseFloat(0.05875):
            pl = 0.455;
            break;
        case parseFloat(0.06000):
            pl = 0.45;
            break;
        case parseFloat(0.06125):
            pl = 0.444;
            break;
        case parseFloat(0.06250):
            pl = 0.438;
            break;
        case parseFloat(0.06375):
            pl = 0.433;
            break;
        case parseFloat(0.06500):
            pl = 0.427;
            break;
        case parseFloat(0.06625):
            pl = 0.422;
            break;
        case parseFloat(0.06750):
            pl = 0.417;
            break;
        case parseFloat(0.06875):
            pl = 0.411;
            break;
        case parseFloat(0.07000):
            pl = 0.406;
            break;
        case parseFloat(0.07125):
            pl = 0.401;
            break;
        case parseFloat(0.07250):
            pl = 0.396;
            break;
        case parseFloat(0.07375):
            pl = 0.391;
            break;
        case parseFloat(0.07500):
            pl = 0.386;
            break;
        case parseFloat(0.07625):
            pl = 0.381;
            break;
        case parseFloat(0.07750):
            pl = 0.377;
            break;
        case parseFloat(0.07875):
            pl = 0.372;
            break;
        case parseFloat(0.08000):
            pl = 0.367;
            break;
        case parseFloat(0.08125):
            pl = 0.363;
            break;
        case parseFloat(0.08250):
            pl = 0.358;
            break;
        case parseFloat(0.08375):
            pl = 0.354;
            break;
        case parseFloat(0.08500):
            pl = 0.349;
            break;
        case parseFloat(0.08625):
            pl = 0.345;
            break;
        case parseFloat(0.08750):
            pl = 0.341;
            break;
        case parseFloat(0.08875):
            pl = 0.337;
            break;
        case parseFloat(0.09000):
            pl = 0.332;
            break;
        case parseFloat(0.09125):
            pl = 0.328;
            break;
        case parseFloat(0.09250):
            pl = 0.324;
            break;
        case parseFloat(0.09375):
            pl = 0.32;
            break;
        case parseFloat(0.09500):
            pl = 0.316;
            break;
        case parseFloat(0.09625):
            pl = 0.312;
            break;
        case parseFloat(0.09750):
            pl = 0.309;
            break;
        case parseFloat(0.09875):
            pl = 0.305;
            break;
        }
        break;
    case 77:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.621;
            break;
        case parseFloat(0.03125):
            pl = 0.613;
            break;
        case parseFloat(0.03250):
            pl = 0.606;
            break;
        case parseFloat(0.03375):
            pl = 0.598;
            break;
        case parseFloat(0.03500):
            pl = 0.591;
            break;
        case parseFloat(0.03625):
            pl = 0.583;
            break;
        case parseFloat(0.03750):
            pl = 0.576;
            break;
        case parseFloat(0.03875):
            pl = 0.569;
            break;
        case parseFloat(0.04000):
            pl = 0.562;
            break;
        case parseFloat(0.04125):
            pl = 0.555;
            break;
        case parseFloat(0.04250):
            pl = 0.548;
            break;
        case parseFloat(0.04375):
            pl = 0.541;
            break;
        case parseFloat(0.04500):
            pl = 0.534;
            break;
        case parseFloat(0.04625):
            pl = 0.527;
            break;
        case parseFloat(0.04750):
            pl = 0.521;
            break;
        case parseFloat(0.04875):
            pl = 0.514;
            break;
        case parseFloat(0.05000):
            pl = 0.508;
            break;
        case parseFloat(0.05125):
            pl = 0.502;
            break;
        case parseFloat(0.05250):
            pl = 0.495;
            break;
        case parseFloat(0.05375):
            pl = 0.489;
            break;
        case parseFloat(0.05500):
            pl = 0.483;
            break;
        case parseFloat(0.05625):
            pl = 0.477;
            break;
        case parseFloat(0.05750):
            pl = 0.471;
            break;
        case parseFloat(0.05875):
            pl = 0.466;
            break;
        case parseFloat(0.06000):
            pl = 0.46;
            break;
        case parseFloat(0.06125):
            pl = 0.454;
            break;
        case parseFloat(0.06250):
            pl = 0.449;
            break;
        case parseFloat(0.06375):
            pl = 0.443;
            break;
        case parseFloat(0.06500):
            pl = 0.438;
            break;
        case parseFloat(0.06625):
            pl = 0.433;
            break;
        case parseFloat(0.06750):
            pl = 0.427;
            break;
        case parseFloat(0.06875):
            pl = 0.422;
            break;
        case parseFloat(0.07000):
            pl = 0.417;
            break;
        case parseFloat(0.07125):
            pl = 0.412;
            break;
        case parseFloat(0.07250):
            pl = 0.407;
            break;
        case parseFloat(0.07375):
            pl = 0.402;
            break;
        case parseFloat(0.07500):
            pl = 0.397;
            break;
        case parseFloat(0.07625):
            pl = 0.392;
            break;
        case parseFloat(0.07750):
            pl = 0.387;
            break;
        case parseFloat(0.07875):
            pl = 0.383;
            break;
        case parseFloat(0.08000):
            pl = 0.378;
            break;
        case parseFloat(0.08125):
            pl = 0.374;
            break;
        case parseFloat(0.08250):
            pl = 0.369;
            break;
        case parseFloat(0.08375):
            pl = 0.365;
            break;
        case parseFloat(0.08500):
            pl = 0.36;
            break;
        case parseFloat(0.08625):
            pl = 0.356;
            break;
        case parseFloat(0.08750):
            pl = 0.352;
            break;
        case parseFloat(0.08875):
            pl = 0.348;
            break;
        case parseFloat(0.09000):
            pl = 0.343;
            break;
        case parseFloat(0.09125):
            pl = 0.339;
            break;
        case parseFloat(0.09250):
            pl = 0.335;
            break;
        case parseFloat(0.09375):
            pl = 0.331;
            break;
        case parseFloat(0.09500):
            pl = 0.327;
            break;
        case parseFloat(0.09625):
            pl = 0.323;
            break;
        case parseFloat(0.09750):
            pl = 0.32;
            break;
        case parseFloat(0.09875):
            pl = 0.316;
            break;
        }
        break;
    case 78:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.629;
            break;
        case parseFloat(0.03125):
            pl = 0.621;
            break;
        case parseFloat(0.03250):
            pl = 0.614;
            break;
        case parseFloat(0.03375):
            pl = 0.606;
            break;
        case parseFloat(0.03500):
            pl = 0.599;
            break;
        case parseFloat(0.03625):
            pl = 0.592;
            break;
        case parseFloat(0.03750):
            pl = 0.585;
            break;
        case parseFloat(0.03875):
            pl = 0.578;
            break;
        case parseFloat(0.04000):
            pl = 0.571;
            break;
        case parseFloat(0.04125):
            pl = 0.564;
            break;
        case parseFloat(0.04250):
            pl = 0.557;
            break;
        case parseFloat(0.04375):
            pl = 0.55;
            break;
        case parseFloat(0.04500):
            pl = 0.544;
            break;
        case parseFloat(0.04625):
            pl = 0.537;
            break;
        case parseFloat(0.04750):
            pl = 0.531;
            break;
        case parseFloat(0.04875):
            pl = 0.524;
            break;
        case parseFloat(0.05000):
            pl = 0.518;
            break;
        case parseFloat(0.05125):
            pl = 0.512;
            break;
        case parseFloat(0.05250):
            pl = 0.506;
            break;
        case parseFloat(0.05375):
            pl = 0.5;
            break;
        case parseFloat(0.05500):
            pl = 0.494;
            break;
        case parseFloat(0.05625):
            pl = 0.488;
            break;
        case parseFloat(0.05750):
            pl = 0.482;
            break;
        case parseFloat(0.05875):
            pl = 0.476;
            break;
        case parseFloat(0.06000):
            pl = 0.471;
            break;
        case parseFloat(0.06125):
            pl = 0.465;
            break;
        case parseFloat(0.06250):
            pl = 0.459;
            break;
        case parseFloat(0.06375):
            pl = 0.454;
            break;
        case parseFloat(0.06500):
            pl = 0.449;
            break;
        case parseFloat(0.06625):
            pl = 0.443;
            break;
        case parseFloat(0.06750):
            pl = 0.438;
            break;
        case parseFloat(0.06875):
            pl = 0.433;
            break;
        case parseFloat(0.07000):
            pl = 0.428;
            break;
        case parseFloat(0.07125):
            pl = 0.423;
            break;
        case parseFloat(0.07250):
            pl = 0.418;
            break;
        case parseFloat(0.07375):
            pl = 0.413;
            break;
        case parseFloat(0.07500):
            pl = 0.408;
            break;
        case parseFloat(0.07625):
            pl = 0.403;
            break;
        case parseFloat(0.07750):
            pl = 0.399;
            break;
        case parseFloat(0.07875):
            pl = 0.394;
            break;
        case parseFloat(0.08000):
            pl = 0.389;
            break;
        case parseFloat(0.08125):
            pl = 0.385;
            break;
        case parseFloat(0.08250):
            pl = 0.38;
            break;
        case parseFloat(0.08375):
            pl = 0.376;
            break;
        case parseFloat(0.08500):
            pl = 0.372;
            break;
        case parseFloat(0.08625):
            pl = 0.367;
            break;
        case parseFloat(0.08750):
            pl = 0.363;
            break;
        case parseFloat(0.08875):
            pl = 0.359;
            break;
        case parseFloat(0.09000):
            pl = 0.355;
            break;
        case parseFloat(0.09125):
            pl = 0.351;
            break;
        case parseFloat(0.09250):
            pl = 0.347;
            break;
        case parseFloat(0.09375):
            pl = 0.343;
            break;
        case parseFloat(0.09500):
            pl = 0.339;
            break;
        case parseFloat(0.09625):
            pl = 0.335;
            break;
        case parseFloat(0.09750):
            pl = 0.331;
            break;
        case parseFloat(0.09875):
            pl = 0.327;
            break;
        }
        break;
    case 79:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.633;
            break;
        case parseFloat(0.03125):
            pl = 0.626;
            break;
        case parseFloat(0.03250):
            pl = 0.618;
            break;
        case parseFloat(0.03375):
            pl = 0.611;
            break;
        case parseFloat(0.03500):
            pl = 0.604;
            break;
        case parseFloat(0.03625):
            pl = 0.597;
            break;
        case parseFloat(0.03750):
            pl = 0.589;
            break;
        case parseFloat(0.03875):
            pl = 0.582;
            break;
        case parseFloat(0.04000):
            pl = 0.576;
            break;
        case parseFloat(0.04125):
            pl = 0.569;
            break;
        case parseFloat(0.04250):
            pl = 0.562;
            break;
        case parseFloat(0.04375):
            pl = 0.555;
            break;
        case parseFloat(0.04500):
            pl = 0.549;
            break;
        case parseFloat(0.04625):
            pl = 0.542;
            break;
        case parseFloat(0.04750):
            pl = 0.536;
            break;
        case parseFloat(0.04875):
            pl = 0.53;
            break;
        case parseFloat(0.05000):
            pl = 0.523;
            break;
        case parseFloat(0.05125):
            pl = 0.517;
            break;
        case parseFloat(0.05250):
            pl = 0.511;
            break;
        case parseFloat(0.05375):
            pl = 0.505;
            break;
        case parseFloat(0.05500):
            pl = 0.499;
            break;
        case parseFloat(0.05625):
            pl = 0.494;
            break;
        case parseFloat(0.05750):
            pl = 0.488;
            break;
        case parseFloat(0.05875):
            pl = 0.482;
            break;
        case parseFloat(0.06000):
            pl = 0.477;
            break;
        case parseFloat(0.06125):
            pl = 0.471;
            break;
        case parseFloat(0.06250):
            pl = 0.466;
            break;
        case parseFloat(0.06375):
            pl = 0.46;
            break;
        case parseFloat(0.06500):
            pl = 0.455;
            break;
        case parseFloat(0.06625):
            pl = 0.45;
            break;
        case parseFloat(0.06750):
            pl = 0.444;
            break;
        case parseFloat(0.06875):
            pl = 0.439;
            break;
        case parseFloat(0.07000):
            pl = 0.434;
            break;
        case parseFloat(0.07125):
            pl = 0.429;
            break;
        case parseFloat(0.07250):
            pl = 0.424;
            break;
        case parseFloat(0.07375):
            pl = 0.419;
            break;
        case parseFloat(0.07500):
            pl = 0.415;
            break;
        case parseFloat(0.07625):
            pl = 0.41;
            break;
        case parseFloat(0.07750):
            pl = 0.405;
            break;
        case parseFloat(0.07875):
            pl = 0.4;
            break;
        case parseFloat(0.08000):
            pl = 0.396;
            break;
        case parseFloat(0.08125):
            pl = 0.391;
            break;
        case parseFloat(0.08250):
            pl = 0.387;
            break;
        case parseFloat(0.08375):
            pl = 0.383;
            break;
        case parseFloat(0.08500):
            pl = 0.378;
            break;
        case parseFloat(0.08625):
            pl = 0.374;
            break;
        case parseFloat(0.08750):
            pl = 0.37;
            break;
        case parseFloat(0.08875):
            pl = 0.365;
            break;
        case parseFloat(0.09000):
            pl = 0.361;
            break;
        case parseFloat(0.09125):
            pl = 0.357;
            break;
        case parseFloat(0.09250):
            pl = 0.353;
            break;
        case parseFloat(0.09375):
            pl = 0.349;
            break;
        case parseFloat(0.09500):
            pl = 0.345;
            break;
        case parseFloat(0.09625):
            pl = 0.341;
            break;
        case parseFloat(0.09750):
            pl = 0.338;
            break;
        case parseFloat(0.09875):
            pl = 0.334;
            break;
        }
        break;
    case 80:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.642;
            break;
        case parseFloat(0.03125):
            pl = 0.634;
            break;
        case parseFloat(0.03250):
            pl = 0.627;
            break;
        case parseFloat(0.03375):
            pl = 0.62;
            break;
        case parseFloat(0.03500):
            pl = 0.613;
            break;
        case parseFloat(0.03625):
            pl = 0.606;
            break;
        case parseFloat(0.03750):
            pl = 0.599;
            break;
        case parseFloat(0.03875):
            pl = 0.592;
            break;
        case parseFloat(0.04000):
            pl = 0.585;
            break;
        case parseFloat(0.04125):
            pl = 0.578;
            break;
        case parseFloat(0.04250):
            pl = 0.572;
            break;
        case parseFloat(0.04375):
            pl = 0.565;
            break;
        case parseFloat(0.04500):
            pl = 0.559;
            break;
        case parseFloat(0.04625):
            pl = 0.553;
            break;
        case parseFloat(0.04750):
            pl = 0.546;
            break;
        case parseFloat(0.04875):
            pl = 0.54;
            break;
        case parseFloat(0.05000):
            pl = 0.534;
            break;
        case parseFloat(0.05125):
            pl = 0.528;
            break;
        case parseFloat(0.05250):
            pl = 0.522;
            break;
        case parseFloat(0.05375):
            pl = 0.516;
            break;
        case parseFloat(0.05500):
            pl = 0.51;
            break;
        case parseFloat(0.05625):
            pl = 0.505;
            break;
        case parseFloat(0.05750):
            pl = 0.499;
            break;
        case parseFloat(0.05875):
            pl = 0.493;
            break;
        case parseFloat(0.06000):
            pl = 0.488;
            break;
        case parseFloat(0.06125):
            pl = 0.482;
            break;
        case parseFloat(0.06250):
            pl = 0.477;
            break;
        case parseFloat(0.06375):
            pl = 0.472;
            break;
        case parseFloat(0.06500):
            pl = 0.466;
            break;
        case parseFloat(0.06625):
            pl = 0.461;
            break;
        case parseFloat(0.06750):
            pl = 0.456;
            break;
        case parseFloat(0.06875):
            pl = 0.451;
            break;
        case parseFloat(0.07000):
            pl = 0.446;
            break;
        case parseFloat(0.07125):
            pl = 0.441;
            break;
        case parseFloat(0.07250):
            pl = 0.436;
            break;
        case parseFloat(0.07375):
            pl = 0.431;
            break;
        case parseFloat(0.07500):
            pl = 0.427;
            break;
        case parseFloat(0.07625):
            pl = 0.422;
            break;
        case parseFloat(0.07750):
            pl = 0.417;
            break;
        case parseFloat(0.07875):
            pl = 0.413;
            break;
        case parseFloat(0.08000):
            pl = 0.408;
            break;
        case parseFloat(0.08125):
            pl = 0.404;
            break;
        case parseFloat(0.08250):
            pl = 0.399;
            break;
        case parseFloat(0.08375):
            pl = 0.395;
            break;
        case parseFloat(0.08500):
            pl = 0.39;
            break;
        case parseFloat(0.08625):
            pl = 0.386;
            break;
        case parseFloat(0.08750):
            pl = 0.382;
            break;
        case parseFloat(0.08875):
            pl = 0.378;
            break;
        case parseFloat(0.09000):
            pl = 0.374;
            break;
        case parseFloat(0.09125):
            pl = 0.37;
            break;
        case parseFloat(0.09250):
            pl = 0.366;
            break;
        case parseFloat(0.09375):
            pl = 0.362;
            break;
        case parseFloat(0.09500):
            pl = 0.358;
            break;
        case parseFloat(0.09625):
            pl = 0.354;
            break;
        case parseFloat(0.09750):
            pl = 0.35;
            break;
        case parseFloat(0.09875):
            pl = 0.346;
            break;
        }
        break;
    case 81:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.65;
            break;
        case parseFloat(0.03125):
            pl = 0.643;
            break;
        case parseFloat(0.03250):
            pl = 0.636;
            break;
        case parseFloat(0.03375):
            pl = 0.629;
            break;
        case parseFloat(0.03500):
            pl = 0.622;
            break;
        case parseFloat(0.03625):
            pl = 0.615;
            break;
        case parseFloat(0.03750):
            pl = 0.608;
            break;
        case parseFloat(0.03875):
            pl = 0.601;
            break;
        case parseFloat(0.04000):
            pl = 0.595;
            break;
        case parseFloat(0.04125):
            pl = 0.588;
            break;
        case parseFloat(0.04250):
            pl = 0.582;
            break;
        case parseFloat(0.04375):
            pl = 0.575;
            break;
        case parseFloat(0.04500):
            pl = 0.569;
            break;
        case parseFloat(0.04625):
            pl = 0.563;
            break;
        case parseFloat(0.04750):
            pl = 0.557;
            break;
        case parseFloat(0.04875):
            pl = 0.551;
            break;
        case parseFloat(0.05000):
            pl = 0.545;
            break;
        case parseFloat(0.05125):
            pl = 0.539;
            break;
        case parseFloat(0.05250):
            pl = 0.533;
            break;
        case parseFloat(0.05375):
            pl = 0.527;
            break;
        case parseFloat(0.05500):
            pl = 0.522;
            break;
        case parseFloat(0.05625):
            pl = 0.516;
            break;
        case parseFloat(0.05750):
            pl = 0.51;
            break;
        case parseFloat(0.05875):
            pl = 0.505;
            break;
        case parseFloat(0.06000):
            pl = 0.499;
            break;
        case parseFloat(0.06125):
            pl = 0.494;
            break;
        case parseFloat(0.06250):
            pl = 0.489;
            break;
        case parseFloat(0.06375):
            pl = 0.483;
            break;
        case parseFloat(0.06500):
            pl = 0.478;
            break;
        case parseFloat(0.06625):
            pl = 0.473;
            break;
        case parseFloat(0.06750):
            pl = 0.468;
            break;
        case parseFloat(0.06875):
            pl = 0.463;
            break;
        case parseFloat(0.07000):
            pl = 0.458;
            break;
        case parseFloat(0.07125):
            pl = 0.453;
            break;
        case parseFloat(0.07250):
            pl = 0.448;
            break;
        case parseFloat(0.07375):
            pl = 0.444;
            break;
        case parseFloat(0.07500):
            pl = 0.439;
            break;
        case parseFloat(0.07625):
            pl = 0.434;
            break;
        case parseFloat(0.07750):
            pl = 0.43;
            break;
        case parseFloat(0.07875):
            pl = 0.425;
            break;
        case parseFloat(0.08000):
            pl = 0.421;
            break;
        case parseFloat(0.08125):
            pl = 0.416;
            break;
        case parseFloat(0.08250):
            pl = 0.412;
            break;
        case parseFloat(0.08375):
            pl = 0.408;
            break;
        case parseFloat(0.08500):
            pl = 0.403;
            break;
        case parseFloat(0.08625):
            pl = 0.399;
            break;
        case parseFloat(0.08750):
            pl = 0.395;
            break;
        case parseFloat(0.08875):
            pl = 0.391;
            break;
        case parseFloat(0.09000):
            pl = 0.387;
            break;
        case parseFloat(0.09125):
            pl = 0.383;
            break;
        case parseFloat(0.09250):
            pl = 0.379;
            break;
        case parseFloat(0.09375):
            pl = 0.375;
            break;
        case parseFloat(0.09500):
            pl = 0.371;
            break;
        case parseFloat(0.09625):
            pl = 0.367;
            break;
        case parseFloat(0.09750):
            pl = 0.363;
            break;
        case parseFloat(0.09875):
            pl = 0.359;
            break;
        }
        break;
    case 82:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.658;
            break;
        case parseFloat(0.03125):
            pl = 0.651;
            break;
        case parseFloat(0.03250):
            pl = 0.644;
            break;
        case parseFloat(0.03375):
            pl = 0.638;
            break;
        case parseFloat(0.03500):
            pl = 0.631;
            break;
        case parseFloat(0.03625):
            pl = 0.624;
            break;
        case parseFloat(0.03750):
            pl = 0.618;
            break;
        case parseFloat(0.03875):
            pl = 0.611;
            break;
        case parseFloat(0.04000):
            pl = 0.605;
            break;
        case parseFloat(0.04125):
            pl = 0.598;
            break;
        case parseFloat(0.04250):
            pl = 0.592;
            break;
        case parseFloat(0.04375):
            pl = 0.586;
            break;
        case parseFloat(0.04500):
            pl = 0.58;
            break;
        case parseFloat(0.04625):
            pl = 0.574;
            break;
        case parseFloat(0.04750):
            pl = 0.568;
            break;
        case parseFloat(0.04875):
            pl = 0.562;
            break;
        case parseFloat(0.05000):
            pl = 0.556;
            break;
        case parseFloat(0.05125):
            pl = 0.55;
            break;
        case parseFloat(0.05250):
            pl = 0.544;
            break;
        case parseFloat(0.05375):
            pl = 0.539;
            break;
        case parseFloat(0.05500):
            pl = 0.533;
            break;
        case parseFloat(0.05625):
            pl = 0.528;
            break;
        case parseFloat(0.05750):
            pl = 0.522;
            break;
        case parseFloat(0.05875):
            pl = 0.517;
            break;
        case parseFloat(0.06000):
            pl = 0.511;
            break;
        case parseFloat(0.06125):
            pl = 0.506;
            break;
        case parseFloat(0.06250):
            pl = 0.501;
            break;
        case parseFloat(0.06375):
            pl = 0.496;
            break;
        case parseFloat(0.06500):
            pl = 0.491;
            break;
        case parseFloat(0.06625):
            pl = 0.486;
            break;
        case parseFloat(0.06750):
            pl = 0.481;
            break;
        case parseFloat(0.06875):
            pl = 0.476;
            break;
        case parseFloat(0.07000):
            pl = 0.471;
            break;
        case parseFloat(0.07125):
            pl = 0.466;
            break;
        case parseFloat(0.07250):
            pl = 0.461;
            break;
        case parseFloat(0.07375):
            pl = 0.457;
            break;
        case parseFloat(0.07500):
            pl = 0.452;
            break;
        case parseFloat(0.07625):
            pl = 0.447;
            break;
        case parseFloat(0.07750):
            pl = 0.443;
            break;
        case parseFloat(0.07875):
            pl = 0.438;
            break;
        case parseFloat(0.08000):
            pl = 0.434;
            break;
        case parseFloat(0.08125):
            pl = 0.429;
            break;
        case parseFloat(0.08250):
            pl = 0.425;
            break;
        case parseFloat(0.08375):
            pl = 0.421;
            break;
        case parseFloat(0.08500):
            pl = 0.417;
            break;
        case parseFloat(0.08625):
            pl = 0.412;
            break;
        case parseFloat(0.08750):
            pl = 0.408;
            break;
        case parseFloat(0.08875):
            pl = 0.404;
            break;
        case parseFloat(0.09000):
            pl = 0.4;
            break;
        case parseFloat(0.09125):
            pl = 0.396;
            break;
        case parseFloat(0.09250):
            pl = 0.392;
            break;
        case parseFloat(0.09375):
            pl = 0.388;
            break;
        case parseFloat(0.09500):
            pl = 0.384;
            break;
        case parseFloat(0.09625):
            pl = 0.38;
            break;
        case parseFloat(0.09750):
            pl = 0.377;
            break;
        case parseFloat(0.09875):
            pl = 0.373;
            break;
        }
        break;
    case 83:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.667;
            break;
        case parseFloat(0.03125):
            pl = 0.66;
            break;
        case parseFloat(0.03250):
            pl = 0.653;
            break;
        case parseFloat(0.03375):
            pl = 0.647;
            break;
        case parseFloat(0.03500):
            pl = 0.64;
            break;
        case parseFloat(0.03625):
            pl = 0.634;
            break;
        case parseFloat(0.03750):
            pl = 0.627;
            break;
        case parseFloat(0.03875):
            pl = 0.621;
            break;
        case parseFloat(0.04000):
            pl = 0.615;
            break;
        case parseFloat(0.04125):
            pl = 0.609;
            break;
        case parseFloat(0.04250):
            pl = 0.602;
            break;
        case parseFloat(0.04375):
            pl = 0.596;
            break;
        case parseFloat(0.04500):
            pl = 0.59;
            break;
        case parseFloat(0.04625):
            pl = 0.585;
            break;
        case parseFloat(0.04750):
            pl = 0.579;
            break;
        case parseFloat(0.04875):
            pl = 0.573;
            break;
        case parseFloat(0.05000):
            pl = 0.567;
            break;
        case parseFloat(0.05125):
            pl = 0.562;
            break;
        case parseFloat(0.05250):
            pl = 0.556;
            break;
        case parseFloat(0.05375):
            pl = 0.55;
            break;
        case parseFloat(0.05500):
            pl = 0.545;
            break;
        case parseFloat(0.05625):
            pl = 0.54;
            break;
        case parseFloat(0.05750):
            pl = 0.534;
            break;
        case parseFloat(0.05875):
            pl = 0.529;
            break;
        case parseFloat(0.06000):
            pl = 0.524;
            break;
        case parseFloat(0.06125):
            pl = 0.518;
            break;
        case parseFloat(0.06250):
            pl = 0.513;
            break;
        case parseFloat(0.06375):
            pl = 0.508;
            break;
        case parseFloat(0.06500):
            pl = 0.503;
            break;
        case parseFloat(0.06625):
            pl = 0.498;
            break;
        case parseFloat(0.06750):
            pl = 0.493;
            break;
        case parseFloat(0.06875):
            pl = 0.489;
            break;
        case parseFloat(0.07000):
            pl = 0.484;
            break;
        case parseFloat(0.07125):
            pl = 0.479;
            break;
        case parseFloat(0.07250):
            pl = 0.474;
            break;
        case parseFloat(0.07375):
            pl = 0.47;
            break;
        case parseFloat(0.07500):
            pl = 0.465;
            break;
        case parseFloat(0.07625):
            pl = 0.461;
            break;
        case parseFloat(0.07750):
            pl = 0.456;
            break;
        case parseFloat(0.07875):
            pl = 0.452;
            break;
        case parseFloat(0.08000):
            pl = 0.447;
            break;
        case parseFloat(0.08125):
            pl = 0.443;
            break;
        case parseFloat(0.08250):
            pl = 0.439;
            break;
        case parseFloat(0.08375):
            pl = 0.434;
            break;
        case parseFloat(0.08500):
            pl = 0.43;
            break;
        case parseFloat(0.08625):
            pl = 0.426;
            break;
        case parseFloat(0.08750):
            pl = 0.422;
            break;
        case parseFloat(0.08875):
            pl = 0.418;
            break;
        case parseFloat(0.09000):
            pl = 0.414;
            break;
        case parseFloat(0.09125):
            pl = 0.41;
            break;
        case parseFloat(0.09250):
            pl = 0.406;
            break;
        case parseFloat(0.09375):
            pl = 0.402;
            break;
        case parseFloat(0.09500):
            pl = 0.398;
            break;
        case parseFloat(0.09625):
            pl = 0.394;
            break;
        case parseFloat(0.09750):
            pl = 0.391;
            break;
        case parseFloat(0.09875):
            pl = 0.387;
            break;
        }
        break;
    case 84:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.676;
            break;
        case parseFloat(0.03125):
            pl = 0.669;
            break;
        case parseFloat(0.03250):
            pl = 0.663;
            break;
        case parseFloat(0.03375):
            pl = 0.656;
            break;
        case parseFloat(0.03500):
            pl = 0.65;
            break;
        case parseFloat(0.03625):
            pl = 0.644;
            break;
        case parseFloat(0.03750):
            pl = 0.637;
            break;
        case parseFloat(0.03875):
            pl = 0.631;
            break;
        case parseFloat(0.04000):
            pl = 0.625;
            break;
        case parseFloat(0.04125):
            pl = 0.619;
            break;
        case parseFloat(0.04250):
            pl = 0.613;
            break;
        case parseFloat(0.04375):
            pl = 0.607;
            break;
        case parseFloat(0.04500):
            pl = 0.601;
            break;
        case parseFloat(0.04625):
            pl = 0.596;
            break;
        case parseFloat(0.04750):
            pl = 0.59;
            break;
        case parseFloat(0.04875):
            pl = 0.584;
            break;
        case parseFloat(0.05000):
            pl = 0.579;
            break;
        case parseFloat(0.05125):
            pl = 0.573;
            break;
        case parseFloat(0.05250):
            pl = 0.568;
            break;
        case parseFloat(0.05375):
            pl = 0.562;
            break;
        case parseFloat(0.05500):
            pl = 0.557;
            break;
        case parseFloat(0.05625):
            pl = 0.552;
            break;
        case parseFloat(0.05750):
            pl = 0.547;
            break;
        case parseFloat(0.05875):
            pl = 0.541;
            break;
        case parseFloat(0.06000):
            pl = 0.536;
            break;
        case parseFloat(0.06125):
            pl = 0.531;
            break;
        case parseFloat(0.06250):
            pl = 0.526;
            break;
        case parseFloat(0.06375):
            pl = 0.521;
            break;
        case parseFloat(0.06500):
            pl = 0.516;
            break;
        case parseFloat(0.06625):
            pl = 0.512;
            break;
        case parseFloat(0.06750):
            pl = 0.507;
            break;
        case parseFloat(0.06875):
            pl = 0.502;
            break;
        case parseFloat(0.07000):
            pl = 0.497;
            break;
        case parseFloat(0.07125):
            pl = 0.493;
            break;
        case parseFloat(0.07250):
            pl = 0.488;
            break;
        case parseFloat(0.07375):
            pl = 0.483;
            break;
        case parseFloat(0.07500):
            pl = 0.479;
            break;
        case parseFloat(0.07625):
            pl = 0.475;
            break;
        case parseFloat(0.07750):
            pl = 0.47;
            break;
        case parseFloat(0.07875):
            pl = 0.466;
            break;
        case parseFloat(0.08000):
            pl = 0.461;
            break;
        case parseFloat(0.08125):
            pl = 0.457;
            break;
        case parseFloat(0.08250):
            pl = 0.453;
            break;
        case parseFloat(0.08375):
            pl = 0.449;
            break;
        case parseFloat(0.08500):
            pl = 0.445;
            break;
        case parseFloat(0.08625):
            pl = 0.44;
            break;
        case parseFloat(0.08750):
            pl = 0.436;
            break;
        case parseFloat(0.08875):
            pl = 0.432;
            break;
        case parseFloat(0.09000):
            pl = 0.428;
            break;
        case parseFloat(0.09125):
            pl = 0.425;
            break;
        case parseFloat(0.09250):
            pl = 0.421;
            break;
        case parseFloat(0.09375):
            pl = 0.417;
            break;
        case parseFloat(0.09500):
            pl = 0.413;
            break;
        case parseFloat(0.09625):
            pl = 0.409;
            break;
        case parseFloat(0.09750):
            pl = 0.405;
            break;
        case parseFloat(0.09875):
            pl = 0.402;
            break;
        }
        break;
    case 85:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.685;
            break;
        case parseFloat(0.03125):
            pl = 0.678;
            break;
        case parseFloat(0.03250):
            pl = 0.672;
            break;
        case parseFloat(0.03375):
            pl = 0.666;
            break;
        case parseFloat(0.03500):
            pl = 0.66;
            break;
        case parseFloat(0.03625):
            pl = 0.654;
            break;
        case parseFloat(0.03750):
            pl = 0.648;
            break;
        case parseFloat(0.03875):
            pl = 0.642;
            break;
        case parseFloat(0.04000):
            pl = 0.636;
            break;
        case parseFloat(0.04125):
            pl = 0.63;
            break;
        case parseFloat(0.04250):
            pl = 0.624;
            break;
        case parseFloat(0.04375):
            pl = 0.618;
            break;
        case parseFloat(0.04500):
            pl = 0.613;
            break;
        case parseFloat(0.04625):
            pl = 0.607;
            break;
        case parseFloat(0.04750):
            pl = 0.602;
            break;
        case parseFloat(0.04875):
            pl = 0.596;
            break;
        case parseFloat(0.05000):
            pl = 0.591;
            break;
        case parseFloat(0.05125):
            pl = 0.585;
            break;
        case parseFloat(0.05250):
            pl = 0.58;
            break;
        case parseFloat(0.05375):
            pl = 0.575;
            break;
        case parseFloat(0.05500):
            pl = 0.57;
            break;
        case parseFloat(0.05625):
            pl = 0.564;
            break;
        case parseFloat(0.05750):
            pl = 0.559;
            break;
        case parseFloat(0.05875):
            pl = 0.554;
            break;
        case parseFloat(0.06000):
            pl = 0.549;
            break;
        case parseFloat(0.06125):
            pl = 0.544;
            break;
        case parseFloat(0.06250):
            pl = 0.54;
            break;
        case parseFloat(0.06375):
            pl = 0.535;
            break;
        case parseFloat(0.06500):
            pl = 0.53;
            break;
        case parseFloat(0.06625):
            pl = 0.525;
            break;
        case parseFloat(0.06750):
            pl = 0.52;
            break;
        case parseFloat(0.06875):
            pl = 0.516;
            break;
        case parseFloat(0.07000):
            pl = 0.511;
            break;
        case parseFloat(0.07125):
            pl = 0.507;
            break;
        case parseFloat(0.07250):
            pl = 0.502;
            break;
        case parseFloat(0.07375):
            pl = 0.498;
            break;
        case parseFloat(0.07500):
            pl = 0.493;
            break;
        case parseFloat(0.07625):
            pl = 0.489;
            break;
        case parseFloat(0.07750):
            pl = 0.485;
            break;
        case parseFloat(0.07875):
            pl = 0.48;
            break;
        case parseFloat(0.08000):
            pl = 0.476;
            break;
        case parseFloat(0.08125):
            pl = 0.472;
            break;
        case parseFloat(0.08250):
            pl = 0.468;
            break;
        case parseFloat(0.08375):
            pl = 0.464;
            break;
        case parseFloat(0.08500):
            pl = 0.459;
            break;
        case parseFloat(0.08625):
            pl = 0.455;
            break;
        case parseFloat(0.08750):
            pl = 0.451;
            break;
        case parseFloat(0.08875):
            pl = 0.447;
            break;
        case parseFloat(0.09000):
            pl = 0.444;
            break;
        case parseFloat(0.09125):
            pl = 0.44;
            break;
        case parseFloat(0.09250):
            pl = 0.436;
            break;
        case parseFloat(0.09375):
            pl = 0.432;
            break;
        case parseFloat(0.09500):
            pl = 0.428;
            break;
        case parseFloat(0.09625):
            pl = 0.425;
            break;
        case parseFloat(0.09750):
            pl = 0.421;
            break;
        case parseFloat(0.09875):
            pl = 0.417;
            break;
        }
        break;
    case 86:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.694;
            break;
        case parseFloat(0.03125):
            pl = 0.688;
            break;
        case parseFloat(0.03250):
            pl = 0.682;
            break;
        case parseFloat(0.03375):
            pl = 0.676;
            break;
        case parseFloat(0.03500):
            pl = 0.67;
            break;
        case parseFloat(0.03625):
            pl = 0.664;
            break;
        case parseFloat(0.03750):
            pl = 0.658;
            break;
        case parseFloat(0.03875):
            pl = 0.652;
            break;
        case parseFloat(0.04000):
            pl = 0.647;
            break;
        case parseFloat(0.04125):
            pl = 0.641;
            break;
        case parseFloat(0.04250):
            pl = 0.635;
            break;
        case parseFloat(0.04375):
            pl = 0.63;
            break;
        case parseFloat(0.04500):
            pl = 0.624;
            break;
        case parseFloat(0.04625):
            pl = 0.619;
            break;
        case parseFloat(0.04750):
            pl = 0.614;
            break;
        case parseFloat(0.04875):
            pl = 0.608;
            break;
        case parseFloat(0.05000):
            pl = 0.603;
            break;
        case parseFloat(0.05125):
            pl = 0.598;
            break;
        case parseFloat(0.05250):
            pl = 0.593;
            break;
        case parseFloat(0.05375):
            pl = 0.588;
            break;
        case parseFloat(0.05500):
            pl = 0.582;
            break;
        case parseFloat(0.05625):
            pl = 0.577;
            break;
        case parseFloat(0.05750):
            pl = 0.573;
            break;
        case parseFloat(0.05875):
            pl = 0.568;
            break;
        case parseFloat(0.06000):
            pl = 0.563;
            break;
        case parseFloat(0.06125):
            pl = 0.558;
            break;
        case parseFloat(0.06250):
            pl = 0.553;
            break;
        case parseFloat(0.06375):
            pl = 0.548;
            break;
        case parseFloat(0.06500):
            pl = 0.544;
            break;
        case parseFloat(0.06625):
            pl = 0.539;
            break;
        case parseFloat(0.06750):
            pl = 0.535;
            break;
        case parseFloat(0.06875):
            pl = 0.53;
            break;
        case parseFloat(0.07000):
            pl = 0.526;
            break;
        case parseFloat(0.07125):
            pl = 0.521;
            break;
        case parseFloat(0.07250):
            pl = 0.517;
            break;
        case parseFloat(0.07375):
            pl = 0.512;
            break;
        case parseFloat(0.07500):
            pl = 0.508;
            break;
        case parseFloat(0.07625):
            pl = 0.504;
            break;
        case parseFloat(0.07750):
            pl = 0.499;
            break;
        case parseFloat(0.07875):
            pl = 0.495;
            break;
        case parseFloat(0.08000):
            pl = 0.491;
            break;
        case parseFloat(0.08125):
            pl = 0.487;
            break;
        case parseFloat(0.08250):
            pl = 0.483;
            break;
        case parseFloat(0.08375):
            pl = 0.479;
            break;
        case parseFloat(0.08500):
            pl = 0.475;
            break;
        case parseFloat(0.08625):
            pl = 0.471;
            break;
        case parseFloat(0.08750):
            pl = 0.467;
            break;
        case parseFloat(0.08875):
            pl = 0.463;
            break;
        case parseFloat(0.09000):
            pl = 0.459;
            break;
        case parseFloat(0.09125):
            pl = 0.455;
            break;
        case parseFloat(0.09250):
            pl = 0.452;
            break;
        case parseFloat(0.09375):
            pl = 0.448;
            break;
        case parseFloat(0.09500):
            pl = 0.444;
            break;
        case parseFloat(0.09625):
            pl = 0.441;
            break;
        case parseFloat(0.09750):
            pl = 0.437;
            break;
        case parseFloat(0.09875):
            pl = 0.433;
            break;
        }
        break;
    case 87:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.703;
            break;
        case parseFloat(0.03125):
            pl = 0.697;
            break;
        case parseFloat(0.03250):
            pl = 0.691;
            break;
        case parseFloat(0.03375):
            pl = 0.686;
            break;
        case parseFloat(0.03500):
            pl = 0.68;
            break;
        case parseFloat(0.03625):
            pl = 0.674;
            break;
        case parseFloat(0.03750):
            pl = 0.669;
            break;
        case parseFloat(0.03875):
            pl = 0.663;
            break;
        case parseFloat(0.04000):
            pl = 0.658;
            break;
        case parseFloat(0.04125):
            pl = 0.652;
            break;
        case parseFloat(0.04250):
            pl = 0.647;
            break;
        case parseFloat(0.04375):
            pl = 0.641;
            break;
        case parseFloat(0.04500):
            pl = 0.636;
            break;
        case parseFloat(0.04625):
            pl = 0.631;
            break;
        case parseFloat(0.04750):
            pl = 0.626;
            break;
        case parseFloat(0.04875):
            pl = 0.621;
            break;
        case parseFloat(0.05000):
            pl = 0.616;
            break;
        case parseFloat(0.05125):
            pl = 0.611;
            break;
        case parseFloat(0.05250):
            pl = 0.606;
            break;
        case parseFloat(0.05375):
            pl = 0.601;
            break;
        case parseFloat(0.05500):
            pl = 0.596;
            break;
        case parseFloat(0.05625):
            pl = 0.591;
            break;
        case parseFloat(0.05750):
            pl = 0.586;
            break;
        case parseFloat(0.05875):
            pl = 0.581;
            break;
        case parseFloat(0.06000):
            pl = 0.577;
            break;
        case parseFloat(0.06125):
            pl = 0.572;
            break;
        case parseFloat(0.06250):
            pl = 0.567;
            break;
        case parseFloat(0.06375):
            pl = 0.563;
            break;
        case parseFloat(0.06500):
            pl = 0.558;
            break;
        case parseFloat(0.06625):
            pl = 0.554;
            break;
        case parseFloat(0.06750):
            pl = 0.549;
            break;
        case parseFloat(0.06875):
            pl = 0.545;
            break;
        case parseFloat(0.07000):
            pl = 0.54;
            break;
        case parseFloat(0.07125):
            pl = 0.536;
            break;
        case parseFloat(0.07250):
            pl = 0.532;
            break;
        case parseFloat(0.07375):
            pl = 0.528;
            break;
        case parseFloat(0.07500):
            pl = 0.523;
            break;
        case parseFloat(0.07625):
            pl = 0.519;
            break;
        case parseFloat(0.07750):
            pl = 0.515;
            break;
        case parseFloat(0.07875):
            pl = 0.511;
            break;
        case parseFloat(0.08000):
            pl = 0.507;
            break;
        case parseFloat(0.08125):
            pl = 0.503;
            break;
        case parseFloat(0.08250):
            pl = 0.499;
            break;
        case parseFloat(0.08375):
            pl = 0.495;
            break;
        case parseFloat(0.08500):
            pl = 0.491;
            break;
        case parseFloat(0.08625):
            pl = 0.487;
            break;
        case parseFloat(0.08750):
            pl = 0.483;
            break;
        case parseFloat(0.08875):
            pl = 0.479;
            break;
        case parseFloat(0.09000):
            pl = 0.476;
            break;
        case parseFloat(0.09125):
            pl = 0.472;
            break;
        case parseFloat(0.09250):
            pl = 0.468;
            break;
        case parseFloat(0.09375):
            pl = 0.464;
            break;
        case parseFloat(0.09500):
            pl = 0.461;
            break;
        case parseFloat(0.09625):
            pl = 0.457;
            break;
        case parseFloat(0.09750):
            pl = 0.454;
            break;
        case parseFloat(0.09875):
            pl = 0.45;
            break;
        }
        break;
    case 88:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.711;
            break;
        case parseFloat(0.03125):
            pl = 0.705;
            break;
        case parseFloat(0.03250):
            pl = 0.7;
            break;
        case parseFloat(0.03375):
            pl = 0.694;
            break;
        case parseFloat(0.03500):
            pl = 0.689;
            break;
        case parseFloat(0.03625):
            pl = 0.683;
            break;
        case parseFloat(0.03750):
            pl = 0.678;
            break;
        case parseFloat(0.03875):
            pl = 0.672;
            break;
        case parseFloat(0.04000):
            pl = 0.667;
            break;
        case parseFloat(0.04125):
            pl = 0.662;
            break;
        case parseFloat(0.04250):
            pl = 0.657;
            break;
        case parseFloat(0.04375):
            pl = 0.651;
            break;
        case parseFloat(0.04500):
            pl = 0.646;
            break;
        case parseFloat(0.04625):
            pl = 0.641;
            break;
        case parseFloat(0.04750):
            pl = 0.636;
            break;
        case parseFloat(0.04875):
            pl = 0.631;
            break;
        case parseFloat(0.05000):
            pl = 0.626;
            break;
        case parseFloat(0.05125):
            pl = 0.621;
            break;
        case parseFloat(0.05250):
            pl = 0.617;
            break;
        case parseFloat(0.05375):
            pl = 0.612;
            break;
        case parseFloat(0.05500):
            pl = 0.607;
            break;
        case parseFloat(0.05625):
            pl = 0.602;
            break;
        case parseFloat(0.05750):
            pl = 0.598;
            break;
        case parseFloat(0.05875):
            pl = 0.593;
            break;
        case parseFloat(0.06000):
            pl = 0.589;
            break;
        case parseFloat(0.06125):
            pl = 0.584;
            break;
        case parseFloat(0.06250):
            pl = 0.579;
            break;
        case parseFloat(0.06375):
            pl = 0.575;
            break;
        case parseFloat(0.06500):
            pl = 0.571;
            break;
        case parseFloat(0.06625):
            pl = 0.566;
            break;
        case parseFloat(0.06750):
            pl = 0.562;
            break;
        case parseFloat(0.06875):
            pl = 0.558;
            break;
        case parseFloat(0.07000):
            pl = 0.553;
            break;
        case parseFloat(0.07125):
            pl = 0.549;
            break;
        case parseFloat(0.07250):
            pl = 0.545;
            break;
        case parseFloat(0.07375):
            pl = 0.541;
            break;
        case parseFloat(0.07500):
            pl = 0.537;
            break;
        case parseFloat(0.07625):
            pl = 0.532;
            break;
        case parseFloat(0.07750):
            pl = 0.528;
            break;
        case parseFloat(0.07875):
            pl = 0.524;
            break;
        case parseFloat(0.08000):
            pl = 0.52;
            break;
        case parseFloat(0.08125):
            pl = 0.516;
            break;
        case parseFloat(0.08250):
            pl = 0.513;
            break;
        case parseFloat(0.08375):
            pl = 0.509;
            break;
        case parseFloat(0.08500):
            pl = 0.505;
            break;
        case parseFloat(0.08625):
            pl = 0.501;
            break;
        case parseFloat(0.08750):
            pl = 0.497;
            break;
        case parseFloat(0.08875):
            pl = 0.494;
            break;
        case parseFloat(0.09000):
            pl = 0.49;
            break;
        case parseFloat(0.09125):
            pl = 0.486;
            break;
        case parseFloat(0.09250):
            pl = 0.482;
            break;
        case parseFloat(0.09375):
            pl = 0.479;
            break;
        case parseFloat(0.09500):
            pl = 0.475;
            break;
        case parseFloat(0.09625):
            pl = 0.472;
            break;
        case parseFloat(0.09750):
            pl = 0.468;
            break;
        case parseFloat(0.09875):
            pl = 0.465;
            break;
        }
        break;
    case 89:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.721;
            break;
        case parseFloat(0.03125):
            pl = 0.715;
            break;
        case parseFloat(0.03250):
            pl = 0.71;
            break;
        case parseFloat(0.03375):
            pl = 0.705;
            break;
        case parseFloat(0.03500):
            pl = 0.699;
            break;
        case parseFloat(0.03625):
            pl = 0.694;
            break;
        case parseFloat(0.03750):
            pl = 0.689;
            break;
        case parseFloat(0.03875):
            pl = 0.684;
            break;
        case parseFloat(0.04000):
            pl = 0.679;
            break;
        case parseFloat(0.04125):
            pl = 0.674;
            break;
        case parseFloat(0.04250):
            pl = 0.669;
            break;
        case parseFloat(0.04375):
            pl = 0.664;
            break;
        case parseFloat(0.04500):
            pl = 0.659;
            break;
        case parseFloat(0.04625):
            pl = 0.654;
            break;
        case parseFloat(0.04750):
            pl = 0.649;
            break;
        case parseFloat(0.04875):
            pl = 0.644;
            break;
        case parseFloat(0.05000):
            pl = 0.64;
            break;
        case parseFloat(0.05125):
            pl = 0.635;
            break;
        case parseFloat(0.05250):
            pl = 0.63;
            break;
        case parseFloat(0.05375):
            pl = 0.626;
            break;
        case parseFloat(0.05500):
            pl = 0.621;
            break;
        case parseFloat(0.05625):
            pl = 0.617;
            break;
        case parseFloat(0.05750):
            pl = 0.612;
            break;
        case parseFloat(0.05875):
            pl = 0.608;
            break;
        case parseFloat(0.06000):
            pl = 0.603;
            break;
        case parseFloat(0.06125):
            pl = 0.599;
            break;
        case parseFloat(0.06250):
            pl = 0.595;
            break;
        case parseFloat(0.06375):
            pl = 0.59;
            break;
        case parseFloat(0.06500):
            pl = 0.586;
            break;
        case parseFloat(0.06625):
            pl = 0.582;
            break;
        case parseFloat(0.06750):
            pl = 0.578;
            break;
        case parseFloat(0.06875):
            pl = 0.573;
            break;
        case parseFloat(0.07000):
            pl = 0.569;
            break;
        case parseFloat(0.07125):
            pl = 0.565;
            break;
        case parseFloat(0.07250):
            pl = 0.561;
            break;
        case parseFloat(0.07375):
            pl = 0.557;
            break;
        case parseFloat(0.07500):
            pl = 0.553;
            break;
        case parseFloat(0.07625):
            pl = 0.549;
            break;
        case parseFloat(0.07750):
            pl = 0.545;
            break;
        case parseFloat(0.07875):
            pl = 0.541;
            break;
        case parseFloat(0.08000):
            pl = 0.537;
            break;
        case parseFloat(0.08125):
            pl = 0.534;
            break;
        case parseFloat(0.08250):
            pl = 0.53;
            break;
        case parseFloat(0.08375):
            pl = 0.526;
            break;
        case parseFloat(0.08500):
            pl = 0.522;
            break;
        case parseFloat(0.08625):
            pl = 0.519;
            break;
        case parseFloat(0.08750):
            pl = 0.515;
            break;
        case parseFloat(0.08875):
            pl = 0.511;
            break;
        case parseFloat(0.09000):
            pl = 0.508;
            break;
        case parseFloat(0.09125):
            pl = 0.504;
            break;
        case parseFloat(0.09250):
            pl = 0.5;
            break;
        case parseFloat(0.09375):
            pl = 0.497;
            break;
        case parseFloat(0.09500):
            pl = 0.493;
            break;
        case parseFloat(0.09625):
            pl = 0.49;
            break;
        case parseFloat(0.09750):
            pl = 0.487;
            break;
        case parseFloat(0.09875):
            pl = 0.483;
            break;
        }
        break;
    case 90:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.73;
            break;
        case parseFloat(0.03125):
            pl = 0.725;
            break;
        case parseFloat(0.03250):
            pl = 0.72;
            break;
        case parseFloat(0.03375):
            pl = 0.715;
            break;
        case parseFloat(0.03500):
            pl = 0.71;
            break;
        case parseFloat(0.03625):
            pl = 0.705;
            break;
        case parseFloat(0.03750):
            pl = 0.7;
            break;
        case parseFloat(0.03875):
            pl = 0.695;
            break;
        case parseFloat(0.04000):
            pl = 0.691;
            break;
        case parseFloat(0.04125):
            pl = 0.686;
            break;
        case parseFloat(0.04250):
            pl = 0.681;
            break;
        case parseFloat(0.04375):
            pl = 0.676;
            break;
        case parseFloat(0.04500):
            pl = 0.672;
            break;
        case parseFloat(0.04625):
            pl = 0.667;
            break;
        case parseFloat(0.04750):
            pl = 0.662;
            break;
        case parseFloat(0.04875):
            pl = 0.658;
            break;
        case parseFloat(0.05000):
            pl = 0.653;
            break;
        case parseFloat(0.05125):
            pl = 0.649;
            break;
        case parseFloat(0.05250):
            pl = 0.644;
            break;
        case parseFloat(0.05375):
            pl = 0.64;
            break;
        case parseFloat(0.05500):
            pl = 0.636;
            break;
        case parseFloat(0.05625):
            pl = 0.631;
            break;
        case parseFloat(0.05750):
            pl = 0.627;
            break;
        case parseFloat(0.05875):
            pl = 0.623;
            break;
        case parseFloat(0.06000):
            pl = 0.618;
            break;
        case parseFloat(0.06125):
            pl = 0.614;
            break;
        case parseFloat(0.06250):
            pl = 0.61;
            break;
        case parseFloat(0.06375):
            pl = 0.606;
            break;
        case parseFloat(0.06500):
            pl = 0.602;
            break;
        case parseFloat(0.06625):
            pl = 0.598;
            break;
        case parseFloat(0.06750):
            pl = 0.594;
            break;
        case parseFloat(0.06875):
            pl = 0.59;
            break;
        case parseFloat(0.07000):
            pl = 0.586;
            break;
        case parseFloat(0.07125):
            pl = 0.582;
            break;
        case parseFloat(0.07250):
            pl = 0.578;
            break;
        case parseFloat(0.07375):
            pl = 0.574;
            break;
        case parseFloat(0.07500):
            pl = 0.57;
            break;
        case parseFloat(0.07625):
            pl = 0.566;
            break;
        case parseFloat(0.07750):
            pl = 0.563;
            break;
        case parseFloat(0.07875):
            pl = 0.559;
            break;
        case parseFloat(0.08000):
            pl = 0.555;
            break;
        case parseFloat(0.08125):
            pl = 0.551;
            break;
        case parseFloat(0.08250):
            pl = 0.548;
            break;
        case parseFloat(0.08375):
            pl = 0.544;
            break;
        case parseFloat(0.08500):
            pl = 0.54;
            break;
        case parseFloat(0.08625):
            pl = 0.537;
            break;
        case parseFloat(0.08750):
            pl = 0.533;
            break;
        case parseFloat(0.08875):
            pl = 0.53;
            break;
        case parseFloat(0.09000):
            pl = 0.526;
            break;
        case parseFloat(0.09125):
            pl = 0.523;
            break;
        case parseFloat(0.09250):
            pl = 0.519;
            break;
        case parseFloat(0.09375):
            pl = 0.516;
            break;
        case parseFloat(0.09500):
            pl = 0.512;
            break;
        case parseFloat(0.09625):
            pl = 0.509;
            break;
        case parseFloat(0.09750):
            pl = 0.506;
            break;
        case parseFloat(0.09875):
            pl = 0.502;
            break;
        }
        break;
    case 91:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.74;
            break;
        case parseFloat(0.03125):
            pl = 0.736;
            break;
        case parseFloat(0.03250):
            pl = 0.731;
            break;
        case parseFloat(0.03375):
            pl = 0.726;
            break;
        case parseFloat(0.03500):
            pl = 0.721;
            break;
        case parseFloat(0.03625):
            pl = 0.717;
            break;
        case parseFloat(0.03750):
            pl = 0.712;
            break;
        case parseFloat(0.03875):
            pl = 0.707;
            break;
        case parseFloat(0.04000):
            pl = 0.703;
            break;
        case parseFloat(0.04125):
            pl = 0.698;
            break;
        case parseFloat(0.04250):
            pl = 0.694;
            break;
        case parseFloat(0.04375):
            pl = 0.689;
            break;
        case parseFloat(0.04500):
            pl = 0.685;
            break;
        case parseFloat(0.04625):
            pl = 0.68;
            break;
        case parseFloat(0.04750):
            pl = 0.676;
            break;
        case parseFloat(0.04875):
            pl = 0.672;
            break;
        case parseFloat(0.05000):
            pl = 0.667;
            break;
        case parseFloat(0.05125):
            pl = 0.663;
            break;
        case parseFloat(0.05250):
            pl = 0.659;
            break;
        case parseFloat(0.05375):
            pl = 0.655;
            break;
        case parseFloat(0.05500):
            pl = 0.651;
            break;
        case parseFloat(0.05625):
            pl = 0.646;
            break;
        case parseFloat(0.05750):
            pl = 0.642;
            break;
        case parseFloat(0.05875):
            pl = 0.638;
            break;
        case parseFloat(0.06000):
            pl = 0.634;
            break;
        case parseFloat(0.06125):
            pl = 0.63;
            break;
        case parseFloat(0.06250):
            pl = 0.626;
            break;
        case parseFloat(0.06375):
            pl = 0.622;
            break;
        case parseFloat(0.06500):
            pl = 0.618;
            break;
        case parseFloat(0.06625):
            pl = 0.614;
            break;
        case parseFloat(0.06750):
            pl = 0.61;
            break;
        case parseFloat(0.06875):
            pl = 0.607;
            break;
        case parseFloat(0.07000):
            pl = 0.603;
            break;
        case parseFloat(0.07125):
            pl = 0.599;
            break;
        case parseFloat(0.07250):
            pl = 0.595;
            break;
        case parseFloat(0.07375):
            pl = 0.592;
            break;
        case parseFloat(0.07500):
            pl = 0.588;
            break;
        case parseFloat(0.07625):
            pl = 0.584;
            break;
        case parseFloat(0.07750):
            pl = 0.581;
            break;
        case parseFloat(0.07875):
            pl = 0.577;
            break;
        case parseFloat(0.08000):
            pl = 0.573;
            break;
        case parseFloat(0.08125):
            pl = 0.57;
            break;
        case parseFloat(0.08250):
            pl = 0.566;
            break;
        case parseFloat(0.08375):
            pl = 0.563;
            break;
        case parseFloat(0.08500):
            pl = 0.559;
            break;
        case parseFloat(0.08625):
            pl = 0.556;
            break;
        case parseFloat(0.08750):
            pl = 0.552;
            break;
        case parseFloat(0.08875):
            pl = 0.549;
            break;
        case parseFloat(0.09000):
            pl = 0.546;
            break;
        case parseFloat(0.09125):
            pl = 0.542;
            break;
        case parseFloat(0.09250):
            pl = 0.539;
            break;
        case parseFloat(0.09375):
            pl = 0.535;
            break;
        case parseFloat(0.09500):
            pl = 0.532;
            break;
        case parseFloat(0.09625):
            pl = 0.529;
            break;
        case parseFloat(0.09750):
            pl = 0.526;
            break;
        case parseFloat(0.09875):
            pl = 0.522;
            break;
        }
        break;
    case 92:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.75;
            break;
        case parseFloat(0.03125):
            pl = 0.746;
            break;
        case parseFloat(0.03250):
            pl = 0.742;
            break;
        case parseFloat(0.03375):
            pl = 0.737;
            break;
        case parseFloat(0.03500):
            pl = 0.733;
            break;
        case parseFloat(0.03625):
            pl = 0.728;
            break;
        case parseFloat(0.03750):
            pl = 0.724;
            break;
        case parseFloat(0.03875):
            pl = 0.72;
            break;
        case parseFloat(0.04000):
            pl = 0.715;
            break;
        case parseFloat(0.04125):
            pl = 0.711;
            break;
        case parseFloat(0.04250):
            pl = 0.707;
            break;
        case parseFloat(0.04375):
            pl = 0.703;
            break;
        case parseFloat(0.04500):
            pl = 0.698;
            break;
        case parseFloat(0.04625):
            pl = 0.694;
            break;
        case parseFloat(0.04750):
            pl = 0.69;
            break;
        case parseFloat(0.04875):
            pl = 0.686;
            break;
        case parseFloat(0.05000):
            pl = 0.682;
            break;
        case parseFloat(0.05125):
            pl = 0.678;
            break;
        case parseFloat(0.05250):
            pl = 0.674;
            break;
        case parseFloat(0.05375):
            pl = 0.67;
            break;
        case parseFloat(0.05500):
            pl = 0.666;
            break;
        case parseFloat(0.05625):
            pl = 0.662;
            break;
        case parseFloat(0.05750):
            pl = 0.658;
            break;
        case parseFloat(0.05875):
            pl = 0.654;
            break;
        case parseFloat(0.06000):
            pl = 0.65;
            break;
        case parseFloat(0.06125):
            pl = 0.646;
            break;
        case parseFloat(0.06250):
            pl = 0.643;
            break;
        case parseFloat(0.06375):
            pl = 0.639;
            break;
        case parseFloat(0.06500):
            pl = 0.635;
            break;
        case parseFloat(0.06625):
            pl = 0.631;
            break;
        case parseFloat(0.06750):
            pl = 0.628;
            break;
        case parseFloat(0.06875):
            pl = 0.624;
            break;
        case parseFloat(0.07000):
            pl = 0.62;
            break;
        case parseFloat(0.07125):
            pl = 0.617;
            break;
        case parseFloat(0.07250):
            pl = 0.613;
            break;
        case parseFloat(0.07375):
            pl = 0.61;
            break;
        case parseFloat(0.07500):
            pl = 0.606;
            break;
        case parseFloat(0.07625):
            pl = 0.603;
            break;
        case parseFloat(0.07750):
            pl = 0.599;
            break;
        case parseFloat(0.07875):
            pl = 0.596;
            break;
        case parseFloat(0.08000):
            pl = 0.592;
            break;
        case parseFloat(0.08125):
            pl = 0.589;
            break;
        case parseFloat(0.08250):
            pl = 0.586;
            break;
        case parseFloat(0.08375):
            pl = 0.582;
            break;
        case parseFloat(0.08500):
            pl = 0.579;
            break;
        case parseFloat(0.08625):
            pl = 0.575;
            break;
        case parseFloat(0.08750):
            pl = 0.572;
            break;
        case parseFloat(0.08875):
            pl = 0.569;
            break;
        case parseFloat(0.09000):
            pl = 0.566;
            break;
        case parseFloat(0.09125):
            pl = 0.562;
            break;
        case parseFloat(0.09250):
            pl = 0.559;
            break;
        case parseFloat(0.09375):
            pl = 0.556;
            break;
        case parseFloat(0.09500):
            pl = 0.553;
            break;
        case parseFloat(0.09625):
            pl = 0.55;
            break;
        case parseFloat(0.09750):
            pl = 0.547;
            break;
        case parseFloat(0.09875):
            pl = 0.543;
            break;
        }
        break;
    case 93:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.75;
            break;
        case parseFloat(0.03125):
            pl = 0.75;
            break;
        case parseFloat(0.03250):
            pl = 0.75;
            break;
        case parseFloat(0.03375):
            pl = 0.749;
            break;
        case parseFloat(0.03500):
            pl = 0.744;
            break;
        case parseFloat(0.03625):
            pl = 0.74;
            break;
        case parseFloat(0.03750):
            pl = 0.736;
            break;
        case parseFloat(0.03875):
            pl = 0.732;
            break;
        case parseFloat(0.04000):
            pl = 0.728;
            break;
        case parseFloat(0.04125):
            pl = 0.724;
            break;
        case parseFloat(0.04250):
            pl = 0.72;
            break;
        case parseFloat(0.04375):
            pl = 0.716;
            break;
        case parseFloat(0.04500):
            pl = 0.712;
            break;
        case parseFloat(0.04625):
            pl = 0.708;
            break;
        case parseFloat(0.04750):
            pl = 0.704;
            break;
        case parseFloat(0.04875):
            pl = 0.701;
            break;
        case parseFloat(0.05000):
            pl = 0.697;
            break;
        case parseFloat(0.05125):
            pl = 0.693;
            break;
        case parseFloat(0.05250):
            pl = 0.689;
            break;
        case parseFloat(0.05375):
            pl = 0.685;
            break;
        case parseFloat(0.05500):
            pl = 0.682;
            break;
        case parseFloat(0.05625):
            pl = 0.678;
            break;
        case parseFloat(0.05750):
            pl = 0.674;
            break;
        case parseFloat(0.05875):
            pl = 0.671;
            break;
        case parseFloat(0.06000):
            pl = 0.667;
            break;
        case parseFloat(0.06125):
            pl = 0.663;
            break;
        case parseFloat(0.06250):
            pl = 0.66;
            break;
        case parseFloat(0.06375):
            pl = 0.656;
            break;
        case parseFloat(0.06500):
            pl = 0.653;
            break;
        case parseFloat(0.06625):
            pl = 0.649;
            break;
        case parseFloat(0.06750):
            pl = 0.646;
            break;
        case parseFloat(0.06875):
            pl = 0.642;
            break;
        case parseFloat(0.07000):
            pl = 0.639;
            break;
        case parseFloat(0.07125):
            pl = 0.635;
            break;
        case parseFloat(0.07250):
            pl = 0.632;
            break;
        case parseFloat(0.07375):
            pl = 0.629;
            break;
        case parseFloat(0.07500):
            pl = 0.625;
            break;
        case parseFloat(0.07625):
            pl = 0.622;
            break;
        case parseFloat(0.07750):
            pl = 0.619;
            break;
        case parseFloat(0.07875):
            pl = 0.615;
            break;
        case parseFloat(0.08000):
            pl = 0.612;
            break;
        case parseFloat(0.08125):
            pl = 0.609;
            break;
        case parseFloat(0.08250):
            pl = 0.606;
            break;
        case parseFloat(0.08375):
            pl = 0.602;
            break;
        case parseFloat(0.08500):
            pl = 0.599;
            break;
        case parseFloat(0.08625):
            pl = 0.596;
            break;
        case parseFloat(0.08750):
            pl = 0.593;
            break;
        case parseFloat(0.08875):
            pl = 0.59;
            break;
        case parseFloat(0.09000):
            pl = 0.587;
            break;
        case parseFloat(0.09125):
            pl = 0.584;
            break;
        case parseFloat(0.09250):
            pl = 0.58;
            break;
        case parseFloat(0.09375):
            pl = 0.577;
            break;
        case parseFloat(0.09500):
            pl = 0.574;
            break;
        case parseFloat(0.09625):
            pl = 0.571;
            break;
        case parseFloat(0.09750):
            pl = 0.568;
            break;
        case parseFloat(0.09875):
            pl = 0.565;
            break;
        }
        break;
    case 94:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.75;
            break;
        case parseFloat(0.03125):
            pl = 0.75;
            break;
        case parseFloat(0.03250):
            pl = 0.75;
            break;
        case parseFloat(0.03375):
            pl = 0.75;
            break;
        case parseFloat(0.03500):
            pl = 0.75;
            break;
        case parseFloat(0.03625):
            pl = 0.75;
            break;
        case parseFloat(0.03750):
            pl = 0.749;
            break;
        case parseFloat(0.03875):
            pl = 0.745;
            break;
        case parseFloat(0.04000):
            pl = 0.741;
            break;
        case parseFloat(0.04125):
            pl = 0.737;
            break;
        case parseFloat(0.04250):
            pl = 0.734;
            break;
        case parseFloat(0.04375):
            pl = 0.73;
            break;
        case parseFloat(0.04500):
            pl = 0.726;
            break;
        case parseFloat(0.04625):
            pl = 0.723;
            break;
        case parseFloat(0.04750):
            pl = 0.719;
            break;
        case parseFloat(0.04875):
            pl = 0.715;
            break;
        case parseFloat(0.05000):
            pl = 0.712;
            break;
        case parseFloat(0.05125):
            pl = 0.708;
            break;
        case parseFloat(0.05250):
            pl = 0.705;
            break;
        case parseFloat(0.05375):
            pl = 0.701;
            break;
        case parseFloat(0.05500):
            pl = 0.698;
            break;
        case parseFloat(0.05625):
            pl = 0.694;
            break;
        case parseFloat(0.05750):
            pl = 0.691;
            break;
        case parseFloat(0.05875):
            pl = 0.688;
            break;
        case parseFloat(0.06000):
            pl = 0.684;
            break;
        case parseFloat(0.06125):
            pl = 0.681;
            break;
        case parseFloat(0.06250):
            pl = 0.677;
            break;
        case parseFloat(0.06375):
            pl = 0.674;
            break;
        case parseFloat(0.06500):
            pl = 0.671;
            break;
        case parseFloat(0.06625):
            pl = 0.667;
            break;
        case parseFloat(0.06750):
            pl = 0.664;
            break;
        case parseFloat(0.06875):
            pl = 0.661;
            break;
        case parseFloat(0.07000):
            pl = 0.658;
            break;
        case parseFloat(0.07125):
            pl = 0.654;
            break;
        case parseFloat(0.07250):
            pl = 0.651;
            break;
        case parseFloat(0.07375):
            pl = 0.648;
            break;
        case parseFloat(0.07500):
            pl = 0.645;
            break;
        case parseFloat(0.07625):
            pl = 0.642;
            break;
        case parseFloat(0.07750):
            pl = 0.639;
            break;
        case parseFloat(0.07875):
            pl = 0.636;
            break;
        case parseFloat(0.08000):
            pl = 0.633;
            break;
        case parseFloat(0.08125):
            pl = 0.629;
            break;
        case parseFloat(0.08250):
            pl = 0.626;
            break;
        case parseFloat(0.08375):
            pl = 0.623;
            break;
        case parseFloat(0.08500):
            pl = 0.62;
            break;
        case parseFloat(0.08625):
            pl = 0.617;
            break;
        case parseFloat(0.08750):
            pl = 0.614;
            break;
        case parseFloat(0.08875):
            pl = 0.611;
            break;
        case parseFloat(0.09000):
            pl = 0.609;
            break;
        case parseFloat(0.09125):
            pl = 0.606;
            break;
        case parseFloat(0.09250):
            pl = 0.603;
            break;
        case parseFloat(0.09375):
            pl = 0.6;
            break;
        case parseFloat(0.09500):
            pl = 0.597;
            break;
        case parseFloat(0.09625):
            pl = 0.594;
            break;
        case parseFloat(0.09750):
            pl = 0.591;
            break;
        case parseFloat(0.09875):
            pl = 0.588;
            break;
        }
        break;
    case 95:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.75;
            break;
        case parseFloat(0.03125):
            pl = 0.75;
            break;
        case parseFloat(0.03250):
            pl = 0.75;
            break;
        case parseFloat(0.03375):
            pl = 0.75;
            break;
        case parseFloat(0.03500):
            pl = 0.75;
            break;
        case parseFloat(0.03625):
            pl = 0.75;
            break;
        case parseFloat(0.03750):
            pl = 0.75;
            break;
        case parseFloat(0.03875):
            pl = 0.75;
            break;
        case parseFloat(0.04000):
            pl = 0.75;
            break;
        case parseFloat(0.04125):
            pl = 0.75;
            break;
        case parseFloat(0.04250):
            pl = 0.747;
            break;
        case parseFloat(0.04375):
            pl = 0.743;
            break;
        case parseFloat(0.04500):
            pl = 0.74;
            break;
        case parseFloat(0.04625):
            pl = 0.737;
            break;
        case parseFloat(0.04750):
            pl = 0.733;
            break;
        case parseFloat(0.04875):
            pl = 0.73;
            break;
        case parseFloat(0.05000):
            pl = 0.727;
            break;
        case parseFloat(0.05125):
            pl = 0.723;
            break;
        case parseFloat(0.05250):
            pl = 0.72;
            break;
        case parseFloat(0.05375):
            pl = 0.717;
            break;
        case parseFloat(0.05500):
            pl = 0.714;
            break;
        case parseFloat(0.05625):
            pl = 0.71;
            break;
        case parseFloat(0.05750):
            pl = 0.707;
            break;
        case parseFloat(0.05875):
            pl = 0.704;
            break;
        case parseFloat(0.06000):
            pl = 0.701;
            break;
        case parseFloat(0.06125):
            pl = 0.698;
            break;
        case parseFloat(0.06250):
            pl = 0.695;
            break;
        case parseFloat(0.06375):
            pl = 0.691;
            break;
        case parseFloat(0.06500):
            pl = 0.688;
            break;
        case parseFloat(0.06625):
            pl = 0.685;
            break;
        case parseFloat(0.06750):
            pl = 0.682;
            break;
        case parseFloat(0.06875):
            pl = 0.679;
            break;
        case parseFloat(0.07000):
            pl = 0.676;
            break;
        case parseFloat(0.07125):
            pl = 0.673;
            break;
        case parseFloat(0.07250):
            pl = 0.67;
            break;
        case parseFloat(0.07375):
            pl = 0.667;
            break;
        case parseFloat(0.07500):
            pl = 0.664;
            break;
        case parseFloat(0.07625):
            pl = 0.661;
            break;
        case parseFloat(0.07750):
            pl = 0.658;
            break;
        case parseFloat(0.07875):
            pl = 0.656;
            break;
        case parseFloat(0.08000):
            pl = 0.653;
            break;
        case parseFloat(0.08125):
            pl = 0.65;
            break;
        case parseFloat(0.08250):
            pl = 0.647;
            break;
        case parseFloat(0.08375):
            pl = 0.644;
            break;
        case parseFloat(0.08500):
            pl = 0.641;
            break;
        case parseFloat(0.08625):
            pl = 0.638;
            break;
        case parseFloat(0.08750):
            pl = 0.636;
            break;
        case parseFloat(0.08875):
            pl = 0.633;
            break;
        case parseFloat(0.09000):
            pl = 0.63;
            break;
        case parseFloat(0.09125):
            pl = 0.627;
            break;
        case parseFloat(0.09250):
            pl = 0.625;
            break;
        case parseFloat(0.09375):
            pl = 0.622;
            break;
        case parseFloat(0.09500):
            pl = 0.619;
            break;
        case parseFloat(0.09625):
            pl = 0.616;
            break;
        case parseFloat(0.09750):
            pl = 0.614;
            break;
        case parseFloat(0.09875):
            pl = 0.611;
            break;
        }
        break;
    case 96:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.75;
            break;
        case parseFloat(0.03125):
            pl = 0.75;
            break;
        case parseFloat(0.03250):
            pl = 0.75;
            break;
        case parseFloat(0.03375):
            pl = 0.75;
            break;
        case parseFloat(0.03500):
            pl = 0.75;
            break;
        case parseFloat(0.03625):
            pl = 0.75;
            break;
        case parseFloat(0.03750):
            pl = 0.75;
            break;
        case parseFloat(0.03875):
            pl = 0.75;
            break;
        case parseFloat(0.04000):
            pl = 0.75;
            break;
        case parseFloat(0.04125):
            pl = 0.75;
            break;
        case parseFloat(0.04250):
            pl = 0.75;
            break;
        case parseFloat(0.04375):
            pl = 0.75;
            break;
        case parseFloat(0.04500):
            pl = 0.747;
            break;
        case parseFloat(0.04625):
            pl = 0.744;
            break;
        case parseFloat(0.04750):
            pl = 0.741;
            break;
        case parseFloat(0.04875):
            pl = 0.737;
            break;
        case parseFloat(0.05000):
            pl = 0.734;
            break;
        case parseFloat(0.05125):
            pl = 0.731;
            break;
        case parseFloat(0.05250):
            pl = 0.728;
            break;
        case parseFloat(0.05375):
            pl = 0.725;
            break;
        case parseFloat(0.05500):
            pl = 0.722;
            break;
        case parseFloat(0.05625):
            pl = 0.719;
            break;
        case parseFloat(0.05750):
            pl = 0.716;
            break;
        case parseFloat(0.05875):
            pl = 0.713;
            break;
        case parseFloat(0.06000):
            pl = 0.71;
            break;
        case parseFloat(0.06125):
            pl = 0.706;
            break;
        case parseFloat(0.06250):
            pl = 0.703;
            break;
        case parseFloat(0.06375):
            pl = 0.7;
            break;
        case parseFloat(0.06500):
            pl = 0.698;
            break;
        case parseFloat(0.06625):
            pl = 0.695;
            break;
        case parseFloat(0.06750):
            pl = 0.692;
            break;
        case parseFloat(0.06875):
            pl = 0.689;
            break;
        case parseFloat(0.07000):
            pl = 0.686;
            break;
        case parseFloat(0.07125):
            pl = 0.683;
            break;
        case parseFloat(0.07250):
            pl = 0.68;
            break;
        case parseFloat(0.07375):
            pl = 0.677;
            break;
        case parseFloat(0.07500):
            pl = 0.674;
            break;
        case parseFloat(0.07625):
            pl = 0.671;
            break;
        case parseFloat(0.07750):
            pl = 0.669;
            break;
        case parseFloat(0.07875):
            pl = 0.666;
            break;
        case parseFloat(0.08000):
            pl = 0.663;
            break;
        case parseFloat(0.08125):
            pl = 0.66;
            break;
        case parseFloat(0.08250):
            pl = 0.657;
            break;
        case parseFloat(0.08375):
            pl = 0.655;
            break;
        case parseFloat(0.08500):
            pl = 0.652;
            break;
        case parseFloat(0.08625):
            pl = 0.649;
            break;
        case parseFloat(0.08750):
            pl = 0.647;
            break;
        case parseFloat(0.08875):
            pl = 0.644;
            break;
        case parseFloat(0.09000):
            pl = 0.641;
            break;
        case parseFloat(0.09125):
            pl = 0.639;
            break;
        case parseFloat(0.09250):
            pl = 0.636;
            break;
        case parseFloat(0.09375):
            pl = 0.633;
            break;
        case parseFloat(0.09500):
            pl = 0.631;
            break;
        case parseFloat(0.09625):
            pl = 0.628;
            break;
        case parseFloat(0.09750):
            pl = 0.625;
            break;
        case parseFloat(0.09875):
            pl = 0.623;
            break;
        }
        break;
    case 97:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.75;
            break;
        case parseFloat(0.03125):
            pl = 0.75;
            break;
        case parseFloat(0.03250):
            pl = 0.75;
            break;
        case parseFloat(0.03375):
            pl = 0.75;
            break;
        case parseFloat(0.03500):
            pl = 0.75;
            break;
        case parseFloat(0.03625):
            pl = 0.75;
            break;
        case parseFloat(0.03750):
            pl = 0.75;
            break;
        case parseFloat(0.03875):
            pl = 0.75;
            break;
        case parseFloat(0.04000):
            pl = 0.75;
            break;
        case parseFloat(0.04125):
            pl = 0.75;
            break;
        case parseFloat(0.04250):
            pl = 0.75;
            break;
        case parseFloat(0.04375):
            pl = 0.75;
            break;
        case parseFloat(0.04500):
            pl = 0.75;
            break;
        case parseFloat(0.04625):
            pl = 0.749;
            break;
        case parseFloat(0.04750):
            pl = 0.746;
            break;
        case parseFloat(0.04875):
            pl = 0.743;
            break;
        case parseFloat(0.05000):
            pl = 0.74;
            break;
        case parseFloat(0.05125):
            pl = 0.737;
            break;
        case parseFloat(0.05250):
            pl = 0.734;
            break;
        case parseFloat(0.05375):
            pl = 0.731;
            break;
        case parseFloat(0.05500):
            pl = 0.728;
            break;
        case parseFloat(0.05625):
            pl = 0.725;
            break;
        case parseFloat(0.05750):
            pl = 0.722;
            break;
        case parseFloat(0.05875):
            pl = 0.719;
            break;
        case parseFloat(0.06000):
            pl = 0.716;
            break;
        case parseFloat(0.06125):
            pl = 0.713;
            break;
        case parseFloat(0.06250):
            pl = 0.71;
            break;
        case parseFloat(0.06375):
            pl = 0.707;
            break;
        case parseFloat(0.06500):
            pl = 0.704;
            break;
        case parseFloat(0.06625):
            pl = 0.701;
            break;
        case parseFloat(0.06750):
            pl = 0.699;
            break;
        case parseFloat(0.06875):
            pl = 0.696;
            break;
        case parseFloat(0.07000):
            pl = 0.693;
            break;
        case parseFloat(0.07125):
            pl = 0.69;
            break;
        case parseFloat(0.07250):
            pl = 0.687;
            break;
        case parseFloat(0.07375):
            pl = 0.684;
            break;
        case parseFloat(0.07500):
            pl = 0.682;
            break;
        case parseFloat(0.07625):
            pl = 0.679;
            break;
        case parseFloat(0.07750):
            pl = 0.676;
            break;
        case parseFloat(0.07875):
            pl = 0.673;
            break;
        case parseFloat(0.08000):
            pl = 0.671;
            break;
        case parseFloat(0.08125):
            pl = 0.668;
            break;
        case parseFloat(0.08250):
            pl = 0.665;
            break;
        case parseFloat(0.08375):
            pl = 0.663;
            break;
        case parseFloat(0.08500):
            pl = 0.66;
            break;
        case parseFloat(0.08625):
            pl = 0.657;
            break;
        case parseFloat(0.08750):
            pl = 0.655;
            break;
        case parseFloat(0.08875):
            pl = 0.652;
            break;
        case parseFloat(0.09000):
            pl = 0.65;
            break;
        case parseFloat(0.09125):
            pl = 0.647;
            break;
        case parseFloat(0.09250):
            pl = 0.644;
            break;
        case parseFloat(0.09375):
            pl = 0.642;
            break;
        case parseFloat(0.09500):
            pl = 0.639;
            break;
        case parseFloat(0.09625):
            pl = 0.637;
            break;
        case parseFloat(0.09750):
            pl = 0.634;
            break;
        case parseFloat(0.09875):
            pl = 0.632;
            break;
        }
        break;
    case 98:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.75;
            break;
        case parseFloat(0.03125):
            pl = 0.75;
            break;
        case parseFloat(0.03250):
            pl = 0.75;
            break;
        case parseFloat(0.03375):
            pl = 0.75;
            break;
        case parseFloat(0.03500):
            pl = 0.75;
            break;
        case parseFloat(0.03625):
            pl = 0.75;
            break;
        case parseFloat(0.03750):
            pl = 0.75;
            break;
        case parseFloat(0.03875):
            pl = 0.75;
            break;
        case parseFloat(0.04000):
            pl = 0.75;
            break;
        case parseFloat(0.04125):
            pl = 0.75;
            break;
        case parseFloat(0.04250):
            pl = 0.75;
            break;
        case parseFloat(0.04375):
            pl = 0.75;
            break;
        case parseFloat(0.04500):
            pl = 0.75;
            break;
        case parseFloat(0.04625):
            pl = 0.749;
            break;
        case parseFloat(0.04750):
            pl = 0.746;
            break;
        case parseFloat(0.04875):
            pl = 0.743;
            break;
        case parseFloat(0.05000):
            pl = 0.74;
            break;
        case parseFloat(0.05125):
            pl = 0.737;
            break;
        case parseFloat(0.05250):
            pl = 0.734;
            break;
        case parseFloat(0.05375):
            pl = 0.731;
            break;
        case parseFloat(0.05500):
            pl = 0.728;
            break;
        case parseFloat(0.05625):
            pl = 0.725;
            break;
        case parseFloat(0.05750):
            pl = 0.722;
            break;
        case parseFloat(0.05875):
            pl = 0.719;
            break;
        case parseFloat(0.06000):
            pl = 0.716;
            break;
        case parseFloat(0.06125):
            pl = 0.713;
            break;
        case parseFloat(0.06250):
            pl = 0.71;
            break;
        case parseFloat(0.06375):
            pl = 0.707;
            break;
        case parseFloat(0.06500):
            pl = 0.704;
            break;
        case parseFloat(0.06625):
            pl = 0.701;
            break;
        case parseFloat(0.06750):
            pl = 0.699;
            break;
        case parseFloat(0.06875):
            pl = 0.696;
            break;
        case parseFloat(0.07000):
            pl = 0.693;
            break;
        case parseFloat(0.07125):
            pl = 0.69;
            break;
        case parseFloat(0.07250):
            pl = 0.687;
            break;
        case parseFloat(0.07375):
            pl = 0.684;
            break;
        case parseFloat(0.07500):
            pl = 0.682;
            break;
        case parseFloat(0.07625):
            pl = 0.679;
            break;
        case parseFloat(0.07750):
            pl = 0.676;
            break;
        case parseFloat(0.07875):
            pl = 0.673;
            break;
        case parseFloat(0.08000):
            pl = 0.671;
            break;
        case parseFloat(0.08125):
            pl = 0.668;
            break;
        case parseFloat(0.08250):
            pl = 0.665;
            break;
        case parseFloat(0.08375):
            pl = 0.663;
            break;
        case parseFloat(0.08500):
            pl = 0.66;
            break;
        case parseFloat(0.08625):
            pl = 0.657;
            break;
        case parseFloat(0.08750):
            pl = 0.655;
            break;
        case parseFloat(0.08875):
            pl = 0.652;
            break;
        case parseFloat(0.09000):
            pl = 0.65;
            break;
        case parseFloat(0.09125):
            pl = 0.647;
            break;
        case parseFloat(0.09250):
            pl = 0.644;
            break;
        case parseFloat(0.09375):
            pl = 0.642;
            break;
        case parseFloat(0.09500):
            pl = 0.639;
            break;
        case parseFloat(0.09625):
            pl = 0.637;
            break;
        case parseFloat(0.09750):
            pl = 0.634;
            break;
        case parseFloat(0.09875):
            pl = 0.632;
            break;
        }
        break;
    case 99:
        switch (rate) {
        case parseFloat(0.03000):
            pl = 0.75;
            break;
        case parseFloat(0.03125):
            pl = 0.75;
            break;
        case parseFloat(0.03250):
            pl = 0.75;
            break;
        case parseFloat(0.03375):
            pl = 0.75;
            break;
        case parseFloat(0.03500):
            pl = 0.75;
            break;
        case parseFloat(0.03625):
            pl = 0.75;
            break;
        case parseFloat(0.03750):
            pl = 0.75;
            break;
        case parseFloat(0.03875):
            pl = 0.75;
            break;
        case parseFloat(0.04000):
            pl = 0.75;
            break;
        case parseFloat(0.04125):
            pl = 0.75;
            break;
        case parseFloat(0.04250):
            pl = 0.75;
            break;
        case parseFloat(0.04375):
            pl = 0.75;
            break;
        case parseFloat(0.04500):
            pl = 0.75;
            break;
        case parseFloat(0.04625):
            pl = 0.749;
            break;
        case parseFloat(0.04750):
            pl = 0.746;
            break;
        case parseFloat(0.04875):
            pl = 0.743;
            break;
        case parseFloat(0.05000):
            pl = 0.74;
            break;
        case parseFloat(0.05125):
            pl = 0.737;
            break;
        case parseFloat(0.05250):
            pl = 0.734;
            break;
        case parseFloat(0.05375):
            pl = 0.731;
            break;
        case parseFloat(0.05500):
            pl = 0.728;
            break;
        case parseFloat(0.05625):
            pl = 0.725;
            break;
        case parseFloat(0.05750):
            pl = 0.722;
            break;
        case parseFloat(0.05875):
            pl = 0.719;
            break;
        case parseFloat(0.06000):
            pl = 0.716;
            break;
        case parseFloat(0.06125):
            pl = 0.713;
            break;
        case parseFloat(0.06250):
            pl = 0.71;
            break;
        case parseFloat(0.06375):
            pl = 0.707;
            break;
        case parseFloat(0.06500):
            pl = 0.704;
            break;
        case parseFloat(0.06625):
            pl = 0.701;
            break;
        case parseFloat(0.06750):
            pl = 0.699;
            break;
        case parseFloat(0.06875):
            pl = 0.696;
            break;
        case parseFloat(0.07000):
            pl = 0.693;
            break;
        case parseFloat(0.07125):
            pl = 0.69;
            break;
        case parseFloat(0.07250):
            pl = 0.687;
            break;
        case parseFloat(0.07375):
            pl = 0.684;
            break;
        case parseFloat(0.07500):
            pl = 0.682;
            break;
        case parseFloat(0.07625):
            pl = 0.679;
            break;
        case parseFloat(0.07750):
            pl = 0.676;
            break;
        case parseFloat(0.07875):
            pl = 0.673;
            break;
        case parseFloat(0.08000):
            pl = 0.671;
            break;
        case parseFloat(0.08125):
            pl = 0.668;
            break;
        case parseFloat(0.08250):
            pl = 0.665;
            break;
        case parseFloat(0.08375):
            pl = 0.663;
            break;
        case parseFloat(0.08500):
            pl = 0.66;
            break;
        case parseFloat(0.08625):
            pl = 0.657;
            break;
        case parseFloat(0.08750):
            pl = 0.655;
            break;
        case parseFloat(0.08875):
            pl = 0.652;
            break;
        case parseFloat(0.09000):
            pl = 0.65;
            break;
        case parseFloat(0.09125):
            pl = 0.647;
            break;
        case parseFloat(0.09250):
            pl = 0.644;
            break;
        case parseFloat(0.09375):
            pl = 0.642;
            break;
        case parseFloat(0.09500):
            pl = 0.639;
            break;
        case parseFloat(0.09625):
            pl = 0.637;
            break;
        case parseFloat(0.09750):
            pl = 0.634;
            break;
        case parseFloat(0.09875):
            pl = 0.632;
            break;
        }
        break;
    }
    return pl;
}