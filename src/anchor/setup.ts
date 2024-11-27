import { AnchorProvider, IdlAccounts, IdlTypes, Program, setProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Solship } from "./solship.ts";
import IDL from "./solship.json";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { sha256 } from "js-sha256";

const connection = new Connection("http://127.0.0.1:8899", "confirmed");
// export const sessionKey = Keypair.generate();
// console.log("Session key test:", sessionKey)
let seed = localStorage.getItem("seed");
if (!seed) {
  // If the seed doesn't exist, set it in local storage
  seed = "fixed_seed_string";
  localStorage.setItem("seed", seed);
}

const seedHash = sha256.array(seed).slice(0, 32);
const seedUint8Array = new Uint8Array(seedHash);
export const sessionKey = Keypair.fromSeed(seedUint8Array);
console.log("Session key test:", sessionKey.publicKey.toString())


// Initialize the program interface with the IDL, program ID, and connection.
// This setup allows us to interact with the on-chain program using the defined interface.
export const sessionProgram = new Program<Solship>(IDL as Solship, new AnchorProvider(connection, new NodeWallet(sessionKey)));

export const program = new Program<Solship>(IDL as Solship, {
  connection,
});



setProvider(new AnchorProvider(connection, new NodeWallet(sessionKey)))

// This is just a TypeScript type for the account data structures based on the IDL
// We need this so TypeScript doesn't yell at us
export type Game = IdlAccounts<Solship>["game"];
export type Queue = IdlAccounts<Solship>["queue"];

export type GamePlayer = IdlTypes<Solship>["gamePlayer"];

export interface GameEvent {
  game: PublicKey;
  player1: PublicKey;
  player2: PublicKey;
}