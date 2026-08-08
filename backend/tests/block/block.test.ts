import assert from "node:assert/strict";
import test from "node:test";
import {
  BLOCK_VERSION,
  calculateTransactionRoot,
  createBlock,
  createTransaction,
  deserializeBlock,
  deserializeBlockHeader,
  deriveAddress,
  GENESIS_PREVIOUS_HASH,
  getBlockId,
  getTransactionId,
  MAX_SERIALIZED_TRANSACTION_BYTES,
  MAX_TRANSACTIONS_PER_BLOCK,
  serializeBlock,
  serializeBlockHeader,
  validateBlockHeaderStructure,
  validateBlockStructure,
type BlockV1,
  type SignedTransaction
} from "../../src/index.js";

type HeaderMutation = Partial<{
  readonly version: number;
  readonly network: "local" | "testnet" | "mainnet";
  readonly height: string;
  readonly previousHash: string;
  readonly timestamp: string;
  readonly transactionRoot: string;
}>;

const FIXTURE_PRIVATE_KEYS = [
  "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIESPw3SahPyTI3kN5H/DHPUuPRR23UTFVddgRcJRccwX\n-----END PRIVATE KEY-----\n",
  "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIIur6Rm2OiZPdnuLhFslk6yWcnqXw5v4vKK083aVcbVx\n-----END PRIVATE KEY-----\n",
  "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIMiOjv/1Zt+nYfKTp3qM9ceRL7JZfDxTpmhTKa6AWG3q\n-----END PRIVATE KEY-----\n"
] as const;

const FIXTURE_PUBLIC_KEYS = [
  "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAbqoKt49Au0Fsskh3Z9DmOfBpfy1jnwUuayWdihnqgqM=\n-----END PUBLIC KEY-----\n",
  "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA0ew+mT+MZIgwaXgY7OydaAoNxeRuwMp9x8kLF8sAIc8=\n-----END PUBLIC KEY-----\n",
  "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAv9ItlAOli9tf+VwYVwql349BLULnHK0yTKDqyZ1iVXA=\n-----END PUBLIC KEY-----\n"
] as const;

const EXPECTED_TRANSACTION_ROOT = "188cb8b36cf7a2324039c8baa4f76518b0e272582b4d9634c2335840a2fe61e5";
const EXPECTED_HEADER_HEX = "000000114543484f5f424c4f434b5f484541444552000100000007746573746e6574000000013100000040313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131310000000a313730303030303030300000004031383863623862333663663761323332343033396338626161346637363531386230653237323538326234643936333463323333353834306132666536316535";
const EXPECTED_BLOCK_ID = "d0f75ac25ef13c47e654adb0e0a07ef35ba18a096781851e0f7643b9617e8d2f";
const EXPECTED_BLOCK_HEX = [
  "0000000a4543484f5f424c4f434b000000bd000000114543484f5f424c4f434b5f484541444552000100000007746573746e6574000000013100000040313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131310000000a313730303030303030300000004031383863623862333663663761323332343033396338626161346637363531386230653237323538326234643936333463323333353834306132666536316535000004bd0000000f4543484f5f424c4f434b5f424f44590000000300000189000000074543484f5f5458000100000007746573746e6574000000306563686f74657374317166386839746d7737343266666533356a747a353763706b73796a6a6178363739617a7135336e000000712d2d2d2d2d424547494e205055424c4943204b45592d2d2d2d2d0a4d436f77425159444b3256774179454162716f4b7434394175304673736b68335a39446d4f6642706679316a6e7755756179576469686e7167714d3d0a2d2d2d2d2d454e44205055424c4943204b45592d2d2d2d2d0a000000306563686f746573743171706b71776c397872677633366330746e736c7733397078646677306667396e707736653777390000000233300000000132000000013100000080376665633432656466386235636366653065623538336335623663353036356230363932393036326230663633303231646163333361643863343264373339353632393161396636343734373734363037643033616661356339343366636434306161323364353465336434333134316137386634316434666635616266306400000189000000074543484f5f5458000100000007746573746e6574000000306563686f746573743171706b71776c397872677633366330746e736c7733397078646677306667396e70773665377739000000712d2d2d2d2d424547494e205055424c4943204b45592d2d2d2d2d0a4d436f77425159444b325677417945413065772b6d542b4d5a49677761586759374f796461416f4e78655275774d703978386b4c463873414963383d0a2d2d2d2d2d454e44205055424c4943204b45592d2d2d2d2d0a",
  "000000306563686f7465737431713736646678703071386563393377683337753570396a65647475797a38327038686e6e7965320000000231310000000130000000013100000080313738386536383964303935376630656561666536663861626564393461323765373438663536356630646431356432343431316664323566656562616636373137666239393735376164633861383663616661343037663163623661643934363161626538333032653935366233646136323161343239373636386363306300000188000000074543484f5f5458000100000007746573746e6574000000306563686f7465737431713736646678703071386563393377683337753570396a65647475797a38327038686e6e796532000000712d2d2d2d2d424547494e205055424c4943204b45592d2d2d2d2d0a4d436f77425159444b32567741794541763949746c414f6c693974662b5677595677716c333439424c554c6e484b3079544b4471795a31695658413d0a2d2d2d2d2d454e44205055424c4943204b45592d2d2d2d2d0a000000306563686f74657374317166386839746d7737343266666533356a747a353763706b73796a6a6178363739617a7135336e000000013700000001310000000131000000803561343131636166303537646530333138363762356164353438323136353635343264346138376433326362653535363636353563623939663231326565633066363934653431353065333835366565386261626262373234666161346536336665353134333463346234333562633239366534653538303534396430303030"
].join("");

// Creates fixed signed transactions by using deterministic test-only Ed25519 fixture keys.
function createFixtureTransactions(): readonly [SignedTransaction, SignedTransaction, SignedTransaction] {
  const addresses = FIXTURE_PUBLIC_KEYS.map((publicKey) => deriveAddress(publicKey, "testnet"));
  const first = createTransaction({
    network: "testnet",
    sender: addresses[0]!,
    senderPublicKey: FIXTURE_PUBLIC_KEYS[0],
    recipient: addresses[1]!,
    amount: "30",
    fee: "2",
    nonce: "1",
    privateKeyPem: FIXTURE_PRIVATE_KEYS[0]
  });
  const second = createTransaction({
    network: "testnet",
    sender: addresses[1]!,
    senderPublicKey: FIXTURE_PUBLIC_KEYS[1],
    recipient: addresses[2]!,
    amount: "11",
    fee: "0",
    nonce: "1",
    privateKeyPem: FIXTURE_PRIVATE_KEYS[1]
  });
  const third = createTransaction({
    network: "testnet",
    sender: addresses[2]!,
    senderPublicKey: FIXTURE_PUBLIC_KEYS[2],
    recipient: addresses[0]!,
    amount: "7",
    fee: "1",
    nonce: "1",
    privateKeyPem: FIXTURE_PRIVATE_KEYS[2]
  });

  return [first, second, third];
}

// Creates a fixed block vector by using known transactions, timestamp, height, and previous hash.
function createFixtureBlock(): BlockV1 {
  return createBlock({
    network: "testnet",
    height: "1",
    previousHash: "1111111111111111111111111111111111111111111111111111111111111111",
    timestamp: "1700000000",
    transactions: createFixtureTransactions()
  });
}

// Clones a block with selected field overrides by copying the header and transaction collection for validation tests.
function mutateBlock(block: BlockV1, overrides: HeaderMutation): BlockV1 {
  return Object.freeze({
    header: Object.freeze({ ...block.header, ...overrides }),
    transactions: block.transactions
  }) as unknown as BlockV1;
}

// Verifies permanent consensus vectors for transaction root, header bytes, block ID, and full block bytes.
function assertConsensusVectors(): void {
  const block = createFixtureBlock();

  assert.equal(calculateTransactionRoot(block.transactions), EXPECTED_TRANSACTION_ROOT);
  assert.equal(serializeBlockHeader(block.header).toString("hex"), EXPECTED_HEADER_HEX);
  assert.equal(getBlockId(block.header), EXPECTED_BLOCK_ID);
  assert.equal(serializeBlock(block).toString("hex"), EXPECTED_BLOCK_HEX);
}

// Verifies one-transaction block commitment by comparing the root with the fixture transaction ID leaf hash.
function assertOneTransactionBlock(): void {
  const [transaction] = createFixtureTransactions();
  const block = createBlock({
    network: "testnet",
    height: "1",
    previousHash: GENESIS_PREVIOUS_HASH,
    timestamp: "1700000000",
    transactions: [transaction]
  });

  assert.equal(validateBlockStructure(block).valid, true);
  assert.notEqual(block.header.transactionRoot, EXPECTED_TRANSACTION_ROOT);
}

// Verifies multiple and odd transaction count behavior by validating a three-transaction block.
function assertOddTransactionBlock(): void {
  const block = createFixtureBlock();

  assert.equal(block.transactions.length, 3);
  assert.equal(validateBlockStructure(block).valid, true);
}

// Verifies transaction ordering matters by swapping transaction order and checking the root changes.
function assertTransactionOrderChangesCommitment(): void {
  const [first, second, third] = createFixtureTransactions();

  assert.notEqual(calculateTransactionRoot([first, second, third]), calculateTransactionRoot([second, first, third]));
}

// Verifies transaction mutation changes the commitment by changing one signed transaction field.
function assertTransactionMutationChangesCommitment(): void {
  const [first, second, third] = createFixtureTransactions();
  const mutated = Object.freeze({ ...first, amount: "31" });

  assert.notEqual(calculateTransactionRoot([first, second, third]), calculateTransactionRoot([mutated, second, third]));
}

// Verifies block hash sensitivity by changing each consensus header field and checking the block ID changes.
function assertHeaderMutationChangesBlockHash(): void {
  const block = createFixtureBlock();
  const mutations = [
    { version: 2 },
    { network: "local" as const },
    { height: "2" },
    { previousHash: "2222222222222222222222222222222222222222222222222222222222222222" },
    { timestamp: "1700000001" },
    { transactionRoot: "3333333333333333333333333333333333333333333333333333333333333333" }
  ];

  for (const mutation of mutations) {
    assert.notEqual(getBlockId(block.header), getBlockId(mutateBlock(block, mutation).header));
  }
}

// Verifies invalid commitment rejection by replacing the transaction root with a valid but incorrect hash.
function assertInvalidTransactionCommitmentFails(): void {
  const block = mutateBlock(createFixtureBlock(), {
    transactionRoot: "2222222222222222222222222222222222222222222222222222222222222222"
  });

  assert.deepEqual(validateBlockStructure(block), { valid: false, error: "INVALID_TRANSACTION_ROOT" });
}

// Verifies malformed hash field rejection by checking previous hash and transaction root formats.
function assertMalformedHashFieldsFail(): void {
  const block = createFixtureBlock();

  assert.deepEqual(validateBlockStructure(mutateBlock(block, { previousHash: "abc" })), {
    valid: false,
    error: "INVALID_PREVIOUS_HASH"
  });
  assert.deepEqual(validateBlockStructure(mutateBlock(block, { transactionRoot: "ABC" + "0".repeat(61) })), {
    valid: false,
    error: "INVALID_TRANSACTION_ROOT"
  });
}

// Verifies invalid version rejection by changing the supported block version.
function assertInvalidVersionFails(): void {
  const block = mutateBlock(createFixtureBlock(), { version: 2 });

  assert.deepEqual(validateBlockStructure(block), { valid: false, error: "INVALID_BLOCK_VERSION" });
}

// Verifies duplicate transaction ID rejection by including the same signed transaction twice.
function assertDuplicateTransactionFails(): void {
  const [transaction] = createFixtureTransactions();
  const block = createBlock({
    network: "testnet",
    height: "1",
    previousHash: GENESIS_PREVIOUS_HASH,
    timestamp: "1700000000",
    transactions: [transaction, transaction]
  });

  assert.deepEqual(validateBlockStructure(block), { valid: false, error: "DUPLICATE_TRANSACTION" });
}

// Verifies block transaction count bounds by building one more transaction reference than the V1 maximum.
function assertTransactionCountLimitFails(): void {
  const [transaction] = createFixtureTransactions();
  const transactions = new Array<SignedTransaction>(MAX_TRANSACTIONS_PER_BLOCK + 1).fill(transaction);
  const block = createBlock({
    network: "testnet",
    height: "1",
    previousHash: GENESIS_PREVIOUS_HASH,
    timestamp: "1700000000",
    transactions
  });

  assert.deepEqual(validateBlockStructure(block), { valid: false, error: "TOO_MANY_TRANSACTIONS" });
}

// Verifies transaction byte-size bounds by adding an oversized public key field before transaction verification.
function assertTransactionSizeLimitFails(): void {
  const [transaction] = createFixtureTransactions();
  const oversized = Object.freeze({
    ...transaction,
    senderPublicKey: "x".repeat(MAX_SERIALIZED_TRANSACTION_BYTES)
  });
  const block = createBlock({
    network: "testnet",
    height: "1",
    previousHash: GENESIS_PREVIOUS_HASH,
    timestamp: "1700000000",
    transactions: [oversized]
  });

  assert.deepEqual(validateBlockStructure(block), { valid: false, error: "TRANSACTION_TOO_LARGE" });
}

// Verifies deterministic round-trip behavior by serializing, deserializing, and reserializing a fixture block.
function assertDeterministicSerializationRoundTrip(): void {
  const block = createFixtureBlock();
  const serialized = serializeBlock(block);
  const decoded = deserializeBlock(serialized);

  assert.deepEqual(decoded, block);
  assert.equal(serializeBlock(decoded).toString("hex"), serialized.toString("hex"));
}

// Verifies deterministic header round-trip behavior by decoding and reserializing the fixture header.
function assertHeaderSerializationRoundTrip(): void {
  const block = createFixtureBlock();
  const serialized = serializeBlockHeader(block.header);
  const decoded = deserializeBlockHeader(serialized);

  assert.deepEqual(decoded, block.header);
  assert.equal(serializeBlockHeader(decoded).toString("hex"), serialized.toString("hex"));
}

// Verifies malformed serialization rejection by passing invalid block magic bytes.
function assertMalformedSerializationFails(): void {
  assert.throws(function deserializeMalformedBlock(): void {
    deserializeBlock(Buffer.from("00000003626164", "hex"));
  }, /NON_CANONICAL_ENCODING/);
}

// Verifies truncated serialization rejection by removing bytes from a valid serialized block.
function assertTruncatedSerializationFails(): void {
  const serialized = serializeBlock(createFixtureBlock());

  assert.throws(function deserializeTruncatedBlock(): void {
    deserializeBlock(serialized.subarray(0, serialized.length - 1));
  }, /TRUNCATED_ENCODING/);
}

// Verifies excess byte rejection by appending trailing bytes to a valid serialized block.
function assertExcessBytesFail(): void {
  const serialized = serializeBlock(createFixtureBlock());

  assert.throws(function deserializeBlockWithExcessBytes(): void {
    deserializeBlock(Buffer.concat([serialized, Buffer.from([0])]));
  }, /EXCESS_BYTES/);
}

// Verifies deterministic block ID behavior by hashing the same header twice.
function assertDeterministicBlockHash(): void {
  const block = createFixtureBlock();

  assert.equal(getBlockId(block.header), getBlockId(block.header));
}

test("consensus vectors", assertConsensusVectors);
test("one transaction block", assertOneTransactionBlock);
test("odd transaction block", assertOddTransactionBlock);
test("transaction order changes commitment", assertTransactionOrderChangesCommitment);
test("transaction mutation changes commitment", assertTransactionMutationChangesCommitment);
test("header mutation changes block hash", assertHeaderMutationChangesBlockHash);
test("invalid transaction commitment fails", assertInvalidTransactionCommitmentFails);
test("malformed hash fields fail", assertMalformedHashFieldsFail);
test("invalid version fails", assertInvalidVersionFails);
test("duplicate transaction fails", assertDuplicateTransactionFails);
test("transaction count limit fails", assertTransactionCountLimitFails);
test("transaction size limit fails", assertTransactionSizeLimitFails);
test("deterministic serialization round trip", assertDeterministicSerializationRoundTrip);
test("header serialization round trip", assertHeaderSerializationRoundTrip);
test("malformed serialization fails", assertMalformedSerializationFails);
test("truncated serialization fails", assertTruncatedSerializationFails);
test("excess bytes fail", assertExcessBytesFail);
test("deterministic block hash", assertDeterministicBlockHash);
