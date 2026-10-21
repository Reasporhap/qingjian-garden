// 清涧园规划数据；不含构建、渲染、材质实例或随机执行逻辑。
export const materials = {
  "version": "1.0",
  "random": {
    "seed": 20271021,
    "algorithm": "mulberry32",
    "stateType": "uint32",
    "streamRule": "每个语义对象从固定seed与稳定id的FNV-1a uint32哈希异或初始化独立流；不得依赖模块调用顺序",
    "idEncoding": "UTF-8",
    "fnv1aOffsetBasis": 2166136261,
    "fnv1aPrime": 16777619,
    "seedCombination": "uint32(seed XOR fnv1a(stableObjectId))",
    "forbidden": [
      "Math.random()",
      "时间戳种子",
      "未固定种子的噪声",
      "按帧累积随机"
    ],
    "animation": "以绝对时间t和固定相位计算，重播t=0状态一致"
  },
  "parameterConvention": {
    "colors": "sRGB十六进制；渲染前统一转线性",
    "roughness": "0光滑—1粗糙",
    "metalness": "0非金属—1金属",
    "proceduralVariation": "只允许顶点色、几何起伏或解析shader；禁止图像纹理、烘焙贴图与外部文件"
  },
  "sun": {
    "azimuthDeg": 135,
    "azimuthConvention": "北0顺时针",
    "elevationDeg": 7,
    "directionToSun": [
      0.701836,
      0.121869,
      -0.701836
    ],
    "color": "#FFD9AC",
    "temperatureK": 3800,
    "positionPolicy": "方向固定，不绑定实景日期地点；无日照移动",
    "softShadowAngularRadiusDeg": 0.27,
    "ambientToSunRatio": 0.22
  },
  "materials": {
    "plaster": {
      "label": "粉墙",
      "baseColor": "#E9E5D9",
      "roughness": 0.92,
      "metalness": 0,
      "variationColors": [
        "#DEDCCF",
        "#F2EEE4"
      ],
      "heightVariationM": 0.002,
      "stainCoverageMax": 0.08
    },
    "roofTile": {
      "label": "青瓦",
      "baseColor": "#3F4445",
      "roughness": 0.82,
      "metalness": 0,
      "variationColors": [
        "#343A3D",
        "#59605E"
      ],
      "variationStrength": 0.12,
      "geometry": "逐片弧瓦与滴水瓦；严禁贴图瓦缝"
    },
    "chestnutWood": {
      "label": "栗色木",
      "baseColor": "#42271E",
      "roughness": 0.64,
      "metalness": 0,
      "variationColors": [
        "#34231E",
        "#674332"
      ],
      "grainReliefMaxM": 0.001,
      "clearcoat": 0.08
    },
    "lakeStone": {
      "label": "湖石",
      "baseColor": "#A4A399",
      "roughness": 0.94,
      "metalness": 0,
      "variationColors": [
        "#777D76",
        "#C0BDB0"
      ],
      "variants": {
        "yellowRock": {
          "baseColor": "#A38B68",
          "variationColors": [
            "#86785F",
            "#B4A17F"
          ],
          "roughness": 0.96
        }
      },
      "geometryReliefM": [
        0.02,
        0.12
      ],
      "cavityColor": "#646B61"
    },
    "moss": {
      "label": "青苔",
      "baseColor": "#536346",
      "roughness": 1,
      "metalness": 0,
      "variationColors": [
        "#3F5039",
        "#778361"
      ],
      "coverageMax": 0.16,
      "placement": "石底、墙脚、背阴潮湿裂隙"
    },
    "slate": {
      "label": "石板",
      "baseColor": "#898C86",
      "roughness": 0.85,
      "metalness": 0,
      "variationColors": [
        "#707C78",
        "#AAA99D"
      ],
      "wetRoughness": 0.46,
      "wetDarkenFactor": 0.78,
      "jointWidthM": 0.012
    },
    "foliage": {
      "label": "绿植",
      "baseColor": "#4C683F",
      "roughness": 0.83,
      "metalness": 0,
      "variationColors": [
        "#304C35",
        "#7A8E4A",
        "#A4AF67"
      ],
      "accentColors": [
        "#A3563E",
        "#BC6F70"
      ],
      "accentCoverageMax": 0.08,
      "leafTransmission": 0.18
    }
  },
  "auxiliaryOptics": {
    "note": "非第八种材质；水体等特效的统一非固体光学/顶点色参数，由既定七色族派生",
    "water": {
      "deriveColorFrom": "foliage",
      "color": "#294E45",
      "ior": 1.333,
      "roughness": 0.08,
      "opacity": 0.72,
      "waveHeightM": 0.018,
      "wavePeriodS": 3.2
    },
    "fish": {
      "derivePaletteFrom": [
        "plaster",
        "foliage.accentColors",
        "chestnutWood"
      ],
      "maxCount": 12
    },
    "bud": {
      "deriveColorFrom": "foliage.accentColors",
      "color": "#BC6F70"
    },
    "movingLight": {
      "periodS": 4,
      "strength": 0.16,
      "method": "固定太阳下水面反射焦散与遮挡缓动；允许解析程序化反射，不能把平面亮斑冒充孔洞"
    }
  },
  "sharedRules": {
    "noMaterialInstances": true,
    "noExternalAssets": true,
    "shadowCastingAndReceiving": true,
    "sunAndPaletteOverrides": false
  }
};
