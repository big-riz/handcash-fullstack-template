
import * as ConnectAll from "@handcash/sdk";

console.log("All @handcash/sdk exports:");
console.log(Object.keys(ConnectAll));

const Connect = (ConnectAll as any).Connect;
if (Connect) {
    console.log("\nConnect object prototype methods:");
    console.log(Object.getOwnPropertyNames(Connect));
} else {
    console.log("\nConnect not found in exports.");
}
