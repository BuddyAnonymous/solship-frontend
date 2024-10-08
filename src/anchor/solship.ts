/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solship.json`.
 */
export type Solship = {
  "address": "8ud2dBF8N4f9eZwiWnYZ3TEXEaEvm4QHr6Tu6tYKkJ5T",
  "metadata": {
    "name": "solship",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "attack",
      "discriminator": [
        197,
        26,
        63,
        242,
        77,
        247,
        101,
        119
      ],
      "accounts": [
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "game",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "fieldToAttack",
          "type": "u8"
        }
      ]
    },
    {
      "name": "claimWin",
      "discriminator": [
        163,
        215,
        101,
        246,
        25,
        134,
        110,
        194
      ],
      "accounts": [
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "game",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "table",
          "type": {
            "array": [
              {
                "defined": {
                  "name": "proofField"
                }
              },
              128
            ]
          }
        }
      ]
    },
    {
      "name": "createGame",
      "discriminator": [
        124,
        69,
        75,
        66,
        184,
        220,
        72,
        206
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
              },
              {
                "kind": "arg",
                "path": "enemy"
              }
            ]
          }
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "sessionKey",
          "signer": true
        },
        {
          "name": "queue",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  101,
                  117,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "enemy",
          "type": "pubkey"
        },
        {
          "name": "boardRoot",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "initializeQueue",
      "discriminator": [
        174,
        102,
        132,
        232,
        90,
        202,
        27,
        20
      ],
      "accounts": [
        {
          "name": "queue",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  101,
                  117,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "joinQueue",
      "discriminator": [
        157,
        115,
        48,
        109,
        65,
        86,
        203,
        238
      ],
      "accounts": [
        {
          "name": "queue",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  101,
                  117,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "sessionKey",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "boardRoot",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "verifyProof",
      "discriminator": [
        217,
        211,
        191,
        110,
        144,
        13,
        186,
        98
      ],
      "accounts": [
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "game",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "array": [
              {
                "array": [
                  "u8",
                  32
                ]
              },
              7
            ]
          }
        },
        {
          "name": "leaf",
          "type": {
            "defined": {
              "name": "gameField"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "game",
      "discriminator": [
        27,
        90,
        166,
        125,
        74,
        100,
        121,
        18
      ]
    },
    {
      "name": "queue",
      "discriminator": [
        204,
        167,
        6,
        247,
        20,
        33,
        2,
        188
      ]
    }
  ],
  "events": [
    {
      "name": "fieldAttacked",
      "discriminator": [
        65,
        91,
        146,
        86,
        9,
        221,
        13,
        178
      ]
    },
    {
      "name": "gameFinished",
      "discriminator": [
        0,
        128,
        235,
        237,
        115,
        180,
        62,
        221
      ]
    },
    {
      "name": "gameStarted",
      "discriminator": [
        222,
        247,
        78,
        255,
        61,
        184,
        156,
        41
      ]
    },
    {
      "name": "proofVerified",
      "discriminator": [
        181,
        54,
        148,
        211,
        237,
        73,
        131,
        232
      ]
    },
    {
      "name": "turnFinished",
      "discriminator": [
        17,
        147,
        233,
        65,
        51,
        20,
        246,
        60
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "playerNotPartOfGame",
      "msg": "Player is not part of the game"
    },
    {
      "code": 6001,
      "name": "wrongProvingFieldIndex",
      "msg": "Wrong proving field index"
    },
    {
      "code": 6002,
      "name": "invalidProof",
      "msg": "Invalid proof"
    },
    {
      "code": 6003,
      "name": "alreadyTriedVerifing",
      "msg": "Player already tried verifing this turn"
    },
    {
      "code": 6004,
      "name": "turnNotExpired",
      "msg": "Turn duration has not expired"
    },
    {
      "code": 6005,
      "name": "invalidTable",
      "msg": "Invalid table"
    },
    {
      "code": 6006,
      "name": "timeExpired",
      "msg": "Time expired"
    },
    {
      "code": 6007,
      "name": "gameFinished",
      "msg": "Game finished"
    },
    {
      "code": 6008,
      "name": "enemyPlayedTurn",
      "msg": "Enemy played turn"
    },
    {
      "code": 6009,
      "name": "alreadyAttackedThisTurn",
      "msg": "Player already attacked this turn"
    }
  ],
  "types": [
    {
      "name": "fieldAttacked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "game",
            "type": "pubkey"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "attackedField",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "game",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player1",
            "type": "pubkey"
          },
          {
            "name": "player2",
            "type": "pubkey"
          },
          {
            "name": "player1SessionKey",
            "type": "pubkey"
          },
          {
            "name": "player2SessionKey",
            "type": "pubkey"
          },
          {
            "name": "player1BoardHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "player2BoardHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "currentTurn",
            "type": "u8"
          },
          {
            "name": "player1AttackedThisTurn",
            "type": "bool"
          },
          {
            "name": "player2AttackedThisTurn",
            "type": "bool"
          },
          {
            "name": "player1TriedVerifingThisTurn",
            "type": "bool"
          },
          {
            "name": "player2TriedVerifingThisTurn",
            "type": "bool"
          },
          {
            "name": "player1VerifiedProofThisTurn",
            "type": "bool"
          },
          {
            "name": "player2VerifiedProofThisTurn",
            "type": "bool"
          },
          {
            "name": "fieldPlayer1AttackedThisTurn",
            "type": "u8"
          },
          {
            "name": "fieldPlayer2AttackedThisTurn",
            "type": "u8"
          },
          {
            "name": "player1RemainingShipFields",
            "type": "u8"
          },
          {
            "name": "player2RemainingShipFields",
            "type": "u8"
          },
          {
            "name": "turnStartSlot",
            "type": "u64"
          },
          {
            "name": "winner",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "gameField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "shipPlaced",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "gameFinished",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "game",
            "type": "pubkey"
          },
          {
            "name": "winner",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "gamePlayer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "pubkey"
          },
          {
            "name": "sessionKey",
            "type": "pubkey"
          },
          {
            "name": "boardRoot",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "gameStarted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "game",
            "type": "pubkey"
          },
          {
            "name": "player1",
            "type": "pubkey"
          },
          {
            "name": "player2",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "proofField",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "shipPlaced",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "proofVerified",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "game",
            "type": "pubkey"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "attackedField",
            "type": "u8"
          },
          {
            "name": "shipPlaced",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "queue",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "players",
            "type": {
              "vec": {
                "defined": {
                  "name": "gamePlayer"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "turnFinished",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "game",
            "type": "pubkey"
          },
          {
            "name": "turn",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
