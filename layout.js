// 清涧园规划数据；不含构建、渲染、材质实例或随机执行逻辑。
export const layout = {
  "version": "1.0-planning-review",
  "project": "清涧园",
  "coordinates": {
    "unit": "m",
    "axes": {
      "x": "东为正",
      "y": "上为正",
      "z": "北为正"
    },
    "origin": "中部水池水面中心",
    "positionMeaning": "水平包围盒中心；y为底面标高，水池为池底标高",
    "sizeOrder": [
      "东西宽",
      "竖向高",
      "南北深"
    ],
    "yaw": "从北向东顺时针；0朝北、90朝东、180朝南；size是世界轴包围盒尺寸",
    "localCoordinates": "所有子项与锚点均为世界坐标；不叠加父变换",
    "authority": "一切世界位置、路径、尺寸、朝向仅以本文件为准；不得在模块或镜头文件另写世界坐标"
  },
  "site": {
    "bounds": {
      "min": [
        -16,
        -1.2,
        -14
      ],
      "max": [
        16,
        10,
        14
      ]
    },
    "groundY": 0.35,
    "waterY": 0,
    "poolBottomY": -1.2,
    "walkwayY": 0.4,
    "buildingFloorY": 0.55,
    "maxCanopyY": 10
  },
  "objects": [
    {
      "id": "pool",
      "name": "中部水池",
      "position": [
        0,
        -1.2,
        0
      ],
      "size": [
        16,
        1.2,
        13
      ],
      "yawDeg": 0,
      "outlineXZ": [
        [
          -8,
          -5
        ],
        [
          -6,
          -7
        ],
        [
          5,
          -7
        ],
        [
          8,
          -4
        ],
        [
          8,
          3
        ],
        [
          5,
          6
        ],
        [
          -5,
          6
        ],
        [
          -8,
          3
        ]
      ],
      "bankWidth": 0.55,
      "underBridgeWaterContinuous": true
    },
    {
      "id": "watersideHall",
      "name": "临水草堂",
      "position": [
        -10,
        0.55,
        1
      ],
      "size": [
        5,
        4.7,
        7
      ],
      "yawDeg": 90,
      "bays": 3,
      "bayWidth": 2.2,
      "roofSlopeDeg": 28,
      "eaveOverhang": 0.65,
      "roofType": "双坡硬山带轻微翘角；瓦顶，草堂仅为名称"
    },
    {
      "id": "reflectionPavilion",
      "name": "映水阁",
      "position": [
        6,
        0.55,
        5
      ],
      "size": [
        4,
        5.2,
        4
      ],
      "yawDeg": 225,
      "bays": 1,
      "roofSlopeDeg": 30,
      "eaveOverhang": 0.6,
      "roofType": "四角攒尖单檐",
      "waterFacingEdge": "西南侧临水，台基在池界内局部落脚"
    },
    {
      "id": "mainHall",
      "name": "主厅堂",
      "position": [
        0,
        0.55,
        10
      ],
      "size": [
        10.8,
        5.6,
        5.5
      ],
      "yawDeg": 180,
      "bays": 3,
      "bayWidth": 3.6,
      "roofSlopeDeg": 30,
      "eaveOverhang": 0.75,
      "roofType": "双坡硬山，山墙粉白，栗木落地格扇"
    },
    {
      "id": "stoneStudio",
      "name": "观石轩",
      "position": [
        -11.2,
        0.55,
        10
      ],
      "size": [
        6,
        4.6,
        5
      ],
      "yawDeg": 180,
      "bays": 3,
      "bayWidth": 2,
      "roofSlopeDeg": 28,
      "eaveOverhang": 0.6,
      "roofType": "双坡硬山"
    },
    {
      "id": "cloudStones",
      "name": "叠云石组",
      "position": [
        -11.5,
        0.35,
        6
      ],
      "size": [
        5,
        3.5,
        2.5
      ],
      "yawDeg": 160,
      "form": "瘦皱漏透、灰白薄壁洞石、三峰高低错落；独立于池畔黄石",
      "throughHoles": [
        {
          "center": [
            -11.7,
            2,
            6
          ],
          "radii": [
            0.55,
            0.65,
            0.8
          ],
          "axis": "南北贯通"
        },
        {
          "center": [
            -10.4,
            1.5,
            6
          ],
          "radii": [
            0.32,
            0.45,
            0.7
          ],
          "axis": "南北贯通"
        }
      ],
      "clearCourt": {
        "minXZ": [
          -14,
          3.8
        ],
        "maxXZ": [
          -8.5,
          7.3
        ]
      }
    },
    {
      "id": "corridor",
      "name": "游廊",
      "position": [
        0,
        0.4,
        0
      ],
      "size": [
        30,
        3.6,
        26
      ],
      "yawDeg": 0,
      "footprintMeaning": "组合路径的总预留范围，绝非整块占地",
      "width": 1.8,
      "roofSlopeDeg": 24,
      "eaveOverhang": 0.45,
      "segments": [
        {
          "id": "east",
          "points": [
            [
              10,
              0.4,
              -10
            ],
            [
              10,
              0.4,
              -4
            ],
            [
              10.8,
              0.4,
              1
            ],
            [
              10,
              0.4,
              7
            ],
            [
              7,
              0.4,
              8
            ]
          ]
        },
        {
          "id": "south",
          "points": [
            [
              -12,
              0.4,
              -10
            ],
            [
              0,
              0.4,
              -10
            ],
            [
              10,
              0.4,
              -10
            ]
          ]
        },
        {
          "id": "west",
          "points": [
            [
              -14,
              0.4,
              -10
            ],
            [
              -14,
              0.4,
              1
            ],
            [
              -14,
              0.4,
              8
            ]
          ]
        }
      ],
      "inscriptions": [
        {
          "id": "inscription",
          "position": [
            11.55,
            1.65,
            -3
          ],
          "size": [
            0.035,
            0.55,
            1.8
          ],
          "yawDeg": 270,
          "text": "清风入园 山水有声",
          "method": "内置自定义笔画线段挤出；浅浮雕0.008m；不得加载字体、图像、贴图"
        }
      ]
    },
    {
      "id": "wall",
      "name": "粉墙花窗",
      "position": [
        0,
        0.35,
        0
      ],
      "size": [
        31,
        3.1,
        27
      ],
      "yawDeg": 0,
      "footprintMeaning": "分段墙体预留范围，按segments施工",
      "segments": [
        {
          "id": "eastWall",
          "from": [
            11.7,
            0.35,
            -12
          ],
          "to": [
            11.7,
            0.35,
            12.7
          ],
          "height": 3.1,
          "thickness": 0.28
        },
        {
          "id": "southWall",
          "from": [
            -15.2,
            0.35,
            -12
          ],
          "to": [
            15.2,
            0.35,
            -12
          ],
          "height": 3.1,
          "thickness": 0.28
        },
        {
          "id": "westWall",
          "from": [
            -15.2,
            0.35,
            -12
          ],
          "to": [
            -15.2,
            0.35,
            12.7
          ],
          "height": 3.1,
          "thickness": 0.28
        },
        {
          "id": "northWall",
          "from": [
            -15.2,
            0.35,
            13
          ],
          "to": [
            15.2,
            0.35,
            13
          ],
          "height": 3.1,
          "thickness": 0.28
        }
      ],
      "windows": [
        {
          "id": "latticeWindow",
          "center": [
            11.7,
            1.85,
            -6
          ],
          "size": [
            0.28,
            1.3,
            1.4
          ],
          "yawDeg": 270,
          "pattern": "方框内冰裂纹折线＋稀疏菱格",
          "barWidth": 0.035,
          "clearSpacingRange": [
            0.18,
            0.26
          ],
          "voidRatioMin": 0.62
        },
        {
          "id": "latticeWindow2",
          "center": [
            11.7,
            1.85,
            0
          ],
          "size": [
            0.28,
            1.3,
            1.4
          ],
          "yawDeg": 270,
          "pattern": "同系列疏密变化",
          "barWidth": 0.035,
          "clearSpacingRange": [
            0.18,
            0.26
          ],
          "voidRatioMin": 0.62
        }
      ],
      "shadowReceiver": {
        "id": "windowShadowWall",
        "position": [
          9,
          0.35,
          -3.3
        ],
        "size": [
          0.16,
          2.8,
          2.6
        ],
        "yawDeg": 270,
        "note": "与漏窗错位的独立粉白短墙；接收东南低角度透射框影；不得封堵通行"
      },
      "moonGate": {
        "id": "moonGate",
        "center": [
          -6.8,
          1.7,
          13
        ],
        "diameter": 2.7,
        "wallThickness": 0.28,
        "yawDeg": 180,
        "clearOpeningBottomY": 0.35,
        "viewTarget": "yellowRock",
        "opening": "真实贯通圆孔，底部与地坪相切"
      }
    },
    {
      "id": "bridge",
      "name": "石板小桥",
      "position": [
        2,
        0.45,
        -7
      ],
      "size": [
        2,
        0.35,
        4.8
      ],
      "yawDeg": 0,
      "connects": [
        "南岸步道",
        "池内北端落脚石台"
      ],
      "abutments": [
        {
          "position": [
            2,
            0.1,
            -4.6
          ],
          "size": [
            2.6,
            0.5,
            1.2
          ]
        },
        {
          "position": [
            2,
            0.1,
            -9.4
          ],
          "size": [
            2.6,
            0.5,
            1.2
          ]
        }
      ],
      "railHeight": 0.65
    },
    {
      "id": "bonsai",
      "name": "盆景台",
      "position": [
        -6,
        0.35,
        8
      ],
      "size": [
        2.4,
        0.75,
        0.9
      ],
      "yawDeg": 180,
      "plantMaxHeight": 1.2,
      "potCount": 3
    }
  ],
  "reservedZones": {
    "yellowRock": {
      "owner": "terrain",
      "position": [
        -6.4,
        0.1,
        4.5
      ],
      "size": [
        4,
        2.8,
        2.6
      ],
      "yawDeg": 125,
      "style": "池北偏西低伏层叠黄石；仅块面浅裂隙，不用洞石形态",
      "paletteVariant": "lakeStone.variants.yellowRock"
    },
    "terrain": {
      "boundsXZ": [
        [
          -15.2,
          -12
        ],
        [
          15.2,
          12.7
        ]
      ],
      "groundMaxRise": 0.3,
      "exclude": [
        "pool",
        "建筑台基",
        "游廊路径",
        "小桥台基",
        "叠云石组庭院"
      ]
    },
    "waterLife": {
      "lotusBeds": [
        {
          "center": [
            4,
            0,
            -3
          ],
          "radius": 1.1
        },
        {
          "center": [
            -5,
            0,
            -2
          ],
          "radius": 0.9
        }
      ],
      "budPosition": [
        4,
        0.22,
        -3
      ],
      "fishSwimmingBounds": {
        "min": [
          -5,
          -0.8,
          -4
        ],
        "max": [
          5,
          -0.3,
          2
        ]
      },
      "exclude": [
        "映水阁台基",
        "桥墩台基",
        "yellowRock"
      ]
    },
    "planting": {
      "trees": [
        {
          "center": [
            13,
            0.35,
            10
          ],
          "canopyRadius": 1.4,
          "height": 5
        },
        {
          "center": [
            -12,
            0.35,
            -5
          ],
          "canopyRadius": 2,
          "height": 6
        },
        {
          "center": [
            13,
            0.35,
            7
          ],
          "canopyRadius": 1.2,
          "height": 5
        }
      ],
      "shrubs": [
        {
          "center": [
            -7,
            0.35,
            -9
          ],
          "radius": 1
        },
        {
          "center": [
            7,
            0.35,
            -9
          ],
          "radius": 1
        }
      ],
      "exclusions": [
        "月洞门至yellowRock通视廊",
        "漏窗入射光廊",
        "全部相机轨迹",
        "建筑与游廊净空"
      ]
    }
  },
  "sightlines": {
    "moonGateView": {
      "from": [
        -6.8,
        1.7,
        14.5
      ],
      "through": [
        -6.8,
        1.7,
        13
      ],
      "to": [
        -6.4,
        1.4,
        4.5
      ],
      "clearanceRadius": 0.6
    },
    "latticeSunPassage": {
      "from": [
        14,
        2.25,
        -8.3
      ],
      "through": [
        11.7,
        1.85,
        -6
      ],
      "to": [
        9,
        2.32,
        -3.3
      ],
      "note": "仅为通光保护区；最终太阳光向量以materials.js为准"
    }
  },
  "cameraAnchors": {
    "s1Detail": {
      "position": [
        9.55,
        2.3,
        -4.2
      ],
      "target": [
        9,
        2.32,
        -3.3
      ],
      "fovDeg": 36
    },
    "s1Wide": {
      "position": [
        5.8,
        4.2,
        -10.8
      ],
      "target": [
        11.2,
        1.8,
        -3
      ],
      "fovDeg": 58
    },
    "s2Detail": {
      "position": [
        4.32,
        0.48,
        -3.45
      ],
      "target": [
        4,
        0.22,
        -3
      ],
      "fovDeg": 38
    },
    "s2Wide": {
      "position": [
        4,
        5.6,
        -9
      ],
      "target": [
        0,
        1.1,
        2.1
      ],
      "fovDeg": 62
    },
    "s3Detail": {
      "position": [
        -11.7,
        2,
        4.95
      ],
      "target": [
        -11.7,
        2,
        6
      ],
      "fovDeg": 35
    },
    "s3Wide": {
      "position": [
        -6.5,
        6.5,
        5.5
      ],
      "target": [
        -11,
        1.8,
        7.5
      ],
      "fovDeg": 60
    },
    "s4Detail": {
      "position": [
        10.95,
        1.65,
        -3
      ],
      "target": [
        11.55,
        1.65,
        -3
      ],
      "fovDeg": 35
    },
    "s4Wide": {
      "position": [
        9.1,
        2.8,
        -9
      ],
      "target": [
        11.3,
        1.7,
        2
      ],
      "fovDeg": 62
    },
    "s5Detail": {
      "position": [
        -6.8,
        1.7,
        14.5
      ],
      "target": [
        -6.5,
        1.55,
        8
      ],
      "fovDeg": 65
    },
    "s5Lift": {
      "position": [
        -6.8,
        8,
        17.5
      ],
      "target": [
        0,
        1,
        0
      ],
      "fovDeg": 60
    },
    "s5Aerial": {
      "position": [
        -2,
        40,
        24
      ],
      "target": [
        0,
        0,
        0
      ],
      "fovDeg": 58
    }
  },
  "constructionConstraints": {
    "proceduralOnly": true,
    "externalModelsImagesTexturesFonts": false,
    "realLatticeOpenings": true,
    "realCloudStoneHoles": true,
    "realMoonGateOpening": true,
    "inscriptionGeometryOnly": true,
    "noCoordinateOverrides": true,
    "noRuntimeFilesUntilApproval": true,
    "sunBacklightNote": "北侧月洞门朝南取景，固定东南太阳形成侧逆光；不要求太阳圆盘在门洞正中"
  }
};
