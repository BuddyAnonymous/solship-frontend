import { createHash } from 'crypto-browserify';
import { SeededRNG } from "./seededRng";
import { blake3 } from "hash-wasm";

const rng = new SeededRNG(12345); // Example seed, ensure to use the same seed across both files for consistency

export type MerkleNode = {
    hash: string;
    left?: MerkleNode;
    right?: MerkleNode;
    data?: boolean; // Assuming the cell state is a boolean
    secret?: bigint; // u64 secret for each cell
    fieldIndex?: number; // Index of the field in the board
};

export async function hash(data: any, secret: bigint = BigInt(0)): Promise<string> {
    return await blake3(data)


    const hash = createHash('sha256');
    // Incorporate the secret into the hash. Convert bigint to a buffer/string as needed.
    hash.update(JSON.stringify(data) + secret.toString());
    return hash.digest('hex');
}

export async function constructMerkleTree(board: boolean[][]): Promise<MerkleNode> {
    let nodes: MerkleNode[] = await Promise.all(board.flat().map(async (cell, index) => {
        // Generate or assign a unique u64 secret for each cell
        const secret = BigInt(Math.floor(rng.random() * Number.MAX_SAFE_INTEGER));
        const buffer = new Uint8Array(2); // 2 bytes: one for index, one for shipPlaced
        buffer[0] = index; // First byte for index (0-255)
        buffer[1] = cell ? 1 : 0; // Second byte for shipPlaced (boolean to 0 or 1)
        const h = await hash(buffer, secret);
        console.log("Buffer for index", index, "and cell", cell, ":", buffer);
        console.log("Hash: ", h)
        return { hash: h, data: cell, secret: secret, fieldIndex: index };
    }));

    // Calculate the next power of 2 greater than or equal to the length of nodes
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log(nodes.length) / Math.log(2)));

    // Add default nodes to make the total count a power of 2
    while (nodes.length < nextPowerOf2) {
        const buffer = new Uint8Array(2);
        nodes.push({ hash: await hash(buffer), data: undefined, secret: 0n });
    }

    while (nodes.length > 1) {
        const parentNodes: MerkleNode[] = [];
        for (let i = 0; i < nodes.length; i += 2) {
            const left = nodes[i];
            const right = nodes[i + 1]; // No need to handle odd number of nodes now
            const leftHash = hexToUint8Array(left.hash);
            const rightHash = hexToUint8Array(right.hash);
            const combinedHash = new Uint8Array(leftHash.length + rightHash.length);
            combinedHash.set(leftHash);
            combinedHash.set(rightHash, leftHash.length);
            const parentHash = await hash(combinedHash);
            parentNodes.push({ hash: parentHash, left, right });
        }
        nodes = parentNodes;
    }
    return nodes[0]; // Root node
}

function hexToUint8Array(hex) {
    // Remove the '0x' prefix if it's present
    if (hex.startsWith('0x')) {
        hex = hex.slice(2);
    }

    // Ensure the hex string has an even length
    if (hex.length % 2 !== 0) {
        throw new Error("Hex string must have an even length");
    }

    const byteArray = new Uint8Array(hex.length / 2);

    for (let i = 0; i < hex.length; i += 2) {
        byteArray[i / 2] = parseInt(hex.substr(i, 2), 16);
    }

    return byteArray;
}

function printMerkleNode(node: MerkleNode | undefined, prefix: string = '', isLeft: boolean = true) {
    if (!node) {
        return;
    }

    const isLeaf = !node.left && !node.right;
    const shortHash = `${node.hash}`;
    const nodeInfo = isLeaf ? `${shortHash} (Data: ${node.data}, Secret:${node.secret}, Index:${node.fieldIndex})` : shortHash;
    console.log(prefix + (isLeft ? '├─' : '└─') + nodeInfo);

    printMerkleNode(node.left, prefix + (isLeft ? '│ ' : '  '), true);
    printMerkleNode(node.right, prefix + (isLeft ? '│ ' : '  '), false);
}

export function printMerkleTree(root: MerkleNode) {
    console.log('Root:');
    printMerkleNode(root);
}