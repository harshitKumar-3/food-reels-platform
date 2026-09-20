// const ImageKit = require("imagekit");

// const imagekit = new ImageKit({
//     publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
//     privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
//     urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
// })

// async function uploadFile(file, fileName){
//     const result = await imagekit.upload({
//         file: file,
//         fileName: fileName,
//     })

//     return result;
// }

// module.exports = {
//     uploadFile
// }

const ImageKit = require("@imagekit/nodejs");
const { toFile } = require("@imagekit/nodejs");

const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

async function uploadFile(file, fileName) {
    console.log("Starting ImageKit upload...");

    const result = await imagekit.files.upload({
        file: await toFile(file, fileName),
        fileName: fileName
    });

    console.log("ImageKit upload completed");

    return result;
}

module.exports = {
    uploadFile
};