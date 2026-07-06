// Source - https://stackoverflow.com/a/69216413
// Posted by Danny Lin, modified by community. See post 'Timeline' for change history
// Retrieved 2026-07-05, License - CC BY-SA 4.0
var jchanzi = {
  conf: {
    autoProcess: true, // truthy to auto-process document body after the document is loaded
    imageAutoResize: true, // auto-resize the generated image with CSS to be same size as the original text
    imageSize: 40, // size of the (non-dynamically) generated image, in pixels, or negative for auto-detection
    imageSizeMin: 40, // minimum size of the generated image, in pixels
    imageSizeMax: 120, // maximum size of the generated image, in pixels
    fontColor: "auto", // color of the strokes of the generated image, in hex RRGGBBAA, or "auto" for auto-detection
    fontName: "", // font name of the generated image, "m" for Ming, "k" for Kai, "s" for Sung, or falsy for auto-determination (by other parameters)
    bgColor: "transparent", // background color of the generated image
    linkInfo: true, // add info link for the generated image if it's known in the database
    convertIds: true, // truthy to convert IDS
    convertIdsDynamic: 1, // whether to generate dynamic image from IDS: 0: never, 1: if unknown in the database, 2: always
    convertIdsDynamicAdvanced: 2, // generate dynamic image from which IDS: 0: never for surrounding and overlaying IDS, 1: never for overlaying IDS, 2: always
    convertIdsDynamicSize: -1, // size of the dynamically generate image, in pixels, or negative for auto-detection
    convertUnicode: 3, // generate image for what unicode chars: 1: ExtB+, 2: plus ExtA, 3: plus Kanxi radical and CJK stroke chars
    convertUnicodeDisplayable: false // convert chars matching convertUnicode even if it can be displayed in the browser
  }
};