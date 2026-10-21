// 清涧园规划数据；不含构建、渲染、材质实例或随机执行逻辑。
export const cameraSchedule = {
  "version": "1.0",
  "durationSeconds": 30,
  "fpsReference": 30,
  "coordinateSource": "layout.js.cameraAnchors",
  "worldCoordinatesInThisFile": false,
  "timing": {
    "shotSeconds": 6,
    "crossfadeSeconds": 0.5,
    "boundaryCentersSeconds": [
      6,
      12,
      18,
      24
    ],
    "blendWindowsSeconds": [
      [
        5.75,
        6.25
      ],
      [
        11.75,
        12.25
      ],
      [
        17.75,
        18.25
      ],
      [
        23.75,
        24.25
      ]
    ],
    "method": "两台相机独立取景，线性光空间互补权重smoothstep交叉溶解；不是插值穿墙；片头片尾无额外时长",
    "sampleRule": "镜头局部时间钳制到[0,6]；交叠区前/后镜头用其末/首端点延拓，成片仍严格30秒"
  },
  "motionLaw": {
    "holdSeconds": [
      0,
      1.2
    ],
    "accelerateSeconds": [
      1.2,
      3
    ],
    "decelerateSeconds": [
      3,
      5.5
    ],
    "finalHoldSeconds": [
      5.5,
      6
    ],
    "normalizedDistanceKeys": [
      {
        "t": 0,
        "s": 0,
        "v": 0
      },
      {
        "t": 1.2,
        "s": 0,
        "v": 0
      },
      {
        "t": 3,
        "s": 0.4186046512,
        "v": 0.4651162791
      },
      {
        "t": 5.5,
        "s": 1,
        "v": 0
      },
      {
        "t": 6,
        "s": 1,
        "v": 0
      }
    ],
    "integration": "1.2—3秒恒加速度，3—5.5秒恒减速度；按端点距离归一化；位置、观察目标和视场角共用s；速度连续",
    "path": "默认世界空间直线；第五镜头经中间锚点形成平滑抬升曲线；不得重写锚点"
  },
  "shots": [
    {
      "id": 1,
      "startSeconds": 0,
      "endSeconds": 6,
      "title": "漏窗花格光斑特写 → 整面花墙与外侧曲廊",
      "startAnchor": "s1Detail",
      "endAnchor": "s1Wide",
      "viaAnchor": null,
      "detailIntent": "真实透射棂条框影，近摄受影墙肌理",
      "wideIntent": "东侧花墙、受影短墙、折廊",
      "pathType": "直线插值",
      "motion": "继承motionLaw",
      "transition": "继承timing交叉溶解"
    },
    {
      "id": 2,
      "startSeconds": 6,
      "endSeconds": 12,
      "title": "池边睡莲花苞特写 → 水池、黄石假山、映水阁",
      "startAnchor": "s2Detail",
      "endAnchor": "s2Wide",
      "viaAnchor": null,
      "detailIntent": "花苞露水以程序几何表达",
      "wideIntent": "池北黄石与东北映水阁同时入画",
      "pathType": "直线插值",
      "motion": "继承motionLaw",
      "transition": "继承timing交叉溶解"
    },
    {
      "id": 3,
      "startSeconds": 12,
      "endSeconds": 18,
      "title": "叠云石孔洞流光特写 → 石组与观石轩庭院",
      "startAnchor": "s3Detail",
      "endAnchor": "s3Wide",
      "viaAnchor": null,
      "detailIntent": "孔后景物可见、湿壁受程序化反射光缓动",
      "wideIntent": "三峰石组、庭院留白、观石轩",
      "pathType": "直线插值",
      "motion": "继承motionLaw",
      "transition": "继承timing交叉溶解"
    },
    {
      "id": 4,
      "startSeconds": 18,
      "endSeconds": 24,
      "title": "廊壁石刻铭文特写 → 连绵碑廊与粉墙",
      "startAnchor": "s4Detail",
      "endAnchor": "s4Wide",
      "viaAnchor": null,
      "detailIntent": "笔画凸起具有侧光阴影",
      "wideIntent": "沿东廊纵深展开，不穿墙",
      "pathType": "直线插值",
      "motion": "继承motionLaw",
      "transition": "继承timing交叉溶解"
    },
    {
      "id": 5,
      "startSeconds": 24,
      "endSeconds": 30,
      "title": "月洞门框景逆光特写 → 抬升拉远高空定格",
      "startAnchor": "s5Detail",
      "endAnchor": "s5Aerial",
      "viaAnchor": "s5Lift",
      "detailIntent": "门框近景框住池水与黄石；东南侧逆光",
      "wideIntent": "完整庭院格局、屋面、水池和连廊",
      "pathType": "二次Bezier，via为控制点，按弧长参数s重采样",
      "motion": "继承motionLaw",
      "transition": "继承timing交叉溶解"
    }
  ],
  "acceptance": [
    "每镜头6秒，总时长30秒",
    "无手持抖动、无突然切换、无匀速一拉到底",
    "视点不得穿墙、屋顶或石体；冲突提交总设计师修改layout.js",
    "片尾5.5—6秒高空全景静止；全部建筑、石组与院墙在画幅内"
  ]
};
