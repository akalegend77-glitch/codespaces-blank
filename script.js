const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");

const uploadBox = document.getElementById("uploadBox");

const previewContainer =
    document.getElementById("previewContainer");

const preview =
    document.getElementById("preview");

const controls =
    document.getElementById("controls");

const quality =
    document.getElementById("quality");

const qualityValue =
    document.getElementById("qualityValue");

const compressButton =
    document.getElementById("compressButton");

const result =
    document.getElementById("result");

const originalSize =
    document.getElementById("originalSize");

const compressedSize =
    document.getElementById("compressedSize");

const savedPercent =
    document.getElementById("savedPercent");

const status =
    document.getElementById("status");

const downloadButton =
    document.getElementById("downloadButton");

const resetButton =
    document.getElementById("resetButton");


let selectedFile = null;

let previewURL = null;

let downloadURL = null;


// ========================================
// FILE SELECTION
// ========================================

fileInput.addEventListener("change", function () {

    const file = fileInput.files[0];

    if (!file) {
        return;
    }

    handleFile(file);
});


// ========================================
// HANDLE FILE
// ========================================

function handleFile(file) {

    if (file.type !== "image/jpeg") {

        fileName.textContent =
            "Please select a JPG image.";

        return;
    }

    selectedFile = file;

    fileName.textContent =
        `${file.name} • ${formatSize(file.size)}`;


    // Clean previous preview URL

    if (previewURL) {

        URL.revokeObjectURL(previewURL);

        previewURL = null;
    }


    // Create preview

    previewURL =
        URL.createObjectURL(file);

    preview.src =
        previewURL;


    // Show controls

    previewContainer.style.display =
        "block";

    controls.style.display =
        "block";

    result.style.display =
        "none";


    // Reset quality

    quality.value = 70;

    qualityValue.textContent =
        "70%";
}


// ========================================
// DRAG & DROP
// ========================================

uploadBox.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        uploadBox.classList.add("drag-over");
    }
);


uploadBox.addEventListener(
    "dragleave",
    function () {

        uploadBox.classList.remove("drag-over");
    }
);


uploadBox.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        uploadBox.classList.remove("drag-over");

        const file =
            event.dataTransfer.files[0];

        if (file) {

            handleFile(file);
        }
    }
);


// ========================================
// QUALITY SLIDER
// ========================================

quality.addEventListener(
    "input",
    function () {

        qualityValue.textContent =
            quality.value + "%";
    }
);


// ========================================
// COMPRESS
// ========================================

compressButton.addEventListener(
    "click",
    function () {

        if (!selectedFile) {
            return;
        }


        compressButton.disabled =
            true;

        compressButton.textContent =
            "Compressing...";


        result.style.display =
            "block";

        status.textContent =
            "Processing your image...";


        compressImage(selectedFile);
    }
);


// ========================================
// IMAGE COMPRESSION
// ========================================

function compressImage(file) {

    const reader =
        new FileReader();


    reader.onload = function (event) {

        const image =
            new Image();


        image.onload = function () {

            const MAX_WIDTH = 2400;
            const MAX_HEIGHT = 2400;


            let width =
                image.width;

            let height =
                image.height;


            // Smart Resize

            if (
                width > MAX_WIDTH ||
                height > MAX_HEIGHT
            ) {

                const scale =
                    Math.min(
                        MAX_WIDTH / width,
                        MAX_HEIGHT / height
                    );


                width =
                    Math.round(width * scale);

                height =
                    Math.round(height * scale);
            }


            const canvas =
                document.createElement("canvas");

            canvas.width =
                width;

            canvas.height =
                height;


            const ctx =
                canvas.getContext("2d");


            ctx.drawImage(
                image,
                0,
                0,
                width,
                height
            );


            const selectedQuality =
                Number(quality.value) / 100;


            canvas.toBlob(

                function (blob) {

                    compressButton.disabled =
                        false;

                    compressButton.textContent =
                        "Compress Image";


                    if (!blob) {

                        status.textContent =
                            "Compression failed.";

                        return;
                    }


                    showResult(
                        file,
                        blob,
                        image.width,
                        image.height,
                        width,
                        height
                    );

                },

                "image/jpeg",

                selectedQuality
            );
        };


        image.src =
            event.target.result;
    };


    reader.readAsDataURL(file);
}


// ========================================
// SHOW RESULT
// ========================================

function showResult(
    file,
    blob,
    originalWidth,
    originalHeight,
    finalWidth,
    finalHeight
) {

    originalSize.textContent =
        formatSize(file.size);

    compressedSize.textContent =
        formatSize(blob.size);


    // Prevent larger output

    if (blob.size >= file.size) {

        savedPercent.textContent =
            "0%";


        status.textContent =
            "This image is already highly optimized. The original file is smaller.";


        createDownloadButton(file);

        return;
    }


    const saved =
        (
            (file.size - blob.size) /
            file.size
        ) * 100;


    savedPercent.textContent =
        saved.toFixed(1) + "%";


    if (
        originalWidth !== finalWidth ||
        originalHeight !== finalHeight
    ) {

        status.textContent =
            `Image resized from ${originalWidth}×${originalHeight} to ${finalWidth}×${finalHeight}.`;

    } else {

        status.textContent =
            "Your image has been compressed successfully.";
    }


    createDownloadButton(blob);
}


// ========================================
// DOWNLOAD
// ========================================

function createDownloadButton(blob) {

    if (downloadURL) {

        URL.revokeObjectURL(downloadURL);

        downloadURL = null;
    }


    downloadURL =
        URL.createObjectURL(blob);


    downloadButton.href =
        downloadURL;

    downloadButton.download =
        "compressed-" + selectedFile.name;


    downloadButton.style.display =
        "inline-block";

    resetButton.style.display =
        "block";
}


// ========================================
// RESET
// ========================================

resetButton.addEventListener(
    "click",
    function () {

        selectedFile = null;


        fileInput.value = "";


        previewContainer.style.display =
            "none";

        controls.style.display =
            "none";

        result.style.display =
            "none";


        fileName.textContent =
            "";

        status.textContent =
            "";


        downloadButton.style.display =
            "none";

        resetButton.style.display =
            "none";


        quality.value = 70;

        qualityValue.textContent =
            "70%";


        if (previewURL) {

            URL.revokeObjectURL(previewURL);

            previewURL = null;
        }


        if (downloadURL) {

            URL.revokeObjectURL(downloadURL);

            downloadURL = null;
        }


        preview.src = "";
    }
);


// ========================================
// FILE SIZE FORMATTER
// ========================================

function formatSize(bytes) {

    if (bytes < 1024) {

        return bytes + " B";
    }


    if (bytes < 1024 * 1024) {

        return (
            bytes / 1024
        ).toFixed(1) + " KB";
    }


    return (
        bytes / (1024 * 1024)
    ).toFixed(2) + " MB";
}