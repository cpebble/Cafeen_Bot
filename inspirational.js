const { createCanvas, loadImage } = require('canvas')
const fs = require("fs")
// const canvas = createCanvas(200, 200)
// const ctx = canvas.getContext('2d')

// // Write "Awesome!"
// ctx.font = '30px Fura Code'
// ctx.rotate(0.1)
// ctx.fillText('Awesome!', 50, 100)

// // Draw line under text
// var text = ctx.measureText('Awesome!')
// ctx.strokeStyle = 'rgba(0,0,0,0.5)'
// ctx.beginPath()
// ctx.lineTo(50, 102)
// ctx.lineTo(50 + text.width, 102)
// ctx.stroke()

// // Draw cat with lime helmet
// loadImage('quote_images/space.jpg').then((image) => {
//   ctx.drawImage(image, 50, 0, 70, 70)

//   console.log(canvas.toDataURL())
// })

let textX = 200;
let textY = 500;

function genQuote(quoteTxt) {
    let img = "quote_images/space.jpg";
    let quote = quoteTxt;

    let canvas = createCanvas(1920, 1080);
    let ctx = canvas.getContext('2d');

    loadImage(img).then((image) => {
        ctx.drawImage(image, 0, 0, 1920, 1080);
        ctx.font = "48px Fura Code";
        ctx.fillStyle = "#FFF";

        ctx.fillText(quoteTxt, textX, textY, 1920-textX);

        const out = fs.createWriteStream(__dirname+'/test.jpg')
        const stream = canvas.createJPEGStream()
        stream.pipe(out)
        out.on('finish', () => console.log("File created"));
    })
}
genQuote("Du skal ikke grine, så kan jeg ikke brække mig!");