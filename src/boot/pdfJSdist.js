import workerSrc from '!!file-loader!pdfjs-dist/build/pdf.worker.min.js'
const pdfjsLib = require(/* webpackChunkName: "pdfjs-dist" */ `pdfjs-dist`)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc