import {createHash} from 'crypto-browserify';
import { SeededRNG } from "./seededRng";
const rng = new SeededRNG(12345); // Example seed, ensure to use the same seed across both files for consistency

export type MerkleNode = {
    hash: string;
    left?: MerkleNode;
    right?: MerkleNode;
    data?: boolean; // Assuming the cell state is a boolean
    secret?: bigint; // u64 secret for each cell
    fieldIndex?: number; // Index of the field in the board
};

export function hash(data: any, secret: bigint = BigInt(0)): string {
    const hash = createHash('sha256');
    // Incorporate the secret into the hash. Convert bigint to a buffer/string as needed.
    hash.update(JSON.stringify(data) + secret.toString());
    return hash.digest('hex');
}

export function constructMerkleTree(board: boolean[][]): MerkleNode {
    let nodes: MerkleNode[] = board.flat().map((cell, index) => {
        // Generate or assign a unique u64 secret for each cell
        const secret = BigInt(Math.floor(rng.random() * Number.MAX_SAFE_INTEGER));
        return { hash: hash(cell, secret), data: cell, secret: secret, fieldIndex: index };
    });

    // Calculate the next power of 2 greater than or equal to the length of nodes
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log(nodes.length) / Math.log(2)));

    // Add default nodes to make the total count a power of 2
    while (nodes.length < nextPowerOf2) {
        nodes.push({ hash: hash(null), data: undefined, secret: 0n});
    }

    while (nodes.length > 1) {
        const parentNodes: MerkleNode[] = [];
        for (let i = 0; i < nodes.length; i += 2) {
            const left = nodes[i];
            const right = nodes[i + 1]; // No need to handle odd number of nodes now
            const parentHash = hash(left.hash + right.hash);
            parentNodes.push({ hash: parentHash, left, right });
        }
        nodes = parentNodes;
    }
    return nodes[0]; // Root node
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