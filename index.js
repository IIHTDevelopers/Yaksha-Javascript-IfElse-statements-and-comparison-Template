// Declare variables for comparison
var num1 = 10;
var num2 = 20;
var name = "Alice";

// Using if/else with comparison operators
if (num1 > num2) {
    console.log("num1 is greater than num2");
} else {
    console.log("num1 is not greater than num2");
}

if (num1 === num2) {
    console.log("num1 is equal to num2");
} else {
    console.log("num1 is not equal to num2");
}

if (name === "Alice") {
    console.log("Hello Alice!");
} else {
    console.log("Hello Stranger!");
}

if (num1 <= num2) {
    console.log("num1 is less than or equal to num2");
}

// Additional checks with 'else if'
if (num1 < num2) {
    console.log("num1 is less than num2");
} else if (num1 === num2) {
    console.log("num1 is equal to num2");
} else {
    console.log("num1 is greater than num2");
}
