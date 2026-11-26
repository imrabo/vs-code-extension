/**
 * Calculates the factorial of a non-negative integer using recursion.
 * @param {number} n The number to calculate the factorial for.
 * @returns {bigint} The factorial of n as a BigInt. Returns 1n if n is 0 or negative (though input validation should handle negatives).
 */
function factorial(n) {
    // Input validation: Factorial is only defined for non-negative integers.
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
        throw new Error("Factorial is only defined for non-negative integers.");
    }

    // Base case: factorial of 0 is 1.
    if (n === 0) {
        return 1n; // Use BigInt for accurate results with larger numbers
    }

    // Recursive step: n! = n * (n-1)!
    // We convert the result to BigInt at each multiplication step to prevent standard JavaScript number overflow.
    return BigInt(n) * factorial(n - 1);
}

// --- Testing the function ---

const testNumber1 = 5;
console.log(`Factorial of ${testNumber1}: ${factorial(testNumber1)}`); // Expected: 120

const testNumber2 = 0;
console.log(`Factorial of ${testNumber2}: ${factorial(testNumber2)}`); // Expected: 1

// Test a larger number that would overflow standard JS Number type (20! is large)
const testNumber3 = 25;
try {
    console.log(`Factorial of ${testNumber3}: ${factorial(testNumber3)}`);
} catch (e) {
    console.error("Error calculating factorial:", e.message);
}

// Test invalid input
try {
    factorial(-1);
} catch (e) {
    console.log("\nCaught expected error for negative number:", e.message);
}

try {
    factorial(5.5);
} catch (e) {
    console.log("Caught expected error for non-integer:", e.message);
}