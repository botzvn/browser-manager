export const UA_PROFILES = [
  {
    os: "mac",
    user_agent: (v, _fv) => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`,
    platform: "macOS",
    navigator_platform: "MacIntel",
    platform_version: "15.2.0",
    webgl_configs: [
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (Intel)",
        unmaskedRenderer: "ANGLE (Intel, Intel(R) Iris Plus Graphics, OpenGL 4.1)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (Intel)",
        unmaskedRenderer: "ANGLE (Intel, Intel(R) UHD Graphics 630, OpenGL 4.1)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (ATI Technologies Inc.)",
        unmaskedRenderer: "ANGLE (ATI Technologies Inc., AMD Radeon Pro 5500M OpenGL Engine, OpenGL 4.1)",
      },
    ],
    webgl2_config: {
      MAX_VERTEX_UNIFORM_BLOCKS: [12, 14],
      MAX_FRAGMENT_UNIFORM_BLOCKS: [12, 14],
      MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: [212992, 262144],
      MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: [212992, 262144],
    },
  },
  {
    os: "mac_apple_silicon",
    user_agent: (v, _fv) => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`,
    platform: "macOS",
    navigator_platform: "MacIntel",
    platform_version: "15.2.0",
    webgl_configs: [
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (Apple)",
        unmaskedRenderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (Apple)",
        unmaskedRenderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (Apple)",
        unmaskedRenderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M3, Unspecified Version)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (Apple)",
        unmaskedRenderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M4, Unspecified Version)",
      },
    ],
    webgl2_config: {
      MAX_VERTEX_UNIFORM_BLOCKS: [14, 16],
      MAX_FRAGMENT_UNIFORM_BLOCKS: [14, 16],
      MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: [458752, 524288],
      MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: [458752, 524288],
    },
  },
  {
    os: "windows",
    user_agent: (v, fv) => `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`,
    platform: "Windows",
    navigator_platform: "Win32",
    platform_version: "10.0.0",
    webgl_configs: [
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (NVIDIA)",
        unmaskedRenderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (NVIDIA)",
        unmaskedRenderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (AMD)",
        unmaskedRenderer: "ANGLE (AMD, AMD Radeon RX 7900 XT Direct3D11 vs_5_0 ps_5_0, D3D11)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (NVIDIA)",
        unmaskedRenderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (NVIDIA)",
        unmaskedRenderer: "ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (Intel)",
        unmaskedRenderer: "ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (AMD)",
        unmaskedRenderer: "ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)",
      },
    ],
    webgl2_config: {
      MAX_VERTEX_UNIFORM_BLOCKS: [14, 16],
      MAX_FRAGMENT_UNIFORM_BLOCKS: [14, 16],
      MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: [212992, 917504],
      MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: [212992, 917504],
    },
  },
  {
    os: "linux",
    user_agent: (v, _fv) => `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`,
    platform: "Linux",
    navigator_platform: "Linux x86_64",
    platform_version: "",
    webgl_configs: [
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (NVIDIA)",
        unmaskedRenderer: "ANGLE (NVIDIA, Vulkan 1.3.0 (NVIDIA GeForce RTX 3060), GLSL 4.60)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (AMD)",
        unmaskedRenderer: "ANGLE (AMD, Vulkan 1.3.255 (AMD RADV NAVI22), GLSL 4.60)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (Intel)",
        unmaskedRenderer: "ANGLE (Intel, Vulkan 1.3.255 (Intel(R) UHD Graphics 620 (KBL GT2)), GLSL 4.60)",
      },
      {
        vendor: "WebKit",
        renderer: "WebKit WebGL",
        unmaskedVendor: "Google Inc. (SwiftShader)",
        unmaskedRenderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), GLSL 4.60)",
      },
    ],
    webgl2_config: {
      MAX_VERTEX_UNIFORM_BLOCKS: [12, 14, 16],
      MAX_FRAGMENT_UNIFORM_BLOCKS: [12, 14, 16],
      MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: [212992, 917504],
      MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: [212992, 917504],
    },
  },
];

export const CHROME_VERSIONS = [
  ["140", "140.0.7239.90"],
  ["141", "141.0.7322.52"],
  ["142", "142.0.7393.86"],
  ["143", "143.0.7336.84"],
  ["144", "144.0.7512.54"],
  ["145", "145.0.7632.119"],
  ["146", "146.0.7680.154"],
  ["149", "149.0.7827.53"],
];

export const MAC_M1_CORES = [8];
export const MAC_M1_MEM = [8, 16];
export const MAC_M2_CORES = [8];
export const MAC_M2_MEM = [8, 16];
export const MAC_M3_CORES = [8];
export const MAC_M3_MEM = [8, 16];
export const WIN_CORES = [4, 6, 8, 10, 12, 16, 20, 24];
export const WIN_MEM = [4, 8, 16, 32, 64];
