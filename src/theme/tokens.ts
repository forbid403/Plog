// GENERATED FILE — do not edit by hand.
// Source: design-tokens/tokens.json
// Regenerate: python3 design-tokens/build-theme.py

export const colors = {
  "greyScale": {
    "50": "#f7f8f7",
    "100": "#eef0ef",
    "200": "#dee1e0",
    "300": "#cfd3d1",
    "400": "#c1c5c3",
    "500": "#b1b5b3",
    "600": "#8d908e",
    "700": "#696b69",
    "800": "#444645",
    "900": "#262727",
    "950": "#151613"
  },
  "pink": {
    "50": "#fff0f5",
    "100": "#ffe0eb",
    "200": "#ffbcd6",
    "300": "#ff97c4",
    "400": "#ff6fb4",
    "500": "#ff2fa3",
    "600": "#e20084",
    "700": "#aa0063",
    "800": "#750042",
    "900": "#490027",
    "950": "#310019"
  },
  "purple": {
    "50": "#f7f2ff",
    "100": "#ebe5ff",
    "200": "#dbcfff",
    "300": "#c9b3ff",
    "400": "#b898ff",
    "500": "#ab7eff",
    "600": "#9448ff",
    "700": "#7c00f0",
    "800": "#5600ac",
    "900": "#300064",
    "950": "#200046"
  },
  "blue": {
    "50": "#f6fdfe",
    "100": "#e1fcff",
    "200": "#c1f7fc",
    "300": "#99f3fc",
    "400": "#76f1f9",
    "500": "#32ebf4",
    "600": "#2db9c1",
    "700": "#1b868b",
    "800": "#0e585c",
    "900": "#042f33",
    "950": "#011d1e"
  },
  "green": {
    "50": "#effeda",
    "100": "#dbffa7",
    "200": "#befe00",
    "300": "#b3f200",
    "400": "#aee900",
    "500": "#a4dd00",
    "600": "#81ad00",
    "700": "#5d7e00",
    "800": "#3d5600",
    "900": "#1e2b00",
    "950": "#101a00"
  },
  "yellow": {
    "50": "#fff8ee",
    "100": "#fff6e4",
    "200": "#ffebc7",
    "300": "#ffe1a6",
    "400": "#ffd362",
    "500": "#ffc900",
    "600": "#d19c00",
    "700": "#9c7400",
    "800": "#684c00",
    "900": "#392700",
    "950": "#221500"
  },
  "orange": {
    "50": "#fff5f3",
    "100": "#ffe9e3",
    "200": "#ffcec1",
    "300": "#ffb7a1",
    "400": "#ff9973",
    "500": "#ff7d30",
    "600": "#db5b00",
    "700": "#a74500",
    "800": "#712c00",
    "900": "#451600",
    "950": "#2c0b00"
  },
  "red": {
    "50": "#fdeded",
    "100": "#fcdbdb",
    "200": "#f9b1b1",
    "300": "#f78989",
    "400": "#f55757",
    "500": "#e02626",
    "600": "#b41c1c",
    "700": "#891313",
    "800": "#600a0a",
    "900": "#3e0404",
    "950": "#2b0202"
  },
  "opacity": {
    "black8": "#00000014",
    "black12": "#0000001f",
    "black50": "#00000080",
    "grey8": "#6e6e6e14",
    "grey12": "#6e6e6e1f",
    "grey50": "#6e6e6e80",
    "white8": "#ffffff14",
    "white12": "#ffffff1f",
    "white50": "#ffffff80"
  },
  "base": {
    "white": "#ffffff",
    "black": "#000000"
  },
  "brand": {
    "primary": {
      "50": "#eaffed",
      "100": "#d4fdd8",
      "200": "#9dfca8",
      "300": "#54fc78",
      "400": "#24f15b",
      "500": "#15e654",
      "600": "#14b440",
      "700": "#0b862d",
      "800": "#06571b",
      "900": "#012f0a",
      "950": "#001e04"
    },
    "secondary": {
      "50": "#fffcf1",
      "100": "#fff7d2",
      "200": "#ffef97",
      "300": "#ffe600",
      "400": "#fce000",
      "500": "#f3d700",
      "600": "#bda900",
      "700": "#8a7a00",
      "800": "#5b5100",
      "900": "#302a00",
      "950": "#1c1a00"
    }
  }
} as const;

export const spacing = {
  "3xs": 2,
  "2xs": 4,
  "xs": 6,
  "s": 8,
  "m": 12,
  "l": 16,
  "xl": 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "full": 999
} as const;

export const shadows = {
  "strong": [
    {
      "x": 0,
      "y": 0,
      "blur": 4,
      "spread": 0,
      "color": "#00000014"
    },
    {
      "x": 0,
      "y": 4,
      "blur": 8,
      "spread": 0,
      "color": "#00000014"
    },
    {
      "x": 0,
      "y": 6,
      "blur": 12,
      "spread": 0,
      "color": "#0000001f"
    }
  ],
  "emphasize": [
    {
      "x": 0,
      "y": 1,
      "blur": 4,
      "spread": 0,
      "color": "#0000001f"
    },
    {
      "x": 0,
      "y": 0,
      "blur": 1,
      "spread": 0,
      "color": "#00000014"
    },
    {
      "x": 0,
      "y": 1,
      "blur": 8,
      "spread": 0,
      "color": "#0000001f"
    }
  ],
  "normal": [
    {
      "x": 0,
      "y": 0,
      "blur": 1,
      "spread": 0,
      "color": "#00000014"
    },
    {
      "x": 0,
      "y": 1,
      "blur": 2,
      "spread": 0,
      "color": "#0000001f"
    },
    {
      "x": 0,
      "y": 0,
      "blur": 1,
      "spread": 0,
      "color": "#00000014"
    }
  ]
} as const;

export const typography = {
  "headline": {
    "fontFamily": "SF Pro",
    "fontWeight": "600",
    "fontSize": 17,
    "letterSpacing": 0,
    "textTransform": "none",
    "textDecorationLine": "none"
  },
  "caption": {
    "fontFamily": "SF Pro",
    "fontWeight": "400",
    "fontSize": 13,
    "letterSpacing": 0,
    "textTransform": "none",
    "textDecorationLine": "none"
  },
  "titles": {
    "display": {
      "fontFamily": "SF Pro",
      "fontWeight": "700",
      "fontSize": 34,
      "letterSpacing": 0,
      "textTransform": "none",
      "textDecorationLine": "none",
      "lineHeight": 40.8
    },
    "large": {
      "fontFamily": "SF Pro",
      "fontWeight": "600",
      "fontSize": 28,
      "letterSpacing": 0,
      "textTransform": "none",
      "textDecorationLine": "none",
      "lineHeight": 33.6
    },
    "medium": {
      "fontFamily": "SF Pro",
      "fontWeight": "600",
      "fontSize": 22,
      "letterSpacing": 0,
      "textTransform": "none",
      "textDecorationLine": "none",
      "lineHeight": 26.4
    }
  },
  "body": {
    "base": {
      "fontFamily": "SF Pro",
      "fontWeight": "400",
      "fontSize": 17,
      "letterSpacing": 0,
      "textTransform": "none",
      "textDecorationLine": "none"
    },
    "baseBold": {
      "fontFamily": "SF Pro",
      "fontWeight": "600",
      "fontSize": 17,
      "letterSpacing": 0,
      "textTransform": "none",
      "textDecorationLine": "none"
    },
    "small": {
      "fontFamily": "SF Pro",
      "fontWeight": "400",
      "fontSize": 15,
      "letterSpacing": 0,
      "textTransform": "none",
      "textDecorationLine": "none"
    },
    "smallBold": {
      "fontFamily": "SF Pro",
      "fontWeight": "600",
      "fontSize": 15,
      "letterSpacing": 0,
      "textTransform": "none",
      "textDecorationLine": "none"
    },
    "extraSmall": {
      "fontFamily": "SF Pro",
      "fontWeight": "400",
      "fontSize": 13,
      "letterSpacing": 0,
      "textTransform": "none",
      "textDecorationLine": "none"
    },
    "extraSmallBold": {
      "fontFamily": "SF Pro",
      "fontWeight": "600",
      "fontSize": 13,
      "letterSpacing": 0,
      "textTransform": "none",
      "textDecorationLine": "none"
    }
  },
  "label": {
    "default": {
      "fontFamily": "SF Pro",
      "fontWeight": "500",
      "fontSize": 15,
      "letterSpacing": 0,
      "textTransform": "none",
      "textDecorationLine": "none"
    },
    "large": {
      "fontFamily": "SF Pro",
      "fontWeight": "600",
      "fontSize": 17,
      "letterSpacing": 0,
      "textTransform": "none",
      "textDecorationLine": "none"
    }
  }
} as const;
