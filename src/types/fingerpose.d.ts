declare module "fingerpose" {
  export const Gestures: any;
  export class Finger {
    static Thumb: any;
    static Index: any;
    static Middle: any;
    static Ring: any;
    static Pinky: any;
  }
  export class FingerCurl {
    static NoCurl: any;
    static HalfCurl: any;
    static FullCurl: any;
  }
  export class FingerDirection {
    static VerticalUp: any;
    static VerticalDown: any;
    static HorizontalLeft: any;
    static HorizontalRight: any;
    static DiagonalUpLeft: any;
    static DiagonalUpRight: any;
    static DiagonalDownLeft: any;
    static DiagonalDownRight: any;
  }

  export class GestureDescription {
    constructor(name: string);
    addCurl(finger: any, curl: any, weight: number): void;
    addDirection(finger: any, direction: any, weight: number): void;
  }

  export class GestureEstimator {
    constructor(gestures: GestureDescription[]);
    estimate(
      landmarks: any[],
      minConfidence: number
    ): {
      gesture: string;
      confidence: number;
    }[];
  }
}
