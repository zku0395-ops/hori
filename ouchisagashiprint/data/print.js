// ホーせんぱいの おうちさがし プリント：もんだい（tools/make_mondai.js が 作ります。手で 直さない）
var OUCHI_PRINT = {
 "seed": 20261126,
 "roads": [
  {
   "n": "あおい みち",
   "c": "#93c5fd"
  },
  {
   "n": "きいろい みち",
   "c": "#fde047"
  }
 ],
 "sheets": [
  {
   "stage": "1-1",
   "title": "やね・ドア・まど",
   "qs": [
    {
     "no": 1,
     "target": "machi-07",
     "who": "さる",
     "lines": [
      "やねの いろは、みどりです。"
     ],
     "kinds": [
      "やね"
     ],
     "clues": [
      {
       "t": "roof",
       "v": "みどり"
      }
     ],
     "houses": [
      "machi-01",
      "machi-07",
      "machi-09",
      "machi-06",
      "machi-02",
      "machi-05"
     ],
     "ans": 2
    },
    {
     "no": 2,
     "target": "machi-06",
     "who": "コアラ",
     "lines": [
      "ドアの いろは、みどりです。"
     ],
     "kinds": [
      "ドア"
     ],
     "clues": [
      {
       "t": "door",
       "v": "みどり"
      }
     ],
     "houses": [
      "machi-10",
      "machi-02",
      "machi-08",
      "machi-06",
      "machi-05",
      "machi-04"
     ],
     "ans": 4
    }
   ],
   "no": 1
  },
  {
   "stage": "1-2",
   "title": "かべ・にわ・のりもの",
   "qs": [
    {
     "no": 3,
     "target": "machi-09",
     "who": "きりん",
     "lines": [
      "かべの いろは、しろです。"
     ],
     "kinds": [
      "かべ"
     ],
     "clues": [
      {
       "t": "wall",
       "v": "しろ"
      }
     ],
     "houses": [
      "machi-07",
      "machi-01",
      "machi-09",
      "machi-04",
      "machi-02",
      "machi-08"
     ],
     "ans": 3
    },
    {
     "no": 4,
     "target": "machi-08",
     "who": "ぞう",
     "lines": [
      "にわに、ひまわりが さいて います。"
     ],
     "kinds": [
      "にわ"
     ],
     "clues": [
      {
       "t": "garden",
       "v": "himawari"
      }
     ],
     "houses": [
      "machi-08",
      "machi-07",
      "machi-06",
      "machi-05",
      "machi-04",
      "machi-10"
     ],
     "ans": 1
    }
   ],
   "no": 2
  },
  {
   "stage": "1-3",
   "title": "1つの ぶん",
   "qs": [
    {
     "no": 5,
     "target": "machi-02",
     "who": "ねこ",
     "lines": [
      "いえの まえに、じてんしゃが おいて あります。"
     ],
     "kinds": [
      "のりもの"
     ],
     "clues": [
      {
       "t": "vehicle",
       "v": "jitensha"
      }
     ],
     "houses": [
      "machi-01",
      "machi-02",
      "machi-07",
      "machi-05",
      "machi-03",
      "machi-04"
     ],
     "ans": 2
    },
    {
     "no": 6,
     "target": "machi-04",
     "who": "ハムスター",
     "lines": [
      "いえの まえに、あおい くるまが とまって います。"
     ],
     "kinds": [
      "のりもの"
     ],
     "clues": [
      {
       "t": "vehicle",
       "v": "carB"
      }
     ],
     "houses": [
      "machi-02",
      "machi-09",
      "machi-04",
      "machi-05",
      "machi-06",
      "machi-10"
     ],
     "ans": 3
    }
   ],
   "no": 3
  },
  {
   "stage": "2-1",
   "title": "2つの ぶん",
   "qs": [
    {
     "no": 7,
     "target": "mori-08",
     "who": "ことり",
     "lines": [
      "やねの いろは、オレンジです。",
      "ドアの いろは、きいろです。"
     ],
     "kinds": [
      "やね",
      "ドア"
     ],
     "clues": [
      {
       "t": "roof",
       "v": "オレンジ"
      },
      {
       "t": "door",
       "v": "きいろ"
      }
     ],
     "houses": [
      "mori-04",
      "mori-06",
      "mori-05",
      "mori-08",
      "mori-01",
      "mori-03"
     ],
     "ans": 4
    },
    {
     "no": 8,
     "target": "mori-04",
     "who": "りす",
     "lines": [
      "まどの かたちは、さんかくです。",
      "かべの いろは、きいろです。"
     ],
     "kinds": [
      "まど",
      "かべ"
     ],
     "clues": [
      {
       "t": "window",
       "v": "さんかく"
      },
      {
       "t": "wall",
       "v": "きいろ"
      }
     ],
     "houses": [
      "mori-02",
      "mori-09",
      "mori-08",
      "mori-01",
      "mori-06",
      "mori-04"
     ],
     "ans": 6
    }
   ],
   "no": 4
  },
  {
   "stage": "2-1",
   "title": "2つの ぶん",
   "qs": [
    {
     "no": 9,
     "target": "mori-07",
     "who": "いのしし",
     "lines": [
      "ドアの いろは、みどりです。",
      "にわに、みかんの きが あります。"
     ],
     "kinds": [
      "ドア",
      "にわ"
     ],
     "clues": [
      {
       "t": "door",
       "v": "みどり"
      },
      {
       "t": "garden",
       "v": "mikan"
      }
     ],
     "houses": [
      "mori-08",
      "mori-06",
      "mori-05",
      "mori-03",
      "mori-07",
      "mori-01"
     ],
     "ans": 5
    },
    {
     "no": 10,
     "target": "mori-10",
     "who": "おおかみ",
     "lines": [
      "やねの いろは、あかです。",
      "まどの かたちは、しかくです。"
     ],
     "kinds": [
      "やね",
      "まど"
     ],
     "clues": [
      {
       "t": "roof",
       "v": "あか"
      },
      {
       "t": "window",
       "v": "しかく"
      }
     ],
     "houses": [
      "mori-08",
      "mori-05",
      "mori-01",
      "mori-10",
      "mori-09",
      "mori-03"
     ],
     "ans": 4
    }
   ],
   "no": 5
  },
  {
   "stage": "2-2",
   "title": "2つの ぶん",
   "qs": [
    {
     "no": 11,
     "target": "mori-02",
     "who": "きつね",
     "lines": [
      "いえの まえに、じてんしゃが おいて あります。",
      "かべの いろは、しろです。"
     ],
     "kinds": [
      "のりもの",
      "かべ"
     ],
     "clues": [
      {
       "t": "vehicle",
       "v": "jitensha"
      },
      {
       "t": "wall",
       "v": "しろ"
      }
     ],
     "houses": [
      "mori-09",
      "mori-03",
      "mori-02",
      "mori-01",
      "mori-08",
      "mori-06"
     ],
     "ans": 3
    },
    {
     "no": 12,
     "target": "mori-01",
     "who": "くま",
     "lines": [
      "いえの まえに、みどりの くるまが とまって います。",
      "まどの かたちは、さんかくです。"
     ],
     "kinds": [
      "のりもの",
      "まど"
     ],
     "clues": [
      {
       "t": "vehicle",
       "v": "carG"
      },
      {
       "t": "window",
       "v": "さんかく"
      }
     ],
     "houses": [
      "mori-04",
      "mori-01",
      "mori-09",
      "mori-07",
      "mori-10",
      "mori-05"
     ],
     "ans": 2
    }
   ],
   "no": 6
  },
  {
   "stage": "2-3",
   "title": "2つの ぶん",
   "qs": [
    {
     "no": 13,
     "target": "mori-03",
     "who": "たぬき",
     "lines": [
      "かべの いろは、ちゃいろです。",
      "まどの かたちは、しかくです。"
     ],
     "kinds": [
      "かべ",
      "まど"
     ],
     "clues": [
      {
       "t": "wall",
       "v": "ちゃいろ"
      },
      {
       "t": "window",
       "v": "しかく"
      }
     ],
     "houses": [
      "mori-06",
      "mori-04",
      "mori-02",
      "mori-05",
      "mori-07",
      "mori-03"
     ],
     "ans": 6
    },
    {
     "no": 14,
     "target": "mori-05",
     "who": "しか",
     "lines": [
      "いえの まえに、バイクが とまって います。",
      "ドアの いろは、みどりです。"
     ],
     "kinds": [
      "のりもの",
      "ドア"
     ],
     "clues": [
      {
       "t": "vehicle",
       "v": "baiku"
      },
      {
       "t": "door",
       "v": "みどり"
      }
     ],
     "houses": [
      "mori-07",
      "mori-09",
      "mori-03",
      "mori-10",
      "mori-05",
      "mori-04"
     ],
     "ans": 5
    }
   ],
   "no": 7
  },
  {
   "stage": "2-3",
   "title": "2つの ぶん",
   "qs": [
    {
     "no": 15,
     "target": "mori-06",
     "who": "はりねずみ",
     "lines": [
      "やねの いろは、あかです。",
      "にわに、みかんの きが あります。"
     ],
     "kinds": [
      "やね",
      "にわ"
     ],
     "clues": [
      {
       "t": "roof",
       "v": "あか"
      },
      {
       "t": "garden",
       "v": "mikan"
      }
     ],
     "houses": [
      "mori-01",
      "mori-05",
      "mori-09",
      "mori-06",
      "mori-10",
      "mori-07"
     ],
     "ans": 4
    },
    {
     "no": 16,
     "target": "mori-09",
     "who": "かえる",
     "lines": [
      "かべの いろは、しろです。",
      "やねの いろは、みどりです。"
     ],
     "kinds": [
      "かべ",
      "やね"
     ],
     "clues": [
      {
       "t": "wall",
       "v": "しろ"
      },
      {
       "t": "roof",
       "v": "みどり"
      }
     ],
     "houses": [
      "mori-01",
      "mori-10",
      "mori-08",
      "mori-07",
      "mori-02",
      "mori-09"
     ],
     "ans": 6
    }
   ],
   "no": 8
  },
  {
   "stage": "3-1",
   "title": "3つの ぶん",
   "qs": [
    {
     "no": 17,
     "target": "hayashi-05",
     "who": "とかげ",
     "lines": [
      "まどの かたちは、まるです。",
      "やねの いろは、むらさきです。",
      "にわに、りんごの きが あります。"
     ],
     "kinds": [
      "まど",
      "やね",
      "にわ"
     ],
     "clues": [
      {
       "t": "window",
       "v": "まる"
      },
      {
       "t": "roof",
       "v": "むらさき"
      },
      {
       "t": "garden",
       "v": "ringo"
      }
     ],
     "houses": [
      "hayashi-07",
      "hayashi-05",
      "hayashi-10",
      "hayashi-01",
      "hayashi-04",
      "hayashi-08"
     ],
     "ans": 2
    },
    {
     "no": 18,
     "target": "hayashi-10",
     "who": "こうもり",
     "lines": [
      "にわに、サボテンが あります。",
      "かべの いろは、ちゃいろです。",
      "やねの いろは、ピンクです。"
     ],
     "kinds": [
      "にわ",
      "かべ",
      "やね"
     ],
     "clues": [
      {
       "t": "garden",
       "v": "saboten"
      },
      {
       "t": "wall",
       "v": "ちゃいろ"
      },
      {
       "t": "roof",
       "v": "ピンク"
      }
     ],
     "houses": [
      "hayashi-05",
      "hayashi-03",
      "hayashi-02",
      "hayashi-10",
      "hayashi-01",
      "hayashi-08"
     ],
     "ans": 4
    }
   ],
   "no": 9
  },
  {
   "stage": "3-1",
   "title": "3つの ぶん",
   "qs": [
    {
     "no": 19,
     "target": "hayashi-05",
     "who": "とかげ",
     "lines": [
      "まどの かたちは、まるです。",
      "にわに、りんごの きが あります。",
      "やねの いろは、むらさきです。"
     ],
     "kinds": [
      "まど",
      "にわ",
      "やね"
     ],
     "clues": [
      {
       "t": "window",
       "v": "まる"
      },
      {
       "t": "garden",
       "v": "ringo"
      },
      {
       "t": "roof",
       "v": "むらさき"
      }
     ],
     "houses": [
      "hayashi-07",
      "hayashi-05",
      "hayashi-08",
      "hayashi-04",
      "hayashi-01",
      "hayashi-10"
     ],
     "ans": 2
    },
    {
     "no": 20,
     "target": "hayashi-01",
     "who": "てんとうむし",
     "lines": [
      "まどの かたちは、まるです。",
      "かべの いろは、ちゃいろです。",
      "にわに、りんごの きが あります。"
     ],
     "kinds": [
      "まど",
      "かべ",
      "にわ"
     ],
     "clues": [
      {
       "t": "window",
       "v": "まる"
      },
      {
       "t": "wall",
       "v": "ちゃいろ"
      },
      {
       "t": "garden",
       "v": "ringo"
      }
     ],
     "houses": [
      "hayashi-01",
      "hayashi-08",
      "hayashi-10",
      "hayashi-05",
      "hayashi-04",
      "hayashi-07"
     ],
     "ans": 1
    }
   ],
   "no": 10
  },
  {
   "stage": "3-2",
   "title": "3つの ぶん",
   "qs": [
    {
     "no": 21,
     "target": "hayashi-08",
     "who": "あなぐま",
     "lines": [
      "まどの かたちは、まるです。",
      "やねの いろは、むらさきです。",
      "かべの いろは、ちゃいろです。"
     ],
     "kinds": [
      "まど",
      "やね",
      "かべ"
     ],
     "clues": [
      {
       "t": "window",
       "v": "まる"
      },
      {
       "t": "roof",
       "v": "むらさき"
      },
      {
       "t": "wall",
       "v": "ちゃいろ"
      }
     ],
     "houses": [
      "hayashi-05",
      "hayashi-10",
      "hayashi-04",
      "hayashi-08",
      "hayashi-01",
      "hayashi-07"
     ],
     "ans": 4
    },
    {
     "no": 22,
     "target": "hayashi-04",
     "who": "ちょうちょ",
     "lines": [
      "ドアの いろは、きいろです。",
      "やねの いろは、むらさきです。",
      "まどの かたちは、しかくです。"
     ],
     "kinds": [
      "ドア",
      "やね",
      "まど"
     ],
     "clues": [
      {
       "t": "door",
       "v": "きいろ"
      },
      {
       "t": "roof",
       "v": "むらさき"
      },
      {
       "t": "window",
       "v": "しかく"
      }
     ],
     "houses": [
      "hayashi-09",
      "hayashi-07",
      "hayashi-05",
      "hayashi-06",
      "hayashi-08",
      "hayashi-04"
     ],
     "ans": 6
    }
   ],
   "no": 11
  },
  {
   "stage": "3-3",
   "title": "3つの ぶん",
   "qs": [
    {
     "no": 23,
     "target": "hayashi-05",
     "who": "とかげ",
     "lines": [
      "やねの いろは、むらさきです。",
      "まどの かたちは、まるです。",
      "にわに、りんごの きが あります。"
     ],
     "kinds": [
      "やね",
      "まど",
      "にわ"
     ],
     "clues": [
      {
       "t": "roof",
       "v": "むらさき"
      },
      {
       "t": "window",
       "v": "まる"
      },
      {
       "t": "garden",
       "v": "ringo"
      }
     ],
     "houses": [
      "hayashi-04",
      "hayashi-01",
      "hayashi-05",
      "hayashi-10",
      "hayashi-08",
      "hayashi-07"
     ],
     "ans": 3
    },
    {
     "no": 24,
     "target": "hayashi-01",
     "who": "てんとうむし",
     "lines": [
      "いえの まえに、バスが とまって います。",
      "まどの かたちは、まるです。",
      "にわに、りんごの きが あります。"
     ],
     "kinds": [
      "のりもの",
      "まど",
      "にわ"
     ],
     "clues": [
      {
       "t": "vehicle",
       "v": "basu"
      },
      {
       "t": "window",
       "v": "まる"
      },
      {
       "t": "garden",
       "v": "ringo"
      }
     ],
     "houses": [
      "hayashi-05",
      "hayashi-04",
      "hayashi-02",
      "hayashi-01",
      "hayashi-08",
      "hayashi-10"
     ],
     "ans": 4
    }
   ],
   "no": 12
  },
  {
   "stage": "3-3",
   "title": "3つの ぶん",
   "qs": [
    {
     "no": 25,
     "target": "hayashi-04",
     "who": "ちょうちょ",
     "lines": [
      "まどの かたちは、しかくです。",
      "ドアの いろは、きいろです。",
      "いえの まえに、あかい くるまが とまって います。"
     ],
     "kinds": [
      "まど",
      "ドア",
      "のりもの"
     ],
     "clues": [
      {
       "t": "window",
       "v": "しかく"
      },
      {
       "t": "door",
       "v": "きいろ"
      },
      {
       "t": "vehicle",
       "v": "carR"
      }
     ],
     "houses": [
      "hayashi-07",
      "hayashi-09",
      "hayashi-05",
      "hayashi-06",
      "hayashi-08",
      "hayashi-04"
     ],
     "ans": 6
    },
    {
     "no": 26,
     "target": "hayashi-08",
     "who": "あなぐま",
     "lines": [
      "まどの かたちは、まるです。",
      "やねの いろは、むらさきです。",
      "かべの いろは、ちゃいろです。"
     ],
     "kinds": [
      "まど",
      "やね",
      "かべ"
     ],
     "clues": [
      {
       "t": "window",
       "v": "まる"
      },
      {
       "t": "roof",
       "v": "むらさき"
      },
      {
       "t": "wall",
       "v": "ちゃいろ"
      }
     ],
     "houses": [
      "hayashi-04",
      "hayashi-01",
      "hayashi-10",
      "hayashi-07",
      "hayashi-08",
      "hayashi-05"
     ],
     "ans": 5
    }
   ],
   "no": 13
  },
  {
   "stage": "4-1",
   "title": "みち と となり",
   "qs": [
    {
     "no": 27,
     "target": "minato-09",
     "who": "いか",
     "lines": [
      "まどの かたちは、まるです。",
      "あおい みちに あります。"
     ],
     "kinds": [
      "まど",
      "みち"
     ],
     "clues": [
      {
       "t": "window",
       "v": "まる"
      },
      {
       "t": "row",
       "v": 0
      }
     ],
     "houses": [
      "minato-09",
      "minato-02",
      "minato-10",
      "minato-08",
      "minato-01",
      "minato-04"
     ],
     "town": {
      "mark": {
       "id": "todai",
       "n": "とうだい"
      },
      "rows": [
       [
        1,
        "M",
        2,
        0
       ],
       [
        0,
        0,
        0,
        3
       ],
       [
        0,
        4,
        5,
        6
       ]
      ]
     },
     "ans": 1
    },
    {
     "no": 28,
     "target": "minato-06",
     "who": "かめ",
     "lines": [
      "とうだいの となりに あります。",
      "かべの いろは、しろです。"
     ],
     "kinds": [
      "となり（めじるし）",
      "かべ"
     ],
     "clues": [
      {
       "t": "near",
       "ref": {
        "m": "todai"
       }
      },
      {
       "t": "wall",
       "v": "しろ"
      }
     ],
     "houses": [
      "minato-03",
      "minato-06",
      "minato-09",
      "minato-02",
      "minato-07",
      "minato-04"
     ],
     "town": {
      "mark": {
       "id": "todai",
       "n": "とうだい"
      },
      "rows": [
       [
        1,
        "M",
        2,
        3
       ],
       [
        0,
        4,
        0,
        0
       ],
       [
        5,
        6,
        0,
        0
       ]
      ]
     },
     "ans": 2
    }
   ],
   "no": 14
  },
  {
   "stage": "4-1",
   "title": "みち と となり",
   "qs": [
    {
     "no": 29,
     "target": "minato-03",
     "who": "くじら",
     "lines": [
      "あおい みちに あります。",
      "やねの いろは、あかです。",
      "かべの いろは、みずいろです。"
     ],
     "kinds": [
      "みち",
      "やね",
      "かべ"
     ],
     "clues": [
      {
       "t": "row",
       "v": 0
      },
      {
       "t": "roof",
       "v": "あか"
      },
      {
       "t": "wall",
       "v": "みずいろ"
      }
     ],
     "houses": [
      "minato-08",
      "minato-07",
      "minato-03",
      "minato-09",
      "minato-06",
      "minato-10"
     ],
     "town": {
      "mark": {
       "id": "todai",
       "n": "とうだい"
      },
      "rows": [
       [
        0,
        0,
        1,
        2
       ],
       [
        3,
        "M",
        4,
        5
       ],
       [
        6,
        0,
        0,
        0
       ]
      ]
     },
     "ans": 3
    },
    {
     "no": 30,
     "target": "minato-01",
     "who": "ペンギン",
     "lines": [
      "いかりの となりに あります。",
      "いえの まえに、じてんしゃが おいて あります。"
     ],
     "kinds": [
      "となり（めじるし）",
      "のりもの"
     ],
     "clues": [
      {
       "t": "near",
       "ref": {
        "m": "ikari"
       }
      },
      {
       "t": "vehicle",
       "v": "jitensha"
      }
     ],
     "houses": [
      "minato-08",
      "minato-02",
      "minato-03",
      "minato-04",
      "minato-10",
      "minato-01"
     ],
     "town": {
      "mark": {
       "id": "ikari",
       "n": "いかり"
      },
      "rows": [
       [
        1,
        2,
        0,
        0
       ],
       [
        3,
        0,
        0,
        0
       ],
       [
        4,
        5,
        "M",
        6
       ]
      ]
     },
     "ans": 6
    }
   ],
   "no": 15
  },
  {
   "stage": "4-2",
   "title": "となり と むかい",
   "qs": [
    {
     "no": 31,
     "target": "minato-02",
     "who": "いるか",
     "lines": [
      "やねの いろは、むらさきです。",
      "はたが たって いる いえの となりに あります。"
     ],
     "kinds": [
      "やね",
      "となり（いえ）"
     ],
     "clues": [
      {
       "t": "roof",
       "v": "むらさき"
      },
      {
       "t": "near",
       "ref": {
        "a": "garden",
        "v": "hata"
       }
      }
     ],
     "houses": [
      "minato-03",
      "minato-10",
      "minato-09",
      "minato-06",
      "minato-02",
      "minato-01"
     ],
     "town": {
      "mark": {
       "id": "todai",
       "n": "とうだい"
      },
      "rows": [
       [
        0,
        1,
        2,
        "M"
       ],
       [
        0,
        3,
        4,
        5
       ],
       [
        6,
        0,
        0,
        0
       ]
      ]
     },
     "ans": 5
    },
    {
     "no": 32,
     "target": "minato-05",
     "who": "たこ",
     "lines": [
      "やねの いろは、オレンジです。",
      "みちを はさんで、ひまわりが さいて いる いえの むかいに あります。"
     ],
     "kinds": [
      "やね",
      "むかい"
     ],
     "clues": [
      {
       "t": "roof",
       "v": "オレンジ"
      },
      {
       "t": "opp",
       "ref": {
        "a": "garden",
        "v": "himawari"
       }
      }
     ],
     "houses": [
      "minato-01",
      "minato-03",
      "minato-09",
      "minato-05",
      "minato-02",
      "minato-06"
     ],
     "town": {
      "mark": {
       "id": "todai",
       "n": "とうだい"
      },
      "rows": [
       [
        0,
        1,
        2,
        3
       ],
       [
        0,
        4,
        5,
        "M"
       ],
       [
        0,
        0,
        6,
        0
       ]
      ]
     },
     "ans": 4
    }
   ],
   "no": 16
  },
  {
   "stage": "4-2",
   "title": "となり と むかい",
   "qs": [
    {
     "no": 33,
     "target": "minato-10",
     "who": "えび",
     "lines": [
      "あかい やねの いえの となりに あります。",
      "ドアの いろは、みどりです。"
     ],
     "kinds": [
      "となり（いえ）",
      "ドア"
     ],
     "clues": [
      {
       "t": "near",
       "ref": {
        "a": "roof",
        "v": "あか"
       }
      },
      {
       "t": "door",
       "v": "みどり"
      }
     ],
     "houses": [
      "minato-10",
      "minato-04",
      "minato-05",
      "minato-06",
      "minato-08",
      "minato-02"
     ],
     "town": {
      "mark": {
       "id": "ikari",
       "n": "いかり"
      },
      "rows": [
       [
        0,
        1,
        2,
        0
       ],
       [
        0,
        3,
        4,
        5
       ],
       [
        6,
        "M",
        0,
        0
       ]
      ]
     },
     "ans": 1
    },
    {
     "no": 34,
     "target": "minato-07",
     "who": "ラッコ",
     "lines": [
      "ドアの いろは、あおです。",
      "みちを はさんで、ひまわりが さいて いる いえの むかいに あります。"
     ],
     "kinds": [
      "ドア",
      "むかい"
     ],
     "clues": [
      {
       "t": "door",
       "v": "あお"
      },
      {
       "t": "opp",
       "ref": {
        "a": "garden",
        "v": "himawari"
       }
      }
     ],
     "houses": [
      "minato-03",
      "minato-07",
      "minato-05",
      "minato-01",
      "minato-10",
      "minato-04"
     ],
     "town": {
      "mark": {
       "id": "todai",
       "n": "とうだい"
      },
      "rows": [
       [
        1,
        2,
        3,
        0
       ],
       [
        "M",
        4,
        5,
        0
       ],
       [
        0,
        0,
        0,
        6
       ]
      ]
     },
     "ans": 2
    }
   ],
   "no": 17
  },
  {
   "stage": "4-3",
   "title": "ばしょの ことば",
   "qs": [
    {
     "no": 35,
     "target": "minato-04",
     "who": "かに",
     "lines": [
      "かべの いろは、みずいろです。",
      "あおい ドアの いえの となりに あります。"
     ],
     "kinds": [
      "かべ",
      "となり（いえ）"
     ],
     "clues": [
      {
       "t": "wall",
       "v": "みずいろ"
      },
      {
       "t": "near",
       "ref": {
        "a": "door",
        "v": "あお"
       }
      }
     ],
     "houses": [
      "minato-07",
      "minato-05",
      "minato-09",
      "minato-04",
      "minato-01",
      "minato-08"
     ],
     "town": {
      "mark": {
       "id": "todai",
       "n": "とうだい"
      },
      "rows": [
       [
        1,
        2,
        3,
        "M"
       ],
       [
        0,
        4,
        5,
        0
       ],
       [
        6,
        0,
        0,
        0
       ]
      ]
     },
     "ans": 4
    },
    {
     "no": 36,
     "target": "minato-08",
     "who": "さめ",
     "lines": [
      "きいろい みちに あります。",
      "ひまわりが さいて いる いえの となりに あります。"
     ],
     "kinds": [
      "みち",
      "となり（いえ）"
     ],
     "clues": [
      {
       "t": "row",
       "v": 1
      },
      {
       "t": "near",
       "ref": {
        "a": "garden",
        "v": "himawari"
       }
      }
     ],
     "houses": [
      "minato-01",
      "minato-05",
      "minato-10",
      "minato-03",
      "minato-08",
      "minato-02"
     ],
     "town": {
      "mark": {
       "id": "todai",
       "n": "とうだい"
      },
      "rows": [
       [
        1,
        2,
        0,
        0
       ],
       [
        0,
        3,
        0,
        0
       ],
       [
        4,
        "M",
        5,
        6
       ]
      ]
     },
     "ans": 5
    }
   ],
   "no": 18
  },
  {
   "stage": "4-3",
   "title": "ばしょの ことば",
   "qs": [
    {
     "no": 37,
     "target": "minato-09",
     "who": "いか",
     "lines": [
      "ドアの いろは、あおです。",
      "みちを はさんで、むらさきの やねの いえの むかいに あります。"
     ],
     "kinds": [
      "ドア",
      "むかい"
     ],
     "clues": [
      {
       "t": "door",
       "v": "あお"
      },
      {
       "t": "opp",
       "ref": {
        "a": "roof",
        "v": "むらさき"
       }
      }
     ],
     "houses": [
      "minato-09",
      "minato-02",
      "minato-01",
      "minato-06",
      "minato-05",
      "minato-10"
     ],
     "town": {
      "mark": {
       "id": "todai",
       "n": "とうだい"
      },
      "rows": [
       [
        "M",
        1,
        2,
        0
       ],
       [
        0,
        3,
        4,
        0
       ],
       [
        0,
        0,
        5,
        6
       ]
      ]
     },
     "ans": 1
    },
    {
     "no": 38,
     "target": "minato-10",
     "who": "えび",
     "lines": [
      "みどりの ドアの いえの となりに あります。",
      "かべの いろは、みずいろです。",
      "やねの いろは、あかです。"
     ],
     "kinds": [
      "となり（いえ）",
      "かべ",
      "やね"
     ],
     "clues": [
      {
       "t": "near",
       "ref": {
        "a": "door",
        "v": "みどり"
       }
      },
      {
       "t": "wall",
       "v": "みずいろ"
      },
      {
       "t": "roof",
       "v": "あか"
      }
     ],
     "houses": [
      "minato-02",
      "minato-10",
      "minato-08",
      "minato-07",
      "minato-05",
      "minato-04"
     ],
     "town": {
      "mark": {
       "id": "ikari",
       "n": "いかり"
      },
      "rows": [
       [
        1,
        2,
        3,
        "M"
       ],
       [
        4,
        5,
        0,
        0
       ],
       [
        0,
        0,
        6,
        0
       ]
      ]
     },
     "ans": 2
    }
   ],
   "no": 19
  },
  {
   "stage": "5-1",
   "title": "みぎ・ひだり・なんけんめ",
   "qs": [
    {
     "no": 39,
     "target": "mura-04",
     "who": "やぎ",
     "lines": [
      "まどの かたちは、さんかくです。",
      "きいろい やねの いえの みぎ どなりに あります。"
     ],
     "kinds": [
      "まど",
      "みぎ／ひだり"
     ],
     "clues": [
      {
       "t": "window",
       "v": "さんかく"
      },
      {
       "t": "side",
       "dir": "R",
       "ref": {
        "a": "roof",
        "v": "きいろ"
       }
      }
     ],
     "houses": [
      "mura-05",
      "mura-09",
      "mura-04",
      "mura-06",
      "mura-01",
      "mura-02"
     ],
     "town": {
      "mark": {
       "id": "hatake",
       "n": "やさいの はたけ"
      },
      "rows": [
       [
        0,
        1,
        2,
        3
       ],
       [
        0,
        4,
        5,
        "M"
       ],
       [
        6,
        0,
        0,
        0
       ]
      ]
     },
     "ans": 3
    },
    {
     "no": 40,
     "target": "mura-06",
     "who": "ぶた",
     "lines": [
      "にわに、みかんの きが あります。",
      "ならんで いる いえの、みぎから 2けんめです。"
     ],
     "kinds": [
      "にわ",
      "なんけんめ"
     ],
     "clues": [
      {
       "t": "garden",
       "v": "mikan"
      },
      {
       "t": "ord",
       "dir": "R",
       "k": 2
      }
     ],
     "houses": [
      "mura-06",
      "mura-08",
      "mura-09",
      "mura-01",
      "mura-02",
      "mura-04"
     ],
     "town": {
      "mark": {
       "id": "hatake",
       "n": "やさいの はたけ"
      },
      "rows": [
       [
        0,
        "M",
        1,
        2
       ],
       [
        0,
        3,
        4,
        5
       ],
       [
        6,
        0,
        0,
        0
       ]
      ]
     },
     "ans": 1
    }
   ],
   "no": 20
  },
  {
   "stage": "5-1",
   "title": "みぎ・ひだり・なんけんめ",
   "qs": [
    {
     "no": 41,
     "target": "mura-10",
     "who": "アルパカ",
     "lines": [
      "にわに、かぼちゃが あります。",
      "みどりの やねの いえの ひだり どなりに あります。"
     ],
     "kinds": [
      "にわ",
      "みぎ／ひだり"
     ],
     "clues": [
      {
       "t": "garden",
       "v": "kabocha"
      },
      {
       "t": "side",
       "dir": "L",
       "ref": {
        "a": "roof",
        "v": "みどり"
       }
      }
     ],
     "houses": [
      "mura-09",
      "mura-01",
      "mura-02",
      "mura-10",
      "mura-08",
      "mura-05"
     ],
     "town": {
      "mark": {
       "id": "hatake",
       "n": "やさいの はたけ"
      },
      "rows": [
       [
        0,
        1,
        2,
        3
       ],
       [
        0,
        4,
        5,
        0
       ],
       [
        6,
        "M",
        0,
        0
       ]
      ]
     },
     "ans": 4
    },
    {
     "no": 42,
     "target": "mura-07",
     "who": "あひる",
     "lines": [
      "ならんで いる いえの、いちばん みぎです。",
      "にわに、かぼちゃが あります。"
     ],
     "kinds": [
      "なんけんめ",
      "にわ"
     ],
     "clues": [
      {
       "t": "ord",
       "dir": "R",
       "k": 1
      },
      {
       "t": "garden",
       "v": "kabocha"
      }
     ],
     "houses": [
      "mura-10",
      "mura-01",
      "mura-05",
      "mura-06",
      "mura-07",
      "mura-04"
     ],
     "town": {
      "mark": {
       "id": "fusha",
       "n": "ふうしゃ"
      },
      "rows": [
       [
        "M",
        1,
        2,
        0
       ],
       [
        3,
        4,
        5,
        0
       ],
       [
        0,
        0,
        6,
        0
       ]
      ]
     },
     "ans": 5
    }
   ],
   "no": 21
  },
  {
   "stage": "5-2",
   "title": "あいだ",
   "qs": [
    {
     "no": 43,
     "target": "mura-01",
     "who": "うし",
     "lines": [
      "ドアの いろは、あおです。",
      "ちゃいろい やねの いえと みどりの やねの いえの あいだに あります。"
     ],
     "kinds": [
      "ドア",
      "あいだ"
     ],
     "clues": [
      {
       "t": "door",
       "v": "あお"
      },
      {
       "t": "between",
       "refs": [
        {
         "a": "roof",
         "v": "ちゃいろ"
        },
        {
         "a": "roof",
         "v": "みどり"
        }
       ]
      }
     ],
     "houses": [
      "mura-06",
      "mura-01",
      "mura-08",
      "mura-02",
      "mura-04",
      "mura-03"
     ],
     "town": {
      "mark": {
       "id": "hatake",
       "n": "やさいの はたけ"
      },
      "rows": [
       [
        1,
        2,
        3,
        4
       ],
       [
        0,
        0,
        0,
        5
       ],
       [
        0,
        "M",
        6,
        0
       ]
      ]
     },
     "ans": 2
    },
    {
     "no": 44,
     "target": "mura-09",
     "who": "しちめんちょう",
     "lines": [
      "みちを はさんで、きいろい やねの いえの むかいに あります。",
      "まどの かたちは、まるです。"
     ],
     "kinds": [
      "むかい",
      "まど"
     ],
     "clues": [
      {
       "t": "opp",
       "ref": {
        "a": "roof",
        "v": "きいろ"
       }
      },
      {
       "t": "window",
       "v": "まる"
      }
     ],
     "houses": [
      "mura-02",
      "mura-06",
      "mura-09",
      "mura-05",
      "mura-01",
      "mura-10"
     ],
     "town": {
      "mark": {
       "id": "hatake",
       "n": "やさいの はたけ"
      },
      "rows": [
       [
        1,
        2,
        3,
        0
       ],
       [
        0,
        0,
        4,
        5
       ],
       [
        6,
        "M",
        0,
        0
       ]
      ]
     },
     "ans": 3
    }
   ],
   "no": 22
  },
  {
   "stage": "5-2",
   "title": "あいだ",
   "qs": [
    {
     "no": 45,
     "target": "mura-03",
     "who": "ひつじ",
     "lines": [
      "みどりの やねの いえと あかい やねの いえの あいだに あります。"
     ],
     "kinds": [
      "あいだ"
     ],
     "clues": [
      {
       "t": "between",
       "refs": [
        {
         "a": "roof",
         "v": "みどり"
        },
        {
         "a": "roof",
         "v": "あか"
        }
       ]
      }
     ],
     "houses": [
      "mura-06",
      "mura-07",
      "mura-02",
      "mura-03",
      "mura-04",
      "mura-01"
     ],
     "town": {
      "mark": {
       "id": "hatake",
       "n": "やさいの はたけ"
      },
      "rows": [
       [
        0,
        1,
        "M",
        2
       ],
       [
        3,
        4,
        5,
        0
       ],
       [
        6,
        0,
        0,
        0
       ]
      ]
     },
     "ans": 4
    },
    {
     "no": 46,
     "target": "mura-02",
     "who": "うま",
     "lines": [
      "ちゃいろい やねの いえの ひだり どなりに あります。",
      "やねの いろは、みどりです。"
     ],
     "kinds": [
      "みぎ／ひだり",
      "やね"
     ],
     "clues": [
      {
       "t": "side",
       "dir": "L",
       "ref": {
        "a": "roof",
        "v": "ちゃいろ"
       }
      },
      {
       "t": "roof",
       "v": "みどり"
      }
     ],
     "houses": [
      "mura-10",
      "mura-06",
      "mura-04",
      "mura-08",
      "mura-02",
      "mura-01"
     ],
     "town": {
      "mark": {
       "id": "fusha",
       "n": "ふうしゃ"
      },
      "rows": [
       [
        0,
        0,
        1,
        2
       ],
       [
        3,
        4,
        0,
        0
       ],
       [
        0,
        "M",
        5,
        6
       ]
      ]
     },
     "ans": 5
    }
   ],
   "no": 23
  },
  {
   "stage": "5-3",
   "title": "ばしょ と みため",
   "qs": [
    {
     "no": 47,
     "target": "mura-05",
     "who": "にわとり",
     "lines": [
      "やねの いろは、きいろです。",
      "にわに、とうもろこしが あります。",
      "ならんで いる いえの、いちばん ひだりです。"
     ],
     "kinds": [
      "やね",
      "にわ",
      "なんけんめ"
     ],
     "clues": [
      {
       "t": "roof",
       "v": "きいろ"
      },
      {
       "t": "garden",
       "v": "morokoshi"
      },
      {
       "t": "ord",
       "dir": "L",
       "k": 1
      }
     ],
     "houses": [
      "mura-05",
      "mura-07",
      "mura-03",
      "mura-09",
      "mura-01",
      "mura-06"
     ],
     "town": {
      "mark": {
       "id": "fusha",
       "n": "ふうしゃ"
      },
      "rows": [
       [
        1,
        2,
        3,
        "M"
       ],
       [
        4,
        0,
        0,
        0
       ],
       [
        5,
        6,
        0,
        0
       ]
      ]
     },
     "ans": 1
    },
    {
     "no": 48,
     "target": "mura-02",
     "who": "うま",
     "lines": [
      "まどの かたちは、しかくです。",
      "きいろい やねの いえの となりに あります。",
      "あおい みちに あります。"
     ],
     "kinds": [
      "まど",
      "となり（いえ）",
      "みち"
     ],
     "clues": [
      {
       "t": "window",
       "v": "しかく"
      },
      {
       "t": "near",
       "ref": {
        "a": "roof",
        "v": "きいろ"
       }
      },
      {
       "t": "row",
       "v": 0
      }
     ],
     "houses": [
      "mura-06",
      "mura-09",
      "mura-02",
      "mura-05",
      "mura-08",
      "mura-10"
     ],
     "town": {
      "mark": {
       "id": "fusha",
       "n": "ふうしゃ"
      },
      "rows": [
       [
        0,
        0,
        1,
        2
       ],
       [
        0,
        0,
        3,
        4
       ],
       [
        0,
        "M",
        5,
        6
       ]
      ]
     },
     "ans": 3
    }
   ],
   "no": 24
  },
  {
   "stage": "5-3",
   "title": "ばしょ と みため",
   "qs": [
    {
     "no": 49,
     "target": "mura-04",
     "who": "やぎ",
     "lines": [
      "いえの まえに、トラクターが とまって います。",
      "ならんで いる いえの、いちばん みぎです。",
      "かべの いろは、しろです。"
     ],
     "kinds": [
      "のりもの",
      "なんけんめ",
      "かべ"
     ],
     "clues": [
      {
       "t": "vehicle",
       "v": "torakuta"
      },
      {
       "t": "ord",
       "dir": "R",
       "k": 1
      },
      {
       "t": "wall",
       "v": "しろ"
      }
     ],
     "houses": [
      "mura-07",
      "mura-05",
      "mura-03",
      "mura-09",
      "mura-08",
      "mura-04"
     ],
     "town": {
      "mark": {
       "id": "fusha",
       "n": "ふうしゃ"
      },
      "rows": [
       [
        "M",
        1,
        2,
        3
       ],
       [
        0,
        4,
        0,
        0
       ],
       [
        5,
        6,
        0,
        0
       ]
      ]
     },
     "ans": 6
    },
    {
     "no": 50,
     "target": "mura-08",
     "who": "ひよこ",
     "lines": [
      "いえの まえに、じてんしゃが おいて あります。",
      "まどの かたちは、しかくです。",
      "みどりの ドアの いえの となりに あります。"
     ],
     "kinds": [
      "のりもの",
      "まど",
      "となり（いえ）"
     ],
     "clues": [
      {
       "t": "vehicle",
       "v": "jitensha"
      },
      {
       "t": "window",
       "v": "しかく"
      },
      {
       "t": "near",
       "ref": {
        "a": "door",
        "v": "みどり"
       }
      }
     ],
     "houses": [
      "mura-08",
      "mura-10",
      "mura-05",
      "mura-09",
      "mura-04",
      "mura-02"
     ],
     "town": {
      "mark": {
       "id": "hatake",
       "n": "やさいの はたけ"
      },
      "rows": [
       [
        "M",
        1,
        2,
        0
       ],
       [
        0,
        0,
        3,
        4
       ],
       [
        0,
        5,
        6,
        0
       ]
      ]
     },
     "ans": 1
    }
   ],
   "no": 25
  },
  {
   "stage": "6-1",
   "title": "まとめ",
   "qs": [
    {
     "no": 51,
     "target": "yama-10",
     "who": "ドラゴン",
     "lines": [
      "ならんで いる いえの、いちばん ひだりです。",
      "やねの いろは、みどりです。",
      "かべの いろは、きいろです。"
     ],
     "kinds": [
      "なんけんめ",
      "やね",
      "かべ"
     ],
     "clues": [
      {
       "t": "ord",
       "dir": "L",
       "k": 1
      },
      {
       "t": "roof",
       "v": "みどり"
      },
      {
       "t": "wall",
       "v": "きいろ"
      }
     ],
     "houses": [
      "yama-04",
      "yama-08",
      "yama-01",
      "yama-10",
      "yama-09",
      "yama-03"
     ],
     "town": {
      "mark": {
       "id": "ropu",
       "n": "ロープウェイ"
      },
      "rows": [
       [
        0,
        1,
        2,
        0
       ],
       [
        3,
        0,
        0,
        0
       ],
       [
        4,
        5,
        "M",
        6
       ]
      ]
     },
     "ans": 4
    },
    {
     "no": 52,
     "target": "yama-06",
     "who": "カンガルー",
     "lines": [
      "やねの いろは、ピンクです。",
      "かべの いろは、ちゃいろです。",
      "いえの まえに、バイクが とまって います。"
     ],
     "kinds": [
      "やね",
      "かべ",
      "のりもの"
     ],
     "clues": [
      {
       "t": "roof",
       "v": "ピンク"
      },
      {
       "t": "wall",
       "v": "ちゃいろ"
      },
      {
       "t": "vehicle",
       "v": "baiku"
      }
     ],
     "houses": [
      "yama-08",
      "yama-02",
      "yama-04",
      "yama-09",
      "yama-07",
      "yama-06"
     ],
     "ans": 6
    }
   ],
   "no": 26
  },
  {
   "stage": "6-1",
   "title": "まとめ",
   "qs": [
    {
     "no": 53,
     "target": "yama-05",
     "who": "ひょう",
     "lines": [
      "あおい みちに あります。",
      "みどりの やねの いえの となりに あります。",
      "ドアの いろは、あおです。"
     ],
     "kinds": [
      "みち",
      "となり（いえ）",
      "ドア"
     ],
     "clues": [
      {
       "t": "row",
       "v": 0
      },
      {
       "t": "near",
       "ref": {
        "a": "roof",
        "v": "みどり"
       }
      },
      {
       "t": "door",
       "v": "あお"
      }
     ],
     "houses": [
      "yama-03",
      "yama-04",
      "yama-05",
      "yama-08",
      "yama-01",
      "yama-10"
     ],
     "town": {
      "mark": {
       "id": "ropu",
       "n": "ロープウェイ"
      },
      "rows": [
       [
        1,
        2,
        3,
        0
       ],
       [
        0,
        4,
        0,
        0
       ],
       [
        0,
        5,
        6,
        "M"
       ]
      ]
     },
     "ans": 3
    },
    {
     "no": 54,
     "target": "yama-07",
     "who": "バイソン",
     "lines": [
      "ならんで いる いえの、いちばん ひだりです。",
      "やねの いろは、みどりです。",
      "かべの いろは、ちゃいろです。"
     ],
     "kinds": [
      "なんけんめ",
      "やね",
      "かべ"
     ],
     "clues": [
      {
       "t": "ord",
       "dir": "L",
       "k": 1
      },
      {
       "t": "roof",
       "v": "みどり"
      },
      {
       "t": "wall",
       "v": "ちゃいろ"
      }
     ],
     "houses": [
      "yama-03",
      "yama-01",
      "yama-06",
      "yama-09",
      "yama-07",
      "yama-04"
     ],
     "town": {
      "mark": {
       "id": "ropu",
       "n": "ロープウェイ"
      },
      "rows": [
       [
        "M",
        1,
        2,
        0
       ],
       [
        3,
        4,
        0,
        0
       ],
       [
        0,
        0,
        5,
        6
       ]
      ]
     },
     "ans": 5
    }
   ],
   "no": 27
  },
  {
   "stage": "6-2",
   "title": "まとめ",
   "qs": [
    {
     "no": 55,
     "target": "yama-03",
     "who": "とら",
     "lines": [
      "ならんで いる いえの、いちばん ひだりです。",
      "かべの いろは、きいろです。",
      "やねの いろは、みどりです。"
     ],
     "kinds": [
      "なんけんめ",
      "かべ",
      "やね"
     ],
     "clues": [
      {
       "t": "ord",
       "dir": "L",
       "k": 1
      },
      {
       "t": "wall",
       "v": "きいろ"
      },
      {
       "t": "roof",
       "v": "みどり"
      }
     ],
     "houses": [
      "yama-03",
      "yama-04",
      "yama-09",
      "yama-10",
      "yama-05",
      "yama-07"
     ],
     "town": {
      "mark": {
       "id": "onsen",
       "n": "おんせん"
      },
      "rows": [
       [
        1,
        2,
        3,
        4
       ],
       [
        0,
        0,
        0,
        5
       ],
       [
        "M",
        6,
        0,
        0
       ]
      ]
     },
     "ans": 1
    },
    {
     "no": 56,
     "target": "yama-09",
     "who": "しまうま",
     "lines": [
      "みどりの やねの いえの ひだり どなりに あります。",
      "いえの まえに、バスが とまって います。"
     ],
     "kinds": [
      "みぎ／ひだり",
      "のりもの"
     ],
     "clues": [
      {
       "t": "side",
       "dir": "L",
       "ref": {
        "a": "roof",
        "v": "みどり"
       }
      },
      {
       "t": "vehicle",
       "v": "basu"
      }
     ],
     "houses": [
      "yama-08",
      "yama-10",
      "yama-02",
      "yama-09",
      "yama-07",
      "yama-03"
     ],
     "town": {
      "mark": {
       "id": "ropu",
       "n": "ロープウェイ"
      },
      "rows": [
       [
        0,
        1,
        2,
        3
       ],
       [
        "M",
        4,
        5,
        0
       ],
       [
        0,
        0,
        0,
        6
       ]
      ]
     },
     "ans": 4
    }
   ],
   "no": 28
  },
  {
   "stage": "6-3",
   "title": "めいたんていの しけん",
   "qs": [
    {
     "no": 57,
     "target": "yama-01",
     "who": "わし",
     "lines": [
      "いえの まえに、そりが おいて あります。",
      "まどの かたちは、しかくです。",
      "あかい やねの いえの となりに あります。"
     ],
     "kinds": [
      "のりもの",
      "まど",
      "となり（いえ）"
     ],
     "clues": [
      {
       "t": "vehicle",
       "v": "sori"
      },
      {
       "t": "window",
       "v": "しかく"
      },
      {
       "t": "near",
       "ref": {
        "a": "roof",
        "v": "あか"
       }
      }
     ],
     "houses": [
      "yama-02",
      "yama-05",
      "yama-07",
      "yama-04",
      "yama-09",
      "yama-01"
     ],
     "town": {
      "mark": {
       "id": "ropu",
       "n": "ロープウェイ"
      },
      "rows": [
       [
        0,
        0,
        1,
        2
       ],
       [
        "M",
        3,
        0,
        0
       ],
       [
        4,
        5,
        6,
        0
       ]
      ]
     },
     "ans": 6
    },
    {
     "no": 58,
     "target": "yama-07",
     "who": "バイソン",
     "lines": [
      "ピンクの やねの いえと みどりの やねの いえの あいだに あります。",
      "いえの まえに、バイクが とまって います。"
     ],
     "kinds": [
      "あいだ",
      "のりもの"
     ],
     "clues": [
      {
       "t": "between",
       "refs": [
        {
         "a": "roof",
         "v": "ピンク"
        },
        {
         "a": "roof",
         "v": "みどり"
        }
       ]
      },
      {
       "t": "vehicle",
       "v": "baiku"
      }
     ],
     "houses": [
      "yama-06",
      "yama-07",
      "yama-03",
      "yama-08",
      "yama-10",
      "yama-01"
     ],
     "town": {
      "mark": {
       "id": "onsen",
       "n": "おんせん"
      },
      "rows": [
       [
        1,
        2,
        3,
        4
       ],
       [
        0,
        0,
        5,
        0
       ],
       [
        0,
        "M",
        6,
        0
       ]
      ]
     },
     "ans": 2
    }
   ],
   "no": 29
  },
  {
   "stage": "6-3",
   "title": "めいたんていの しけん",
   "qs": [
    {
     "no": 59,
     "target": "yama-02",
     "who": "しろくま",
     "lines": [
      "ならんで いる いえの、いちばん ひだりです。",
      "あおい みちに あります。",
      "にわに、ゆきだるまが あります。"
     ],
     "kinds": [
      "なんけんめ",
      "みち",
      "にわ"
     ],
     "clues": [
      {
       "t": "ord",
       "dir": "L",
       "k": 1
      },
      {
       "t": "row",
       "v": 0
      },
      {
       "t": "garden",
       "v": "yukidaruma"
      }
     ],
     "houses": [
      "yama-02",
      "yama-06",
      "yama-08",
      "yama-04",
      "yama-07",
      "yama-09"
     ],
     "town": {
      "mark": {
       "id": "onsen",
       "n": "おんせん"
      },
      "rows": [
       [
        0,
        1,
        2,
        0
       ],
       [
        3,
        4,
        5,
        "M"
       ],
       [
        0,
        6,
        0,
        0
       ]
      ]
     },
     "ans": 1
    },
    {
     "no": 60,
     "target": "yama-04",
     "who": "ゴリラ",
     "lines": [
      "ならんで いる いえの、いちばん みぎです。",
      "かべの いろは、ちゃいろです。",
      "やねの いろは、みどりです。"
     ],
     "kinds": [
      "なんけんめ",
      "かべ",
      "やね"
     ],
     "clues": [
      {
       "t": "ord",
       "dir": "R",
       "k": 1
      },
      {
       "t": "wall",
       "v": "ちゃいろ"
      },
      {
       "t": "roof",
       "v": "みどり"
      }
     ],
     "houses": [
      "yama-07",
      "yama-08",
      "yama-03",
      "yama-10",
      "yama-05",
      "yama-04"
     ],
     "town": {
      "mark": {
       "id": "onsen",
       "n": "おんせん"
      },
      "rows": [
       [
        0,
        "M",
        1,
        2
       ],
       [
        3,
        4,
        0,
        0
       ],
       [
        0,
        0,
        5,
        6
       ]
      ]
     },
     "ans": 6
    }
   ],
   "no": 30
  }
 ]
};
if (typeof module !== 'undefined') module.exports = OUCHI_PRINT;
