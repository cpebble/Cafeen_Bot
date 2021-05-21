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

const textX = 200;
const textY = 400;
const imgWidth = 1920;
const imgHeight = 1080;
const maxTextWidth = imgWidth - (2 * textX);
const textSize = 60 // In pixels

// Stolened: https://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element
function getLines(ctx, text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}


async function genQuote(quoteTxt, quoteAuthor) {
    // Replace with more beautiful stuff
    let img = "quote_images/space.jpg";

    // Create canvas and context
    let canvas = createCanvas(1920, 1080);
    let ctx = canvas.getContext('2d');

    // Load image into buffer
    let image = await loadImage(img)
    ctx.drawImage(image, 0, 0, imgWidth, imgHeight);

    // Font styling
    ctx.font = `${textSize}px cursive`;
    ctx.fillStyle = "#FFF";

    // Split long quotes up into width
    let lines = getLines(ctx, quoteTxt, maxTextWidth);
    let newText = lines.join("\n");
    ctx.fillText(newText, textX, textY, 1920-textX);

    // Now draw the author
    ctx.font = `${textSize - 12}px sans-serif`;
    ctx.fillStyle = "#FFFFFFAA";
    let authorY = (lines.length+1) * textSize + textY;
    ctx.fillText(`- ${quoteAuthor}`, textX + 150, authorY);

    return canvas;
}
// Test code
// genQuote("Du skal ikke grine, så kan jeg ikke brække mig! Du skal ikke grine, så kan jeg ikke brække mig! Du skal ikke grine!", "Thea").then((canvas) => {
//     const out = fs.createWriteStream(__dirname + '/test.jpg')
//     const stream = canvas.createJPEGStream()
//     stream.pipe(out)
//     out.on('finish', () => console.log("File created"));
// });

module.exports = {
    "genQuote": genQuote
}